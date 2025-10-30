<template>
  <div id="app">
    <AuthButtons v-if="!user" />
    <div v-if="user">
      <header class="main-header">
        <AuthButtons :user="user" />
        <nav class="main-nav">
          <button class="spacex-nav-btn" @click="$router.push('/')">HOME</button>
          <button class="spacex-nav-btn" @click="$router.push('/unplanned-tasks')">ONGEPLANDE TAKEN <span
              class="counter">{{ unplannedTasksCount }}</span></button>
          <button class="spacex-nav-btn" @click="$router.push('/goals')">DOELEN <span class="counter">{{
            activeGoalsCount }}</span></button>
          <button class="spacex-nav-btn" @click="$router.push('/dashboard')">DASHBOARD</button>
        </nav>
      </header>
      <main class="main-content">
        <router-view />
      </main>
    </div>
    <div v-else>
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTaskStore } from './stores/tasks';
import { useGoalStore } from './stores/goals';
import { useRouter } from 'vue-router';
import AuthButtons from './components/AuthButtons.vue';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const user = ref(null);

onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, async (u) => {
    user.value = u;
    if (u) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await taskStore.loadTasks();
      await goalStore.loadGoals();
    }
    unsubscribe();
  });
});

const taskStore = useTaskStore();
const goalStore = useGoalStore();
const router = useRouter();

const unplannedTasksCount = computed(() => {
  return taskStore.tasks.filter((task) => {
    const hasNoDates = !task.dates || task.dates.length === 0;
    const hasNoScheduledDates = !task.scheduledDates || task.scheduledDates.length === 0;
    return hasNoDates && hasNoScheduledDates;
  }).length;
});

const activeGoalsCount = computed(() => {
  return goalStore.activeGoalsCount;
});
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.main-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.5em 2em 0 2em;
  background: var(--color-bg-alt);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1.5em;
}

.main-nav {
  display: flex;
  gap: 2.2em;
  margin-top: 1.2em;
}

.spacex-nav-btn {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: 0;
  padding: 0.35em 1.2em;
  font-size: 0.98em;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background var(--transition), color var(--transition), border var(--transition), transform var(--transition);
}

.spacex-nav-btn:hover {
  background: var(--color-primary);
  color: var(--color-bg);
  border-color: var(--color-accent);
  transform: translateY(-2px) scale(1.04);
}

.counter {
  background: var(--color-danger);
  color: #fff;
  border-radius: 50%;
  padding: 0.2em 0.7em;
  font-size: 0.9em;
  margin-left: 0.5em;
}

.main-content {
  padding: 2em;
  max-width: 900px;
  margin: 0 auto;
}
</style>