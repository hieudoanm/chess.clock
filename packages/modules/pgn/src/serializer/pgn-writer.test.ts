import type { PGNGame } from '../models';
import { stringifyPGN } from './pgn-writer';

describe('stringifyPGN', () => {
  it('stringifies a single game with headers and moves', () => {
    const game: PGNGame = {
      headers: {
        Event: 'Test Event',
        Site: 'Internet',
        Result: '1-0',
      },
      moves: [
        { moveNumber: 1, color: 'w', san: 'e4' },
        { moveNumber: 1, color: 'b', san: 'e5' },
        { moveNumber: 2, color: 'w', san: 'Nf3' },
        { moveNumber: 2, color: 'b', san: 'Nc6' },
      ],
      result: '1-0',
    };

    const pgn = stringifyPGN([game]);

    expect(pgn).toBe(
      `[Event "Test Event"]
[Site "Internet"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 1-0`
    );
  });

  it('handles multiple games separated by a blank line', () => {
    const games: PGNGame[] = [
      {
        headers: { Event: 'Game 1', Result: '1-0' },
        moves: [
          { moveNumber: 1, color: 'w', san: 'e4' },
          { moveNumber: 1, color: 'b', san: 'e5' },
        ],
        result: '1-0',
      },
      {
        headers: { Event: 'Game 2', Result: '0-1' },
        moves: [
          { moveNumber: 1, color: 'w', san: 'd4' },
          { moveNumber: 1, color: 'b', san: 'd5' },
        ],
        result: '0-1',
      },
    ];

    const pgn = stringifyPGN(games);

    expect(pgn).toBe(
      `[Event "Game 1"]
[Result "1-0"]

1. e4 e5 1-0

[Event "Game 2"]
[Result "0-1"]

1. d4 d5 0-1`
    );
  });

  it('handles games with no moves', () => {
    const game: PGNGame = {
      headers: { Event: 'Empty Game', Result: '*' },
      moves: [],
      result: '*',
    };

    const pgn = stringifyPGN([game]);

    expect(pgn).toBe(
      `[Event "Empty Game"]
[Result "*"]

 *`
    );
  });

  it('does not insert move numbers for black moves', () => {
    const game: PGNGame = {
      headers: { Event: 'Color Test', Result: '*' },
      moves: [{ moveNumber: 1, color: 'b', san: 'e5' }],
      result: '*',
    };

    const pgn = stringifyPGN([game]);

    expect(pgn).toContain('e5 *');
    expect(pgn).not.toContain('1. e5');
  });
});
