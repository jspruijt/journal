<template>
  <div class="goal-detail">
    <h1>{{ goal?.title || 'Doel' }}</h1>
    <div v-if="goalStore.isLoading" class="loading">Laden...</div>
    <div v-else-if="goalStore.error" class="error">{{ goalStore.error }}</div>
    <div v-else-if="!goal" class="error">Doel niet gevonden</div>
    <div v-else class="detail">
      <p class="description">{{ goal.description }}</p>
      <p v-if="goal.createdAt">Aangemaakt op: {{ formatDate(goal.createdAt) }}</p>
      <p v-if="goal.deadline">Deadline: {{ formatDate(goal.deadline) }}</p>
      <p v-if="goal.nextEvaluationDate">Volgende evaluatie: {{ formatDate(goal.nextEvaluationDate) }}</p>
      <div v-if="goal.steps && goal.steps.length">
        <h3>Stappen / Benodigdheden</h3>
        <ol>
          <li v-for="(s, i) in goal.steps" :key="i">{{ s }}</li>
        </ol>
      </div>
      <div v-if="goal.howToAchieve">
        <h3>Hoe behaal ik dit doel</h3>
        <p>{{ goal.howToAchieve }}</p>
      </div>
      <div v-if="goal.fallbackPlan">
        <h3>Wat doe ik als het niet goed gaat</h3>
        <p>{{ goal.fallbackPlan }}</p>
      </div>
      <div class="actions">
        <button @click="toggleCompletion(goal.id)">{{ goal.completed ? 'Markeer onvoltooid' : 'Markeer voltooid' }}</button>
        <button @click="$router.push(`/edit-goal/${goal.id}`)">Bewerk</button>
        <button @click="deleteGoal(goal.id)">Verwijder</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useGoalStore } from '../stores/goals';
import { useRoute, useRouter } from 'vue-router';

const goalStore = useGoalStore();
const route = useRoute();
const router = useRouter();
const goal = ref(null);

onMounted(async () => {
  await goalStore.loadGoals();
  const id = route.params.id;
  const found = goalStore.goals.find(g => g.id === id);
  if (found) goal.value = found;
});

function formatDate(dateString) {
  if (!dateString) return 'Geen datum';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function toggleCompletion(id) {
  await goalStore.toggleGoalCompletion(id);
  await goalStore.loadGoals();
  const found = goalStore.goals.find(g => g.id === id);
  if (found) goal.value = found;
}

async function deleteGoal(id) {
  if (confirm('Weet je zeker dat je dit doel wilt verwijderen?')) {
    await goalStore.deleteGoal(id);
    router.push('/goals');
  }
}
</script>

<style scoped>
.goal-detail { padding: 20px; max-width: 800px; margin: 0 auto; }
.actions { display:flex; gap:10px; margin-top:20px; }
.actions button { padding:8px 12px; border-radius:4px; border:none; background:#007bff; color:white; }
</style>
