import { useEffect, useRef, useState } from 'react';

const NODE_ENV = process.env.NODE_ENV ?? 'development';

export const useStockfish = () => {
  const workerRef = useRef<Worker | null>(null);
  // Track the side to move of the FEN most recently sent to the engine.
  // Stockfish's `score cp` is always from that side's POV; we normalise to
  // White's POV immediately so every consumer gets a consistent value:
  //   positive  = White is better
  //   negative  = Black is better
  const sideToMoveRef = useRef<'w' | 'b'>('w');

  const [bestMove, setBestMove] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<number | null>(null);

  useEffect(() => {
    const scriptURL =
      NODE_ENV === 'development'
        ? '/workers/stockfish-18-lite-single.js'
        : '/chess/workers/stockfish-18-lite-single.js';

    workerRef.current = new Worker(scriptURL);
    const worker = workerRef.current;

    worker.onmessage = (e: MessageEvent) => {
      const line: string = e.data;

      // Best move
      if (line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        setBestMove(move);
      }

      // Eval score — normalise to White's POV
      if (line.includes('score cp')) {
        const match = line.match(/score cp (-?\d+)/);
        if (match) {
          const cp = parseInt(match[1], 10);
          // Stockfish reports from the side-to-move's perspective.
          // If Black was to move, flip the sign so positive always means White ahead.
          const whiteCP = sideToMoveRef.current === 'b' ? -cp : cp;
          setEvaluation(whiteCP);
        }
      }
    };

    // Init UCI
    worker.postMessage('uci');
    worker.postMessage('isready');

    return () => {
      worker.terminate();
    };
  }, []);

  const analyze = (fen: string, depth = 15) => {
    if (!workerRef.current) return;

    // Extract side to move from FEN (field 2: 'w' or 'b')
    const fenSideToMove = fen.split(' ')[1] as 'w' | 'b';
    sideToMoveRef.current = fenSideToMove ?? 'w';

    workerRef.current.postMessage('stop');
    workerRef.current.postMessage('ucinewgame');
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go depth ${depth}`);
  };

  return { analyze, bestMove, evaluation };
};
