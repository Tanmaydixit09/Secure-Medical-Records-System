const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const upload = require('../middleware/uploadMiddleware'); 
const router = express.Router();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, specialization, license, age, bloodGroup } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const user = await User.create({
      name, email, password: hashedPassword, phone,
      role: role || 'patient',
      otp, otpExpires, isPhoneVerified: false,
      specialization: role === 'doctor' ? specialization : undefined,
      license: role === 'doctor' ? license : undefined,
      vitals: { age: age || "N/A", bloodGroup: bloodGroup || "N/A", height: "N/A", weight: "N/A" }
    });

    if (user) {
      console.log(`>>> MOCK SMS TO ${phone}: YOUR OTP IS ${otp} <<<`); 
      res.status(201).json({ 
        message: 'Register Success. Please verify OTP.', 
        userId: user._id,
        email: user.email 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. VERIFY OTP (FIXED: Now returns Phone & Email)
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp === otp && user.otpExpires > Date.now()) {
      user.isPhoneVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,         // <--- ADDED
        phone: user.phone,         // <--- ADDED
        role: user.role,
        profilePicture: user.profilePicture,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid or Expired OTP' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Verification Failed' });
  }
});

// 3. LOGIN (FIXED: Now returns Phone)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if(!email) return res.status(400).json({message:"dbwekj"});
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Optional: Check phone verification
      // if (!user.isPhoneVerified) return res.status(403).json({ message: 'Verify Phone First' });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,          // <--- ADDED
        role: user.role,
        profilePicture: user.profilePicture,
        token: generateToken(user._id),
        
        // Include Doctor/Patient specific fields if needed
        specialization: user.specialization,
        isVerified: user.isVerified
      });
    } else {
     
      
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ... (Keep Forgot/Reset/Update routes as they were) ...
// 4. FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    console.log(`>>> RESET PASSWORD OTP FOR ${email}: ${otp} <<<`);
    res.json({ message: 'OTP Sent', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

// 5. RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { userId, otp, newPassword } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    res.json({ message: 'Password Reset Successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// 6. UPDATE PROFILE
router.put('/update-profile/:id', upload.fields([{ name: 'profilePicture' }, { name: 'identityProof' }]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.files['profilePicture']) user.profilePicture = `/uploads/${req.files['profilePicture'][0].filename}`;
    if (req.files['identityProof']) user.identityProof = `/uploads/${req.files['identityProof'][0].filename}`;

    const updatedUser = await user.save();
    
    // Return FULL data so frontend updates correctly
    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
        token: req.headers.authorization?.split(' ')[1] // Keep existing token
    });
  } catch (error) {
    res.status(500).json({ message: 'Profile Update Failed' });
  }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

module.exports = router;