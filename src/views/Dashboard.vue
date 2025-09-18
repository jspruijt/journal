<template>
  <div class="dashboard">
    <h1>Dagboek Dashboard</h1>

    <!-- Stemming Overzicht -->
    <div class="mood-overview">
      <h2>Stemming Overzicht</h2>
      <div class="charts">
        <div class="chart-container" v-if="!isLoading">
          <h3>Laatste Week</h3>
          <div id="weekMoodChart"></div>
        </div>
        <div class="chart-container" v-if="!isLoading">
          <h3>Laatste Maand</h3>
          <div id="monthMoodChart"></div>
        </div>
        <div class="average-container" v-if="!isLoading">
          <h3>Gemiddeld Overall</h3>
          <p>{{ overallAverage.toFixed(1) }}</p>
        </div>
        <div v-else class="loading-message">Laden...</div>
      </div>
    </div>

    <!-- Lijfspreuken Overzicht -->
    <div class="mottos-overview">
      <h2>Lijfspreuken</h2>
      <ul class="mottos-list" v-if="!isLoading">
        <li v-for="(motto, index) in paginatedMottos" :key="index">
          {{ motto }}
        </li>
      </ul>
      <div v-else class="loading-message">Laden...</div>
      <div class="pagination" v-if="!isLoading">
        <button @click="previousPage" :disabled="currentPage === 1">Vorige</button>
        <span>Pagina {{ currentPage }} van {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">Volgende</button>
      </div>
    </div>

    <!-- Laatste 7 Dagen Overzicht -->
    <div class="last-seven-days">
      <h2>Afgelopen 7 Dagen</h2>
      <div v-for="day in lastSevenDays" :key="day.date" class="day-entry" v-if="!isLoading">
        <h3>{{ formatDate(day.date) }}</h3>
        <div v-if="day.entry">
          <p><strong>Inhoud:</strong> {{ day.entry.content || 'Geen inhoud' }}</p>
          <p><strong>Beperkende gedachten:</strong> {{ day.entry.limitingThoughts || 'Geen beperkende gedachten' }}</p>
          <p><strong>Gedachten om op te focussen:</strong> {{ day.entry.focusThoughts || 'Geen gedachten om op te focussen' }}</p>
        </div>
        <p v-else>Geen gegevens voor deze dag</p>
      </div>
      <div v-else class="loading-message">Laden...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import p5 from 'p5';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const currentPage = ref(1);
const itemsPerPage = 10;
const diaryEntries = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  await loadEntries();
  initCharts();
});

const loadEntries = async () => {
  isLoading.value = true;
  try {
    // Wacht tot Firebase Auth status bekend is
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
    if (user) {
      const q = query(
        collection(db, 'diaryEntries'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      diaryEntries.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      diaryEntries.value = [];
    }
  } catch (error) {
    console.error('Fout bij het laden van dagboekvermeldingen:', error);
    diaryEntries.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Grafieken initialiseren met p5.js
const initCharts = () => {
  if (isLoading.value) return;
  const weekData = getMoodData('week');
  new p5((sketch) => {
    sketch.setup = () => {
      const canvas = sketch.createCanvas(300, 200);
      canvas.parent('weekMoodChart');
      sketch.noLoop();
    };
    sketch.draw = () => {
      sketch.background(220);
      sketch.stroke(0);
      sketch.noFill();
      const maxMood = 5;
      const barWidth = 300 / weekData.length;
      weekData.forEach((mood, index) => {
        const barHeight = (mood / maxMood) * 180;
        sketch.rect(index * barWidth, 200 - barHeight, barWidth - 5, barHeight);
      });
    };
  }, 'weekMoodChart');

  const monthData = getMoodData('month');
  new p5((sketch) => {
    sketch.setup = () => {
      const canvas = sketch.createCanvas(300, 200);
      canvas.parent('monthMoodChart');
      sketch.noLoop();
    };
    sketch.draw = () => {
      sketch.background(220);
      sketch.stroke(0);
      sketch.noFill();
      const maxMood = 5;
      const barWidth = 300 / monthData.length;
      monthData.forEach((mood, index) => {
        const barHeight = (mood / maxMood) * 180;
        sketch.rect(index * barWidth, 200 - barHeight, barWidth - 5, barHeight);
      });
    };
  }, 'monthMoodChart');
};

// Gegevens ophalen voor grafieken
const getMoodData = (period) => {
  const now = new Date();
  const data = [];
  diaryEntries.value.forEach(entry => {
    const entryDate = new Date(entry.date);
    const diffDays = Math.floor((now - entryDate) / (1000 * 60 * 60 * 24));
    if (period === 'week' && diffDays <= 7 && diffDays > 0) {
      data.push(parseInt(entry.mood) || 0);
    } else if (period === 'month' && diffDays <= 30 && diffDays > 0) {
      data.push(parseInt(entry.mood) || 0);
    }
  });
  return data;
};

// Gemiddelde stemming berekenen
const overallAverage = computed(() => {
  const moods = diaryEntries.value.map(entry => parseInt(entry.mood) || 0).filter(mood => !isNaN(mood));
  return moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
});

// Pagineringslogica voor lijfspreuken
const allMottos = computed(() => {
  return [...new Set(diaryEntries.value.flatMap(entry => entry.neverForget || []))].filter(motto => motto);
});
const paginatedMottos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return allMottos.value.slice(start, end);
});
const totalPages = computed(() => Math.ceil(allMottos.value.length / itemsPerPage));

const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

// Afgelopen 7 dagen (exclusief vandaag)
const lastSevenDays = computed(() => {
  const now = new Date();
  const days = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const entry = diaryEntries.value.find(e => e.date === dateStr);
    days.push({ date: dateStr, entry });
  }
  return days.reverse();
});

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
</script>

<style scoped>
.dashboard {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px;
  font-size: 16px;
  position: relative;
  min-height: 100vh;
  padding-bottom: 80px;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

h2 {
  color: #555;
  margin-top: 20px;
}

.mood-overview,
.mottos-overview,
.last-seven-days {
  margin-bottom: 30px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 10px;
}

.charts {
  display: flex;
  gap: 20px;
}

.chart-container,
.average-container {
  flex: 1;
  text-align: center;
}

#weekMoodChart,
#monthMoodChart {
  margin: 0 auto;
  background: #fff;
  border-radius: 4px;
  padding: 10px;
}

.average-container p {
  font-size: 1.5em;
  font-weight: bold;
  color: #007bff;
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  display: inline-block;
}

.mottos-list {
  list-style-type: none;
  padding: 0;
}

.mottos-list li {
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.pagination {
  margin-top: 10px;
  text-align: center;
}

.pagination button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.pagination button:hover {
  background: #0056b3;
}

.pagination button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.day-entry {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}

.day-entry h3 {
  margin-top: 0;
  color: #333;
}

.day-entry p {
  margin: 5px 0;
}

.loading-message {
  text-align: center;
  color: #6c757d;
  padding: 20px;
}
</style>