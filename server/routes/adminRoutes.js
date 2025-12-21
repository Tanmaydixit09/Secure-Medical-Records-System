const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');

// 1. GET UNASSIGNED PATIENTS (The Triage Queue)
// Route: GET /api/admin/patients
router.get('/patients', protect, authorize('admin'), async (req, res) => {
  try {
    // Find patients who DO NOT have an assigned doctor yet
    const patients = await User.find({ role: 'patient', assignedDoctor: null })
      .select('-password'); // Don't send passwords
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 2. GET ALL DOCTORS (The Roster)
// Route: GET /api/admin/doctors
router.get('/doctors', protect, authorize('admin'), async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 3. ASSIGN DOCTOR TO PATIENT
// Route: PUT /api/admin/assign
router.put('/assign', protect, authorize('admin'), async (req, res) => {
  const { patientId, doctorId } = req.body;
  try {
    const patient = await User.findById(patientId);
    if (patient) {
      patient.assignedDoctor = doctorId;
      await patient.save();
      res.json({ message: 'Assigned successfully', patient });
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Assignment failed' });
  }
});

// 4. VERIFY DOCTOR (Approve their account)
// Route: PUT /api/admin/verify/:id
router.put('/verify/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (doctor) {
      doctor.isVerified = true;
      await doctor.save();
      res.json({ message: 'Doctor verified' });
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Verification failed' });
  }
});

module.exports = router;