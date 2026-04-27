import { TIME_COLORS } from '@chess/constants/chess.constants';
import { Insights } from '@chess/services/insights/insights.dto';
import { customLabel } from '@chess/utils/tests/custom-label';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CardHeading } from '../InsightsCardHeading';

export type InsightsMovesPiecesProperties = { insights: Insights };

export const InsightsMovesPieces: React.FC<InsightsMovesPiecesProperties> = ({
  insights = {} as Insights,
}) => {
  const pawn: number = insights?.moves?.pieces?.pawn;
  const knight: number = insights?.moves?.pieces?.knight;
  const bishop: number = insights?.moves?.pieces?.bishop;
  const rook: number = insights?.moves?.pieces?.rook;
  const queen: number = insights?.moves?.pieces?.queen;
  const king: number = insights?.moves?.pieces?.king;
  const total = pawn + knight + bishop + rook + queen + king;
  const pieces = [
    { name: 'king', value: king },
    { name: 'queen', value: queen },
    { name: 'rook', value: rook },
    { name: 'bishop', value: bishop },
    { name: 'knight', value: knight },
    { name: 'pawn', value: pawn },
  ];

  return (
    <div className="card border-base-content border shadow">
      <div className="border-base-content border-b px-8 py-4">
        <CardHeading>Pieces</CardHeading>
      </div>
      <div className="card-body">
        <p className="text-base font-bold md:text-lg">Moves per piece</p>
        <div className="aspect-video">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Legend />
              <Tooltip />
              <Pie
                isAnimationActive={false}
                dataKey="value"
                data={pieces}
                cx="50%"
                cy="50%"
                labelLine={false}
                startAngle={-270}
                fillOpacity={0.75}
                label={customLabel(pieces, total)}>
                {pieces.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={TIME_COLORS[index % TIME_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
