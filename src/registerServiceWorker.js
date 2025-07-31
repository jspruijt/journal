/* eslint-disable no-console */
import { register } from 'register-service-worker'

if (process.env.NODE_ENV === 'production') {
  const baseURL = process.env.BASE_URL || '/';
  const swUrl = `${baseURL}service-worker.js`;
  console.log('Registering service worker from:', swUrl);

  register(swUrl, {
    ready() {
      console.log('App is being served from cache by a service worker.')
    },
    registered() {
      console.log('Service worker has been registered.')
    },
    cached() {
      console.log('Content has been cached for offline use.')
    },
    updatefound() {
      console.log('New content is downloading.')
    },
    updated() {
      console.log('New content is available; please refresh.')
      window.location.reload()
    },
    offline() {
      console.log('No internet connection found. App is running in offline mode.')
    },
    error(error) {
      console.error('Error during service worker registration:', error)
    }
  })
}