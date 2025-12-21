const mongoose = require('mongoose');

const logSchema = mongoose.Schema({
  actorName: { type: String, required: true }, // Who did it? (Dr. Smith)
  action: { type: String, required: true },    // What did they do? (Updated Treatment)
  target: { type: String, required: true },    // To whom? (Patient John)
  type: { type: String, enum: ['report', 'response', 'flag', 'system'], default: 'system' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);