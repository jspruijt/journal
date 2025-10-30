<template>
  <div class="unplanned-tasks">
    <h1 class="spacex-title">Ongeplande Taken</h1>
    <div class="action-bar">
      <button class="action-button add-task" @click="$router.push('/add-task')" title="Taak toevoegen">
        <span class="add-task-icon">➕</span>
      </button>
    </div>
    <div v-if="taskStore.isLoading">
      <p>Laden...</p>
    </div>
    <div v-else>
      <div v-if="unplannedTasks.length" class="task-list">
        <ul>
          <li v-for="task in unplannedTasks" :key="task.id" class="task-row">
            <div class="task-info">
              <span class="task-name">
                {{ task.name || "Onbekende taak" }} ({{ task.type === 'one-time' ? 'Eenmalig' : 'Terugkerend' }})
              </span>
            </div>
            <div class="task-actions">
              <button class="icon-button spacex-blue-btn" @click="$router.push(`/edit-task/${task.id}`)"
                aria-label="Bewerk taak" title="Bewerk taak">
                ✏️
              </button>
              <button class="icon-button spacex-blue-btn delete" @click="taskStore.deleteTask(task.id)"
                aria-label="Verwijder taak" title="Verwijder taak">
                🗑️
              </button>
            </div>
          </li>
        </ul>
      </div>
      <div v-else>
        <p>Geen ongeplande taken.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useTaskStore } from '../stores/tasks';

const taskStore = useTaskStore();

const unplannedTasks = computed(() =>
  taskStore.tasks.filter(task => (!task.dates || task.dates.length === 0) &&
    (!task.scheduledDates || task.scheduledDates.length === 0))
);

onMounted(() => {
  taskStore.loadTasks();
});
</script>

<style scoped>
.unplanned-tasks {
  padding: 2.5em 1.5em 2em 1.5em;
  max-width: 1100px;
  margin: 0 auto;
  background: var(--color-bg-alt);
  border-radius: 0;
  box-shadow: var(--shadow);
  border: 1.5px solid var(--color-border);
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 2em;
}

.action-button.add-task {
  width: 42px;
  height: 42px;
  border-radius: 0;
  background: #007bff;
  color: #fff;
  font-size: 1.5em;
  box-shadow: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background var(--transition), transform var(--transition);
}

.action-button.add-task:hover {
  background: #0056b3;
  transform: scale(1.08);
}

.add-task-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
  width: 100%;
  height: 100%;
}

.spacex-title {
  text-transform: uppercase;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.04em;
  font-size: 1.5em;
  margin-bottom: 1.5em;
}

.task-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.1em 0.5em 1.1em 0.5em;
  border-bottom: 1.5px solid var(--color-border);
  font-size: 1em;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  background: transparent;
  transition: background var(--transition);
}

.task-row:last-child {
  border-bottom: none;
}

.task-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1em;
  min-width: 0;
}

.task-name {
  cursor: default;
  font-size: 1em;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  font-weight: 600;
  color: var(--color-text);
}

.task-actions {
  display: flex;
  gap: 0.7em;
}

.icon-button {
  background: none;
  border: none;
  border-radius: 0;
  color: var(--color-primary);
  font-size: 1.2em;
  padding: 0.3em 0.7em;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background var(--transition), color var(--transition), border var(--transition), transform var(--transition);
}

.icon-button:hover {
  background: var(--color-primary);
  color: #fff;
  transform: translateY(-2px) scale(1.08);
}

.icon-button.delete {
  background: var(--color-danger);
  color: #fff;
}

.icon-button.delete:hover {
  background: #b91c1c;
}
</style>