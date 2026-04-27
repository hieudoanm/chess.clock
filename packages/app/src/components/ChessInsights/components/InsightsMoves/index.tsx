import { Insights } from '@chess/services/insights/insights.dto';
import { FaChessPawn } from 'react-icons/fa6';
import { InsightsMovesCastling } from '../InsightsMovesCastling';
import { InsightsMovesPieces } from '../InsightsMovesPieces';
import { SectionHeading } from '../InsightsSectionHeading';

export type InsightsMovesProperties = {
  insights?: Insights;
};

export const InsightsMoves: React.FC<InsightsMovesProperties> = ({
  insights = {} as Insights,
}) => {
  return (
    <>
      <div id="moves" className="flex flex-col gap-y-2 text-center">
        <SectionHeading>
          <div className="flex items-center justify-center gap-x-2">
            <FaChessPawn className="text-teal-500" /> Moves
          </div>
        </SectionHeading>
        <p className="text-xs md:text-sm lg:text-base">
          What are your strengths and areas to improve?
        </p>
      </div>
      <InsightsMovesPieces insights={insights} />
      <InsightsMovesCastling insights={insights} />
    </>
  );
};

InsightsMoves.displayName = 'InsightsMoves';
