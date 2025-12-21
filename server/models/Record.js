const mongoose = require('mongoose');

const recordSchema = mongoose.Schema(
  {
    // Link to the Patient (The owner of the data)
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', 
    },
    // Link to the Doctor (The creator of the data)
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    diagnosis: {
      type: String,
      required: true,
    },
    treatment: {
      type: String,
      required: true,
    },
    medications: {
      type: String, // You could make this an Array [], but String is easier for now
      required: false,
    },
    // Confidentiality Flag: If true, maybe requires extra admin permission?
    isConfidential: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Record', recordSchema);