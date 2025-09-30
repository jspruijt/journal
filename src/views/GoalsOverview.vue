<template>
  <div class="goals-overview">
    <h1>Doelen Overzicht</h1>
    <div class="action-bar">
      <button class="action-button add-goal" @click="$router.push('/add-goal')" title="Doel toevoegen">
        <span>🎯</span>
      </button>
    </div>
    <div v-if="goalStore.isLoading" class="loading">Laden...</div>
    <div v-else-if="goalStore.error" class="error">{{ goalStore.error }}</div>
    <div v-else-if="goalStore.goals.length === 0" class="no-goals">
      Geen doelen beschikbaar. Voeg een nieuw doel toe!
    </div>
    <div v-else class="goals-list">
      <div v-for="goal in goalStore.goals" :key="goal.id" class="goal-item" :class="{ completed: goal.completed }">
        <div class="goal-content">
          <h3>{{ goal.title }}</h3>
          <p>{{ goal.description }}</p>
          <p class="created-at">Aangemaakt op: {{ formatDate(goal.createdAt) }}</p>
          <p class="deadline" v-if="goal.deadline">Deadline: {{ formatDate(goal.deadline) }}</p>
          <p class="deadline" v-else>Geen deadline</p>
        </div>
        <div class="goal-actions">
          <button class="action-button" @click="toggleCompletion(goal.id)"
            :title="goal.completed ? 'Markeer als onvoltooid' : 'Markeer als voltooid'">
            <span>{{ goal.completed ? '🔄' : '✔' }}</span>
          </button>
          <button class="action-button" @click="$router.push(`/edit-goal/${goal.id}`)" title="Doel bewerken">
            <span>✏️</span>
          </button>
          <button class="action-button delete" @click="deleteGoal(goal.id)" title="Doel verwijderen">
            <span>🗑️</span>
          </button>
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
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.action-button.add-goal {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background-color: #007bff;
  color: white;
  font-size: 1.8em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.2s, transform 0.1s;
}

.action-button.add-goal:hover {
  background-color: #0056b3;
  transform: scale(1.1);
}

.loading,
.error,
.no-goals {
  text-align: center;
  font-size: 1.2em;
  margin-top: 20px;
}

.error {
  color: #dc3545;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.goal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.goal-item:hover {
  transform: translateY(-2px);
}

.goal-item.completed {
  background-color: #d4edda;
}

.goal-content {
  flex: 1;
}

.goal-content h3 {
  margin: 0 0 10px;
  font-size: 1.5em;
}

.goal-content p {
  margin: 0 0 5px;
  color: #555;
}

.created-at,
.deadline {
  font-size: 0.9em;
  color: #888;
}

.goal-actions {
  display: flex;
  gap: 10px;
}

.action-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: #007bff;
  color: white;
  font-size: 1.2em;
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

.action-button.delete {
  background-color: #dc3545;
}

.action-button.delete:hover {
  background-color: #b02a37;
}
</style>