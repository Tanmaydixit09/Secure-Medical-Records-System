const multer = require('multer');
const path = require('path');

// Set Storage Engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb){
    // Rename file to: fieldname-date.extension (e.g., profile-12345.jpg)
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
});

// Check File Type (Images only)
function checkFileType(file, cb){
  const filetypes = /jpeg|jpg|png|pdf/; // Allow PDF for ID proof
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images or PDFs Only!');
  }
}

module.exports = upload;