import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

import { db as firebaseApp } from './firebase'; // Importeer de Firebase app
import { registerSW } from 'virtual:pwa-register' // Gebruik registerSW in plaats van useRegisterSW
import './assets/theme.css';

console.log("main.js: Start applicatie laden");

const vueApp = createApp(App);
const pinia = createPinia();
console.log("main.js: Pinia geïnitialiseerd:", pinia);

// Gebruik Pinia en Router
vueApp.use(pinia);
vueApp.use(router);

// Monteer de app
vueApp.mount('#app');

// Register de service worker
registerSW({
  onNeedRefresh() {
    console.log('New content is available; please refresh.')
    if (confirm('Nieuwe inhoud is beschikbaar. Wil je vernieuwen?')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.log('App is ready to work offline.')
  },
  onRegistered(r) {
    console.log('Service worker registered:', r)
  },
  onRegisterError(error) {
    console.error('Service worker registration failed:', error)
  }
})

console.log("main.js: Applicatie gemount met Firebase en Pinia");