import { Insights } from '@chess/services/insights/insights.dto';
import Link from 'next/link';
import { useState } from 'react';
import { FaCircleUser } from 'react-icons/fa6';
import { CardHeading } from '../InsightsCardHeading';
import { SectionHeading } from '../InsightsSectionHeading';

export const InsightsOpponents: React.FC<{ insights: Insights }> = ({
  insights,
}) => {
  const [sort, setSort] = useState<{ by: string }>({ by: 'games' });

  const data = (insights?.opponents ?? []).map(
    ({ opponent = '', games = 1, win = 0, draw = 0, loss = 0 }) => {
      const winPercentage = (win / games) * 100;
      const drawPercentage = (draw / games) * 100;
      const lossPercentage = (loss / games) * 100;
      return {
        opponent,
        games,
        win,
        winPercentage,
        draw,
        drawPercentage,
        loss,
        lossPercentage,
      };
    }
  );
  data.sort(
    (a: Record<string, string | number>, b: Record<string, string | number>) =>
      a[sort.by] < b[sort.by] ? 1 : -1
  );

  return (
    <>
      <div id="opponents" className="flex flex-col gap-y-2 text-center">
        <SectionHeading>
          <div className="flex items-center justify-center gap-x-2">
            <FaCircleUser className="text-teal-500" /> Opponents
          </div>
        </SectionHeading>
        <p className="text-xs md:text-sm lg:text-base">
          Most frequently played opponents
        </p>
      </div>
      <div className="card border-base-content border shadow">
        <div className="border-base-content border-b px-8 py-4">
          <CardHeading>Opponents</CardHeading>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="px-8">
                <th align="left" className="pl-8">
                  No
                </th>
                <th>Opponent</th>
                <th align="right">
                  <button
                    type="button"
                    className="cursor-pointer capitalize"
                    onClick={() => setSort({ by: 'games' })}>
                    Games
                  </button>
                </th>
                <th align="right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="cursor-pointer capitalize"
                      onClick={() => setSort({ by: 'win' })}>
                      Win
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer capitalize"
                      onClick={() => setSort({ by: 'winPercentage' })}>
                      (%)
                    </button>
                  </div>
                </th>
                <th align="right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="cursor-pointer capitalize"
                      onClick={() => setSort({ by: 'draw' })}>
                      Draw
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer capitalize"
                      onClick={() => setSort({ by: 'drawPercentage' })}>
                      (%)
                    </button>
                  </div>
                </th>
                <th align="right" className="pr-8">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="cursor-pointer capitalize"
                      onClick={() => setSort({ by: 'loss' })}>
                      Loss
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer capitalize"
                      onClick={() => setSort({ by: 'lossPercentage' })}>
                      (%)
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map(
                (
                  {
                    opponent = '',
                    games = 0,
                    win = 0,
                    winPercentage = 0,
                    draw = 0,
                    drawPercentage = 0,
                    loss = 0,
                    lossPercentage = 0,
                  },
                  index: number
                ) => {
                  return (
                    <tr key={opponent}>
                      <td align="left" className="pl-8">
                        {index + 1}
                      </td>
                      <td>
                        <Link
                          href={`https://www.chess.com/member/${encodeURIComponent(opponent)}`}
                          target="_blank">
                          {opponent}
                        </Link>
                      </td>
                      <td align="right">
                        <b>{games}</b>
                      </td>
                      <td align="right">
                        <div className="truncate text-teal-500">
                          {win} ({winPercentage.toFixed(2)}%)
                        </div>
                      </td>
                      <td align="right">
                        <div className="truncate text-gray-500">
                          {draw} ({drawPercentage.toFixed(2)}%)
                        </div>
                      </td>
                      <td align="right">
                        <div className="truncate pr-8 text-red-500">
                          {loss} ({lossPercentage.toFixed(2)}%)
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

InsightsOpponents.displayName = 'InsightsOpponents';
