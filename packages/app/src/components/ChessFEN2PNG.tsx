import { Chessboard } from '@chess/components/ChessBoard';
import { INITIAL_GAME } from '@chess/constants/app';
import { download } from '@chess/utils/canvas';
import { Chess } from 'chess.js';
import { useRef, useState } from 'react';
import { DraggingPieceDataType } from 'react-chessboard';

/* ---------------- Glass Styles ---------------- */

const glassInput = `
input input-bordered w-full
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

const glassBoard = `
aspect-square w-full overflow-hidden
rounded-2xl
border border-base-content/10
bg-gradient-to-br
from-base-100/10 via-base-100/5 to-transparent
backdrop-blur-xl
shadow-2xl shadow-black/40
`;

/* ---------------- Types ---------------- */

type State = {
  game: Chess;
  loading: boolean;
};

/* ---------------- Component ---------------- */

export const ChessFEN2PNG = () => {
  const divRef = useRef<HTMLDivElement | null>(null);

  const [{ game, loading }, setState] = useState<State>({
    game: INITIAL_GAME,
    loading: false,
  });

  /* ---------------- Moves ---------------- */

  const makeMove = (move: { from: string; to: string; promotion: string }) => {
    try {
      const result = game.move(move);

      if (result !== null) {
        setState((prev) => ({
          ...prev,
          game,
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

  /* ---------------- FEN change ---------------- */

  const onFENChange = (fen: string) => {
    try {
      const newGame = new Chess(fen);

      setState((prev) => ({
        ...prev,
        game: newGame,
      }));
    } catch {
      // invalid FEN → ignore
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="flex w-full max-w-md flex-col gap-y-4 md:gap-y-6">
      <h3 className="text-center text-2xl font-black md:text-3xl">FEN → PNG</h3>

      {/* FEN Input */}
      <input
        type="text"
        name="fen"
        placeholder="Paste FEN string..."
        className={glassInput}
        value={game.fen()}
        onChange={(e) => onFENChange(e.target.value)}
      />

      {/* Board */}
      <div id="board" ref={divRef} className={glassBoard}>
        <Chessboard
          allowDragging
          canDragPiece={() => true}
          position={game.fen()}
          onPieceDrop={onPieceDrop}
        />
      </div>

      {/* Download */}
      <button
        type="button"
        className={glassBtn}
        disabled={loading}
        onClick={() => {
          download({
            ref: divRef,
            output: 'fen',
          });
        }}>
        Download PNG
      </button>
    </div>
  );
};
