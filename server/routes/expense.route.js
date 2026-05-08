const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');

// Authentication routes
router.post('/add', expenseController.createExpense);
router.get('/list', expenseController.listAllExpenses)
router.get('/list-today', expenseController.listTodayExpenses)
router.get('/list-single/:id', expenseController.listSingleExpense)
router.delete('/delete/:id', expenseController.deleteExpense)
router.put('/edit/:id', expenseController.editExpense)

module.exports = router;