const express = require('express');
const router = express.Router();
const unitsController = require('../controllers/unit.controller');

// Authentication routes
router.post('/create', unitsController.createUnit);
router.get('/list', unitsController.listUnits)

module.exports = router;