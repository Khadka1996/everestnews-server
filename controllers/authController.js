const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/authModels'); // Import User model

const registerUser = async (req, res) => {
  const { username, email, password, gender } = req.body;

  try {
    console.log('Received registration request:', req.body);

    // Check if user already exists with the provided email
    let user = await User.findOne({ email });

    if (user) {
      console.log('User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user object
    user = new User({
      username,
      email,
      password, // Note: This will be hashed later
      gender,
    });

    // Hash the password before saving to the database
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save the user to the database
    await user.save();

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        gender: user.gender,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).send('Server Error');
  }
};


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if the user is an admin
    if (user.role === 'admin') {
      // If user is an admin, generate JWT token and redirect to dashboard
      const payload = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          gender: user.gender,
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) {
            console.error('Error generating token:', err);
            return res.status(500).json({ message: 'Server Error' });
          }

          res.json({ token, redirect: '/' }); // Include redirect URL
        }
      );
    } else {
      // If user is not an admin, generate JWT token without redirect
      const payload = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          gender: user.gender,
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) {
            console.error('Error generating token:', err);
            return res.status(500).json({ message: 'Server Error' });
          }


          res.json({ token });
        }
      );
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).send('Server Error');
  }
};


const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    let user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

const getUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ role: user.role });
  } catch (error) {
    console.error('Error fetching user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserLogout = (req, res) => {
  try {
    res.clearCookie('accessToken');
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getUserInfo = async (req, res) => {
  try {
    // Fetch user information based on the user ID from the token
    const user = await User.findById(req.user.id).select('username gender role');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user); // Send user information in the response
  } catch (error) {
    console.error('Error fetching user information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('username online');
    res.json({ admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateAdminStatus = async (userId, onlineStatus) => {
  try {
    await User.findByIdAndUpdate(userId, { online: onlineStatus });
  } catch (error) {
    console.error('Error updating admin status:', error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  updateUserRole,
  getUserRole,
  getUserInfo,
  getUserLogout,
  getAllAdmins,
  updateAdminStatus,
};