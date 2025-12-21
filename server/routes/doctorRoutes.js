const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Log = require('../models/Log');

// 1. GET ASSIGNED PATIENTS
// Route: GET /api/doctor/patients
router.get('/patients', protect, authorize('doctor'), async (req, res) => {
  try {
    // Find all users whose 'assignedDoctor' field matches this Doctor's ID
    const patients = await User.find({ assignedDoctor: req.user._id, role: 'patient' })
      .select('-password'); // Don't send passwords back
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 2. UPDATE TREATMENT (Write Prescription & Save to Log)
router.put('/treatment/:id', protect, authorize('doctor'), async (req, res) => {
  try {
    const patient = await User.findById(req.params.id);

    if (patient) {
      // A. Update the "Active" view (Current Status)
      patient.activeTreatment = {
        diagnosis: req.body.diagnosis,
        advice: req.body.advice,
        medicines: req.body.meds
      };

      // B. Push to "History Log" (The Timeline)
      patient.treatmentLog.push({
        diagnosis: req.body.diagnosis,
        advice: req.body.advice,
        medicines: req.body.meds,
        doctorName: req.user.name, // Log who did it
        date: new Date()
      });

      await patient.save();

      // C. Create System Log (For Admin)
      await Log.create({
        actorName: req.user.name,
        action: `Updated treatment for`,
        target: patient.name,
        type: 'response'
      });

      res.json({ message: 'Treatment updated successfully' });
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Update failed' });
  }
});
// 3. TOGGLE AVAILABILITY (On Leave / Available)
router.put('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if(user) {
      // Toggle logic: If Available -> On Leave, else -> Available
      user.availability = user.availability === 'Available' ? 'On Leave' : 'Available';
      await user.save();
      res.json({ status: user.availability });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Status update failed' });
  }
});

module.exports = router;