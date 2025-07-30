import { defineStore } from "pinia";
import { db } from "../firebase"; // Importeer de Firestore-instantie
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

export const useTaskStore = defineStore("tasks", {
  state: () => ({
    tasks: [],
  }),
  actions: {
    async loadTasks() {
      try {
        this.tasks = [];
        const querySnapshot = await getDocs(collection(db, "tasks"));
        querySnapshot.forEach((doc) => {
          this.tasks.push({ id: doc.id, ...doc.data() });
        });
      } catch (error) {
        console.error("Fout bij het laden van taken:", error);
      }
    },
    async addTask(task) {
      try {
        const docRef = await addDoc(collection(db, "tasks"), task);
        this.tasks.push({ id: docRef.id, ...task });
      } catch (error) {
        console.error("Fout bij het toevoegen van een taak:", error);
        await this.loadTasks(); // Herlaad taken bij fout
      }
    },
    async updateTask(taskId, updatedTask) {
      try {
        if (!taskId || typeof taskId !== "string") {
          throw new Error("Ongeldige taskId: " + taskId);
        }
        const taskDoc = doc(db, "tasks", taskId);
        await updateDoc(taskDoc, updatedTask);
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = { id: taskId, ...updatedTask };
        }
        await this.loadTasks(); // Forceer synchronisatie
      } catch (error) {
        console.error("Fout bij het bijwerken van een taak:", error);
        await this.loadTasks(); // Herlaad taken bij fout
      }
    },
    async deleteTask(taskId) {
      try {
        if (!taskId || typeof taskId !== "string") {
          throw new Error("Ongeldige taskId voor verwijdering: " + taskId);
        }
        console.log("Verwijderen van taak met ID:", taskId); // Debug-log
        const taskDoc = doc(db, "tasks", taskId);
        await deleteDoc(taskDoc);
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          this.tasks.splice(taskIndex, 1);
        }
      } catch (error) {
        console.error("Fout bij het verwijderen van een taak:", error);
        await this.loadTasks(); // Herlaad taken bij fout
      }
    },
    async deleteTaskInstance(taskId, date) {
      try {
        if (!taskId || typeof taskId !== "string") {
          throw new Error("Ongeldige taskId voor instantie-verwijdering: " + taskId);
        }
        console.log("Verwijderen van taakinstantie met ID:", taskId, "op datum:", date);
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) {
          throw new Error("Taak niet gevonden met ID: " + taskId);
        }
        const task = this.tasks[taskIndex];
        let updatedTask = { ...task };

        if (task.scheduledDates) {
          updatedTask.scheduledDates = task.scheduledDates.filter(d => d.date !== date);
          if (updatedTask.scheduledDates.length === 0) {
            await this.deleteTask(taskId); // Verwijder de hele taak als geen schedules meer
          } else {
            await this.updateTask(taskId, updatedTask);
          }
        } else if (task.timesByDate) {
          const updatedTimesByDate = { ...task.timesByDate };
          delete updatedTimesByDate[date];
          if (Object.keys(updatedTimesByDate).length === 0) {
            await this.deleteTask(taskId); // Verwijder de hele taak als geen times meer
          } else {
            await this.updateTask(taskId, { timesByDate: updatedTimesByDate });
          }
        } else if (task.dates) {
          updatedTask.dates = task.dates.filter(d => d !== date);
          if (updatedTask.dates.length === 0) {
            await this.deleteTask(taskId); // Verwijder de hele taak als geen dates meer
          } else {
            await this.updateTask(taskId, updatedTask);
          }
        } else {
          console.warn("Geen verwijderbare instanties gevonden voor taak:", task);
        }
      } catch (error) {
        console.error("Fout bij het verwijderen van taakinstantie:", error);
        await this.loadTasks(); // Herlaad taken bij fout
        throw error;
      }
    },
    async toggleTaskCompletion(taskId) {
      try {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          const task = this.tasks[taskIndex];
          const updatedTask = { ...task, completed: !task.completed };
          await this.updateTask(taskId, updatedTask);
        }
      } catch (error) {
        console.error("Fout bij het togglen van taak voltooiing:", error);
        await this.loadTasks(); // Herlaad taken bij fout
      }
    },
    async toggleTaskInstanceCompletion(taskId, date) {
      try {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          const task = this.tasks[taskIndex];
          if (task.scheduledDates && task.scheduledDates.length > 0) {
            const dateIndex = task.scheduledDates.findIndex((d) => d.date === date);
            if (dateIndex !== -1) {
              const updatedScheduledDates = [...task.scheduledDates];
              updatedScheduledDates[dateIndex] = {
                ...updatedScheduledDates[dateIndex],
                completed: !updatedScheduledDates[dateIndex].completed,
              };
              await this.updateTask(taskId, { scheduledDates: updatedScheduledDates });
            }
          } else if (task.timesByDate && task.timesByDate[date]) {
            const updatedTimesByDate = { ...task.timesByDate };
            updatedTimesByDate[date] = {
              ...updatedTimesByDate[date],
              completed: !updatedTimesByDate[date].completed,
            };
            await this.updateTask(taskId, { timesByDate: updatedTimesByDate });
          }
        }
      } catch (error) {
        console.error("Fout bij het togglen van taakinstantie voltooiing:", error);
        await this.loadTasks(); // Herlaad taken bij fout
      }
    },
  },
  getters: {
    unplannedTasksCount: (state) => {
      return state.tasks.filter((task) => !task.dates || task.dates.length === 0).length;
    },
  },
});