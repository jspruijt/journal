<template>
  <div class="add-task card">
    <h1>Taak toevoegen</h1>
    <form @submit.prevent="saveTask" class="task-form">
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
        <button class="spacex-blue-btn" type="submit" title="Taak opslaan">Opslaan</button>
        <button class="spacex-blue-btn delete" type="button" @click="$router.push('/')"
          title="Annuleren">Annuleren</button>
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
const task = ref({
  name: '',
  type: 'one-time',
  date: '',
  startDate: '',
  endDate: '',
  frequency: 'daily',
  startTime: '',
  endTime: '',
  tagsInput: '',
  completed: false,
  customDates: [''],
  goalId: null,
});

onMounted(() => {
  if (route.query.goalId) {
    task.value.goalId = route.query.goalId;
  }
});

const saveTask = async () => {
  if (!task.value.name.trim() || task.value.name.includes('<!--')) {
    alert('Taaknaam mag niet leeg zijn en geen ongeldige HTML bevatten (bijv. <!--).');
    return;
  }

  const newTask = {
    name: task.value.name.trim(),
    type: task.value.type,
    completed: task.value.completed,
    tags: task.value.tagsInput ? task.value.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    goalId: task.value.goalId || null,
  };

  if (newTask.type === 'one-time') {
    if (!task.value.date) {
      newTask.dates = [];
      newTask.timesByDate = {};
    } else {
      if (!task.value.startTime || !task.value.endTime) {
        alert('Starttijd en eindtijd zijn verplicht als er een datum is opgegeven.');
        return;
      }
      newTask.dates = [task.value.date];
      newTask.timesByDate = {
        [task.value.date]: {
          startTime: task.value.startTime,
          endTime: task.value.endTime,
        },
      };
    }
  } else if (newTask.type === 'recurring') {
    if (!task.value.startDate && task.value.frequency !== 'custom') {
      alert("Startdatum is verplicht voor een terugkerende taak (behalve bij 'Aangepast').");
      return;
    }
    if ((task.value.startDate || task.value.customDates.some(d => d)) && (!task.value.startTime || !task.value.endTime)) {
      alert('Starttijd en eindtijd zijn verplicht als er een datum is opgegeven.');
      return;
    }
    newTask.startDate = task.value.startDate;
    newTask.endDate = task.value.endDate;
    newTask.frequency = task.value.frequency;
    newTask.scheduledDates = generateScheduledDates();
  }

  await taskStore.addTask(newTask);
  router.push('/');

  function generateScheduledDates() {
    const dates = [];
    if (task.value.frequency === 'custom') {
      task.value.customDates.forEach(date => {
        if (date) {
          dates.push({
            date: date,
            startTime: task.value.startTime || '09:00',
            endTime: task.value.endTime || '10:00',
          });
        }
      });
    } else {
      const start = new Date(task.value.startDate);
      const end = task.value.endDate ? new Date(task.value.endDate) : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
      let current = new Date(start);

      while (current <= end) {
        dates.push({
          date: current.toISOString().split('T')[0],
          startTime: task.value.startTime || '09:00',
          endTime: task.value.endTime || '10:00',
        });
        if (task.value.frequency === 'daily') current.setDate(current.getDate() + 1);
        else if (task.value.frequency === 'weekly') current.setDate(current.getDate() + 7);
        else if (task.value.frequency === 'monthly') {
          current.setMonth(current.getMonth() + 1);
          current.setDate(start.getDate());
          if (current > end) break;
        }
      }
    }
    return dates;
  }
};

const addCustomDate = () => {
  task.value.customDates.push('');
};

const removeCustomDate = (index) => {
  task.value.customDates.splice(index, 1);
};
</script>

<style scoped>
.add-task {
  max-width: 700px;
  margin: 0 auto;
  padding: 2.5em 2em 2em 2em;
  background: var(--color-bg-alt);
  border-radius: 0;
  box-shadow: var(--shadow);
  border: 1.5px solid var(--color-border);
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 1.2em;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.2em;
  gap: 0.3em;
}

.form-group label {
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.2em;
  text-transform: uppercase;
  font-size: 0.98em;
  letter-spacing: 0.04em;
}

.form-group input,
.form-group select,
.form-group textarea {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1.5px solid var(--color-border);
  border-radius: 0;
  padding: 0.7em 1.2em;
  font-size: 1em;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  margin-bottom: 0.2em;
  transition: border var(--transition), background var(--transition);
}

.custom-date-input {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  gap: 1.2em;
  justify-content: flex-end;
  margin-top: 2em;
}

.spacex-blue-btn {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 0;
  padding: 0.5em 1.7em;
  font-size: 1em;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background var(--transition), color var(--transition), border var(--transition), transform var(--transition);
}

.spacex-blue-btn:hover {
  background: #0056b3;
  color: #fff;
  transform: translateY(-2px) scale(1.04);
}

.spacex-blue-btn.delete {
  background: var(--color-danger);
}

.spacex-blue-btn.delete:hover {
  background: #b91c1c;
}

.remove-date {
  background: var(--color-danger);
  color: #fff;
  border: none;
  border-radius: 0;
  padding: 0.4em 1.2em;
  font-size: 0.95em;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background var(--transition), color var(--transition), border var(--transition), transform var(--transition);
}

.remove-date:hover {
  background: #b91c1c;
}

.remove-date:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
</style>