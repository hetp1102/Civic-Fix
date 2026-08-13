require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('../models/Department');

const DEFAULT_DEPARTMENTS = [
  { name: 'Roads & Infrastructure', code: 'ROADS', keywords: ['pothole', 'road', 'street', 'pavement', 'bridge', 'footpath'] },
  { name: 'Water Supply', code: 'WATER', keywords: ['water', 'pipeline', 'leak', 'supply', 'tanker', 'borewell'] },
  { name: 'Electricity', code: 'ELECTRICITY', keywords: ['light', 'electric', 'power', 'transformer', 'wire', 'pole'] },
  { name: 'Sanitation & Waste', code: 'SANITATION', keywords: ['garbage', 'waste', 'drainage', 'sewage', 'toilet', 'dustbin'] },
  { name: 'Traffic & Parking', code: 'TRAFFIC', keywords: ['traffic', 'signal', 'parking', 'jam', 'crossing'] },
  { name: 'Parks & Public Spaces', code: 'PARKS', keywords: ['park', 'garden', 'playground', 'tree'] },
  { name: 'Water Logging & Drainage', code: 'WATER_LOGGING', keywords: ['flood', 'logging', 'drain', 'rain'] },
  { name: 'Animal Control', code: 'ANIMAL_CONTROL', keywords: ['dog', 'cattle', 'monkey', 'stray', 'animal'] },
  { name: 'Encroachment', code: 'ENCROACHMENT', keywords: ['encroachment', 'illegal', 'construction', 'unauthorized'] },
  { name: 'General Civic Issues', code: 'GENERAL', keywords: ['noise', 'pollution', 'general', 'other'] },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    for (const dept of DEFAULT_DEPARTMENTS) {
      await Department.findOneAndUpdate({ code: dept.code }, dept, { upsert: true, new: true });
    }
    console.log(`Seeded ${DEFAULT_DEPARTMENTS.length} departments.`);
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
