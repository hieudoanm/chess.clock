import { parseFEN } from './fen-parser';
import type { FEN } from '../models';

describe('FEN parsing', () => {
  it('parses a valid FEN string', () => {
    const fenStr = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    const fen = parseFEN(fenStr);

    expect(fen).toEqual<FEN>({
      piecePlacement: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
      activeColor: 'w',
      castlingAvailability: 'KQkq',
      enPassantTarget: '-',
      halfMoveClock: 0,
      fullMoveNumber: 1,
    });
  });

  it('throws on invalid FEN (wrong field count)', () => {
    expect(() => parseFEN('invalid fen string')).toThrow('Invalid FEN');
  });

  it('throws on invalid active color', () => {
    expect(() => parseFEN('8/8/8/8/8/8/8/8 x - - 0 1')).toThrow('active color');
  });
});
