<script setup>
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
//const filterDate = ref('');
//const filterDoctor = ref('');
//const filterStatus = ref('');
//const statuses = ['all', 'scheduled', 'completed', 'cancelled'];
const filterStartDate = ref(''); // Reemplazamos filterDate por startDate
const filterEndDate = ref('');   // y añadimos endDate
const filterDoctor = ref('');
const filterStatus = ref('');


const fetchAppointments = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const params = {
      page: currentPage.value,
      limit: limit.value,
    };
    // -- CAMBIO EN LOS PARÁMETROS --
    if (filterStartDate.value) params.startDate = filterStartDate.value;
    if (filterEndDate.value) params.endDate = filterEndDate.value;
    if (filterDoctor.value) params.doctorName = filterDoctor.value;
    if (filterStatus.value && filterStatus.value !== 'all') params.status = filterStatus.value;

    const response = await apiService.getAppointments(params);
    
    appointments.value = response.data;
    totalPages.value = response.totalPages;
    currentPage.value = response.currentPage;

  } catch (err) {
    // ... (el resto de la función se queda igual)
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
  // Al guardar, volvemos a la primera página para ver el nuevo elemento (opcional)
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
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

onMounted(() => {
  fetchAppointments();
});

// Reiniciar a la página 1 cuando se aplica un filtro
const resetAndFetch = () => {
  currentPage.value = 1;
  fetchAppointments();
}

// Watchers para los filtros
let debounceTimeout = null;
watch(filterStartDate, resetAndFetch);
watch(filterEndDate, resetAndFetch); // Añadimos un watcher para endDate
watch(filterDoctor, (newValue) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(resetAndFetch, 300);
});
watch(filterStatus, resetAndFetch);
</script>

<template>
  <div class="container mx-auto p-4 md:p-8">
    <h1 class="text-3xl font-extrabold mb-6 text-gray-800">Sistema de Gestión de Citas</h1>

    <!-- Sección de Filtros y Crear Cita -->
    <div class="bg-white shadow-lg rounded-lg p-6 mb-8">
      <h2 class="text-xl font-bold mb-4 text-gray-700">Filtros</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- INICIO: Reemplazo del filtro de fecha -->
        <div>
          <label for="filterStartDate" class="block text-sm font-medium text-gray-700">Desde Fecha:</label>
          <input type="date" id="filterStartDate" v-model="filterStartDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
        </div>
        <div>
          <label for="filterEndDate" class="block text-sm font-medium text-gray-700">Hasta Fecha:</label>
          <input type="date" id="filterEndDate" v-model="filterEndDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
        </div>
        <!-- FIN: Reemplazo del filtro de fecha -->

        <div>
          <label for="filterDoctor" class="block text-sm font-medium text-gray-700">Doctor:</label>
          <input type="text" id="filterDoctor" v-model="filterDoctor" placeholder="Nombre del doctor" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
        </div>
        <div>
          <label for="filterStatus" class="block text-sm font-medium text-gray-700">Estado:</label>
          <select id="filterStatus" v-model="filterStatus" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
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
    <div class="bg-white shadow-lg rounded-lg p-6">
      <h2 class="text-xl font-bold mb-4 text-gray-700">Citas Programadas</h2>

      <p v-if="isLoading" class="text-center text-blue-600 text-lg">Cargando citas...</p>
      <p v-else-if="error" class="text-center text-red-600 text-lg">{{ error }}</p>
      <div v-else>
        <p v-if="appointments.length === 0" class="text-center text-gray-600 text-lg">No hay citas que coincidan con los filtros.</p>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="appointment in appointments" :key="appointment._id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ appointment.patientName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ appointment.doctorName }}</td>
               <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {{ 
    new Date(appointment.date).toLocaleDateString('es-ES', { 
      timeZone: 'UTC', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }) 
  }}
</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ appointment.startTime }} - {{ appointment.endTime }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs overflow-hidden text-ellipsis">{{ appointment.reason }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    :class="['px-2 inline-flex text-xs leading-5 font-semibold rounded-full', getStatusBadgeClass(appointment.status)]"
                  >
                    {{ appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="openEditForm(appointment)" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                  <button @click="handleDelete(appointment._id)" class="text-red-600 hover:text-red-900">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

<!-- INICIO: Controles de Paginación -->
        <div v-if="!isLoading && totalPages > 1" class="flex items-center justify-between mt-6">
          <button
            @click="goToPrevPage"
            :disabled="currentPage <= 1"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          <span class="text-sm text-gray-700">
            Página <span class="font-medium">{{ currentPage }}</span> de <span class="font-medium">{{ totalPages }}</span>
          </span>
          
          <button
            @click="goToNextPage"
            :disabled="currentPage >= totalPages"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
</template>