<template>
    <div class="day-column" :class="{ 'single-day': isSingleDay }">
        <div class="day-header">
            <span>{{ formatShortDate(day.date) }}</span>
            <button class="diary-btn" @click="$emit('openDiary', day.date)"
                :title="hasDiaryEntry(day.date) ? 'Bekijk dagboek' : 'Voeg dagboek toe'">
                <span v-if="hasDiaryEntry(day.date)">📖</span>
                <span v-else>➕📖</span>
            </button>
        </div>
        <div class="hour-lines" ref="hourLinesRef">
            <div v-for="hour in hourLines" :key="hour" class="hour-line" :data-hour="hour">
                {{ hour }}:00
            </div>
        </div>

        <div v-for="task in tasksForDay(day.date)" :key="getTaskTimeKey(task, day.date)" class="task"
            :style="getTaskPosition(task, day.date)">
            <div class="task-row">
                <label class="checkbox-label">
                    <input type="checkbox" class="complete-checkbox" :checked="isTaskInstanceCompleted(task, day.date)"
                        @change="$emit('toggleCompletion', task, day.date)"
                        :title="isTaskInstanceCompleted(task, day.date) ? 'Markeer als niet voltooid' : 'Markeer als voltooid'" />
                    <span class="custom-checkbox"></span>
                </label>
                <div class="task-content" @click="$emit('editTask', task.id)"
                    @mouseenter="showTooltip($event, task.name || task.title || 'Taak')">
                    {{ task.name || task.title || 'Taak' }}
                </div>
            </div>
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

function isTaskInstanceCompleted(task, date) {
    // One-time task: just use task.completed
    if (task.type === 'one-time') {
        return !!task.completed;
    }
    // Recurring: check scheduledDates or timesByDate for this date
    if (task.type === 'recurring') {
        if (task.scheduledDates && Array.isArray(task.scheduledDates)) {
            const sched = task.scheduledDates.find(d => d.date === date);
            return sched ? !!sched.completed : false;
        }
        if (task.timesByDate && task.timesByDate[date]) {
            return !!task.timesByDate[date].completed;
        }
    }
    return false;
}
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

.day-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5em 0.5em 0.5em 0;
    font-weight: 600;
    font-size: 1.1em;
}

.diary-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2em;
    margin-left: 0.5em;
    color: var(--color-primary, #007bff);
    transition: color 0.2s;
}

.diary-btn:hover {
    color: var(--color-primary-hover, #0056b3);
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
    background: #0056b3;
    border: 1px solid rgba(0, 123, 255, 0.3);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.task:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
    z-index: 20;
}

.task-row {
    display: flex;
    align-items: center;
    height: 100%;
}

.task-content {
    padding: 1px 1px;
    font-size: 0.65em;
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.day-column.single-day .task-content {
    padding: 1px 1px;
    font-size: 0.65em;
    text-shadow: black 0px 0px 4px;
}

.complete-checkbox {
    position: absolute;
    opacity: 0;
    width: 2em;
    height: 2em;
    margin: 0;
    z-index: 2;
    left: 0;
    top: 0;
    cursor: pointer;
}

.checkbox-label {
    position: relative;
    display: flex;
    align-items: center;
    margin-right: 0.7em;
    min-width: 2em;
    min-height: 2em;
    cursor: pointer;
}

.custom-checkbox {
    width: 2em;
    height: 2em;
    border: 2px solid var(--color-primary, #007bff);
    border-radius: 0.3em;
    background: var(--color-bg-alt);
    display: inline-block;
    position: relative;
    box-sizing: border-box;
}

.complete-checkbox:checked+.custom-checkbox {
    background: var(--color-primary, #007bff);
    border-color: var(--color-primary, #007bff);
}

.complete-checkbox:checked+.custom-checkbox::after {
    content: '';
    position: absolute;
    left: 0.5em;
    top: 0.2em;
    width: 0.5em;
    height: 1em;
    border: solid var(--color-bg);
    border-width: 0 0.25em 0.25em 0;
    transform: rotate(45deg);
    display: block;
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