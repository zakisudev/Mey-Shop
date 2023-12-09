import path from 'path';
import express from 'express';
import multer from 'multer';
const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, '../Mey-Shop/frontend/public/uploads'); // uploads folder
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}` // file name
    );
  },
});

// check file type
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/; // allowed file types
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase()); // check extension
  const mimetype = filetypes.test(file.mimetype); // check mimetype
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
}

const upload = multer({
  storage,
});

router.post('/', upload.single('image'), (req, res) => {
  res.send({
    message: 'Image Uploaded',
    image: `/uploads/${req.file.filename}`,
  });
});

export default router;
