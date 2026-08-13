const Complaint = require('../models/Complaint');

/**
 * Generates a human-friendly tracking id like GRV-2026-000123 so citizens can
 * quote a short code instead of a Mongo ObjectId when tracking a complaint.
 */
async function generateTrackingId() {
  const year = new Date().getFullYear();
  const count = await Complaint.countDocuments({
    createdAt: {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${year + 1}-01-01`),
    },
  });
  const serial = String(count + 1).padStart(6, '0');
  return `GRV-${year}-${serial}`;
}

module.exports = generateTrackingId;
