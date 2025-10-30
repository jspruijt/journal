<template>
  <div class="goals-overview">
    <h1>Doelen Overzicht</h1>
    <div class="action-bar">
      <button class="action-button add-goal" @click="$router.push('/add-goal')" title="Doel toevoegen">
        <span class="add-goal-icon">🎯</span>
      </button>
    </div>
    <div v-if="goalStore.isLoading" class="loading">Laden...</div>
    <div v-else-if="goalStore.error" class="error">{{ goalStore.error }}</div>
    <div v-else-if="goalStore.goals.length === 0" class="no-goals">
      Geen doelen beschikbaar. Voeg een nieuw doel toe!
    </div>
    <div v-else class="goals-list">
      <div v-for="goal in goalStore.goals" :key="goal.id" class="card goal-item" :class="{ completed: goal.completed }">
        <div class="goal-content">
          <h3 class="goal-title">
            <a :href="`/goal/${goal.id}`" @click.prevent="$router.push(`/goal/${goal.id}`)" class="goal-link">
              {{ goal.title }}
            </a>
          </h3>
          <p class="desc">{{ goal.description }}</p>
          <p class="deadline" v-if="goal.deadline">Deadline: {{ formatDate(goal.deadline) }}</p>
          <p class="deadline" v-else>Geen deadline</p>
          <p class="next-eval" v-if="goal.nextEvaluationDate">Volgende evaluatie: {{ formatDate(goal.nextEvaluationDate)
          }}</p>
        </div>
        <div class="goal-actions">
          <button class="spacex-blue-btn" @click="toggleCompletion(goal.id)"
            :title="goal.completed ? 'Markeer als onvoltooid' : 'Markeer als voltooid'">
            {{ goal.completed ? '🔄' : '✔' }}
          </button>
          <button class="spacex-blue-btn" @click="$router.push(`/edit-goal/${goal.id}`)"
            title="Doel bewerken">Bewerk</button>
          <button class="spacex-blue-btn delete" @click="deleteGoal(goal.id)"
            title="Doel verwijderen">Verwijder</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGoalStore } from '../stores/goals';
import { onMounted } from 'vue';

const goalStore = useGoalStore();

onMounted(() => {
  goalStore.loadGoals();
});

function formatDate(dateString) {
  if (!dateString) return 'Geen datum';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function snippet(text, max = 80) {
  if (!text) return '';
  try {
    const str = String(text).replace(/\s+/g, ' ').trim();
    if (str.length <= max) return str;
    return str.slice(0, max - 1).trim() + '…';
  } catch (e) {
    return '';
  }
}

async function toggleCompletion(goalId) {
  await goalStore.toggleGoalCompletion(goalId);
}

async function deleteGoal(goalId) {
  if (confirm('Weet je zeker dat je dit doel wilt verwijderen?')) {
    await goalStore.deleteGoal(goalId);
  }
}
</script>

<style scoped>
.goals-overview {
  padding: 2.5em 1.5em 2em 1.5em;
  max-width: 1100px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 2em;
}

.action-button.add-goal {
  width: 38px;
  height: 38px;
  border-radius: 0;
  background: #007bff;
  color: #fff;
  font-size: 1.3em;
  box-shadow: none;
  border: none;
  transition: background var(--transition), transform var(--transition);
}

.action-button.add-goal:hover {
  background: #0056b3;
  transform: scale(1.08);
}

.action-button.add-goal {
  width: 42px;
  height: 42px;
  border-radius: 0;
  background: #007bff;
  color: #fff;
  font-size: 1.5em;
  box-shadow: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background var(--transition), transform var(--transition);
}

.action-button.add-goal:hover {
  background: #0056b3;
  transform: scale(1.08);
}

.add-goal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
  width: 100%;
  height: 100%;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 2em;
}

.goal-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-alt);
  border-radius: 0;
  box-shadow: var(--shadow);
  padding: 2em 2.5em;
  transition: box-shadow var(--transition), background var(--transition);
}

.goal-item.completed {
  opacity: 0.7;
  filter: grayscale(0.2);
}

.goal-title {
  margin: 0 0 0.5em 0;
  font-size: 1.3em;
  text-transform: uppercase;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.goal-link {
  color: var(--color-primary);
  text-decoration: underline;
  cursor: pointer;
  transition: color var(--transition);
  font-size: 1.1em;
}

.goal-link:hover {
  color: var(--color-primary-hover);
}

.desc {
  color: var(--color-text);
  margin-bottom: 0.5em;
}

.deadline,
.next-eval {
  font-size: 0.98em;
  color: var(--color-accent);
}

.goal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.7em;
  margin-left: 2em;
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

.loading,
.error,
.no-goals {
  text-align: center;
  font-size: 1.1em;
  margin-top: 2em;
}

.error {
  color: var(--color-danger);
}
</style>