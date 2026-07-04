const express = require("express");
const {
  sendInterest,
  respondToInterest,
  getReceivedInterests,
  getSentInterests,
  getInterestStatusWith,
} = require("../controllers/interestController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", sendInterest);
router.get("/received", getReceivedInterests);
router.get("/sent", getSentInterests);
router.get("/status/:userId", getInterestStatusWith);
router.patch("/:id", respondToInterest);

module.exports = router;
