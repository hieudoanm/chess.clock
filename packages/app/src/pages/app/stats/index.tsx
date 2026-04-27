'use client';

import analysis from '@chess/json/analysis.json';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { NextPage } from 'next';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ─── Types ────────────────────────────────────────────────────────────────────

type Analysis = {
  count: Record<string, number>;
  histogram: Record<
    string,
    {
      rapid: Record<string, number>;
      blitz: Record<string, number>;
      bullet: Record<string, number>;
    }
  >;
};

type PlayerRatings = {
  bullet: { last: number; best: number };
  blitz: { last: number; best: number };
  rapid: { last: number; best: number };
};

type Format = 'bullet' | 'blitz' | 'rapid';
type TitleKey = (typeof ALL_TITLES)[number];
type ComparisonTabKey = 'all' | TitleKey;

type PercentileResult = {
  format: 'bullet' | 'blitz' | 'rapid';
  rating: number;
  percentile: number;
  betterThan: number;
  total: number;
};

type ComparisonTab = {
  key: ComparisonTabKey;
  label: string;
  description: string;
  results: PercentileResult[];
};

type SqlJsStatic = {
  Database: new (data?: ArrayLike<number> | null) => DB;
};

type DB = {
  exec: (sql: string) => { columns: string[]; values: unknown[][] }[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const OPEN_TITLES = ['gm', 'im', 'fm', 'cm', 'nm'];
const WOMAN_TITLES = ['wgm', 'wim', 'wfm', 'wcm', 'wnm'];
const ALL_TITLES = [...OPEN_TITLES, ...WOMAN_TITLES] as const;

const COMPARISON_TABS: {
  key: ComparisonTabKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'all',
    label: 'All',
    description: 'Compared against all titled players in the database',
  },
  ...ALL_TITLES.map((title) => ({
    key: title,
    label: title.toUpperCase(),
    description: `Compared against ${title.toUpperCase()} players in the database`,
  })),
];

const SQL_JS_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js';
const SQL_WASM_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.wasm';

const COLORS: Record<string, string> = {
  gm: '#c9a84c',
  im: '#6fcfa4',
  fm: '#6fa0cf',
  cm: '#cf9f6f',
  nm: '#9f6fcf',
  wgm: '#c9a84c',
  wim: '#6fcfa4',
  wfm: '#6fa0cf',
  wcm: '#cf9f6f',
  wnm: '#9f6fcf',
};

// ─── sql.js loader ────────────────────────────────────────────────────────────

declare global {
  interface Window {
    initSqlJs?: (cfg: {
      locateFile: (f: string) => string;
    }) => Promise<SqlJsStatic>;
  }
}

function loadSqlJs(): Promise<SqlJsStatic> {
  return new Promise((resolve, reject) => {
    if (globalThis.window === undefined) return reject(new Error('No window'));

    const init = () =>
      globalThis.window.initSqlJs!({ locateFile: () => SQL_WASM_CDN }).then(
        resolve
      );

    if (globalThis.window.initSqlJs) return init();

    const existing = document.getElementById('sqljs-script');
    if (existing) {
      existing.addEventListener('load', init);
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = 'sqljs-script';
    script.src = SQL_JS_CDN;
    script.async = true;
    script.onload = init;
    script.onerror = () => reject(new Error('Failed to load sql.js from CDN'));
    document.head.appendChild(script);
  });
}

// ─── DB Hook ──────────────────────────────────────────────────────────────────

function useSQLite(dbPath: string) {
  const [db, setDb] = useState<DB | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const SQL = await loadSqlJs();
        const res = await fetch(dbPath);
        if (!res.ok) throw new Error(`Failed to fetch DB: ${res.status}`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        const instance = new SQL.Database(bytes);
        if (!cancelled) setDb(instance);
      } catch (err) {
        if (!cancelled) setDbError(err as Error);
      } finally {
        if (!cancelled) setDbLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dbPath]);

  return { db, dbLoading, dbError };
}

// ─── Percentile Calculator ────────────────────────────────────────────────────

const calcPercentile = (
  db: DB,
  format: Format,
  rating: number,
  title?: TitleKey
): PercentileResult => {
  const col = `${format}_rating_best`;
  const titleFilter = title ? ` AND title = '${title.toUpperCase()}'` : '';
  const totalRes = db.exec(
    `SELECT COUNT(*) FROM players WHERE ${col} > 0${titleFilter}`
  );
  const total = Number(totalRes[0]?.values[0]?.[0] ?? 0);
  const belowRes = db.exec(
    `SELECT COUNT(*) FROM players WHERE ${col} > 0 AND ${col} < ${rating}${titleFilter}`
  );
  const betterThan = Number(belowRes[0]?.values[0]?.[0] ?? 0);
  const percentile = total > 0 ? Math.round((betterThan / total) * 100) : 0;
  return { format, rating, percentile, betterThan, total };
};

// ─── Chart Helper ─────────────────────────────────────────────────────────────

const buildChartData = (
  histogram: Analysis['histogram'],
  timeControl: Format,
  titleKeys: string[]
) => {
  const ranges = new Set<string>();
  titleKeys.forEach((key) => {
    Object.keys(histogram[key]?.[timeControl] || {}).forEach((r) =>
      ranges.add(r)
    );
  });
  const labels = Array.from(ranges).sort(
    (a, b) => Number.parseInt(a) - Number.parseInt(b)
  );
  const datasets = titleKeys
    .filter((k) => histogram[k])
    .map((title) => ({
      label: title.toUpperCase(),
      data: labels.map((range) => histogram[title][timeControl]?.[range] || 0),
      backgroundColor: COLORS[title] || '#999',
      stack: 'stack1',
    }));
  return { labels, datasets };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="card bg-base-200 border-base-300 border">
    <div className="card-body p-5">
      <p className="text-base-content/50 text-xs tracking-wide uppercase">
        {label}
      </p>
      <p className="text-primary font-mono text-2xl font-bold">
        {value.toLocaleString()}
      </p>
    </div>
  </div>
);

const HistogramBar = ({
  histogram,
  title,
  timeControl,
  titleKeys,
}: {
  histogram: Analysis['histogram'];
  title: string;
  timeControl: Format;
  titleKeys: string[];
}) => {
  const chartData = buildChartData(histogram, timeControl, titleKeys);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#aaa' } },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      x: {
        stacked: true,
        ticks: { color: '#777', maxRotation: 90, minRotation: 45 },
      },
      y: { stacked: true, ticks: { color: '#777' } },
    },
  };

  return (
    <div className="card bg-base-200 border-base-300 border">
      <div className="card-body p-5">
        <p className="mb-4 text-sm font-medium">{title}</p>
        <div className="h-80">
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

const TitleSection = ({
  heading,
  titleKeys,
  counts,
  histogram,
}: {
  heading: string;
  titleKeys: string[];
  counts: Record<string, number>;
  histogram: Analysis['histogram'];
}) => (
  <section className="mb-16">
    <h2 className="mb-6 font-serif text-2xl font-semibold">{heading}</h2>
    <div className="mb-8 grid grid-cols-2 gap-5 md:grid-cols-5">
      {titleKeys.map((k) =>
        counts[k] === undefined ? null : (
          <StatCard key={k} label={k.toUpperCase()} value={counts[k]} />
        )
      )}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {(['rapid', 'blitz', 'bullet'] as const).map((fmt) => (
        <HistogramBar
          key={fmt}
          title={`${fmt.charAt(0).toUpperCase() + fmt.slice(1)} Distribution`}
          histogram={histogram}
          timeControl={fmt}
          titleKeys={titleKeys}
        />
      ))}
    </div>
  </section>
);

// ─── Percentile Modal ─────────────────────────────────────────────────────────

const PercentileModal = ({
  username,
  tabs,
  onClose,
}: {
  username: string;
  tabs: ComparisonTab[];
  onClose: () => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<ComparisonTabKey>('all');

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    setActiveTab('all');
  }, [tabs]);

  const formatLabel: Record<string, string> = {
    bullet: '⚡ Bullet',
    blitz: ' Blitz',
    rapid: ' Rapid',
  };

  const activeComparison =
    tabs.find((tab) => tab.key === activeTab) ?? tabs[0] ?? null;

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-base-200 border-base-300 max-w-lg border">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute top-3 right-3"
          onClick={() => dialogRef.current?.close()}>
          ✕
        </button>

        <h3 className="mb-1 font-serif text-xl font-bold">{username}</h3>
        <p className="text-base-content/50 mb-6 text-xs">
          {activeComparison?.description ?? 'Compared against titled players'}
        </p>

        <div className="mb-6 flex flex-col gap-y-2">
          <div
            role="tablist"
            aria-label="Comparison groups"
            className="flex flex-wrap gap-2">
            {tabs
              .filter((tab) => tab.key === 'all')
              .map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  className={`btn btn-xs ${
                    activeTab === tab.key ? 'btn-primary' : 'btn-ghost'
                  }`}
                  onClick={() => setActiveTab(tab.key)}>
                  {tab.label}
                </button>
              ))}
          </div>

          <div
            role="tablist"
            aria-label="Comparison groups"
            className="flex flex-wrap gap-2">
            {tabs
              .filter((tab) => !tab.key.includes('w') && tab.key !== 'all')
              .map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  className={`btn btn-xs ${
                    activeTab === tab.key ? 'btn-primary' : 'btn-ghost'
                  }`}
                  onClick={() => setActiveTab(tab.key)}>
                  {tab.label}
                </button>
              ))}
          </div>

          <div
            role="tablist"
            aria-label="Comparison groups"
            className="mb-6 flex flex-wrap gap-2">
            {tabs
              .filter((tab) => tab.key.includes('w') && tab.key !== 'all')
              .map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  className={`btn btn-xs ${
                    activeTab === tab.key ? 'btn-primary' : 'btn-ghost'
                  }`}
                  onClick={() => setActiveTab(tab.key)}>
                  {tab.label}
                </button>
              ))}
          </div>
        </div>

        <div className="space-y-4">
          {activeComparison?.results.map((r) => (
            <div key={r.format} className="card bg-base-300 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {formatLabel[r.format]}
                </span>
                <span className="text-primary font-mono text-lg font-bold">
                  {r.rating > 0 ? r.rating : '—'}
                </span>
              </div>

              {r.rating > 0 ? (
                <>
                  <div className="bg-base-100 mb-2 h-3 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-700"
                      style={{ width: `${r.percentile}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-base-content/60">
                      Better than {r.percentile}% of titled players
                    </span>
                    <span className="text-base-content/40">
                      {r.betterThan.toLocaleString()} /{' '}
                      {r.total.toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-base-content/40 text-xs">No rating data</p>
              )}
            </div>
          ))}
        </div>

        <div className="modal-action mt-6">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => dialogRef.current?.close()}>
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

const Analysis: FC<{
  analysis: Analysis | null;
  dbLoading: boolean;
  titleCounts: Record<string, number>;
  histogram: Analysis['histogram'];
}> = ({ analysis, dbLoading, titleCounts, histogram }) => {
  if (dbLoading) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-ring loading-lg text-primary" />
      </div>
    );
  }

  if (analysis) {
    return (
      <>
        <TitleSection
          heading="Open Titles"
          titleKeys={OPEN_TITLES}
          counts={titleCounts}
          histogram={histogram}
        />
        <TitleSection
          heading="Women's Titles"
          titleKeys={WOMAN_TITLES}
          counts={titleCounts}
          histogram={histogram}
        />
      </>
    );
  }

  return <p className="text-base-content/40 text-sm">No data available.</p>;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const NODE_ENV = process.env.NODE_ENV ?? 'development';

const AppPage: NextPage = () => {
  const dbPath: string =
    NODE_ENV === 'production' ? '/chess/db/chess.db' : '/db/chess.db';
  const { db, dbLoading, dbError } = useSQLite(dbPath);

  const [username, setUsername] = useState('redeyesdarknessmetaldrago');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [comparisonTabs, setComparisonTabs] = useState<ComparisonTab[] | null>(
    null
  );
  const [searchedUsername, setSearchedUsername] = useState('');

  const handleSearch = useCallback(async () => {
    if (!username.trim() || !db) return;
    setSearching(true);
    setSearchError(null);
    setComparisonTabs(null);

    try {
      const res = await fetch(
        `https://api.chess.com/pub/player/${username.trim()}/stats`
      );
      if (!res.ok) throw new Error(`Player not found (${res.status})`);
      const stats = await res.json();

      const ratings: PlayerRatings = {
        bullet: {
          last: stats.chess_bullet?.last?.rating ?? 0,
          best: stats.chess_bullet?.best?.rating ?? 0,
        },
        blitz: {
          last: stats.chess_blitz?.last?.rating ?? 0,
          best: stats.chess_blitz?.best?.rating ?? 0,
        },
        rapid: {
          last: stats.chess_rapid?.last?.rating ?? 0,
          best: stats.chess_rapid?.best?.rating ?? 0,
        },
      };

      setSearchedUsername(username.trim());

      const tabs = COMPARISON_TABS.map((tab) => ({
        key: tab.key,
        label: tab.label,
        description: tab.description,
        results: (['bullet', 'blitz', 'rapid'] as const).map((fmt) =>
          calcPercentile(
            db,
            fmt,
            ratings[fmt].best,
            tab.key === 'all' ? undefined : tab.key
          )
        ),
      }));

      setComparisonTabs(tabs);
    } catch (err) {
      setSearchError((err as Error).message);
    } finally {
      setSearching(false);
    }
  }, [username, db]);

  const { count, histogram } = analysis ?? { count: {}, histogram: {} };
  const { total, ...titleCounts } = count as Record<string, number>;

  return (
    <div
      className="bg-base-100 text-base-content min-h-screen px-12 py-16"
      data-theme="luxury">
      {/* Header */}
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold">Chess Insights</h1>
          <p className="text-base-content/50 mt-2 text-sm">
            Player distribution by title and rating
          </p>
        </div>

        {/* Username lookup */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered input-sm w-64 font-mono"
              placeholder="chess.com username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={dbLoading || searching}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSearch}
              disabled={dbLoading || searching || !username.trim()}>
              {searching ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                'Compare'
              )}
            </button>
          </div>
          {dbLoading && (
            <p className="text-base-content/40 text-xs">Loading database…</p>
          )}
          {dbError && (
            <p className="text-error text-xs">DB error: {dbError.message}</p>
          )}
          {searchError && <p className="text-error text-xs">{searchError}</p>}
        </div>
      </div>

      {/* Total */}
      {total !== undefined && (
        <div className="mb-12">
          <StatCard label="Total Players" value={total} />
        </div>
      )}

      <Analysis
        analysis={analysis}
        dbLoading={dbLoading}
        titleCounts={titleCounts}
        histogram={histogram}
      />

      {/* Percentile Modal */}
      {comparisonTabs && (
        <PercentileModal
          username={searchedUsername}
          tabs={comparisonTabs}
          onClose={() => setComparisonTabs(null)}
        />
      )}
    </div>
  );
};

export default AppPage;
