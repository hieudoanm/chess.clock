import { Insights } from '@chess/services/insights/insights.dto';
import { FaChessBoard } from 'react-icons/fa6';
import { InsightsGamesOverview } from '../InsightsGamesOverview';
import { InsightsGamesPhrases } from '../InsightsGamesPhrases';
import { InsightsGamesResults } from '../InsightsGamesResults';
import { SectionHeading } from '../InsightsSectionHeading';

export type InsightsGamesProperties = {
  insights?: Insights;
};

export const InsightsGames: React.FC<InsightsGamesProperties> = ({
  insights = {} as Insights,
}) => {
  return (
    <>
      <div id="games" className="flex flex-col gap-y-2 text-center">
        <SectionHeading>
          <div className="flex items-center justify-center gap-x-2">
            <FaChessBoard className="text-teal-500" /> Games
          </div>
        </SectionHeading>
        <p className="text-xs md:text-sm lg:text-base">
          How accurately are you playing in your games?
        </p>
      </div>
      <InsightsGamesOverview insights={insights} />
      <InsightsGamesResults insights={insights} />
      <InsightsGamesPhrases insights={insights} />
    </>
  );
};

InsightsGames.displayName = 'InsightsGames';
