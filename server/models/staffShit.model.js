// models/StaffShift.js
const mongoose = require("mongoose");

const staffShiftSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  shift: { type: String, enum: ["morning", "evening"], required: true },
  startTime: { type: String, required: true }, // e.g. "06:30"
  endTime: { type: String, required: true },   // e.g. "15:00"
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
});

module.exports = mongoose.model("StaffShift", staffShiftSchema);