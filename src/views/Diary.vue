<template>
  <div class="diary">
    <h1>Dagboek - {{ formatDate(selectedDate) }}</h1>
    <form @submit.prevent="saveEntry">
      <div class="form-group">
        <label for="content">Inhoud:</label>
        <textarea
          id="content"
          v-model="entry.content"
          placeholder="Schrijf hier je gedachten..."
          rows="5"
          required
        ></textarea>
      </div>
      <div class="form-group">
        <label for="limitingThoughts">Beperkende gedachten:</label>
        <textarea
          id="limitingThoughts"
          v-model="entry.limitingThoughts"
          placeholder="Schrijf hier je beperkende gedachten..."
          rows="3"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="focusThoughts">Gedachten om op te focussen:</label>
        <textarea
          id="focusThoughts"
          v-model="entry.focusThoughts"
          placeholder="Schrijf hier je positieve gedachten..."
          rows="3"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="mood">Stemming (1-5):</label>
        <select id="mood" v-model="entry.mood" required>
          <option value="" disabled>Selecteer een stemming</option>
          <option v-for="m in 5" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="tags">Tags (gescheiden door komma's):</label>
        <input
          id="tags"
          v-model="entry.tags"
          type="text"
          placeholder="bijv. werk, familie, vakantie"
        />
      </div>
      <div class="form-group">
        <label>Lijfspreuken:</label>
        <div class="motto-input-container">
          <input
            v-model="newMotto"
            type="text"
            placeholder="Voeg een lijfspreuk toe..."
            @keypress.enter="addMotto"
          />
          <button type="button" @click="addMotto" class="action-button add-motto"><span>+</span></button>
        </div>
        <ul class="mottos-list">
          <li v-for="(motto, index) in entry.neverForget" :key="index" class="motto-item">
            {{ motto }}
            <button type="button" @click="removeMotto(index)" class="action-button trash"><span>🗑️</span></button>
          </li>
        </ul>
      </div>
      <button type="submit" class="save-button">Opslaan</button>
    </form>
    <div v-if="savedMessage" class="saved-message">{{ savedMessage }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const selectedDate = ref(route.params.date || new Date().toISOString().split('T')[0]);
const entry = ref({
  date: '',
  content: '',
  limitingThoughts: '',
  focusThoughts: '',
  mood: '',
  tags: '',
  neverForget: [],
});
const newMotto = ref('');
const savedMessage = ref('');

onMounted(() => {
  loadEntry();
});

watch(() => route.params.date, (newDate) => {
  selectedDate.value = newDate || new Date().toISOString().split('T')[0];
  loadEntry();
});

const loadEntry = () => {
  const rawEntries = localStorage.getItem('diaryEntries') || '[]';
  const diaryEntries = JSON.parse(rawEntries);
  const existingEntry = diaryEntries.find((e) => e.date === selectedDate.value);
  if (existingEntry) {
    entry.value = { ...existingEntry };
    if (!entry.value.neverForget) {
      entry.value.neverForget = [];
    }
  } else {
    entry.value = { date: selectedDate.value, content: '', limitingThoughts: '', focusThoughts: '', mood: '', tags: '', neverForget: [] };
  }
};

const saveEntry = () => {
  const rawEntries = localStorage.getItem('diaryEntries') || '[]';
  let diaryEntries = JSON.parse(rawEntries);
  const entryIndex = diaryEntries.findIndex((e) => e.date === selectedDate.value);
  const newEntry = { ...entry.value, date: selectedDate.value };

  // Verwijder lege items uit neverForget
  newEntry.neverForget = newEntry.neverForget.filter(item => item && item.trim());

  if (entryIndex > -1) {
    diaryEntries[entryIndex] = newEntry;
  } else {
    diaryEntries.push(newEntry);
  }

  localStorage.setItem('diaryEntries', JSON.stringify(diaryEntries));
  savedMessage.value = 'Dagboekvermelding opgeslagen!';
  setTimeout(() => (savedMessage.value = ''), 2000);
};

const addMotto = () => {
  if (newMotto.value.trim()) {
    entry.value.neverForget.push(newMotto.value.trim());
    newMotto.value = '';
  }
};

const removeMotto = (index) => {
  entry.value.neverForget.splice(index, 1);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
</script>

<style scoped>
.diary {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-size: 16px;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
}

textarea,
select,
input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

textarea {
  resize: vertical;
}

.save-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button:hover {
  background-color: #0056b3;
}

.saved-message {
  text-align: center;
  color: #28a745;
  margin-top: 10px;
}

.mottos-list {
  list-style-type: none;
  padding: 0;
  margin-top: 10px;
}

.motto-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.action-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, transform 0.1s;
  background-color: transparent;
}

.action-button:hover {
  transform: scale(1.1);
}

.action-button.add-motto {
  background-color: #007bff;
}

.action-button.add-motto:hover {
  background-color: #0056b3;
}

.action-button.add-motto span {
  color: white;
  font-size: 1.8em;
  margin: 0;
}

.action-button.trash {
  background-color: transparent;
  box-shadow: none;
}

.action-button.trash:hover {
  color: #c82333;
}

.action-button.trash span {
  color: #dc3545;
  margin: 0;
}

.motto-input-container {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>