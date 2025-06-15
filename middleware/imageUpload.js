const cloudinary = require("./cloudinary");

const uploadImageToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "Vocab_profiles" }, (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      })
      .end(fileBuffer);
  });
};

const deleteImageFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary Deletion Error:", err.message);
  }
};

// Export both functions
module.exports = {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
};
