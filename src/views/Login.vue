<template>
    <div class="login-page">
        <div class="login-card">
            <h2>Inloggen</h2>
            <form @submit.prevent="login">
                <div class="form-group">
                    <label for="email">E-mail</label>
                    <input v-model="email" id="email" type="email" required autocomplete="username" />
                </div>
                <div class="form-group">
                    <label for="password">Wachtwoord</label>
                    <input v-model="password" id="password" type="password" required autocomplete="current-password" />
                </div>
                <button class="spacex-blue-btn" type="submit" :disabled="loading">Inloggen</button>
                <div v-if="error" class="error">{{ error }}</div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();
const auth = getAuth();

async function login() {
    error.value = '';
    loading.value = true;
    try {
        await signInWithEmailAndPassword(auth, email.value, password.value);
        router.replace('/');
    } catch (e) {
        error.value = 'Ongeldige gebruikersnaam of wachtwoord';
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg);
}

.login-card {
    background: var(--color-bg-alt);
    border-radius: 12px;
    box-shadow: var(--shadow);
    padding: 2.5em 2em;
    max-width: 350px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
}

.login-card h2 {
    margin-bottom: 1.5em;
    text-align: center;
    color: var(--color-primary);
}

.form-group {
    margin-bottom: 1.2em;
}

label {
    display: block;
    margin-bottom: 0.4em;
    color: var(--color-text);
}

input[type="email"],
input[type="password"] {
    width: 100%;
    padding: 0.7em;
    border-radius: 6px;
    border: 1.5px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 1em;
}

button.spacex-blue-btn {
    width: 100%;
    padding: 0.8em;
    border-radius: 6px;
    background: #007bff;
    color: #fff;
    font-weight: 700;
    font-size: 1.1em;
    border: none;
    margin-top: 0.5em;
    cursor: pointer;
    transition: background 0.2s;
}

button.spacex-blue-btn:disabled {
    background: #b3d1fa;
    cursor: not-allowed;
}

.error {
    color: var(--color-danger);
    margin-top: 1em;
    text-align: center;
}
</style>
