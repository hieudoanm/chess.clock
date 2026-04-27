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

const ChessGamesByDaysOfWeek: React.FC<{ insights: Insights }> = ({
  insights = {} as Insights,
}) => {
  const pieData = (insights?.games?.daysOfWeek ?? []).map(
    ({ games, dayOfWeek }) => ({
      name: dayOfWeek ?? '',
      value: games ?? 0,
    })
  );
  const total = pieData.reduce(
    (previous: number, { value = 0 }) => previous + value,
    0
  );

  return (
    <div className="flex flex-col gap-y-8">
      <p className="text-base font-bold md:text-lg">Games by Days of Week</p>
      {pieData.length > 0 ? (
        <div className="aspect-video">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Legend />
              <Tooltip />
              <Pie
                isAnimationActive={false}
                dataKey="value"
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                startAngle={-270}
                fillOpacity={0.75}
                label={customLabel(pieData, total)}>
                {pieData.map((entry, index) => (
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

const ChessAccuracyByDaysOfWeek: React.FC<{ insights: Insights }> = ({
  insights = {} as Insights,
}) => {
  const data = insights?.accuracy?.daysOfWeek ?? [];
  return (
    <div className="flex flex-col gap-y-8">
      <p className="text-base font-bold md:text-lg">Accuracy by Days of Week</p>
      {data.length > 0 ? (
        <div className="aspect-video">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart width={1600} height={900} barCategoryGap={1} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dayOfWeek" />
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

export const ChessResultsByDaysOfWeek: React.FC<{
  insights: Insights;
}> = ({ insights = {} as Insights }) => {
  const data = (insights?.results?.daysOfWeek ?? []).map(
    ({ dayOfWeek, win = 0, draw = 0, loss = 0 }) => {
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
      return { dayOfWeek, winPercentage, drawPercentage, lossPercentage };
    }
  );
  return (
    <div className="flex flex-col gap-y-8">
      <p className="text-base font-bold md:text-lg">Results by Days of Week</p>
      {data.length > 0 ? (
        <div className="aspect-video">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart width={1600} height={900} barCategoryGap={1} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dayOfWeek" />
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

export const InsightsCalendarDaysOfWeek: React.FC<{
  insights: Insights;
}> = ({ insights }) => {
  return (
    <div className="card border-base-content border shadow">
      <div className="border-base-content border-b px-8 py-4">
        <CardHeading>Day of Week</CardHeading>
      </div>
      <div className="card-body border-base-content border-b">
        <ChessGamesByDaysOfWeek insights={insights} />
      </div>
      <div className="card-body border-base-content border-b">
        <ChessAccuracyByDaysOfWeek insights={insights} />
      </div>
      <div className="card-body border-base-content border-b">
        <ChessResultsByDaysOfWeek insights={insights} />
      </div>
      <div className="card-body" />
    </div>
  );
};

InsightsCalendarDaysOfWeek.displayName = 'InsightsCalendarDaysOfWeek';
