<template>
  <div class="edit-task">
    <h1>Taak bewerken</h1>

    <div v-if="taskStore.isLoading" class="loading">Laden...</div>
    <div v-else-if="taskStore.error" class="error">{{ taskStore.error }}</div>
    <div v-else-if="!task" class="error">Taak niet gevonden</div>

    <form v-else @submit.prevent="saveTask" class="task-form">
      <!-- Taaknaam -->
      <div class="form-group">
        <label for="name">Taaknaam:</label>
        <input id="name" v-model="task.name" type="text" required placeholder="Voer de naam van de taak in" />
      </div>

      <!-- Type -->
      <div class="form-group">
        <label for="type">Type:</label>
        <select id="type" v-model="task.type" required>
          <option value="one-time">Eenmalig</option>
          <option value="recurring">Herhalend</option>
        </select>
      </div>

      <!-- Eenmalig: Datum -->
      <div class="form-group" v-if="task.type === 'one-time'">
        <label for="date">Datum (optioneel):</label>
        <input id="date" v-model="task.date" type="date" />
      </div>

      <!-- Herhalend: Start- en einddatum -->
      <div v-if="task.type === 'recurring'">
        <div class="form-group">
          <label for="startDate">Startdatum:</label>
          <input id="startDate" v-model="task.startDate" type="date" required v-if="task.frequency !== 'custom'" />
        </div>
        <div class="form-group">
          <label for="endDate">Einddatum (optioneel):</label>
          <input id="endDate" v-model="task.endDate" type="date" v-if="task.frequency !== 'custom'" />
        </div>

        <!-- Frequentie -->
        <div class="form-group">
          <label for="frequency">Frequentie:</label>
          <select id="frequency" v-model="task.frequency" required>
            <option value="daily">Dagelijks</option>
            <option value="weekly">Wekelijks</option>
            <option value="monthly">Maandelijks</option>
            <option value="custom">Aangepast</option>
          </select>
        </div>

        <!-- Aangepaste datums -->
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

      <!-- Start- en eindtijd -->
      <div class="form-group" v-if="(task.type === 'one-time' && task.date) || task.type === 'recurring'">
        <label for="startTime">Starttijd:</label>
        <input id="startTime" v-model="task.startTime" type="time" required />
      </div>
      <div class="form-group" v-if="(task.type === 'one-time' && task.date) || task.type === 'recurring'">
        <label for="endTime">Eindtijd:</label>
        <input id="endTime" v-model="task.endTime" type="time" required />
      </div>

      <!-- Tags -->
      <div class="form-group">
        <label for="tags">Tags (door komma's gescheiden):</label>
        <input id="tags" v-model="task.tagsInput" type="text" placeholder="bijv. werk, belangrijk" />
      </div>

      <!-- Knoppen -->
      <div class="form-actions">
        <button type="submit" class="spacex-blue-btn">Opslaan</button>
        <button type="button" @click="$router.push('/')" class="spacex-blue-btn secondary">Annuleren</button>
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

<<style scoped>
.edit-task {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5em 1.5em 2em 1.5em;
  font-size: 16px;
  min-height: 100vh;
  box-sizing: border-box;
  font-family: "Montserrat", "Segoe UI", Arial, sans-serif;
  background: var(--color-bg, #f9f9f9);
  color: var(--color-text, #333);

  /* Forceer SpaceX-blauw (onafhankelijk van thema) */
  --spacex-blue: #007bff;
  --spacex-blue-dark: #0069d9;
  --spacex-blue-darker: #005cc5;
}

h1 {
  color: var(--color-primary, var(--spacex-blue));
  text-align: center;
  font-size: 1.1em;
  margin-bottom: 1.2em;
  font-weight: 700;
  text-transform: uppercase;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 1.8em;
  max-width: 600px;
  margin: 0 auto;
  background: var(--color-bg, #fff);
  padding: 2em;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.08);
  border: 1px solid rgba(0, 123, 255, 0.15);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.6em;
}

.form-group label {
  font-weight: 600;
  color: var(--color-text, #333);
  font-size: 0.95em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-group input,
.form-group select {
  padding: 0.75em 1em;
  font-size: 1em;
  border: 2px solid #ddd;
  border-radius: 4px;
  transition: all 0.2s ease;
  background: var(--color-bg, #fff);
  color: var(--color-text, #333);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--spacex-blue);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
}

.custom-date-input {
  display: flex;
  gap: 0.8em;
  align-items: center;
  margin-top: 0.5em;
}

.custom-date-input input {
  flex: 1;
}

.remove-date,
.add-date {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5em 1em;
  border-radius: 4px;
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-date:hover,
.add-date:hover {
  transform: translateY(-1px);
}

.remove-date:hover {
  background: #c82333;
}

.add-date {
  background: #28a745;
  margin-top: 0.8em;
  align-self: flex-start;
}

.add-date:hover {
  background: #218838;
}

.form-actions {
  display: flex;
  gap: 1em;
  justify-content: flex-end;
  margin-top: 1em;
}

.spacex-blue-btn {
  background: var(--spacex-blue-dark);
  color: #fff;
  border: none;
  border-radius: 0;
  padding: 0.1em 0.1em;
  font-size: 0.95em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.spacex-blue-btn:hover {
  background: var(--spacex-blue-darker);
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.3);
}

.spacex-blue-btn.secondary {
  background: transparent;
  color: var(--spacex-blue);
  border: 2px solid var(--spacex-blue);
}

.spacex-blue-btn.secondary:hover {
  background: var(--spacex-blue);
  color: white;
}

/* Foutmelding & loading */
.error,
.loading {
  text-align: center;
  font-weight: 600;
  margin: 2em 0;
  font-size: 1.1em;
  }

  .error {
  color: #dc3545;
  }

  .loading {
  color: var(--spacex-blue);
  }

  
</style>