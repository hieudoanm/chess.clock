import { FEN } from '../models';

export const parseFEN = (fen: string): FEN => {
  const parts = fen.trim().split(/\s+/);

  if (parts.length !== 6) {
    throw new Error('Invalid FEN: must have 6 fields');
  }

  const [
    piecePlacement,
    activeColor,
    castlingAvailability,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
  ] = parts;

  // Explicit runtime guards (also fix TS types)
  if (
    !piecePlacement ||
    !activeColor ||
    !castlingAvailability ||
    !enPassantTarget ||
    !halfmoveClock ||
    !fullmoveNumber
  ) {
    throw new Error('Invalid FEN: missing fields');
  }

  if (activeColor !== 'w' && activeColor !== 'b') {
    throw new Error('Invalid FEN: active color');
  }

  const halfmove = Number(halfmoveClock);
  const fullmove = Number(fullmoveNumber);

  if (Number.isNaN(halfmove) || Number.isNaN(fullmove)) {
    throw new Error('Invalid FEN: move counters');
  }

  return {
    piecePlacement,
    activeColor,
    castlingAvailability,
    enPassantTarget,
    halfMoveClock: halfmove,
    fullMoveNumber: fullmove,
  };
};
