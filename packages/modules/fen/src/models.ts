export type FEN = {
  piecePlacement: string;
  activeColor: 'w' | 'b';
  castlingAvailability: string;
  enPassantTarget: string;
  halfMoveClock: number;
  fullMoveNumber: number;
};
