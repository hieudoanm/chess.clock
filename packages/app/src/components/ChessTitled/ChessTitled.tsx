import { Maps } from '@chess/components/Maps';
import { QueryTemplate } from '@chess/components/QueryTemplate';
import { Title } from '@chess/generated/prisma/client';
import countries from '@chess/json/countries.json';
import maps from '@chess/json/world.json';
import { Days } from '@chess/services/insights/insights.service';
import { trpc } from '@chess/utils/trpc';
import chroma from 'chroma-js';
import Link from 'next/link';
import { FC, useState } from 'react';
import { FaBoltLightning, FaClock, FaRocket } from 'react-icons/fa6';
import {
  Bar,
  BarChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const titles: Record<Title, string> = {
  GM: 'Grandmaster',
  IM: 'International Master',
  FM: 'FIDE Master',
  CM: 'Candidate Master',
  NM: 'National Master',
  WGM: 'Woman Grandmaster',
  WIM: 'Woman International Master',
  WFM: 'Woman FIDE Master',
  WCM: 'Woman Candidate Master',
  WNM: 'Woman National Master',
  AGM: 'Arena Grandmaster',
  AIM: 'Arena International Master',
  AFM: 'Arena FIDE Master',
  ACM: 'Arena Candidate Master',
};

const getColors = ({
  colors,
  baseColor,
  primaryColor,
}: {
  colors: number;
  baseColor: string;
  primaryColor: string;
}) => {
  try {
    return chroma.scale([baseColor, primaryColor]).mode('rgb').colors(colors);
  } catch {
    try {
      return chroma.scale([primaryColor, baseColor]).mode('rgb').colors(colors);
    } catch {
      return [];
    }
  }
};

const processData = (data?: {
  count: {
    gm: number;
    im: number;
    fm: number;
    cm: number;
    nm: number;
    wgm: number;
    wim: number;
    wfm: number;
    wcm: number;
    wnm: number;
  };
}) => {
  const titleData = [
    { title: 'GM', value: data?.count.gm ?? 0 },
    { title: 'IM', value: data?.count.im ?? 0 },
    { title: 'FM', value: data?.count.fm ?? 0 },
    { title: 'CM', value: data?.count.cm ?? 0 },
    { title: 'NM', value: data?.count.nm ?? 0 },
    { title: 'WGM', value: data?.count.wgm ?? 0 },
    { title: 'WIM', value: data?.count.wim ?? 0 },
    { title: 'WFM', value: data?.count.wfm ?? 0 },
    { title: 'WCM', value: data?.count.wcm ?? 0 },
    { title: 'WNM', value: data?.count.wnm ?? 0 },
  ].filter(({ value }) => value !== 0);

  return { titleData };
};

export const ChessTitled: FC = () => {
  const [state, setState] = useState<{
    days?: Days;
    title?: Title;
    countryCode?: string;
    titleView: 'table' | 'chart';
    countriesView: 'table' | 'maps';
  }>({
    days: undefined,
    title: undefined,
    countryCode: undefined,
    titleView: 'table',
    countriesView: 'table',
  });
  const { isPending, error, data } = trpc.chess.titled.useQuery({
    days: state.days as Days,
    title: state.title as Title,
    countryCode: state.countryCode,
  });

  const primaryColor = '#FFFFFF';
  const baseColor = '#000000';

  const { titleData } = processData(data);

  // Countries
  const gap = 50;
  const numberOfTitlePlayers: number[] = (data?.countries ?? [])
    .map(({ count }) => count)
    .filter((count: number) => count < 1000);
  const min: number = Math.round(Math.min(...numberOfTitlePlayers) / gap) * gap;
  const max: number = Math.ceil(Math.max(...numberOfTitlePlayers) / gap) * gap;
  const range: number[] = Array.from({ length: (max - min) / gap }).map(
    (_value: unknown, index: number) => min + index * gap
  );
  const overflowColor: string = primaryColor;
  const colors: string[] = getColors({
    baseColor,
    primaryColor,
    colors: range.length,
  });
  const countriesData = data?.countries.map(
    ({ country_code = '', count = 0 }) => {
      if (count > max) {
        return {
          id: country_code,
          label: country_code,
          value: count,
          color: overflowColor,
        };
      }
      const colorIndex: number = range.findIndex(
        (start: number) => start <= count && count < start + 100
      );
      const color = colors[colorIndex];
      return { id: country_code, label: country_code, value: count, color };
    }
  );

  return (
    <QueryTemplate isPending={isPending} error={error} noData={!data}>
      <div className="container mx-auto">
        <div className="p-4 md:p-8">
          <div className="flex flex-col gap-y-4 md:gap-y-8">
            <h1 className="text-xl md:text-4xl">
              Titled ({data?.count.total ?? 0})
            </h1>
            <div className="join join-vertical md:join-horizontal w-full">
              <select
                id="title"
                name="title"
                className="join-item select select-bordered w-full"
                value={state.title}
                onChange={(event) => {
                  const title =
                    event.target.value !== ''
                      ? (event.target.value as Title)
                      : undefined;
                  setState({ ...state, title });
                }}>
                <option value={''} selected>
                  Title
                </option>
                {Object.entries(titles).map(([key, value]) => {
                  return (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  );
                })}
              </select>
              <select
                id="country"
                name="country"
                className="join-item select select-bordered w-full"
                value={state.countryCode}
                onChange={(event) => {
                  const countryCode =
                    event.target.value !== '' ? event.target.value : undefined;
                  setState({ ...state, countryCode });
                }}>
                <option value={''} selected>
                  Country
                </option>
                {countries.map(({ name: { common }, cca2 }) => {
                  return (
                    <option key={cca2} value={cca2}>
                      {common}
                    </option>
                  );
                })}
              </select>
              <select
                id="days"
                name="days"
                className="join-item select select-bordered w-full"
                value={state.days}
                onChange={(event) => {
                  const days: Days | undefined =
                    event.target.value !== ''
                      ? (parseInt(event.target.value, 10) as Days)
                      : undefined;
                  setState({ ...state, days });
                }}>
                <option value={''} selected>
                  Timeframe
                </option>
                <option value={7}>Week</option>
                <option value={30}>Month</option>
                <option value={90}>Quarter</option>
                <option value={366}>Year</option>
              </select>
            </div>
            <h1 className="text-xl md:text-4xl">Overall</h1>
            <div className="stats stats-vertical md:stats-horizontal w-full rounded-2xl">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <FaClock className="text-xl md:text-4xl" />
                </div>
                <div className="stat-title">Rapid</div>
                <div className="stat-value">
                  {data?.overall?.rapid.average ?? 0}
                </div>
                <div className="stat-desc">
                  Best: {data?.overall?.rapid.max ?? 0}
                </div>
              </div>
              <div className="stat">
                <div className="stat-figure text-primary">
                  <FaBoltLightning className="text-xl md:text-4xl" />
                </div>
                <div className="stat-title">Blitz</div>
                <div className="stat-value">
                  {data?.overall?.blitz.average ?? 0}
                </div>
                <div className="stat-desc">
                  Best: {data?.overall?.blitz.max ?? 0}
                </div>
              </div>
              <div className="stat">
                <div className="stat-figure text-primary">
                  <FaRocket className="text-xl md:text-4xl" />
                </div>
                <div className="stat-title">Bullet</div>
                <div className="stat-value">
                  {data?.overall?.bullet.average ?? 0}
                </div>
                <div className="stat-desc">
                  Best: {data?.overall?.bullet.max ?? 0}
                </div>
              </div>
            </div>
            <h1 className="text-xl md:text-4xl">Distribution</h1>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-8">
              <div className="col-span-1">
                <div className="aspect-square md:aspect-video">
                  <h2 className="text-center">Rapid</h2>
                  <ResponsiveContainer>
                    <BarChart data={data?.distribution.rapid}>
                      <XAxis dataKey="group" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill={primaryColor} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-1">
                <div className="aspect-square md:aspect-video">
                  <h2 className="text-center">Blitz</h2>
                  <ResponsiveContainer>
                    <BarChart data={data?.distribution.blitz}>
                      <XAxis dataKey="group" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill={primaryColor} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-1">
                <div className="aspect-square md:aspect-video">
                  <h2 className="text-center">Bullet</h2>
                  <ResponsiveContainer>
                    <BarChart data={data?.distribution.bullet}>
                      <XAxis dataKey="group" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill={primaryColor} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-4xl">Title</h1>
              <div className="join rounded-xl">
                <button
                  type="button"
                  className={`btn btn-outline join-item ${state.titleView === 'table' ? 'btn-active' : ''}`}
                  onClick={() => setState({ ...state, titleView: 'table' })}>
                  Table
                </button>
                <button
                  type="button"
                  className={`btn btn-outline join-item ${state.titleView === 'chart' ? 'btn-active' : ''}`}
                  onClick={() => setState({ ...state, titleView: 'chart' })}>
                  Chart
                </button>
              </div>
            </div>
            {state.titleView === 'table' ? (
              <div className="overflow-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th align="right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {titleData.map(({ title, value }) => {
                      return (
                        <tr key={title}>
                          <td>
                            <span className="badge badge-primary badge-outline">
                              {title}
                            </span>
                          </td>
                          <td align="right">{value}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <></>
            )}
            {state.titleView === 'chart' ? (
              <div className="aspect-square md:aspect-video">
                <ResponsiveContainer>
                  <PieChart>
                    <Legend verticalAlign="top" />
                    <Tooltip />
                    <Pie
                      startAngle={-270}
                      endAngle={90}
                      isAnimationActive={false}
                      data={titleData}
                      dataKey="value"
                      nameKey="title"
                      cx="50%"
                      cy="50%"
                      innerRadius={180}
                      outerRadius={240}
                      fill={primaryColor}
                      // label={(entry: { name: string; value: number }) => {
                      // 	return `${entry.name} (${entry.value})`;
                      // }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <></>
            )}
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-4xl">Countries</h1>
              <div className="join rounded-xl">
                <button
                  type="button"
                  className={`btn btn-outline join-item ${state.countriesView === 'table' ? 'btn-active' : ''}`}
                  onClick={() =>
                    setState({ ...state, countriesView: 'table' })
                  }>
                  Table
                </button>
                <button
                  type="button"
                  className={`btn btn-outline join-item ${state.countriesView === 'maps' ? 'btn-active' : ''}`}
                  onClick={() => setState({ ...state, countriesView: 'maps' })}>
                  Maps
                </button>
              </div>
            </div>
            {state.countriesView === 'table' ? (
              <div className="overflow-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th align="center" className="w-4">
                        #
                      </th>
                      <th>Country</th>
                      <th align="right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.countries.map(
                      ({ country_code, country, count }, index: number) => {
                        return (
                          <tr key={country_code}>
                            <td align="center">{index + 1}</td>
                            <td>{country}</td>
                            <td align="right">{count}</td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <></>
            )}
            {state.countriesView === 'maps' ? (
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center gap-x-4 md:gap-x-8">
                    <div className="grow">
                      <Maps id="world" svg={maps} data={countriesData} />
                    </div>
                    {/* <div className='flex flex-col gap-y-1'>
                        {colors.map((color: string, index: number) => {
                          const start = range[index];
                          const end = start + gap;
                          const label: string = `${start} - ${end}`;
                          return (
                            <div
                              key={color}
                              data-tip={label}
                              className='tooltip tooltip-left'>
                              <div
                                className={`aspect-square w-4 cursor-pointer overflow-hidden rounded text-white bg-[${color}]`}>
                                <p className={`text-[${color}]`}>{color}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div> */}
                  </div>
                </div>
              </div>
            ) : (
              <></>
            )}
            <h1 className="text-xl md:text-4xl">Leaderboard</h1>
            <div className="overflow-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th align="center" className="w-4">
                      #
                    </th>
                    <th>Title</th>
                    <th>Country</th>
                    <th>Name</th>
                    <th align="right">Rapid</th>
                    <th align="right">Blitz</th>
                    <th align="right">Bullet</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.leaderboard.map(
                    (
                      {
                        title,
                        countryCode,
                        country,
                        username,
                        name,
                        rapid_rating_best,
                        blitz_rating_best,
                        bullet_rating_best,
                      },
                      index: number
                    ) => {
                      const url = `https://www.chess.com/member/${username}`;
                      return (
                        <tr key={username}>
                          <td align="center">{index + 1}</td>
                          <td>
                            <span className="badge badge-primary badge-outline">
                              {title}
                            </span>
                          </td>
                          <td title={countryCode}>{country}</td>
                          <td>
                            <Link href={url} target="_blank">
                              {name || username}
                            </Link>
                          </td>
                          <td align="right">{rapid_rating_best}</td>
                          <td align="right">{blitz_rating_best}</td>
                          <td align="right">{bullet_rating_best}</td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </QueryTemplate>
  );
};
