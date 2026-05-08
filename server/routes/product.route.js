const express = require('express');
const router = express.Router();
const path = require("path");
const multer = require("multer");
const productController = require('../controllers/product.controller');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// Authentication routes
router.post('/add', upload.single("image"), productController.addProduct);
router.get('/list', productController.listAllProducts);
router.put('update/:id', upload.single("image"), productController.updateProduct);
router.delete('delete/:id', productController.deleteSingleProduct);
router.delete('/delete/multiple/', productController.deleteMultipleProducts);

module.exports = router;