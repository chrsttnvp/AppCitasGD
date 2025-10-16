// Función auxiliar que ya teníamos
const timeToMinutes = (timeString) => {
    if (!timeString || !timeString.includes(':')) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Verifica si una nueva cita se solapa con una lista de citas existentes.
 * @param {object} newAppointment - La nueva cita a verificar. Contiene { startTime, endTime }.
 * @param {Array<object>} existingAppointments - Un array de citas existentes.
 * @returns {Array<object>} - Un array de las citas que entran en conflicto.
 */
function findConflictingAppointments(newAppointment, existingAppointments) {
    const newStartMinutes = timeToMinutes(newAppointment.startTime);
    const newEndMinutes = timeToMinutes(newAppointment.endTime);

    if (newEndMinutes <= newStartMinutes) {
        return []; // No puede haber conflicto si el rango de tiempo es inválido
    }

    return existingAppointments.filter(existingApp => {
        const existingStartMinutes = timeToMinutes(existingApp.startTime);
        const existingEndMinutes = timeToMinutes(existingApp.endTime);

        // Lógica de solapamiento: (nuevaInicio < existenteFin) AND (nuevaFin > existenteInicio)
        // Esto cubre todos los casos: total, parcial y envolvente.
        // Las citas consecutivas (ej. nuevaFin === existenteInicio) no cumplen la condición, lo cual es correcto.
        
        return newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes;
    });
}

module.exports = { findConflictingAppointments, timeToMinutes };