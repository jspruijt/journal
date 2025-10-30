<template>
    <div class="day-column" :class="{ 'single-day': isSingleDay }">
        <div class="hour-lines" ref="hourLinesRef">
            <div v-for="hour in hourLines" :key="hour" class="hour-line" :data-hour="hour">
                {{ hour }}:00
            </div>
        </div>

        <div v-for="task in tasksForDay(day.date)" :key="getTaskTimeKey(task, day.date)" class="task"
            :style="getTaskPosition(task, day.date)" @click="$emit('editTask', task.id)"
            @mouseenter="showTooltip($event, task.name || task.title || 'Taak')">
            <div class="task-content">{{ task.name || task.title || 'Taak' }}</div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps([
    'day', 'hourLines', 'hourLinesRef', 'tasksForDay', 'getTaskPosition',
    'getTaskSchedule', 'getTaskTimeKey', 'showTooltip', 'formatShortDate',
    'hasDiaryEntry', 'isSingleDay'
]);

defineEmits([
    'openDiary', 'toggleCompletion', 'deleteInstance', 'editTask'
]);
</script>

<style scoped>
.day-column {
    width: 100%;
    box-sizing: border-box;
    position: relative;
    overflow-y: auto;
    max-height: 80vh;
    padding-bottom: 20px;
}

.hour-lines {
    position: relative;
}

.hour-line {
    height: 32px;
    border-top: 1px solid #ddd;
    font-size: 0.9em;
    padding-left: 8px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
}

.day-column.single-day .hour-line {
    height: 48px !important;
    font-size: 1.1em !important;
    border-top: 2px solid #ccc;
    background: linear-gradient(180deg, transparent 0%, rgba(0, 123, 255, 0.03) 100%);
}

.task {
    position: absolute;
    width: calc(100% - 60px);
    left: 60px;
    box-sizing: border-box;
    border-radius: 4px;
    overflow: hidden;
    transition: all 0.2s ease;
    z-index: 10;
    cursor: pointer;
}

.task:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
    z-index: 20;
}

.task-content {
    padding: 8px 12px;
    background: rgba(0, 123, 255, 0.15);
    border: 1px solid rgba(0, 123, 255, 0.3);
    font-size: 0.95em;
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.day-column.single-day .task-content {
    padding: 12px 16px;
    font-size: 1.1em;
}

/* Scrollbar */
.day-column::-webkit-scrollbar {
    width: 8px;
}

.day-column::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.day-column::-webkit-scrollbar-thumb {
    background: #007bff;
    border-radius: 4px;
}

.day-column::-webkit-scrollbar-thumb:hover {
    background: #0056b3;
}
</style>