const mongoose = require('mongoose');

// UPDATED: Rich History Schema (Stores the full snapshot)
const historySchema = mongoose.Schema({
  condition: { type: String, required: true }, // Diagnosis
  doctorName: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Cured' },
  
  // Snapshot of the treatment
  treatmentSnapshot: {
    diagnosis: String,
    advice: String,
    medicines: String
  },
  
  // The Logs & Files associated with this treatment
  timelineLogs: [], 
  savedReports: [],

  // Patient Feedback
  feedback: {
    rating: { type: Number, default: 0 },
    serviceRating: { type: Number, default: 0 },
    comment: { type: String, default: "" }
  }
});

const userSchema = mongoose.Schema(
  {
    // ... (Keep all existing fields: name, email, password, phone, etc.) ...
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    isPhoneVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
    profilePicture: { type: String, default: "" },
    identityProof: { type: String, default: "" },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },

    // Patient Specific
    vitals: {
      height: { type: String, default: "N/A" },
      weight: { type: String, default: "N/A" },
      age: { type: String, default: "N/A" },
      bloodGroup: { type: String, default: "N/A" }
    },
    
    // HISTORY (Uses the new schema above)
    medicalHistory: [historySchema],
    
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    
    // ACTIVE TREATMENT
    activeTreatment: {
      diagnosis: { type: String, default: "" },
      advice: { type: String, default: "" },
      medicines: { type: String, default: "" },
      startDate: { type: Date, default: Date.now },
      closureRequested: { type: Boolean, default: false } // <--- For Doctor/Admin flow
    },

    // LOGS & REPORTS
    treatmentLog: [{
      diagnosis: String,
      advice: String,
      medicines: String,
      doctorName: String,
      date: { type: Date, default: Date.now }
    }],
    
    reports: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      type: { type: String, default: 'Lab Report' },
      description: { type: String, default: "" },
      uploadedBy: { type: String }, 
      date: { type: Date, default: Date.now }
    }],

    // Doctor Specific
    specialization: { type: String, default: "General" },
    license: { type: String, default: "PENDING" },
    isVerified: { type: Boolean, default: false },
    availability: { type: String, enum: ['Available', 'Busy', 'On Leave'], default: 'Available' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);