import { Chessboard } from '@chess/components/ChessBoard';
import { useStockfish } from '@chess/hooks/use-stockfish';
import { INITIAL_FEN, INITIAL_GAME, INITIAL_ID } from '@chess/constants/app';
import { chess960 } from '@chess/data/chess960';
import { chess960BackRankToInitialFEN } from '@chess/utils/chess/fen';
import { download } from '@chess/utils/canvas';
import { getHeaders, getMoves, simplifyPGN } from '@chess/utils/chess/pgn';
import { addZero, range } from '@chess/utils/number';
import { Chess } from 'chess.js';
import GIF from 'gif.js';
import html2canvas from 'html2canvas-pro';
import type { NextPage } from 'next';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { DraggingPieceDataType, PieceDataType } from 'react-chessboard';
import {
  PiArrowCounterClockwise,
  PiDownloadSimple,
  PiEye,
  PiFilmStrip,
  PiFrameCorners,
  PiRobot,
  PiShuffle,
} from 'react-icons/pi';

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */

type BoardMode = 'explore' | 'play';
type SidePanel = 'position' | 'engine' | 'export';

/* ══════════════════════════════════════════════
   GIF HELPERS
══════════════════════════════════════════════ */

const downloadGIF = ({
  base64s,
  pgn,
}: {
  base64s: string[];
  pgn: string;
}): Promise<void> =>
  new Promise((resolve) => {
    const gif = new GIF({
      workers: 1,
      quality: 10,
      workerScript: '/workers/gif.worker.js',
    });
    let loaded = 0;

    base64s.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        gif.addFrame(img, { delay: 500 });
        if (++loaded === base64s.length) gif.render();
      };
    });

    gif.on('finished', (blob: Blob) => {
      const headers = getHeaders(pgn);
      const name =
        `${headers['White'] ?? ''} vs ${headers['Black'] ?? ''}`.trim() ||
        'chess';
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${name}.gif`;
      link.click();
      link.remove();
      resolve();
    });

    gif.on('abort', () => resolve());
  });

/* ══════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════ */

const BoardPage: NextPage = () => {
  /* ─── refs ─── */
  const boardRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Chess>(new Chess(INITIAL_FEN));

  /* ─── board state ─── */
  const [fen, setFen] = useState<string>(INITIAL_FEN);
  const [boardMode, setBoardMode] = useState<BoardMode>('explore');
  const [thinking, setThinking] = useState(false);

  /* ─── chess960 state ─── */
  const [positionId, setPositionId] = useState<number>(INITIAL_ID);

  /* ─── panel state ─── */
  const [panel, setPanel] = useState<SidePanel>('position');

  /* ─── PGN ─── */
  const [pgn, setPgn] = useState<string>('');
  const [gifLoading, setGifLoading] = useState(false);

  /* ─── engine ─── */
  const { analyze, bestMove, evaluation } = useStockfish();

  /* ══════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════ */

  const syncGame = (newGame: Chess) => {
    gameRef.current = newGame;
    setFen(newGame.fen());
    setPgn(simplifyPGN(newGame.pgn()));
    setThinking(false);
  };

  const build960 = (id: number): Chess => {
    const pos = chess960[id] ?? '';
    return new Chess(chess960BackRankToInitialFEN(pos));
  };

  /* ══════════════════════════════════════════
     POSITION PANEL
  ══════════════════════════════════════════ */

  const handleFENChange = (value: string) => {
    try {
      syncGame(new Chess(value));
    } catch {
      /* ignore invalid */
    }
  };

  const handle960IdChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = Number.parseInt(e.target.value, 10);
    setPositionId(id);
    syncGame(build960(id));
  };

  const randomize960 = () => {
    const id = Math.floor(Math.random() * 960);
    setPositionId(id);
    syncGame(build960(id));
  };

  const resetToStart = () => {
    syncGame(new Chess(INITIAL_FEN));
    setPositionId(INITIAL_ID);
  };

  /* ══════════════════════════════════════════
     BOARD INTERACTION
  ══════════════════════════════════════════ */

  const onPieceDrop = ({
    sourceSquare,
    targetSquare,
  }: {
    piece?: DraggingPieceDataType;
    sourceSquare: string;
    targetSquare: string | null;
  }): boolean => {
    const game = gameRef.current;

    // In play mode: only white
    if (boardMode === 'play' && game.turn() !== 'w') return false;

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
    setPgn(simplifyPGN(game.pgn()));

    if (boardMode === 'play') setThinking(true);
    return true;
  };

  const canDragPiece = ({
    piece,
  }: {
    isSparePiece: boolean;
    piece: PieceDataType;
    square: string | null;
  }) => {
    if (boardMode === 'play') return piece.pieceType.startsWith('w');
    return true; // explore: all pieces
  };

  /* ══════════════════════════════════════════
     ENGINE EFFECTS
  ══════════════════════════════════════════ */

  useEffect(() => {
    if (boardMode !== 'play') return;
    const game = gameRef.current;
    if (game.turn() === 'b' && !game.isGameOver()) {
      analyze(game.fen(), 15);
    }
  }, [fen, boardMode]);

  useEffect(() => {
    if (!bestMove || boardMode !== 'play') return;
    const game = gameRef.current;
    if (game.turn() !== 'b') return;

    const move = game.move({
      from: bestMove.slice(0, 2),
      to: bestMove.slice(2, 4),
      promotion: 'q',
    });

    if (move) {
      setFen(game.fen());
      setPgn(simplifyPGN(game.pgn()));
    }
    setThinking(false);
  }, [bestMove, boardMode]);

  /* ══════════════════════════════════════════
     MODE SWITCH
  ══════════════════════════════════════════ */

  const switchBoardMode = (next: BoardMode) => {
    // re-build from current 960 position when switching
    syncGame(build960(positionId));
    setBoardMode(next);
  };

  /* ══════════════════════════════════════════
     EVAL BAR
     Stockfish reports eval from the side to move's perspective.
     We normalise to always be from White's POV:
       - White to move: keep sign as-is
       - Black to move: flip sign
  ══════════════════════════════════════════ */

  const whiteEval = (() => {
    if (evaluation === null || boardMode !== 'play') return null;
    const fromWhite = gameRef.current.turn() === 'w' ? evaluation : -evaluation;
    return fromWhite;
  })();

  const evalPercent = (() => {
    if (whiteEval === null) return 50;
    return 50 + Math.max(-1000, Math.min(1000, whiteEval)) / 20;
  })();

  const evalLabel = (() => {
    if (whiteEval === null) return '0.0';
    return (whiteEval / 100).toFixed(1);
  })();

  /* ══════════════════════════════════════════
     STATUS
  ══════════════════════════════════════════ */

  const statusLabel = (() => {
    const game = gameRef.current;
    if (boardMode !== 'play') return null;
    if (game.isCheckmate()) return 'Checkmate!';
    if (game.isDraw()) return 'Draw';
    if (game.isCheck()) return 'Check!';
    if (thinking) return 'Stockfish thinking…';
    return game.turn() === 'w' ? 'Your turn (White)' : null;
  })();

  /* ══════════════════════════════════════════
     PGN IMPORT
  ══════════════════════════════════════════ */

  const handlePGNChange = (value: string) => {
    setPgn(value);
    try {
      const g = new Chess();
      g.loadPgn(value);
      gameRef.current = g;
      setFen(g.fen());
    } catch {
      /* ignore */
    }
  };

  /* ══════════════════════════════════════════
     EXPORT
  ══════════════════════════════════════════ */

  const exportPNG = () => {
    download({ ref: boardRef, output: 'chess-position' });
  };

  const exportGIF = async () => {
    if (!pgn) return;
    setGifLoading(true);

    const moves = getMoves(pgn);
    const tempGame = new Chess();
    const base64s: string[] = [];

    for (const move of moves) {
      tempGame.move(move);
      gameRef.current = new Chess(tempGame.fen());
      setFen(tempGame.fen());

      if (boardRef.current) {
        const canvas = await html2canvas(boardRef.current);
        base64s.push(canvas.toDataURL('image/png'));
      }
    }

    await downloadGIF({ base64s, pgn });
    setGifLoading(false);
  };

  /* ══════════════════════════════════════════
     UI
  ══════════════════════════════════════════ */

  return (
    <div className="bg-base-200 flex min-h-screen w-screen items-start justify-center p-4 py-8 md:p-8">
      <div className="flex w-full max-w-4xl flex-col gap-6 lg:flex-row lg:items-start">
        {/* ── LEFT: Board column ── */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Title + 960 selector */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black md:text-3xl">
              Chess{' '}
              <select
                value={positionId}
                className="appearance-none font-black"
                onChange={handle960IdChange}>
                {range(0, 959).map((i: number) => (
                  <option key={i} value={i}>
                    {addZero(i, 3)}
                  </option>
                ))}
              </select>
            </h1>

            <div className="flex items-center gap-1">
              <button
                className="btn btn-ghost btn-sm"
                title="Randomize"
                onClick={randomize960}>
                <PiShuffle />
              </button>
              <button
                className="btn btn-ghost btn-sm"
                title="Reset to start"
                onClick={resetToStart}>
                <PiArrowCounterClockwise />
              </button>
            </div>
          </div>

          {/* Board mode tabs */}
          <div role="tablist" className="tabs tabs-boxed w-full">
            <button
              role="tab"
              className={`tab flex-1 gap-1 ${boardMode === 'explore' ? 'tab-active' : ''}`}
              onClick={() => switchBoardMode('explore')}>
              <PiEye /> Explore
            </button>
            <button
              role="tab"
              className={`tab flex-1 gap-1 ${boardMode === 'play' ? 'tab-active' : ''}`}
              onClick={() => switchBoardMode('play')}>
              <PiRobot /> vs Stockfish
            </button>
          </div>

          {/* Board + eval bar */}
          <div className="flex items-stretch gap-2">
            <div
              ref={boardRef}
              className="border-base-content/20 flex-1 overflow-hidden rounded border">
              <Chessboard
                allowDragging
                position={fen}
                onPieceDrop={onPieceDrop}
                canDragPiece={canDragPiece}
              />
            </div>

            {/* Eval bar */}
            <div
              className={`border-base-content/20 bg-base-100 relative w-6 overflow-hidden rounded border transition-opacity duration-300 ${
                boardMode === 'play'
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0'
              }`}
              style={{ minHeight: 320 }}>
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

          {/* Status */}
          {statusLabel && (
            <p className="text-base-content/60 text-center text-sm">
              {statusLabel}
            </p>
          )}
        </div>

        {/* ── RIGHT: Side panel ── */}
        <div className="flex w-full flex-col gap-4 lg:w-72">
          {/* Panel tabs */}
          <div role="tablist" className="tabs tabs-boxed w-full">
            <button
              role="tab"
              className={`tab flex-1 text-xs ${panel === 'position' ? 'tab-active' : ''}`}
              onClick={() => setPanel('position')}>
              Position
            </button>
            <button
              role="tab"
              className={`tab flex-1 text-xs ${panel === 'engine' ? 'tab-active' : ''}`}
              onClick={() => setPanel('engine')}>
              Engine
            </button>
            <button
              role="tab"
              className={`tab flex-1 text-xs ${panel === 'export' ? 'tab-active' : ''}`}
              onClick={() => setPanel('export')}>
              Export
            </button>
          </div>

          {/* ── POSITION PANEL ── */}
          {panel === 'position' && (
            <div className="flex flex-col gap-3">
              <label className="text-base-content/60 text-xs font-semibold tracking-widest uppercase">
                FEN String
              </label>
              <input
                type="text"
                className="input input-bordered input-sm w-full font-mono text-xs"
                value={fen}
                onChange={(e) => handleFENChange(e.target.value)}
                spellCheck={false}
              />

              <label className="text-base-content/60 text-xs font-semibold tracking-widest uppercase">
                PGN
              </label>
              <textarea
                rows={6}
                className="textarea textarea-bordered w-full font-mono text-xs"
                placeholder="Paste PGN here…"
                value={pgn}
                onChange={(e) => handlePGNChange(e.target.value)}
                spellCheck={false}
              />

              <div className="flex gap-2">
                <button
                  className="btn btn-outline btn-sm flex-1"
                  onClick={resetToStart}>
                  <PiArrowCounterClockwise /> Reset
                </button>
                <button
                  className="btn btn-outline btn-sm flex-1"
                  onClick={randomize960}>
                  <PiShuffle /> Random 960
                </button>
              </div>
            </div>
          )}

          {/* ── ENGINE PANEL ── */}
          {panel === 'engine' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-base-content/60 text-xs font-semibold tracking-widest uppercase">
                  Stockfish 18
                </span>
                <span
                  className={`badge badge-sm ${
                    boardMode === 'play' ? 'badge-success' : 'badge-ghost'
                  }`}>
                  {boardMode === 'play' ? 'Active' : 'Off'}
                </span>
              </div>

              {/* Big eval display */}
              <div className="bg-base-100 flex flex-col items-center gap-1 rounded-xl p-4">
                <span className="text-base-content/40 text-xs">Evaluation</span>
                <span className="font-mono text-3xl font-black">
                  {boardMode === 'play' && whiteEval !== null
                    ? (whiteEval > 0 ? '+' : '') + (whiteEval / 100).toFixed(2)
                    : '—'}
                </span>

                {/* Eval bar horizontal */}
                <div className="bg-base-300 mt-2 h-3 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-300"
                    style={{ width: `${evalPercent}%` }}
                  />
                </div>
                <div className="text-base-content/40 mt-0.5 flex w-full justify-between text-[10px]">
                  <span>Black</span>
                  <span>White</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className={`btn btn-sm flex-1 ${boardMode === 'play' ? 'btn-error' : 'btn-primary'}`}
                  onClick={() =>
                    switchBoardMode(boardMode === 'play' ? 'explore' : 'play')
                  }>
                  <PiRobot />
                  {boardMode === 'play' ? 'Stop Engine' : 'Start Engine'}
                </button>
              </div>

              {statusLabel && (
                <div className="bg-base-100 rounded-lg p-3 text-center text-sm font-semibold">
                  {statusLabel}
                </div>
              )}

              {boardMode === 'play' && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => switchBoardMode('play')}>
                  <PiArrowCounterClockwise /> Reset Game
                </button>
              )}
            </div>
          )}

          {/* ── EXPORT PANEL ── */}
          {panel === 'export' && (
            <div className="flex flex-col gap-3">
              <span className="text-base-content/60 text-xs font-semibold tracking-widest uppercase">
                Export
              </span>

              {/* PNG export */}
              <div className="bg-base-100 flex flex-col gap-2 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <PiFrameCorners className="text-lg" />
                  <div>
                    <p className="text-sm font-bold">FEN → PNG</p>
                    <p className="text-base-content/50 text-xs">
                      Snapshot current board position
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm w-full"
                  onClick={exportPNG}>
                  <PiDownloadSimple /> Download PNG
                </button>
              </div>

              {/* GIF export */}
              <div className="bg-base-100 flex flex-col gap-2 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <PiFilmStrip className="text-lg" />
                  <div>
                    <p className="text-sm font-bold">PGN → GIF</p>
                    <p className="text-base-content/50 text-xs">
                      Animate the game from PGN
                    </p>
                  </div>
                </div>
                <p className="text-base-content/40 text-xs">
                  {pgn
                    ? `${getMoves(pgn).length} moves loaded`
                    : 'Paste PGN in the Position tab first'}
                </p>
                <button
                  className="btn btn-primary btn-sm w-full"
                  disabled={gifLoading || !pgn}
                  onClick={exportGIF}>
                  {gifLoading ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      Rendering…
                    </>
                  ) : (
                    <>
                      <PiDownloadSimple /> Download GIF
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardPage;
