import { Insights, OpeningCount } from '@chess/services/insights/insights.dto';
import { useState } from 'react';
import { FaBook, FaSquare, FaSquareMinus, FaSquarePlus } from 'react-icons/fa6';
import { CardHeading } from '../InsightsCardHeading';
import { SectionHeading } from '../InsightsSectionHeading';

const InsightsOpeningsBySide: React.FC<{ openings: OpeningCount[] }> = ({
  openings = [],
}) => {
  return (
    <div id="white" className="overflow-auto">
      <table className="table">
        <thead>
          <tr>
            <th className="p-0">Opening</th>
            <th>Moves</th>
            <th align="right">Total Games</th>
            <th className="w-1/2" />
          </tr>
        </thead>
        <tbody>
          {openings.map(({ opening, opening_name, total, win, draw, loss }) => {
            const winPercentage: number = Number.parseFloat(
              ((win / total) * 100).toFixed(2)
            );
            const drawPercentage: number = Number.parseFloat(
              ((draw / total) * 100).toFixed(2)
            );
            const lossPercentage: number = Number.parseFloat(
              ((loss / total) * 100).toFixed(2)
            );
            return (
              <tr key={`${opening}-${opening_name}`}>
                <td className="p-0">{opening}</td>
                <td>{opening_name}</td>
                <td align="right">{total}</td>
                <td>
                  <div className="grid w-full grid-cols-3">
                    <div className="col-span-1">
                      <div className="flex items-center gap-x-1">
                        <FaSquarePlus className="text-teal-500" />
                        <p className="text-sm md:text-base">{winPercentage}%</p>
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <div className="flex items-center gap-x-1">
                        <FaSquare className="text-gray-300" />
                        <p className="text-sm md:text-base">
                          {drawPercentage}%
                        </p>
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <div className="flex items-center gap-x-1">
                        <FaSquareMinus className="text-red-500" />
                        <p className="text-sm md:text-base">
                          {lossPercentage}%
                        </p>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <div className="flex h-4 w-full items-center rounded rounded-full">
                        <div
                          style={{ width: `${winPercentage}%` }}
                          className="h-full bg-teal-500"
                        />
                        <div
                          style={{ width: `${drawPercentage}%` }}
                          className="h-full bg-gray-300"
                        />
                        <div
                          style={{ width: `${lossPercentage}%` }}
                          className="h-full bg-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export type InsightsOpeningsProperties = {
  insights?: Insights;
};

export const InsightsOpenings: React.FC<InsightsOpeningsProperties> = ({
  insights = {} as Insights,
}) => {
  const whiteOpenings = insights?.openings?.white ?? [];
  const blackOpenings = insights?.openings?.black ?? [];

  const [side, setSide] = useState('white');

  return (
    <>
      <div id="openings" className="flex flex-col gap-y-2 text-center">
        <SectionHeading>
          <div className="flex items-center justify-center gap-x-2">
            <FaBook className="text-teal-500" /> Openings
          </div>
        </SectionHeading>
        <p className="text-xs md:text-sm lg:text-base">
          How well do you play your openings?
        </p>
      </div>
      <div className="card border-base-content border shadow">
        <div className="border-base-content border-b px-8 py-4">
          <div className="flex items-center justify-between">
            <CardHeading>Performance</CardHeading>
            <div className="join">
              <button
                type="button"
                className={`btn btn-accent join-item ${
                  side === 'white' ? 'btn-solid text-white' : 'btn-outline'
                }`}
                onClick={() => setSide('white')}>
                White
              </button>
              <button
                type="button"
                className={`btn btn-accent join-item ${
                  side === 'black' ? 'btn-solid text-white' : 'btn-outline'
                }`}
                onClick={() => setSide('black')}>
                Black
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          <p className="text-base font-bold md:text-lg">
            How well you perform in your 10 most played openings
          </p>
          <div
            id="white"
            className={`${side === 'white' ? 'block' : 'hidden'}`}>
            <InsightsOpeningsBySide openings={whiteOpenings} />
          </div>
          <div
            id="black"
            className={`${side === 'black' ? 'block' : 'hidden'}`}>
            <InsightsOpeningsBySide openings={blackOpenings} />
          </div>
        </div>
      </div>
      {/* <div className="card border border-base-content shadow">
        <div className="py-4 px-8 border-b border-base-content">
          <CardHeading>Mastery</CardHeading>
        </div>
        <div className="card-body" />
      </div> */}
    </>
  );
};

InsightsOpenings.displayName = 'InsightsOpenings';
