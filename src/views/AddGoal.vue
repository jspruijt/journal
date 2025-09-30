<template>
  <div class="add-goal">
    <h1>Doel Toevoegen</h1>
    <div v-if="goalStore.isLoading" class="loading">Laden...</div>
    <div v-else-if="goalStore.error" class="error">{{ goalStore.error }}</div>
    <form @submit.prevent="addGoal" class="goal-form">
      <div class="form-group">
        <label for="title">Titel</label>
        <input v-model="goal.title" id="title" type="text" placeholder="Voer de titel van het doel in" required />
      </div>
      <div class="form-group">
        <label for="description">Beschrijving</label>
        <textarea v-model="goal.description" id="description" placeholder="Voer een beschrijving in"
          rows="5"></textarea>
      </div>
      <div class="form-group">
        <label for="deadline">Deadline</label>
        <input v-model="goal.deadline" id="deadline" type="date" />
      </div>
      <div class="form-actions">
        <button type="submit" title="Doel toevoegen">Opslaan</button>
        <button type="button" @click="$router.push('/goals')" title="Annuleren">Annuleren</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useGoalStore } from '../stores/goals';
import { useRouter } from 'vue-router';

const goalStore = useGoalStore();
const router = useRouter();
const goal = ref({
  title: '',
  description: '',
  deadline: '',
});

async function addGoal() {
  if (!goal.value.title.trim() || goal.value.title.includes("<!--")) {
    goalStore.error = 'Titel is verplicht en mag geen ongeldige HTML bevatten (bijv. <!--).';
    return;
  }
  const newGoal = {
    title: goal.value.title.trim(),
    description: goal.value.description.trim(),
    deadline: goal.value.deadline,
    completed: false,
  };
  await goalStore.addGoal(newGoal);
  if (!goalStore.error) {
    router.push('/goals');
  }
}
</script>

<style scoped>
.add-goal {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading,
.error {
  text-align: center;
  font-size: 1.2em;
  margin-top: 20px;
}

.error {
  color: #dc3545;
}

.goal-form {
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
.form-group textarea {
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1em;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
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

button[type="button"] {
  padding: 10px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

button[type="button"]:hover {
  background: #5a6268;
}
</style>