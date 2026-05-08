const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');

// Authentication routes
router.post('/add', inventoryController.addProduct);
// router.post('/import-from-excel', inventoryController.imporFromExcel);
router.get('/list', inventoryController.listAllProducts);
// router.get('/search/:barcodeID', inventoryController.searchByBarcode);
// router.post('/search-by-name', inventoryController.searchByName);
// router.put('/update/:productID', inventoryController.updateProduct);
// router.put('/return', inventoryController.returnProduct);
// router.delete('/delete/:id', inventoryController.deleteSingleProduct);
// router.delete('/delete/multiple/', inventoryController.deleteMultipleProducts);

module.exports = router;