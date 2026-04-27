import { Result, Title } from '@chess/generated/prisma/client';
import { ChessBoardSquare } from '@chess/services/insights/insights.dto';

export const HIKARU_CHESS_USERNAME = 'hikaru';
export const MAGNUS_CHESS_USERNAME = 'magnuscarlsen';
export const DANIEL_CHESS_USERNAME = 'danielnaroditsky';
export const MINH_CHESS_USERNAME = 'wonderfultime';
export const DING_CHESS_USERNAME = 'chefshouse';
// Titles
export const OPEN_TITLES: Title[] = ['GM', 'IM', 'FM', 'CM', 'NM'];
export const WOMAN_TITLES: Title[] = ['WGM', 'WIM', 'WFM', 'WCM', 'WNM'];
export const ARENA_TITLES: Title[] = ['AGM', 'AIM', 'AFM', 'ACM'];
export const TITLES: Title[] = [
  ...OPEN_TITLES,
  ...WOMAN_TITLES,
  ...ARENA_TITLES,
];
// Ratings
export const GAP: number = 100;
// Colors
export const TIME_COLORS: string[] = [
  '#E53E3E',
  '#DD6B20',
  '#D69E2E',
  '#38A169',
  '#319795',
  '#3182CE',
  '#00B5D8',
  '#805AD5',
  '#D53F8C',
];
export const TEAL_COLOR: string = '#008080';
export const TEAL_COLORS: string[] = [
  '#008080',
  '#007373',
  '#006666',
  '#005a5a',
  '#004d4d',
  '#004040',
  '#003333',
  '#002626',
  '#000d0d',
  '#000000',
];
export const GRAY_COLOR: string = '#808080';
export const GRAY_COLORS: string[] = [
  '#808080',
  '#737373',
  '#666666',
  '#5a5a5a',
  '#4d4d4d',
  '#404040',
  '#333333',
  '#262626',
  '#1a1a1a',
  '#0d0d0d',
  '#000000',
];
export const RED_COLOR: string = '#ff0000';
export const RED_COLORS: string[] = [
  '#ff0000',
  '#e60000',
  '#cc0000',
  '#b30000',
  '#990000',
  '#800000',
  '#660000',
  '#4c0000',
  '#330000',
  '#190000',
  '#000000',
];
export const COLORS_MAP: Record<string, string[]> = {
  teal: TEAL_COLORS,
  gray: GRAY_COLORS,
  red: RED_COLORS,
};
// Results
export const WIN_RESULTS: Result[] = ['win'];
export const DRAW_RESULTS: Result[] = [
  'fiftymove',
  'agreed',
  'insufficient',
  'repetition',
  'stalemate',
  'timevsinsufficient',
];
export const LOSS_RESULTS: Result[] = [
  'checkmated',
  'resigned',
  'timeout',
  'abandoned',
];

export const TITLED_ABBREVIATIONS: Record<Title, string> = {
  GM: 'Grand Master',
  IM: 'International Master',
  FM: 'FIDE Master',
  CM: 'Candidate Master',
  NM: 'National Master',
  WGM: 'Woman Grand Master',
  WIM: 'Woman International Master',
  WFM: 'Woman FIDE Master',
  WCM: 'Woman Candidate Master',
  WNM: 'Woman National Master',
  AGM: 'Arena Grand Master',
  AIM: 'Arena International Master',
  AFM: 'Arena FIDE Master',
  ACM: 'Arena Candidate Master',
};

// Chess Board
export const CHESS_BOARD: ChessBoardSquare[][] = [
  ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'],
  ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7'],
  ['a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6'],
  ['a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5'],
  ['a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4'],
  ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3'],
  ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2'],
  ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'],
];

// Results
export const CHESS_WIN_RESULTS: Result[] = [Result.win];
export const CHESS_DRAW_RESULTS: Result[] = [
  Result.fiftymove,
  Result.agreed,
  Result.insufficient,
  Result.repetition,
  Result.stalemate,
  Result.timevsinsufficient,
];
export const CHESS_LOSS_RESULTS: Result[] = [
  Result.checkmated,
  Result.resigned,
  Result.timeout,
  Result.abandoned,
];
