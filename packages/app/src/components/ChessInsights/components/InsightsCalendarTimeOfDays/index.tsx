import {
  GRAY_COLOR,
  RED_COLOR,
  TEAL_COLOR,
  TIME_COLORS,
} from '@chess/constants/chess.constants';
import { Insights } from '@chess/services/insights/insights.dto';
import { customLabel } from '@chess/utils/tests/custom-label';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CardHeading } from '../InsightsCardHeading';

const ChessGamesByTimeOfDays: React.FC<{ insights: Insights }> = ({
  insights = {} as Insights,
}) => {
  const data = (insights?.games?.timeOfDays ?? []).map(
    ({ games, timeOfDay }) => ({
      name: timeOfDay ?? '',
      value: games ?? 0,
    })
  );
  const total = data.reduce(
    (previous: number, { value = 0 }) => previous + value,
    0
  );

  return (
    <div className="flex flex-col gap-y-8">
      <p className="text-base font-bold md:text-lg">Games by Time of Day</p>
      {data.length > 0 ? (
        <div className="aspect-video">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Legend />
              <Tooltip />
              <Pie
                isAnimationActive={false}
                fillOpacity={0.75}
                dataKey="value"
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                startAngle={-270}
                label={customLabel(data, total)}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={TIME_COLORS[index % TIME_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

const ChessAccuracyByTimeOfDays: React.FC<{ insights: Insights }> = ({
  insights = {} as Insights,
}) => {
  const data = insights?.accuracy?.timeOfDays ?? [];

  return (
    <div className="flex flex-col gap-y-8">
      <p className="text-base font-bold md:text-lg">Accuracy by Time of Day</p>
      {data.length > 0 ? (
        <div className="aspect-video">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart width={1600} height={900} barCategoryGap={1} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeOfDay" />
              <YAxis />
              <Tooltip />
              <Bar
                isAnimationActive={false}
                fillOpacity={0.75}
                dataKey="average"
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

export const ChessResultsByTimeOfDays: React.FC<{
  insights: Insights;
}> = ({ insights = {} as Insights }) => {
  const data = (insights?.results?.timeOfDays ?? []).map(
    ({ timeOfDay, win = 0, draw = 0, loss = 0 }) => {
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
      return { timeOfDay, winPercentage, drawPercentage, lossPercentage };
    }
  );
  return (
    <div className="flex flex-col gap-y-8">
      <p className="text-base font-bold md:text-lg">Results by Time of Day</p>
      {data.length > 0 ? (
        <div className="aspect-video">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart width={1600} height={900} barCategoryGap={1} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeOfDay" />
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

export const InsightsCalendarTimeOfDays: React.FC<{
  insights: Insights;
}> = ({ insights }) => {
  return (
    <div className="card border-base-content border shadow">
      <div className="border-base-content border-b px-8 py-4">
        <CardHeading>Time of Day</CardHeading>
      </div>
      <div className="card-body border-base-content border-b">
        <ChessGamesByTimeOfDays insights={insights} />
      </div>
      <div className="card-body border-base-content border-b">
        <ChessAccuracyByTimeOfDays insights={insights} />
      </div>
      <div className="card-body border-base-content border-b">
        <ChessResultsByTimeOfDays insights={insights} />
      </div>
      <div className="card-body" />
    </div>
  );
};

InsightsCalendarTimeOfDays.displayName = 'InsightsCalendarTimeOfDays';
