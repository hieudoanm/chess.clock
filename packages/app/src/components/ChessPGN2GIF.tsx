import { Chessboard } from '@chess/components/ChessBoard';
import { INITIAL_FEN, INITIAL_GAME } from '@chess/constants/app';
import { getHeaders, getMoves, simplifyPGN } from '@chess/utils/chess/pgn';
import { Chess } from 'chess.js';
import GIF from 'gif.js';
import html2canvas from 'html2canvas-pro';
import { useRef, useState } from 'react';
import { DraggingPieceDataType } from 'react-chessboard';
import { PiArrowCounterClockwise } from 'react-icons/pi';

/* ---------------- Glass Styles ---------------- */

const glassTextarea = `
textarea textarea-bordered w-full
bg-base-100/10
backdrop-blur-xl
border border-base-content/10
focus:bg-base-100/20
focus:border-primary/40
transition-all duration-200
`;

const glassBtn = `
btn w-full
bg-primary
text-primary-content
border border-primary/40
shadow-lg shadow-primary/30
hover:bg-primary-focus
hover:shadow-primary/40
active:scale-[0.98]
transition-all duration-200
`;

const glassBtnGhost = `
btn
bg-base-100/10
border border-base-content/10
backdrop-blur-xl
hover:bg-base-100/20
transition-all duration-200
`;

const glassBoard = `
aspect-square w-full overflow-hidden
rounded-2xl
border border-base-content/10
bg-gradient-to-br
from-base-100/10 via-base-100/5 to-transparent
backdrop-blur-xl
shadow-2xl shadow-black/40
`;

/* ---------------- GIF downloader ---------------- */

const downloadGIF = ({
  base64s,
  pgn,
}: {
  base64s: string[];
  pgn: string;
}): Promise<void> => {
  return new Promise((resolve) => {
    const gif = new GIF({
      workers: 1,
      quality: 10,
      workerScript: '/workers/gif.worker.js',
    });

    let loadedImages = 0;

    base64s.forEach((base64) => {
      const img = new Image();
      img.src = base64;

      img.onload = () => {
        gif.addFrame(img, { delay: 500 });
        loadedImages++;

        if (loadedImages === base64s.length) {
          gif.render();
        }
      };
    });

    gif.on('finished', (blob: any) => {
      const gifURL = URL.createObjectURL(blob);

      const headers = getHeaders(pgn);
      const name =
        `${headers['White'] ?? ''} vs ${headers['Black'] ?? ''}`.trim();

      const link = document.createElement('a');
      link.href = gifURL;
      link.download = `${name}.gif`;
      link.click();
      link.remove();

      resolve();
    });

    gif.on('abort', () => resolve());
  });
};

/* ---------------- Component ---------------- */

type State = {
  game: Chess;
  gamePGN: string;
  loading: boolean;
};

export const ChessPGN2GIF = () => {
  const divRef = useRef<HTMLDivElement | null>(null);

  const [{ game, gamePGN, loading }, setState] = useState<State>({
    game: INITIAL_GAME,
    gamePGN: simplifyPGN(INITIAL_GAME.pgn()),
    loading: false,
  });

  /* ---------------- Reset ---------------- */

  const reset = () => {
    const newGame = new Chess(INITIAL_FEN);

    setState((prev) => ({
      ...prev,
      game: newGame,
      gamePGN: simplifyPGN(newGame.pgn()),
    }));
  };

  /* ---------------- Moves ---------------- */

  const makeMove = (move: { from: string; to: string; promotion: string }) => {
    try {
      const result = game.move(move);

      if (result !== null) {
        setState((prev) => ({
          ...prev,
          game,
          gamePGN: simplifyPGN(game.pgn()),
        }));
      }

      return result;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const onPieceDrop = ({
    sourceSquare,
    targetSquare,
  }: {
    piece: DraggingPieceDataType;
    sourceSquare: string;
    targetSquare: string | null;
  }) => {
    const move = makeMove({
      from: sourceSquare,
      to: targetSquare!,
      promotion: 'q',
    });

    if (move === null) return false;
    return true;
  };

  /* ---------------- PGN change ---------------- */

  const onPGNChange = (pgn: string) => {
    try {
      const newGame = new Chess();
      newGame.loadPgn(pgn);

      setState((prev) => ({
        ...prev,
        game: newGame,
        gamePGN: newGame.pgn(),
      }));
    } catch {
      // ignore invalid PGN
    }
  };

  /* ---------------- Export GIF ---------------- */

  const exportGIF = async () => {
    setState((prev) => ({ ...prev, loading: true }));

    if (gamePGN === '') {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    const moves = getMoves(gamePGN);
    const tempGame = new Chess();

    setState((prev) => ({ ...prev, game: tempGame }));

    const base64s: string[] = [];

    for (const move of moves) {
      tempGame.move(move);

      setState((prev) => ({
        ...prev,
        game: new Chess(tempGame.fen()),
      }));

      if (divRef.current) {
        const canvas = await html2canvas(divRef.current);
        base64s.push(canvas.toDataURL('image/png'));
      }
    }

    await downloadGIF({ base64s, pgn: gamePGN });

    setState((prev) => ({ ...prev, loading: false }));
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="flex w-full max-w-md flex-col gap-y-4 md:gap-y-6">
      <h3 className="text-center text-2xl font-black md:text-3xl">PGN → GIF</h3>

      {/* PGN Input */}
      <textarea
        rows={5}
        name="pgn"
        placeholder="Paste PGN…"
        value={gamePGN}
        className={glassTextarea}
        onChange={(e) => onPGNChange(e.target.value)}
      />

      {/* Reset */}
      {gamePGN !== '' && (
        <button type="button" className={glassBtnGhost} onClick={reset}>
          <PiArrowCounterClockwise className="text-lg" />
        </button>
      )}

      {/* Board */}
      <div id="board" ref={divRef} className={glassBoard}>
        <Chessboard
          allowDragging
          canDragPiece={() => true}
          position={game.fen()}
          onPieceDrop={onPieceDrop}
        />
      </div>

      {/* Export */}
      <button
        type="button"
        disabled={loading}
        className={glassBtn}
        onClick={exportGIF}>
        {loading ? 'Rendering GIF…' : 'Download GIF'}
      </button>
    </div>
  );
};
