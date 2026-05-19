const SaleInvoice = require("../models/saleInvoice.model");

exports.loadSaleInvoice = async (req, res, next) => {
  try {
    const invoice = await SaleInvoice.findById(
      req.params.invoiceID
    );

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    req.invoice = invoice;

    next();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};