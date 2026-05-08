const express = require('express');
const app = express()
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const DB_URI = process.env.DB_URI;
const DB_LOCAL = process.env.DB_LOCAL;
const PORT = process.env.port || 5006;

// routes imports
const authRouter = require("./routes/user.route");
const vendorRouter = require("./routes/vendor.route");
const clientRouter = require("./routes/client.route");
const expenseRouter = require("./routes/expense.route");
const productRouter = require("./routes/product.route");
const inventoryRouter = require("./routes/inventory.route");
const financeTransfersRouter = require("./routes/financeTransfer.route");
const purchaseInvoiceRouter = require("./routes/purchaseInvoice.route");

const connectDB = async () => {
  try {
    await mongoose.connect(DB_LOCAL);
    console.log("✅ Connected to Database");
  } catch (error) {
    console.error("❌ Database Connection Error:", error.message);
    process.exit(1); // Exit process if DB connection fails
  }
};
connectDB(); // Call the function

// middleware
app.use(cors({
    // origin: [""],
    origin: "*",
    credentials: 'true',
}))
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}))
// Serve uploads folder
app.use("/uploads", express.static(path.join("uploads")));

// routes
app.use("/auth", authRouter)
app.use("/vendors", vendorRouter)
app.use("/clients", clientRouter)
app.use('/expenses', expenseRouter)
app.use('/products', productRouter)
app.use("/inventory", inventoryRouter)
app.use('/transfers', financeTransfersRouter);
app.use('/purchase-invoices', purchaseInvoiceRouter);

// testing server route
app.get("/test", (req, res) => {
    res.send("server is working")
    console.log("test is working!!")
})
// running the server
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)   
})

process.stdin.resume(); // Keeps the process open