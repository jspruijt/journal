<template>
  <div class="home">
    <h1>Weekoverzicht</h1>
    <WeekNavigation :currentWeekStart="currentWeekStart" :previousWeek="previousWeek" :nextWeek="nextWeek"
      :selectedDay="selectedDay" :selectDay="selectDay" />
    <div class="week" :class="{ 'single-day': selectedDay }">
      <DayColumn v-for="(day, index) in displayedDays" :key="day.date" :day="day" :hourLines="hourLines"
        :hourLinesRef="el => (hourLinesRef[index] = el)" :tasksForDay="tasksForDay" :getTaskPosition="getTaskPosition"
        :getTaskSchedule="getTaskSchedule" :getTaskTimeKey="getTaskTimeKey" :showTooltip="showTooltip"
        :formatShortDate="formatShortDate" :hasDiaryEntry="hasDiaryEntry" :isSingleDay="!!selectedDay"
        @openDiary="openDiary" @toggleCompletion="toggleTaskCompletion" @deleteInstance="deleteTaskInstance"
        @editTask="editTask" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useTaskStore } from "../stores/tasks";
import { useRouter } from "vue-router";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import WeekNavigation from "../components/WeekNavigation.vue";
import DayColumn from "../components/DayColumn.vue";

const taskStore = useTaskStore();
const router = useRouter();

/* --------------------------------------------------------------
   Basis‑data
   -------------------------------------------------------------- */
const today = new Date().toISOString().split("T")[0];
const currentWeekStart = ref(today);
const selectedDay = ref(today);
const diaryEntries = ref([]);
const hourPositions = ref({});
const taskCache = ref(new Map());
const hourLinesRef = [];

/* --------------------------------------------------------------
   Computed: dagen, uren, etc.
   -------------------------------------------------------------- */
const weekDays = computed(() => {
  const days = [];
  const start = new Date(currentWeekStart.value);
  if (isNaN(start.getTime())) start.setTime(new Date(today).getTime());
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push({
      date: day.toISOString().split("T")[0],
      dayOfWeek: day.getDay(),
    });
  }
  return days;
});

const displayedDays = computed(() => {
  if (selectedDay.value) {
    const filtered = weekDays.value.filter(d => d && d.date === selectedDay.value);
    return filtered.length > 0
      ? filtered
      : [{ date: selectedDay.value, dayOfWeek: new Date(selectedDay.value).getDay() }];
  }
  return weekDays.value.filter(d => d && d.date);
});

const hourLines = computed(() => {
  const hours = [];
  for (let h = 0; h <= 23; h++) hours.push(h.toString().padStart(2, "0"));
  return hours;
});

const isSingleDayMode = computed(() => !!selectedDay.value);

/* --------------------------------------------------------------
   Logische uurposities (32px per uur)
   -------------------------------------------------------------- */
const updateHourPositions = () => {
  const baseHeight = 32;
  displayedDays.value.forEach((_, index) => {
    hourPositions.value[index] = {};
    for (let h = 0; h <= 23; h++) {
      const hourStr = h.toString().padStart(2, "0");
      hourPositions.value[index][hourStr] = h * baseHeight;
    }
  });
};

/* --------------------------------------------------------------
   Lifecycle
   -------------------------------------------------------------- */
onMounted(async () => {
  await taskStore.loadTasks();

  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  currentWeekStart.value = monday.toISOString().split("T")[0];

  updateHourPositions();

  try {
    let user = auth.currentUser;
    if (!user) {
      await new Promise(resolve => {
        const unsub = auth.onAuthStateChanged(u => {
          user = u;
          unsub();
          resolve();
        });
      });
    }
    if (user) {
      const q = query(collection(db, "diaryEntries"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      diaryEntries.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  } catch (e) {
    console.error("Diary load error:", e);
  }
});

watch([currentWeekStart, selectedDay], () => {
  taskCache.value.clear();
  updateHourPositions();
}, { immediate: true });

/* --------------------------------------------------------------
   Helpers
   -------------------------------------------------------------- */
const tasksForDay = computed(() => date => {
  if (!taskCache.value.has(date)) {
    const tasks = taskStore.tasks
      .map((t, i) => ({ ...t, originalIndex: i }))
      .filter(t => {
        if (t.type === "one-time" && t.dates?.includes(date)) return true;
        if (t.type === "recurring" && t.scheduledDates?.some(d => d.date === date)) return true;
        return false;
      });
    taskCache.value.set(date, tasks);
  }
  return taskCache.value.get(date) || [];
});

const hasDiaryEntry = date => diaryEntries.value.some(e => e.date === date && e.content?.trim());

const formatShortDate = date => {
  const d = new Date(date);
  const day = d.getDate();
  const weekday = new Intl.DateTimeFormat("nl-NL", { weekday: "short" })
    .format(d)
    .slice(0, 2)
    .toLowerCase();
  return `${day} (${weekday})`;
};

const previousWeek = () => {
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() - 7);
  currentWeekStart.value = d.toISOString().split("T")[0];
  selectedDay.value = null;
};

const nextWeek = () => {
  const d = new Date(currentWeekStart.value);
  d.setDate(d.getDate() + 7);
  currentWeekStart.value = d.toISOString().split("T")[0];
  selectedDay.value = null;
};

const selectDay = date => {
  selectedDay.value = selectedDay.value === date ? null : date;
};

const showTooltip = (e, text) => {
  const el = e.target;
  el.title = el.scrollWidth > el.clientWidth ? text : "";
};

const getTaskSchedule = (task, date) => {
  return task.scheduledDates?.find(d => d.date === date) ||
    task.timesByDate?.[date] ||
    null;
};

const getTaskTimeKey = (task, date) => {
  const s = getTaskSchedule(task, date);
  return s ? `${s.startTime}-${s.endTime}` : "00:00-00:00";
};

/* --------------------------------------------------------------
   Taak‑positie: EXACTE duur (geen minimum)
   -------------------------------------------------------------- */
const getTaskPosition = (task, date) => {
  const schedule = getTaskSchedule(task, date);
  const baseHeight = 32;
  const displayHeight = isSingleDayMode.value ? 48 : 32;
  const scale = displayHeight / baseHeight;

  if (!schedule?.startTime || !schedule?.endTime) {
    return { top: "0px", height: `${displayHeight}px`, background: "rgba(255,0,0,0.2)" };
  }

  const dayIdx = displayedDays.value.findIndex(d => d && d.date === date);
  const positions = hourPositions.value[dayIdx];

  if (!positions) {
    return { top: "0px", height: `${displayHeight}px` };
  }

  const [sh, sm] = schedule.startTime.split(":").map(Number);
  const [eh, em] = schedule.endTime.split(":").map(Number);

  const logicalTop = positions[sh.toString().padStart(2, "0")] + (sm / 60) * baseHeight;
  const durationMin = (eh * 60 + em) - (sh * 60 + sm);
  const logicalHeight = (durationMin / 60) * baseHeight;

  const visualTop = logicalTop * scale;
  const visualHeight = logicalHeight * scale;

  return {
    top: `${visualTop}px`,
    height: `${visualHeight}px`,
    background: "rgba(0,255,0,0.2)",
  };
};

/* --------------------------------------------------------------
   Navigatie
   -------------------------------------------------------------- */
const openDiary = date => router.push(`/diary/${date}`);
const editTask = id => router.push(`/edit-task/${id}`);

/* --------------------------------------------------------------
   Taak‑acties
   -------------------------------------------------------------- */
const toggleTaskCompletion = async (task, date) => {
  await taskStore.toggleTaskInstanceCompletion(task.id, date);
  taskCache.value.clear();
};

const deleteTaskInstance = async (task, date) => {
  await taskStore.deleteTaskInstance(task.id, date);
  taskCache.value.clear();
};
</script>

<style scoped>
@media (max-width: 700px) {
  .home {
    padding: 0em 0.2em 0em 0.2em;
  }
}

@media (min-width: 701px) {
  .home {
    padding: 2.5em 1.5em 2em 1.5em;
  }
}

.home {
  max-width: 1100px;
  margin: 0 auto;
  font-size: 16px;
  min-height: 100vh;
  box-sizing: border-box;
}

.week {
  display: flex;
  flex-direction: column;
  gap: 2.2em;
  width: 100%;
}

.week.single-day {
  justify-content: center;
}

.week .day-column {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  box-sizing: border-box;
}

h1 {
  color: var(--color-primary);
  text-align: center;
  font-size: 1.1em;
  margin-bottom: 1.2em;
  font-family: "Montserrat", "Segoe UI", Arial, sans-serif;
  font-weight: 700;
  text-transform: uppercase;
}
</style>