import { Insights } from '@chess/services/insights/insights.dto';
import { FaGlobe } from 'react-icons/fa';
import { CardHeading } from '../InsightsCardHeading';
import { SectionHeading } from '../InsightsSectionHeading';

export type InsightsGeographyProperties = {
  insights?: Insights;
};

export const InsightsGeography: React.FC<InsightsGeographyProperties> = ({
  insights = {} as Insights,
}) => {
  const countries = insights?.geography ?? [];

  return (
    <>
      <div id="geography" className="flex flex-col gap-y-2 text-center">
        <SectionHeading>
          <div className="flex items-center justify-center gap-x-2">
            <FaGlobe className="text-teal-500" /> Geography
          </div>
        </SectionHeading>
        <p className="text-xs md:text-sm lg:text-base">
          How do you perform in the global chess community?
        </p>
      </div>
      <div className="card border-base-content border shadow">
        <div className="border-base-content border-b px-8 py-4">
          <div className="flex items-center justify-between">
            <CardHeading>Countries ({countries.length})</CardHeading>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="pl-8">Country</th>
                <th align="right">Games</th>
                <th align="right">Win (%)</th>
                <th align="right">Draw (%)</th>
                <th align="right">Loss (%)</th>
              </tr>
            </thead>
            <tbody>
              {countries.map(({ flag, code, name, total, win, draw, loss }) => {
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
                  <tr key={code}>
                    <td className="pl-8">
                      <div className="truncate">
                        {flag} {name}
                      </div>
                    </td>
                    <td align="right">
                      <b>{total}</b>
                    </td>
                    <td align="right">
                      <div className="truncate text-teal-500">
                        {win} ({winPercentage}%)
                      </div>
                    </td>
                    <td align="right">
                      <div className="truncate text-gray-500">
                        {draw} ({drawPercentage}%)
                      </div>
                    </td>
                    <td align="right">
                      <div className="truncate text-red-500">
                        {loss} ({lossPercentage}%)
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

InsightsGeography.displayName = 'InsightsGeography';
