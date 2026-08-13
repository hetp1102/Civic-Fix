const express = require('express');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');
const { uploadBefore } = require('../middleware/upload');
const { classifyComplaint } = require('../utils/nlpClassifier');
const { findDuplicate } = require('../utils/duplicateDetector');
const generateTrackingId = require('../utils/generateTrackingId');

const router = express.Router();

/**
 * POST /api/complaints
 * Citizen submits a new grievance with live-location + photo/video evidence.
 * multipart/form-data fields: title, description, lat, lng, accuracy, media[]
 */
router.post(
  '/',
  protect,
  authorize('citizen'),
  uploadBefore.array('media', 6),
  async (req, res) => {
    try {
      const { title, description, lat, lng, accuracy, address } = req.body;

      if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required.' });
      }
      if (!lat || !lng) {
        return res
          .status(400)
          .json({ message: 'Live location is required. Please allow location access and try again.' });
      }
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'At least one photo or video of the grievance is required.' });
      }

      const coordinates = [parseFloat(lng), parseFloat(lat)];

      // 1. NLP classification into a department
      const departments = await Department.find({ isActive: true });
      const { department: deptCode, confidence, method } = classifyComplaint(
        `${title} ${description}`,
        departments
      );
      const matchedDept = departments.find((d) => d.code === deptCode) || departments.find((d) => d.code === 'GENERAL');

      // 2. Duplicate detection (same department, nearby location, similar text, recent)
      const duplicateMaster = await findDuplicate({
        coordinates,
        departmentId: matchedDept ? matchedDept._id : null,
        title,
        description,
      });

      const beforeMedia = req.files.map((f) => ({
        url: `/uploads/before/${f.filename}`,
        type: f.mimetype.startsWith('video') ? 'video' : 'photo',
      }));

      const trackingId = await generateTrackingId();

      if (duplicateMaster) {
        // Record it as a duplicate: it stays visible to the citizen under their
        // own tracking id, but is linked to the master complaint and does not
        // create a new work item for officers.
        const dup = await Complaint.create({
          trackingId,
          citizen: req.user._id,
          title,
          description,
          location: { type: 'Point', coordinates, accuracy, address },
          beforeMedia,
          department: matchedDept ? matchedDept._id : undefined,
          classification: { predictedDepartment: deptCode, confidence, method },
          status: 'duplicate',
          statusHistory: [{ status: 'duplicate', note: `Matches existing report ${duplicateMaster.trackingId}`, changedBy: req.user._id }],
          isDuplicate: true,
          duplicateOf: duplicateMaster._id,
        });

        duplicateMaster.duplicateReports += 1;
        await duplicateMaster.save();

        return res.status(201).json({
          message:
            'This looks like an issue already reported nearby. We\'ve linked your report to the existing case so it strengthens its priority.',
          complaint: dup,
          linkedTo: duplicateMaster.trackingId,
        });
      }

      const complaint = await Complaint.create({
        trackingId,
        citizen: req.user._id,
        title,
        description,
        location: { type: 'Point', coordinates, accuracy, address },
        beforeMedia,
        department: matchedDept ? matchedDept._id : undefined,
        classification: { predictedDepartment: deptCode, confidence, method },
        status: 'submitted',
        statusHistory: [{ status: 'submitted', changedBy: req.user._id }],
      });

      res.status(201).json({ message: 'Grievance submitted successfully.', complaint });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || 'Failed to submit grievance.' });
    }
  }
);

// GET /api/complaints/mine - citizen's own complaints
router.get('/mine', protect, authorize('citizen'), async (req, res) => {
  const complaints = await Complaint.find({ citizen: req.user._id })
    .populate('department', 'name code')
    .populate('assignedOfficer', 'name')
    .sort('-createdAt');
  res.json({ complaints });
});

// GET /api/complaints/track/:trackingId - track a complaint's status timeline
router.get('/track/:trackingId', protect, async (req, res) => {
  const complaint = await Complaint.findOne({ trackingId: req.params.trackingId })
    .populate('department', 'name code')
    .populate('assignedOfficer', 'name')
    .populate('citizen', 'name email');

  if (!complaint) return res.status(404).json({ message: 'No complaint found with this tracking id.' });

  // Citizens may only track their own complaints; officers/admins can track any.
  if (req.user.role === 'citizen' && String(complaint.citizen._id) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only track your own complaints.' });
  }

  let linkedMaster = null;
  if (complaint.isDuplicate && complaint.duplicateOf) {
    linkedMaster = await Complaint.findById(complaint.duplicateOf).select('trackingId status');
  }

  res.json({ complaint, linkedMaster });
});

// GET /api/complaints/:id - full detail (owner citizen, assigned officer, or admin)
router.get('/:id', protect, async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('department', 'name code')
    .populate('assignedOfficer', 'name email')
    .populate('citizen', 'name email');

  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  const isOwner = req.user.role === 'citizen' && String(complaint.citizen._id) === String(req.user._id);
  const isAssignedOfficer =
    req.user.role === 'officer' && complaint.assignedOfficer && String(complaint.assignedOfficer._id) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAssignedOfficer && !isAdmin) {
    return res.status(403).json({ message: 'You do not have access to this complaint.' });
  }

  res.json({ complaint });
});

// POST /api/complaints/:id/confirm - another citizen confirms the same issue still exists
router.post('/:id/confirm', protect, authorize('citizen'), async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  if (complaint.confirmations.some((id) => String(id) === String(req.user._id))) {
    return res.status(400).json({ message: 'You have already confirmed this issue.' });
  }
  complaint.confirmations.push(req.user._id);
  await complaint.save();
  res.json({ message: 'Thanks for confirming - this helps prioritize the issue.', confirmations: complaint.confirmations.length });
});

module.exports = router;
