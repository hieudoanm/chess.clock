import { FEN } from '../models';
import { parseFEN } from '../parser/fen-parser';
import { stringifyFEN } from './fen-writer';

describe('FEN stringifying', () => {
  it('stringifies a FEN object back to string', () => {
    const fen: FEN = {
      piecePlacement: '8/8/8/8/8/8/8/8',
      activeColor: 'b',
      castlingAvailability: '-',
      enPassantTarget: '-',
      halfMoveClock: 12,
      fullMoveNumber: 34,
    };

    const result = stringifyFEN(fen);

    expect(result).toBe('8/8/8/8/8/8/8/8 b - - 12 34');
  });

  it('round-trips parse → stringify → parse', () => {
    const original =
      'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';

    const parsed = parseFEN(original);
    const stringified = stringifyFEN(parsed);
    const reparsed = parseFEN(stringified);

    expect(reparsed).toEqual(parsed);
  });
});
