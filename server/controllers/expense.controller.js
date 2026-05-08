const Expense = require('../models/expense.model');

exports.createExpense = async (req, res) => {
    try {
        const { amount, description, category, paymentMethod, createdBy  } = req.body;
        console.log("Expnese User ID: ", createdBy)

        const newExpense = new Expense({
            amount,
            description,
            category,
            paymentMethod,
            createdBy,
        })
        await newExpense.save();
        res.status(201).json({ message: "Expense created successfully", newExpense })
    } catch (error) {
        res.status(500).json({ error: "Failed to create expense" })
        console.log(error)
    }
}

exports.listSingleExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const foundExpense = await Expense.findOneById(id)
        if(!foundExpense) {
            res.status(404).json({ message: "No expense found!" })
        } else {
            res.status(200).json({ message: "Expense found successfully!", foundExpense})
        }
    } catch (error) {
        res.status(500).json({ message: error })
    }
}

exports.listTodayExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({});

        const isToday = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            return date >= start && date <= end;
        };

        const todayExpenses = expenses.filter(exp => isToday(exp.createdAt));
        const totalTodayExpenses = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        res.status(200).json({ message: "Total Expenses today:", totalTodayExpenses })
    } catch (error) {
        res.status(500).json({ message: error })
    }
}

exports.listAllExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find().populate('createdBy');
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list expenses.' });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id)
        const foundExpense = await Expense.findByIdAndDelete(id);
        if(!foundExpense) {
            res.status(404).json({ message: "No Expense found!" })
        } else {
            res.status(200).json({ message: "Expense successfully deleted!" })
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to delete expense!" })
    }
}

exports.editExpense = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Expense ID: ", id)
        console.log("Expense Payload: ", req.body)
        const { createdAt, description, amount, paymentMethod, createdBy } = req.body;

        const payload = {
            createdAt,
            description,
            amount,
            paymentMethod,
            // createdBy,
        }

        const foundExpense = await Expense.findByIdAndUpdate(id, payload, { new: true });
        if(!foundExpense) {
            res.status(404).json({ message: "No Expense found!" })
        } 
        res.status(200).json({ message: "Expense successfully updated!" })
    } catch (error) {
        res.status(500).json({ error: "Failed to update expense!" })
    }
}