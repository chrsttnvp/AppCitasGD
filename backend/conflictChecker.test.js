import { describe, it, expect } from 'vitest';
const { findConflictingAppointments } = require('./src/utils/conflictChecker');

// Datos de prueba
const existingAppointment = { startTime: '10:00', endTime: '11:00' };
const existingAppointmentsList = [existingAppointment];

describe('findConflictingAppointments', () => {

  // Escenario 1: Solapamiento Total
  it('should detect a total overlap (new appointment inside existing)', () => {
    const newAppointment = { startTime: '10:15', endTime: '10:45' };
    const conflicts = findConflictingAppointments(newAppointment, existingAppointmentsList);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]).toEqual(existingAppointment);
  });

  // Escenario 2: Solapamiento Parcial (Inicio)
  it('should detect a partial overlap (new appointment starts before and ends inside)', () => {
    const newAppointment = { startTime: '09:30', endTime: '10:30' };
    const conflicts = findConflictingAppointments(newAppointment, existingAppointmentsList);
    expect(conflicts.length).toBe(1);
  });

  // Escenario 3: Solapamiento Parcial (Fin)
  it('should detect a partial overlap (new appointment starts inside and ends after)', () => {
    const newAppointment = { startTime: '10:30', endTime: '11:30' };
    const conflicts = findConflictingAppointments(newAppointment, existingAppointmentsList);
    expect(conflicts.length).toBe(1);
  });

  // Escenario 4: Citas Consecutivas
  it('should NOT detect an overlap for consecutive appointments', () => {
    const newAppointment = { startTime: '11:00', endTime: '12:00' };
    const conflicts = findConflictingAppointments(newAppointment, existingAppointmentsList);
    expect(conflicts.length).toBe(0);
  });

  // Escenario 5: Mismo Horario, pero se asume que se filtró por doctor antes (no se testea aquí)

  // Escenario 6: Cita Envolvente
  it('should detect an overlap when a new appointment envelops an existing one', () => {
    const newAppointment = { startTime: '09:00', endTime: '12:00' };
    const conflicts = findConflictingAppointments(newAppointment, existingAppointmentsList);
    expect(conflicts.length).toBe(1);
  });

  it('should not find conflicts if the existing list is empty', () => {
    const newAppointment = { startTime: '14:00', endTime: '15:00' };
    const conflicts = findConflictingAppointments(newAppointment, []);
    expect(conflicts.length).toBe(0);
  });

  it('should not find conflicts for appointments that do not overlap', () => {
    const newAppointment = { startTime: '14:00', endTime: '15:00' };
    const conflicts = findConflictingAppointments(newAppointment, existingAppointmentsList);
    expect(conflicts.length).toBe(0);
  });

});