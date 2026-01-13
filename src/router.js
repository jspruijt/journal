import { createRouter, createWebHistory } from "vue-router";
import Login from "./views/Login.vue";
import Home from "./views/Home.vue";
import UnplannedTasks from "./views/UnplannedTasks.vue";
import AddTask from "./views/AddTask.vue";
import EditTask from "./views/EditTask.vue";
import Diary from "./views/Diary.vue";
import Dashboard from "./views/Dashboard.vue";
import GoalsOverview from './views/GoalsOverview.vue';
import AddGoal from './views/AddGoal.vue';
import EditGoal from './views/EditGoal.vue';
import GoalDetail from './views/GoalDetail.vue';

import LinkTaskToGoal from './views/LinkTaskToGoal.vue';
const routes = [
  { path: "/", component: Home },
  { path: "/unplanned-tasks", component: UnplannedTasks },
  { path: "/add-task", component: AddTask },
  { path: "/edit-task/:id", component: EditTask },
  { path: "/diary/:date?", component: Diary },
  { path: '/dashboard', component: Dashboard },
  { path: '/goals', component: GoalsOverview },
  { path: '/add-goal', component: AddGoal },
  { path: '/goal/:id', component: GoalDetail },
  { path: '/edit-goal/:id', component: EditGoal },
  { path: '/goal/:goalId/link-task', component: LinkTaskToGoal },
  { path: '/login', component: Login },
];
// Export een logout functie voor gebruik in de app
import { signOut, getAuth, onAuthStateChanged } from 'firebase/auth';
export async function logout() {
  const auth = getAuth();
  await signOut(auth);
}

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard: alleen toegang als ingelogd, behalve /login
router.beforeEach(async (to, from, next) => {
  const auth = getAuth();
  const user = auth.currentUser;
  // Wacht op auth state als nog niet bekend
  if (user === null) {
    await new Promise(resolve => {
      const unsub = onAuthStateChanged(auth, () => {
        unsub();
        resolve();
      });
    });
  }
  const isLoggedIn = !!auth.currentUser;
  if (!isLoggedIn && to.path !== '/login') {
    next({ path: '/login' });
  } else if (isLoggedIn && to.path === '/login') {
    next({ path: '/' });
  } else {
    next();
  }
});

export default router;