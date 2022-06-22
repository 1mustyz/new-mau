const multer = require('multer');
const storage = require('../config/multerConfig');

const singleUpload = multer({
    storage: storage.storage,
    limits: {fileSize: 2048 * 2048 }
  }).single('profile_pic');

const singleFileUpload = multer({
    storage: storage.storageFile,
    limits: {fileSize: 80000000 }
}).single('file');



  module.exports = {
      singleUpload,
      singleFileUpload
     
  }