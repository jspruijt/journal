<template>
  <div
    class="task"
    :style="getTaskPosition(task, date)"
    @dragstart="onDragStart($event, task, date, edge)"
    @dragover.prevent
    @drop.prevent
  >
    <div class="task-edge top-edge" :draggable="true" @dragstart="onDragStart($event, task, date, 'top')"></div>
    <div
      class="task-content"
      :draggable="true"
      @dragstart="onDragStart($event, task, date, 'middle')"
    >
      <div class="task-info">
        <input
          type="checkbox"
          :checked="getTaskSchedule(task, date)?.completed ?? false"
          @change="toggleTaskCompletion(task, date)"
          :id="'task-' + task.id + '-' + date"
        />
        <label
          :for="'task-' + task.id + '-' + date"
          class="task-name"
          @mouseover="showTooltip($event, sanitizeText(task.name || 'Onbekende taak'))"
        >
          {{ sanitizeText(task.name || "Onbekende taak") }}
          <span v-if="getTaskSchedule(task, date)">
            {{ getTaskSchedule(task, date).startTime }} - {{ getTaskSchedule(task, date).endTime }}
          </span>
        </label>
      </div>
      <div class="task-actions">
        <button
          class="icon-button"
          @click="$emit('edit', task.id)"
          aria-label="Bewerk taak"
        >
          ✏️
        </button>
        <button
          class="icon-button"
          @click="$emit('delete', task.id, date)"
          aria-label="Verwijder instantie"
        >
          🗑️
        </button>
      </div>
    </div>
    <div
      class="task-edge bottom-edge"
      :draggable="true"
      @dragstart="onDragStart($event, task, date, 'bottom')"
    ></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTaskStore } from '../stores/tasks'

defineProps({
  task: Object,
  date: String
})
defineEmits(['edit', 'delete'])

const taskStore = useTaskStore()
const draggedTask = ref(null)
const draggedDate = ref(null)
const dragEdge = ref(null)
const initialDragOffsetY = ref(0)
const lastDragTop = ref(0)

const getTaskSchedule = (task, date) => {
  const scheduleFromDates = task.scheduledDates?.find(d => d.date === date)
  if (scheduleFromDates) return { ...scheduleFromDates }
  const scheduleFromTimes = task.timesByDate?.[date]
  return scheduleFromTimes ? { ...scheduleFromTimes } : null
}

const getTaskPosition = (task, date) => {
  const schedule = getTaskSchedule(task, date)
  if (!schedule || !schedule.startTime || !schedule.endTime) {
    return { top: '0em', height: '1.5em', background: 'rgba(255, 0, 0, 0.2)' }
  }
  // Gebruik dezelfde logica als in Home.vue voor positionering (vereenvoudigd hier)
  return { top: '0em', height: '1.5em', background: 'rgba(0, 255, 0, 0.2)' } // Placeholder, pas aan met hourPositions
}

const onDragStart = (event, task, date, edge) => {
  draggedTask.value = task
  draggedDate.value = date
  dragEdge.value = edge
  initialDragOffsetY.value = event.clientY
  event.dataTransfer.setData('text/plain', task.id.toString())
  event.target.style.opacity = '0.5'
}

const showTooltip = (event, text) => {
  const element = event.target
  if (element.scrollWidth > element.clientWidth) {
    element.setAttribute('title', text)
  } else {
    element.removeAttribute('title')
  }
}

const sanitizeText = (text) => {
  return text ? text.replace(/<!--|-->/g, '').trim() : 'Onbekende taak'
}

const toggleTaskCompletion = async (task, date) => {
  await taskStore.toggleTaskInstanceCompletion(task.id, date)
}
</script>

<style scoped>
/* Kopieer de relevante stijlen uit Home.vue */
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
.top-edge { border-top-left-radius: 4px; border-top-right-radius: 4px; }
.bottom-edge { border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; }
.task-content { flex: 1; display: flex; justify-content: space-between; align-items: center; padding: 2px 5px; background: #ffffff; }
.task:hover { outline: 1px solid #007bff; box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); }
.task-info { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0; }
.task-name { cursor: pointer; font-size: 1em; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; position: relative; }
.task-actions { display: flex; gap: 10px; }
.icon-button { padding: 5px; font-size: 1em; border: none; background: none; cursor: pointer; color: #333; transition: color 0.2s; }
.icon-button:hover { color: #007bff; }
</style>