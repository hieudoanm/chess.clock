import { Score, TimeClass } from '../common/common';

export type DevelopmentCoefficient = 10 | 20 | 40;

const getDevelopmentCoefficient = ({
  ratingPlayer = 1000,
  lessThan30Games = false,
  overRating2400 = false,
  overAge18 = true,
  timeClass = TimeClass.CLASSICAL,
}): DevelopmentCoefficient => {
  if (timeClass === TimeClass.RAPID || timeClass === TimeClass.BLITZ) return 20;
  if (overRating2400) return 10;
  if (lessThan30Games || (!overAge18 && ratingPlayer < 2300)) return 40;
  return 20;
};

const getDelta = ({
  ratingPlayer = 1000,
  ratingOpponent = 1000,
  lessThan30Games = false,
  overRating2400 = false,
  overAge18 = true,
  score = Score.DRAW,
  timeClass = TimeClass.CLASSICAL,
}): number => {
  if (![Score.WIN, Score.DRAW, Score.LOSS].includes(score)) return 0;
  const gap: number = ratingOpponent - ratingPlayer;
  const chanceToWin: number = 1 / (1 + 10 ** (gap / 400));
  const K: DevelopmentCoefficient = getDevelopmentCoefficient({
    ratingPlayer,
    lessThan30Games,
    overRating2400,
    overAge18,
    timeClass,
  });
  return Math.round(K * (score - chanceToWin));
};

export const calculateRating = ({
  ratingPlayer = 1000,
  ratingOpponent = 1000,
  lessThan30Games = false,
  overRating2400 = false,
  overAge18 = true,
  score = Score.DRAW,
  timeClass = TimeClass.CLASSICAL,
}: {
  ratingPlayer: number;
  ratingOpponent: number;
  lessThan30Games: boolean;
  overRating2400: boolean;
  overAge18: boolean;
  score: Score;
  timeClass: TimeClass;
}): number => {
  const delta = getDelta({
    ratingPlayer,
    ratingOpponent,
    lessThan30Games,
    overRating2400,
    overAge18,
    score,
    timeClass,
  });
  return ratingPlayer + delta;
};
