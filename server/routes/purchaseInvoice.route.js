const express = require('express');
const router = express.Router();
const purchaseInvoice = require('../controllers/purchaseInvoice.controller');
const authMiddleware = require("../middleware/auth.middleware");

router.post('/create', authMiddleware(["owner", "manager"]), purchaseInvoice.createPurchaseInvoice);
router.get('/list', purchaseInvoice.getPurchaseInvoices);
router.post('/payments/:invoiceID/pay', purchaseInvoice.addInstallmentPayment);
router.put('/edit/:invoiceID', purchaseInvoice.editPurchaseInvoice);
router.get('/list/vendorID', purchaseInvoice.getPurchaseInvoicesByVendor);
router.delete('/delete/:invoiceID', purchaseInvoice.deletePurchaseInvoice);

module.exports = router;