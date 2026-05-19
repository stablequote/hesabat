const Expense = require("../../models/expense.model");
const SaleInvoice = require("../../models/saleInvoice.model");
const PurchaseInvoice = require("../../models/purchaseInvoice.model");

exports.getLedgerReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    const dateFilter = {};

    if (from || to) {
      dateFilter.createdAt = {};

      if (from) {
        dateFilter.createdAt.$gte = new Date(from);
      }

      if (to) {
        dateFilter.createdAt.$lte = new Date(to);
      }
    }

    const sales = await SaleInvoice.find(dateFilter);

    const purchases = await PurchaseInvoice.find(dateFilter);

    const expenses = await Expense.find(dateFilter);

    const ledger = [];

    sales.forEach((s) => {
      ledger.push({
        type: "sale",
        direction: "in",
        amount: s.paidAmount,
        reference: s.invoiceID,
        date: s.createdAt,
      });
    });

    purchases.forEach((p) => {
      ledger.push({
        type: "purchase",
        direction: "out",
        amount: p.paidAmount,
        reference: p.invoiceID,
        date: p.createdAt,
      });
    });

    expenses.forEach((e) => {
      ledger.push({
        type: "expense",
        direction: "out",
        amount: e.amount,
        reference: e.description,
        date: e.createdAt,
      });
    });

    ledger.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totals = ledger.reduce(
      (acc, item) => {
        if (item.direction === "in") {
          acc.income += item.amount;
        } else {
          acc.expenses += item.amount;
        }

        acc.balance = acc.income - acc.expenses;

        return acc;
      },
      {
        income: 0,
        expenses: 0,
        balance: 0,
      }
    );

    res.json({
      success: true,
      totals,
      ledger,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};