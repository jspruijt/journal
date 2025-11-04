<!-- WeekNavigation.vue -->
<template>
  <div class="week-navigation">
    <button class="spacex-blue-btn" @click="previousWeek">
      << </button>
        <div class="day-buttons">
          <button v-for="day in weekDays" :key="day.date" class="day-button" @click="selectDay(day.date)"
            :class="{ active: selectedDay === day.date }">
            {{ formatDayNumber(day.date) }}
          </button>
        </div>
        <button class="spacex-blue-btn" @click="nextWeek">>></button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['currentWeekStart', 'previousWeek', 'nextWeek', 'selectedDay', 'selectDay']);

const weekDays = computed(() => {
  const days = [];
  const start = new Date(props.currentWeekStart); // Gebruik props.currentWeekStart
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push({
      date: day.toISOString().split("T")[0],
      dayOfWeek: day.getDay(),
    });
  }
  return days;
});

const formatDayNumber = (date) => {
  const d = new Date(date);
  return d.getDate();
};
</script>

<style scoped>
.week-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5em;
}

.spacex-blue-btn {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 0;
  padding: 0.5em 0.7em;
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

.day-buttons {
  display: flex;
  gap: 0.3em;
}

.day-button {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 1em;
  cursor: pointer;
  transition: background var(--transition), color var(--transition), transform var(--transition);
}

.day-button:hover {
  background: var(--color-primary);
  color: var(--color-bg);
  transform: scale(1.1);
}

.day-button.active {
  background: var(--color-primary);
  color: var(--color-bg);
}
</style>