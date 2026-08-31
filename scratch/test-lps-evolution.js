const { calculateLPS } = require('../lib/engine/lps.ts');
const { evolveWorld } = require('../lib/engine/worldEvolution.ts');

console.log('Testing calculateLPS...');
const mockLpsInput = {
  avgMasteryPercent: 54,
  streak: 5,
  thetaGrowthRate: 0.12,
  totalSessions: 8,
  soloSessionCount: 2,
  calibrationScore: 0.05,
  thetaSolo: 0.5,
  thetaAssisted: 0.8,
};

const result = calculateLPS(mockLpsInput);
console.log('LPS Result:', JSON.stringify(result, null, 2));

const mockConcepts = [
  { id: 'c1', name: 'Geometry & Nodes', masteryPercent: 75 },
  { id: 'c2', name: 'Shader Dynamics', masteryPercent: 20 },
  { id: 'c3', name: 'Lighting & Optics', masteryPercent: 45 },
  { id: 'c4', name: 'Animation Curves', masteryPercent: 92 },
  { id: 'c5', name: 'Mastery Citadel', masteryPercent: 0 },
];

const worldDelta = evolveWorld(result, mockConcepts);
console.log('World Evolution Result:', JSON.stringify({
  lps: worldDelta.lps,
  unlockedAreas: worldDelta.unlockedAreas,
  buildingsCount: worldDelta.buildings.length,
  buildings: worldDelta.buildings.map((b: any) => ({ name: b.conceptName, type: b.type, stage: b.stage })),
  missionsCount: worldDelta.missions.length,
  missions: worldDelta.missions.map((m: any) => ({ title: m.title, target: m.targetMastery })),
  resources: worldDelta.resources,
}, null, 2));
