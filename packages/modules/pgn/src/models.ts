export type PGNGame = {
  headers: Record<string, string>;
  moves: PGNMove[];
  result: string;
};

export type PGNMove = {
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  nag?: string[];
  comment?: string;
  variations?: PGNMove[][];
};
