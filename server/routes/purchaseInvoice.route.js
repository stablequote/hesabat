const express = require('express');
const router = express.Router();
const purchaseInvoice = require('../controllers/purchaseInvoice.controller');
const authMiddleware = require("../middleware/auth.middleware");

router.post('/create', authMiddleware(["owner"]), purchaseInvoice.createPurchaseInvoice);
router.get('/list', authMiddleware(["owner"]), purchaseInvoice.getPurchaseInvoices);
router.post('/payments/:invoiceID/pay', authMiddleware(["owner"]), purchaseInvoice.addInstallmentPayment);
router.put('/edit/:invoiceID', authMiddleware(["owner"]), purchaseInvoice.editPurchaseInvoice);
router.get('/list/vendorID', authMiddleware(["owner"]), purchaseInvoice.getPurchaseInvoicesByVendor);
router.delete('/delete/:invoiceID', authMiddleware(["owner"]), purchaseInvoice.deletePurchaseInvoice);

module.exports = router;