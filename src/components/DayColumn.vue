<template>
    <div class="day">
        <div class="day-header">
            <h3>{{ formatShortDate(day.date) }}</h3>
            <div class="day-actions">
                <button class="icon-button" :class="{ 'has-diary': hasDiaryEntry(day.date) }"
                    @click="$emit('openDiary', day.date)" aria-label="Dagboek voor deze dag">
                    📓
                </button>
            </div>
        </div>
        <div class="hour-lines" :ref="hourLinesRef" @dragover.prevent="$emit('dragOver', $event, day.date)"
            @drop="$emit('drop', $event, day.date)">
            <div v-for="(hour, idx) in hourLines" :key="hour" class="hour-line" :data-hour="hour"
                :style="`--hour-index: ${idx}`">
                {{ hour }}:00
            </div>
            <TaskItem v-for="task in tasksForDay(day.date)"
                :key="`${task.id}-${day.date}-${getTaskTimeKey(task, day.date)}`" :task="task" :date="day.date"
                :getTaskPosition="getTaskPosition" :getTaskSchedule="getTaskSchedule" :getTaskTimeKey="getTaskTimeKey"
                @dragStart="(e, t, d, edge) => $emit('dragStart', e, t, d, edge)"
                @toggleCompletion="(t, d) => $emit('toggleCompletion', t, d)"
                @deleteInstance="(t, d) => $emit('deleteInstance', t, d)" @showTooltip="showTooltip"
                @editTask="(id) => $emit('editTask', id)" />
        </div>
    </div>
</template>

<script setup>
import TaskItem from './TaskItem.vue';
defineProps([
    'day', 'hourLines', 'hourLinesRef', 'tasksForDay', 'getTaskPosition',
    'getTaskSchedule', 'getTaskTimeKey', 'showTooltip', 'formatShortDate', 'hasDiaryEntry'
]);
</script>

<style scoped>
.day {
    background: #f9f9f9;
    border-radius: 8px;
    margin-bottom: 20px;
    padding: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    position: relative;
}

.day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.day-actions .icon-button {
    background: transparent;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    transition: color 0.2s;
}

.day-actions .icon-button.has-diary {
    color: #007bff;
}

.hour-lines {
    position: relative;
    width: 100%;
    height: 260px;
    /* verhoogde hoogte */
    min-height: 260px;
    background: #fff;
    border-radius: 4px;
    padding-left: 60px;
    box-sizing: border-box;
    overflow-y: auto;
}

.hour-line {
    position: absolute;
    left: 0;
    width: 60px;
    height: 32px;
    border-bottom: 1px solid #eee;
    color: #aaa;
    font-size: 0.9em;
    padding-left: 8px;
    line-height: 32px;
    background: transparent;
    z-index: 1;
    top: calc(var(--hour-index, 0) * 32px);
}
</style>