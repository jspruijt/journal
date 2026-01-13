<template>
    <div class="link-task-to-goal card">
        <h1>Koppel een taak aan dit doel</h1>
        <div v-if="unplannedTasks.length === 0">Geen ongeplande taken beschikbaar.</div>
        <div v-else>
            <input v-model="searchQuery" type="text" placeholder="Zoek taak..." class="search-input" />
            <div v-for="task in paginatedTasks" :key="task.id" class="task-row">
                <span>{{ task.name }}</span>
                <button class="spacex-blue-btn" title="Koppel taak" @click="linkTask(task.id)">+</button>
            </div>
            <div v-if="filteredTasks.length > pageSize" class="pagination">
                <button class="spacex-blue-btn" :disabled="currentPage === 1" @click="prevPage">Vorige</button>
                <span>Pagina {{ currentPage }} van {{ totalPages }}</span>
                <button class="spacex-blue-btn" :disabled="currentPage === totalPages"
                    @click="nextPage">Volgende</button>
            </div>
        </div>
        <div v-if="linkedTasks.length > 0" class="linked-tasks">
            <h2>Gekoppelde taken</h2>
            <div v-for="task in linkedTasks" :key="task.id" class="task-row">
                <span>{{ task.name }}</span>
                <button class="spacex-blue-btn delete" title="Ontkoppel taak" @click="unlinkTask(task.id)">-</button>
            </div>
        </div>
        <div class="form-actions">
            <button class="spacex-blue-btn" @click="addNewTask">Nieuwe taak aanmaken</button>
            <button class="spacex-blue-btn delete" @click="$router.back()">Annuleren</button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useTaskStore } from '../stores/tasks';
import { useRoute, useRouter } from 'vue-router';

const taskStore = useTaskStore();
const route = useRoute();
const router = useRouter();
const goalId = route.params.goalId;



const searchQuery = ref("");
const pageSize = 10;
const currentPage = ref(1);

const unplannedTasks = computed(() => taskStore.tasks.filter(t => !t.goalId));
const linkedTasks = computed(() => taskStore.tasks.filter(t => t.goalId === goalId));

const filteredTasks = computed(() => {
    if (!searchQuery.value.trim()) return unplannedTasks.value;
    return unplannedTasks.value.filter(t => (t.name || '').toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const totalPages = computed(() => Math.ceil(filteredTasks.value.length / pageSize));
const paginatedTasks = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    return filteredTasks.value.slice(start, start + pageSize);
});

function prevPage() {
    if (currentPage.value > 1) currentPage.value--;
}
function nextPage() {
    if (currentPage.value < totalPages.value) currentPage.value++;
}

watch(searchQuery, () => { currentPage.value = 1; });

onMounted(async () => {
    await taskStore.loadTasks();
});


function linkTask(taskId) {
    const task = taskStore.tasks.find(t => t.id === taskId);
    if (task) {
        taskStore.updateTask(taskId, { ...task, goalId });
    }
}

function unlinkTask(taskId) {
    const task = taskStore.tasks.find(t => t.id === taskId);
    if (task) {
        taskStore.updateTask(taskId, { ...task, goalId: null });
    }
}

function addNewTask() {
    router.push({ path: '/add-task', query: { goalId } });
}
</script>

<style scoped>
.form-actions {
    display: flex;
    gap: 1.2em;
    margin-top: 2em;
}

.link-task-to-goal {
    max-width: 700px;
    margin: 0 auto;
    padding: 2.5em 2em 2em 2em;
    background: var(--color-bg-alt);
    border-radius: 0;
    box-shadow: var(--shadow);
    border: 1.5px solid var(--color-border);
}

.task-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1em;
}

.search-input {
    width: 100%;
    margin-bottom: 1em;
    padding: 0.5em 1em;
    font-size: 1em;
    border: 1.5px solid var(--color-border);
    border-radius: 0;
    background: var(--color-bg);
    color: var(--color-text);
}

.pagination {
    display: flex;
    align-items: center;
    gap: 1em;
    margin-top: 1em;
    justify-content: center;
}

.linked-tasks {
    margin-top: 2em;
}

.spacex-blue-btn {
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 0;
    padding: 0.5em 1.7em;
    font-size: 1em;
    font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: background var(--transition), color var(--transition), border var(--transition), transform var(--transition);
}

.spacex-blue-btn:hover {
    background: #0056b3;
    color: #fff;
    transform: translateY(-2px) scale(1.04);
}

.spacex-blue-btn.delete {
    background: var(--color-danger);
}

.spacex-blue-btn.delete:hover {
    background: #b91c1c;
}
</style>
