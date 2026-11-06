const express = require('express');
const router = express.Router();
const vendorController = require("../controllers/vendor.controller");

router.post('/create', vendorController.addVendor);
router.get('/list', vendorController.listVendors);
router.get('/invoices', vendorController.listVendorInvoices);
router.post('/list-single', vendorController.listSingleVendor);
router.delete('/delete/:id', vendorController.deleteSingleVendor);
router.put('/edit/:id', vendorController.updateVendor);

module.exports = router;