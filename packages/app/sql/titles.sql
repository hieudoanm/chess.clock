-- Descriptive (Count - Average - Max) --
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
CAST(ROUND(AVG(p."rapid_rating_best"), 2) AS FLOAT) AS "average_rapid_rating_best", -- Average
CAST(ROUND(AVG(p."blitz_rating_best"), 2) AS FLOAT) AS "average_blitz_rating_best", -- Average
CAST(ROUND(AVG(p."bullet_rating_best"), 2) AS FLOAT) AS "average_bullet_rating_best", -- Average
MAX(p."rapid_rating_best") AS "max_rapid_rating_best", -- Max
MAX(p."blitz_rating_best") AS "max_blitz_rating_best", -- Max
MAX(p."bullet_rating_best") AS "max_bullet_rating_best" -- Max
FROM chess."player" AS p
WHERE p."title" = 'GM' AND p."country_code" = 'US' AND p."last_online" > now() - interval '366 days';
--- Distribution
SELECT COUNT(p."username") AS "total", (FLOOR((p."rapid_rating_last" / 100)) * 100) AS "rapid_group" FROM chess."player" AS p WHERE (FLOOR((p."rapid_rating_last" / 100)) * 100) <> 0 GROUP BY "rapid_group" ORDER BY "rapid_group"

SELECT COUNT(p."username") AS "total", (FLOOR((p."blitz_rating_last" / 100)) * 100) AS "blitz_group" FROM chess."player" AS p WHERE (FLOOR((p."blitz_rating_last" / 100)) * 100) <> 0 GROUP BY "blitz_group" ORDER BY "blitz_group"

SELECT COUNT(p."username") AS "total", (FLOOR((p."bullet_rating_last" / 100)) * 100) AS "bullet_group" FROM chess."player" AS p WHERE (FLOOR((p."bullet_rating_last" / 100)) * 100) <> 0 GROUP BY "bullet_group" ORDER BY "bullet_group"
--- Country
SELECT p."country_code", p."country", COUNT(p."username") AS "count"
FROM chess."player" AS p
GROUP BY p."country_code", p."country"
ORDER BY p."count" DESC;
--- Leaderboard
SELECT p."title", p."country_code", p."country", p."username", p."name", p."bullet_rating_last", p."blitz_rating_last", p."rapid_rating_last"
FROM chess."player" AS p
LIMIT 100 OFFSET 0
WHERE p."title" = 'GM' AND p."country_code" = 'US' AND p."last_online" > now() - interval '366 days'
ORDER BY p."bullet_rating_last" DESC, p."blitz_rating_last" DESC, p."rapid_rating_last" DESC;
-- Kill connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid() AND datname = 'postgres';
