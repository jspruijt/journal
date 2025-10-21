<template>
  <div class="edit-task">
    <h1>Taak bewerken</h1>
    <div v-if="taskStore.isLoading" class="loading">Laden...</div>
    <div v-else-if="taskStore.error" class="error">{{ taskStore.error }}</div>
    <div v-else-if="!task" class="error">Taak niet gevonden</div>
    <form v-else @submit.prevent="saveTask" class="task-form">
      <div class="form-group">
        <label for="name">Taaknaam:</label>
        <input id="name" v-model="task.name" type="text" required placeholder="Voer de naam van de taak in" />
      </div>
      <div class="form-group">
        <label for="type">Type:</label>
        <select id="type" v-model="task.type" required>
          <option value="one-time">Eenmalig</option>
          <option value="recurring">Herhalend</option>
        </select>
      </div>
      <div class="form-group" v-if="task.type === 'one-time'">
        <label for="date">Datum (optioneel):</label>
        <input id="date" v-model="task.date" type="date" />
      </div>
      <div v-if="task.type === 'recurring'">
        <div class="form-group">
          <label for="startDate">Startdatum:</label>
          <input id="startDate" v-model="task.startDate" type="date" required v-if="task.frequency !== 'custom'" />
        </div>
        <div class="form-group">
          <label for="endDate">Einddatum (optioneel):</label>
          <input id="endDate" v-model="task.endDate" type="date" v-if="task.frequency !== 'custom'" />
        </div>
        <div class="form-group">
          <label for="frequency">Frequentie:</label>
          <select id="frequency" v-model="task.frequency" required>
            <option value="daily">Dagelijks</option>
            <option value="weekly">Wekelijks</option>
            <option value="monthly">Maandelijks</option>
            <option value="custom">Aangepast</option>
          </select>
        </div>
        <div v-if="task.frequency === 'custom'" class="form-group">
          <label>Aangepaste datums:</label>
          <div v-for="(customDate, index) in task.customDates" :key="index" class="custom-date-input">
            <input v-model="task.customDates[index]" type="date" required />
            <button type="button" class="remove-date" @click="removeCustomDate(index)"
              :disabled="task.customDates.length <= 1">Verwijder</button>
          </div>
          <button type="button" class="add-date" @click="addCustomDate">Datum toevoegen</button>
        </div>
      </div>
      <div class="form-group" v-if="(task.type === 'one-time' && task.date) || task.type === 'recurring'">
        <label for="startTime">Starttijd:</label>
        <input id="startTime" v-model="task.startTime" type="time" required />
      </div>
      <div class="form-group" v-if="(task.type === 'one-time' && task.date) || task.type === 'recurring'">
        <label for="endTime">Eindtijd:</label>
        <input id="endTime" v-model="task.endTime" type="time" required />
      </div>
      <div class="form-group">
        <label for="tags">Tags (door komma's gescheiden):</label>
        <input id="tags" v-model="task.tagsInput" type="text" placeholder="Voer tags in" />
      </div>
      <div class="form-actions">
        <button type="submit" title="Taak opslaan">Opslaan</button>
        <button type="button" @click="$router.push('/')" title="Annuleren">Annuleren</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTaskStore } from '../stores/tasks';
import { useRouter, useRoute } from 'vue-router';

const taskStore = useTaskStore();
const router = useRouter();
const route = useRoute();
const task = ref(null);

onMounted(async () => {
  await taskStore.loadTasks();
  const taskId = route.params.id;
  const found = taskStore.tasks.find(t => t.id === taskId);
  if (found) {
    // normalize values for the form
    task.value = {
      ...found,
      date: (found.dates && found.dates[0]) || '',
      tagsInput: (found.tags && found.tags.join(',')) || '',
      customDates: (found.scheduledDates && found.scheduledDates.map(d => d.date)) || (found.customDates || ['']),
      frequency: found.frequency || (found.scheduledDates ? 'recurring' : 'daily'),
      startTime: (found.scheduledDates && found.scheduledDates[0] && found.scheduledDates[0].startTime) || (found.timesByDate && Object.values(found.timesByDate)[0] && Object.values(found.timesByDate)[0].startTime) || '',
      endTime: (found.scheduledDates && found.scheduledDates[0] && found.scheduledDates[0].endTime) || (found.timesByDate && Object.values(found.timesByDate)[0] && Object.values(found.timesByDate)[0].endTime) || '',
    };
  } else {
    taskStore.error = 'Taak niet gevonden';
  }
});

const saveTask = async () => {
  if (!task.value.name || !task.value.name.trim()) {
    alert('Taaknaam is verplicht');
    return;
  }

  const updated = {
    name: task.value.name.trim(),
    type: task.value.type,
    completed: task.value.completed || false,
    tags: task.value.tagsInput ? task.value.tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [],
  };

  if (updated.type === 'one-time') {
    if (!task.value.date) {
      updated.dates = [];
      updated.timesByDate = {};
    } else {
      if (!task.value.startTime || !task.value.endTime) {
        alert('Starttijd en eindtijd zijn verplicht als er een datum is opgegeven.');
        return;
      }
      updated.dates = [task.value.date];
      updated.timesByDate = {
        [task.value.date]: {
          startTime: task.value.startTime,
          endTime: task.value.endTime,
        },
      };
    }
  } else if (updated.type === 'recurring') {
    updated.startDate = task.value.startDate;
    updated.endDate = task.value.endDate;
    updated.frequency = task.value.frequency;
    // regenerate scheduledDates similar to AddTask.generateScheduledDates (minimal)
    const dates = [];
    if (task.value.frequency === 'custom') {
      (task.value.customDates || []).forEach(d => {
        if (d) dates.push({ date: d, startTime: task.value.startTime || '09:00', endTime: task.value.endTime || '10:00' });
      });
    } else if (task.value.startDate) {
      const start = new Date(task.value.startDate);
      const end = task.value.endDate ? new Date(task.value.endDate) : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
      let current = new Date(start);
      while (current <= end) {
        dates.push({ date: current.toISOString().split('T')[0], startTime: task.value.startTime || '09:00', endTime: task.value.endTime || '10:00' });
        if (task.value.frequency === 'daily') current.setDate(current.getDate() + 1);
        else if (task.value.frequency === 'weekly') current.setDate(current.getDate() + 7);
        else if (task.value.frequency === 'monthly') {
          current.setMonth(current.getMonth() + 1);
          current.setDate(start.getDate());
          if (current > end) break;
        }
      }
    }
    updated.scheduledDates = dates;
  }

  await taskStore.updateTask(route.params.id, updated);
  if (!taskStore.error) router.push('/');
};

const addCustomDate = () => {
  task.value.customDates = task.value.customDates || [''];
  task.value.customDates.push('');
};

const removeCustomDate = (index) => {
  task.value.customDates.splice(index, 1);
};
</script>

<style scoped>
/* reuse styles from AddTask.vue */
.edit-task {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: bold;
  margin-bottom: 5px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1em;
}

.custom-date-input {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

button[type="submit"] {
  padding: 10px;
  min-width: 100px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 1em;
}

button[type="submit"]:hover {
  background: #0056b3;
}
</style>
<!-- keep only the task editor (single template/script/style) -->