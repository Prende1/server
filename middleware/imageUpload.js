const cloudinary = require("./cloudinary");

const uploadImageToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "Vocab_profiles" }, (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      })
      .end(fileBuffer);
  });
};

module.exports = uploadImageToCloudinary;
