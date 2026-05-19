const path = require("path");
const ejs = require("ejs");

const SaleInvoice = require("../../models/saleInvoice.model");
const PurchaseInvoice = require("../../models/purchaseInvoice.model");
const Expense = require("../../models/expense.model");

exports.generateMasterReport = async (req, res) => {

  try {

    const { startDate, endDate } = req.query;

    const filter = {};

    if (startDate && endDate) {

      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const sales = await SaleInvoice.find(filter)
      .populate("client");

    const purchases = await PurchaseInvoice.find(filter)
      .populate("vendor");

    const expenses = await Expense.find(filter);

    const totalSales = sales.reduce(
      (sum, s) => sum + (s.totalSalePrice || 0),
      0
    );

    const totalPurchases = purchases.reduce(
      (sum, p) => sum + (p.totalOrderPrice || 0),
      0
    );

    const totalExpenses = expenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );

    const revenue =
      totalSales -
      totalPurchases -
      totalExpenses;

    return res.status(200).json({

      success: true,

      report: {
        sales,
        purchases,
        expenses,
        totalSales,
        totalPurchases,
        totalExpenses,
        revenue,
      },
    });

  } catch (error) {

    return res.status(500).json({
      message: error.message,
    });
  }
};