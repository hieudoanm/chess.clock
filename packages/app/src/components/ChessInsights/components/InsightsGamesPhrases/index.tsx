import {
  GRAY_COLOR,
  RED_COLOR,
  TEAL_COLOR,
} from '@chess/constants/chess.constants';
import {
  Insights,
  ResultsByEndPhrase,
} from '@chess/services/insights/insights.dto';
import { FaXmarksLines } from 'react-icons/fa6';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CardHeading } from '../InsightsCardHeading';

export const InsightsGamesEndPhrases: React.FC<{
  insights: Insights;
}> = ({ insights }) => {
  const resultsByEndPhrase: ResultsByEndPhrase[] =
    insights?.results?.endPhrases ?? [];
  const fullTotal: number = resultsByEndPhrase.reduce(
    (previousValue: number, { win, draw, loss }) =>
      previousValue + win + draw + loss,
    0
  );
  const phrases = resultsByEndPhrase
    .map(({ phrase, win, draw, loss }: ResultsByEndPhrase) => {
      const total: number = win + draw + loss;
      const width: number = Number.parseFloat(
        ((total / fullTotal) * 100).toFixed(2)
      );
      return { phrase, total, width };
    })
    .map(({ phrase, total, width }, index: number, array) => {
      const left: number = array
        .slice(0, index)
        .reduce((previousValue: number, { width }) => previousValue + width, 0);
      return { phrase, total, width, left };
    });

  return (
    <div className="flex flex-col gap-y-8">
      <p className="text-base font-bold md:text-lg">
        Games that ended in the...
      </p>
      {phrases.map(({ phrase, total, width, left }) => {
        return (
          <div key={phrase} className="grid grid-cols-5">
            <div className="col-span-1">
              <p className="text-sm font-medium capitalize md:text-base">
                {phrase}
              </p>
              <p className="text-sm md:text-base">
                {total.toLocaleString('en', { useGrouping: true })}
              </p>
            </div>
            <div className="col-span-4">
              <div className="relative h-full w-full bg-gray-200">
                <div
                  className="absolute top-0 flex h-full items-center justify-center bg-teal-500 text-xs text-white"
                  style={{ width: `${width}%`, left: `${left}%` }}>
                  {width}%
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const InsightsGamesResultsByEndPhrase: React.FC<{
  insights: Insights;
}> = ({ insights = {} as Insights }) => {
  const data = (insights?.results?.endPhrases ?? []).map(
    ({ phrase, win = 0, draw = 0, loss = 0 }) => {
      const total: number = win + draw + loss;
      const winPercentage: number = Number.parseFloat(
        ((win / total) * 100).toFixed(2)
      );
      const lossPercentage: number = Number.parseFloat(
        ((loss / total) * 100).toFixed(2)
      );
      const drawPercentage: number = Number.parseFloat(
        (100 - winPercentage - lossPercentage).toFixed(2)
      );
      return { phrase, winPercentage, drawPercentage, lossPercentage };
    }
  );

  return (
    <div className="flex flex-col gap-y-8">
      <p className="text-base font-bold md:text-lg">
        Results for games that ended in the...
      </p>
      {data.length > 0 ? (
        <div className="aspect-video">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart width={1600} height={900} barCategoryGap={1} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar
                isAnimationActive={false}
                fillOpacity={0.75}
                dataKey="lossPercentage"
                stackId="a"
                fill={RED_COLOR}
              />
              <Bar
                isAnimationActive={false}
                fillOpacity={0.75}
                dataKey="drawPercentage"
                stackId="a"
                fill={GRAY_COLOR}
              />
              <Bar
                isAnimationActive={false}
                fillOpacity={0.75}
                dataKey="winPercentage"
                stackId="a"
                fill={TEAL_COLOR}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export const InsightsGamesPhrases: React.FC<{ insights: Insights }> = ({
  insights = {} as Insights,
}: {
  insights: Insights;
}) => {
  return (
    <div className="card border-base-content border shadow">
      <div className="border-base-content border-b px-8 py-4">
        <CardHeading>
          <div className="flex items-center gap-x-2">
            <FaXmarksLines />
            Game Phases
          </div>
        </CardHeading>
      </div>
      <div className="card-body border-b">
        <InsightsGamesEndPhrases insights={insights} />
      </div>
      <div className="card-body">
        <InsightsGamesResultsByEndPhrase insights={insights} />
      </div>
    </div>
  );
};

InsightsGamesPhrases.displayName = 'InsightsGamesPhrases';
