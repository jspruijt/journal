<template>
  <div>
    <form v-if="!user" @submit.prevent="loginWithEmail" class="auth-form">
      <input
        v-model="email"
        type="email"
        placeholder="E-mail"
        required
        autocomplete="username"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Wachtwoord"
        required
        autocomplete="current-password"
      />
      <button type="submit">Login</button>
      <button type="button" @click="registerWithEmail">Registreer</button>
      <div v-if="error" class="error">{{ error }}</div>
    </form>
    <div v-else>
      <span>Ingelogd als: {{ user.email }}</span>
      <button @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

const user = ref(null)
const email = ref('')
const password = ref('')
const error = ref('')

const loginWithEmail = async () => {
  error.value = ''
  try {
    const result = await signInWithEmailAndPassword(auth, email.value, password.value)
    user.value = result.user
    email.value = ''
    password.value = ''
  } catch (err) {
    error.value = err.message
  }
}

const registerWithEmail = async () => {
  error.value = ''
  try {
    const result = await createUserWithEmailAndPassword(auth, email.value, password.value)
    user.value = result.user
    email.value = ''
    password.value = ''
  } catch (err) {
    error.value = err.message
  }
}

const logout = async () => {
  try {
    await signOut(auth)
    user.value = null
  } catch (err) {
    error.value = err.message
  }
}

onMounted(() => {
  onAuthStateChanged(auth, (u) => {
    user.value = u
  })
})
</script>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 300px;
  margin: 0 auto;
}
.auth-form input {
  padding: 0.5rem;
  font-size: 1rem;
}
.auth-form button {
  padding: 0.5rem;
  font-size: 1rem;
  margin-top: 0.2rem;
}
.error {
  color: #dc3545;
  font-size: 0.95em;
  margin-top: 0.5rem;
}
</style>