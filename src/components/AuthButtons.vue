<template>
    <div class="auth-buttons" @click.stop>
        <div v-if="user" class="dropdown">
            <button class="spacex-nav-btn account-btn" title="Accountopties" @click="toggleDropdown"
                aria-expanded="isDropdownOpen">
                <span class="account-icon">👤</span>
            </button>
            <div v-if="isDropdownOpen" class="dropdown-menu">
                <div class="dropdown-item user-info">{{ user.displayName || user.email }}</div>
                <button class="dropdown-item logout-button" @click="handleLogout" title="Uitloggen">Uitloggen</button>
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
import { useRouter } from 'vue-router';
import { logout as globalLogout } from '../router';

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

function signIn() {
    router.push('/login');
}

async function handleLogout() {
    try {
        await globalLogout();
        isDropdownOpen.value = false;
        router.push('/login');
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
    top: 0px;
    right: 5px;
    z-index: 1000;
}

.dropdown {
    position: relative;
    display: inline-block;
}


.spacex-nav-btn.account-btn {
    padding: 0.2em 1.1em;
    font-size: 0.9em;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0;
    background: transparent;
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    box-shadow: none;
    transition: background var(--transition), color var(--transition), border var(--transition), transform var(--transition);
}

.spacex-nav-btn.account-btn:hover {
    background: var(--color-primary);
    color: var(--color-bg);
    border-color: var(--color-accent);
    transform: translateY(-2px) scale(1.04);
}

.account-icon {
    font-size: 1.3em;
    margin-right: 0;
}

.dropdown-menu {
    position: absolute;
    top: 48px;
    right: 0;
    background: var(--color-bg-alt);
    border-radius: 0;
    box-shadow: var(--shadow);
    border: 1.5px solid var(--color-border);
    min-width: 200px;
    z-index: 1000;
}

.dropdown-item.user-info {
    font-weight: bold;
    color: var(--color-primary);
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
    color: #fff;
    border-radius: 0;
    border: none;
    font-size: 1.3em;
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition), transform var(--transition);
}

.login-button:hover {
    background-color: #218838;
    transform: scale(1.08);
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
</style>