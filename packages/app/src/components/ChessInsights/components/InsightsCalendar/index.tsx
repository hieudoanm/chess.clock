import { Insights } from '@chess/services/insights/insights.dto';
import { FaCalendarDays } from 'react-icons/fa6';
import { InsightsCalendarDaysOfWeek } from '../InsightsCalendarDaysOfWeek';
import { InsightsCalendarTimeOfDays } from '../InsightsCalendarTimeOfDays';
import { SectionHeading } from '../InsightsSectionHeading';

export const InsightsCalendar: React.FC<{ insights?: Insights }> = ({
  insights = {} as Insights,
}) => {
  return (
    <>
      <div id="calendar" className="flex flex-col gap-y-2 text-center">
        <SectionHeading>
          <div className="flex items-center justify-center gap-x-2">
            <FaCalendarDays className="text-teal-500" /> Calendar
          </div>
        </SectionHeading>
        <p className="text-xs md:text-sm lg:text-base">
          When do you play your best?
        </p>
      </div>
      <InsightsCalendarTimeOfDays insights={insights} />
      <InsightsCalendarDaysOfWeek insights={insights} />
    </>
  );
};

InsightsCalendar.displayName = 'InsightsCalendar';
