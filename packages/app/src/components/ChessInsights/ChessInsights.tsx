import { Title } from '@chess/generated/prisma/client';
import { useQuery } from '@chess/hooks/use-query-param';
import { Insights } from '@chess/services/insights/insights.dto';
import { useCallback, useEffect, useState } from 'react';
import { FaChessPawn } from 'react-icons/fa';
import {
  FaBook,
  FaCalendarDays,
  FaChessBoard,
  FaCircleUser,
  FaGlobe,
} from 'react-icons/fa6';
import { Link as ScrollLink } from 'react-scroll';
import { InsightsCalendar } from './components/InsightsCalendar';
import { InsightsGames } from './components/InsightsGames';
import { InsightsGeography } from './components/InsightsGeography';
import { InsightsHeader } from './components/InsightsHeader';
import { InsightsMoves } from './components/InsightsMoves';
import { InsightsOpenings } from './components/InsightsOpenings';
import { InsightsOpponents } from './components/InsightsOpponents';

export type ChessInsightsProperties = {
  mobile?: boolean;
  name?: string;
  avatar?: string;
  username?: string;
  title?: Title;
  insights?: Insights;
};

export const ChessInsights: React.FC<ChessInsightsProperties> = ({
  name = '',
  username = '',
  avatar = '',
  title = '' as Title,
  insights = {} as Insights,
}) => {
  const { value: timeClass } = useQuery('timeClass', 'blitz');
  const [top, setTop] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollY: number = window.scrollY;
    const top = scrollY > 60 ? scrollY - 60 : scrollY;
    console.log('top', top);
    setTop(top);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="grid h-full grid-cols-1 gap-0 overflow-hidden py-8 md:grid-cols-4 md:gap-x-8">
      <div className="order-2 col-span-1 md:order-1 md:col-span-3">
        <div className="flex flex-col gap-y-8">
          <InsightsHeader
            name={name}
            title={title}
            avatar={avatar}
            username={username}
          />
          <InsightsGames insights={insights} />
          <InsightsOpenings insights={insights} />
          <InsightsMoves insights={insights} />
          <InsightsCalendar insights={insights} />
          <InsightsGeography insights={insights} />
          <InsightsOpponents insights={insights} />
        </div>
      </div>
      <div className="order-1 col-span-1 md:order-2">
        <div className="relative hidden md:block">
          <div
            style={{ top: `${top}px` }}
            className="absolute right-0 left-0 w-full transition-all duration-0 ease-linear">
            <div className="card border-base-content border shadow">
              <div className="p-4">
                <div className="flex justify-between">
                  <div className="uppercase">{username}</div>
                  <div className="font-semibold capitalize">{timeClass}</div>
                </div>
              </div>
              <div className="border-base-content border-t px-4 py-2">
                <div className="flex items-center gap-x-2">
                  <FaChessBoard className="text-teal-500" />
                  <ScrollLink
                    to="games"
                    className="cursor-pointer"
                    duration={500}
                    offset={-32}
                    smooth
                    spy>
                    Games
                  </ScrollLink>
                </div>
              </div>
              <div className="border-base-content border-t px-4 py-2">
                <div className="flex items-center gap-x-2">
                  <FaBook className="text-teal-500" />
                  <ScrollLink
                    to="openings"
                    className="cursor-pointer"
                    duration={500}
                    offset={-32}
                    smooth
                    spy>
                    Openings
                  </ScrollLink>
                </div>
              </div>
              <div className="border-base-content border-t px-4 py-2">
                <div className="flex items-center gap-x-2">
                  <FaChessPawn className="text-teal-500" />
                  <ScrollLink
                    to="moves"
                    className="cursor-pointer"
                    duration={500}
                    offset={-32}
                    smooth
                    spy>
                    Moves
                  </ScrollLink>
                </div>
              </div>
              <div className="border-base-content border-t px-4 py-2">
                <div className="flex items-center gap-x-2">
                  <FaCalendarDays className="text-teal-500" />
                  <ScrollLink
                    to="calendar"
                    className="cursor-pointer"
                    duration={500}
                    offset={-32}
                    smooth
                    spy>
                    Calendar
                  </ScrollLink>
                </div>
              </div>
              <div className="border-base-content border-t px-4 py-2">
                <div className="flex items-center gap-x-2">
                  <FaGlobe className="text-teal-500" />
                  <ScrollLink
                    to="geography"
                    className="cursor-pointer"
                    duration={500}
                    offset={-32}
                    smooth
                    spy>
                    Geography
                  </ScrollLink>
                </div>
              </div>
              <div className="border-base-content border-t px-4 py-2">
                <div className="flex items-center gap-x-2">
                  <FaCircleUser className="text-teal-500" />
                  <ScrollLink
                    to="opponents"
                    className="cursor-pointer"
                    duration={500}
                    offset={-32}
                    smooth
                    spy>
                    Opponents
                  </ScrollLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ChessInsights.displayName = 'ChessInsights';
