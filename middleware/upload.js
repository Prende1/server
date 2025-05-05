const multer = require('multer');

// Set up multer for memory storage
const storage = multer.memoryStorage();

// Multer configuration
const upload = multer({
  storage: storage,
}).single('image'); // Restricting to a single image upload

// Export the upload middleware
module.exports = upload;
