<template>
  <div class="add-goal card">
    <h1>Nieuw doel toevoegen</h1>
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
          rows="4"></textarea>
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
          <button class="spacex-blue-btn delete" type="button" @click="removeStep(index)"
            :disabled="goal.steps.length <= 1">-</button>
        </div>
        <button class="spacex-blue-btn" type="button" @click="addStep">Stap toevoegen</button>
      </div>
      <div class="form-group">
        <label for="howToAchieve">Hoe behaal ik dit doel</label>
        <textarea v-model="goal.howToAchieve" id="howToAchieve"
          placeholder="Wat ga je praktisch doen om het doel te behalen?" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label for="fallbackPlan">Wat doe ik als het niet goed gaat</label>
        <textarea v-model="goal.fallbackPlan" id="fallbackPlan" placeholder="Plan B / wat te doen bij tegenslag"
          rows="2"></textarea>
      </div>
      <div class="form-actions">
        <button class="spacex-blue-btn" type="submit" title="Doel toevoegen">Opslaan</button>
        <button class="spacex-blue-btn delete" type="button" @click="$router.push('/goals')"
          title="Annuleren">Annuleren</button>
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
  nextEvaluationDate: '',
  steps: [''],
  howToAchieve: '',
  fallbackPlan: '',
});

async function addGoal() {
  if (!goal.value.title.trim() || goal.value.title.includes("<!--")) {
    goalStore.error = 'Titel is verplicht en mag geen ongeldige HTML bevatten (bijv. <!--).';
    return;
  }
  // ...bestaande addGoal logica...
}
</script>

<style scoped>
.add-goal {
  max-width: 700px;
  margin: 0 auto;
  padding: 2.5em 2em 2em 2em;
  background: var(--color-bg-alt);
  border-radius: 0;
  box-shadow: var(--shadow);
  border: 1.5px solid var(--color-border);
}

h1 {
  margin-bottom: 1.2em;
  font-size: 2em;
  color: var(--color-primary);
  text-transform: uppercase;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.form-group {
  margin-bottom: 1.2em;
  display: flex;
  flex-direction: column;
  gap: 0.3em;
}

label {
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.2em;
  text-transform: uppercase;
  font-size: 0.98em;
  letter-spacing: 0.04em;
}

input,
textarea {
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

.form-actions {
  display: flex;
  gap: 1.2em;
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
</style>