<template>
  <div class="unplanned-tasks">
    <h1>Ongeplande Taken</h1>
    <div v-if="isStoreInitialized">
      <div v-if="unplannedTasks.length" class="task-list">
        <ul>
          <li v-for="task in unplannedTasks" :key="task.id">
            <div class="task-info">
              <span
                class="task-name"
                @mouseover="showTooltip($event, task.name || 'Onbekende taak')"
              >
                {{ task.name || "Onbekende taak" }} ({{ task.type === 'one-time' ? 'Eenmalig' : 'Terugkerend' }})
              </span>
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
                @click="taskStore.deleteTask(task.id)"
                aria-label="Verwijder taak"
              >
                🗑️
              </button>
            </div>
          </li>
        </ul>
      </div>
      <p v-else>Geen ongeplande taken.</p>
    </div>
    <p v-else>Laden...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useTaskStore } from "../stores/tasks";
import { useRouter } from "vue-router";

const taskStore = useTaskStore();
const router = useRouter();
const isStoreInitialized = ref(false);

onMounted(() => {
  taskStore.loadTasks().then(() => {
    isStoreInitialized.value = true;
  }).catch(error => {
    console.error("Fout bij het laden van taken:", error);
    isStoreInitialized.value = true;
  });
});

const unplannedTasks = computed(() => {
  if (!isStoreInitialized.value || !taskStore.tasks) return [];
  return taskStore.tasks
    .map((task, index) => ({ ...task, originalIndex: index }))
    .filter(task => {
      const hasNoDates = !task.dates || task.dates.length === 0;
      const hasNoScheduledDates = !task.scheduledDates || task.scheduledDates.length === 0;
      return hasNoDates && hasNoScheduledDates;
    });
});

const sanitizeText = (text) => {
  return text ? text.replace(/<!--|-->/g, "").trim() : "Onbekende taak";
};

const showTooltip = (event, text) => {
  const element = event.target;
  const sanitizedText = sanitizeText(text); // Sanitize de text
  if (element.scrollWidth > element.clientWidth) {
    element.setAttribute("title", sanitizedText);
  } else {
    element.removeAttribute("title");
  }
};
</script>

<style scoped>
.unplanned-tasks {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.task-list ul {
  list-style: none;
  padding: 0;
}

.task-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #dee2e6;
  font-size: 0.9em;
}

.task-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.task-name {
  cursor: default;
  font-size: 0.9em;
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

.icon-button {
  padding: 5px;
  font-size: 1em;
  border: none;
  background: none;
  cursor: pointer;
  color: #333;
  transition: color 0.2s;
}

.icon-button:hover {
  color: #007bff;
}
</style>