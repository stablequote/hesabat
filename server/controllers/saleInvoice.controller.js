const mongoose = require("mongoose");
const SaleInvoice = require("../models/saleInvoice.model");
const Product = require("../models/product.model");
const Inventory = require("../models/inventory.model");
const Client = require("../models/client.model");

exports.createSaleInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { products, client, payments = [], notes } = req.body;

    if (!products || products.length === 0) {
      throw new Error("Products are required");
    }

    // validate client
    const existingClient = await Client.findById(client).session(session);
    if (!existingClient) throw new Error("Client not found");

    // generate invoiceID
    const latest = await SaleInvoice.findOne().sort({ createdAt: -1 }).session(session);
    const next = latest ? parseInt(latest.invoiceID.split("-")[1]) + 1 : 1;
    const invoiceID = `SI-${String(next).padStart(5, "0")}`;

    let totalSalePrice = 0;
    const formattedProducts = [];

    for (const item of products) {
      const productDoc = await Product.findById(item.product).session(session);
      if (!productDoc) throw new Error("Product not found");

      const inventory = await Inventory.findOne({ product: item.product }).session(session);
      if (!inventory) throw new Error("Inventory not found");

      const quantity = Number(item.quantity);

      // 🚨 STOCK CHECK
      if (inventory.quantity < quantity) {
        throw new Error(`Insufficient stock for ${productDoc.name}`);
      }

      // decrease stock
      inventory.quantity -= quantity;
      await inventory.save({ session });

      const salePrice = Number(item.salePrice);
      const purchasePrice = inventory.unitPurchasePrice;

      const unitTotalPrice = quantity * salePrice;
      totalSalePrice += unitTotalPrice;

      formattedProducts.push({
        product: productDoc._id,
        quantity,
        unit: item.unit,
        unitTotalPrice,
        productSnapShot: {
          name: productDoc.name,
          salePrice,
          purchasePrice,
        },
      });
    }

    // validate payments
    const paidAmount = payments.reduce((sum, p) => sum + p.totalAmount, 0);

    if (paidAmount > totalSalePrice) {
      throw new Error("Overpayment not allowed");
    }

    const invoice = await SaleInvoice.create(
      [
        {
          invoiceID,
          products: formattedProducts,
          client,
          payments,
          totalSalePrice,
          paidAmount,
          remainingAmount: totalSalePrice - paidAmount,
          notes,
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      invoice: invoice[0],
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

exports.getAllSaleInvoices = async (req, res) => {
  try {
    const invoices = await SaleInvoice.find()
      .populate("client", "fullName")
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInvoicesByClient = async (req, res) => {
  try {
    const { clientID } = req.params;

    const invoices = await SaleInvoice.find({ client: clientID })
      .populate("client", "fullName")
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addInstallmentPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { invoiceID } = req.params;
    const payment = req.body;

    const invoice = await SaleInvoice.findOne({ invoiceID }).session(session);
    if (!invoice) throw new Error("Invoice not found");

    const newPaid = invoice.paidAmount + payment.totalAmount;

    if (newPaid > invoice.totalSalePrice) {
      throw new Error("Overpayment not allowed");
    }

    invoice.payments.push({
      ...payment,
      createdBy: req.user._id,
    });

    await invoice.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      invoice,
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

exports.editSaleInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { invoiceID } = req.params;
    const { products, notes } = req.body;

    const invoice = await SaleInvoice.findOne({ invoiceID }).session(session);
    if (!invoice) throw new Error("Invoice not found");

    // 🔁 RESTORE OLD STOCK
    for (const oldItem of invoice.products) {
      const inventory = await Inventory.findOne({ product: oldItem.product }).session(session);
      if (inventory) {
        inventory.quantity += oldItem.quantity;
        await inventory.save({ session });
      }
    }

    // 🔄 APPLY NEW
    let newTotal = 0;
    const formattedProducts = [];

    for (const item of products) {
      const inventory = await Inventory.findOne({ product: item.product }).session(session);
      if (!inventory) throw new Error("Inventory not found");

      if (inventory.quantity < item.quantity) {
        throw new Error("Insufficient stock");
      }

      inventory.quantity -= item.quantity;
      await inventory.save({ session });

      const unitTotalPrice = item.quantity * item.salePrice;
      newTotal += unitTotalPrice;

      formattedProducts.push({
        product: item.product,
        quantity: item.quantity,
        unit: item.unit,
        unitTotalPrice,
        productSnapShot: {
          name: item.name,
          salePrice: item.salePrice,
          purchasePrice: inventory.unitPurchasePrice,
        },
      });
    }

    invoice.products = formattedProducts;
    invoice.totalSalePrice = newTotal;
    invoice.notes = notes;

    if (invoice.paidAmount > newTotal) {
      throw new Error("Existing payments exceed new total");
    }

    await invoice.save({ session });

    await session.commitTransaction();

    res.json({ success: true, invoice });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

exports.deleteSaleInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { invoiceID } = req.params;

    const invoice = await SaleInvoice.findOne({ invoiceID }).session(session);
    if (!invoice) throw new Error("Invoice not found");

    // 🔁 restore stock
    for (const item of invoice.products) {
      const inventory = await Inventory.findOne({ product: item.product }).session(session);
      if (inventory) {
        inventory.quantity += item.quantity;
        await inventory.save({ session });
      }
    }

    await invoice.deleteOne({ session });

    await session.commitTransaction();

    res.json({ success: true, message: "Invoice deleted" });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};