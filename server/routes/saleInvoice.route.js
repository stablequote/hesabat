const express = require('express');
const router = express.Router();
const saleInvoice = require('../controllers/saleInvoice.controller');
const authMiddleware = require("../middleware/auth.middleware");

router.post('/create', authMiddleware(["owner", "manager"]), saleInvoice.createSaleInvoice);
router.get('/list', saleInvoice.getAllSaleInvoices);
router.post('/payments/:invoiceID/pay', authMiddleware(["owner", "manager"]), saleInvoice.addInstallmentPayment);
router.put('/edit/:invoiceID', saleInvoice.editSaleInvoice);
router.get('/list/clientID', saleInvoice.getInvoicesByClient);
router.delete('/delete/:invoiceID', saleInvoice.deleteSaleInvoice);

module.exports = router;