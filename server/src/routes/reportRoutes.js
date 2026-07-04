const express = require("express");
const { submitReport } = require("../controllers/reportController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);
router.post("/", submitReport);

module.exports = router;
