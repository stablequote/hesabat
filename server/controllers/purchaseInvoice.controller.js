const mongoose = require("mongoose");
const PurchaseInvoice = require("../models/purchaseInvoice.model");
const Product = require("../models/product.model");
const Vendor = require("../models/vendor.model");
const Inventory = require("../models/inventory.model");

/**
 * =========================================================
 * CREATE PURCHASE INVOICE
 * =========================================================
 * WHAT HAPPENS HERE:
 * 1. Validate products/vendor
 * 2. Increase stock quantity
 * 3. Update purchase price
 * 4. Calculate totals safely
 * 5. Create invoice
 * 6. Handle payments
 * =========================================================
 */

// exports.createPurchaseInvoice = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const {
//       products,
//       vendor,
//       paymentType,
//       payments = [],
//       orderDate,
//       deliveryDate,
//       notes,
//     } = req.body;

//     console.log("Body: ", req.body);
//     console.log("Created by ID: ", req.user._id)

//     if (!products || products.length === 0) {
//       throw new Error("Products are required");
//     }

//     // validate vendor
//     const existingVendor = await Vendor.findById(vendor).session(session);

//     if (!existingVendor) {
//       throw new Error("Vendor not found");
//     }

//     // generate order id
//     const latestInvoice = await PurchaseInvoice.findOne()
//       .sort({ createdAt: -1 })
//       .session(session);

//     const nextNumber = latestInvoice
//       ? parseInt(latestInvoice.invoiceID.split("-")[1]) + 1
//       : 1;

//     const invoiceID = `PO-${String(nextNumber).padStart(5, "0")}`;

//     let calculatedTotal = 0;

//     const formattedProducts = [];

//     /**
//      * =========================================================
//      * LOOP PRODUCTS
//      * =========================================================
//      */

//     for (const product of products) {
//       const existingProduct = await Product.findById(product._id).session(
//         session
//       );

//       if (!existingProduct) {
//         throw new Error(`Product not found: ${product._id}`);
//       }

//       const quantity = Number(product.quantity);
//       const unitPurchasePrice = Number(product.unitPurchasePrice);

//       const unitTotalPrice = quantity * unitPurchasePrice;

//       calculatedTotal += unitTotalPrice;
      

//       /**
//        * =========================================================
//        * IMPORTANT INVENTORY LOGIC
//        * =========================================================
//        * PURCHASE INVOICE = STOCK INCREASES
//        * =========================================================
//        */

//       existingProduct.quantity += quantity;

//       /**
//        * =========================================================
//        * UPDATE PURCHASE PRICE
//        * =========================================================
//        * latest purchase price becomes current purchase price
//        * =========================================================
//        */

//       existingProduct.unitPurchasePrice = unitPurchasePrice;

//       await existingProduct.save({ session });

//       formattedProducts.push({
//         product: existingProduct._id,
//         quantity,
//         unit: product.unit,
//         unitPurchasePrice,
//         unitTotalPrice,
//       });
//     }

//     /**
//      * =========================================================
//      * PAYMENTS
//      * =========================================================
//      */

//     const paidAmount = payments.reduce(
//       (sum, p) => sum + Number(p.amount),
//       0
//     );

//     const remainingAmount = calculatedTotal - paidAmount;

//     let status = "partial";

//     if (paidAmount <= 0) {
//       status = "unpaid";
//     } else if (remainingAmount <= 0) {
//       status = "paid";
//     }

//     const invoice = await PurchaseInvoice.create(
//       [
//         {
//           invoiceID,
//           products: formattedProducts,
//           vendor,
//           paymentType,
//           payments,
//           totalOrderPrice: calculatedTotal,
//           paidAmount,
//           remainingAmount,
//           isOrderPaid: remainingAmount <= 0,
//           orderDate,
//           deliveryDate,
//           status,
//           notes,
//           createdBy: req.user._id,
//         },
//       ],
//       { session }
//     );

//     await session.commitTransaction();

//     return res.status(201).json({
//       success: true,
//       message: "Purchase invoice created successfully",
//       invoice: invoice[0],
//     });
//   } catch (error) {
//     await session.abortTransaction();

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };

exports.createPurchaseInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      products,
      vendor,
      paymentType,
      payments = [],
      orderDate,
      deliveryDate,
      notes,
    } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error("Products are required");
    }

    if (!vendor) {
      throw new Error("Vendor is required");
    }

    // ✅ validate vendor
    const existingVendor = await Vendor.findById(vendor).session(session);
    if (!existingVendor) {
      throw new Error("Vendor not found");
    }

    // ✅ generate order ID safely
    const latestInvoice = await PurchaseInvoice.findOne()
      .sort({ createdAt: -1 })
      .session(session);

    let nextNumber = 1;

    if (latestInvoice && latestInvoice.invoiceID) {
      const parts = latestInvoice.invoiceID.split("-");
      nextNumber = Number(parts[1]) + 1 || 1;
    }

    const invoiceID = `PO-${String(nextNumber).padStart(5, "0")}`;

    let calculatedTotal = 0;
    const formattedProducts = [];

    /**
     * =========================================================
     * LOOP PRODUCTS
     * =========================================================
     */
    for (const item of products) {
      if (!item.product) {
        throw new Error("Product ID is required");
      }

      const existingProduct = await Product.findById(item.product).session(session);

      if (!existingProduct) {
        throw new Error(`Product not found: ${item.product}`);
      }

      const quantity = Number(item.quantity);
      const unitPurchasePrice = Number(item.unitPurchasePrice);

      if (quantity <= 0 || unitPurchasePrice < 0) {
        throw new Error("Invalid quantity or price");
      }

      const unitTotalPrice = quantity * unitPurchasePrice;
      calculatedTotal += unitTotalPrice;

      /**
       * =========================================================
       * INVENTORY LOGIC (CORRECT)
       * =========================================================
       */

      let inventory = await Inventory.findOne({
        product: item.product,
        unit: item.unit,
      }).session(session);

      if (!inventory) {
        // ✅ create new inventory record
        inventory = new Inventory({
          product: item.product,
          quantity: quantity,
          unit: item.unit,
          unitPurchasePrice: unitPurchasePrice,
          unitSalePrice: item.unitSalePrice || unitPurchasePrice,
          location: item.location || "default",
        });
      } else {
        // ✅ update existing inventory (weighted average)
        const oldQty = inventory.quantity;
        const oldPrice = inventory.unitPurchasePrice;

        const totalOldValue = oldQty * oldPrice;
        const totalNewValue = quantity * unitPurchasePrice;

        const newQuantity = oldQty + quantity;

        inventory.unitPurchasePrice =
          (totalOldValue + totalNewValue) / newQuantity;

        inventory.quantity = newQuantity;
      }

      await inventory.save({ session });

      /**
       * =========================================================
       * SNAPSHOT FOR INVOICE
       * =========================================================
       */
      formattedProducts.push({
        product: existingProduct._id,
        quantity,
        unit: item.unit,
        unitPurchasePrice,
        unitTotalPrice,
      });
    }

    /**
     * =========================================================
     * PAYMENTS
     * =========================================================
     */

    const paidAmount = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    if (paidAmount < 0) {
      throw new Error("Invalid payment amount");
    }

    const remainingAmount = calculatedTotal - paidAmount;

    let status = "partial";

    if (paidAmount === 0) {
      status = "pending";
    } else if (remainingAmount <= 0) {
      status = "paid";
    } else {
      status = "partial"
    }

    /**
     * =========================================================
     * CREATE INVOICE
     * =========================================================
     */

    const invoice = await PurchaseInvoice.create(
      [
        {
          invoiceID,
          products: formattedProducts,
          vendor,
          paymentType,
          payments,
          totalOrderPrice: calculatedTotal,
          paidAmount,
          remainingAmount,
          isOrderPaid: remainingAmount <= 0,
          orderDate,
          deliveryDate,
          status,
          notes,
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Purchase invoice created successfully",
      invoice: invoice[0],
    });

  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  } finally {
    session.endSession();
  }
};

/**
 * =========================================================
 * LIST ALL PURCHASE INVOICES
 * =========================================================
 */

exports.getPurchaseInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status,
      vendor,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (vendor) {
      query.vendor = vendor;
    }

    if (startDate || endDate) {
      query.orderDate = {};

      if (startDate) {
        query.orderDate.$gte = new Date(startDate);
      }

      if (endDate) {
        query.orderDate.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.invoiceID = {
        $regex: search,
        $options: "i",
      };
    }

    const invoices = await PurchaseInvoice.find(query)
      .populate("vendor", "name phone")
      .populate("createdBy", "firstName lastName")
      .populate("products.product", "_id name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await PurchaseInvoice.countDocuments(query);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =========================================================
 * LIST PURCHASE INVOICES BY VENDOR
 * =========================================================
 */

exports.getPurchaseInvoicesByVendor = async (req, res) => {
  try {
    const { vendorID } = req.params;

    const invoices = await PurchaseInvoice.find({
      vendor: vendorID,
    })
      .populate("vendor", "name phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =========================================================
 * ADD INSTALLMENT PAYMENT
 * =========================================================
 * IMPORTANT:
 * - DOES NOT INCREASE STOCK
 * - ONLY AFFECTS FINANCIAL SIDE
 * =========================================================
 */

exports.addInstallmentPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { invoiceID } = req.params;
    const { payment } = req.body;


    const { amount, paymentMethod, transactionNumber, notes } = payment;

    console.log("Payment: ", payment)
    console.log("Body: ", req.body)

    const invoice = await PurchaseInvoice.findOne({ invoiceID }).populate("vendor", "name").session(session);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (invoice.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot add payment to cancelled invoice",
      });
    }

    const paymentTotal = payment.transactions.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

    const remainingBeforePayment =
      invoice.totalOrderPrice - invoice.paidAmount;

    if (amount > remainingBeforePayment) {
      return res.status(400).json({
        success: false,
        message: "Payment exceeds remaining amount",
      });
    }

    // invoice.payments.push({
    //   amount,
    //   paymentMethod,
    //   transactionNumber,
    //   notes,
    //   createdBy: req.user._id,
    // });

    payment.transactions.forEach((t) => {
      invoice.payments.push({
        amount: Number(t.amount),
        paymentMethod: t.method,
        transactionNumber: t.transactionNumber,
        notes: payment.notes,
        createdBy: req.user._id,
      });
    });

    invoice.paidAmount = (invoice.paidAmount || 0) + paymentTotal;

    invoice.remainingAmount =
      invoice.totalOrderPrice - invoice.paidAmount;

    // ensure no negative remaining
    if (invoice.remainingAmount < 0) {
      invoice.remainingAmount = 0;
    }

    // STATUS LOGIC (important fix)
    if (invoice.paidAmount <= 0) {
      invoice.status = "unpaid";
      invoice.isOrderPaid = false;
    }

    else if (invoice.remainingAmount === 0) {
      invoice.status = "paid";
      invoice.isOrderPaid = true;
    }

    else {
      invoice.status = "partial";
      invoice.isOrderPaid = false;
    }

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Installment payment added successfully",
      invoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =========================================================
 * EDIT PURCHASE INVOICE
 * =========================================================
 * IMPORTANT:
 * =========================================================
 * SINCE INVENTORY WAS ALREADY INCREASED,
 * WE MUST:
 * 1. REVERSE OLD QUANTITIES
 * 2. APPLY NEW QUANTITIES
 * =========================================================
 */

exports.editPurchaseInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { invoiceID } = req.params;
    const {
      vendor,
      products = [],
      payments = [],
      notes,
      deliveryDate,
    } = req.body;

    const invoice = await PurchaseInvoice.findOne({invoiceID}).session(session);
    // console.log("Invoice: ", invoice)

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    /**
     * =========================================================
     * 1. REVERSE OLD INVENTORY IMPACT
     * =========================================================
     */

    for (const oldItem of invoice.products) {
      const inventory = await Inventory.findOne({
        product: oldItem.product,
        unit: oldItem.unit,
      }).session(session);

      if (inventory) {
        inventory.quantity -= oldItem.quantity;

        if (inventory.quantity < 0) {
          throw new Error(
            `Stock inconsistency detected for product ${oldItem.product}`
          );
        }

        await inventory.save({ session });
      }
    }

    /**
     * =========================================================
     * 2. APPLY NEW PRODUCTS → INVENTORY UPDATE
     * =========================================================
     */

    let newTotal = 0;
    const formattedProducts = [];

    for (const item of products) {
      if (!item.product) {
        throw new Error("Product ID missing");
      }

      const quantity = Number(item.quantity);
      const unitPurchasePrice = Number(item.unitPurchasePrice);

      if (quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      const inventory = await Inventory.findOne({
        product: item.product,
        unit: item.unit,
      }).session(session);

      if (!inventory) {
        throw new Error(`Inventory not found for product ${item.product}`);
      }

      // update stock
      inventory.quantity += quantity;

      // optional: update weighted average cost
      const oldQty = inventory.quantity;
      const oldPrice = inventory.unitPurchasePrice;

      const totalOld = oldQty * oldPrice;
      const totalNew = quantity * unitPurchasePrice;

      const newQty = oldQty + quantity;

      inventory.unitPurchasePrice =
        newQty > 0 ? (totalOld + totalNew) / newQty : unitPurchasePrice;

      await inventory.save({ session });

      const unitTotalPrice = quantity * unitPurchasePrice;
      newTotal += unitTotalPrice;

      formattedProducts.push({
        product: item.product,
        quantity,
        unit: item.unit,
        unitPurchasePrice,
        unitTotalPrice,
      });
    }

    /**
     * =========================================================
     * 3. PAYMENTS RECALCULATION
     * =========================================================
     */

    const paidAmount = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    const remainingAmount = newTotal - paidAmount;

    let status = "partial";

    if (paidAmount === 0) status = "unpaid";
    else if (remainingAmount <= 0) status = "paid";

    /**
     * =========================================================
     * 4. UPDATE INVOICE CORE DATA
     * =========================================================
     */

    invoice.vendor = vendor || invoice.vendor;
    invoice.products = formattedProducts;
    invoice.totalOrderPrice = newTotal;
    invoice.payments = payments;
    invoice.paidAmount = paidAmount;
    invoice.remainingAmount = remainingAmount;
    invoice.status = status;
    invoice.notes = notes ?? invoice.notes;
    invoice.deliveryDate = deliveryDate ?? invoice.deliveryDate;

    await invoice.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      invoice,
    });

  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  } finally {
    session.endSession();
  }
};

/**
 * =========================================================
 * DELETE PURCHASE INVOICE
 * =========================================================
 * IMPORTANT:
 * =========================================================
 * PURCHASE INVOICE DELETE
 * MUST REVERSE INVENTORY
 * =========================================================
 */

exports.deletePurchaseInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { invoiceID } = req.params;

    const invoice = await PurchaseInvoice.findById(invoiceID).session(
      session
    );

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    /**
     * =========================================================
     * REVERSE STOCK
     * =========================================================
     */

    for (const item of invoice.products) {
      const product = await Product.findById(item.product).session(
        session
      );

      if (product) {
        product.quantity -= item.quantity;

        if (product.quantity < 0) {
          throw new Error(
            `Cannot delete invoice. Product "${product.name}" would become negative stock`
          );
        }

        await product.save({ session });
      }
    }

    await PurchaseInvoice.findByIdAndDelete(invoiceID).session(
      session
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Purchase invoice deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};