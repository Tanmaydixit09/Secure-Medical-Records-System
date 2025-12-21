const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const mongoose = require('mongoose');

// 1. BOOK APPOINTMENT / REQUEST CONSULTANCY
router.post('/book', protect, async (req, res) => {
  try {
    const { 
      department, date, notes, // Standard fields
      type, symptoms, vitals   // New Consultancy fields
    } = req.body;
    
    const appointment = await Appointment.create({
      patientId: req.user._id,
      patientName: req.user.name,
      patientPhone: req.user.phone, // Save phone automatically
      department,
      date,
      notes,
      status: 'Pending',
      
      // Save New Fields
      type: type || 'General',
      symptoms: symptoms || "",
      vitalsSnapshot: vitals || {} // Save the copied vitals
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Booking failed' });
  }
});

// 2. GET MY APPOINTMENTS (Patient View)
router.get('/my-appointments', protect, async (req, res) => {
  try {
    // Find appointments only for the logged-in user, sorted newest first
    const appointments = await Appointment.find({ patientId: req.user._id })
      .sort({ createdAt: -1 }); 
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// 3. GET ALL APPOINTMENTS (Admin View)
router.get('/all', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({}).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// 4. UPDATE STATUS & ASSIGN DOCTOR (Admin Action)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, doctorId, doctorName, time } = req.body;
    
    // 1. Find the Appointment
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Not found' });

    // 2. Update Basic Fields
    appointment.status = status;
    
    if (status === 'Confirmed') {
      // If Admin assigned a doctor/time
      if (doctorId) appointment.doctorId = doctorId;
      if (doctorName) appointment.doctorName = doctorName;
      if (time) appointment.time = time;

      // 3. CRITICAL: If this was a 'Consultancy' request, LINK PATIENT TO DOCTOR
      if (appointment.type === 'Consultancy' && doctorId) {
        const patient = await User.findById(appointment.patientId);
        
        if (patient) {
          // A. Assign the Doctor permanently
          patient.assignedDoctor = doctorId; 
          
          // B. Initialize the Active Treatment block if it's missing
          // This ensures the "Active Plan" card appears on Patient Dashboard
          if (!patient.activeTreatment || !patient.activeTreatment.diagnosis) {
             patient.activeTreatment = {
               diagnosis: "Pending Diagnosis", // Placeholder
               advice: "Please visit doctor for initial assessment.",
               medicines: "",
               startDate: new Date()
             };
          }
          await patient.save();
          console.log(`Patient ${patient.name} assigned to Doctor ID: ${doctorId}`);
        }
      }
    }

    const updatedAppt = await appointment.save();
    res.json(updatedAppt);

  } catch (error) {
    console.error("Assignment Error:", error);
    res.status(500).json({ message: 'Update failed' });
  }
});
// 5. GET DOCTOR'S APPOINTMENTS
router.get('/doctor-appointments', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ 
      doctorId: req.user._id, // This matches the ID we saved above
      status: 'Confirmed'     // Must be Confirmed
    }).sort({ date: 1, time: 1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule' });
  }
});
// 6. COMPLETE APPOINTMENT (Doctor Action)
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (appointment) {
      appointment.status = 'Completed'; // Mark as done
      await appointment.save();
      res.json(appointment);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

module.exports = router;