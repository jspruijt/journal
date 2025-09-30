<template>
    <div class="task" :style="getTaskPosition(task, date)" draggable="false">
        <div class="task-edge top-edge" draggable="true" @dragstart="$emit('dragStart', $event, task, date, 'top')">
        </div>
        <div class="task-content" draggable="true" @dragstart="$emit('dragStart', $event, task, date, 'middle')">
            <div class="task-info">
                <input type="checkbox" :checked="getTaskSchedule(task, date)?.completed ?? false"
                    @change="$emit('toggleCompletion', task, date)" :id="'task-' + task.id + '-' + date" />
                <label :for="'task-' + task.id + '-' + date" class="task-name"
                    @mouseover="$emit('showTooltip', $event, task.name || 'Onbekende taak')">
                    {{ task.name || "Onbekende taak" }}
                    <span v-if="getTaskSchedule(task, date)">
                        {{ getTaskSchedule(task, date).startTime }} - {{ getTaskSchedule(task, date).endTime }}
                    </span>
                </label>
            </div>
            <div class="task-actions">
                <button class="icon-button" @click="$emit('editTask', task.id)" aria-label="Bewerk taak">
                    ✏️
                </button>
                <button class="icon-button" @click="$emit('deleteInstance', task, date)"
                    aria-label="Verwijder instantie">
                    🗑️
                </button>
            </div>
        </div>
        <div class="task-edge bottom-edge" draggable="true"
            @dragstart="$emit('dragStart', $event, task, date, 'bottom')"></div>
    </div>
</template>

<script setup>
defineProps([
    'task', 'date', 'getTaskPosition', 'getTaskSchedule', 'getTaskTimeKey'
]);
</script>

<style scoped>
.task {
    position: absolute;
    left: 60px;
    right: 10px;
    background: #e3f2fd;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.07);
    padding: 8px 0px;
    margin-bottom: 8px;
    z-index: 2;
    transition: box-shadow 0.2s, background 0.2s;
    border: 1px solid #90caf9;
    min-width: 200px;
    max-width: calc(100% - 70px);
}

.task-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.task-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.task-name {
    font-weight: 500;
    color: #1565c0;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
}

.task-actions {
    display: flex;
    gap: 6px;
}

.icon-button {
    background: transparent;
    border: none;
    font-size: 1.2em;
    cursor: pointer;
    transition: color 0.2s;
    padding: 4px;
    border-radius: 50%;
}

.icon-button:hover {
    background: #e3f2fd;
    color: #1976d2;
}

.task-edge {
    position: absolute;
    height: 8px;
    width: 100%;
    cursor: ns-resize;
}

.top-edge {
    top: 0;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    background: #bbdefb;
}

.bottom-edge {
    bottom: 0;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    background: #bbdefb;
}
</style>