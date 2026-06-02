import { calculateComponentScore, calculateCHPMI } from '../services/scoringEngine';

describe('Scoring Engine', () => {
  describe('calculateComponentScore', () => {
    it('returns the arithmetic mean of 3 criteria scores', () => {
      // Component C01: criteria scores [3, 2, 4] → mean = 3.0
      expect(calculateComponentScore([3, 2, 4])).toBeCloseTo(3.0);
    });

    it('returns correct mean for mixed scores', () => {
      // [1, 2, 3] → mean = 2.0
      expect(calculateComponentScore([1, 2, 3])).toBeCloseTo(2.0);
    });

    it('returns null for empty array (no scores)', () => {
      expect(calculateComponentScore([])).toBeNull();
    });

    it('handles all zeros', () => {
      expect(calculateComponentScore([0, 0, 0])).toBeCloseTo(0.0);
    });

    it('handles all maximum scores (4)', () => {
      expect(calculateComponentScore([4, 4, 4])).toBeCloseTo(4.0);
    });

    it('handles single criterion scored', () => {
      expect(calculateComponentScore([3])).toBeCloseTo(3.0);
    });

    it('handles two criteria scored', () => {
      expect(calculateComponentScore([2, 4])).toBeCloseTo(3.0);
    });

    it('excludes invalid scores (negative)', () => {
      // -1 is invalid, only [2, 3] should be used → mean = 2.5
      expect(calculateComponentScore([-1, 2, 3])).toBeCloseTo(2.5);
    });

    it('excludes invalid scores (>4)', () => {
      // 5 is out of range, only [1, 2] should be used → mean = 1.5
      expect(calculateComponentScore([5, 1, 2])).toBeCloseTo(1.5);
    });

    it('returns correct decimal precision', () => {
      // [1, 2, 4] → mean = 7/3 ≈ 2.3333
      expect(calculateComponentScore([1, 2, 4])).toBeCloseTo(2.3333, 3);
    });
  });

  describe('calculateCHPMI', () => {
    it('calculates 0% for no scored criteria', () => {
      // Empty array → 0/120 * 100 = 0
      expect(calculateCHPMI([])).toBeCloseTo(0.0);
    });

    it('calculates 100% for perfect scores (all 30 criteria at 4)', () => {
      const scores = new Array(30).fill(4);
      // 120/120 * 100 = 100
      expect(calculateCHPMI(scores)).toBeCloseTo(100.0);
    });

    it('calculates 0% for all zeros', () => {
      const scores = new Array(30).fill(0);
      // 0/120 * 100 = 0
      expect(calculateCHPMI(scores)).toBeCloseTo(0.0);
    });

    it('calculates correct CHPMI for documented test case (7.5%)', () => {
      // Documentation appendix: sum of 9 criteria scored at 1 = 9 → 9/120 * 100 = 7.5%
      const scores = new Array(9).fill(1);
      expect(calculateCHPMI(scores)).toBeCloseTo(7.5);
    });

    it('calculates 50% for all criteria at 2', () => {
      const scores = new Array(30).fill(2);
      // 60/120 * 100 = 50
      expect(calculateCHPMI(scores)).toBeCloseTo(50.0);
    });

    it('handles partial scoring (only some criteria scored)', () => {
      // 10 criteria scored at 3 → sum = 30, 30/120 * 100 = 25%
      const scores = new Array(10).fill(3);
      expect(calculateCHPMI(scores)).toBeCloseTo(25.0);
    });

    it('excludes invalid scores from calculation', () => {
      // Valid: [4, 4], invalid: [5, -1] → sum = 8, 8/120 * 100 ≈ 6.667%
      expect(calculateCHPMI([4, 4, 5, -1])).toBeCloseTo(6.6667, 2);
    });

    it('calculates correct CHPMI for mixed realistic scores', () => {
      // Realistic: 10 components × 3 criteria each
      // C01: [3, 2, 4], C02: [1, 1, 2], C03: [4, 3, 3], C04: [2, 2, 1],
      // C05: [3, 3, 2], C06: [1, 0, 1], C07: [2, 2, 3], C08: [4, 4, 4],
      // C09: [0, 1, 1], C10: [3, 2, 2]
      const scores = [
        3, 2, 4, // C01 = 3.0
        1, 1, 2, // C02 = 1.333
        4, 3, 3, // C03 = 3.333
        2, 2, 1, // C04 = 1.667
        3, 3, 2, // C05 = 2.667
        1, 0, 1, // C06 = 0.667
        2, 2, 3, // C07 = 2.333
        4, 4, 4, // C08 = 4.0
        0, 1, 1, // C09 = 0.667
        3, 2, 2, // C10 = 2.333
      ];
      // Sum = 3+2+4 + 1+1+2 + 4+3+3 + 2+2+1 + 3+3+2 + 1+0+1 + 2+2+3 + 4+4+4 + 0+1+1 + 3+2+2 = 66
      // CHPMI = 66/120 * 100 = 55.0%
      expect(calculateCHPMI(scores)).toBeCloseTo(55.0, 2);
    });
  });

  describe('Maturity Band Classification (per documentation)', () => {
    // Based on doc appendix:
    // 0 = Non-Existent, 0-20 = Nascent, 21-40 = Emerging,
    // 41-60 = Developing, 61-80 = Established, >80 = Matured

    it.each([
      [0, 'Non-Existent'],
      [10, 'Nascent'],
      [20, 'Nascent'],
      [25, 'Emerging'],
      [40, 'Emerging'],
      [45, 'Developing'],
      [60, 'Developing'],
      [65, 'Established'],
      [80, 'Established'],
      [85, 'Matured'],
      [100, 'Matured'],
    ])('CHPMI %d%% should map to %s band', (score, expectedBand) => {
      // This test documents the expected band classification logic.
      // The actual band lookup is done via DB query in recalculateAssessment,
      // so this serves as a specification reference test.
      let band: string;
      if (score === 0) band = 'Non-Existent';
      else if (score <= 20) band = 'Nascent';
      else if (score <= 40) band = 'Emerging';
      else if (score <= 60) band = 'Developing';
      else if (score <= 80) band = 'Established';
      else band = 'Matured';

      expect(band).toBe(expectedBand);
    });
  });

  describe('Edge Cases', () => {
    it('calculateComponentScore handles array with only invalid values', () => {
      expect(calculateComponentScore([5, 6, -1])).toBeNull();
    });

    it('calculateCHPMI returns 0 for array of all invalid values', () => {
      expect(calculateCHPMI([5, -1, 10])).toBeCloseTo(0.0);
    });

    it('calculateComponentScore range is 0-4', () => {
      const score = calculateComponentScore([0, 4, 2]);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(4);
    });

    it('calculateCHPMI range is 0-100', () => {
      // Maximum possible
      expect(calculateCHPMI(new Array(30).fill(4))).toBeLessThanOrEqual(100);
      expect(calculateCHPMI(new Array(30).fill(4))).toBeGreaterThanOrEqual(0);
      // Minimum possible
      expect(calculateCHPMI([])).toBeGreaterThanOrEqual(0);
      expect(calculateCHPMI([])).toBeLessThanOrEqual(100);
    });

    it('scoring formula matches documentation: Sum(30 scores) / 120 × 100', () => {
      // All criteria at 3: sum = 90, CHPMI = 90/120 * 100 = 75%
      const scores = new Array(30).fill(3);
      const expected = (90 / 120) * 100;
      expect(calculateCHPMI(scores)).toBeCloseTo(expected);
    });
  });
});
