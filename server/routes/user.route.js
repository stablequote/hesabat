const express = require('express');
const router = express.Router();
const authController = require('../controllers/user.controller');

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/list', authController.findAllUSers);

module.exports = router;