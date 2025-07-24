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
    toggleTaskInstanceCompletion(index, date) {
      const task = this.tasks[index];
      if (task.scheduledDates && task.scheduledDates.length > 0) {
        const dateIndex = task.scheduledDates.findIndex(d => d.date === date);
        if (dateIndex !== -1) {
          const updatedScheduledDates = [...task.scheduledDates];
          updatedScheduledDates[dateIndex] = {
            ...updatedScheduledDates[dateIndex],
            completed: !updatedScheduledDates[dateIndex].completed,
          };
          this.tasks[index] = { ...task, scheduledDates: updatedScheduledDates };
          localStorage.setItem("tasks", JSON.stringify(this.tasks));
        }
      } else if (task.timesByDate && task.timesByDate[date]) {
        const updatedTimesByDate = { ...task.timesByDate };
        updatedTimesByDate[date] = {
          ...updatedTimesByDate[date],
          completed: !updatedTimesByDate[date].completed,
        };
        this.tasks[index] = { ...task, timesByDate: updatedTimesByDate };
        localStorage.setItem("tasks", JSON.stringify(this.tasks));
      }
    },
  },
  getters: {
    unplannedTasksCount: (state) => {
      return state.tasks.filter(task => !task.dates || task.dates.length === 0).length;
    },
  },
});