const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const {uploadImageToCloudinary , deleteImageFromCloudinary} = require("../middleware/imageUpload"); // Assuming you have a utility function to upload images to Cloudinary


dotenv.config(); // Load environment variables

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d", // Token valid for 7 days
  });
};

// Middleware to Verify JWT Token
exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Unauthorized, token required" });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(404).json({ message: "User not found" });

    next();
  } catch (error) {
    res
      .status(401)
      .json({ message: "Invalid or expired token", error: error.message });
  }
};

// Login or Register User
exports.loginOrRegister = async (req, res) => {
  try {
    const { email, password, username, phone, level, ageGroup, DOB } = req.body;
    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file.buffer);
    }
    console.log(imageUrl);

    let user = await User.findOne({ email });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid password" });
      }

      const token = generateToken(user);
      return res.status(200).json({ message: "Login successful", user, token });
    }

    if(!username || !phone || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      phone,
      level,
      ageGroup,
      DOB,
      image: imageUrl, // Cloudinary URL
    });

    await newUser.save();

    const token = generateToken(newUser);
    return res.status(201).json({ message: "User created, complete profile", user: newUser, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update User Profile (Protected Route)const uploadImageToCloudinary = require("../middleware/imageUpload"); // ensure this is imported

exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      phone,
      premium,
      paymentDetails,
      level,
      ageGroup,
      DOB,
      email,
    } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let imageUrl, imagePublicId;

    // Upload new image to Cloudinary if provided
    if (req.file) {
      // Delete old image
      if (user.imagePublicId) {
        await deleteImageFromCloudinary(user.imagePublicId);
      }

      const uploadResult = await uploadImageToCloudinary(req.file.buffer);
      imageUrl = uploadResult.url;
      imagePublicId = uploadResult.public_id;
    }

    // Check for existing username
    if (username) {
      const existingUsername = await User.findOne({
        username,
        _id: { $ne: id },
      });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Check for existing email
    if (email) {
      const existingEmail = await User.findOne({
        email,
        _id: { $ne: id },
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    const updateData = {
      email,
      username,
      phone,
      premium,
      paymentDetails,
      level,
      ageGroup,
      DOB,
    };

    if (imageUrl) {
      updateData.image = imageUrl;
      updateData.imagePublicId = imagePublicId;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};



// Get All Users (Protected Route)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// Get a Single User by ID (Protected Route)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

// Delete a User (Protected Route)
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};