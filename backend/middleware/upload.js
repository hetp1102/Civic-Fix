const multer = require('multer');
const path = require('path');
const fs = require('fs');

const makeStorage = (subfolder) => {
  const dest = path.join(__dirname, '..', 'uploads', subfolder);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|mp4|mov|webm/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only image (jpg, png, webp) and video (mp4, mov, webm) files are allowed.'));
};

const limits = { fileSize: 50 * 1024 * 1024, files: 6 }; // 50MB per file, 6 files max

const uploadBefore = multer({ storage: makeStorage('before'), fileFilter, limits });
const uploadAfter = multer({ storage: makeStorage('after'), fileFilter, limits });

module.exports = { uploadBefore, uploadAfter };
