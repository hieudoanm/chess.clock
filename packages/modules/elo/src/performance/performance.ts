/* ---------------- Types ---------------- */

import { Score } from '../common/common';

export type Game = {
  ratingOpponent: number;
  score: Score;
};

export type PerformanceInput = {
  games: Game[];
};

/* ---------------- Helpers ---------------- */

/**
 * Average opponent rating
 */
const getAverageOpponentRating = (games: Game[]): number => {
  if (!games.length) return 0;
  const total = games.reduce((sum, g) => sum + g.ratingOpponent, 0);
  return total / games.length;
};

/**
 * Score percentage (0 → 1)
 */
const getScorePercentage = (games: Game[]): number => {
  if (!games.length) return 0;
  const totalScore = games.reduce((sum, g) => sum + g.score, 0);
  return totalScore / games.length;
};

/**
 * Performance differential (logistic model)
 *
 * D = 400 * log10(p / (1 - p))
 *
 * Clamped to avoid infinity at 0% / 100%
 */
const getPerformanceDifferential = (p: number): number => {
  const epsilon = 0.0001;

  if (p <= 0) p = epsilon;
  if (p >= 1) p = 1 - epsilon;

  return 400 * Math.log10(p / (1 - p));
};

/* ---------------- Main ---------------- */

/**
 * Tournament Performance Rating
 *
 * Rp = Ravg + D
 */
export const calculatePerformance = ({ games }: PerformanceInput): number => {
  if (!games.length) return 0;

  const avgOpponent = getAverageOpponentRating(games);
  const percentage = getScorePercentage(games);
  const differential = getPerformanceDifferential(percentage);

  return Math.round(avgOpponent + differential);
};
