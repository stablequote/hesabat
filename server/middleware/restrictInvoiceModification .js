const moment = require("moment");

const restrictInvoiceModification = (invoiceField = "createdAt") => {
  return async (req, res, next) => {
    try {
      // owner bypass
      if (req.user.role === "owner") {
        return next();
      }

      const invoice = req.invoice;

      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found",
        });
      }

      const createdAt = moment(invoice[invoiceField]);

      const hoursPassed = moment().diff(createdAt, "hours");

      if (hoursPassed >= 24) {
        return res.status(403).json({
          message:
            "Only owner can modify invoices after 24 hours",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };
};

module.exports = restrictInvoiceModification;