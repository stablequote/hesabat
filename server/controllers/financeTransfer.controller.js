const FinanceTransfer = require('../models/financeTransfer.model');

exports.createTransfer = async (req, res) => {
  try {
    const { amount, description } = req.body;
    // const userId = req.user.id; // Use your auth middleware to get this

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be positive" });
    }

    const newTransfer = await FinanceTransfer.create({
      amount,
      from: "Cash",
      to: "Bankak",
      description,
    //   createdBy: userId,
    });

    res.status(201).json({ message: "Transfer recorded", data: newTransfer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Transfer creation failed" });
  }
};

exports.getAllTransfers = async (req, res) => {
  try {
    const transfers = await FinanceTransfer.find({});
    res.status(200).json({ data: transfers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load transfers" });
  }
};

exports.getTodayTransfers = async (req, res) => {
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const transfers = await FinanceTransfer.find({
      createdAt: { $gte: start, $lte: end }
    });

    res.status(200).json({ data: transfers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load transfers" });
  }
};

exports.deleteTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id)
    const foundTransfer = await FinanceTransfer.findByIdAndDelete(id);
    if(!foundTransfer) {
      res.status(404).json({ message: "No Transfer found!" })
    } else {
      res.status(200).json({ message: "Transfer successfully deleted!" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense!" })
  }
}

exports.editTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Transfer ID: ", id)

    const foundTransfer = await FinanceTransfer.findByIdAndUpdate(id, req.body, { new: true });
    if(!foundTransfer) {
      res.status(404).json({ message: "No Transfer found!" })
    } else {
      res.status(200).json({ message: "Transfer successfully updated!" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update expense!" })
  }
}