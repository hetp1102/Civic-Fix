const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'duplicate'],
      required: true,
    },
    note: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['photo', 'video'], required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    // Human-friendly tracking id, e.g. GRV-2026-000123
    trackingId: { type: String, required: true, unique: true, index: true },

    citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    // GeoJSON point captured live from the citizen's device at submission time
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], required: true }, // [lng, lat]
      accuracy: { type: Number }, // meters, from navigator.geolocation
      address: { type: String }, // reverse-geocoded label, optional
    },

    // Citizen-submitted evidence ("before")
    beforeMedia: [mediaSchema],
    // Officer-submitted evidence after resolving ("after")
    afterMedia: [mediaSchema],

    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    classification: {
      predictedDepartment: { type: String },
      confidence: { type: Number },
      method: { type: String, enum: ['nlp', 'manual', 'fallback'], default: 'nlp' },
    },

    status: {
      type: String,
      enum: ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'duplicate'],
      default: 'submitted',
    },
    statusHistory: [statusHistorySchema],

    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },

    assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Duplicate detection
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }, // the "master" complaint
    duplicateReports: { type: Number, default: 0 }, // how many citizens reported the same master issue

    resolutionNote: { type: String },
    resolvedAt: { type: Date },

    // upvotes from other citizens confirming the same issue exists (separate from auto-duplicate merge)
    confirmations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Complaint', complaintSchema);
