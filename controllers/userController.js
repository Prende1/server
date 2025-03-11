const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Login or Register User
exports.loginOrRegister = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      // User exists, verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid password" });
      }
      return res.status(200).json({ message: "Login successful", user });
    }

    // If user doesn't exist, create a new one
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      username: "",
      phone: "",
      premium: false,
      paymentDetails: {},
    });

    await newUser.save();
    return res.status(201).json({ message: "User created, complete profile", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server error jbsxjbxj", error: error.message });
  }
};

// Update User Profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, phone, premium, paymentDetails } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, phone, premium, paymentDetails },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

// Get All Users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

// Get a Single User by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

// Delete a User
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};
