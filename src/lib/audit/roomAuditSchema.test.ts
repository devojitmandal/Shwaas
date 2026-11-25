import { describe, it, expect } from 'vitest';
import {
  mapWindowGapsToAer,
  mapSourcesToIndoorGeneration,
  computeSteadyStateIndoorPm25,
  computeRankedFixes,
  buildRoomAuditResult,
} from './roomAuditSchema';

describe('Room Audit Schema & Physics Mapping', () => {
  it('maps window sealing categories to expected Air Exchange Rates (AER)', () => {
    expect(mapWindowGapsToAer('sealed')).toBe(0.35);
    expect(mapWindowGapsToAer('minor_gaps')).toBe(0.70);
    expect(mapWindowGapsToAer('open_drafty')).toBe(1.80);
  });

  it('accumulates internal PM2.5 source emission rates from cooking and dust', () => {
    expect(mapSourcesToIndoorGeneration('none_visible', 'minimal')).toBe(100);
    expect(mapSourcesToIndoorGeneration('lpg_electric', 'moderate')).toBe(550);
    expect(mapSourcesToIndoorGeneration('chulha_wood', 'heavy_incense_dust')).toBe(8200);
  });

  it('reduces modeled indoor PM2.5 when HEPA filtration CADR is active', () => {
    const unpurified = computeSteadyStateIndoorPm25(200, 0.7, 300, 0, 45);
    const purified = computeSteadyStateIndoorPm25(200, 0.7, 300, 250, 45);
    expect(purified).toBeLessThan(unpurified * 0.25);
  });

  it('ranks interventions in descending order of Breath Budget points saved', () => {
    const fixes = computeRankedFixes(250, 1.8, 700);
    expect(fixes.length).toBe(4);
    for (let i = 1; i < fixes.length; i++) {
      expect(fixes[i - 1].budgetPointsSaved).toBeGreaterThanOrEqual(fixes[i].budgetPointsSaved);
      expect(fixes[i].rank).toBe(i + 1);
    }
  });

  it('builds a complete RoomAuditResult with default observations when vision omits them', () => {
    const audit = buildRoomAuditResult(
      {
        roomType: 'Bedroom',
        windowGaps: 'sealed',
        cookingSource: 'none_visible',
        ventilationType: 'sealed_windows',
        visibleDustSources: 'minimal',
        observations: [],
      },
      180,
      'gemini_vision_audit'
    );

    expect(audit.analyzed).toBe(true);
    expect(audit.aerEstimated).toBe(0.35);
    expect(audit.observations).toHaveLength(3);
    expect(audit.summary).toContain('Air Exchange Rate of 0.35');
  });
});
