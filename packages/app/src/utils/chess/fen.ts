const FILES: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const get960Castling = (backRank: string): string => {
  const rank: string = backRank.toUpperCase();
  const kingFile: number = rank.indexOf('K');

  if (kingFile === -1) return '-';

  const rookFiles: number[] = [...rank]
    .map((p, i) => (p === 'R' ? i : -1))
    .filter((i) => i !== -1);

  if (rookFiles.length !== 2) {
    throw new Error('Chess960 back rank must contain exactly two rooks');
  }

  const white: string = rookFiles
    .sort((a, b) => a - b)
    .map((f) => FILES[f])
    .join('')
    .toUpperCase();

  const black: string = white.toLowerCase();

  return white + black;
};

type Variant =
  | 'standard'
  | 'chess960'
  | 'crazyhouse'
  | 'antichess'
  | 'atomic'
  | 'horde'
  | 'kingOfTheHill'
  | 'racingKings'
  | 'threeCheck'
  | 'fromPosition';

export const chess960BackRankToInitialFEN = (
  position: string,
  { variant = 'standard' }: { variant: Variant } = { variant: 'standard' }
): string => {
  if (position.length !== 8) {
    throw new Error('Back rank must be exactly 8 characters');
  }

  const black: string = position.toLowerCase();
  const white: string = position.toUpperCase();

  const castling: string =
    variant === 'chess960' ? get960Castling(position) : 'KQkq';

  return `${black}/pppppppp/8/8/8/8/PPPPPPPP/${white} w ${castling} - 0 1`;
};
