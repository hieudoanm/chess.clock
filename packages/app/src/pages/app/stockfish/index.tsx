import { Chessboard } from '@chess/components/ChessBoard';
import { useStockfish } from '@chess/hooks/use-stockfish';
import { Chess } from 'chess.js';
import { NextPage } from 'next';
import { useEffect, useRef, useState } from 'react';
import { PieceDataType } from 'react-chessboard';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const StockfishPage: NextPage = () => {
  const gameRef = useRef(new Chess(START_FEN));
  const [fen, setFen] = useState(START_FEN);
  const [thinking, setThinking] = useState(false);

  const { analyze, bestMove, evaluation } = useStockfish();

  /* ---------------- PLAYER MOVE ---------------- */

  const onPieceDrop = ({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string | null;
  }): boolean => {
    const game = gameRef.current;

    // Only allow white moves
    if (game.turn() !== 'w') return false;

    let move = null;

    try {
      move = game.move({
        from: sourceSquare,
        to: targetSquare ?? '',
        promotion: 'q',
      });
    } catch (error) {
      console.error(error);
    }

    if (!move) return false;

    setFen(game.fen());
    setThinking(true);

    return true;
  };

  /* ---------------- ENGINE THINK ---------------- */

  useEffect(() => {
    const game = gameRef.current;

    if (game.turn() === 'b' && !game.isGameOver()) {
      analyze(game.fen(), 15);
    }
  }, [fen]);

  /* ---------------- APPLY ENGINE MOVE ---------------- */

  useEffect(() => {
    if (!bestMove) return;

    const game = gameRef.current;

    if (game.turn() !== 'b') return;

    const move = game.move({
      from: bestMove.slice(0, 2),
      to: bestMove.slice(2, 4),
      promotion: 'q',
    });

    if (move) {
      setFen(game.fen());
    }

    setThinking(false);
  }, [bestMove]);

  /* ---------------- DRAG RULES ---------------- */

  const canDragPiece = ({
    piece,
  }: {
    isSparePiece: boolean;
    piece: PieceDataType;
    square: string | null;
  }) => {
    // Only allow white pieces
    return piece.pieceType.startsWith('w');
  };

  const resetGame = () => {
    const game = new Chess(START_FEN);

    gameRef.current = game;
    setFen(game.fen());
    setThinking(false);

    // Stop engine + re-init position
    analyze(game.fen(), 10);
  };

  // Convert centipawn → percentage
  const evalPercent = (() => {
    if (evaluation === null) return 50;

    // Clamp eval (-1000 → +1000 cp)
    const clamped = Math.max(-1000, Math.min(1000, evaluation));

    // Convert to 0–100 scale
    return 50 + clamped / 20;
  })();

  /* ---------------- UI ---------------- */

  return (
    <div className="bg-base-200 flex h-screen w-screen items-center justify-center">
      <div className="w-full max-w-md space-y-4 p-4 md:p-8">
        <h1 className="text-center text-2xl font-bold">Stockfish 18</h1>

        <div className="flex items-stretch gap-2">
          {/* Chessboard */}
          <div className="border-base-content/20 flex-1 overflow-hidden rounded border">
            <Chessboard
              allowDragging
              position={fen}
              onPieceDrop={onPieceDrop}
              canDragPiece={canDragPiece}
            />
          </div>

          {/* Eval Bar */}
          <div className="border-base-content/20 bg-base-100 relative h-[400px] w-6 overflow-hidden rounded border">
            {/* White advantage */}
            <div
              className="absolute bottom-0 w-full bg-white transition-all duration-300"
              style={{ height: `${evalPercent}%` }}
            />

            {/* Divider line */}
            <div className="bg-base-content/40 absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2" />

            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold">
              {evaluation ? (evaluation / 100).toFixed(1) : '0.0'}
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-sm w-full" onClick={resetGame}>
          Reset Game
        </button>
      </div>
    </div>
  );
};

export default StockfishPage;
