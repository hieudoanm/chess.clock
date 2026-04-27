import sqlite3
import json
from pathlib import Path

DB_PATH = "./db/chess.insights.db"
OUTPUT_PATH = "./json/analysis.json"


# ─────────────────────────────────────
# SINGLE QUERY (count + histogram)
# ─────────────────────────────────────
QUERY = """
SELECT
  LOWER(COALESCE(title, '')) AS title,
  'count' AS kind,
  NULL AS time_control,
  NULL AS bucket,
  COUNT(*) AS value
FROM players
GROUP BY LOWER(COALESCE(title, ''))

UNION ALL

SELECT
  LOWER(COALESCE(title, '')) AS title,
  'histogram' AS kind,
  'bullet' AS time_control,
  (bullet_rating_best / 100) * 100 AS bucket,
  COUNT(*) AS value
FROM players
WHERE bullet_rating_best > 0
GROUP BY LOWER(COALESCE(title, '')), bucket

UNION ALL

SELECT
  LOWER(COALESCE(title, '')) AS title,
  'histogram' AS kind,
  'blitz' AS time_control,
  (blitz_rating_best / 100) * 100 AS bucket,
  COUNT(*) AS value
FROM players
WHERE blitz_rating_best > 0
GROUP BY LOWER(COALESCE(title, '')), bucket

UNION ALL

SELECT
  LOWER(COALESCE(title, '')) AS title,
  'histogram' AS kind,
  'rapid' AS time_control,
  (rapid_rating_best / 100) * 100 AS bucket,
  COUNT(*) AS value
FROM players
WHERE rapid_rating_best > 0
GROUP BY LOWER(COALESCE(title, '')), bucket
"""


# ─────────────────────────────────────
# DB FETCH
# ─────────────────────────────────────
def fetch_rows(db_path: str):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute(QUERY)
    rows = cursor.fetchall()

    conn.close()
    return rows


# ─────────────────────────────────────
# TRANSFORM → TARGET FORMAT
# ─────────────────────────────────────
def transform(rows):
    titles = ["gm", "im", "fm", "cm", "nm", "wgm", "wim", "wfm", "wcm", "wnm"]

    # Count structure
    count = {"total": 0, **{t: 0 for t in titles}}

    # Histogram structure
    histogram = {
        "total": {"bullet": {}, "blitz": {}, "rapid": {}},
        **{t: {"bullet": {}, "blitz": {}, "rapid": {}} for t in titles},
    }

    for title, kind, time_control, bucket, value in rows:
        title = title or ""

        # ── COUNT ──
        if kind == "count":
            count["total"] += value
            if title in count:
                count[title] += value

        # ── HISTOGRAM ──
        elif kind == "histogram":
            if bucket is None:
                continue

            bucket = int(bucket)
            key = f"{bucket}-{bucket + 100}"

            # total
            histogram["total"][time_control][key] = (
                histogram["total"][time_control].get(key, 0) + value
            )

            # per title
            if title in histogram:
                histogram[title][time_control][key] = (
                    histogram[title][time_control].get(key, 0) + value
                )

    return {
        "count": count,
        "histogram": histogram,
    }


# ─────────────────────────────────────
# FILL MISSING BUCKETS (0-4000 step 100)
# ─────────────────────────────────────
def fill_ranges(data, step=100, max_rating=4000):
    for category, time_controls in data["histogram"].items():
        for tc in ["bullet", "blitz", "rapid"]:
            buckets = time_controls[tc]

            for r in range(0, max_rating, step):
                key = f"{r}-{r + step}"
                if key not in buckets:
                    buckets[key] = 0

            # sort keys
            data["histogram"][category][tc] = dict(
                sorted(buckets.items(), key=lambda x: int(x[0].split("-")[0]))
            )

    return data


# ─────────────────────────────────────
# MAIN
# ─────────────────────────────────────
def main():
    print("📊 Running analysis...")

    rows = fetch_rows(DB_PATH)
    data = transform(rows)
    data = fill_ranges(data)

    Path(OUTPUT_PATH).parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_PATH, "w") as f:
        json.dump(data, f, indent=2)

    print(f"✅ Analysis written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
