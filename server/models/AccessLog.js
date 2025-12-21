const mongoose = require('mongoose');

const accessLogSchema = mongoose.Schema(
  {
    // Who did the action?
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // What record did they look at?
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Sometimes they might just view the dashboard
      ref: 'Record',
    },
    action: {
      type: String, // e.g., "VIEW_RECORD", "LOGIN", "EXPORT_PDF"
      required: true,
    },
    details: {
      type: String, // e.g., "Dr. Smith viewed Patient John's file"
    }
  },
  {
    timestamps: true, // This records the EXACT time it happened
  }
);

module.exports = mongoose.model('AccessLog', accessLogSchema);