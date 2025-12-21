const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Import Multer
const User = require('../models/User');

// 1. GET USER DATA (With Doctor Details)
// Route: GET /api/records/me
router.get('/me', protect, async (req, res) => {
  try {
    // --- CHANGE IS HERE: .populate() ---
    const user = await User.findById(req.user._id)
      .populate('assignedDoctor', 'name specialization phone license'); 
      // This swaps the "ID" for the actual Object { name: 'Dr. Smith', phone: '...' }
      
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 2. UPDATE VITALS
router.put('/vitals', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.vitals = req.body;
      const updatedUser = await user.save();
      res.json(updatedUser.vitals);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// 3. ADD MEDICAL HISTORY
router.post('/history', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.medicalHistory.push(req.body);
      await user.save();
      res.status(201).json(user.medicalHistory);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to add history' });
  }
});

// 4. UPLOAD REPORT
router.post('/upload-report', protect, upload.single('file'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if(user && req.file) {
      const newReport = {
        name: req.body.fileName || req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        type: req.body.fileType || 'Document',
        description: req.body.description || "", // <--- CAPTURE DESCRIPTION
        uploadedBy: req.user.role === 'doctor' ? 'Doctor' : 'Patient'
      };
      
      user.reports.push(newReport);
      await user.save();
      res.json(user.reports);
    } else {
      res.status(400).json({ message: 'Upload failed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// 5. ARCHIVE TREATMENT (Patient Closes Case)
router.post('/archive-treatment', protect, async (req, res) => {
  try {
    const { rating, serviceRating, comment } = req.body;
    const user = await User.findById(req.user._id).populate('assignedDoctor');

    if (!user || !user.activeTreatment || !user.activeTreatment.diagnosis) {
      return res.status(400).json({ message: 'No active treatment to close' });
    }

    // 1. Create the History Object
    const historyItem = {
      condition: user.activeTreatment.diagnosis,
      doctorName: user.assignedDoctor ? user.assignedDoctor.name : "Unknown",
      startDate: user.activeTreatment.startDate,
      endDate: new Date(),
      status: 'Cured',
      
      // Save the Snapshot
      treatmentSnapshot: user.activeTreatment,
      timelineLogs: [...user.treatmentLog], // Copy array
      savedReports: [...user.reports],       // Copy array
      
      // Save Feedback
      feedback: {
        rating,
        serviceRating,
        comment
      }
    };

    // 2. Push to History
    user.medicalHistory.push(historyItem);

    // 3. Reset Active Data (Clear the board)
    user.activeTreatment = { diagnosis: "", advice: "", medicines: "" };
    user.treatmentLog = [];
    user.reports = []; 
    user.assignedDoctor = null; // Optional: Unassign doctor on closure?

    await user.save();
    res.json({ message: 'Treatment archived successfully', history: user.medicalHistory });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Archiving failed' });
  }
});

module.exports = router;