import { TimeClass, Title, Variant } from '@chess/generated/prisma/client';
import { useQuery } from '@chess/hooks/use-query-param';
import Link from 'next/link';
import { ChangeEvent } from 'react';
import { FaChessPawn } from 'react-icons/fa6';

export type InsightsHeaderProperties = {
  name?: string;
  avatar?: string;
  username?: string;
  title?: Title;
};

export const InsightsHeader: React.FC<InsightsHeaderProperties> = ({
  name = '',
  title = '' as Title,
  avatar = '',
  username = '',
}) => {
  const { value: timeClass, setValue: setTimeClass } = useQuery(
    'timeClass',
    TimeClass.blitz
  );
  const { value: variant, setValue: setVariant } = useQuery(
    'variant',
    Variant.chess
  );

  return (
    <header className="flex items-center justify-between gap-x-2">
      <div className="flex items-center gap-x-2 md:gap-x-4">
        <div
          className="aspect-square w-16 rounded-xl border bg-contain bg-center"
          style={{ backgroundImage: `url(${avatar})` }}
        />
        <div>
          <div className="flex items-center gap-x-2">
            {title ? (
              <span className="badge badge-primary badge-outline">{title}</span>
            ) : (
              <></>
            )}
            <div className="text-lg uppercase md:text-xl">{username}</div>
            <div>
              <Link
                href={`https://www.chess.com/member/${username}`}
                target="_blank">
                <FaChessPawn />
              </Link>
            </div>
          </div>
          <p className="truncate">{name}</p>
        </div>
      </div>
      <div className="join shadow">
        <select
          id="timeClass"
          name="timeClass"
          className="join-item select select-bordered w-full"
          value={timeClass}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            const newTimeClass: string = event.target.value;
            setTimeClass(newTimeClass);
          }}>
          <option value={TimeClass.daily}>Daily</option>
          <option value={TimeClass.rapid}>Rapid</option>
          <option value={TimeClass.blitz}>Blitz</option>
          <option value={TimeClass.bullet}>Bullet</option>
        </select>
        <select
          id="variant"
          name="variant"
          className="join-item select select-bordered w-full"
          value={variant}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            const newVariant: string = event.target.value;
            setVariant(newVariant);
          }}>
          <option value={Variant.chess}>Chess</option>
          <option value={Variant.chess960}>Chess960</option>
        </select>
      </div>
    </header>
  );
};

InsightsHeader.displayName = 'InsightsHeader';
