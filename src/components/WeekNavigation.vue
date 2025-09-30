<template>
  <div class="week-navigation">
    <button @click="previousWeek">Vorige week</button>
    <span>{{ formatWeekRange(currentWeekStart) }}</span>
    <button @click="nextWeek">Volgende week</button>
  </div>
</template>

<script setup>
defineProps(['currentWeekStart', 'formatWeekRange', 'previousWeek', 'nextWeek']);
</script>

<style scoped>
.week-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.week-navigation button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}
.week-navigation button:hover {
  background: #0056b3;
}
</style>