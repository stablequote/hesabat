const express = require('express');
const router = express.Router();
const saleInvoice = require('../controllers/saleInvoice.controller');
const authMiddleware = require("../middleware/auth.middleware");
const { loadSaleInvoice } = require('../middleware/loadSaleInvoice');
const restrictInvoiceModification = require('../middleware/restrictInvoiceModification ');

router.post('/create', authMiddleware(["owner", "manager"]), saleInvoice.createSaleInvoice);
router.get('/list', saleInvoice.getAllSaleInvoices);
router.post('/payments/:invoiceID/pay', authMiddleware(["owner", "manager"]), saleInvoice.addInstallmentPayment);
router.put('/edit/:invoiceID', authMiddleware(["owner", "manager"]), loadSaleInvoice, restrictInvoiceModification(), saleInvoice.editSaleInvoice);
router.get('/list/clientID', saleInvoice.getInvoicesByClient);
router.delete('/delete/:invoiceId',  authMiddleware(["owner"]), loadSaleInvoice, restrictInvoiceModification(), saleInvoice.deleteSaleInvoice);

module.exports = router;