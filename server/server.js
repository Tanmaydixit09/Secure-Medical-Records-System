const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const recordRoutes = require('./routes/recordRoutes'); // NEW IMPORT
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const path = require('path');
const appointmentRoutes = require('./routes/appointmentRoutes');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes); // NEW ROUTE
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/appointments', appointmentRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});