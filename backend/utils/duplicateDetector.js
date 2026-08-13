const stringSimilarity = require('string-similarity');
const Complaint = require('../models/Complaint');

const RADIUS_METERS = Number(process.env.DUPLICATE_RADIUS_METERS || 75);
const TEXT_THRESHOLD = Number(process.env.DUPLICATE_TEXT_SIMILARITY || 0.6);
const WINDOW_DAYS = Number(process.env.DUPLICATE_WINDOW_DAYS || 30);

/**
 * Looks for an existing, still-open complaint that is likely the same civic
 * issue as the one being submitted: same predicted department, within
 * RADIUS_METERS of each other, reported within the last WINDOW_DAYS, and with
 * a title+description text-similarity score above TEXT_THRESHOLD.
 *
 * Returns the existing "master" complaint document if a duplicate is found,
 * otherwise null.
 */
async function findDuplicate({ coordinates, departmentId, title, description, excludeId }) {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const nearby = await Complaint.find({
    _id: { $ne: excludeId },
    department: departmentId,
    isDuplicate: false, // only compare against master complaints, not other duplicates
    status: { $nin: ['rejected', 'resolved'] },
    createdAt: { $gte: since },
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: RADIUS_METERS,
      },
    },
  }).limit(15);

  if (!nearby.length) return null;

  const incomingText = `${title} ${description}`.toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  nearby.forEach((c) => {
    const existingText = `${c.title} ${c.description}`.toLowerCase();
    const score = stringSimilarity.compareTwoStrings(incomingText, existingText);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = c;
    }
  });

  if (bestMatch && bestScore >= TEXT_THRESHOLD) {
    return bestMatch;
  }
  return null;
}

module.exports = { findDuplicate };
