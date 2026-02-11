import { Chess } from 'chess.js';

export const getMoves = (pgn: string): string[] => {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const moves: string[] = chess.history();
  return moves;
};

export const getHeaders = (pgn: string): Record<string, string> => {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const headers: Record<string, string> = chess.getHeaders();
  return headers;
};

export const simplifyPGN = (pgn: string) => {
  const endIndex: number = pgn.lastIndexOf(']') + 1;
  return pgn.slice(endIndex).replaceAll('*', '').trim();
};

export const pgn = (pgn: string) => {
  return {
    moves: () => getMoves(pgn),
    headers: () => getHeaders(pgn),
    simplify: () => simplifyPGN(pgn),
  };
};
