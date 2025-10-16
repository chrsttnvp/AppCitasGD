<script setup>
import { ref, watch, defineEmits, defineProps } from 'vue';
import { apiService } from '../services/api';
import ConflictAlert from './ConflictAlert.vue'; // Importa el componente de alerta

const props = defineProps({
  appointment: { // Si se pasa una cita, significa que estamos editando
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['saved', 'cancel']); // Eventos para notificar al padre

const initialFormData = {
  patientName: '',
  doctorName: '',
  date: '',
  startTime: '',
  endTime: '',
  reason: '',
  status: 'scheduled',
};

const formData = ref({ ...initialFormData });
const formErrors = ref({});
const isLoading = ref(false);
const showConflictAlert = ref(false);
const conflictDetails = ref([]);

const statuses = ['scheduled', 'completed', 'cancelled'];

// Observar `props.appointment` para precargar el formulario si estamos editando
watch(() => props.appointment, (newVal) => {
  if (newVal) {
    formData.value = {
      ...newVal,
      date: newVal.date ? new Date(newVal.date).toISOString().split('T')[0] : '', // Formato YYYY-MM-DD para input date
    };
  } else {
    formData.value = { ...initialFormData }; // Resetear si no hay cita
  }
}, { immediate: true }); // Ejecutar la función inmediatamente al montar

// Validaciones básicas del formulario en el cliente
const validateForm = () => {
  formErrors.value = {};
  if (!formData.value.patientName) formErrors.value.patientName = 'El nombre del paciente es obligatorio.';
  if (!formData.value.doctorName) formErrors.value.doctorName = 'El nombre del doctor es obligatorio.';
  if (!formData.value.date) formErrors.value.date = 'La fecha es obligatoria.';
  if (!formData.value.startTime) formErrors.value.startTime = 'La hora de inicio es obligatoria.';
  if (!formData.value.endTime) formErrors.value.endTime = 'La hora de fin es obligatoria.';
  if (!formData.value.reason) formErrors.value.reason = 'El motivo es obligatorio.';
  if (!formData.value.status) formErrors.value.status = 'El estado es obligatorio.';

  const start = new Date(`2000-01-01T${formData.value.startTime}:00`);
  const end = new Date(`2000-01-01T${formData.value.endTime}:00`);
  if (end <= start) {
    formErrors.value.endTime = 'La hora de fin debe ser posterior a la de inicio.';
  }

  const appointmentDate = new Date(formData.value.date + 'T00:00:00'); // Normaliza a medianoche
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (appointmentDate < today && formData.value.status === 'scheduled') {
    formErrors.value.date = 'Una cita programada no puede tener una fecha pasada.';
  }


  return Object.keys(formErrors.value).length === 0;
};

// Función para verificar conflictos en tiempo real (debounced)
let conflictCheckTimeout = null;
const checkConflictsDebounced = () => {
  clearTimeout(conflictCheckTimeout);
  conflictCheckTimeout = setTimeout(async () => {
    if (formData.value.doctorName && formData.value.date && formData.value.startTime && formData.value.endTime && validateTimeRange()) {
      try {
        const params = {
          doctorName: formData.value.doctorName,
          date: formData.value.date,
          startTime: formData.value.startTime,
          endTime: formData.value.endTime,
        };
        if (props.appointment && props.appointment._id) {
          params.excludeId = props.appointment._id; // Excluir la cita actual si estamos editando
        }
        const conflicts = await apiService.checkConflicts(params);
        if (conflicts.length > 0) {
          showConflictAlert.value = true;
          conflictDetails.value = conflicts;
        } else {
          showConflictAlert.value = false;
          conflictDetails.value = [];
        }
      } catch (error) {
        console.error('Error al verificar conflictos en tiempo real:', error);
        // Opcional: mostrar un mensaje de error al usuario
      }
    } else {
        showConflictAlert.value = false; // Resetear si no hay suficientes datos
    }
  }, 500); // Esperar 500ms después de la última pulsación/cambio
};

// Pequeña validación de rango de tiempo para el debounce
const validateTimeRange = () => {
    const start = new Date(`2000-01-01T${formData.value.startTime}:00`);
    const end = new Date(`2000-01-01T${formData.value.endTime}:00`);
    return end > start;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return; // No enviar si hay errores de validación local
  }

  isLoading.value = true;
  showConflictAlert.value = false; // Ocultar alerta de conflicto antes de intentar guardar

  try {
    const dataToSend = { ...formData.value };
    // Asegurarse de que la fecha se envíe en el formato correcto (ISO 8601)
    //dataToSend.date = new Date(dataToSend.date).toISOString(); linea de conflicto 

    if (props.appointment && props.appointment._id) {
      // Editar cita existente
      await apiService.updateAppointment(props.appointment._id, dataToSend);
    } else {
      // Crear nueva cita
      await apiService.createAppointment(dataToSend);
    }
    emit('saved'); // Notificar al componente padre que se guardó
  } catch (error) {
    if (error.response && error.response.status === 409) {
      // El backend reportó un conflicto
      conflictDetails.value = error.response.data.conflicts || [];
      showConflictAlert.value = true;
      formErrors.value.general = error.response.data.message || 'Se detectaron conflictos de horario.';
    } else if (error.response && error.response.data && error.response.data.message) {
      // Otros errores del backend con mensaje específico
      formErrors.value.general = error.response.data.message;
    } else {
      formErrors.value.general = 'Ocurrió un error inesperado al guardar la cita.';
    }
    console.error('Error al guardar cita:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  emit('cancel'); // Notificar al padre para cerrar el formulario
};
</script>

<template>
  <div class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-40">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">{{ props.appointment ? 'Editar Cita' : 'Crear Nueva Cita' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label for="patientName" class="block text-gray-700 text-sm font-bold mb-2">Nombre del Paciente:</label>
            <input
              type="text"
              id="patientName"
              v-model="formData.patientName"
              @input="formErrors.patientName = null"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{ 'border-red-500': formErrors.patientName }"
            />
            <p v-if="formErrors.patientName" class="text-red-500 text-xs italic">{{ formErrors.patientName }}</p>
          </div>

          <div>
            <label for="doctorName" class="block text-gray-700 text-sm font-bold mb-2">Nombre del Doctor:</label>
            <input
              type="text"
              id="doctorName"
              v-model="formData.doctorName"
              @input="formErrors.doctorName = null; checkConflictsDebounced()"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{ 'border-red-500': formErrors.doctorName }"
            />
            <p v-if="formErrors.doctorName" class="text-red-500 text-xs italic">{{ formErrors.doctorName }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label for="date" class="block text-gray-700 text-sm font-bold mb-2">Fecha:</label>
            <input
              type="date"
              id="date"
              v-model="formData.date"
              @input="formErrors.date = null; checkConflictsDebounced()"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{ 'border-red-500': formErrors.date }"
            />
            <p v-if="formErrors.date" class="text-red-500 text-xs italic">{{ formErrors.date }}</p>
          </div>

          <div>
            <label for="startTime" class="block text-gray-700 text-sm font-bold mb-2">Hora Inicio:</label>
            <input
              type="time"
              id="startTime"
              v-model="formData.startTime"
              @input="formErrors.startTime = null; checkConflictsDebounced()"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{ 'border-red-500': formErrors.startTime }"
            />
            <p v-if="formErrors.startTime" class="text-red-500 text-xs italic">{{ formErrors.startTime }}</p>
          </div>

          <div>
            <label for="endTime" class="block text-gray-700 text-sm font-bold mb-2">Hora Fin:</label>
            <input
              type="time"
              id="endTime"
              v-model="formData.endTime"
              @input="formErrors.endTime = null; checkConflictsDebounced()"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{ 'border-red-500': formErrors.endTime }"
            />
            <p v-if="formErrors.endTime" class="text-red-500 text-xs italic">{{ formErrors.endTime }}</p>
          </div>
        </div>

        <div class="mb-4">
          <label for="reason" class="block text-gray-700 text-sm font-bold mb-2">Motivo:</label>
          <textarea
            id="reason"
            v-model="formData.reason"
            @input="formErrors.reason = null"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'border-red-500': formErrors.reason }"
            rows="3"
          ></textarea>
          <p v-if="formErrors.reason" class="text-red-500 text-xs italic">{{ formErrors.reason }}</p>
        </div>

        <div class="mb-6">
          <label for="status" class="block text-gray-700 text-sm font-bold mb-2">Estado:</label>
          <select
            id="status"
            v-model="formData.status"
            @change="formErrors.status = null"
            class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'border-red-500': formErrors.status }"
          >
            <option v-for="s in statuses" :key="s" :value="s">{{ s.charAt(0).toUpperCase() + s.slice(1) }}</option>
          </select>
          <p v-if="formErrors.status" class="text-red-500 text-xs italic">{{ formErrors.status }}</p>
        </div>

        <p v-if="formErrors.general" class="text-red-500 text-sm italic mb-4">{{ formErrors.general }}</p>

        <div class="flex items-center justify-between">
          <button
            type="submit"
            :disabled="isLoading"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Guardando...' : (props.appointment ? 'Actualizar Cita' : 'Crear Cita') }}
          </button>
          <button
            type="button"
            @click="handleCancel"
            class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
          >
            Cancelar
          </button>
        </div>
      </form>
      
      <!-- Alerta de conflicto -->
      <ConflictAlert v-if="showConflictAlert" :conflicts="conflictDetails" :onClose="() => showConflictAlert = false" />
    </div>
  </div>
</template>