import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import UnplannedTasks from "./views/UnplannedTasks.vue";
import AddTask from "./views/AddTask.vue";
import EditTask from "./views/EditTask.vue";
import Diary from "./views/Diary.vue";
import Dashboard from "./views/Dashboard.vue";
import GoalsOverview from './views/GoalsOverview.vue';
import AddGoal from './views/AddGoal.vue';
import EditGoal from './views/EditGoal.vue';

const routes = [
  { path: "/", component: Home },
  { path: "/unplanned-tasks", component: UnplannedTasks },
  { path: "/add-task", component: AddTask },
  { path: "/edit-task/:id", component: EditTask },
  { path: "/diary/:date?", component: Diary },
  { path: '/dashboard', component: Dashboard },
  { path: '/goals', component: GoalsOverview },
  { path: '/add-goal', component: AddGoal },
  { path: '/edit-goal/:id', component: EditGoal },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;