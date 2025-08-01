<template>
  <div class="login-container">
    <h2>Inloggen</h2>
    <form @submit.prevent="handleLogin">
      <div>
        <label for="email">E-mail:</label>
        <input v-model="email" type="email" id="email" required />
      </div>
      <div>
        <label for="password">Wachtwoord:</label>
        <input v-model="password" type="password" id="password" required />
      </div>
      <button type="submit">Inloggen</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const error = ref(null)
const router = useRouter()
const auth = getAuth()

const handleLogin = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    console.log('User logged in:', userCredential.user)
    error.value = null
    router.push('/') // Navigeer naar home na succes
  } catch (err) {
    error.value = err.message
    console.error('Login error:', err)
  }
}
</script>

<style scoped>
.login-container {
  max-width: 300px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
label {
  display: block;
  margin-bottom: 5px;
}
input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
}
button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.error {
  color: red;
  margin-top: 10px;
}
</style>