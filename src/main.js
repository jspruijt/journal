import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { app as firebaseApp } from './firebase'; // Importeer de Firebase app

console.log("main.js: Start applicatie laden");

const vueApp = createApp(App);
const pinia = createPinia();
console.log("main.js: Pinia geïnitialiseerd:", pinia);

// Gebruik Pinia en Router
vueApp.use(pinia);
vueApp.use(router);

// Monteer de app
vueApp.mount('#app');

console.log("main.js: Applicatie gemount met Firebase en Pinia");