import {
  CHESS_DRAW_RESULTS,
  CHESS_LOSS_RESULTS,
  CHESS_WIN_RESULTS,
} from '@chess/constants/chess.constants';
import { DAYS_OF_WEEK, TIME_OF_DAYS } from '@chess/constants/time.constants';
import { prismaClient } from '@chess/prisma/prisma.client';
import {
  Phrase,
  Prisma,
  Result,
  TimeClass,
  Title,
  Variant,
} from '@chess/generated/prisma/client';
import {
  AverageByColumn,
  ChessSide,
  CountByColumn,
  GamesByDayOfWeek,
  GamesByTimeOfDay,
  GamesByYear,
  Geography,
  Insights,
  OpeningCount,
  Opponent,
  Pieces,
  ResultsByDayOfWeek,
  ResultsByEndPhrase,
  ResultsByOpponentRating,
  ResultsByTimeOfDay,
} from './insights.dto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

const FROM_CLAUSE = 'FROM chess."game" as g';

const buildWhereClause = ({
  username = '',
  results = [],
  accuracy = false,
  variant = Variant.chess,
  timeClass = TimeClass.blitz,
  rated = true,
  endPhrase = false,
}: {
  username?: string;
  variant?: Variant;
  accuracy?: boolean;
  timeClass?: TimeClass;
  results?: Result[];
  rated?: boolean;
  endPhrase?: boolean;
}) => {
  let whereResultsClause = '';
  if (results.length > 0) {
    const resultsString: string = results
      .map((result: Result) => `'${result}'`)
      .join(',');
    whereResultsClause = `TEXT(CASE WHEN g."white_username" = '${username}' THEN g."white_result" ELSE g."black_result" END) in (${resultsString})`;
  }

  const whereAccuracyClause: string = accuracy
    ? `g."white_accuracy" != 0 AND g."black_accuracy" != 0`
    : '';

  const whereUsernameClause: string =
    username.length > 0
      ? `(g."white_username"='${username}' OR g."black_username"='${username}')`
      : '';

  const whereTimeClassClause: string = timeClass
    ? `g."time_class" = '${timeClass}'`
    : '';

  const whereRuleClause: string = variant ? `g."rules" = '${variant}'` : '';

  const whereEndPhraseClause: string = endPhrase
    ? `g."end_phrase" IS NOT NULL`
    : '';

  const whereRatedClause: string = rated ? `g."rated" = true` : '';

  const whereClauses: string[] = [
    whereEndPhraseClause,
    whereTimeClassClause,
    whereAccuracyClause,
    whereUsernameClause,
    whereResultsClause,
    whereRatedClause,
    whereRuleClause,
  ];

  return `WHERE ${whereClauses
    .filter((clause: string) => clause !== '')
    .join(' AND ')}`;
};

const buildWhereInput = ({
  username = '',
  results = [],
  timeClass = TimeClass.blitz,
  variant = Variant.chess,
  rated = true,
}: {
  username?: string;
  variant?: Variant;
  results?: Result[];
  timeClass?: TimeClass;
  rated?: boolean;
} = {}): Prisma.GameWhereInput => {
  const whereResults =
    results.length > 0
      ? {
          OR: [
            { whiteUsername: username, whiteResult: { in: results } },
            { blackUsername: username, blackResult: { in: results } },
          ],
        }
      : { OR: [{ whiteUsername: username }, { blackUsername: username }] };
  return {
    ...whereResults,
    rated,
    rules: variant,
    timeClass: timeClass,
  };
};

const buildAverageClause = (username: string) =>
  `AVG(CASE WHEN g."white_username" = '${username}' THEN g."white_accuracy" ELSE g."black_accuracy" END) as "average"`;

const buildFunctionQuery = ({
  name = 'query',
  sqlFunction = 'count',
  column = '',
  accuracy = false,
  username = '',
  variant = Variant.chess,
  timeClass = TimeClass.blitz,
  results = [],
  rated = true,
  endPhrase = false,
}: {
  name?: string;
  sqlFunction?: 'count' | 'avg';
  column?:
    | 'year'
    | 'timeOfDay'
    | 'dayOfWeek'
    | 'result'
    | 'opponent'
    | 'endPhrase'
    | '';
  accuracy?: boolean;
  username?: string;
  variant?: Variant;
  timeClass?: TimeClass;
  results?: Result[];
  rated?: boolean;
  endPhrase?: boolean;
}): Prisma.Sql => {
  // SELECT
  const countClause: string = 'COUNT(*) as "count"';
  const averageClause: string = buildAverageClause(username);
  const functionClause: string =
    sqlFunction === 'count' ? countClause : averageClause;
  const columnClauses: Record<string, string> = {
    year: 'extract(year from g."end_time")::int',
    dayOfWeek: `extract(dow from g."end_time")`,
    timeOfDay: `floor(extract(hour from g."end_time") / 6.0)::int`,
    result: `CASE WHEN g."white_username" = '${username}' THEN g."white_result" ELSE g."black_result" END`,
    opponent: `floor((CASE WHEN g."white_username" = '${username}' THEN g."black_rating" ELSE g."white_rating" END) / 100)`,
    endPhrase: 'g."end_phrase"',
  };
  const columnClause: string =
    column.length > 0 ? `${columnClauses[column]} as "column"` : '';
  const selectClauses: string = [functionClause, columnClause]
    .filter((clause) => clause !== '')
    .join(', ');
  const selectClause: string = `SELECT ${selectClauses}`;
  // FROM
  const fromClause: string = `FROM chess."game" as g`;
  // WHERE
  const options = {
    accuracy,
    username,
    results,
    variant,
    timeClass,
    rated,
    endPhrase,
  };
  const whereClause: string = buildWhereClause(options);
  // GROUP BY
  const groupByClause: string = column.length > 0 ? `GROUP BY "column"` : '';
  const orderByClause: string = column.length > 0 ? `ORDER BY "column"` : '';
  // QUERY
  const query: string =
    `${selectClause} ${fromClause} ${whereClause} ${groupByClause} ${orderByClause}`.trim();
  console.info(
    {
      username,
      variant,
      timeClass,
      column,
      results,
      accuracy,
      endPhrase,
      sqlFunction,
    },
    `buildFunctionQuery name=${name} query=${query}`
  );
  return Prisma.raw(query);
};

const buildOpeningsQuery = ({
  username,
  side,
  limit = 10,
  variant = 'chess',
  timeClass = 'blitz',
}: {
  username: string;
  side: ChessSide;
  limit?: number;
  variant?: Variant;
  timeClass?: TimeClass;
}): Prisma.Sql => {
  const winResults: string = CHESS_WIN_RESULTS.map(
    (result: Result) => `'${result}'`
  ).join(',');
  const drawResults: string = CHESS_DRAW_RESULTS.map(
    (result: Result) => `'${result}'`
  ).join(',');
  const lossResults: string = CHESS_LOSS_RESULTS.map(
    (result: Result) => `'${result}'`
  ).join(',');
  const query: string = `SELECT g."opening",
g."opening_name",
COUNT(*) as total,
SUM(CASE WHEN g."${side}_result" IN (${winResults}) THEN 1 ELSE 0 END) as win,
SUM(CASE WHEN g."${side}_result" IN (${drawResults}) THEN 1 ELSE 0 END) as draw,
SUM(CASE WHEN g."${side}_result" IN (${lossResults}) THEN 1 ELSE 0 END) as loss
FROM chess."game" as g
WHERE g."opening" <> ''
AND g."rated" = true
AND g."rules" = '${variant}'
AND g."time_class" = '${timeClass}'
AND g."${side}_username" = '${username}'
GROUP BY g."opening", g."opening_name"
ORDER BY total DESC
LIMIT 10;`;
  console.info({ username, side, limit }, `buildOpeningsQuery query=${query}`);
  return Prisma.raw(query);
};

const buildMovesByPiecesQuery = ({
  username,
  variant = 'chess',
  timeClass = 'blitz',
}: {
  username: string;
  variant?: Variant;
  timeClass?: TimeClass;
}): Prisma.Sql => {
  const query: string = `SELECT
SUM(CASE WHEN g."white_username" = '${username}' THEN g."white_pawn" ELSE g."black_pawn" END) as pawn,
SUM(CASE WHEN g."white_username" = '${username}' THEN g."white_knight" ELSE g."black_knight" END) as knight,
SUM(CASE WHEN g."white_username" = '${username}' THEN g."white_bishop" ELSE g."black_bishop" END) as bishop,
SUM(CASE WHEN g."white_username" = '${username}' THEN g."white_rook" ELSE g."black_rook" END) as rook,
SUM(CASE WHEN g."white_username" = '${username}' THEN g."white_queen" ELSE g."black_queen" END) as queen,
SUM(CASE WHEN g."white_username" = '${username}' THEN g."white_king" ELSE g."black_king" END) as king
FROM chess."game" as g
WHERE (g."white_username" = '${username}' OR g."black_username" = '${username}')
AND g."rated" = true
AND g."rules" = '${variant}'
AND g."time_class" = '${timeClass}';`;
  console.info({ username }, `buildMovesByPiecesQuery query=${query}`);
  return Prisma.raw(query);
};

const buildSumMovesByCastlingQuery =
  (
    username: string,
    first: string,
    second: string
  ): ((results: Result[], column: string) => string) =>
  (results: Result[], column: string): string => {
    const resultsString: string = results
      .map((result: Result) => `'${result}'`)
      .join(',');
    return `SUM(CASE WHEN
  (CASE WHEN c."white_username" = '${username}' THEN c."white_castling" ELSE c."black_castling" END) = '${first}' AND
  (CASE WHEN c."white_username" = '${username}' THEN c."black_castling" ELSE c."white_castling" END) = '${second}' AND
  (CASE WHEN c."white_username" = '${username}' THEN c."white_result" ELSE c."black_result" END) IN (${resultsString}) THEN 1 ELSE 0 END
) as ${column}`;
  };

const buildMovesByCastlingQuery = ({
  username,
  variant = 'chess',
  timeClass = 'blitz',
}: {
  username: string;
  variant?: Variant;
  timeClass?: TimeClass;
}): Prisma.Sql => {
  const ssQuery = buildSumMovesByCastlingQuery(username, 'short', 'short');
  const ssw: string = ssQuery(CHESS_WIN_RESULTS, 'short_short_win');
  const ssd: string = ssQuery(CHESS_DRAW_RESULTS, 'short_short_draw');
  const ssl: string = ssQuery(CHESS_LOSS_RESULTS, 'short_short_loss');
  const slQuery = buildSumMovesByCastlingQuery(username, 'short', 'long');
  const slw: string = slQuery(CHESS_WIN_RESULTS, 'short_long_win');
  const sld: string = slQuery(CHESS_DRAW_RESULTS, 'short_long_draw');
  const sll: string = slQuery(CHESS_LOSS_RESULTS, 'short_long_loss');
  const snQuery = buildSumMovesByCastlingQuery(username, 'short', '');
  const snw: string = snQuery(CHESS_WIN_RESULTS, 'short_none_win');
  const snd: string = snQuery(CHESS_DRAW_RESULTS, 'short_none_draw');
  const snl: string = snQuery(CHESS_LOSS_RESULTS, 'short_none_loss');
  const lsQuery = buildSumMovesByCastlingQuery(username, 'long', 'short');
  const lsw: string = lsQuery(CHESS_WIN_RESULTS, 'long_short_win');
  const lsd: string = lsQuery(CHESS_DRAW_RESULTS, 'long_short_draw');
  const lsl: string = lsQuery(CHESS_LOSS_RESULTS, 'long_short_loss');
  const llQuery = buildSumMovesByCastlingQuery(username, 'long', 'long');
  const llw: string = llQuery(CHESS_WIN_RESULTS, 'long_long_win');
  const lld: string = llQuery(CHESS_DRAW_RESULTS, 'long_long_draw');
  const lll: string = llQuery(CHESS_LOSS_RESULTS, 'long_long_loss');
  const lnQuery = buildSumMovesByCastlingQuery(username, 'long', '');
  const lnw: string = lnQuery(CHESS_WIN_RESULTS, 'long_none_win');
  const lnd: string = lnQuery(CHESS_DRAW_RESULTS, 'long_none_draw');
  const lnl: string = lnQuery(CHESS_LOSS_RESULTS, 'long_none_loss');
  const nsQuery = buildSumMovesByCastlingQuery(username, '', 'short');
  const nsw: string = nsQuery(CHESS_WIN_RESULTS, 'none_short_win');
  const nsd: string = nsQuery(CHESS_DRAW_RESULTS, 'none_short_draw');
  const nsl: string = nsQuery(CHESS_LOSS_RESULTS, 'none_short_loss');
  const nlQuery = buildSumMovesByCastlingQuery(username, '', 'long');
  const nlw: string = nlQuery(CHESS_WIN_RESULTS, 'none_long_win');
  const nld: string = nlQuery(CHESS_DRAW_RESULTS, 'none_long_draw');
  const nll: string = nlQuery(CHESS_LOSS_RESULTS, 'none_long_loss');
  const nnQuery = buildSumMovesByCastlingQuery(username, '', '');
  const nnw: string = nnQuery(CHESS_WIN_RESULTS, 'none_none_win');
  const nnd: string = nnQuery(CHESS_DRAW_RESULTS, 'none_none_draw');
  const nnl: string = nnQuery(CHESS_LOSS_RESULTS, 'none_none_loss');
  const query: string = `SELECT
${ssw}, ${ssd}, ${ssl}, ${slw}, ${sld}, ${sll}, ${snw}, ${snd}, ${snl},
${lsw}, ${lsd}, ${lsl}, ${llw}, ${lld}, ${lll}, ${lnw}, ${lnd}, ${lnl},
${nsw}, ${nsd}, ${nsl}, ${nlw}, ${nld}, ${nll}, ${nnw}, ${nnd}, ${nnl}
FROM chess."game" as c
WHERE (c."white_username" = '${username}' OR c."black_username" = '${username}')
AND c."rated" = true
AND c."rules" = '${variant}'
AND c."time_class" = '${timeClass}';`;
  console.info({ username }, `buildMovesByCastlingQuery query=${query}`);
  return Prisma.raw(query);
};

const buildGeographyQuery = ({
  username,
  variant = 'chess',
  timeClass = 'blitz',
}: {
  username: string;
  variant?: Variant;
  timeClass?: TimeClass;
}) => {
  const winResults: string = CHESS_WIN_RESULTS.map(
    (result: Result) => `'${result}'`
  ).join(',');
  const drawResults: string = CHESS_DRAW_RESULTS.map(
    (result: Result) => `'${result}'`
  ).join(',');
  const lossResults: string = CHESS_LOSS_RESULTS.map(
    (result: Result) => `'${result}'`
  ).join(',');
  const query: string = `SELECT
c."flag",
p."country_code" as code,
c."name",
COUNT(p."country_code") as total,
SUM(CASE WHEN (CASE WHEN g."white_username" = '${username}' THEN g."white_result" ELSE g."black_result" END) IN (${winResults}) THEN 1 ELSE 0 END) as win,
SUM(CASE WHEN (CASE WHEN g."white_username" = '${username}' THEN g."white_result" ELSE g."black_result" END) IN (${drawResults}) THEN 1 ELSE 0 END) as draw,
SUM(CASE WHEN (CASE WHEN g."white_username" = '${username}' THEN g."white_result" ELSE g."black_result" END) IN (${lossResults}) THEN 1 ELSE 0 END) as loss
FROM chess."game" as g
JOIN chess."player" as p
ON (CASE g."white_username" WHEN '${username}' THEN g."black_username" ELSE g."white_username" END) = p."username"
JOIN chess."country" as c
ON c."cca2" = p."country_code"
WHERE (g."white_username" = '${username}' OR g."black_username" = '${username}')
AND g."rated" = true
AND g."rules" = '${variant}'
AND g."time_class" = '${timeClass}'
GROUP BY c."flag", p."country_code", c."name"
ORDER BY total DESC;`;
  return Prisma.raw(query);
};

const buildOpponentsQuery = ({
  username = '',
  limit = 100,
  variant = Variant.chess,
  timeClass = TimeClass.blitz,
  rated = true,
}: {
  username?: string;
  limit?: number;
  variant?: Variant;
  timeClass?: TimeClass;
  rated?: boolean;
}): Prisma.Sql => {
  const winResults: string = CHESS_WIN_RESULTS.map(
    (result: Result) => `'${result}'`
  ).join(',');
  const drawResults: string = CHESS_DRAW_RESULTS.map(
    (result: Result) => `'${result}'`
  ).join(',');
  const lossResults: string = CHESS_LOSS_RESULTS.map(
    (result: Result) => `'${result}'`
  ).join(',');
  const selectOpponentClause: string = `(CASE WHEN g."white_username" = '${username}' THEN g."black_username" ELSE g."white_username" END) as "opponent"`;
  const selectCountGamesClause: string = 'COUNT(*) as "games"';
  const selectCountWinClause: string = `COUNT(1) FILTER (WHERE (CASE WHEN g."white_username" = '${username}' THEN g."white_result" ELSE g."black_result" END) in (${winResults})) as "win"`;
  const selectCountDrawClause: string = `COUNT(1) FILTER (WHERE (CASE WHEN g."white_username" = '${username}' THEN g."white_result" ELSE g."black_result" END) in (${drawResults})) as "draw"`;
  const selectCountLossClause: string = `COUNT(1) FILTER (WHERE (CASE WHEN g."white_username" = '${username}' THEN g."white_result" ELSE g."black_result" END) in (${lossResults})) as "loss"`;
  const selectClause: string = `SELECT ${selectOpponentClause}, ${selectCountGamesClause}, ${selectCountWinClause}, ${selectCountDrawClause}, ${selectCountLossClause}`;
  // WHERE
  const options = { username, variant, timeClass, rated };
  const whereClause: string = buildWhereClause(options);
  // GROUP BY and ORDER BY and LIMIT
  const groupByClause: string = 'GROUP BY "opponent"';
  const orderByClause: string = 'ORDER BY "games" DESC';
  const limitClause: string = `LIMIT ${limit}`;
  // QUERY
  const query = `${selectClause} ${FROM_CLAUSE} ${whereClause} ${groupByClause} ${orderByClause} ${limitClause};`;
  console.info(
    { username, timeClass, variant },
    `buildOpponentsQuery query=${query}`
  );
  return Prisma.raw(query);
};

export const getInsights = async ({
  username,
  variant = Variant.chess,
  timeClass = TimeClass.blitz,
  rated = true,
}: {
  username: string;
  variant: Variant;
  timeClass: TimeClass;
  rated: boolean;
}): Promise<Insights> => {
  try {
    const { avatar, title, name } = await prismaClient.player.findFirstOrThrow({
      where: { username },
    });
    const baseOptions = { username, timeClass, variant, rated };
    // Accuracy
    const averageAccuracyQuery: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'averageAccuracyQuery',
      sqlFunction: 'avg',
      accuracy: true,
    });
    const averageAccuracyQueryByWinResults: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'averageAccuracyQueryByWinResults',
      sqlFunction: 'avg',
      accuracy: true,
      results: CHESS_WIN_RESULTS,
    });
    const averageAccuracyQueryByDrawResults: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'averageAccuracyQueryByDrawResults',
      sqlFunction: 'avg',
      accuracy: true,
      results: CHESS_DRAW_RESULTS,
    });
    const averageAccuracyQueryByLossResults: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'averageAccuracyQueryByLossResults',
      sqlFunction: 'avg',
      accuracy: true,
      results: CHESS_LOSS_RESULTS,
    });
    const averageAccuracyQueryByYears: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'averageAccuracyQueryByYears',
      sqlFunction: 'avg',
      accuracy: true,
      column: 'year',
    });
    const averageAccuracyQueryByTimeOfDay: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'averageAccuracyQueryByTimeOfDay',
      sqlFunction: 'avg',
      accuracy: true,
      column: 'timeOfDay',
    });
    const averageAccuracyQueryByDayOfWeek: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'averageAccuracyQueryByDayOfWeek',
      sqlFunction: 'avg',
      accuracy: true,
      column: 'dayOfWeek',
    });
    // Games
    const totalGamesWhere: Prisma.GameWhereInput = buildWhereInput(baseOptions);
    const winGamesWhere: Prisma.GameWhereInput = buildWhereInput({
      ...baseOptions,
      results: CHESS_WIN_RESULTS,
    });
    const drawGamesWhere: Prisma.GameWhereInput = buildWhereInput({
      ...baseOptions,
      results: CHESS_DRAW_RESULTS,
    });
    const lossGamesWhere: Prisma.GameWhereInput = buildWhereInput({
      ...baseOptions,
      results: CHESS_LOSS_RESULTS,
    });
    const gamesQueryByYear: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'gamesQueryByYear',
      column: 'year',
    });
    const gamesQueryByTimeOfDay: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'gamesQueryByTimeOfDay',
      column: 'timeOfDay',
    });
    const gamesQueryByDayOfWeek: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'gamesQueryByDayOfWeek',
      column: 'dayOfWeek',
    });
    // Openings
    const whiteOpeningsQuery: Prisma.Sql = buildOpeningsQuery({
      variant,
      username,
      timeClass,
      limit: 10,
      side: 'white',
    });
    const blackOpeningsQuery: Prisma.Sql = buildOpeningsQuery({
      variant,
      username,
      timeClass,
      limit: 10,
      side: 'black',
    });
    // Moves
    const movesByPiecesQuery: Prisma.Sql = buildMovesByPiecesQuery({
      variant,
      username,
      timeClass,
    });
    const movesByCastlingQuery: Prisma.Sql = buildMovesByCastlingQuery({
      variant,
      username,
      timeClass,
    });
    // Geography
    const geographyQuery: Prisma.Sql = buildGeographyQuery({
      variant,
      username,
      timeClass,
    });
    // Opponents
    const opponentsQuery = buildOpponentsQuery({
      ...baseOptions,
      limit: 100,
    });
    // Results
    const winResultsQuery: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'winResultsQuery',
      column: 'result',
      results: CHESS_WIN_RESULTS,
    });
    const drawResultsQuery: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'drawResultsQuery',
      column: 'result',
      results: CHESS_DRAW_RESULTS,
    });
    const lossResultsQuery: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'lossResultsQuery',
      column: 'result',
      results: CHESS_LOSS_RESULTS,
    });
    const winResultsQueryByTimeOfDay: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'winResultsQueryByTimeOfDay',
      column: 'timeOfDay',
      results: CHESS_WIN_RESULTS,
    });
    const drawResultsQueryByTimeOfDay: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'drawResultsQueryByTimeOfDay',
      column: 'timeOfDay',
      results: CHESS_DRAW_RESULTS,
    });
    const lossResultsQueryByTimeOfDay: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'lossResultsQueryByTimeOfDay',
      column: 'timeOfDay',
      results: CHESS_LOSS_RESULTS,
    });
    const winResultsQueryByDayOfWeek: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'winResultsQueryByDayOfWeek',
      column: 'dayOfWeek',
      results: CHESS_WIN_RESULTS,
    });
    const drawResultsQueryByDayOfWeek: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'drawResultsQueryByDayOfWeek',
      column: 'dayOfWeek',
      results: CHESS_DRAW_RESULTS,
    });
    const lossResultsQueryByDayOfWeek: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'lossResultsQueryByDayOfWeek',
      column: 'dayOfWeek',
      results: CHESS_LOSS_RESULTS,
    });
    const winResultsQueryByOpponentRating: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'winResultsQueryByOpponentRating',
      column: 'opponent',
      results: CHESS_WIN_RESULTS,
    });
    const drawResultsQueryByOpponentRating: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'drawResultsQueryByOpponentRating',
      column: 'opponent',
      results: CHESS_DRAW_RESULTS,
    });
    const lossResultsQueryByOpponentRating: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      name: 'lossResultsQueryByOpponentRating',
      column: 'opponent',
      results: CHESS_LOSS_RESULTS,
    });
    const winResultsQueryByEndPhrase: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      endPhrase: true,
      name: 'winResultsQueryByEndPhrase',
      column: 'endPhrase',
      results: CHESS_WIN_RESULTS,
    });
    const drawResultsQueryByEndPhrase: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      endPhrase: true,
      name: 'drawResultsQueryByEndPhrase',
      column: 'endPhrase',
      results: CHESS_DRAW_RESULTS,
    });
    const lossResultsQueryByEndPhrase: Prisma.Sql = buildFunctionQuery({
      ...baseOptions,
      endPhrase: true,
      name: 'lossResultsQueryByEndPhrase',
      column: 'endPhrase',
      results: CHESS_LOSS_RESULTS,
    });
    const [
      // Accuracy
      [{ average = 0 }] = [{ average: 0 }],
      [{ average: win = 0 }] = [{ average: 0 }],
      [{ average: draw = 0 }] = [{ average: 0 }],
      [{ average: loss = 0 }] = [{ average: 0 }],
      averageAccuracyByYearsList = [],
      averageAccuracyByTimeOfDaysList = [],
      averageAccuracyByDaysOfWeekList = [],
      // Openings
      whiteOpenings = [],
      blackOpenings = [],
      // Moves
      [{ king = 0, queen = 0, rook = 0, bishop = 0, knight = 0, pawn = 0 }] = [
        { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 },
      ],
      [
        {
          short_short_win = 0,
          short_short_draw = 0,
          short_short_loss = 0,
          short_long_win = 0,
          short_long_draw = 0,
          short_long_loss = 0,
          short_none_win = 0,
          short_none_draw = 0,
          short_none_loss = 0,
          long_short_win = 0,
          long_short_draw = 0,
          long_short_loss = 0,
          long_long_win = 0,
          long_long_draw = 0,
          long_long_loss = 0,
          long_none_win = 0,
          long_none_draw = 0,
          long_none_loss = 0,
          none_short_win = 0,
          none_short_draw = 0,
          none_short_loss = 0,
          none_long_win = 0,
          none_long_draw = 0,
          none_long_loss = 0,
          none_none_win = 0,
          none_none_draw = 0,
          none_none_loss = 0,
        },
      ] = [
        {
          short_short_win: 0,
          short_short_draw: 0,
          short_short_loss: 0,
          short_long_win: 0,
          short_long_draw: 0,
          short_long_loss: 0,
          short_none_win: 0,
          short_none_draw: 0,
          short_none_loss: 0,
          long_short_win: 0,
          long_short_draw: 0,
          long_short_loss: 0,
          long_long_win: 0,
          long_long_draw: 0,
          long_long_loss: 0,
          long_none_win: 0,
          long_none_draw: 0,
          long_none_loss: 0,
          none_short_win: 0,
          none_short_draw: 0,
          none_short_loss: 0,
          none_long_win: 0,
          none_long_draw: 0,
          none_long_loss: 0,
          none_none_win: 0,
          none_none_draw: 0,
          none_none_loss: 0,
        },
      ],
      // Geography
      geography = [],
      // Opponents
      opponents = [],
      // Games
      totalGames = 0,
      winGames = 0,
      drawGames = 0,
      lossGames = 0,
      gamesByYearsList = [],
      gamesByTimeOfDaysList = [],
      gamesByDaysOfWeekList = [],
      // Results
      winResults = [],
      drawResults = [],
      lossResults = [],
      winResultsByTimeOfDays = [],
      drawResultsByTimeOfDays = [],
      lossResultsByTimeOfDays = [],
      winResultsByDaysOfWeek = [],
      drawResultsByDaysOfWeek = [],
      lossResultsByDaysOfWeek = [],
      winResultsByOpponentRating = [],
      drawResultsByOpponentRating = [],
      lossResultsByOpponentRating = [],
      winResultsByEndPhrase = [],
      drawResultsByEndPhrase = [],
      lossResultsByEndPhrase = [],
    ] = await prismaClient.$transaction([
      // Accuracy
      prismaClient.$queryRaw<AverageByColumn[]>(averageAccuracyQuery),
      prismaClient.$queryRaw<AverageByColumn[]>(
        averageAccuracyQueryByWinResults
      ),
      prismaClient.$queryRaw<AverageByColumn[]>(
        averageAccuracyQueryByDrawResults
      ),
      prismaClient.$queryRaw<AverageByColumn[]>(
        averageAccuracyQueryByLossResults
      ),
      prismaClient.$queryRaw<AverageByColumn[]>(averageAccuracyQueryByYears),
      prismaClient.$queryRaw<AverageByColumn[]>(
        averageAccuracyQueryByTimeOfDay
      ),
      prismaClient.$queryRaw<AverageByColumn[]>(
        averageAccuracyQueryByDayOfWeek
      ),
      // Openings
      prismaClient.$queryRaw<OpeningCount[]>(whiteOpeningsQuery),
      prismaClient.$queryRaw<OpeningCount[]>(blackOpeningsQuery),
      // Moves
      prismaClient.$queryRaw<Pieces[]>(movesByPiecesQuery),
      prismaClient.$queryRaw<
        {
          short_short_win: number;
          short_short_draw: number;
          short_short_loss: number;
          short_long_win: number;
          short_long_draw: number;
          short_long_loss: number;
          short_none_win: number;
          short_none_draw: number;
          short_none_loss: number;
          long_short_win: number;
          long_short_draw: number;
          long_short_loss: number;
          long_long_win: number;
          long_long_draw: number;
          long_long_loss: number;
          long_none_win: number;
          long_none_draw: number;
          long_none_loss: number;
          none_short_win: number;
          none_short_draw: number;
          none_short_loss: number;
          none_long_win: number;
          none_long_draw: number;
          none_long_loss: number;
          none_none_win: number;
          none_none_draw: number;
          none_none_loss: number;
        }[]
      >(movesByCastlingQuery),
      // Geography
      prismaClient.$queryRaw<Geography[]>(geographyQuery),
      // Opponents
      prismaClient.$queryRaw<Opponent[]>(opponentsQuery),
      // Games
      prismaClient.game.count({ where: totalGamesWhere }),
      prismaClient.game.count({ where: winGamesWhere }),
      prismaClient.game.count({ where: drawGamesWhere }),
      prismaClient.game.count({ where: lossGamesWhere }),
      prismaClient.$queryRaw<CountByColumn[]>(gamesQueryByYear),
      prismaClient.$queryRaw<CountByColumn[]>(gamesQueryByTimeOfDay),
      prismaClient.$queryRaw<CountByColumn[]>(gamesQueryByDayOfWeek),
      // Results
      prismaClient.$queryRaw<CountByColumn[]>(winResultsQuery),
      prismaClient.$queryRaw<CountByColumn[]>(drawResultsQuery),
      prismaClient.$queryRaw<CountByColumn[]>(lossResultsQuery),
      prismaClient.$queryRaw<CountByColumn[]>(winResultsQueryByTimeOfDay),
      prismaClient.$queryRaw<CountByColumn[]>(drawResultsQueryByTimeOfDay),
      prismaClient.$queryRaw<CountByColumn[]>(lossResultsQueryByTimeOfDay),
      prismaClient.$queryRaw<CountByColumn[]>(winResultsQueryByDayOfWeek),
      prismaClient.$queryRaw<CountByColumn[]>(drawResultsQueryByDayOfWeek),
      prismaClient.$queryRaw<CountByColumn[]>(lossResultsQueryByDayOfWeek),
      prismaClient.$queryRaw<CountByColumn[]>(winResultsQueryByOpponentRating),
      prismaClient.$queryRaw<CountByColumn[]>(drawResultsQueryByOpponentRating),
      prismaClient.$queryRaw<CountByColumn[]>(lossResultsQueryByOpponentRating),
      prismaClient.$queryRaw<CountByColumn[]>(winResultsQueryByEndPhrase),
      prismaClient.$queryRaw<CountByColumn[]>(drawResultsQueryByEndPhrase),
      prismaClient.$queryRaw<CountByColumn[]>(lossResultsQueryByEndPhrase),
    ]);
    // Accuracy
    const accuracy = {
      average,
      win,
      draw,
      loss,
      periods: averageAccuracyByYearsList.map(
        ({ average = 0, column = '' }) => ({
          average,
          period: column,
        })
      ),
      timeOfDays: averageAccuracyByTimeOfDaysList.map(
        ({ average: averageOfTimeOfDays = 0, column = 0 }) => ({
          average: averageOfTimeOfDays,
          timeOfDay: [...TIME_OF_DAYS][`${column}`],
        })
      ),
      daysOfWeek: averageAccuracyByDaysOfWeekList.map(
        ({ average: averageOfDaysOfWeek = 0, column = 0 }) => ({
          average: averageOfDaysOfWeek,
          dayOfWeek: [...DAYS_OF_WEEK][`${column}`],
        })
      ),
    };
    // Games by Years
    const gamesByYears: GamesByYear[] = gamesByYearsList.map(
      ({ count: games = 0, column = 0 }) => ({
        games: parseInt(games.toString(), 10),
        period: column,
      })
    );
    // Games by Time of Day
    const gamesByTimeOfDays: GamesByTimeOfDay[] = gamesByTimeOfDaysList.map(
      ({ count: games = 0, column = 0 }) => ({
        games: parseInt(games.toString(), 10),
        timeOfDay: [...TIME_OF_DAYS][`${column}`],
      })
    );
    // Games by Day of Week
    const gamesByDaysOfWeek: GamesByDayOfWeek[] = gamesByDaysOfWeekList.map(
      ({ count: games = 0, column = 0 }) => ({
        games: parseInt(games.toString(), 10),
        dayOfWeek: [...DAYS_OF_WEEK][`${column}`],
      })
    );
    // Games
    const games = {
      total: totalGames,
      win: winGames,
      draw: drawGames,
      loss: lossGames,
      periods: gamesByYears,
      timeOfDays: gamesByTimeOfDays,
      daysOfWeek: gamesByDaysOfWeek,
    };

    // Results by Time of Day
    const resultsByTimeOfDays: ResultsByTimeOfDay[] =
      winResultsByTimeOfDays.map(({ count: win = 0, column = 0 }) => {
        const timeOfDay: string = [...TIME_OF_DAYS][
          `${Number.parseInt(column.toString())}`
        ];
        const { count: draw = 0 } = drawResultsByTimeOfDays.find(
          ({ column: drawColumn = 0 }) =>
            drawColumn.toString() === column.toString()
        ) ?? { draw: 0 };
        const { count: loss = 0 } = lossResultsByTimeOfDays.find(
          ({ column: lossColumn = 0 }) =>
            lossColumn.toString() === column.toString()
        ) ?? { count: 0 };
        return {
          timeOfDay,
          win: parseInt(win.toString(), 10),
          draw: parseInt(draw.toString(), 10),
          loss: parseInt(loss.toString(), 10),
        };
      });
    // Results by Day of Week
    const resultsByDaysOfWeek: ResultsByDayOfWeek[] =
      winResultsByDaysOfWeek.map(({ count: win = 0, column = 0 }) => {
        const dayOfWeek: string = [...DAYS_OF_WEEK][
          `${Number.parseInt(column.toString())}`
        ];
        const { count: draw = 0 } = drawResultsByDaysOfWeek.find(
          ({ column: drawColumn = 0 }) =>
            drawColumn.toString() === column.toString()
        ) ?? { draw: 0 };
        const { count: loss = 0 } = lossResultsByDaysOfWeek.find(
          ({ column: lossColumn = 0 }) =>
            lossColumn.toString() === column.toString()
        ) ?? { count: 0 };
        return {
          dayOfWeek,
          win: parseInt(win.toString(), 10),
          draw: parseInt(draw.toString(), 10),
          loss: parseInt(loss.toString(), 10),
        };
      });
    // Results by Opponent Rating
    const ratings: Set<number> = new Set(
      [
        ...winResultsByOpponentRating,
        ...drawResultsByOpponentRating,
        ...lossResultsByOpponentRating,
      ].map(({ column }) => column)
    );
    const resultsByOpponentRating: ResultsByOpponentRating[] = [...ratings]
      .map((rating: number) => {
        const { count: win = 0 } = winResultsByOpponentRating.find(
          ({ column: winRating = 0 }) =>
            winRating.toString() === rating.toString()
        ) ?? { count: 0 };
        const { count: draw = 0 } = drawResultsByOpponentRating.find(
          ({ column: drawRating = 0 }) =>
            drawRating.toString() === rating.toString()
        ) ?? { count: 0 };
        const { count: loss = 0 } = lossResultsByOpponentRating.find(
          ({ column: lossRating = 0 }) =>
            lossRating.toString() === rating.toString()
        ) ?? { count: 0 };
        return {
          rating: rating * 100,
          win: parseInt(win.toString(), 10),
          draw: parseInt(draw.toString(), 10),
          loss: parseInt(loss.toString(), 10),
        };
      })
      .sort((a, b) => (a.rating > b.rating ? 1 : -1));
    // Results by
    const endPhrases = new Set(
      [
        ...winResultsByEndPhrase,
        ...drawResultsByEndPhrase,
        ...lossResultsByEndPhrase,
      ].map(({ column }) => column)
    );
    const resultsByEndPhrase: ResultsByEndPhrase[] = [...endPhrases].map(
      (endPhrase: number) => {
        const { count: win = 0 } = winResultsByEndPhrase.find(
          ({ column: winPhrase = 0 }) =>
            winPhrase.toString() === endPhrase.toString()
        ) ?? { count: 0 };
        const { count: draw = 0 } = drawResultsByEndPhrase.find(
          ({ column: drawPhrase = 0 }) =>
            drawPhrase.toString() === endPhrase.toString()
        ) ?? { count: 0 };
        const { count: loss = 0 } = lossResultsByEndPhrase.find(
          ({ column: lossPhrase = 0 }) =>
            lossPhrase.toString() === endPhrase.toString()
        ) ?? { count: 0 };
        return {
          phrase: endPhrase.toString() as Phrase,
          win: parseInt(win.toString(), 10),
          draw: parseInt(draw.toString(), 10),
          loss: parseInt(loss.toString(), 10),
        };
      }
    );
    // Results
    const results = {
      win: winResults.map(({ column = 0, count = 0 }) => ({
        result: column.toString(),
        count: parseInt(count.toString(), 10),
      })),
      draw: drawResults.map(({ column = 0, count = 0 }) => ({
        result: column.toString(),
        count: parseInt(count.toString(), 10),
      })),
      loss: lossResults.map(({ column = 0, count = 0 }) => ({
        result: column.toString(),
        count: parseInt(count.toString(), 10),
      })),
      timeOfDays: resultsByTimeOfDays,
      daysOfWeek: resultsByDaysOfWeek,
      opponents: resultsByOpponentRating,
      endPhrases: resultsByEndPhrase,
    };
    // Disconect
    await prismaClient.$disconnect();
    return {
      username,
      avatar,
      title,
      name,
      accuracy,
      results,
      games,
      openings: {
        white: whiteOpenings.map(
          ({
            opening = '',
            opening_name = '',
            pgn = '',
            total,
            win,
            draw,
            loss,
          }: OpeningCount) => ({
            opening,
            opening_name,
            pgn,
            total: parseInt(total.toString(), 10),
            win: parseInt(win.toString(), 10),
            draw: parseInt(draw.toString(), 10),
            loss: parseInt(loss.toString(), 10),
          })
        ),
        black: blackOpenings.map(
          ({
            opening = '',
            opening_name = '',
            pgn = '',
            total,
            win,
            draw,
            loss,
          }: OpeningCount) => ({
            opening,
            opening_name,
            pgn,
            total: parseInt(total.toString(), 10),
            win: parseInt(win.toString(), 10),
            draw: parseInt(draw.toString(), 10),
            loss: parseInt(loss.toString(), 10),
          })
        ),
      },
      moves: {
        pieces: {
          king: parseInt(king.toString(), 10),
          queen: parseInt(queen.toString(), 10),
          rook: parseInt(rook.toString(), 10),
          bishop: parseInt(bishop.toString(), 10),
          knight: parseInt(knight.toString(), 10),
          pawn: parseInt(pawn.toString(), 10),
        },
        castling: {
          short: {
            short: {
              win: parseInt(short_short_win.toString(), 10),
              draw: parseInt(short_short_draw.toString(), 10),
              loss: parseInt(short_short_loss.toString(), 10),
            },
            long: {
              win: parseInt(short_long_win.toString(), 10),
              draw: parseInt(short_long_draw.toString(), 10),
              loss: parseInt(short_long_loss.toString(), 10),
            },
            none: {
              win: parseInt(short_none_win.toString(), 10),
              draw: parseInt(short_none_draw.toString(), 10),
              loss: parseInt(short_none_loss.toString(), 10),
            },
          },
          long: {
            short: {
              win: parseInt(long_short_win.toString(), 10),
              draw: parseInt(long_short_draw.toString(), 10),
              loss: parseInt(long_short_loss.toString(), 10),
            },
            long: {
              win: parseInt(long_long_win.toString(), 10),
              draw: parseInt(long_long_draw.toString(), 10),
              loss: parseInt(long_long_loss.toString(), 10),
            },
            none: {
              win: parseInt(long_none_win.toString(), 10),
              draw: parseInt(long_none_draw.toString(), 10),
              loss: parseInt(long_none_loss.toString(), 10),
            },
          },
          none: {
            short: {
              win: parseInt(none_short_win.toString(), 10),
              draw: parseInt(none_short_draw.toString(), 10),
              loss: parseInt(none_short_loss.toString(), 10),
            },
            long: {
              win: parseInt(none_long_win.toString(), 10),
              draw: parseInt(none_long_draw.toString(), 10),
              loss: parseInt(none_long_loss.toString(), 10),
            },
            none: {
              win: parseInt(none_none_win.toString(), 10),
              draw: parseInt(none_none_draw.toString(), 10),
              loss: parseInt(none_none_loss.toString(), 10),
            },
          },
        },
      },
      geography: geography.map(
        ({
          flag = '',
          code = '',
          name = '',
          total = 0,
          win = 0,
          draw = 0,
          loss = 0,
        }) => ({
          flag,
          code,
          name,
          total: parseInt(total.toString(), 10),
          win: parseInt(win.toString(), 10),
          draw: parseInt(draw.toString(), 10),
          loss: parseInt(loss.toString(), 10),
        })
      ),
      opponents: opponents.map(
        ({ opponent = '', games = 0, win = 0, draw = 0, loss = 0 }) => ({
          opponent,
          games: parseInt(games?.toString() ?? '0', 10),
          win: parseInt(win?.toString() ?? '0', 10),
          draw: parseInt(draw?.toString() ?? '0', 10),
          loss: parseInt(loss?.toString() ?? '0', 10),
        })
      ),
    };
  } catch (error) {
    console.error(`getInsights error=${error}`);
    return { username } as Insights;
  }
};

export const getTitled = async ({
  days,
  title,
  countryCode,
}: {
  days?: Days;
  title?: Title;
  countryCode?: string;
}) => {
  const { count, overall } = await getDescriptive({ days, title, countryCode });
  const countries = await getCountries({ days, title, countryCode });
  const distribution = await getDistribution({ days, title, countryCode });
  const leaderboard = await getLeaderboard({ days, title, countryCode });
  await prismaClient.$disconnect();
  return { count, overall, distribution, countries, leaderboard };
};

type Descriptive = {
  count_total: number;
  count_gm: number;
  count_im: number;
  count_fm: number;
  count_cm: number;
  count_nm: number;
  count_wgm: number;
  count_wim: number;
  count_wfm: number;
  count_wcm: number;
  count_wnm: number;
  average_rapid_rating_best: number;
  average_blitz_rating_best: number;
  average_bullet_rating_best: number;
  max_rapid_rating_best: number;
  max_blitz_rating_best: number;
  max_bullet_rating_best: number;
};

export type Days = 7 | 30 | 90 | 366;

const buildPlayersWhereClause = (
  {
    days,
    title,
    countryCode,
  }: {
    days?: Days;
    title?: Title;
    countryCode?: string;
  },
  extra: string[] = []
) => {
  const where: string[] = extra;
  if (title) where.push(`p."title" = '${title}'`);
  if (countryCode) where.push(`p."country_code" = '${countryCode}'`);
  if (days) where.push(`p."last_online" > now() - interval '${days} days'`);
  const whereClause = where.length === 0 ? '' : `WHERE ${where.join(' AND ')}`;
  console.info(`whereClause=${whereClause}`);
  return whereClause;
};

export const getDescriptive = async ({
  days,
  title,
  countryCode,
}: {
  days?: Days;
  title?: Title;
  countryCode?: string;
}) => {
  try {
    const query: string = `-- Descriptive (Count - Average - Max) --
SELECT COUNT(p."username") AS "count_total", -- Count - Total
SUM(CASE WHEN p."title" = 'GM' then 1 else 0 end) AS "count_gm", -- Count - GM
SUM(CASE WHEN p."title" = 'IM' then 1 else 0 end) AS "count_im", -- Count - IM
SUM(CASE WHEN p."title" = 'FM' then 1 else 0 end) AS "count_fm", -- Count - FM
SUM(CASE WHEN p."title" = 'CM' then 1 else 0 end) AS "count_cm", -- Count - CM
SUM(CASE WHEN p."title" = 'NM' then 1 else 0 end) AS "count_nm", -- Count - NM
SUM(CASE WHEN p."title" = 'WGM' then 1 else 0 end) AS "count_wgm", -- Count - WGM
SUM(CASE WHEN p."title" = 'WIM' then 1 else 0 end) AS "count_wim", -- Count - WIM
SUM(CASE WHEN p."title" = 'WFM' then 1 else 0 end) AS "count_wfm", -- Count - WFM
SUM(CASE WHEN p."title" = 'WCM' then 1 else 0 end) AS "count_wcm", -- Count - WCM
SUM(CASE WHEN p."title" = 'WNM' then 1 else 0 end) AS "count_wnm", -- Count - WNM
CAST(ROUND(AVG(CASE WHEN p."rapid_rating_best" <> 0 THEN p."rapid_rating_best" ELSE NULL END), 2) AS FLOAT) AS "average_rapid_rating_best", -- Average
CAST(ROUND(AVG(CASE WHEN p."blitz_rating_best" <> 0 THEN p."blitz_rating_best" ELSE NULL END), 2) AS FLOAT) AS "average_blitz_rating_best", -- Average
CAST(ROUND(AVG(CASE WHEN p."bullet_rating_best" <> 0 THEN p."bullet_rating_best" ELSE NULL END), 2) AS FLOAT) AS "average_bullet_rating_best", -- Average
MAX(p."rapid_rating_best") AS "max_rapid_rating_best", -- Max
MAX(p."blitz_rating_best") AS "max_blitz_rating_best", -- Max
MAX(p."bullet_rating_best") AS "max_bullet_rating_best" -- Max
FROM chess."player" AS p
${buildPlayersWhereClause({ days, title, countryCode })};`;
    const sql = Prisma.raw(query);
    const results: Descriptive[] = await prismaClient.$queryRaw(sql);
    const result = results[0];
    const {
      count_total: total = 0,
      count_gm: gm = 0,
      count_im: im = 0,
      count_fm: fm = 0,
      count_cm: cm = 0,
      count_nm: nm = 0,
      count_wgm: wgm = 0,
      count_wim: wim = 0,
      count_wfm: wfm = 0,
      count_wcm: wcm = 0,
      count_wnm: wnm = 0,
      average_rapid_rating_best = 0,
      average_blitz_rating_best = 0,
      average_bullet_rating_best = 0,
      max_rapid_rating_best = 0,
      max_blitz_rating_best = 0,
      max_bullet_rating_best = 0,
    } = result;
    return {
      count: { total, gm, im, fm, cm, nm, wgm, wim, wfm, wcm, wnm },
      overall: {
        rapid: {
          average: average_rapid_rating_best,
          max: max_rapid_rating_best,
        },
        blitz: {
          average: average_blitz_rating_best,
          max: max_blitz_rating_best,
        },
        bullet: {
          average: average_bullet_rating_best,
          max: max_bullet_rating_best,
        },
      },
    };
  } catch (error) {
    console.error(`getDescriptive error=${error}`);
    return {
      count: {
        total: 0,
        gm: 0,
        im: 0,
        fm: 0,
        cm: 0,
        nm: 0,
        wgm: 0,
        wim: 0,
        wfm: 0,
        wcm: 0,
        wnm: 0,
      },
      rapid: { average: 0, max: 0 },
      blitz: { average: 0, max: 0 },
      bullet: { average: 0, max: 0 },
    };
  }
};

export type TimeClassKey = `${TimeClass}_group` | `${TimeClass}_total`;

export const getDistributionByTimeClass = async ({
  days,
  title,
  countryCode,
  timeClass,
}: {
  days?: Days;
  title?: Title;
  countryCode?: string;
  timeClass: TimeClass;
}): Promise<{ group: number; total: number }[]> => {
  try {
    const query: string = `SELECT COUNT(p."username") AS "total", (FLOOR((p."${timeClass}_rating_last" / 100)) * 100) AS "group" FROM chess."player" AS p ${buildPlayersWhereClause({ days, title, countryCode }, [`(FLOOR((p."${timeClass}_rating_last" / 100)) * 100) <> 0`])} GROUP BY "group" ORDER BY "group";`;
    const sql = Prisma.raw(query);
    return prismaClient.$queryRaw(sql);
  } catch (error) {
    console.error(`getDistributionByTimeClass error=${error}`);
    return [];
  }
};

export const getDistribution = async ({
  days,
  title,
  countryCode,
}: {
  days?: Days;
  title?: Title;
  countryCode?: string;
}) => {
  const rapid = await getDistributionByTimeClass({
    days,
    title,
    countryCode,
    timeClass: 'rapid',
  });
  const blitz = await getDistributionByTimeClass({
    days,
    title,
    countryCode,
    timeClass: 'blitz',
  });
  const bullet = await getDistributionByTimeClass({
    days,
    title,
    countryCode,
    timeClass: 'bullet',
  });
  return { rapid, blitz, bullet };
};

type Country = { country_code: string; country: string; count: number };

export const getCountries = async ({
  days,
  title,
  countryCode,
}: {
  days?: Days;
  title?: Title;
  countryCode?: string;
}): Promise<Country[]> => {
  try {
    const query = `SELECT p."country_code", p."country", COUNT(p."username") AS "count" FROM chess."player" AS p ${buildPlayersWhereClause({ days, title, countryCode })} GROUP BY p."country_code", p."country"
ORDER BY p."count" DESC;`;
    const sql = Prisma.raw(query);
    return prismaClient.$queryRaw(sql);
  } catch (error) {
    console.error(`getCountries error=${error}`);
    return [];
  }
};

type Leader = {
  title: Title;
  countryCode: string;
  country: string;
  username: string;
  name: string;
  rapid_rating_best: number;
  blitz_rating_best: number;
  bullet_rating_best: number;
};

export const getLeaderboard = async ({
  days,
  title,
  countryCode,
}: {
  days?: Days;
  title?: Title;
  countryCode?: string;
}): Promise<Leader[]> => {
  try {
    const query = `SELECT p."title", p."country_code", p."country", p."username", p."name", p."bullet_rating_best", p."blitz_rating_best", p."rapid_rating_best" FROM chess."player" AS p ${buildPlayersWhereClause({ days, title, countryCode })} ORDER BY p."blitz_rating_best" DESC, p."bullet_rating_best" DESC, p."rapid_rating_best" DESC LIMIT 100 OFFSET 0 ;`;
    const sql = Prisma.raw(query);
    return prismaClient.$queryRaw(sql);
  } catch (error) {
    console.error(`getLeaderboard error=${error}`);
    return [];
  }
};
