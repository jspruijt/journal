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
        <label>Gekoppelde taken</label>
        <div v-if="tasksForGoal.length === 0">Er zijn nog geen taken gekoppeld.</div>
        <ol v-else>
          <li v-for="task in tasksForGoal" :key="task.id">{{ task.name }}</li>
        </ol>
        <div class="form-actions">
          <button class="spacex-blue-btn" type="button" @click="linkTaskToGoal">Taak koppelen</button>
        </div>
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
        <button class="spacex-blue-btn" type="button" @click="updateGoal" title="Doel opslaan">Opslaan</button>
        <button class="spacex-blue-btn delete" type="button" @click="$router.push('/goals')"
          title="Annuleren">Annuleren</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useGoalStore } from '../stores/goals';
import { useTaskStore } from '../stores/tasks';
import { useRouter, useRoute } from 'vue-router';

const goalStore = useGoalStore();
const taskStore = useTaskStore();
const router = useRouter();
const route = useRoute();
const goal = ref(null);
const tasksForGoal = computed(() => taskStore.tasks.filter(t => t.goalId === goal.value?.id));

onMounted(async () => {
  await goalStore.loadGoals();
  await taskStore.loadTasks();
  const goalId = route.params.id;
  const foundGoal = goalStore.goals.find(g => g.id === goalId);
  if (foundGoal) {
    goal.value = { ...foundGoal, deadline: foundGoal.deadline || '', nextEvaluationDate: foundGoal.nextEvaluationDate || '', howToAchieve: foundGoal.howToAchieve || '', fallbackPlan: foundGoal.fallbackPlan || '' };
  } else {
    goalStore.error = 'Doel niet gevonden';
  }
});

function linkTaskToGoal() {
  router.push(`/goal/${goal.value.id}/link-task`);
}

async function updateGoal() {
  if (!goal.value.title) {
    goalStore.error = 'Titel is verplicht';
    return;
  }
  const updated = {
    ...goal.value,
    nextEvaluationDate: goal.value.nextEvaluationDate || null,
  };
  await goalStore.updateGoal(route.params.id, updated);
  if (!goalStore.error) {
    router.push('/goals');
  }
}
</script>

<style scoped>
.edit-goal {
  padding: 20px;
  max-width: 700px;
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
  margin-bottom: 1.2em;
  display: flex;
  flex-direction: column;
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