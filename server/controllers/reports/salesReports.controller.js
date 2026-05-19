const SaleInvoice = require("../../models/saleInvoice.model");
const buildDateFilter = require("../../utils/reports/buildDateFilter");

exports.getSalesReport = async (req, res) => {
  try {
    const {
      from,
      to,
      client,
      status,
      invoiceID,
    } = req.query;

    const match = {
      ...buildDateFilter(from, to, "saleDate"),
    };

    if (client) {
      match.client = client;
    }

    if (status) {
      match.status = status;
    }

    if (invoiceID) {
      match.invoiceID = invoiceID;
    }

    const invoices = await SaleInvoice.find(match)
      .populate("client")
      .sort({ saleDate: -1 });

    const summary = invoices.reduce(
      (acc, inv) => {
        acc.totalSales += inv.totalSalePrice || 0;
        acc.totalPaid += inv.paidAmount || 0;
        acc.totalRemaining += inv.remainingAmount || 0;
        return acc;
      },
      {
        totalSales: 0,
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