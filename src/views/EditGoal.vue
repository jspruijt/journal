<template>
  <div class="edit-goal">
    <h1>Doel Bewerken</h1>
    <div v-if="goalStore.isLoading" class="loading">Laden...</div>
    <div v-else-if="goalStore.error" class="error">{{ goalStore.error }}</div>
    <div v-else-if="!goal" class="error">Doel niet gevonden</div>
    <div v-else class="goal-form">
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
      <div class="form-group">
        <label for="nextEvaluationDate">Volgende evaluatie</label>
        <input v-model="goal.nextEvaluationDate" id="nextEvaluationDate" type="date" />
      </div>
      <div class="form-group">
        <label>Stappen / Benodigdheden</label>
        <div v-for="(step, index) in goal.steps" :key="index" class="step-row">
          <input v-model="goal.steps[index]" type="text" :placeholder="`Stap ${index + 1}`" />
          <button type="button" class="remove-step" @click="removeStep(index)"
            :disabled="goal.steps.length <= 1">Verwijder</button>
        </div>
        <button type="button" class="add-step" @click="addStep">Stap toevoegen</button>
      </div>
      <div class="form-group">
        <label for="howToAchieve">Hoe behaal ik dit doel</label>
        <textarea v-model="goal.howToAchieve" id="howToAchieve"
          placeholder="Wat ga je praktisch doen om het doel te behalen?" rows="4"></textarea>
      </div>
      <div class="form-group">
        <label for="fallbackPlan">Wat doe ik als het niet goed gaat</label>
        <textarea v-model="goal.fallbackPlan" id="fallbackPlan" placeholder="Plan B / wat te doen bij tegenslag"
          rows="3"></textarea>
      </div>
      <div class="form-actions">
        <button class="action-button" @click="updateGoal" title="Doel opslaan">
          <span>✔</span>
        </button>
        <button class="action-button cancel" @click="$router.push('/goals')" title="Annuleren">
          <span>❌</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useGoalStore } from '../stores/goals';
import { useRouter, useRoute } from 'vue-router';

const goalStore = useGoalStore();
const router = useRouter();
const route = useRoute();
const goal = ref(null);

onMounted(async () => {
  await goalStore.loadGoals();
  const goalId = route.params.id;
  const foundGoal = goalStore.goals.find(g => g.id === goalId);
  if (foundGoal) {
    goal.value = { ...foundGoal, deadline: foundGoal.deadline || '', nextEvaluationDate: foundGoal.nextEvaluationDate || '', steps: (foundGoal.steps && foundGoal.steps.length > 0) ? foundGoal.steps.slice() : [''], howToAchieve: foundGoal.howToAchieve || '', fallbackPlan: foundGoal.fallbackPlan || '' };
  } else {
    goalStore.error = 'Doel niet gevonden';
  }
});

async function updateGoal() {
  if (!goal.value.title) {
    goalStore.error = 'Titel is verplicht';
    return;
  }
  const updated = {
    ...goal.value,
    steps: (goal.value.steps || []).map(s => s.trim()).filter(Boolean),
    nextEvaluationDate: goal.value.nextEvaluationDate || null,
  };
  await goalStore.updateGoal(route.params.id, updated);
  if (!goalStore.error) {
    router.push('/goals');
  }
}

function addStep() {
  goal.value.steps = goal.value.steps || [''];
  goal.value.steps.push('');
}

function removeStep(index) {
  if (!goal.value.steps) return;
  if (goal.value.steps.length <= 1) return;
  goal.value.steps.splice(index, 1);
}
</script>

<style scoped>
.edit-goal {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
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
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.action-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background-color: #007bff;
  color: white;
  font-size: 1.5em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.2s, transform 0.1s;
}

.action-button:hover {
  background-color: #0056b3;
  transform: scale(1.1);
}

.action-button.cancel {
  background-color: #dc3545;
}

.action-button.cancel:hover {
  background-color: #b02a37;
}
</style>