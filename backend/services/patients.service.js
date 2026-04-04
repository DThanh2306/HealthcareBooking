// services/patients.service.js
// This file now delegates to the new modular services
const appointmentService = require("./appointment.service");
const appointmentRescheduleService = require("./appointmentReschedule.service");

// Re-export all appointment-related functions
exports.createPatient = appointmentService.createAppointment;
exports.updateStatus = appointmentService.updateAppointmentStatus;
exports.cancelAppointment = appointmentService.cancelAppointment;
exports.getPaginatedPatients = appointmentService.getPaginatedAppointments;
exports.getPatientsByUserId = appointmentService.getAppointmentsByUserId;
exports.getAppointmentsByUserId = appointmentService.getAppointmentsByUserId;
exports.getAppointmentsByDoctorUserId = appointmentService.getAppointmentsByDoctorUserId;
exports.getBookedSlots = appointmentService.getBookedSlots;

// Re-export reschedule functions
exports.proposeReschedule = appointmentRescheduleService.proposeReschedule;
exports.acceptReschedule = appointmentRescheduleService.acceptReschedule;
exports.declineReschedule = appointmentRescheduleService.declineReschedule;
