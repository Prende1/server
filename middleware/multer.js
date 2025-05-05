const multer = require('multer');

// Set up multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
