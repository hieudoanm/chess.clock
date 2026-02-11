import { chess960 } from '@chess/data/chess960';
import { chess960BackRankToInitialFEN } from '@chess/utils/chess/fen';
import { Chess } from 'chess.js';

export const APP_NAME: string = 'Chess960';

export const INITIAL_ID: number = 518;
export const INITIAL_POSITION: string = chess960.at(INITIAL_ID) ?? '';
export const INITIAL_FEN: string =
  chess960BackRankToInitialFEN(INITIAL_POSITION);
export const INITIAL_GAME = new Chess(INITIAL_FEN);
