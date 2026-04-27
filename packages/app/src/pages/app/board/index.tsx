import { Chessboard } from '@chess/components/ChessBoard';
import { INITIAL_FEN, INITIAL_ID } from '@chess/constants/app';
import { chess960 } from '@chess/data/chess960';
import { Opening, openings } from '@chess/data/openings';
import { useStockfish } from '@chess/hooks/use-stockfish';
import { download } from '@chess/utils/canvas';
import { chess960BackRankToInitialFEN } from '@chess/utils/chess/fen';
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
  PiArrowLeft,
  PiArrowRight,
  PiDownloadSimple,
  PiEye,
  PiFilmStrip,
  PiFrameCorners,
  PiRobot,
  PiShuffle,
  PiSkipBack,
  PiSkipForward,
} from 'react-icons/pi';

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */

type BoardMode = 'explore' | 'play';
type SidePanel = 'position' | 'engine' | 'export' | 'openings';

/* ══════════════════════════════════════════════
   OPENINGS — pre-computed tree
══════════════════════════════════════════════ */

// Unique sorted groups
const ecoGroups: string[] = [
  ...new Set(openings.map(({ group }) => group)),
].sort();

// group → sorted subgroups
const ecoSubgroups = (group: string): string[] =>
  [
    ...new Set(
      openings.filter((o) => o.group === group).map((o) => o.subgroup ?? '')
    ),
  ].sort();

// group + subgroup → openings list
const ecoOpenings = (group: string, subgroup: string): Opening[] =>
  openings.filter((o) => o.group === group && (o.subgroup ?? '') === subgroup);

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

const ChessWorkbenchPage: NextPage = () => {
  /* ─── refs ─── */
  const boardRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Chess>(new Chess(INITIAL_FEN));

  /* ─── board state ─── */
  const [fen, setFen] = useState<string>(INITIAL_FEN);
  const [boardMode, setBoardMode] = useState<BoardMode>('explore');
  const [thinking, setThinking] = useState(false);

  /* ─── chess960 ─── */
  const [positionId, setPositionId] = useState<number>(INITIAL_ID);

  /* ─── side panel ─── */
  const [panel, setPanel] = useState<SidePanel>('position');

  /* ─── PGN / GIF ─── */
  const [pgn, setPgn] = useState<string>('');
  const [gifLoading, setGifLoading] = useState(false);

  /* ─── engine ─── */
  const { analyze, bestMove, evaluation } = useStockfish();

  /* ─── ECO explorer state ─── */
  const [ecoGroup, setEcoGroup] = useState<string>(ecoGroups[0] ?? '');
  const [ecoSubgroup, setEcoSubgroup] = useState<string>(
    ecoSubgroups(ecoGroups[0] ?? '')[0] ?? ''
  );
  const [ecoIndex, setEcoIndex] = useState<number>(0); // index within filtered list
  const [ecoCursor, setEcoCursor] = useState<number>(0); // move cursor (0 = start)

  const ecoList = ecoOpenings(ecoGroup, ecoSubgroup);
  const ecoOpening: Opening | undefined = ecoList[ecoIndex];
  const ecoMoves = ecoOpening ? getMoves(ecoOpening.pgn) : [];
  const ecoTotal = ecoMoves.length;

  // FEN at current cursor inside the ECO explorer
  const ecoFenAtCursor = (): string => {
    const g = new Chess();
    for (let i = 0; i < ecoCursor; i++) {
      try {
        g.move(ecoMoves[i]!);
      } catch {
        break;
      }
    }
    return g.fen();
  };

  // When the selected opening or group changes, reset cursor
  useEffect(() => {
    setEcoCursor(0);
  }, [ecoOpening?.pgn]);

  // When the main board is in openings panel and ECO explorer is active,
  // update the left board to mirror the ECO position
  useEffect(() => {
    if (panel !== 'openings') return;
    const ecoPenFen = ecoFenAtCursor();
    setFen(ecoPenFen);
  }, [ecoCursor, ecoOpening?.pgn, panel]);

  // Reset board when leaving openings panel
  useEffect(() => {
    if (panel !== 'openings') {
      syncGame(gameRef.current); // restore workbench FEN
    }
  }, [panel]);

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
      /* ignore */
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
    if (panel === 'openings') return false; // board is read-only in ECO mode

    const game = gameRef.current;
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
    if (panel === 'openings') return false;
    if (boardMode === 'play') return piece.pieceType.startsWith('w');
    return true;
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
    syncGame(build960(positionId));
    setBoardMode(next);
  };

  /* ══════════════════════════════════════════
     EVAL
  ══════════════════════════════════════════ */

  const whiteEval =
    evaluation !== null && boardMode === 'play' ? evaluation : null;

  const evalPercent =
    whiteEval === null
      ? 50
      : 50 + Math.max(-1000, Math.min(1000, whiteEval)) / 20;

  const evalLabel = whiteEval === null ? '0.0' : (whiteEval / 100).toFixed(1);

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

  const exportPNG = () => download({ ref: boardRef, output: 'chess-position' });

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
     ECO EXPLORER HANDLERS
  ══════════════════════════════════════════ */

  const handleEcoGroupChange = (g: string) => {
    setEcoGroup(g);
    const subs = ecoSubgroups(g);
    const sub = subs[0] ?? '';
    setEcoSubgroup(sub);
    setEcoIndex(0);
    setEcoCursor(0);
  };

  const handleEcoSubgroupChange = (s: string) => {
    setEcoSubgroup(s);
    setEcoIndex(0);
    setEcoCursor(0);
  };

  const handleEcoOpeningChange = (i: number) => {
    setEcoIndex(i);
    setEcoCursor(0);
  };

  const ecoPrev = () => setEcoCursor((c) => Math.max(0, c - 1));
  const ecoNext = () => setEcoCursor((c) => Math.min(ecoTotal, c + 1));
  const ecoStart = () => setEcoCursor(0);
  const ecoEnd = () => setEcoCursor(ecoTotal);

  /* ══════════════════════════════════════════
     UI
  ══════════════════════════════════════════ */

  // In openings mode the board shows the ECO position (read-only)
  const displayFen = panel === 'openings' ? ecoFenAtCursor() : fen;

  return (
    <div className="bg-base-200 flex min-h-screen w-screen items-start justify-center p-4 py-8 md:p-8">
      <div className="flex w-full max-w-4xl flex-col gap-6 lg:flex-row lg:items-start">
        {/* ══ LEFT: Board ══ */}
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
                title="Reset"
                onClick={resetToStart}>
                <PiArrowCounterClockwise />
              </button>
            </div>
          </div>

          {/* Board mode tabs — hidden in openings panel */}
          {panel !== 'openings' && (
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
          )}

          {/* Openings mode label */}
          {panel === 'openings' && ecoOpening && (
            <div className="bg-base-100 rounded-lg px-4 py-2">
              <p className="text-base-content/40 text-[10px] font-semibold tracking-widest uppercase">
                {ecoOpening.eco}
              </p>
              <p className="truncate font-bold">{ecoOpening.name}</p>
            </div>
          )}

          {/* Board + vertical eval bar */}
          <div className="flex items-stretch gap-2">
            <div
              ref={boardRef}
              className="border-base-content/20 flex-1 overflow-hidden rounded border">
              <Chessboard
                allowDragging={panel !== 'openings'}
                position={displayFen}
                onPieceDrop={onPieceDrop}
                canDragPiece={canDragPiece}
              />
            </div>

            {/* Eval bar — only in play mode */}
            <div
              className={`border-base-content/20 bg-base-100 relative w-6 overflow-hidden rounded border transition-opacity duration-300 ${
                boardMode === 'play' && panel !== 'openings'
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

          {/* Move stepper — shown in openings panel */}
          {panel === 'openings' && ecoTotal > 0 && (
            <div className="flex flex-col gap-2">
              {/* Progress bar */}
              <div className="bg-base-300 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-200"
                  style={{ width: `${(ecoCursor / ecoTotal) * 100}%` }}
                />
              </div>

              {/* Move list — token pills */}
              <div className="flex flex-wrap gap-1">
                {ecoMoves.map((move, i) => {
                  const moveNum = Math.floor(i / 2) + 1;
                  const isWhite = i % 2 === 0;
                  const isActive = i + 1 === ecoCursor;
                  const isPast = i + 1 <= ecoCursor;
                  return (
                    <button
                      key={i}
                      onClick={() => setEcoCursor(i + 1)}
                      className={`rounded px-1.5 py-0.5 font-mono text-xs transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-content font-bold'
                          : isPast
                            ? 'bg-base-content/10 text-base-content/70'
                            : 'text-base-content/30 hover:text-base-content/60'
                      }`}>
                      {isWhite && (
                        <span className="text-base-content/30 mr-0.5">
                          {moveNum}.
                        </span>
                      )}
                      {move}
                    </button>
                  );
                })}
              </div>

              {/* Step controls */}
              <div className="flex items-center justify-between">
                <span className="text-base-content/40 font-mono text-xs">
                  {ecoCursor}/{ecoTotal}
                </span>
                <div className="flex gap-1">
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={ecoStart}
                    disabled={ecoCursor === 0}>
                    <PiSkipBack size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={ecoPrev}
                    disabled={ecoCursor === 0}>
                    <PiArrowLeft size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={ecoNext}
                    disabled={ecoCursor >= ecoTotal}>
                    <PiArrowRight size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={ecoEnd}
                    disabled={ecoCursor >= ecoTotal}>
                    <PiSkipForward size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          {statusLabel && panel !== 'openings' && (
            <p className="text-base-content/60 text-center text-sm">
              {statusLabel}
            </p>
          )}
        </div>

        {/* ══ RIGHT: Side panel ══ */}
        <div className="flex w-full flex-col gap-4 lg:w-72">
          {/* 4-tab switcher */}
          <div className="grid grid-cols-4 gap-1">
            {(
              [
                { key: 'position', label: 'Position' },
                { key: 'engine', label: 'Engine' },
                { key: 'export', label: 'Export' },
                { key: 'openings', label: 'Openings' },
              ] as { key: SidePanel; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                className={`btn btn-xs ${panel === key ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPanel(key)}>
                {label}
              </button>
            ))}
          </div>

          {/* ── POSITION ── */}
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

          {/* ── ENGINE ── */}
          {panel === 'engine' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-base-content/60 text-xs font-semibold tracking-widest uppercase">
                  Stockfish 18
                </span>
                <span
                  className={`badge badge-sm ${boardMode === 'play' ? 'badge-success' : 'badge-ghost'}`}>
                  {boardMode === 'play' ? 'Active' : 'Off'}
                </span>
              </div>

              <div className="bg-base-100 flex flex-col items-center gap-1 rounded-xl p-4">
                <span className="text-base-content/40 text-xs">Evaluation</span>
                <span className="font-mono text-3xl font-black">
                  {boardMode === 'play' && whiteEval !== null
                    ? (whiteEval > 0 ? '+' : '') + (whiteEval / 100).toFixed(2)
                    : '—'}
                </span>

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

              <button
                className={`btn btn-sm w-full ${boardMode === 'play' ? 'btn-error' : 'btn-primary'}`}
                onClick={() =>
                  switchBoardMode(boardMode === 'play' ? 'explore' : 'play')
                }>
                <PiRobot />
                {boardMode === 'play' ? 'Stop Engine' : 'Start Engine'}
              </button>

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

          {/* ── EXPORT ── */}
          {panel === 'export' && (
            <div className="flex flex-col gap-3">
              <span className="text-base-content/60 text-xs font-semibold tracking-widest uppercase">
                Export
              </span>

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

          {/* ── ECO EXPLORER ── */}
          {panel === 'openings' && (
            <div className="flex flex-col gap-3">
              {/* Group */}
              <div>
                <label className="text-base-content/60 mb-1 block text-xs font-semibold tracking-widest uppercase">
                  Group
                </label>
                <select
                  className="select select-bordered select-sm w-full"
                  value={ecoGroup}
                  onChange={(e) => handleEcoGroupChange(e.target.value)}>
                  {ecoGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subgroup */}
              <div>
                <label className="text-base-content/60 mb-1 block text-xs font-semibold tracking-widest uppercase">
                  Variation
                </label>
                <select
                  className="select select-bordered select-sm w-full"
                  value={ecoSubgroup}
                  onChange={(e) => handleEcoSubgroupChange(e.target.value)}>
                  {ecoSubgroups(ecoGroup).map((s) => (
                    <option key={s} value={s}>
                      {s || '(main line)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opening list */}
              <div>
                <label className="text-base-content/60 mb-1 block text-xs font-semibold tracking-widest uppercase">
                  Line ({ecoList.length})
                </label>
                <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
                  {ecoList.map((o, i) => (
                    <button
                      key={`${o.eco}-${i}`}
                      onClick={() => handleEcoOpeningChange(i)}
                      className={`flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                        i === ecoIndex
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-base-content/5'
                      }`}>
                      <span className="bg-base-300 mt-0.5 shrink-0 rounded px-1 font-mono text-[10px]">
                        {o.eco}
                      </span>
                      <span className="truncate text-xs">{o.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected opening PGN */}
              {ecoOpening && (
                <div className="bg-base-100 rounded-lg p-3">
                  <p className="text-primary font-mono text-[10px] leading-relaxed">
                    {ecoOpening.pgn}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChessWorkbenchPage;
