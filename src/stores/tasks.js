import { defineStore } from "pinia";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

// Helper: wacht op geldige gebruiker
async function waitForUser() {
  let user = auth.currentUser;
  if (!user) {
    await new Promise(resolve => {
      const unsubscribe = auth.onAuthStateChanged(u => {
        user = u;
        unsubscribe();
        resolve();
      });
    });
  }
  return auth.currentUser;
}

export const useTaskStore = defineStore("tasks", {
  state: () => ({
    tasks: [],
    error: null,
    isLoading: false,
  }),
  actions: {
    async loadTasks() {
      this.isLoading = true;
      this.error = null;
      try {
        this.tasks = [];
        const user = await waitForUser();
        if (!user) {
          this.error = "Niet ingelogd";
          return;
        }
        const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        this.tasks = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log(this.tasks);
      } catch (error) {
        this.error = "Fout bij het laden van taken";
        console.error(this.error, error);
      } finally {
        this.isLoading = false;
      }
    },
    async addTask(task) {
      this.error = null;
      try {
        const user = await waitForUser();
        if (!user) throw new Error("Niet ingelogd");
        const docRef = await addDoc(collection(db, "tasks"), {
          ...task,
          userId: user.uid,
        });
        this.tasks.push({ id: docRef.id, ...task, userId: user.uid });
      } catch (error) {
        this.error = "Fout bij het toevoegen van een taak";
        console.error(this.error, error);
        await this.loadTasks();
      }
    },
    async updateTask(taskId, updatedTask) {
      this.error = null;
      try {
        if (!taskId || typeof taskId !== "string") {
          throw new Error("Ongeldige taskId: " + taskId);
        }
        const user = await waitForUser();
        if (!user) throw new Error("Niet ingelogd");
        const taskDoc = doc(db, "tasks", taskId);
        console.log("Updating task:", taskId, updatedTask);
        await updateDoc(taskDoc, { ...updatedTask, userId: user.uid });
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = { id: taskId, ...updatedTask, userId: user.uid };
        }
        await this.loadTasks();
      } catch (error) {
        this.error = "Fout bij het bijwerken van een taak";
        console.error(this.error, error);
        await this.loadTasks();
      }
    },
    async deleteTask(taskId) {
      this.error = null;
      try {
        if (!taskId || typeof taskId !== "string") {
          throw new Error("Ongeldige taskId voor verwijdering: " + taskId);
        }
        const user = await waitForUser();
        if (!user) throw new Error("Niet ingelogd");
        const taskDoc = doc(db, "tasks", taskId);
        await deleteDoc(taskDoc);
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          this.tasks.splice(taskIndex, 1);
        }
      } catch (error) {
        this.error = "Fout bij het verwijderen van een taak";
        console.error(this.error, error);
        await this.loadTasks();
      }
    },
    async deleteTaskInstance(taskId, date) {
      this.error = null;
      try {
        if (!taskId || typeof taskId !== "string") {
          throw new Error("Ongeldige taskId voor instantie-verwijdering: " + taskId);
        }
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) {
          throw new Error("Taak niet gevonden met ID: " + taskId);
        }
        const task = this.tasks[taskIndex];
        let updatedTask = { ...task };

        if (task.scheduledDates) {
          updatedTask.scheduledDates = task.scheduledDates.filter(d => d.date !== date);
          if (updatedTask.scheduledDates.length === 0) {
            await this.deleteTask(taskId);
          } else {
            await this.updateTask(taskId, updatedTask);
          }
        } else if (task.timesByDate) {
          const updatedTimesByDate = { ...task.timesByDate };
          delete updatedTimesByDate[date];
          if (Object.keys(updatedTimesByDate).length === 0) {
            await this.deleteTask(taskId);
          } else {
            await this.updateTask(taskId, { timesByDate: updatedTimesByDate });
          }
        } else if (task.dates) {
          updatedTask.dates = task.dates.filter(d => d !== date);
          if (updatedTask.dates.length === 0) {
            await this.deleteTask(taskId);
          } else {
            await this.updateTask(taskId, updatedTask);
          }
        }
      } catch (error) {
        this.error = "Fout bij het verwijderen van taakinstantie";
        console.error(this.error, error);
        await this.loadTasks();
        throw error;
      }
    },
    async toggleTaskCompletion(taskId) {
      this.error = null;
      try {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          const task = this.tasks[taskIndex];
          const updatedTask = { ...task, completed: !task.completed };
          await this.updateTask(taskId, updatedTask);
        }
      } catch (error) {
        this.error = "Fout bij het togglen van taak voltooiing";
        console.error(this.error, error);
        await this.loadTasks();
      }
    },
    async toggleTaskInstanceCompletion(taskId, date) {
      this.error = null;
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
        this.error = "Fout bij het togglen van taakinstantie voltooiing";
        console.error(this.error, error);
        await this.loadTasks();
      }
    },
  },
  getters: {
    unplannedTasksCount: (state) => {
      return state.tasks.filter((task) => !task.dates || task.dates.length === 0).length;
    },
  },
});