const SaleInvoice = require("../../models/saleInvoice.model");
const PurchaseInvoice = require("../../models/purchaseInvoice.model");
const Expense = require("../../models/expense.model");

// exports.getOverview = async (req, res) => {
//   try {

//     const [
//       sales,
//       purchases,
//       expenses,
//     ] = await Promise.all([
//       SaleInvoice.find(),
//       PurchaseInvoice.find(),
//       Expense.find(),
//     ]);

//     const totalSales = sales.reduce(
//       (sum, s) => sum + (s.totalSalePrice || 0),
//       0
//     );

//     const totalPurchases = purchases.reduce(
//       (sum, p) => sum + (p.totalAmount || 0),
//       0
//     );

//     const totalExpenses = expenses.reduce(
//       (sum, e) => sum + (e.amount || 0),
//       0
//     );

//     const totalRevenue =
//       totalSales - totalPurchases - totalExpenses;

//     const unpaidSales = sales.filter(
//       (s) => s.status !== "paid"
//     ).length;

//     const monthlySales = {};

//     sales.forEach((sale) => {
//       const month = new Date(sale.createdAt)
//         .toLocaleString("default", {
//           month: "short",
//         });

//       monthlySales[month] =
//         (monthlySales[month] || 0) +
//         sale.totalSalePrice;
//     });

//     res.json({
//       metrics: {
//         totalSales,
//         totalPurchases,
//         totalExpenses,
//         totalRevenue,
//         unpaidSales,
//       },

//       charts: {
//         monthlySales,
//       },
//     });

//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

exports.getOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {};

    if (startDate || endDate) {
      match.createdAt = {};

      if (startDate) {
        match.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        match.createdAt.$lte = new Date(endDate);
      }
    }

    // =========================
    // TOTAL SALES
    // =========================

    const totalSalesAgg = await SaleInvoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalSalePrice" },
        },
      },
    ]);

    const totalSales = totalSalesAgg[0]?.total || 0;

    // =========================
    // TOTAL EXPENSES
    // =========================

    const expensesAgg = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalExpenses = expensesAgg[0]?.total || 0;

    // =========================
    // PENDING SALES PAYMENTS
    // =========================

    const pendingSalesAgg = await SaleInvoice.aggregate([
      {
        $match: {
          ...match,
          remainingAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$remainingAmount" },
        },
      },
    ]);

    const pendingSalesPayments =
      pendingSalesAgg[0]?.total || 0;

    // =========================
    // PENDING PURCHASE PAYMENTS
    // =========================

    const pendingPurchaseAgg =
      await PurchaseInvoice.aggregate([
        {
          $match: {
            ...match,
            remainingAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$remainingAmount" },
          },
        },
      ]);

    const pendingPurchasePayments =
      pendingPurchaseAgg[0]?.total || 0;

    // =========================
    // TOP SELLING PRODUCTS
    // =========================

    const topProducts = await SaleInvoice.aggregate([
      { $match: match },

      { $unwind: "$products" },

      {
        $group: {
          _id: "$products.product",
          totalQty: {
            $sum: "$products.quantity",
          },
        },
      },

      {
        $sort: {
          totalQty: -1,
        },
      },

      {
        $limit: 3,
      },

      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },

      {
        $unwind: "$product",
      },

      {
        $project: {
          _id: 1,
          totalQty: 1,
          name: "$product.name",
        },
      },
    ]);

    // =========================
    // RECENT SALES
    // =========================

    const recentSales = await SaleInvoice.find(match)
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("client");

    // =========================
    // DAILY SALES CHART
    // =========================

    const dailySales = await SaleInvoice.aggregate([
      { $match: match },

      {
        $group: {
          _id: {
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
          },

          totalSales: {
            $sum: "$totalSalePrice",
          },
        },
      },

      {
        $sort: {
          "_id.day": 1,
        },
      },
    ]);

    // =========================
    // MONTHLY SALES CHART
    // =========================

    const monthlySales = await SaleInvoice.aggregate([
      { $match: match },

      {
        $group: {
          _id: {
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: "$createdAt",
              },
            },
          },

          totalSales: {
            $sum: "$totalSalePrice",
          },
        },
      },

      {
        $sort: {
          "_id.month": 1,
        },
      },
    ]);

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      totalSales,
      totalExpenses,

      pendingSalesPayments,
      pendingPurchasePayments,

      topProducts,

      recentSales,

      charts: {
        dailySales,
        monthlySales,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};