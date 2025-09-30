<template>
    <div class="auth-buttons" @click.stop>
        <div v-if="user" class="dropdown">
            <button class="action-button dropdown-toggle" title="Accountopties" @click="toggleDropdown"
                aria-expanded="isDropdownOpen">
                <span>👤</span>
            </button>
            <div v-if="isDropdownOpen" class="dropdown-menu">
                <div class="dropdown-item user-info">{{ user.displayName || user.email }}</div>
                <button class="dropdown-item logout-button" @click="logout" title="Uitloggen">Uitloggen</button>
            </div>
        </div>
        <div v-else>
            <button class="action-button login-button" @click="signIn" title="Inloggen">
                <span>🔐</span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { defineProps } from 'vue';
import { auth } from '../firebase';
import { signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'vue-router';

defineProps({
    user: Object,
});

const router = useRouter();
const isDropdownOpen = ref(false);

function toggleDropdown() {
    isDropdownOpen.value = !isDropdownOpen.value;
}

function closeDropdown(event) {
    if (!event.target.closest('.dropdown')) {
        isDropdownOpen.value = false;
    }
}

async function signIn() {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.push('/');
    } catch (error) {
        console.error('Fout bij inloggen:', error);
    }
}

async function logout() {
    try {
        await signOut(auth);
        isDropdownOpen.value = false;
        router.push('/');
    } catch (error) {
        console.error('Fout bij uitloggen:', error);
    }
}

onMounted(() => {
    document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
    document.removeEventListener('click', closeDropdown);
});
</script>

<style scoped>
.auth-buttons {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
}

.dropdown {
    position: relative;
    display: inline-block;
}

.action-button {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background-color: #007bff;
    color: white;
    font-size: 1.5em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: background-color 0.2s, transform 0.1s;
}

.action-button:hover {
    background-color: #0056b3;
    transform: scale(1.1);
}

.dropdown-toggle {
    font-size: 1.8em;
}

.dropdown-menu {
    position: absolute;
    top: 50px;
    /* Adjusted to touch the button, no gap */
    right: 0;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    min-width: 200px;
    z-index: 1000;
}

.dropdown-item {
    padding: 10px 15px;
    font-size: 1em;
    color: #333;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.dropdown-item.user-info {
    font-weight: bold;
    color: #007bff;
}

.logout-button {
    background: none;
    border: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
}

.logout-button:hover {
    background-color: #f8f9fa;
    color: #dc3545;
}

.login-button {
    background-color: #28a745;
}

.login-button:hover {
    background-color: #218838;
}
</style>