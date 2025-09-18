<template>
  <div id="app">
    <div v-if="!user" class="auth-container">
      <AuthButtons />
    </div>
    <div v-else>
      <AuthButtons />
      <router-view />
      <div class="floating-action-bar">
        <button class="action-button add-task" @click="$router.push('/add-task')" title="Taak toevoegen">
          <span>+</span>
        </button>
        <button class="action-button view-unplanned" @click="$router.push('/unplanned-tasks')" title="Ongeplande taken">
          <span>📋</span><span class="counter">{{ unplannedTasksCount }}</span>
        </button>
        <button class="action-button go-home" @click="$router.push('/')" title="Ga naar homescherm">
          <span>🏠</span>
        </button>
        <button class="action-button go-dashboard" @click="$router.push('/dashboard')" title="Ga naar dashboard">
          <span>📊</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTaskStore } from './stores/tasks';
import { useRouter } from 'vue-router';
import AuthButtons from './components/AuthButtons.vue';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const user = ref(null);

onMounted(() => {
  onAuthStateChanged(auth, (u) => {
    user.value = u;
  });
});

const taskStore = useTaskStore();
const router = useRouter();
const unplannedTasksCount = computed(() => {
  return taskStore.tasks.filter((task) => {
    const hasNoDates = !task.dates || task.dates.length === 0;
    const hasNoScheduledDates = !task.scheduledDates || task.scheduledDates.length === 0;
    return hasNoDates && hasNoScheduledDates;
  }).length;
});
</script>

<style scoped>
#app {
  min-height: 100vh;
  position: relative;
  padding-bottom: 80px;
}

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.floating-action-bar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
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

.action-button span {
  margin: 0;
}

.add-task span {
  font-size: 1.8em;
}

.view-unplanned {
  position: relative;
}

.counter {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>