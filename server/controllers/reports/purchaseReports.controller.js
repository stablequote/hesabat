const PurchaseInvoice = require("../../models/purchaseInvoice.model");
const buildDateFilter = require("../../utils/reports/buildDateFilter");

exports.getPurchaseReport = async (req, res) => {
  try {
    const {
      from,
      to,
      vendor,
      status,
    } = req.query;

    const match = {
      ...buildDateFilter(from, to),
    };

    if (vendor) {
      match.vendor = vendor;
    }

    if (status) {
      match.status = status;
    }

    const invoices = await PurchaseInvoice.find(match)
      .populate("vendor")
      .sort({ createdAt: -1 });

    const summary = invoices.reduce(
      (acc, inv) => {
        acc.totalPurchases += inv.totalAmount || 0;
        acc.totalPaid += inv.paidAmount || 0;
        acc.totalRemaining += inv.remainingAmount || 0;
        return acc;
      },
      {
        totalPurchases: 0,
        totalPaid: 0,
        totalRemaining: 0,
      }
    );

    res.json({
      success: true,
      count: invoices.length,
      summary,
      invoices,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};