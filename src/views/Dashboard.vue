<template>
  <div class="dashboard">
    <h1 class="spacex-title">Dagboek Dashboard</h1>

    <div class="mood-overview card">
      <h2 class="spacex-section-title">Stemming Overzicht</h2>
      <div class="charts">
        <div class="chart-container" v-if="!isLoading && !error">
          <h3>Laatste Week</h3>
          <div id="weekMoodChart"></div>
        </div>
        <div class="chart-container" v-if="!isLoading && !error">
          <h3>Laatste Maand</h3>
          <div id="monthMoodChart"></div>
        </div>
      </div>
      <div class="average-container" v-if="!isLoading && !error">
        <h3>Gemiddeld Overall</h3>
        <p>{{ overallAverage.toFixed(1) }}</p>
      </div>
      <div v-if="isLoading" class="loading-message">Laden...</div>
      <div v-if="error" class="loading-message">{{ error }}</div>
    </div>

    <div class="mottos-overview card">
      <h2 class="spacex-section-title">Lijfspreuken</h2>
      <ul class="mottos-list" v-if="!isLoading && !error">
        <li v-for="(motto, index) in paginatedMottos" :key="index">
          {{ motto }}
        </li>
      </ul>
      <div v-if="isLoading" class="loading-message">Laden...</div>
      <div v-if="error" class="loading-message">{{ error }}</div>
      <div class="pagination" v-if="!isLoading && !error">
        <button class="spacex-blue-btn" @click="previousPage" :disabled="currentPage === 1">
          << </button>
            <span>Pagina {{ currentPage }} van {{ totalPages }}</span>
            <button class="spacex-blue-btn" @click="nextPage" :disabled="currentPage === totalPages">>></button>
      </div>
    </div>

    <div class="last-seven-days card">
      <h2 class="spacex-section-title">Afgelopen 7 Dagen</h2>
      <div v-for="day in lastSevenDays" :key="day.date" class="day-entry" v-if="!isLoading && !error">
        <h3>{{ formatDate(day.date) }}</h3>
        <div v-if="day.entry">
          <p><strong>Inhoud:</strong> {{ day.entry.content || 'Geen inhoud' }}</p>
          <p><strong>Beperkende gedachten:</strong> {{ day.entry.limitingThoughts || 'Geen beperkende gedachten' }}</p>
          <p><strong>Gedachten om op te focussen:</strong> {{ day.entry.focusThoughts || "Geen gedachten om op te "
            + "focussen" }}</p>
        </div>
        <p v-else>Geen gegevens voor deze dag</p>
      </div>
      <div v-if="isLoading" class="loading-message">Laden...</div>
      <div v-if="error" class="loading-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import p5 from 'p5';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const currentPage = ref(1);
const itemsPerPage = 10;
const diaryEntries = ref([]);
const isLoading = ref(true);
const error = ref('');

const waitForUser = async () => {
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
};

const loadEntries = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    const user = await waitForUser();
    if (user) {
      const q = query(
        collection(db, 'diaryEntries'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      diaryEntries.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      diaryEntries.value = [];
      error.value = 'Niet ingelogd.';
    }
  } catch (err) {
    console.error('Fout bij het laden van dagboekvermeldingen:', err);
    diaryEntries.value = [];
    error.value = 'Fout bij het laden van dagboekvermeldingen.';
  } finally {
    isLoading.value = false;
  }
};

const initCharts = () => {
  if (isLoading.value || error.value) return;
  // Verwijder bestaande canvassen
  document.getElementById('weekMoodChart')?.replaceChildren();
  document.getElementById('monthMoodChart')?.replaceChildren();

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
      const barWidth = 300 / (weekData.length || 1);
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
      const barWidth = 300 / (monthData.length || 1);
      monthData.forEach((mood, index) => {
        const barHeight = (mood / maxMood) * 180;
        sketch.rect(index * barWidth, 200 - barHeight, barWidth - 5, barHeight);
      });
    };
  }, 'monthMoodChart');
};

onMounted(async () => {
  await loadEntries();
  initCharts();
});

watch(diaryEntries, () => {
  initCharts();
});

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

const overallAverage = computed(() => {
  const moods = diaryEntries.value.map(entry => parseInt(entry.mood) || 0).filter(mood => !isNaN(mood));
  return moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
});

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
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5em 1.5em 2em 1.5em;
  font-size: 1.05em;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  position: relative;
  min-height: 100vh;
  padding-bottom: 80px;
}

.spacex-title {
  text-transform: uppercase;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.04em;
  font-size: 1.7em;
  margin-bottom: 1.5em;
  text-align: center;
}

.spacex-section-title {
  text-transform: uppercase;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.04em;
  font-size: 1.15em;
  margin-bottom: 1.2em;
}

@media (max-width: 700px) {
  .card {
    padding: 2em 0em;
  }

  .dashboard {
    padding: 2em 0.2em 2em 0.2em;
  }

  .charts {
    flex-direction: column;
    gap: 1.5em;
  }
}

@media (min-width: 701px) {
  .card {
    padding: 2em 2.5em;
  }
}

.card {
  margin-bottom: 2.2em;
  background: var(--color-bg-alt);
  border-radius: 0;
  box-shadow: var(--shadow);
  border: 1.5px solid var(--color-border);
  transition: box-shadow var(--transition), background var(--transition);
}

.charts {
  display: flex;
  gap: 2em;
}

.chart-container,
.average-container {
  flex: 1;
  text-align: center;
}

#weekMoodChart,
#monthMoodChart {
  margin: 0 auto;
  background: var(--color-bg);
  border-radius: 0;
  border: 1.5px solid var(--color-border);
  padding: 1em;
}

.average-container p {
  font-size: 1.5em;
  font-weight: bold;
  color: #007bff;
  background: var(--color-bg);
  padding: 0.7em 1.5em;
  border-radius: 0;
  border: 1.5px solid var(--color-border);
  display: inline-block;
}

.mottos-list {
  list-style-type: none;
  padding: 0;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
}

.mottos-list li {
  padding: 0.6em 0;
  border-bottom: 1.5px solid var(--color-border);
  font-size: 1em;
}

.mottos-list li:last-child {
  border-bottom: none;
}

.pagination {
  margin-top: 1.2em;
  text-align: center;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1.2em;
}

.pagination button {
  margin: 0 0.7em;
}

.pagination span {
  margin: 0 0.7em;
  min-width: 110px;
  display: inline-block;
  text-align: center;
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

.spacex-blue-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.day-entry {
  margin: 1.2em 0;
  padding: 1.2em 1.5em;
  border: 1.5px solid var(--color-border);
  border-radius: 0;
  background: var(--color-bg);
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
}

.day-entry h3 {
  margin-top: 0;
  color: var(--color-primary);
  text-transform: uppercase;
  font-size: 1.05em;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.day-entry p {
  margin: 0.4em 0;
}

.loading-message {
  text-align: center;
  color: #6c757d;
  padding: 1.5em;
  font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
}
</style>