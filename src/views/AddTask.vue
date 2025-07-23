<template>
  <div class="add-task">
    <h1>Taak toevoegen</h1>
    <form @submit.prevent="saveTask">
      <div>
        <label for="name">Taaknaam:</label>
        <input id="name" v-model="task.name" type="text" required />
      </div>
      <div>
        <label for="type">Type:</label>
        <select id="type" v-model="task.type" required>
          <option value="one-time">Eenmalig</option>
          <option value="recurring">Herhalend</option>
        </select>
      </div>
      <div v-if="task.type === 'one-time'">
        <label for="date">Datum (optioneel):</label>
        <input id="date" v-model="task.date" type="date" />
      </div>
      <div v-if="task.type === 'recurring'">
        <label for="startDate">Startdatum:</label>
        <input id="startDate" v-model="task.startDate" type="date" required v-if="task.frequency !== 'custom'" />
        <label for="endDate">Einddatum (optioneel):</label>
        <input id="endDate" v-model="task.endDate" type="date" v-if="task.frequency !== 'custom'" />
        <label for="frequency">Frequentie:</label>
        <select id="frequency" v-model="task.frequency" required>
          <option value="daily">Dagelijks</option>
          <option value="weekly">Wekelijks</option>
          <option value="monthly">Maandelijks</option>
          <option value="custom">Aangepast</option>
        </select>
        <div v-if="task.frequency === 'custom'">
          <label>Aangepaste datums:</label>
          <div v-for="(customDate, index) in task.customDates" :key="index" class="custom-date-input">
            <input v-model="task.customDates[index]" type="date" required />
            <button type="button" @click="removeCustomDate(index)" :disabled="task.customDates.length <= 1">Verwijder</button>
          </div>
          <button type="button" @click="addCustomDate">Datum toevoegen</button>
        </div>
      </div>
      <div v-if="(task.type === 'one-time' && task.date) || task.type === 'recurring'">
        <label for="startTime">Starttijd:</label>
        <input id="startTime" v-model="task.startTime" type="time" required />
        <label for="endTime">Eindtijd:</label>
        <input id="endTime" v-model="task.endTime" type="time" required />
      </div>
      <div>
        <label for="tags">Tags (comma-separated):</label>
        <input id="tags" v-model="task.tagsInput" type="text" />
      </div>
      <button type="submit">Opslaan</button>
      <button type="button" @click="$router.push('/')">Annuleren</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useTaskStore } from "../stores/tasks";
import { useRouter } from "vue-router";

const taskStore = useTaskStore();
const router = useRouter();
const task = ref({
  name: "",
  type: "one-time",
  date: "",
  startDate: "",
  endDate: "",
  frequency: "daily",
  startTime: "",
  endTime: "",
  tagsInput: "",
  completed: false,
  customDates: [""], // Array voor aangepaste datums
});

const saveTask = () => {
  // Valideer invoer om ongeldige karakters te voorkomen
  if (!task.value.name.trim() || task.value.name.includes("<!--")) {
    alert("Taaknaam mag niet leeg zijn en geen ongeldige HTML bevatten (bijv. <!--).");
    return;
  }

  const newTask = {
    name: task.value.name.trim(),
    type: task.value.type,
    completed: task.value.completed,
    tags: task.value.tagsInput ? task.value.tagsInput.split(",").map(tag => tag.trim()).filter(tag => tag) : [],
  };

  if (newTask.type === "one-time") {
    if (!task.value.date) {
      newTask.dates = [];
      newTask.timesByDate = {};
    } else {
      if (!task.value.startTime || !task.value.endTime) {
        alert("Starttijd en eindtijd zijn verplicht als er een datum is opgegeven.");
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
  } else if (newTask.type === "recurring") {
    if (!task.value.startDate && task.value.frequency !== "custom") {
      alert("Startdatum is verplicht voor een terugkerende taak (behalve bij 'Aangepast').");
      return;
    }
    if ((task.value.startDate || task.value.customDates.some(d => d)) && (!task.value.startTime || !task.value.endTime)) {
      alert("Starttijd en eindtijd zijn verplicht als er een datum is opgegeven.");
      return;
    }
    newTask.startDate = task.value.startDate;
    newTask.endDate = task.value.endDate;
    newTask.frequency = task.value.frequency;
    newTask.scheduledDates = generateScheduledDates();
  }

  taskStore.addTask(newTask);
  router.push("/");

  function generateScheduledDates() {
    const dates = [];
    if (task.value.frequency === "custom") {
      task.value.customDates.forEach(date => {
        if (date) {
          dates.push({
            date: date,
            startTime: task.value.startTime || "09:00",
            endTime: task.value.endTime || "10:00",
          });
        }
      });
    } else {
      const start = new Date(task.value.startDate);
      const end = task.value.endDate ? new Date(task.value.endDate) : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
      let current = new Date(start);

      while (current <= end) {
        dates.push({
          date: current.toISOString().split("T")[0],
          startTime: task.value.startTime || "09:00",
          endTime: task.value.endTime || "10:00",
        });
        if (task.value.frequency === "daily") current.setDate(current.getDate() + 1);
        else if (task.value.frequency === "weekly") current.setDate(current.getDate() + 7);
        else if (task.value.frequency === "monthly") {
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
  task.value.customDates.push("");
};

const removeCustomDate = (index) => {
  task.value.customDates.splice(index, 1);
};
</script>

<style scoped>
.add-task {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

div {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: bold;
  margin-bottom: 5px;
}

input,
select {
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1em;
}

.custom-date-input {
  display: flex;
  gap: 10px;
  margin-top: 5px;
}

.custom-date-input button {
  padding: 5px 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.custom-date-input button:hover {
  background: #c82333;
}

.custom-date-input button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

button[type="button"]:not(.custom-date-input button) {
  padding: 10px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

button[type="button"]:not(.custom-date-input button):hover {
  background: #218838;
}

button[type="submit"] {
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

button[type="submit"]:hover {
  background: #0056b3;
}

button[type="button"]:not(.custom-date-input button) {
  background: #6c757d;
}

button[type="button"]:not(.custom-date-input button):hover {
  background: #5a6268;
}
</style>