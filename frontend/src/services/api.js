import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/appointments';

export const apiService = {
  // Obtener todas las citas con filtros
  async getAppointments(params = {}) {
    try {
      const response = await axios.get(API_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener citas:', error);
      throw error;
    }
  },

  // Obtener una cita por ID
  async getAppointmentById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener cita con ID ${id}:`, error);
      throw error;
    }
  },

  // Crear una nueva cita
  async createAppointment(appointmentData) {
    try {
      const response = await axios.post(API_BASE_URL, appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error al crear cita:', error);
      throw error;
    }
  },

  // Actualizar una cita existente
  async updateAppointment(id, appointmentData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/${id}`, appointmentData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar cita con ID ${id}:`, error);
      throw error;
    }
  },

  // Eliminar una cita
  async deleteAppointment(id) {
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      return true; // Indicamos éxito
    } catch (error) {
      console.error(`Error al eliminar cita con ID ${id}:`, error);
      throw error;
    }
  },

  // Verificar conflictos de horario
  async checkConflicts(params) {
    try {
      const response = await axios.get(`${API_BASE_URL}/conflicts/check`, { params });
      return response.data; // Devuelve un array de citas en conflicto
    } catch (error) {
      console.error('Error al verificar conflictos:', error);
      throw error;
    }
  }
};