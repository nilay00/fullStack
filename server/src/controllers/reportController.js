const Report = require("../models/Report");

// POST /api/reports  { reported, reason, details }
async function submitReport(req, res, next) {
  try {
    const { reported, reason, details } = req.body;
    if (!reported || !reason) return res.status(400).json({ message: "reported and reason are required." });
    if (String(reported) === String(req.user._id)) return res.status(400).json({ message: "You cannot report yourself." });

    const existing = await Report.findOne({ reporter: req.user._id, reported, status: "pending" });
    if (existing) return res.status(409).json({ message: "You have already reported this user. Our team will review it." });

    const report = await Report.create({ reporter: req.user._id, reported, reason, details: details || "" });
    res.status(201).json({ message: "Report submitted. Thank you — our team will review it within 24 hours.", report });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitReport };
