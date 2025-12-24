require('dotenv').config(); // Load environment variables

const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateUserRole, getUserRole, getUserLogout, getUserInfo, getAllAdmins } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Register a new user
router.post('/register', (req, res) => {
  console.log('Received registration request:', req.body);
  registerUser(req, res);
});

// Login user
router.post('/login', (req, res) => {
  console.log('Received login request:', req.body);
  loginUser(req, res);
});

// Update user role (admin)
router.put('/user/:id/update-role', authMiddleware, (req, res) => {
  console.log('Received update role request:', req.body);
  updateUserRole(req, res);
});

// Route to get the user's role
router.get('/user/role', authMiddleware, getUserRole);

// Route to get user information
router.get('/user-info', authMiddleware, getUserInfo);

// Route to Logout
router.post('/logout', getUserLogout);

// Get all admins
router.get('/admins', getAllAdmins);

// Update admin status (online/offline)
router.post('/admin/status/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { onlineStatus } = req.body; // Online status should be true/false
  updateAdminStatus(id, onlineStatus);
  res.json({ message: 'Admin status updated' });
});

module.exports = router;