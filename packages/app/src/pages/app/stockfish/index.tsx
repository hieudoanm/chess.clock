import { Chessboard } from '@chess/components/ChessBoard';
import { useStockfish } from '@chess/hooks/use-stockfish';
import { INITIAL_GAME, INITIAL_ID } from '@chess/constants/app';
import { chess960 } from '@chess/data/chess960';
import { chess960BackRankToInitialFEN } from '@chess/utils/chess/fen';
import { addZero, range } from '@chess/utils/number';
import { Chess } from 'chess.js';
import { NextPage } from 'next';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { PiShuffle, PiRobot, PiEye } from 'react-icons/pi';
import { PieceDataType } from 'react-chessboard';

type Mode = 'explore' | 'play';

const StockfishPage: NextPage = () => {
  const gameRef = useRef<Chess>(INITIAL_GAME);

  const [id, setId] = useState<number>(INITIAL_ID);
  const [fen, setFen] = useState<string>(INITIAL_GAME.fen());
  const [mode, setMode] = useState<Mode>('explore');
  const [thinking, setThinking] = useState(false);

  const { analyze, bestMove, evaluation } = useStockfish();

  /* ─── helpers ─── */

  const buildGame = (positionId: number): Chess => {
    const position = chess960[positionId] ?? '';
    const startFen = chess960BackRankToInitialFEN(position);
    return new Chess(startFen);
  };

  const syncState = (newId: number, newGame: Chess) => {
    gameRef.current = newGame;
    setId(newId);
    setFen(newGame.fen());
    setThinking(false);
  };

  /* ─── position select / randomize ─── */

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newId = Number.parseInt(event.target.value, 10) ?? 0;
    syncState(newId, buildGame(newId));
  };

  const randomize = () => {
    const newId = Math.floor(Math.random() * 960);
    syncState(newId, buildGame(newId));
  };

  /* ─── mode switch ─── */

  const switchMode = (next: Mode) => {
    // Reset to the current 960 starting position when switching
    syncState(id, buildGame(id));
    setMode(next);
  };

  /* ─── player move (play mode only) ─── */

  const onPieceDrop = ({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string | null;
  }): boolean => {
    if (mode !== 'play') return false;
    const game = gameRef.current;
    if (game.turn() !== 'w') return false;

    let move = null;
    try {
      move = game.move({
        from: sourceSquare,
        to: targetSquare ?? '',
        promotion: 'q',
      });
    } catch (e) {
      console.error(e);
    }

    if (!move) return false;

    setFen(game.fen());
    setThinking(true);
    return true;
  };

  /* ─── trigger engine after white move ─── */

  useEffect(() => {
    if (mode !== 'play') return;
    const game = gameRef.current;
    if (game.turn() === 'b' && !game.isGameOver()) {
      analyze(game.fen(), 15);
    }
  }, [fen, mode]);

  /* ─── apply engine move ─── */

  useEffect(() => {
    if (!bestMove || mode !== 'play') return;
    const game = gameRef.current;
    if (game.turn() !== 'b') return;

    const move = game.move({
      from: bestMove.slice(0, 2),
      to: bestMove.slice(2, 4),
      promotion: 'q',
    });

    if (move) setFen(game.fen());
    setThinking(false);
  }, [bestMove, mode]);

  /* ─── drag rules ─── */

  const canDragPiece = ({
    piece,
  }: {
    isSparePiece: boolean;
    piece: PieceDataType;
    square: string | null;
  }) => {
    if (mode === 'explore') return false;
    return piece.pieceType.startsWith('w');
  };

  /* ─── eval bar ─── */

  const evalPercent = (() => {
    if (evaluation === null || mode !== 'play') return 50;
    const clamped = Math.max(-1000, Math.min(1000, evaluation));
    return 50 + clamped / 20;
  })();

  const evalLabel = (() => {
    if (evaluation === null || mode !== 'play') return '0.0';
    return (evaluation / 100).toFixed(1);
  })();

  /* ─── game status ─── */

  const statusLabel = (() => {
    const game = gameRef.current;
    if (mode !== 'play') return null;
    if (game.isCheckmate()) return 'Checkmate!';
    if (game.isDraw()) return 'Draw';
    if (game.isCheck()) return 'Check!';
    if (thinking) return 'Stockfish is thinking…';
    return game.turn() === 'w' ? 'Your move' : null;
  })();

  /* ─── UI ─── */

  return (
    <div className="bg-base-200 flex min-h-screen w-screen items-center justify-center p-4 md:p-8">
      <div className="flex w-full max-w-md flex-col gap-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black md:text-3xl">
            Chess{' '}
            <select
              id="id"
              name="id"
              value={id}
              className="appearance-none font-black"
              onChange={handleSelectChange}>
              {range(0, 959).map((i: number) => (
                <option key={i} value={i}>
                  {addZero(i, 3)}
                </option>
              ))}
            </select>
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              title="Randomize position"
              onClick={randomize}>
              <PiShuffle />
            </button>
          </div>
        </div>

        {/* Mode tabs */}
        <div role="tablist" className="tabs tabs-boxed">
          <button
            role="tab"
            className={`tab gap-1 ${mode === 'explore' ? 'tab-active' : ''}`}
            onClick={() => switchMode('explore')}>
            <PiEye />
            Explore
          </button>
          <button
            role="tab"
            className={`tab gap-1 ${mode === 'play' ? 'tab-active' : ''}`}
            onClick={() => switchMode('play')}>
            <PiRobot />
            Play vs Stockfish
          </button>
        </div>

        {/* Board + Eval bar */}
        <div className="flex items-stretch gap-2">
          <div className="border-base-content/20 flex-1 overflow-hidden rounded border">
            <Chessboard
              allowDragging
              position={fen}
              onPieceDrop={onPieceDrop}
              canDragPiece={canDragPiece}
            />
          </div>

          {/* Eval bar — visible in play mode only */}
          <div
            className={`border-base-content/20 bg-base-100 relative w-6 overflow-hidden rounded border transition-opacity duration-300 ${
              mode === 'play' ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}>
            <div
              className="absolute bottom-0 w-full bg-white transition-all duration-300"
              style={{ height: `${evalPercent}%` }}
            />
            <div className="bg-base-content/40 absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2" />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold">
              {evalLabel}
            </div>
          </div>
        </div>

        {/* Status / reset */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-base-content/60 text-sm">
            {statusLabel ??
              (mode === 'explore'
                ? 'Drag disabled — switch to Play to move'
                : '')}
          </p>
          {mode === 'play' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => switchMode('play')}>
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockfishPage;
