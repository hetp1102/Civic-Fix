const express = require('express');
const Complaint = require('../models/Complaint');
const { protect, authorize } = require('../middleware/auth');
const { uploadAfter } = require('../middleware/upload');

const router = express.Router();

router.use(protect, authorize('officer'));

// GET /api/officer/complaints?status=submitted - queue for the officer's department
router.get('/complaints', async (req, res) => {
  if (!req.user.department) {
    return res.status(400).json({ message: 'Your account has no department assigned. Contact an admin.' });
  }

  const filter = {
    department: req.user.department,
    isDuplicate: false, // duplicates never appear as separate work items
  };
  if (req.query.status) filter.status = req.query.status;
  else filter.status = { $ne: 'rejected' };

  // Only show unassigned complaints for the department, or ones assigned to this officer
  filter.$or = [{ assignedOfficer: null }, { assignedOfficer: req.user._id }];

  const complaints = await Complaint.find(filter)
    .populate('citizen', 'name email')
    .sort({ priority: -1, duplicateReports: -1, createdAt: 1 });

  res.json({ complaints });
});

// GET /api/officer/complaints/:id - full detail including before/after media
router.get('/complaints/:id', async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('citizen', 'name email phone')
    .populate('department', 'name code')
    .populate('assignedOfficer', 'name');

  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
  if (String(complaint.department._id) !== String(req.user.department)) {
    return res.status(403).json({ message: 'This complaint does not belong to your department.' });
  }

  const linkedDuplicates = await Complaint.find({ duplicateOf: complaint._id }).select(
    'trackingId createdAt citizen beforeMedia'
  );

  res.json({ complaint, linkedDuplicates });
});

// PATCH /api/officer/complaints/:id/claim - officer picks up an unassigned complaint
router.patch('/complaints/:id/claim', async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
  if (String(complaint.department) !== String(req.user.department)) {
    return res.status(403).json({ message: 'This complaint does not belong to your department.' });
  }
  if (complaint.assignedOfficer) {
    return res.status(400).json({ message: 'This complaint is already assigned.' });
  }

  complaint.assignedOfficer = req.user._id;
  complaint.status = 'assigned';
  complaint.statusHistory.push({ status: 'assigned', changedBy: req.user._id });
  await complaint.save();

  res.json({ message: 'Complaint assigned to you.', complaint });
});

// PATCH /api/officer/complaints/:id/status - move through in_progress / rejected
router.patch('/complaints/:id/status', async (req, res) => {
  const { status, note } = req.body;
  const allowed = ['in_progress', 'rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
  if (String(complaint.assignedOfficer) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the assigned officer can update this complaint.' });
  }

  complaint.status = status;
  complaint.statusHistory.push({ status, note, changedBy: req.user._id });
  await complaint.save();

  res.json({ message: 'Status updated.', complaint });
});

// POST /api/officer/complaints/:id/resolve - upload after-photos and close the case
router.post('/complaints/:id/resolve', uploadAfter.array('media', 6), async (req, res) => {
  const { note } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
  if (String(complaint.assignedOfficer) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the assigned officer can resolve this complaint.' });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'At least one "after" photo is required to mark this resolved.' });
  }

  const afterMedia = req.files.map((f) => ({
    url: `/uploads/after/${f.filename}`,
    type: f.mimetype.startsWith('video') ? 'video' : 'photo',
  }));

  complaint.afterMedia.push(...afterMedia);
  complaint.status = 'resolved';
  complaint.resolutionNote = note;
  complaint.resolvedAt = new Date();
  complaint.statusHistory.push({ status: 'resolved', note, changedBy: req.user._id });
  await complaint.save();

  res.json({ message: 'Complaint marked as resolved with after-evidence.', complaint });
});

module.exports = router;
