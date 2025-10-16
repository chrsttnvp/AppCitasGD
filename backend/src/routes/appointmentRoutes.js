const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Rutas para /api/appointments
router.post('/', appointmentController.createAppointment);         // Crear nueva cita
router.get('/', appointmentController.getAppointments);            // Listar todas las citas con filtros
router.get('/conflicts/check', appointmentController.checkConflicts); // Verificar conflictos

// Rutas con ID específico
router.get('/:id', appointmentController.getAppointmentById);      // Obtener detalle de una cita
router.put('/:id', appointmentController.updateAppointment);       // Actualizar una cita
router.delete('/:id', appointmentController.deleteAppointment);    // Eliminar una cita

module.exports = router;