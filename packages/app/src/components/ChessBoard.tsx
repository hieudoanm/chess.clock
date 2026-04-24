import { FC } from 'react';
import {
  PieceDropHandlerArgs,
  PieceHandlerArgs,
  Chessboard as ReactChessboard,
} from 'react-chessboard';
import {
  FaChessBishop,
  FaChessKing,
  FaChessKnight,
  FaChessPawn,
  FaChessQueen,
  FaChessRook,
} from 'react-icons/fa6';

export const Chessboard: FC<{
  position: string;
  allowDragging?: boolean;
  canDragPiece?: ({ isSparePiece, piece, square }: PieceHandlerArgs) => boolean;
  onPieceDrop?: ({
    piece,
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs) => boolean;
}> = ({
  allowDragging = false,
  position = '',
  canDragPiece = () => false,
  onPieceDrop = () => false,
}) => {
  const darkSquareColor: string = 'oklch(14.5% 0 0)';
  const lightSquareColor: string = 'oklch(20.5% 0 0)';

  return (
    <ReactChessboard
      options={{
        position,
        allowDragging,
        canDragPiece,
        onPieceDrop,
        darkSquareStyle: { backgroundColor: darkSquareColor, color: 'white' },
        lightSquareStyle: { backgroundColor: lightSquareColor, color: 'white' },
        pieces: {
          wK: () => (
            <div className="flex aspect-square h-full w-full items-center justify-center">
              <FaChessKing className="text-xl text-white md:text-2xl" />
            </div>
          ),
          wQ: () => (
            <div className="flex aspect-square h-full w-full items-center justify-center">
              <FaChessQueen className="text-xl text-white md:text-2xl" />
            </div>
          ),
          wR: () => (
            <div className="flex aspect-square h-full w-full items-center justify-center">
              <FaChessRook className="text-xl text-white md:text-2xl" />
            </div>
          ),
          wB: () => (
            <div className="flex aspect-square h-full w-full items-center justify-center">
              <FaChessBishop className="text-xl text-white md:text-2xl" />
            </div>
          ),
          wN: () => (
            <div className="flex aspect-square h-full w-full items-center justify-center">
              <FaChessKnight className="text-xl text-white md:text-2xl" />
            </div>
          ),
          wP: () => (
            <div className="flex aspect-square h-full w-full items-center justify-center">
              <FaChessPawn className="text-xl text-white md:text-2xl" />
            </div>
          ),
          bK: () => (
            <div className="flex aspect-square h-full w-full items-center justify-center">
              <FaChessKing className="text-xl text-red-500 md:text-2xl" />
            </div>
          ),
          bQ: () => (
            <div className="flex aspect-square h-full w-full items-center justify-center">
              <FaChessQueen className="text-xl text-red-500 md:text-2xl" />
            </div>
          ),
          bR: () => (
            <div className="flex aspect-square h-full w-full items-center justify-center">
              <FaChessRook className="text-xl text-red-500 md:text-2xl" />
            </div>
          ),
          bB: () => (
            <div className="flex aspect-square h-full w-full items-center justify-center">
              <FaChessBishop className="text-xl text-red-500 md:text-2xl" />
            </div>
          ),
          bN: () => (
            <div className="flex aspect-square h-full w-full items-center justify-center">
              <FaChessKnight className="text-xl text-red-500 md:text-2xl" />
            </div>
          ),
          bP: () => (
            <div className="flex aspect-square h-full w-full items-center justify-center">
              <FaChessPawn className="text-xl text-red-500 md:text-2xl" />
            </div>
          ),
        },
      }}
    />
  );
};
