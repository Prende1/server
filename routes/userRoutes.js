const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Login or Register
router.post("/", userController.loginOrRegister);

// Update Profile
router.put("/:id", userController.updateUserProfile);

// Get All Users
router.get("/", userController.getUsers);

// Get Single User by ID
router.get("/:id", userController.getUserById);

// Delete User
router.delete("/:id", userController.deleteUser);

module.exports = router;
