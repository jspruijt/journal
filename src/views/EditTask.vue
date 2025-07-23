<template>
  <div class="edit-task">
    <h1>Taak bewerken</h1>
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
            <input v-model="task.scheduledDates[index].startTime" type="time" required />
            <input v-model="task.scheduledDates[index].endTime" type="time" required />
            <button type="button" @click="removeCustomDate(index)" :disabled="task.customDates.length <= 1">Verwijder</button>
          </div>
          <button type="button" @click="addCustomDate">Datum toevoegen</button>
        </div>
      </div>
      <div v-if="(task.type === 'one-time' && task.date) || (task.type === 'recurring' && task.frequency !== 'custom')">
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
import { ref, onMounted, watch } from "vue";
import { useTaskStore } from "../stores/tasks";
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";

const taskStore = useTaskStore();
const router = useRouter();
const route = useRoute();
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
  customDates: [],
  dates: [],
  timesByDate: {},
  scheduledDates: [],
});

onMounted(() => {
  const rawIndex = route.params.index;
  console.log("Route params:", route.params);
  console.log("Task store tasks:", taskStore.tasks);
  const taskIndex = parseInt(rawIndex);
  if (isNaN(taskIndex)) {
    console.error("Invalid task index:", rawIndex);
    alert("Ongeldige taak-index. Ga terug en probeer opnieuw.");
    router.push("/");
    return;
  }
  const taskData = taskStore.tasks[taskIndex];
  console.log("Loaded task data:", taskData);
  if (taskData && taskIndex >= 0 && taskIndex < taskStore.tasks.length) {
    task.value = {
      name: taskData.name || "",
      type: taskData.type || "one-time",
      date: taskData.dates && taskData.dates.length > 0 ? taskData.dates[0] : "",
      startDate: taskData.startDate || "",
      endDate: taskData.endDate || "",
      frequency: taskData.frequency || "daily",
      startTime: taskData.type === "one-time" && taskData.dates && taskData.dates.length > 0
        ? taskData.timesByDate[taskData.dates[0]]?.startTime || ""
        : taskData.scheduledDates && taskData.scheduledDates.length > 0
          ? taskData.scheduledDates[0].startTime || "09:00" // Default waarde
          : "09:00",
      endTime: taskData.type === "one-time" && taskData.dates && taskData.dates.length > 0
        ? taskData.timesByDate[taskData.dates[0]]?.endTime || ""
        : taskData.scheduledDates && taskData.scheduledDates.length > 0
          ? taskData.scheduledDates[0].endTime || "10:00" // Default waarde
          : "10:00",
      tagsInput: taskData.tags ? taskData.tags.join(", ") : "",
      completed: taskData.completed || false,
      customDates: taskData.scheduledDates
        ? taskData.scheduledDates.map(d => d.date)
        : [],
      dates: taskData.dates || [],
      timesByDate: taskData.timesByDate || {},
      scheduledDates: taskData.scheduledDates || [],
    };
  } else {
    console.error("Invalid task index or task data not found:", taskIndex);
    alert("Taak niet gevonden. Ga terug en probeer opnieuw.");
    router.push("/");
  }
});

const saveTask = () => {
  if (!task.value.name.trim() || task.value.name.includes("<!--")) {
    alert("Taaknaam mag niet leeg zijn en geen ongeldige HTML bevatten (bijv. <!--).");
    return;
  }

  const taskIndex = parseInt(route.params.index);
  const updatedTask = {
    name: task.value.name.trim(),
    type: task.value.type,
    completed: task.value.completed,
    tags: task.value.tagsInput ? task.value.tagsInput.split(",").map(tag => tag.trim()).filter(tag => tag) : [],
  };

  if (updatedTask.type === "one-time") {
    if (!task.value.date) {
      updatedTask.dates = [];
      updatedTask.timesByDate = {};
    } else {
      if (!task.value.startTime || !task.value.endTime) {
        alert("Starttijd en eindtijd zijn verplicht als er een datum is opgegeven.");
        return;
      }
      if (!task.value.startTime.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/) || !task.value.endTime.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
        alert("Starttijd en eindtijd moeten geldige tijdformaten zijn (bijv. 09:00).");
        return;
      }
      updatedTask.dates = [task.value.date];
      updatedTask.timesByDate = {
        [task.value.date]: {
          startTime: task.value.startTime,
          endTime: task.value.endTime,
        },
      };
    }
  } else if (updatedTask.type === "recurring") {
    if (!task.value.startDate && task.value.frequency !== "custom") {
      alert("Startdatum is verplicht voor een terugkerende taak (behalve bij 'Aangepast').");
      return;
    }
    // Controleer of er een geldige starttijd en eindtijd is, gebruik scheduledDates als fallback
    const hasValidGlobalTimes = task.value.startTime && task.value.endTime &&
      task.value.startTime.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/) &&
      task.value.endTime.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/);
    const hasValidScheduledTimes = task.value.scheduledDates.some(d => d.startTime && d.endTime);
    if ((task.value.startDate || task.value.customDates.some(d => d)) && !hasValidGlobalTimes && !hasValidScheduledTimes) {
      alert("Starttijd en eindtijd zijn verplicht als er een datum is opgegeven.");
      return;
    }
    updatedTask.startDate = task.value.startDate;
    updatedTask.endDate = task.value.endDate;
    updatedTask.frequency = task.value.frequency;
    updatedTask.scheduledDates = generateScheduledDates();
  }

  taskStore.updateTask(taskIndex, updatedTask);
  router.push("/");

  function generateScheduledDates() {
    const dates = [];
    if (task.value.frequency === "custom") {
      task.value.customDates.forEach((date, index) => {
        if (date) {
          dates.push({
            date: date,
            startTime: task.value.scheduledDates[index]?.startTime || task.value.startTime || "09:00",
            endTime: task.value.scheduledDates[index]?.endTime || task.value.endTime || "10:00",
            completed: task.value.scheduledDates[index]?.completed || false,
          });
        }
      });
    } else {
      const start = new Date(task.value.startDate);
      const end = task.value.endDate ? new Date(task.value.endDate) : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
      let current = new Date(start);

      while (current <= end) {
        const existingDate = task.value.scheduledDates.find(d => d.date === current.toISOString().split("T")[0]);
        dates.push({
          date: current.toISOString().split("T")[0],
          startTime: existingDate?.startTime || task.value.startTime || "09:00",
          endTime: existingDate?.endTime || task.value.endTime || "10:00",
          completed: existingDate?.completed || false,
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
  task.value.scheduledDates.push({ startTime: task.value.startTime || "09:00", endTime: task.value.endTime || "10:00", completed: false });
};

const removeCustomDate = (index) => {
  task.value.customDates.splice(index, 1);
  task.value.scheduledDates.splice(index, 1);
};

// Watch voor type wijziging om waarschuwing te geven als er planningdata verloren gaat
watch(() => task.value.type, (newType, oldType) => {
  if (oldType === "recurring" && newType === "one-time" && (task.value.startDate || task.value.customDates.length > 0)) {
    if (!confirm("Het wijzigen van het type naar 'Eenmalig' verwijdert de huidige planning. Wil je doorgaan?")) {
      task.value.type = oldType;
    }
  } else if (oldType === "one-time" && newType === "recurring" && task.value.date) {
    if (!confirm("Het wijzigen van het type naar 'Herhalend' verwijdert de huidige datum. Wil je doorgaan?")) {
      task.value.type = oldType;
    }
  }
});
</script>

<style scoped>
.edit-task {
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

select[disabled] {
  background-color: #e9ecef;
  cursor: not-allowed;
}
</style>