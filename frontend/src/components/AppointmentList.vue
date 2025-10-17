<script setup>
import ThemeSwitcher from './ThemeSwitcher.vue';
import { ref, onMounted, watch } from 'vue';
import { apiService } from '../services/api';
import AppointmentForm from './AppointmentForm.vue';

const appointments = ref([]);
const isLoading = ref(true);
const error = ref(null);
const showForm = ref(false);
const selectedAppointment = ref(null);

// Nuevos refs para el estado de la paginación
const currentPage = ref(1);
const totalPages = ref(1);
const limit = ref(5); // Cuántas citas mostrar por página

// Filtros
const filterStartDate = ref('');
const filterEndDate = ref('');
const filterDoctor = ref('');
const filterStatus = ref('');
const statuses = ['all', 'scheduled', 'completed', 'cancelled']; 

const fetchAppointments = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const params = {
      page: currentPage.value,
      limit: limit.value,
    };
    if (filterStartDate.value) params.startDate = filterStartDate.value;
    if (filterEndDate.value) params.endDate = filterEndDate.value;
    if (filterDoctor.value) params.doctorName = filterDoctor.value;
    if (filterStatus.value && filterStatus.value !== 'all') params.status = filterStatus.value;

    const response = await apiService.getAppointments(params);
    
    appointments.value = response.data;
    totalPages.value = response.totalPages;
    currentPage.value = response.currentPage;

  } catch (err) {
    error.value = 'No se pudieron cargar las citas.';
  } finally {
    isLoading.value = false;
  }
};

// Funciones para manejar los botones de paginación
const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchAppointments();
  }
};

const goToPrevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchAppointments();
  }
};

const openCreateForm = () => {
  selectedAppointment.value = null;
  showForm.value = true;
};

const openEditForm = (appointment) => {
  selectedAppointment.value = appointment;
  showForm.value = true;
};

const handleFormSaved = () => {
  showForm.value = false;
  selectedAppointment.value = null;
  currentPage.value = 1; 
  fetchAppointments();
};

const handleFormCancel = () => {
  showForm.value = false;
  selectedAppointment.value = null;
};

const handleDelete = async (id) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
    try {
      isLoading.value = true;
      await apiService.deleteAppointment(id);
      await fetchAppointments();
      alert('Cita eliminada exitosamente.');
    } catch (err) {
      alert('Error al eliminar la cita.');
    } finally {
      isLoading.value = false;
    }
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

onMounted(() => {
  fetchAppointments();
});

const resetAndFetch = () => {
  currentPage.value = 1;
  fetchAppointments();
}

let debounceTimeout = null;
watch(filterStartDate, resetAndFetch);
watch(filterEndDate, resetAndFetch);
watch(filterDoctor, (newValue) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(resetAndFetch, 300);
});
watch(filterStatus, resetAndFetch);
</script>

<template>
  <!-- DARK MODE: Añadimos clases de color de fondo y texto al contenedor principal -->
  <div class="bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
  <div class="container mx-auto p-4 md:p-8">
    
    <div class="flex justify-between items-center mb-6">
      <!-- DARK MODE: Añadimos clase de color de texto al título -->
      <h1 class="text-3xl font-extrabold text-gray-800 dark:text-gray-100">Sistema de Gestión de Citas</h1>
      <ThemeSwitcher />
    </div>

    <!-- Sección de Filtros y Crear Cita -->
    <!-- DARK MODE: Añadimos clases de color de fondo y texto a la tarjeta -->
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
      <h2 class="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Filtros</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- DARK MODE: Añadimos clases de color a los labels e inputs -->
        <div>
          <label for="filterStartDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Desde Fecha:</label>
          <input type="date" id="filterStartDate" v-model="filterStartDate" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
        </div>
        <div>
          <label for="filterEndDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Hasta Fecha:</label>
          <input type="date" id="filterEndDate" v-model="filterEndDate" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
        </div>
        <div>
          <label for="filterDoctor" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Doctor:</label>
          <input type="text" id="filterDoctor" v-model="filterDoctor" placeholder="Nombre del doctor" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
        </div>
        <div>
          <label for="filterStatus" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</label>
          <select id="filterStatus" v-model="filterStatus" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
            <option v-for="s in statuses" :key="s" :value="s">{{ s.charAt(0).toUpperCase() + s.slice(1) }}</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end">
        <button
          @click="openCreateForm"
          class="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          + Nueva Cita
        </button>
      </div>
    </div>

    <!-- Lista de Citas -->
    <!-- DARK MODE: Añadimos clases de color de fondo y texto a la tarjeta de la lista -->
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
      <h2 class="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Citas Programadas</h2>

      <p v-if="isLoading" class="text-center text-blue-600 dark:text-blue-400 text-lg">Cargando citas...</p>
      <p v-else-if="error" class="text-center text-red-600 dark:text-red-400 text-lg">{{ error }}</p>
      <div v-else>
        <p v-if="appointments.length === 0" class="text-center text-gray-600 dark:text-gray-400 text-lg">No hay citas que coincidan con los filtros.</p>
        <div v-else class="overflow-x-auto">
          <!-- DARK MODE: Añadimos clases de color a la tabla -->
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hora</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Motivo</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              <tr v-for="appointment in appointments" :key="appointment._id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{{ appointment.patientName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{{ appointment.doctorName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {{ new Date(appointment.date).toLocaleDateString('es-ES', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{{ appointment.startTime }} - {{ appointment.endTime }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 max-w-xs overflow-hidden text-ellipsis">{{ appointment.reason }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span :class="['px-2 inline-flex text-xs leading-5 font-semibold rounded-full', getStatusBadgeClass(appointment.status)]">
                    {{ appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="openEditForm(appointment)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Editar</button>
                  <button @click="handleDelete(appointment._id)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- INICIO: Controles de Paginación -->
        <!-- DARK MODE: Añadimos clases de color a los controles de paginación -->
        <div v-if="!isLoading && totalPages > 1" class="flex items-center justify-between mt-6">
          <button
            @click="goToPrevPage"
            :disabled="currentPage <= 1"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          <span class="text-sm text-gray-700 dark:text-gray-400">
            Página <span class="font-medium text-gray-900 dark:text-gray-200">{{ currentPage }}</span> de <span class="font-medium text-gray-900 dark:text-gray-200">{{ totalPages }}</span>
          </span>
          
          <button
            @click="goToNextPage"
            :disabled="currentPage >= totalPages"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
        <!-- FIN: Controles de Paginación -->

      </div>
    </div>

    <!-- Modal del Formulario de Citas -->
    <AppointmentForm
      v-if="showForm"
      :appointment="selectedAppointment"
      @saved="handleFormSaved"
      @cancel="handleFormCancel"
    />
  </div>
  </div>
</template>