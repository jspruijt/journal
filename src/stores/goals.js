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

// Helper: wacht op geldige gebruiker met een timeout
async function waitForUser(timeoutMs = 5000) {
  let user = auth.currentUser;
  if (!user) {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for user authentication"));
      }, timeoutMs);
      const unsubscribe = auth.onAuthStateChanged(u => {
        clearTimeout(timeout);
        user = u;
        unsubscribe();
        resolve();
      }, reject);
    });
  }
  if (!user) throw new Error("Geen gebruiker ingelogd");
  return user;
}

// Helper: controleer of Firestore is geïnitialiseerd
function checkFirestoreInitialized() {
  if (!db) {
    throw new Error("Firestore is niet geïnitialiseerd. Controleer je firebase.js configuratie.");
  }
}

export const useGoalStore = defineStore("goals", {
  state: () => ({
    goals: [],
    error: null,
    isLoading: false,
  }),
  actions: {
    async loadGoals() {
      this.isLoading = true;
      this.error = null;
      try {
        checkFirestoreInitialized();
        const user = await waitForUser();
        const q = query(collection(db, "goals"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        this.goals = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        this.error = `Fout bij het laden van doelen: ${error.message}`;
        console.error(this.error, error);
      } finally {
        this.isLoading = false;
      }
    },
    async addGoal(goal) {
      this.error = null;
      try {
        checkFirestoreInitialized();
        const user = await waitForUser();
        const docRef = await addDoc(collection(db, "goals"), {
          ...goal,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          completed: false,
          deadline: goal.deadline || null,
        });
        this.goals.push({ id: docRef.id, ...goal, userId: user.uid, createdAt: new Date().toISOString(), completed: false, deadline: goal.deadline || null });
      } catch (error) {
        this.error = `Fout bij het toevoegen van een doel: ${error.message}`;
        console.error(this.error, error);
        await this.loadGoals();
      }
    },
    async updateGoal(goalId, updatedGoal) {
      this.error = null;
      try {
        checkFirestoreInitialized();
        if (!goalId || typeof goalId !== "string") {
          throw new Error("Ongeldige goalId: " + goalId);
        }
        const user = await waitForUser();
        const goalDoc = doc(db, "goals", goalId);
        await updateDoc(goalDoc, { ...updatedGoal, userId: user.uid, deadline: updatedGoal.deadline || null });
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex !== -1) {
          this.goals[goalIndex] = { id: goalId, ...updatedGoal, userId: user.uid, deadline: updatedGoal.deadline || null };
        }
        await this.loadGoals();
      } catch (error) {
        this.error = `Fout bij het bijwerken van een doel: ${error.message}`;
        console.error(this.error, error);
        await this.loadGoals();
      }
    },
    async deleteGoal(goalId) {
      this.error = null;
      try {
        checkFirestoreInitialized();
        if (!goalId || typeof goalId !== "string") {
          throw new Error("Ongeldige goalId voor verwijdering: " + goalId);
        }
        const user = await waitForUser();
        const goalDoc = doc(db, "goals", goalId);
        await deleteDoc(goalDoc);
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex !== -1) {
          this.goals.splice(goalIndex, 1);
        }
      } catch (error) {
        this.error = `Fout bij het verwijderen van een doel: ${error.message}`;
        console.error(this.error, error);
        await this.loadGoals();
      }
    },
    async toggleGoalCompletion(goalId) {
      this.error = null;
      try {
        checkFirestoreInitialized();
        const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex !== -1) {
          const goal = this.goals[goalIndex];
          const updatedGoal = { ...goal, completed: !goal.completed };
          await this.updateGoal(goalId, updatedGoal);
        }
      } catch (error) {
        this.error = `Fout bij het togglen van doel voltooiing: ${error.message}`;
        console.error(this.error, error);
        await this.loadGoals();
      }
    },
  },
  getters: {
    activeGoalsCount: (state) => {
      return state.goals.filter(goal => !goal.completed).length;
    },
  },
});