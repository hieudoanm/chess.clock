import {
  GRAY_COLOR,
  RED_COLOR,
  TEAL_COLOR,
} from '@chess/constants/chess.constants';
import { Insights } from '@chess/services/insights/insights.dto';
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

const InsightsMovesCastlingByType: React.FC<{
  title: string;
  data: { castling: ChessCastling }[];
}> = ({ title, data }) => {
  return (
    <div className="flex flex-col gap-y-8">
      <p className="text-base font-bold md:text-lg">{title}</p>
      <div className="aspect-video">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart width={1600} height={900} barCategoryGap={1} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="castling" />
            <YAxis />
            <Tooltip />
            <Bar
              // label="When Opponent Castled Short"
              isAnimationActive={false}
              fillOpacity={0.75}
              dataKey="lossPercentage"
              stackId="a"
              fill={RED_COLOR}
            />
            <Bar
              // label="When Opponent Castled Long"
              isAnimationActive={false}
              fillOpacity={0.75}
              dataKey="drawPercentage"
              stackId="a"
              fill={GRAY_COLOR}
            />
            <Bar
              // label="When Opponent Did Not Castle"
              isAnimationActive={false}
              fillOpacity={0.75}
              dataKey="winPercentage"
              stackId="a"
              fill={TEAL_COLOR}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

type ChessCastling = 'short' | 'long' | 'none';

export const InsightsMovesCastling: React.FC<{ insights?: Insights }> = ({
  insights = {} as Insights,
}) => {
  const castlings: ChessCastling[] = ['short', 'long', 'none'];
  const ss = insights?.moves?.castling?.short?.short ?? {};
  const sl = insights?.moves?.castling?.short?.long ?? {};
  const sn = insights?.moves?.castling?.short?.none ?? {};
  const ls = insights?.moves?.castling?.long?.short ?? {};
  const ll = insights?.moves?.castling?.long?.long ?? {};
  const ln = insights?.moves?.castling?.long?.none ?? {};
  const ns = insights?.moves?.castling?.long?.short ?? {};
  const nl = insights?.moves?.castling?.long?.long ?? {};
  const nn = insights?.moves?.castling?.long?.none ?? {};
  const shortData = [ss, sl, sn].map(({ win, draw, loss }, index: number) => {
    const total = win + draw + loss;
    const winPercentage = Number.parseFloat(((win / total) * 100).toFixed(2));
    const drawPercentage = Number.parseFloat(((draw / total) * 100).toFixed(2));
    const lossPercentage = Number.parseFloat(((loss / total) * 100).toFixed(2));
    return {
      castling: castlings[index],
      winPercentage,
      drawPercentage,
      lossPercentage,
    };
  });
  const longData = [ls, ll, ln].map(({ win, draw, loss }, index: number) => {
    const total = win + draw + loss;
    const winPercentage = Number.parseFloat(((win / total) * 100).toFixed(2));
    const drawPercentage = Number.parseFloat(((draw / total) * 100).toFixed(2));
    const lossPercentage = Number.parseFloat(((loss / total) * 100).toFixed(2));
    return {
      castling: castlings[index],
      winPercentage,
      drawPercentage,
      lossPercentage,
    };
  });
  const noneData = [ns, nl, nn].map(({ win, draw, loss }, index: number) => {
    const total = win + draw + loss;
    const winPercentage = Number.parseFloat(((win / total) * 100).toFixed(2));
    const drawPercentage = Number.parseFloat(((draw / total) * 100).toFixed(2));
    const lossPercentage = Number.parseFloat(((loss / total) * 100).toFixed(2));
    return {
      castling: castlings[index],
      winPercentage,
      drawPercentage,
      lossPercentage,
    };
  });

  return (
    <div className="card border-base-content border shadow">
      <div className="border-base-content border-b px-8 py-4">
        <CardHeading>Castling</CardHeading>
      </div>
      <div className="card-body border-base-content border-b">
        <InsightsMovesCastlingByType
          title="When you castled short (kingside)"
          data={shortData}
        />
      </div>
      <div className="card-body border-base-content border-b">
        <InsightsMovesCastlingByType
          title="When you castled long (queenside)"
          data={longData}
        />
      </div>
      <div className="card-body border-base-content border-b">
        <InsightsMovesCastlingByType
          title="When you never castled"
          data={noneData}
        />
      </div>
    </div>
  );
};
