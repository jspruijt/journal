<template>
  <div class="home" v-if="!isLoading">
    <h1>Weekoverzicht</h1>
    <div class="week-navigation">
      <button @click="previousWeek">Vorige week</button>
      <span>{{ formatWeekRange(currentWeekStart) }}</span>
      <button @click="nextWeek">Volgende week</button>
    </div>
    <div class="week">
      <div v-for="day in weekDays.value" :key="day.date" class="day">
        <div class="day-header">
          <h3>{{ formatShortDate(day.date) }}</h3>
          <div class="day-actions">
            <button
              class="icon-button"
              :class="{ 'has-diary': hasDiaryEntry(day.date) }"
              @click="$router.push(`/diary/${day.date}`)"
              aria-label="Dagboek voor deze dag"
            >
              📓
            </button>
          </div>
        </div>
        <div
          class="hour-lines"
          :key="day.date"
          ref="hourLinesRef"
          @dragover.prevent="onDragOver($event, day.date)"
          @drop="onDrop($event, day.date)"
        >
          <div v-for="hour in hourLines.value" :key="hour" class="hour-line" :data-hour="hour">
            {{ hour }}:00
          </div>
          <Task
            v-for="task in tasksForDay(day.date)"
            :key="`${task.id}-${day.date}-${getTaskTimeKey(task, day.date)}`"
            :task="task"
            :date="day.date"
            :hour-positions="hourPositions[weekDays.value.findIndex(d => d.date === day.date)] || {}"
            @edit="handleEditTask"
            @delete="handleDeleteTask"
          />
        </div>
      </div>
    </div>
  </div>
  <div v-else class="loading">Laden...</div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useTaskStore } from "../stores/tasks";
import { useRouter } from "vue-router";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Task from "../components/Task.vue";
import { onAuthStateChanged } from "firebase/auth";

const taskStore = useTaskStore();
const router = useRouter();
const currentWeekStart = ref(new Date().toISOString().split("T")[0]);
const hourLinesRef = ref([]);
const hourPositions = ref({});
const diaryEntries = ref([]);
const taskCache = ref(new Map());
const draggedTask = ref(null);
const draggedDate = ref(null);
const draggedTaskElement = ref(null);
const initialDragOffsetY = ref(0);
const dragEdge = ref(null);
const originalHeight = ref(0);
const isLoading = ref(true);

onMounted(async () => {
  console.log("onMounted gestart");
  try {
    await loadAuthenticatedData();
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    currentWeekStart.value = monday.toISOString().split("T")[0];
    console.log("currentWeekStart ingesteld:", currentWeekStart.value);
    await nextTick();
    try {
      const diarySnapshot = await getDocs(collection(db, "diaryEntries"));
      diaryEntries.value = diarySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Dagboekvermeldingen geladen:", diaryEntries.value.length);
    } catch (e) {
      console.error("Fout bij het laden van dagboekvermeldingen:", e);
      diaryEntries.value = [];
    }
    isLoading.value = false;
    await nextTick(); // Forceer UI-update
    if (weekDays.value.length > 0) {
      initializeHourPositions();
      console.log("hourLinesRef na render:", hourLinesRef.value);
      console.log("hourPositions gevuld na render:", hourPositions.value);
    }
    console.log("isLoading geforceerd op false na dagboekladen");
  } catch (error) {
    console.error("Fout in onMounted:", error);
    isLoading.value = false;
    await nextTick(); // Forceer UI-update bij fout
    console.log("isLoading geforceerd op false na fout");
  }
});

const loadAuthenticatedData = async () => {
  console.log("loadAuthenticatedData gestart");
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      console.log("Auth status gewijzigd, user:", user);
      if (user) {
        try {
          await taskStore.loadTasks();
          console.log("Taken geladen:", taskStore.tasks.length);
        } catch (e) {
          console.error("Fout bij het laden van taken:", e);
        }
      } else {
        taskStore.tasks = [];
        router.push("/login");
      }
      resolve();
    });
  });
};

const initializeHourPositions = () => {
  hourLinesRef.value.forEach((container, index) => {
    if (container) {
      const hourLines = container.querySelectorAll(".hour-line");
      hourPositions.value[index] = {};
      hourLines.forEach((hourLine) => {
        const hour = hourLine.getAttribute("data-hour");
        hourPositions.value[index][hour] = hourLine.offsetTop;
      });
    }
  });
};

watch(() => [taskStore.tasks, currentWeekStart.value], () => {
  taskCache.value.clear();
  nextTick(() => {
    initializeHourPositions();
    console.log("hourPositions bijgewerkt na taskStore of currentWeekStart verandering:", hourPositions.value);
  });
}, { deep: true });

const weekDays = computed(() => {
  console.log("weekDays berekend, currentWeekStart:", currentWeekStart.value, "resultaat:", []);
  const start = currentWeekStart.value ? new Date(currentWeekStart.value) : new Date();
  if (isNaN(start.getTime())) start = new Date();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push({
      date: day.toISOString().split("T")[0],
      dayOfWeek: day.getDay(),
    });
  }
  console.log("weekDays resultaat:", days);
  return days;
});

const tasksForDay = computed(() => {
  return (date) => {
    if (!taskStore.tasks || taskStore.tasks.length === 0) return [];
    if (!taskCache.value.has(date)) {
      const tasks = taskStore.tasks
        .map((task, index) => ({ ...task, originalIndex: index }))
        .filter((task) => {
          if (task.type === "one-time" && task.dates && task.dates.includes(date)) {
            return true;
          } else if (task.type === "recurring" && task.scheduledDates && task.scheduledDates.some(d => d.date === date)) {
            return true;
          }
          return false;
        });
      taskCache.value.set(date, tasks);
    }
    return taskCache.value.get(date) || [];
  };
});

const hasDiaryEntry = (date) => {
  return diaryEntries.value.find((e) => e.date === date && e.content?.trim()) !== undefined;
};

const formatWeekRange = (start) => {
  const end = new Date(start);
  end.setDate(new Date(start).getDate() + 6);
  return `${new Date(start).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })} - ${end.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}`;
};

const formatShortDate = (date) => {
  const d = new Date(date);
  const day = d.getDate();
  const weekday = new Intl.DateTimeFormat("nl-NL", { weekday: "short" }).format(d).slice(0, 2).toLowerCase();
  return `${day} (${weekday})`;
};

const previousWeek = () => {
  const current = new Date(currentWeekStart.value);
  current.setDate(current.getDate() - 7);
  currentWeekStart.value = current.toISOString().split("T")[0];
  nextTick(() => {});
};

const nextWeek = () => {
  const current = new Date(currentWeekStart.value);
  current.setDate(current.getDate() + 7);
  currentWeekStart.value = current.toISOString().split("T")[0];
  nextTick(() => {});
};

const hourLines = computed(() => {
  const hours = [];
  for (let hour = 0; hour <= 23; hour++) {
    hours.push(hour.toString().padStart(2, "0"));
  }
  return hours;
});

const getTaskSchedule = (task, date) => {
  const scheduleFromDates = task.scheduledDates?.find(d => d.date === date);
  if (scheduleFromDates) return { ...scheduleFromDates };
  const scheduleFromTimes = task.timesByDate?.[date];
  return scheduleFromTimes ? { ...scheduleFromTimes } : null;
};

const getTaskTimeKey = (task, date) => {
  const schedule = getTaskSchedule(task, date);
  return schedule ? `${schedule.startTime}-${schedule.endTime}` : "00:00-00:00";
};

const handleEditTask = (taskId) => {
  router.push(`/edit-task/${taskId}`);
};

const handleDeleteTask = (taskId, date) => {
  taskStore.deleteTaskInstance(taskId, date);
  taskCache.value.clear();
  nextTick();
};

const getTaskPosition = (task, date) => {
  const dayIndex = weekDays.value ? weekDays.value.findIndex((d) => d.date === day.date) : -1;
  if (dayIndex === -1) {
    console.warn(`Day ${date} not found in weekDays, using fallback position`);
    return { top: '0em', height: '1.5em', background: 'rgba(255, 0, 0, 0.2)' };
  }
  const positions = hourPositions.value[dayIndex] || {};
  const schedule = getTaskSchedule(task, date);
  if (!schedule || !schedule.startTime || !schedule.endTime) {
    return { top: '0em', height: '1.5em', background: 'rgba(255, 0, 0, 0.2)' };
  }
  return { top: '0em', height: '1.5em', background: 'rgba(0, 255, 0, 0.2)' };
};

const onDragOver = (event, date) => {
  event.preventDefault();
};

const onDrop = async (event, date) => {
  if (!draggedTask.value || !draggedDate.value || !draggedTaskElement.value) return;
  const hourLines = event.currentTarget;
  const rect = hourLines.getBoundingClientRect();
  const hourLine = hourLines.querySelector(".hour-line");
  const hourHeight = hourLine ? hourLine.offsetHeight : 32;
  const y = event.clientY - rect.top + hourLines.scrollTop - initialDragOffsetY.value;
  const totalHours = Math.floor(y / hourHeight);
  const minutes = Math.round((y % hourHeight) / hourHeight * 60);
  const hours = Math.min(23, Math.max(0, totalHours));
  const validMinutes = Math.min(59, Math.max(0, minutes));
  const newTime = `${hours.toString().padStart(2, "0")}:${validMinutes.toString().padStart(2, "0")}`;

  const originalSchedule = getTaskSchedule(draggedTask.value, draggedDate.value);
  const originalStartTime = originalSchedule ? originalSchedule.startTime : "00:00";
  const originalEndTime = originalSchedule ? originalSchedule.endTime : "01:00";
  const [startHours, startMinutes] = originalStartTime.split(":").map(Number);
  const [endHours, endMinutes] = originalEndTime.split(":").map(Number);

  let newStartTime, newEndTime;
  if (dragEdge.value === "top") {
    newStartTime = newTime;
    newEndTime = originalEndTime;
  } else if (dragEdge.value === "bottom") {
    newEndTime = newTime;
    newStartTime = originalStartTime;
  } else if (dragEdge.value === "middle") {
    newStartTime = newTime;
    const newStartTotalMinutes = hours * 60 + validMinutes;
    const originalDurationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    const newEndTotalMinutes = newStartTotalMinutes + originalDurationMinutes;
    const newEndHours = Math.floor(newEndTotalMinutes / 60) % 24;
    const newEndMinutes = newEndTotalMinutes % 60;
    newEndTime = `${newEndHours.toString().padStart(2, "0")}:${newEndMinutes.toString().padStart(2, "0")}`;
  }

  const updatedTask = { ...draggedTask.value };
  if (updatedTask.scheduledDates) {
    const updatedSchedule = updatedTask.scheduledDates.map(d =>
      d.date === date ? { ...d, startTime: newStartTime, endTime: newEndTime } : d
    );
    updatedTask.scheduledDates = updatedSchedule;
  } else if (updatedTask.timesByDate) {
    updatedTask.timesByDate = {
      ...updatedTask.timesByDate,
      [date]: { startTime: newStartTime, endTime: newEndTime },
    };
  } else {
    updatedTask.scheduledDates = [{ date, startTime: newStartTime, endTime: newEndTime }];
    updatedTask.type = "recurring";
  }

  if (date !== draggedDate.value) {
    if (updatedTask.type === "one-time") {
      updatedTask.dates = updatedTask.dates ? updatedTask.dates.filter(d => d !== draggedDate.value) : [];
      updatedTask.dates.push(date);
    }
    if (updatedTask.scheduledDates) {
      updatedTask.scheduledDates = updatedTask.scheduledDates.filter(d => d.date !== draggedDate.value);
      updatedTask.scheduledDates.push({ date, startTime: newStartTime, endTime: newEndTime });
    } else if (updatedTask.timesByDate) {
      delete updatedTask.timesByDate[draggedDate.value];
      updatedTask.timesByDate[date] = { startTime: newStartTime, endTime: newEndTime };
    }
  }

  await taskStore.updateTask(draggedTask.value.id, updatedTask);
  taskCache.value.clear();
  await nextTick(() => {
    draggedTaskElement.value.style.opacity = "1";
    draggedTask.value = null;
    draggedDate.value = null;
    draggedTaskElement.value = null;
    initialDragOffsetY.value = 0;
    dragEdge.value = null;
    originalHeight.value = 0;
  });
};
</script>

<style scoped>
.home {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px;
  font-size: 16px;
  position: relative;
  min-height: 100vh;
  padding-bottom: 80px;
}

.week-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.week-navigation button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.week-navigation button:hover {
  background: #0056b3;
}

.week {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.day {
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 10px;
  position: relative;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.day-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1em;
  font-weight: bold;
}

.day-actions {
  display: flex;
  gap: 8px;
}

.day-actions .icon-button {
  padding: 5px;
  font-size: 1em;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.day-actions .icon-button:hover {
  background: #0056b3;
}

.day-actions .icon-button.has-diary {
  background: #28a745;
}

.day-actions .icon-button.has-diary:hover {
  background: #218838;
}

.hour-lines {
  position: relative;
  min-height: 15em;
  max-height: 15em;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #007bff #f1f1f1;
  font-size: 16px;
}

.hour-lines::-webkit-scrollbar {
  width: 6px;
}

.hour-lines::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.hour-lines::-webkit-scrollbar-thumb {
  background: #007bff;
  border-radius: 3px;
}

.hour-lines::-webkit-scrollbar-thumb:hover {
  background: #0056b3;
}

.hour-line {
  border-top: 1px solid #dee2e6;
  height: 2em;
  line-height: 2em;
  color: #666;
  font-size: 16px;
  position: relative;
  box-sizing: border-box;
}

.loading {
  text-align: center;
  padding: 50px;
  color: #333;
}

h1, h2 {
  color: #333;
  text-align: center;
}
</style>