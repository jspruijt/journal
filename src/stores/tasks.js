import { defineStore } from "pinia";

export const useTaskStore = defineStore("tasks", {
  state: () => ({
    tasks: [],
  }),
  actions: {
    loadTasks() {
      const saved = localStorage.getItem("tasks");
      if (saved) {
        this.tasks = JSON.parse(saved).map(task => {
          if (task.type === "recurring" && task.timesByDate && !task.scheduledDates) {
            // Converteer timesByDate naar scheduledDates
            const scheduledDates = Object.entries(task.timesByDate).map(([date, times]) => ({
              date,
              startTime: times.startTime,
              endTime: times.endTime,
            }));
            return { ...task, scheduledDates, timesByDate: undefined };
          }
          return task;
        });
      }
    },
    addTask(task) {
      this.tasks.push(task);
      localStorage.setItem("tasks", JSON.stringify(this.tasks));
    },
    updateTask(index, updatedTask) {
      this.tasks[index] = updatedTask;
      localStorage.setItem("tasks", JSON.stringify(this.tasks));
    },
    deleteTask(index) {
      this.tasks.splice(index, 1);
      localStorage.setItem("tasks", JSON.stringify(this.tasks));
    },
    toggleTaskCompletion(index) {
      this.tasks[index].completed = !this.tasks[index].completed;
      localStorage.setItem("tasks", JSON.stringify(this.tasks));
    },
  },
  getters: {
    unplannedTasksCount: (state) => {
      return state.tasks.filter(task => !task.dates || task.dates.length === 0).length;
    },
  },
});