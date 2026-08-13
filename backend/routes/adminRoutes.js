const express = require('express');
const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const { protect, authorize } = require('../middleware/auth');
const { trainClassifier } = require('../utils/nlpClassifier');

const router = express.Router();

// Every route below requires a valid admin session. There is no public route
// anywhere that can create an admin account or reach this router without a
// role of 'admin' already on the JWT - the hidden URL slug on the frontend is
// only an extra layer of obscurity, not the actual access control.
router.use(protect, authorize('admin'));

// ---------- Dashboard analytics ----------
router.get('/stats', async (req, res) => {
  const [total, byStatus, byDept, duplicatesBlocked, recentTrend] = await Promise.all([
    Complaint.countDocuments({ isDuplicate: false }),
    Complaint.aggregate([{ $match: { isDuplicate: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.aggregate([
      { $match: { isDuplicate: false, department: { $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: { name: '$dept.name', code: '$dept.code', count: 1 } },
    ]),
    Complaint.countDocuments({ isDuplicate: true }),
    Complaint.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({ total, byStatus, byDept, duplicatesBlocked, recentTrend });
});

// ---------- Complaints oversight ----------
router.get('/complaints', async (req, res) => {
  const { status, department, isDuplicate } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (department) filter.department = department;
  if (isDuplicate !== undefined) filter.isDuplicate = isDuplicate === 'true';

  const complaints = await Complaint.find(filter)
    .populate('citizen', 'name email')
    .populate('department', 'name code')
    .populate('assignedOfficer', 'name')
    .sort('-createdAt')
    .limit(500);

  res.json({ complaints });
});

// Admin can manually reclassify a complaint's department, which also feeds the NLP model
router.patch('/complaints/:id/reclassify', async (req, res) => {
  const { departmentCode } = req.body;
  const dept = await Department.findOne({ code: departmentCode });
  if (!dept) return res.status(404).json({ message: 'Unknown department code.' });

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  complaint.department = dept._id;
  complaint.classification = { predictedDepartment: dept.code, confidence: 1, method: 'manual' };
  await complaint.save();

  // Feed this correction back into the classifier so it learns from admin review
  trainClassifier(`${complaint.title} ${complaint.description}`, dept.code);

  res.json({ message: 'Complaint reclassified and model updated.', complaint });
});

// ---------- Department management ----------
router.get('/departments', async (req, res) => {
  const departments = await Department.find().sort('name');
  res.json({ departments });
});

router.post('/departments', async (req, res) => {
  const { name, code, description, keywords } = req.body;
  const dept = await Department.create({ name, code: code.toUpperCase(), description, keywords });
  res.status(201).json({ department: dept });
});

router.patch('/departments/:id', async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!dept) return res.status(404).json({ message: 'Department not found.' });
  res.json({ department: dept });
});

// ---------- User & officer management ----------
router.get('/users', async (req, res) => {
  const { role } = req.query;
  const filter = role ? { role } : {};
  const users = await User.find(filter).populate('department', 'name code').sort('-createdAt');
  res.json({ users });
});

// Officers are provisioned by admins only - no public officer sign-up exists.
router.post('/officers', async (req, res) => {
  const { name, email, password, departmentId, phone } = req.body;
  if (!name || !email || !password || !departmentId) {
    return res.status(400).json({ message: 'Name, email, password and department are required.' });
  }
  const dept = await Department.findById(departmentId);
  if (!dept) return res.status(404).json({ message: 'Department not found.' });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(400).json({ message: 'An account with this email already exists.' });

  const officer = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role: 'officer',
    department: dept._id,
  });

  res.status(201).json({ message: 'Officer account created.', officer: officer.toSafeObject() });
});

router.patch('/users/:id/status', async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ message: `Account ${isActive ? 'activated' : 'disabled'}.`, user: user.toSafeObject() });
});

module.exports = router;
