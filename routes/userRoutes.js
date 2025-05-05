const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const upload = require("../middleware/multer");

// Login or Register
router.post("/", upload.single("image"), userController.loginOrRegister);

// Update Profile
router.put(
  "/:id",
  userController.protect,
  upload.single("image"),
  userController.updateUserProfile
);

// Get All Users
router.get("/", userController.protect, userController.getUsers);

// Get Single User by ID
router.get("/:id", userController.protect, userController.getUserById);

// Delete User
router.delete("/:id", userController.protect, userController.deleteUser);

module.exports = router;
