import { PGNGame, PGNMove } from '../models';

const TAG_REGEX = /^\[(\w+)\s+"(.*)"\]$/;

export const parsePGN = (input: string): PGNGame[] => {
  const games: PGNGame[] = [];
  const chunks = input.split(/\n\n(?=\[Event)/);

  for (const chunk of chunks) {
    const lines = chunk
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const headers: Record<string, string> = {};
    let movesText = '';

    for (const line of lines) {
      const headerMatch = line.match(TAG_REGEX);
      if (headerMatch) {
        const key: string | undefined = headerMatch[1];
        if (typeof key !== 'undefined') {
          const value: string | undefined = headerMatch[2];
          headers[key] = value ?? '';
        }
      } else {
        movesText += ' ' + line;
      }
    }

    const moves = parseMoves(movesText);
    games.push({
      headers,
      moves,
      result: headers.Result ?? '*',
    });
  }

  return games;
};

const parseMoves = (text: string): PGNMove[] => {
  const moves: PGNMove[] = [];
  const tokens = text
    .replace(/\{[^}]*\}/g, '') // strip comments (v1)
    .split(/\s+/)
    .filter(Boolean);

  let moveNumber = 0;
  let color: 'w' | 'b' = 'w';

  for (const token of tokens) {
    if (/^\d+\./.test(token)) {
      moveNumber = parseInt(token, 10);
      color = 'w';
      continue;
    }

    if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)) {
      break;
    }

    moves.push({
      moveNumber,
      color,
      san: token,
    });

    color = color === 'w' ? 'b' : 'w';
  }

  return moves;
};
