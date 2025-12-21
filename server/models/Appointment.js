const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  patientPhone: { type: String }, // Ensure Phone is saved for Admin to see
  
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorName: { type: String },
  time: { type: String },

  department: { type: String, required: true }, // Admin SEES this
  date: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Rejected', 'Completed'], default: 'Pending' },
  
  // --- TYPE OF REQUEST ---
  type: { type: String, default: 'General' }, // 'General' (Meeting) or 'Consultancy' (New Treatment)

  // --- PRIVATE MEDICAL DATA (Admin CANNOT see these in the table) ---
  symptoms: { type: String }, 
  vitalsSnapshot: {
    height: String,
    weight: String,
    age: String,
    bloodGroup: String
  },
  
  notes: { type: String } // Generic notes
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);