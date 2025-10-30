<template>
    <div class="goal-detail card">
        <h1>{{ goal?.title || 'Doel' }}</h1>
        <div v-if="goalStore.isLoading" class="loading">Laden...</div>
        <div v-else-if="goalStore.error" class="error">{{ goalStore.error }}</div>
        <div v-else-if="!goal" class="error">Doel niet gevonden</div>
        <div v-else class="detail-content">
            <p class="description">{{ goal.description }}</p>
            <div class="meta">
                <span v-if="goal.createdAt">Aangemaakt op: {{ formatDate(goal.createdAt) }}</span>
                <span v-if="goal.deadline">Deadline: {{ formatDate(goal.deadline) }}</span>
                <span v-if="goal.nextEvaluationDate">Volgende evaluatie: {{ formatDate(goal.nextEvaluationDate)
                    }}</span>
            </div>
            <div v-if="goal.steps && goal.steps.length" class="section">
                <h3>Stappen / Benodigdheden</h3>
                <ol>
                    <li v-for="(s, i) in goal.steps" :key="i">{{ s }}</li>
                </ol>
            </div>
            <div v-if="goal.howToAchieve" class="section">
                <h3>Hoe behaal ik dit doel</h3>
                <p>{{ goal.howToAchieve }}</p>
            </div>
            <div v-if="goal.fallbackPlan" class="section">
                <h3>Wat doe ik als het niet goed gaat</h3>
                <p>{{ goal.fallbackPlan }}</p>
            </div>
            <div class="actions">
                <button @click="toggleCompletion(goal.id)">{{ goal.completed ? 'Markeer onvoltooid' : 'Markeer voltooid'
                    }}</button>
                <button @click="$router.push(`/edit-goal/${goal.id}`)">Bewerk</button>
                <button class="delete" @click="deleteGoal(goal.id)">Verwijder</button>
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
.goal-detail {
    max-width: 900px;
    margin: 2em auto;
    padding: 2em;
    background: var(--color-bg-alt);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    border: 1px solid var(--color-border);
}

h1 {
    margin-bottom: 1.2em;
    font-size: 2em;
}

.description {
    font-size: 1.1em;
    margin-bottom: 1.2em;
    color: var(--color-text);
}

.meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5em;
    font-size: 0.98em;
    color: var(--color-accent);
    margin-bottom: 1.2em;
}

.section {
    margin-bottom: 1.5em;
}

.actions {
    display: flex;
    gap: 1em;
    margin-top: 2em;
}

.actions button {
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: var(--radius);
    padding: 0.6em 1.2em;
    font-size: 1em;
    cursor: pointer;
    box-shadow: var(--shadow);
    transition: background var(--transition), transform var(--transition);
}

.actions button.delete {
    background: var(--color-danger);
}

.actions button:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px) scale(1.04);
}

.actions button.delete:hover {
    background: #b91c1c;
}

.loading,
.error {
    text-align: center;
    font-size: 1.1em;
    margin-top: 2em;
}

.error {
    color: var(--color-danger);
}
</style>
