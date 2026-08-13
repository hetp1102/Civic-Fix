/**
 * NLP department classifier.
 *
 * Uses a Naive Bayes text classifier (from the `natural` package) trained on a
 * small seed corpus per department, combined with a keyword-overlap fallback so
 * new/rare phrasing still routes sensibly. Confidence is normalized to 0-1.
 *
 * Re-train by calling trainClassifier() with additional labelled complaints
 * (e.g. from a `/api/admin/nlp/retrain` endpoint fed with historically
 * correctly-classified complaints) to improve accuracy over time.
 */
const natural = require('natural');
const { BayesClassifier } = natural;

// Seed training data: [department code, sample phrases]
const TRAINING_DATA = {
  ROADS: [
    'pothole on the main road damaging vehicles',
    'road is broken and full of craters near my house',
    'street pavement has collapsed after rain',
    'speed breaker is broken causing accidents',
    'footpath is damaged and unsafe to walk',
    'road divider is broken and dangerous',
    'construction debris left on road blocking traffic',
    'bridge has cracks and is unsafe',
  ],
  WATER: [
    'no water supply in our area for a week',
    'water pipeline is leaking and flooding the street',
    'dirty contaminated water coming from the tap',
    'low water pressure since many days',
    'sewage water mixing with drinking water supply',
    'water tanker did not arrive as scheduled',
    'borewell motor pump is not working',
  ],
  ELECTRICITY: [
    'street light is not working at night',
    'power cut in our locality for many hours',
    'electric pole is leaning and dangerous',
    'transformer sparking near residential area',
    'exposed electrical wires hanging on the street',
    'frequent voltage fluctuation damaging appliances',
    'streetlight pole fell down after storm',
  ],
  SANITATION: [
    'garbage not collected for many days',
    'overflowing dustbin spreading bad smell',
    'drainage is blocked and overflowing on the street',
    'public toilet is dirty and unusable',
    'dead animal lying on the road not removed',
    'mosquito breeding due to stagnant water',
    'waste dumped illegally in open plot',
  ],
  TRAFFIC: [
    'traffic signal is not working at the junction',
    'illegal parking blocking the road',
    'no zebra crossing near school causing danger',
    'traffic jam due to encroachment on road',
    'signboard missing at dangerous turn',
  ],
  PARKS: [
    'park equipment is broken and unsafe for children',
    'garden is not maintained and overgrown',
    'trees are fallen and blocking the park path',
    'public park lighting is not working',
  ],
  WATER_LOGGING: [
    'water logging on the road after rain',
    'street flooded due to poor drainage',
    'rain water entering houses due to blocked drain',
  ],
  ANIMAL_CONTROL: [
    'stray dogs are aggressive and biting people',
    'cattle roaming freely on the highway',
    'monkey menace in residential area',
  ],
  ENCROACHMENT: [
    'illegal construction on public land',
    'shop encroaching on the footpath',
    'unauthorized structure built on government land',
  ],
  GENERAL: [
    'noise pollution from loudspeaker at night',
    'general complaint about civic issue',
    'public property vandalized',
  ],
};

let classifier = null;

function buildClassifier() {
  const c = new BayesClassifier();
  Object.entries(TRAINING_DATA).forEach(([label, phrases]) => {
    phrases.forEach((phrase) => c.addDocument(phrase, label));
  });
  c.train();
  return c;
}

function getClassifier() {
  if (!classifier) classifier = buildClassifier();
  return classifier;
}

/**
 * Adds a new labelled example and retrains. Call sparingly (e.g. from an
 * admin "correct this classification" action) since retraining is O(n).
 */
function trainClassifier(text, departmentCode) {
  const c = getClassifier();
  c.addDocument(text, departmentCode.toUpperCase());
  c.train();
}

/**
 * Classifies free-text complaint title+description into a department code.
 * Returns { department, confidence } where confidence is 0-1.
 */
function classifyComplaint(text, departments = []) {
  const c = getClassifier();
  const cleaned = text.toLowerCase();

  const classifications = c.getClassifications(cleaned) || [];
  let top = classifications[0];

  // Keyword-overlap boost using department.keywords stored in Mongo, in case
  // the admin has customized keywords per department beyond the seed corpus.
  if (departments.length) {
    const tokens = new Set(cleaned.split(/\W+/).filter(Boolean));
    let bestKeywordMatch = null;
    let bestScore = 0;
    departments.forEach((dept) => {
      const overlap = (dept.keywords || []).filter((k) => tokens.has(k)).length;
      if (overlap > bestScore) {
        bestScore = overlap;
        bestKeywordMatch = dept.code;
      }
    });
    if (bestKeywordMatch && bestScore >= 2) {
      // Strong keyword signal overrides a weak Bayes result
      return { department: bestKeywordMatch, confidence: Math.min(0.95, 0.5 + bestScore * 0.1), method: 'nlp' };
    }
  }

  if (!top || classifications.every((x) => x.value === 0)) {
    return { department: 'GENERAL', confidence: 0.3, method: 'fallback' };
  }

  // Normalize the winning score against the sum of all scores for a 0-1 confidence
  const total = classifications.reduce((sum, x) => sum + x.value, 0) || 1;
  const confidence = Math.max(0, Math.min(1, top.value / total));

  return { department: top.label, confidence: Number(confidence.toFixed(2)), method: 'nlp' };
}

module.exports = { classifyComplaint, trainClassifier, getClassifier };
