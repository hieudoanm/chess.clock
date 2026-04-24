import { Chessboard } from '@chess.clock/components/ChessBoard';
import { INITIAL_GAME, INITIAL_ID } from '@chess.clock/constants/app';
import chess960 from '@chess.clock/json/chess960.json';
import { chess960BackRankToInitialFEN } from '@chess.clock/utils/chess/fen';
import { addZero, range } from '@chess.clock/utils/number';
import { Chess } from 'chess.js';
import { NextPage } from 'next';
import { ChangeEvent, useRef, useState } from 'react';
import { PiShuffle } from 'react-icons/pi';

const Chess960Page: NextPage = () => {
  const divRef = useRef<HTMLDivElement | null>(null);

  const [{ id = INITIAL_ID, game = INITIAL_GAME }, setState] = useState<{
    id: number;
    game: Chess;
  }>({
    id: INITIAL_ID,
    game: INITIAL_GAME,
  });

  const randomize = () => {
    const randomId = Math.floor(Math.random() * 960);
    const position: string = chess960[randomId];
    const fen = chess960BackRankToInitialFEN(position);
    const game = new Chess(fen);
    setState((previous) => ({
      ...previous,
      id: randomId,
      game,
    }));
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center p-8">
      <div className="flex w-full max-w-md flex-col gap-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-center text-2xl font-black md:text-3xl">
            <span>Chess</span>
            <select
              id="id"
              name="id"
              value={id}
              className="appearance-none"
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                const newId: number =
                  Number.parseInt(event.target.value, 10) ?? 0;
                const newPosition: string = chess960.at(newId) ?? '';
                const newFEN = chess960BackRankToInitialFEN(newPosition);
                const newGame = new Chess(newFEN);
                setState((previous) => ({
                  ...previous,
                  id: newId,
                  game: newGame,
                }));
              }}>
              {range(0, 959).map((positionIndex: number) => {
                return (
                  <option key={positionIndex} value={positionIndex}>
                    {addZero(positionIndex, 3)}
                  </option>
                );
              })}
            </select>
          </h3>
          <button type="button" className="btn" onClick={randomize}>
            <PiShuffle />
          </button>
        </div>
        <div
          id="board"
          ref={divRef}
          className="aspect-square w-full overflow-hidden border border-neutral-800">
          <Chessboard
            allowDragging
            canDragPiece={() => false}
            position={game.fen()}
          />
        </div>
      </div>
    </div>
  );
};

export default Chess960Page;
