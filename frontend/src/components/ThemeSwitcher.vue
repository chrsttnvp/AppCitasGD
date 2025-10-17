<script setup>
import { ref, onMounted } from 'vue';

// 'light' o 'dark'
const currentTheme = ref('light');

const toggleTheme = () => {
  const newTheme = currentTheme.value === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
};

const applyTheme = (theme) => {
  currentTheme.value = theme;
  // Añadir o quitar la clase 'dark' del elemento <html>
  document.documentElement.classList.toggle('dark', theme === 'dark');
  // Guardar la preferencia en el localStorage
  localStorage.setItem('theme', theme);
};

onMounted(() => {
  // Al cargar el componente, verificar si hay una preferencia guardada o usar la del sistema
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (prefersDark) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }
});
</script>

<template>
  <button @click="toggleTheme" class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300">
    <span v-if="currentTheme === 'light'">🌙</span>
    <span v-else>☀️</span>
  </button>
</template>