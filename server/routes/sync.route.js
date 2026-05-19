const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const { syncToCloud, syncFromCloud } = require("../controllers/sync.controller");

router.post("/to-cloud", syncToCloud);
router.post("/from-cloud",  syncFromCloud);

module.exports = router;