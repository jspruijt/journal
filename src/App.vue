<template>
  <div id="app">
    <header class="main-header">
      <nav class="menu">
        <!-- Hamburger alleen op mobiel -->
        <button class="hamburger" @click="menuOpen = !menuOpen" v-if="isMobile">
          <span></span><span></span><span></span>
        </button>
        <!-- Desktop menu altijd zichtbaar -->
        <div class="menu-items-desktop" v-if="!isMobile">
          <button @click="$router.push('/')">Home</button>
          <button @click="$router.push('/unplanned-tasks')">Ongeplande taken</button>
          <button @click="$router.push('/goals')">Doelen</button>
          <button @click="$router.push('/dashboard')">Dashboard</button>
        </div>
        <!-- Account knop altijd rechts -->
        <div class="account-btn">
          <AuthButtons :user="user" />
        </div>
        <!-- Mobiel menu als overlay -->
        <transition name="fade">
          <div v-if="menuOpen && isMobile" class="menu-items-popup">
            <button @click="$router.push('/'); menuOpen = !menuOpen;">Home</button>
            <button @click="$router.push('/unplanned-tasks'); menuOpen = !menuOpen;">Ongeplande taken</button>
            <button @click="$router.push('/goals'); menuOpen = !menuOpen;">Doelen</button>
            <button @click="$router.push('/dashboard'); menuOpen = !menuOpen;">Dashboard</button>
          </div>
        </transition>
      </nav>
    </header>
    <main class="main-content">
      <router-view />
    </main>
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
const menuOpen = ref(false);

// Detecteer mobiel scherm
const isMobile = ref(window.innerWidth <= 700);
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth <= 700;
});

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

.main-header {
  width: 100%;
  background: var(--color-bg-alt, #181a20);
  border-bottom: 1px solid #222;
  padding: 0.5em 0;
  position: relative;
}

.menu {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
}

.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #444;
  border-radius: 8px;
  cursor: pointer;
  margin-right: 1em;
  position: absolute;
  left: 16px;
  top: 16px;
  z-index: 1200;
}

.hamburger span {
  display: block;
  height: 1px;
  width: 80%;
  background: #fff;
  margin: 3px 3px;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.menu-items-desktop {
  display: flex;
  margin: auto;
  gap: 1em;
}

.menu-items-desktop button {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 1em;
  cursor: pointer;
}

.account-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1200;
  background: none;
  box-shadow: none;
}

.menu-items-popup {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.98);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.9);
  border-radius: 0;
  padding: 65px 16px 16px 16px;
  z-index: 1000;
  flex-direction: column;
  gap: 1em;
  align-items: flex-start;
}

.menu-items-popup button {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 1em;
  cursor: pointer;
  margin-bottom: 4px;
}

@media (max-width: 700px) {
  .menu-items-desktop {
    display: none;
  }

  .menu-items-popup {
    display: flex;
  }

  .hamburger {
    display: flex;
  }

  .account-btn {
    position: absolute;
    right: 5px;
    top: 16px;
    margin: 0;
    z-index: 1200;
    background: none;
    box-shadow: none;
  }

  .main-content {
    padding: 0em;
  }
}

@media (min-width: 701px) {
  .menu-items-popup {
    display: none !important;
  }

  .hamburger {
    display: none !important;
  }

  .menu-items-desktop {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .account-btn {
    position: static;
    margin-left: auto;
    z-index: 1;
  }

  .main-content {
    padding: 2em;
    max-width: 900px;
    margin: 0 auto;
  }
}
</style>
