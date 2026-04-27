-- Get Win Results by Opponent Rating
SELECT COUNT(*) as "count",
FLOOR((CASE WHEN g."white_username" = 'hikaru' THEN g."black_rating" ELSE g."white_rating" END) / 100) as "opponent_rating_group"
FROM chess."game" as g
WHERE g."time_class" = 'blitz'
AND (g."white_username" = 'hikaru' OR g."black_username" = 'hikaru')
AND TEXT(CASE WHEN g."white_username" = 'hikaru' THEN g."black_result" ELSE g."black_result" END) in ('win')
AND g."rated" = true AND g."rules" = 'chess'
GROUP BY "opponent_rating_group"
ORDER BY "opponent_rating_group";
-- Get Draw Results by Opponent Rating
SELECT COUNT(*) as "count",
FLOOR((CASE WHEN g."white_username" = 'hikaru' THEN g."black_rating" ELSE g."white_rating" END) / 100) AS "opponent_rating_group"
FROM chess."game" as g
WHERE g."time_class" = 'blitz'
AND (g."white_username"='hikaru' OR g."black_username"='hikaru')
AND TEXT(CASE WHEN g."white_username" = 'hikaru'THEN g."black_result" ELSE g."black_result" END) in ('fiftymove','agreed','insufficient','repetition','stalemate','timevsinsufficient')
AND g."rated" = true
AND g."rules" = 'chess'
GROUP BY "opponent_rating_group"
ORDER BY "opponent_rating_group";
-- Get Loss Results by Opponent Rating
SELECT COUNT(*) as "count",
FLOOR((CASE WHEN g."white_username" = 'hikaru' THEN g."black_rating" ELSE g."white_rating" END) / 100) AS "opponent_rating_group"
FROM chess."game" as g
WHERE g."time_class" = 'blitz'
AND (g."white_username"='hikaru' OR g."black_username"='hikaru')
AND TEXT(CASE WHEN g."white_username" = 'hikaru' THEN g."black_result" ELSE g."black_result" END) in ('checkmated','resigned','timeout','abandoned')
AND g."rated" = true
AND g."rules" = 'chess'
GROUP BY "opponent_rating_group"
ORDER BY "opponent_rating_group";
-- How well you perform in your 10 most played openings (hikaru as white)
SELECT c."opening",
o."pgn",
COUNT(*) as total,
SUM(CASE WHEN c."black_result" IN ('win') THEN 1 ELSE 0 END) as win,
SUM(CASE WHEN c."black_result" IN ('agreed','fiftymove') THEN 1 ELSE 0 END) as draw,
SUM(CASE WHEN c."black_result" IN ('timeout') THEN 1 ELSE 0 END) as black
FROM chess."game" as c
JOIN chess."opening" as o
ON c."opening" = o."name"
WHERE c."opening" <> ''
AND c."white_username" = 'hikaru'
GROUP BY c."opening", o."pgn"
ORDER BY total DESC
LIMIT 10;

SELECT g."opening",
g."opening_name",
COUNT(*) as total,
SUM(CASE WHEN g."white_result" IN ('win') THEN 1 ELSE 0 END) as win,
SUM(CASE WHEN g."white_result" IN ('agreed','fiftymove') THEN 1 ELSE 0 END) as draw,
SUM(CASE WHEN g."white_result" IN ('timeout') THEN 1 ELSE 0 END) as loss
FROM chess."game" as g
WHERE g."opening" <> ''
AND g."rated" = true
AND g."rules" = 'chess'
AND g."time_class" = 'blitz'
AND g."white_username" = 'chefshouse'
GROUP BY g."opening", g."opening_name"
ORDER BY total DESC
LIMIT 10;
-- Moves per Piece (hikaru)
SELECT
SUM(CASE WHEN c."white_username" = 'hikaru' THEN c."white_pawn" ELSE c."black_pawn" END) as pawn,
SUM(CASE WHEN c."white_username" = 'hikaru' THEN c."white_knight" ELSE c."black_knight" END) as knight,
SUM(CASE WHEN c."white_username" = 'hikaru' THEN c."white_bishop" ELSE c."black_bishop" END) as bishop,
SUM(CASE WHEN c."white_username" = 'hikaru' THEN c."white_rook" ELSE c."black_rook" END) as rook,
SUM(CASE WHEN c."white_username" = 'hikaru' THEN c."white_queen" ELSE c."black_queen" END) as queen,
SUM(CASE WHEN c."white_username" = 'hikaru' THEN c."white_king" ELSE c."black_king" END) as king
FROM chess."game" as c
WHERE c."white_username" = 'hikaru' OR c."black_username" = 'hikaru';
-- When you castled short (kingside) vs castled long (queenside) vs never castled
SELECT
SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('win') THEN 1 ELSE 0 END
) as short_short_win, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('fiftymove','agreed','insufficient','repetition','stalemate','timevsinsufficient') THEN 1 ELSE 0 END
) as short_short_draw, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('checkmated','resigned','timeout','abandoned') THEN 1 ELSE 0 END
) as short_short_loss, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('win') THEN 1 ELSE 0 END
) as short_long_win, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('fiftymove','agreed','insufficient','repetition','stalemate','timevsinsufficient') THEN 1 ELSE 0 END
) as short_long_draw, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('checkmated','resigned','timeout','abandoned') THEN 1 ELSE 0 END
) as short_long_loss, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('win') THEN 1 ELSE 0 END
) as short_none_win, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('fiftymove','agreed','insufficient','repetition','stalemate','timevsinsufficient') THEN 1 ELSE 0 END
) as short_none_draw, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('checkmated','resigned','timeout','abandoned') THEN 1 ELSE 0 END
) as short_none_loss,
SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('win') THEN 1 ELSE 0 END
) as long_short_win, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('fiftymove','agreed','insufficient','repetition','stalemate','timevsinsufficient') THEN 1 ELSE 0 END
) as long_short_draw, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('checkmated','resigned','timeout','abandoned') THEN 1 ELSE 0 END
) as long_short_loss, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('win') THEN 1 ELSE 0 END
) as long_long_win, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('fiftymove','agreed','insufficient','repetition','stalemate','timevsinsufficient') THEN 1 ELSE 0 END
) as long_long_draw, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('checkmated','resigned','timeout','abandoned') THEN 1 ELSE 0 END
) as long_long_loss, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('win') THEN 1 ELSE 0 END
) as long_none_win, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('fiftymove','agreed','insufficient','repetition','stalemate','timevsinsufficient') THEN 1 ELSE 0 END
) as long_none_draw, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('checkmated','resigned','timeout','abandoned') THEN 1 ELSE 0 END
) as long_none_loss,
SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('win') THEN 1 ELSE 0 END
) as none_short_win, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('fiftymove','agreed','insufficient','repetition','stalemate','timevsinsufficient') THEN 1 ELSE 0 END
) as none_short_draw, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'short' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('checkmated','resigned','timeout','abandoned') THEN 1 ELSE 0 END
) as none_short_loss, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('win') THEN 1 ELSE 0 END
) as none_long_win, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('fiftymove','agreed','insufficient','repetition','stalemate','timevsinsufficient') THEN 1 ELSE 0 END
) as none_long_draw, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = 'long' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('checkmated','resigned','timeout','abandoned') THEN 1 ELSE 0 END
) as none_long_loss, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('win') THEN 1 ELSE 0 END
) as none_none_win, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('fiftymove','agreed','insufficient','repetition','stalemate','timevsinsufficient') THEN 1 ELSE 0 END
) as none_none_draw, SUM(CASE WHEN
  (CASE WHEN c."white_username" = 'hikaru' THEN c."white_castling" ELSE c."black_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_castling" ELSE c."white_castling" END) = '' AND
  (CASE WHEN c."white_username" = 'hikaru' THEN c."black_result" ELSE c."black_result" END) IN ('checkmated','resigned','timeout','abandoned') THEN 1 ELSE 0 END
) as none_none_loss
FROM chess."game" as c
WHERE c."white_username" = 'hikaru' OR c."black_username" = 'hikaru'
-- How do you perform in the global chess community?
SELECT
c."flag",
p."country_code" as code,
c."name",
COUNT(p."country_code") as total,
SUM(CASE WHEN (CASE WHEN g."white_username" = 'hikaru' THEN g."black_result" ELSE g."black_result" END) IN ('win') THEN 1 ELSE 0 END) as win,
SUM(CASE WHEN (CASE WHEN g."white_username" = 'hikaru' THEN g."black_result" ELSE g."black_result" END) IN ('agreed') THEN 1 ELSE 0 END) as draw,
SUM(CASE WHEN (CASE WHEN g."white_username" = 'hikaru' THEN g."black_result" ELSE g."black_result" END) IN ('checkmated') THEN 1 ELSE 0 END) as loss
FROM chess."game" as g
JOIN chess."ChessPlayer" as p
ON (CASE g."white_username" WHEN 'hikaru' THEN g."black_username" ELSE g."white_username" END) = p."username"
JOIN chess."country" as c
ON c."cca2" = p."country_code"
WHERE g."white_username" = 'hikaru' OR g."black_username" = 'hikaru'
GROUP BY c."flag", p."country_code", c."name"
ORDER BY total DESC;
