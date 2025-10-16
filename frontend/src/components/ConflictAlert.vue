<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  conflicts: {
    type: Array,
    required: true,
  },
  onClose: {
    type: Function,
    required: true,
  },
});
</script>

<template>
  <div class="fixed inset-0 bg-red-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
      <h3 class="text-xl font-bold text-red-700 mb-4">¡Conflicto de Horario Detectado!</h3>
      <p class="text-gray-700 mb-4">La cita que intentas programar se solapa con la(s) siguiente(s) cita(s) existente(s):</p>
      
      <ul class="list-disc list-inside mb-4 space-y-2 text-gray-800">
        <li v-for="conflict in conflicts" :key="conflict._id" class="p-2 bg-red-50 rounded">
          Paciente: <strong>{{ conflict.patientName }}</strong> ({{ conflict.startTime }} - {{ conflict.endTime }})
        </li>
      </ul>
      
      <p class="text-gray-700 mb-6">Por favor, ajusta el horario o el doctor para evitar el solapamiento.</p>
      
      <div class="flex justify-end">
        <button
          @click="onClose"
          class="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
        >
          Entendido
        </button>
      </div>
    </div>
  </div>
</template>