// In taskStore.js
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
    saveTasks() {
      localStorage.setItem("tasks", JSON.stringify(this.tasks));
    },
    addTask(task) {
      this.tasks.push(task);
      this.saveTasks();
    },
    updateTask(index, updatedTask) {
      this.tasks[index] = updatedTask;
      this.saveTasks();
    },
    deleteTask(index) {
      this.tasks.splice(index, 1);
      this.saveTasks();
    },
    toggleTaskCompletion(index) {
      this.tasks[index].completed = !this.tasks[index].completed;
      this.saveTasks();
    },
  },
});