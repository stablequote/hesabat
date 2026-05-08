const express = require('express');
const router = express.Router();
const financeTransfer = require('../controllers/financeTransfer.controller');

router.post('/create', financeTransfer.createTransfer);
router.get('/list', financeTransfer.getAllTransfers);
router.get('/list-today', financeTransfer.getTodayTransfers);
router.delete('/delete/:id', financeTransfer.deleteTransfer);
router.put('/edit/:id', financeTransfer.editTransfer);

module.exports = router;