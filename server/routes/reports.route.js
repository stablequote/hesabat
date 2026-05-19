const router = require("express").Router();

const sales = require("../controllers/reports/salesReports.controller");
const purchases = require("../controllers/reports/purchaseReports.controller");
const ledger = require("../controllers/reports/ledgerReports.controller");
const overview = require("../controllers/reports/overviewReports.controller");
const authMiddleware = require("../middleware/auth.middleware");
const masterReport = require("../controllers/reports/masterReport.controller")

router.get("/sales", authMiddleware(["owner"]), sales.getSalesReport);

router.get("/purchases", authMiddleware(["owner"]), purchases.getPurchaseReport);

router.get("/ledger", authMiddleware(["owner"]), ledger.getLedgerReport);

router.get("/overview", authMiddleware(["owner"]), overview.getOverview);

router.get("/master", masterReport.generateMasterReport);

module.exports = router;