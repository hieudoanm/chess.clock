import { Score, TimeClass } from '../common/common';
import { calculateRating } from './rating';

describe('Elo calculation', () => {
  describe('basic outcomes', () => {
    test('draw between equal players results in no change', () => {
      const rating = calculateRating({
        ratingPlayer: 1500,
        ratingOpponent: 1500,
        lessThan30Games: false,
        overRating2400: false,
        overAge18: true,
        score: Score.DRAW,
        timeClass: TimeClass.CLASSICAL,
      });

      expect(rating).toBe(1500);
    });

    test('win against equal opponent increases rating', () => {
      const rating = calculateRating({
        ratingPlayer: 1500,
        ratingOpponent: 1500,
        lessThan30Games: false,
        overRating2400: false,
        overAge18: true,
        score: Score.WIN,
        timeClass: TimeClass.CLASSICAL,
      });

      expect(rating).toBeGreaterThan(1500);
    });

    test('loss against equal opponent decreases rating', () => {
      const rating = calculateRating({
        ratingPlayer: 1500,
        ratingOpponent: 1500,
        lessThan30Games: false,
        overRating2400: false,
        overAge18: true,
        score: Score.LOSS,
        timeClass: TimeClass.CLASSICAL,
      });

      expect(rating).toBeLessThan(1500);
    });
  });

  describe('rating gap behavior', () => {
    test('winning against higher-rated opponent gains more points', () => {
      const rating = calculateRating({
        ratingPlayer: 1400,
        ratingOpponent: 1600,
        lessThan30Games: false,
        overRating2400: false,
        overAge18: true,
        score: Score.WIN,
        timeClass: TimeClass.CLASSICAL,
      });

      expect(rating).toBeGreaterThan(1400 + 10);
    });

    test('losing to lower-rated opponent loses more points', () => {
      const rating = calculateRating({
        ratingPlayer: 1600,
        ratingOpponent: 1400,
        lessThan30Games: false,
        overRating2400: false,
        overAge18: true,
        score: Score.LOSS,
        timeClass: TimeClass.CLASSICAL,
      });

      expect(rating).toBeLessThan(1600 - 10);
    });
  });

  describe('development coefficient rules', () => {
    test('less than 30 games uses K=40', () => {
      const rating = calculateRating({
        ratingPlayer: 1200,
        ratingOpponent: 1200,
        lessThan30Games: true,
        overRating2400: false,
        overAge18: true,
        score: Score.WIN,
        timeClass: TimeClass.CLASSICAL,
      });

      expect(rating).toBe(1220);
    });

    test('under 18 and under 2300 uses K=40', () => {
      const rating = calculateRating({
        ratingPlayer: 2200,
        ratingOpponent: 2200,
        lessThan30Games: false,
        overRating2400: false,
        overAge18: false,
        score: Score.WIN,
        timeClass: TimeClass.CLASSICAL,
      });

      expect(rating).toBe(2220);
    });

    test('over 2400 uses K=10', () => {
      const rating = calculateRating({
        ratingPlayer: 2500,
        ratingOpponent: 2500,
        lessThan30Games: false,
        overRating2400: true,
        overAge18: true,
        score: Score.WIN,
        timeClass: TimeClass.CLASSICAL,
      });

      expect(rating).toBe(2505);
    });
  });

  describe('time control overrides', () => {
    test('rapid always uses K=20', () => {
      const rating = calculateRating({
        ratingPlayer: 1500,
        ratingOpponent: 1500,
        lessThan30Games: true,
        overRating2400: false,
        overAge18: true,
        score: Score.WIN,
        timeClass: TimeClass.RAPID,
      });

      expect(rating).toBe(1510);
    });

    test('blitz always uses K=20', () => {
      const rating = calculateRating({
        ratingPlayer: 1500,
        ratingOpponent: 1500,
        lessThan30Games: true,
        overRating2400: false,
        overAge18: true,
        score: Score.WIN,
        timeClass: TimeClass.BLITZ,
      });

      expect(rating).toBe(1510);
    });
  });

  describe('edge cases', () => {
    test('invalid score results in no rating change', () => {
      const rating = calculateRating({
        ratingPlayer: 1500,
        ratingOpponent: 1500,
        lessThan30Games: false,
        overRating2400: false,
        overAge18: true,
        score: 999 as Score,
        timeClass: TimeClass.CLASSICAL,
      });

      expect(rating).toBe(1500);
    });

    test('rounding is applied correctly', () => {
      const rating = calculateRating({
        ratingPlayer: 1500,
        ratingOpponent: 1510,
        lessThan30Games: false,
        overRating2400: false,
        overAge18: true,
        score: Score.WIN,
        timeClass: TimeClass.CLASSICAL,
      });

      expect(Number.isInteger(rating)).toBe(true);
    });
  });
});
