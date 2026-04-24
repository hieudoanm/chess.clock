import {
  calculatePerformance,
  calculateRating,
  Score,
  TimeClass,
} from '@chess/elo';
import type { NextPage } from 'next';
import { useState } from 'react';

/* ---------------- Shared Luxury Glass ---------------- */

const glassCard = `
card w-full max-w-md
border border-base-content/10
bg-gradient-to-br
from-base-100/15
via-base-100/5
to-transparent
backdrop-blur-xl
shadow-2xl shadow-black/40
hover:shadow-black/60
transition-shadow
`;

const glassInner = 'card-body divide-y divide-base-content/10';

const glassInput =
  'input input-bordered w-full bg-base-100/10 backdrop-blur focus:bg-base-100/20';

const glassSelect =
  'select select-bordered bg-base-100/10 backdrop-blur focus:bg-base-100/20';

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

/* ---------------- Rating Component ---------------- */

type Formula = {
  ratingPlayer: number;
  ratingOpponent: number;
  ratingNew: number;
  score: Score;
  timeClass: TimeClass;
  lessThan30Games: boolean;
  overRating2400: boolean;
  overAge18: boolean;
};

const RatingTab = () => {
  const [formula, setFormula] = useState<Formula>({
    ratingPlayer: 1000,
    ratingOpponent: 1000,
    ratingNew: 1000,
    score: Score.DRAW,
    timeClass: TimeClass.CLASSICAL,
    lessThan30Games: false,
    overRating2400: false,
    overAge18: true,
  });

  return (
    <div className={glassCard}>
      <div className={glassInner}>
        {/* Player Rating */}
        <div className="flex items-center gap-2 px-4 py-2">
          <label
            htmlFor="your-rating"
            className="text-base-content/80 w-xs text-sm font-bold">
            Your Rating
          </label>
          <input
            id="your-rating"
            type="number"
            className={`${glassInput} text-right`}
            value={formula.ratingPlayer}
            onChange={(e) =>
              setFormula({
                ...formula,
                ratingPlayer: Number.parseInt(e.target.value, 10),
              })
            }
          />
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2 px-4 py-2">
          <label
            htmlFor="opponent-rating"
            className="text-base-content/80 w-xs text-sm font-bold">
            Opponent Rating
          </label>
          <input
            id="opponent-rating"
            type="number"
            className={`${glassInput} text-right`}
            value={formula.ratingOpponent}
            onChange={(e) =>
              setFormula({
                ...formula,
                ratingOpponent: Number.parseInt(e.target.value, 10),
              })
            }
          />
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 px-4 py-2">
          <label
            htmlFor="score"
            className="text-base-content/80 w-xs text-sm font-bold">
            Score
          </label>
          <select
            id="score"
            className={`${glassSelect} w-full text-right`}
            value={formula.score}
            onChange={(e) =>
              setFormula({
                ...formula,
                score: Number.parseFloat(e.target.value) as Score,
              })
            }>
            <option value={Score.WIN}>Win</option>
            <option value={Score.DRAW}>Draw</option>
            <option value={Score.LOSS}>Loss</option>
          </select>
        </div>

        {/* Calculate */}
        <div className="p-4">
          <button
            className={glassBtn}
            onClick={() => {
              const ratingNew = calculateRating(formula);
              setFormula((p) => ({ ...p, ratingNew }));
            }}>
            Calculate Rating
          </button>
        </div>

        {/* Result */}
        <div className="flex items-center gap-2 px-4 py-2">
          <label
            htmlFor="new-rating"
            className="text-base-content/80 w-xs text-sm font-bold">
            New Rating
          </label>
          <input
            id="new-rating"
            type="number"
            className="input input-bordered from-base-100/20 via-base-100/10 w-full bg-gradient-to-br to-transparent text-right font-bold backdrop-blur"
            value={formula.ratingNew}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

/* ---------------- Performance Tab ---------------- */

type GameRow = {
  ratingOpponent: number;
  score: Score;
};

const PerformanceTab = () => {
  const [games, setGames] = useState<GameRow[]>([
    { ratingOpponent: 1800, score: Score.WIN },
  ]);

  const [performance, setPerformance] = useState<number>(0);

  const updateGame = (index: number, field: keyof GameRow, value: any) => {
    const copy = [...games];
    copy[index] = { ...copy[index], [field]: value };
    setGames(copy);
  };

  return (
    <div className={glassCard}>
      <div className="card-body gap-4">
        {games.map((g, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="number"
              className={glassInput}
              value={g.ratingOpponent}
              onChange={(e) =>
                updateGame(
                  i,
                  'ratingOpponent',
                  Number.parseInt(e.target.value, 10)
                )
              }
            />

            <select
              className={glassSelect}
              value={g.score}
              onChange={(e) =>
                updateGame(i, 'score', Number.parseFloat(e.target.value))
              }>
              <option value={Score.WIN}>Win</option>
              <option value={Score.DRAW}>Draw</option>
              <option value={Score.LOSS}>Loss</option>
            </select>
          </div>
        ))}

        <button
          className="btn btn-outline btn-sm border-base-content/20 bg-base-100/10 hover:bg-base-100/20 backdrop-blur"
          onClick={() =>
            setGames([...games, { ratingOpponent: 1800, score: Score.DRAW }])
          }>
          Add Game
        </button>

        <button
          className={glassBtn}
          onClick={() => setPerformance(calculatePerformance({ games }))}>
          Calculate Performance
        </button>

        <input
          type="number"
          className="input input-bordered from-base-100/20 via-base-100/10 bg-gradient-to-br to-transparent text-center font-bold backdrop-blur"
          value={performance}
          readOnly
        />
      </div>
    </div>
  );
};

/* ---------------- Page ---------------- */

const AppPage: NextPage = () => {
  const [tab, setTab] = useState<'rating' | 'performance'>('rating');

  const tabBase = `
	relative overflow-hidden
	rounded-full px-6 py-2
	text-base-content/70
	transition-all duration-300
	hover:text-base-content
	`;

  const tabActive = `
	bg-gradient-to-br from-base-100/30 via-base-100/10 to-transparent
	text-base-content
	shadow-inner shadow-base-content/10
	`;

  return (
    <div className="from-base-300 via-base-200 to-base-300 flex min-h-screen w-screen flex-col items-center justify-center gap-8 bg-gradient-to-br p-8">
      {/* Floating Luxury Glass Tabs */}
      <div className="border-base-content/10 from-base-100/10 via-base-100/5 relative flex gap-2 rounded-full border bg-gradient-to-br to-transparent p-1 shadow-lg shadow-black/40 backdrop-blur-xl">
        {/* Rating */}
        <button
          className={`${tabBase} ${tab === 'rating' ? tabActive : ''}`}
          onClick={() => setTab('rating')}>
          <span className="relative z-10">Rating</span>

          {tab === 'rating' && (
            <span className="via-base-content/20 pointer-events-none absolute inset-0 -translate-x-full animate-[shine_2.5s_linear_infinite] bg-gradient-to-r from-transparent to-transparent" />
          )}
        </button>

        {/* Performance */}
        <button
          className={`${tabBase} ${tab === 'performance' ? tabActive : ''}`}
          onClick={() => setTab('performance')}>
          <span className="relative z-10">Performance</span>

          {tab === 'performance' && (
            <span className="via-base-content/20 pointer-events-none absolute inset-0 -translate-x-full animate-[shine_2.5s_linear_infinite] bg-gradient-to-r from-transparent to-transparent" />
          )}
        </button>
      </div>

      {/* Content */}
      {tab === 'rating' && <RatingTab />}
      {tab === 'performance' && <PerformanceTab />}

      {/* Shine Keyframes */}
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

export default AppPage;
