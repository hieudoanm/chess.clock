import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';

const APPS = [
  {
    id: 'chess-board',
    href: '/app/board',
    title: 'Board',
    subtitle: 'Analysis Engine',
    description:
      'Analyze positions with a powerful engine. Get best moves, evaluations, and deep search insights instantly.',
    meta: 'Eval · Best Moves · Depth',
    symbol: '♚', // King → ultimate authority / decision
    symbolClass: 'text-[4.5rem] font-serif font-bold leading-none',
  },
  {
    id: 'chess-clock',
    href: '/app/clock',
    title: 'Chess Clock',
    subtitle: 'Time Control',
    description:
      'Manage game time with precision. Supports blitz, rapid, and custom time controls with increment and delay.',
    meta: 'Blitz · Rapid · Classical',
    symbol: '♟', // Pawn → tempo / progression
    symbolClass: 'text-[4.5rem] font-serif font-bold leading-none',
  },
  {
    id: 'chess-elo',
    href: '/app/elo',
    title: 'Elo Calculator',
    subtitle: 'Rating System',
    description:
      'Estimate rating changes based on match results. Input player ratings and outcomes to calculate Elo adjustments.',
    meta: 'FIDE · Expected Score · K-Factor',
    symbol: '♜', // Rook → structure / rating foundation
    symbolClass: 'text-[4.5rem] font-serif font-bold leading-none',
  },
  {
    id: 'chess-stats',
    href: '/app/stats',
    title: 'Chess Stats',
    subtitle: 'Personal Insights',
    description:
      'Get insights about your chess games. See your strengths and weaknesses.',
    meta: 'Stats · Insights · Analysis',
    symbol: '♝',
    symbolClass: 'text-[4.5rem] font-serif font-bold leading-none',
  },
];

const AppPage: NextPage = () => {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      data-theme="luxury"
      className="bg-base-100 relative flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden pt-16 pb-14">
      {/* Vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* Top gold rule */}
      <div className="via-primary fixed top-0 right-0 left-0 z-10 h-[3px] bg-gradient-to-r from-transparent to-transparent" />

      {/* Header */}
      <div className="relative z-10 mb-16 flex flex-col items-center gap-3 text-center">
        <span className="text-primary/40 text-[0.55rem] tracking-[0.5em] uppercase">
          Chess Toolkit
        </span>
        <h1 className="text-base-content font-serif text-4xl font-bold tracking-wide">
          Chess Apps
        </h1>
        <div className="mt-1 flex items-center gap-3">
          <div className="bg-primary/30 h-px w-12" />
          <div className="bg-primary h-1 w-1 rounded-full" />
          <div className="bg-primary/30 h-px w-12" />
        </div>
        <p className="text-base-content/40 mt-1 text-[0.65rem] tracking-[0.2em] uppercase">
          Select a tool to begin
        </p>
      </div>

      {/* Cards */}
      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-px px-6 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((app, i) => {
          const isHovered = hovered === app.id;
          return (
            <button
              key={app.id}
              onClick={() => router.push(app.href)}
              onMouseEnter={() => setHovered(app.id)}
              onMouseLeave={() => setHovered(null)}
              className={[
                'group relative flex flex-col items-center justify-between gap-8',
                'w-full cursor-pointer px-8 py-10 text-center',
                'border-primary/10 border transition-all duration-500',
                'focus-visible:ring-primary outline-none focus-visible:ring-1',
                isHovered
                  ? 'bg-primary/[0.06] border-primary/30'
                  : 'bg-base-100/40 hover:bg-primary/[0.04]',
                i === 0 ? 'sm:rounded-l-none' : '',
                i === APPS.length - 1 ? 'sm:rounded-r-none' : '',
              ].join(' ')}>
              {/* Number */}
              <span className="text-primary/20 self-start text-[0.5rem] tracking-[0.4em] uppercase">
                0{i + 1}
              </span>

              {/* Symbol */}
              <div
                className={[
                  'text-base-content transition-all duration-500',
                  isHovered
                    ? 'text-primary scale-110 opacity-90'
                    : 'opacity-25',
                ].join(' ')}>
                <span className={app.symbolClass}>{app.symbol}</span>
              </div>

              {/* Text */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-col items-center gap-0.5">
                  <h2 className="text-base-content font-serif text-lg font-bold tracking-wider">
                    {app.title}
                  </h2>
                  <span className="text-primary/60 text-[0.6rem] tracking-[0.3em] uppercase">
                    {app.subtitle}
                  </span>
                </div>

                <div className="bg-primary/15 my-1 h-px w-8" />

                <p className="text-base-content/40 max-w-[180px] text-[0.65rem] leading-relaxed tracking-wide">
                  {app.description}
                </p>

                <span className="text-primary/30 mt-1 text-[0.55rem] tracking-[0.2em] uppercase">
                  {app.meta}
                </span>
              </div>

              {/* CTA */}
              <div
                className={[
                  'flex items-center gap-2 transition-all duration-300',
                  isHovered
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-1 opacity-0',
                ].join(' ')}>
                <span className="text-primary text-[0.6rem] tracking-[0.3em] uppercase">
                  Begin
                </span>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 8h8M8 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  />
                </svg>
              </div>

              {/* Hover border glow bottom */}
              <div
                className={[
                  'via-primary absolute right-0 bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent to-transparent transition-all duration-500',
                  isHovered ? 'opacity-100' : 'opacity-0',
                ].join(' ')}
              />
            </button>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="relative z-10 mt-12 text-center">
        <p className="text-base-content/20 text-[0.5rem] tracking-[0.25em] uppercase">
          Control time · Calculate rating · Study openings · Explore positions ·
          Analyze with engine · Generate visuals
        </p>
      </div>

      {/* Bottom gold rule */}
      <div className="via-primary fixed right-0 bottom-0 left-0 z-10 h-[3px] bg-gradient-to-r from-transparent to-transparent" />
    </div>
  );
};

export default AppPage;
