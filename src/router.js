import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import UnplannedTasks from "./views/UnplannedTasks.vue";
import AddTask from "./views/AddTask.vue";
import EditTask from "./views/EditTask.vue";
import Diary from "./views/Diary.vue";
import Dashboard from "./views/Dashboard.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/unplanned-tasks", component: UnplannedTasks },
  { path: "/add-task", component: AddTask },
  { path: "/edit-task/:id", component: EditTask },
  { path: "/diary/:date?", component: Diary },
  { path: '/dashboard', component: Dashboard }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;