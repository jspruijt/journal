<template>
  <div class="home">
    <h1>Weekoverzicht</h1>
    <div class="week-navigation">
      <button @click="previousWeek">Vorige week</button>
      <span>{{ formatWeekRange(currentWeekStart) }}</span>
      <button @click="nextWeek">Volgende week</button>
    </div>
    <div class="week">
      <div v-for="day in weekDays" :key="day.date" class="day">
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
          <div v-for="hour in hourLines" :key="hour" class="hour-line" :data-hour="hour">
            {{ hour }}:00
          </div>
          <div
            v-for="task in tasksForDay(day.date)"
            :key="`${task.id}-${day.date}-${getTaskTimeKey(task, day.date)}`"
            class="task"
            :style="getTaskPosition(task, day.date)"
          >
            <div
              class="task-edge top-edge"
              :draggable="true"
              @dragstart="onDragStart($event, task, day.date, 'top')"
            ></div>
            <div
              class="task-content"
              :draggable="true"
              @dragstart="onDragStart($event, task, day.date, 'middle')"
            >
              <div class="task-info">
                <input
                  type="checkbox"
                  :checked="getTaskSchedule(task, day.date)?.completed ?? false"
                  @change="toggleTaskCompletion(task, day.date)"
                  :id="'task-' + task.id + '-' + day.date"
                />
                <label
                  :for="'task-' + task.id + '-' + day.date"
                  class="task-name"
                  @mouseover="showTooltip($event, sanitizeText(task.name || 'Onbekende taak'))"
                >
                  {{ sanitizeText(task.name || "Onbekende taak") }}
                  <span v-if="getTaskSchedule(task, day.date)">
                    {{ getTaskSchedule(task, day.date).startTime }} - {{ getTaskSchedule(task, day.date).endTime }}
                  </span>
                </label>
              </div>
              <div class="task-actions">
                <button
                  class="icon-button"
                  @click="$router.push(`/edit-task/${task.id}`)"
                  aria-label="Bewerk taak"
                >
                  ✏️
                </button>
                <button
                  class="icon-button"
                  @click="deleteTaskInstance(task, day.date)"
                  aria-label="Verwijder instantie"
                >
                  🗑️
                </button>
              </div>
            </div>
            <div
              class="task-edge bottom-edge"
              :draggable="true"
              @dragstart="onDragStart($event, task, day.date, 'bottom')"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useTaskStore } from "../stores/tasks";
import { useRouter } from "vue-router";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const taskStore = useTaskStore();
const router = useRouter();
const currentWeekStart = ref(new Date().toISOString().split("T")[0]);
const hourLinesRef = ref([]);
const draggedTask = ref(null);
const draggedDate = ref(null);
const hourPositions = ref({});
const draggedTaskElement = ref(null);
const lastDragTop = ref(0);
const initialDragOffsetY = ref(0);
const dragEdge = ref(null);
const originalHeight = ref(0);
const diaryEntries = ref([]); // Dagboekentries van de ingelogde gebruiker

const taskCache = ref(new Map());

// Laad taken en dagboekentries asynchroon
onMounted(async () => {
  await taskStore.loadTasks();

  // Weekberekening
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  currentWeekStart.value = monday.toISOString().split("T")[0];

  nextTick(() => {
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
  });

  // Laad alleen dagboekentries van de ingelogde gebruiker
  try {
    // Wacht tot Firebase Auth status bekend is
    let user = auth.currentUser;
    if (!user) {
      // Probeer te wachten op auth state change
      await new Promise(resolve => {
        const unsubscribe = auth.onAuthStateChanged(u => {
          user = u;
          unsubscribe();
          resolve();
        });
      });
    }
    if (user) {
      const q = query(
        collection(db, "diaryEntries"),
        where("userId", "==", user.uid)
      );
      const diarySnapshot = await getDocs(q);
      diaryEntries.value = diarySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      diaryEntries.value = [];
    }
  } catch (e) {
    console.error("Fout bij het laden van dagboekvermeldingen:", e);
    diaryEntries.value = [];
  }
});

watch(() => [taskStore.tasks, currentWeekStart.value], () => {
  taskCache.value.clear();
}, { deep: true });

const weekDays = computed(() => {
  const days = [];
  const start = new Date(currentWeekStart.value);
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

const tasksForDay = computed(() => {
  return (date) => {
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
    return taskCache.value.get(date);
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
};

const nextWeek = () => {
  const current = new Date(currentWeekStart.value);
  current.setDate(current.getDate() + 7);
  currentWeekStart.value = current.toISOString().split("T")[0];
};

const hourLines = computed(() => {
  const hours = [];
  for (let hour = 0; hour <= 23; hour++) {
    hours.push(hour.toString().padStart(2, "0"));
  }
  return hours;
});

const showTooltip = (event, text) => {
  const element = event.target;
  if (element.scrollWidth > element.clientWidth) {
    element.setAttribute("title", text);
  } else {
    element.removeAttribute("title");
  }
};

const sanitizeText = (text) => {
  return text ? text.replace(/<!--|-->/g, "").trim() : "Onbekende taak";
};

const getTaskSchedule = (task, date) => {
  const scheduleFromDates = task.scheduledDates?.find(d => d.date === date);
  if (scheduleFromDates) {
    return { ...scheduleFromDates };
  }
  const scheduleFromTimes = task.timesByDate?.[date];
  if (scheduleFromTimes) {
    return { ...scheduleFromTimes };
  }
  return null;
};

const getTaskTimeKey = (task, date) => {
  const schedule = getTaskSchedule(task, date);
  return schedule ? `${schedule.startTime}-${schedule.endTime}` : "00:00-00:00";
};

const getTaskPosition = (task, date) => {
  const schedule = getTaskSchedule(task, date);
  if (!schedule || !schedule.startTime || !schedule.endTime) {
    return { top: "0em", height: "1.5em", background: "rgba(255, 0, 0, 0.2)" };
  }

  const dayIndex = weekDays.value.findIndex((day) => day.date === date);
  const positions = hourPositions.value[dayIndex] || {};
  if (Object.keys(positions).length === 0) {
    return { top: "0em", height: "1.5em", background: "rgba(255, 0, 0, 0.2)" };
  }

  const [startHours, startMinutes] = schedule.startTime.split(":").map(Number);
  const [endHours, endMinutes] = schedule.endTime.split(":").map(Number);

  const startHourStr = startHours.toString().padStart(2, "0");
  const endHourStr = endHours.toString().padStart(2, "0");

  const startHourTop = positions[startHourStr] || 0;
  const endHourTop = positions[endHourStr] || 0;

  const hourHeightPx = positions["01"] - positions["00"] || 32;
  const minuteOffsetPx = (startMinutes / 60) * hourHeightPx;
  const topPx = startHourTop + minuteOffsetPx;

  const totalStartMinutes = startHours * 60 + startMinutes;
  const totalEndMinutes = endHours * 60 + endMinutes;
  const durationMinutes = totalEndMinutes - totalStartMinutes;
  const heightPx = (durationMinutes / 60) * hourHeightPx;

  const baseFontSize = 16;
  const topEm = topPx / baseFontSize;
  const heightEm = heightPx / baseFontSize;

  return {
    top: `${topEm}em`,
    height: `${heightEm}em`,
    background: "rgba(0, 255, 0, 0.2)",
  };
};

const onDragStart = (event, task, date, edge) => {
  draggedTask.value = task;
  draggedDate.value = date;
  draggedTaskElement.value = event.target.closest(".task");
  dragEdge.value = edge;
  originalHeight.value = draggedTaskElement.value.offsetHeight;

  const dragImage = new Image();
  dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
  event.dataTransfer.setDragImage(dragImage, 0, 0);

  const rect = draggedTaskElement.value.getBoundingClientRect();
  const edgeElement = event.target;
  const edgeRect = edgeElement.getBoundingClientRect();
  initialDragOffsetY.value = edge === "bottom" ? rect.bottom - event.clientY : event.clientY - rect.top;

  draggedTaskElement.value.style.opacity = "0.5";
  event.dataTransfer.setData("text/plain", task.id.toString());
};

const onDragOver = (event, date) => {
  event.preventDefault();
  if (draggedTask.value && draggedTaskElement.value) {
    const hourLines = event.currentTarget;
    const rect = hourLines.getBoundingClientRect();
    const hourLine = hourLines.querySelector(".hour-line");
    const hourHeight = hourLine ? hourLine.offsetHeight : 32;
    const y = event.clientY - rect.top + hourLines.scrollTop;

    let newTopPx, newHeightPx;
    const dayIndex = weekDays.value.findIndex((day) => day.date === date);
    const positions = hourPositions.value[dayIndex] || {};
    const schedule = getTaskSchedule(draggedTask.value, draggedDate.value);
    const [startHours, startMinutes] = schedule ? schedule.startTime.split(":").map(Number) : [0, 0];
    const [endHours, endMinutes] = schedule ? schedule.endTime.split(":").map(Number) : [1, 0];
    const originalTopPx = positions[startHours.toString().padStart(2, "0")] + (startMinutes / 60) * hourHeight;
    const originalHeightPx = (endHours * 60 + endMinutes - (startHours * 60 + startMinutes)) / 60 * hourHeight;

    if (dragEdge.value === "top") {
      newTopPx = Math.max(0, y - initialDragOffsetY.value);
      newHeightPx = Math.max(32, originalHeightPx + (originalTopPx - newTopPx));
    } else if (dragEdge.value === "bottom") {
      newTopPx = originalTopPx;
      newHeightPx = Math.max(32, y + initialDragOffsetY.value - originalTopPx);
    } else if (dragEdge.value === "middle") {
      newTopPx = Math.max(0, y - initialDragOffsetY.value);
      newHeightPx = originalHeightPx;
    }

    draggedTaskElement.value.style.top = `${newTopPx}px`;
    draggedTaskElement.value.style.height = `${newHeightPx}px`;
    draggedTaskElement.value.style.left = `${rect.left + 60}px`;
    lastDragTop.value = newTopPx;
  }
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
      updatedTask.dates = updatedTask.dates ? updatedTask.dates.filter((d) => d !== draggedDate.value) : [];
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
    draggedTaskElement.value.style.top = `${lastDragTop.value}px`;
    draggedTaskElement.value.style.height = `${originalHeight.value}px`;
    draggedTaskElement.value.style.left = `${rect.left + 60}px`;
    draggedTaskElement.value.style.opacity = "1";
    draggedTaskElement.value.style.position = "absolute";
  });

  draggedTask.value = null;
  draggedDate.value = null;
  draggedTaskElement.value = null;
  initialDragOffsetY.value = 0;
  dragEdge.value = null;
  originalHeight.value = 0;
};

const toggleTaskCompletion = async (task, date) => {
  const taskId = task.id;
  await taskStore.toggleTaskInstanceCompletion(taskId, date);
  taskCache.value.clear();
  await nextTick();
};

const deleteTaskInstance = async (task, date) => {
  const taskId = task.id;
  await taskStore.deleteTaskInstance(taskId, date);
  taskCache.value.clear();
  await nextTick();
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

.task {
  position: absolute;
  left: 60px;
  right: 10px;
  background: #ffffff;
  border: none;
  padding: 0;
  font-size: 1em;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  cursor: move;
  z-index: 10;
  min-height: 32px;
}

.task-edge {
  height: 5px;
  background: #007bff;
  cursor: ns-resize;
}

.top-edge {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.bottom-edge {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.task-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 5px;
  background: #ffffff;
}

.task:hover {
  outline: 1px solid #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
}

.task-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.task-name {
  cursor: pointer;
  font-size: 1em;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  position: relative;
}

.task-name:hover::after {
  content: attr(title);
  visibility: hidden;
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  white-space: nowrap;
  font-size: 0.8em;
}

.task-name:hover[title]::after {
  visibility: visible;
}

.task-actions {
  display: flex;
  gap: 10px;
}

.task-actions .icon-button {
  padding: 5px;
  font-size: 1em;
  border: none;
  background: none;
  cursor: pointer;
  color: #333;
  transition: color 0.2s;
}

.task-actions .icon-button:hover {
  color: #007bff;
}

h1, h2 {
  color: #333;
  text-align: center;
}
</style>