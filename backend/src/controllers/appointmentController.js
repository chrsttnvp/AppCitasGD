const { ObjectId } = require('mongodb');
const { findConflictingAppointments, timeToMinutes } = require('../utils/conflictChecker'); 
// Función auxiliar para convertir "HH:mm" a minutos para comparaciones.

// Función para crear una cita

/* FUNCIÓN DESCARTADA
exports.createAppointment = async (req, res) => {
    const { patientName, doctorName, date, startTime, endTime, reason, status } = req.body;
    const citasCollection = req.db.collection('citas');

    if (!patientName || !doctorName || !date || !startTime || !endTime || !reason) {
        return res.status(400).json({ message: 'Todos los campos obligatorios deben ser proporcionados.' });
    }

    try {
        // Validación 1: Hora de fin debe ser posterior a la de inicio.
        if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
            return res.status(400).json({ message: 'La hora de fin debe ser posterior a la hora de inicio.' });
        }

        // Validación 2: No se pueden agendar citas en el pasado.
        const appointmentDateTime = new Date(`${date.split('T')[0]}T${startTime}`);
        if (appointmentDateTime < new Date()) {
            return res.status(400).json({ message: 'No se puede agendar una cita en una fecha y hora que ya ha pasado.' });
        }

        // Preparamos la fecha para la búsqueda en BD (normalizada a medianoche UTC).
        const searchDate = new Date(date);
        searchDate.setUTCHours(0, 0, 0, 0);

        // Validación 3: Detección de solapamiento.
        const existingAppointments = await citasCollection.find({
        doctorName,
         date: searchDate,
        }).toArray();
        const conflictingAppointments = findConflictingAppointments(
        { startTime, endTime }, 
        existingAppointments
);

        if (conflictingAppointments.length > 0) {
            return res.status(409).json({
                message: 'Conflicto de horario: Ya existen citas programadas para este doctor en el rango de tiempo solicitado.',
                conflicts: conflictingAppointments,
            });
        }

        // Si todo está bien, creamos la nueva cita.
        const newAppointment = {
            patientName,
            doctorName,
            date: searchDate,
            startTime,
            endTime,
            reason,
            status: status || 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await citasCollection.insertOne(newAppointment);
        res.status(201).json({ ...newAppointment, _id: result.insertedId });

    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear la cita.' });
    }
};
*/
// btener todas las citas con filtros (incluyendo rango de fechas) y paginación
exports.createAppointment = async (req, res) => {
    const { patientName, doctorName, date, startTime, endTime, reason, status } = req.body;
    const citasCollection = req.db.collection('citas');

    if (!patientName || !doctorName || !date || !startTime || !endTime || !reason) {
        return res.status(400).json({ message: 'Todos los campos obligatorios deben ser proporcionados.' });
    }

    try {
        if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
            return res.status(400).json({ message: 'La hora de fin debe ser posterior a la hora de inicio.' });
        }


       // const appointmentDate = new Date(date); // 'date' ahora es un string ISO completo
       const appointmentDate = new Date(`${date}T${startTime}`); 
       const now = new Date();

        if (appointmentDate < now) {
            return res.status(400).json({ message: 'No se puede agendar una cita en una fecha y hora que ya ha pasado.' });
        }

        
        // Para la búsqueda, normalizamos la fecha a medianoche UTC
        const searchDate = new Date(appointmentDate);
        searchDate.setUTCHours(0, 0, 0, 0);

        const existingAppointments = await citasCollection.find({ doctorName, date: searchDate }).toArray();
        const conflictingAppointments = findConflictingAppointments({ startTime, endTime }, existingAppointments);

        if (conflictingAppointments.length > 0) {
            return res.status(409).json({ message: 'Conflicto de horario...', conflicts: conflictingAppointments });
        }

        const newAppointment = {
            patientName, doctorName, date: searchDate, startTime, endTime, reason,
            status: status || 'scheduled', createdAt: new Date(), updatedAt: new Date(),
        };

        const result = await citasCollection.insertOne(newAppointment);
        res.status(201).json({ ...newAppointment, _id: result.insertedId });

    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear la cita.' });
    }
};

exports.getAppointments = async (req, res) => {
    const db = req.db;
    const { startDate, endDate, doctorName, status } = req.query; // 'startDate' y 'endDate'
    let query = {};

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    try {
       
      const dateQuery = {};
        if (startDate) {
    // La fecha de inicio debe ser el comienzo del día en UTC
    const start = new Date(startDate);
    dateQuery.$gte = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 0, 0, 0, 0));
    }
if (endDate) {
    // La fecha de fin debe ser el final del día en UTC
    const end = new Date(endDate);
    dateQuery.$lte = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59, 999));
}
        
        // Si hay alguna condición de fecha, la añadimos a la consulta principal
        if (Object.keys(dateQuery).length > 0) {
            query.date = dateQuery;
        }
        

        if (doctorName) {
            query.doctorName = { $regex: doctorName, $options: 'i' };
        }
        if (status && status !== 'all') {
            query.status = status;
        }

        const appointmentsCollection = db.collection('citas');

        const totalItems = await appointmentsCollection.countDocuments(query);

        const appointments = await appointmentsCollection.find(query)
            .sort({ date: -1, startTime: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        
        res.status(200).json({
            data: appointments,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems: totalItems,
        });
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las citas.' });
    }
};

//Obtener una cita por su ID
 
exports.getAppointmentById = async (req, res) => {
    const db = req.db;
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID de cita inválido.' });
    }

    try {
        const appointmentsCollection = db.collection('citas');
        const appointment = await appointmentsCollection.findOne({ _id: new ObjectId(id) });

        if (!appointment) {
            return res.status(404).json({ message: 'Cita no encontrada.' });
        }
        res.status(200).json(appointment);
    } catch (error) {
        console.error('Error al obtener cita por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Actualizar una cita existente
exports.updateAppointment = async (req, res) => {
const { id } = req.params;
const { patientName, doctorName, date, startTime, endTime, reason, status } = req.body;
const db = req.db;

if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'ID de cita inválido.' });

try {
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
        return res.status(400).json({ message: 'La hora de fin debe ser posterior a la hora de inicio.' });
    }
    
    if (status === 'scheduled') {
        const appointmentDate = new Date(`${date}T${startTime}`);
        if (appointmentDate < new Date()) {
            return res.status(400).json({ message: 'No se puede reprogramar una cita a una fecha y hora que ya ha pasado.' });
        }
    }

    const searchDate = new Date(date);
    searchDate.setUTCHours(0, 0, 0, 0);

    const appointmentsCollection = db.collection('citas');
    const existingAppointments = await appointmentsCollection.find({
        doctorName,
        date: searchDate,
        _id: { $ne: new ObjectId(id) },
    }).toArray();
    
    const conflictingAppointments = findConflictingAppointments({ startTime, endTime }, existingAppointments);

    if (conflictingAppointments.length > 0) {
        return res.status(409).json({ message: 'Conflicto de horario al actualizar.', conflicts: conflictingAppointments });
    }
    
    const updatedAppointmentData = {
        patientName, doctorName, date: searchDate, startTime, endTime, reason,
        status, updatedAt: new Date(),
    };

    const updateResult = await appointmentsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedAppointmentData }
    );

    if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: 'Cita no encontrada para actualizar.' });
    }

    const updatedAppointment = await appointmentsCollection.findOne({ _id: new ObjectId(id) });
    res.status(200).json(updatedAppointment);

} catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar la cita.' });
}
}

//Eliminar una cita

exports.deleteAppointment = async (req, res) => {
    const db = req.db;
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID de cita inválido.' });
    }

    try {
        const appointmentsCollection = db.collection('citas');
        const result = await appointmentsCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Cita no encontrada para eliminar.' });
        }
        res.status(200).json({ message: 'Cita eliminada exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

//Verificar conflictos de horario

exports.checkConflicts = async (req, res) => {
    const db = req.db;
    const { doctorName, date, startTime, endTime, excludeId } = req.query;

    if (!doctorName || !date || !startTime || !endTime) {
        return res.status(400).json({ message: 'Faltan parámetros para la verificación de conflictos.' });
    }

    try {
        const searchDate = new Date(date);
        searchDate.setUTCHours(0, 0, 0, 0);

        let query = {
            doctorName,
            date: searchDate,
        };

        if (excludeId && ObjectId.isValid(excludeId)) {
            query._id = { $ne: new ObjectId(excludeId) };
        }

        const appointmentsCollection = db.collection('citas');
        const existingAppointments = await appointmentsCollection.find(query).toArray();

        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);

        const conflictingAppointments = existingAppointments.filter(existingApp => {
            const existingStartMinutes = timeToMinutes(existingApp.startTime);
            const existingEndMinutes = timeToMinutes(existingApp.endTime);
            return startMinutes < existingEndMinutes && endMinutes > existingStartMinutes;
        });

        res.status(200).json(conflictingAppointments);
    } catch (error) {
        console.error('Error al verificar conflictos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};