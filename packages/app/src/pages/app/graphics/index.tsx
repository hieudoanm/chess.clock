import { ChessFEN2PNG } from '@chess/components/ChessFEN2PNG';
import { ChessPGN2GIF } from '@chess/components/ChessPGN2GIF';
import type { NextPage } from 'next';
import { useState } from 'react';

/* ---------------- Shared Luxury Glass ---------------- */

const glassWrapper = `
flex w-full max-w-md flex-col
gap-y-4 p-4
md:gap-y-8 md:p-8
`;

const tabContainer = `
border border-base-content/10
from-base-100/10 via-base-100/5 to-transparent
relative flex gap-2 rounded-full
bg-gradient-to-br p-1
shadow-lg shadow-black/40
backdrop-blur-xl
`;

const tabBase = `
relative overflow-hidden
rounded-full px-6 py-2
text-base-content/70
transition-all duration-300
hover:text-base-content
`;

const tabActive = `
bg-gradient-to-br
from-base-100/30 via-base-100/10 to-transparent
text-base-content
shadow-inner shadow-base-content/10
`;

/* ---------------- Page ---------------- */

const GraphicsPage: NextPage = () => {
  const [tab, setTab] = useState<'fen' | 'pgn'>('fen');

  return (
    <div className="flex min-h-screen w-screen flex-col">
      <div className="container mx-auto flex flex-col items-center gap-6 py-6">
        {/* Tabs */}
        <div className={tabContainer}>
          {/* FEN Tab */}
          <button
            className={`${tabBase} ${tab === 'fen' ? tabActive : ''}`}
            onClick={() => setTab('fen')}>
            <span className="relative z-10">FEN → PNG</span>

            {tab === 'fen' && (
              <span className="via-base-content/20 pointer-events-none absolute inset-0 -translate-x-full animate-[shine_2.5s_linear_infinite] bg-gradient-to-r from-transparent to-transparent" />
            )}
          </button>

          {/* PGN Tab */}
          <button
            className={`${tabBase} ${tab === 'pgn' ? tabActive : ''}`}
            onClick={() => setTab('pgn')}>
            <span className="relative z-10">PGN → GIF</span>

            {tab === 'pgn' && (
              <span className="via-base-content/20 pointer-events-none absolute inset-0 -translate-x-full animate-[shine_2.5s_linear_infinite] bg-gradient-to-r from-transparent to-transparent" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="container mx-auto">
          <div className={`mx-auto ${glassWrapper}`}>
            {tab === 'fen' && <ChessFEN2PNG />}
            {tab === 'pgn' && <ChessPGN2GIF />}
          </div>
        </div>
      </div>

      {/* Shine Animation */}
      <style jsx global>{`
        @keyframes shine {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(220%);
          }
        }
      `}</style>
    </div>
  );
};

export default GraphicsPage;
