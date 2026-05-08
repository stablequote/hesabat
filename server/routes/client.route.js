const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/client.controller');

// Authentication routes
router.post('/create', clientsController.createClient);
router.get('/list', clientsController.getAllClients);
router.get('/list/:clientId', clientsController.getSingleClient);
router.delete('/delete/:clientId', clientsController.deleteSingleClient);
router.put('/edit/:clientId', clientsController.updateClient);

module.exports = router;