const mongoose = require("mongoose");

const SaleInvoice = require("../models/saleInvoice.model");
const PurchaseInvoice = require("../models/purchaseInvoice.model");
const Expense = require("../models/expense.model");
const Product = require("../models/product.model");
const Inventory = require("../models/inventory.model");

// Cache the connection instead of reconnecting every time
let cloudConn = null;

const getCloudConn = async () => {
  if (cloudConn && cloudConn.readyState === 1) return cloudConn;
  cloudConn = await mongoose.createConnection(process.env.CLOUD_MONGO_URI).asPromise();
  return cloudConn;
};

const bulkUpsert = async (CloudModel, records) => {
  if (!records.length) return;
  await CloudModel.bulkWrite(
    records.map(r => ({
      updateOne: {
        filter: { _id: r._id },
        update: { $set: r },
        upsert: true,
      },
    }))
  );
};

exports.syncToCloud = async (req, res) => {
  try {
    console.log("1 - starting");
    const conn = await getCloudConn();
    console.log("2 - connected");

    const CloudSale     = conn.model("SaleInvoice",     SaleInvoice.schema);
    const CloudPurchase = conn.model("PurchaseInvoice", PurchaseInvoice.schema);
    const CloudExpense  = conn.model("Expense",         Expense.schema);
    const CloudProduct  = conn.model("Product",         Product.schema);
    const CloudInventory  = conn.model("Inventory",         Inventory.schema);

    console.log("3 - model ready");

    const [sales, purchases, expenses, products, inventory] = await Promise.all([
      SaleInvoice.find().lean(),
      PurchaseInvoice.find().lean(),
      Expense.find().lean(),
      Product.find().lean(),
      Inventory.find().lean(),
    ]);

    console.log("4 - local fetched");

    await Promise.all([
      bulkUpsert(CloudSale,     sales),
      bulkUpsert(CloudPurchase, purchases),
      bulkUpsert(CloudExpense,  expenses),
      bulkUpsert(CloudProduct,  products),
      bulkUpsert(CloudInventory,  inventory),
    ]);

    console.log("5 - synced");

    return res.json({
      success: true,
      synced: {
        sales:     sales.length,
        purchases: purchases.length,
        expenses:  expenses.length,
        products:  products.length,
        inventory:  inventory.length,
      },
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.syncFromCloud = async (req, res) => {
  try {
    const conn = await getCloudConn();
    const CloudProduct = conn.model("Product", Product.schema);

    const cloudProducts = await CloudProduct.find().lean();

    await Product.bulkWrite(
      cloudProducts.map(p => ({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: p },
          upsert: true,
        },
      }))
    );

    return res.json({ success: true, updated: cloudProducts.length });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};