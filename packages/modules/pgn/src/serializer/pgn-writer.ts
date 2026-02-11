import { PGNGame } from '../models';

export const stringifyPGN = (games: PGNGame[]): string => {
  return games
    .map((game) => {
      const headers: string = Object.entries(game.headers)
        .map(([key, value]) => `[${key} "${value}"]`)
        .join('\n');

      const moves: string = game.moves
        .map((m) => (m.color === 'w' ? `${m.moveNumber}. ${m.san}` : m.san))
        .join(' ');

      return `${headers}\n\n${moves} ${game.result}`.trim();
    })
    .join('\n\n');
};
