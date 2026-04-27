import aiofiles
import asyncio
import httpx
import time
import random
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
import json

import aiosqlite
from tqdm import tqdm

# =========================
# LOGGING SETUP
# =========================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

# =========================
# CONFIG
# =========================
DB_PATH = Path("./db/chess.insights.db")
PLAYERS_DIR = Path("./json/players")
USERNAMES_FILE = Path("./json/titles/all.json")

USER_AGENT = "Mozilla/5.0"
MAX_CONCURRENCY = 8
REQUEST_DELAY = 0.15  # let 429 backoff self-regulate

STALE_AFTER = timedelta(weeks=1)

# =========================
# DB SCHEMA
# =========================
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    name TEXT,
    username TEXT,
    title TEXT,
    country TEXT,
    location TEXT,
    joined TEXT,
    status TEXT,
    verified BOOLEAN,
    league TEXT,

    bullet_rating_last INTEGER,
    bullet_rating_best INTEGER,
    bullet_record_win INTEGER,
    bullet_record_draw INTEGER,
    bullet_record_loss INTEGER,

    blitz_rating_last INTEGER,
    blitz_rating_best INTEGER,
    blitz_record_win INTEGER,
    blitz_record_draw INTEGER,
    blitz_record_loss INTEGER,

    rapid_rating_last INTEGER,
    rapid_rating_best INTEGER,
    rapid_record_win INTEGER,
    rapid_record_draw INTEGER,
    rapid_record_loss INTEGER,

    created_at TEXT
    updated_at TEXT
)
"""


MIGRATE_CREATED_AT_SQL = """
ALTER TABLE players ADD COLUMN created_at TEXT
"""

MIGRATE_UPDATED_AT_SQL = """
ALTER TABLE players ADD COLUMN updated_at TEXT
"""


# =========================
# SETUP
# =========================
def setup_dirs():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    PLAYERS_DIR.mkdir(parents=True, exist_ok=True)


async def setup_db(db: aiosqlite.Connection):
    await db.execute(CREATE_TABLE_SQL)
    await db.commit()

    # migrate: add updated_at if it doesn't exist yet on an older DB
    async with db.execute("PRAGMA table_info(players)") as cursor:
        columns = {row[1] async for row in cursor}

    if "created_at" not in columns:
        await db.execute(MIGRATE_CREATED_AT_SQL)
        await db.commit()
        logger.info("Migrated: added created_at column to existing DB")

    if "updated_at" not in columns:
        await db.execute(MIGRATE_UPDATED_AT_SQL)
        await db.commit()
        logger.info("Migrated: added updated_at column to existing DB")


# =========================
# PENDING FILTER
# =========================
async def get_pending(
    db: aiosqlite.Connection, usernames: list[str]
) -> tuple[list[str], int]:
    """
    Returns (pending_usernames, skipped_count).

    A username is skipped (fresh) only if it exists in the DB AND its
    updated_at is within the last STALE_AFTER window.

    Everything else — never fetched, or fetched more than a week ago — is pending.
    """
    stale_cutoff = (datetime.now(tz=timezone.utc) - STALE_AFTER).isoformat()

    # Usernames that are fresh (exist + recently updated)
    async with db.execute(
        "SELECT username FROM players WHERE updated_at IS NOT NULL AND updated_at >= ?",
        (stale_cutoff,),
    ) as cursor:
        fresh = {row[0] async for row in cursor}

    pending = [u for u in usernames if u not in fresh]
    skipped = len(usernames) - len(pending)
    return pending, skipped


# =========================
# RATE LIMITER
# =========================
_last_request_time: float = 0.0
_rate_lock = asyncio.Lock()


async def rate_limit():
    global _last_request_time
    async with _rate_lock:
        now = time.monotonic()
        wait = REQUEST_DELAY - (now - _last_request_time)
        _last_request_time = now + max(wait, 0)

    if wait > 0:
        await asyncio.sleep(wait)


# =========================
# SAFE REQUEST
# =========================
async def safe_get(client: httpx.AsyncClient, url: str) -> dict:
    for attempt in range(6):
        await rate_limit()

        r = await client.get(url)

        if r.status_code == 429:
            retry_after = r.headers.get("Retry-After")
            wait = (
                int(retry_after)
                if retry_after
                else (2**attempt) + random.uniform(0.5, 1.5)
            )
            logger.warning(
                f"429 on {url} → sleeping {wait:.2f}s (attempt {attempt + 1})"
            )
            await asyncio.sleep(wait)
            continue

        r.raise_for_status()
        return r.json()

    raise RuntimeError(f"Exceeded retries for: {url}")


# =========================
# PROCESS PLAYER
# =========================
async def process_player(
    client: httpx.AsyncClient,
    db: aiosqlite.Connection,
    db_lock: asyncio.Lock,
    semaphore: asyncio.Semaphore,
    username: str,
):
    async with semaphore:
        profile_url = f"https://api.chess.com/pub/player/{username}"
        stats_url = f"https://api.chess.com/pub/player/{username}/stats"

        player, stats = await asyncio.gather(
            safe_get(client, profile_url),
            safe_get(client, stats_url),
        )

    # --- parse joined timestamp → ISO string
    joined_raw = player.get("joined", 0)
    try:
        joined = datetime.fromtimestamp(int(joined_raw), tz=timezone.utc).isoformat()
    except (ValueError, TypeError, OSError):
        joined = ""

    now_iso = datetime.now(tz=timezone.utc).isoformat()
    player_id = player.get("player_id", username)

    # --- write JSON (offloaded to thread; always overwrite on re-fetch)
    json_path = PLAYERS_DIR / f"{player_id}.json"
    await asyncio.to_thread(
        lambda: json_path.write_text(
            json.dumps({**player, **stats}, indent=2), encoding="utf-8"
        )
    )

    # --- build row
    row = (
        player.get("player_id", 0),
        player.get("name", ""),
        username,
        player.get("title", ""),
        player.get("country", ""),
        player.get("location", ""),
        joined,
        player.get("status", ""),
        player.get("verified", False),
        player.get("league", ""),
        stats.get("chess_bullet", {}).get("last", {}).get("rating", 0),
        stats.get("chess_bullet", {}).get("best", {}).get("rating", 0),
        stats.get("chess_bullet", {}).get("record", {}).get("win", 0),
        stats.get("chess_bullet", {}).get("record", {}).get("draw", 0),
        stats.get("chess_bullet", {}).get("record", {}).get("loss", 0),
        stats.get("chess_blitz", {}).get("last", {}).get("rating", 0),
        stats.get("chess_blitz", {}).get("best", {}).get("rating", 0),
        stats.get("chess_blitz", {}).get("record", {}).get("win", 0),
        stats.get("chess_blitz", {}).get("record", {}).get("draw", 0),
        stats.get("chess_blitz", {}).get("record", {}).get("loss", 0),
        stats.get("chess_rapid", {}).get("last", {}).get("rating", 0),
        stats.get("chess_rapid", {}).get("best", {}).get("rating", 0),
        stats.get("chess_rapid", {}).get("record", {}).get("win", 0),
        stats.get("chess_rapid", {}).get("record", {}).get("draw", 0),
        stats.get("chess_rapid", {}).get("record", {}).get("loss", 0),
        now_iso,
        now_iso,
    )

    # --- write to SQLite (serialised via db_lock)
    async with db_lock:
        await db.execute(
            """
            INSERT OR REPLACE INTO players (
                id, name, username, title, country, location, joined, status, verified, league,
                bullet_rating_last, bullet_rating_best, bullet_record_win, bullet_record_draw, bullet_record_loss,
                blitz_rating_last,  blitz_rating_best,  blitz_record_win,  blitz_record_draw,  blitz_record_loss,
                rapid_rating_last,  rapid_rating_best,  rapid_record_win,  rapid_record_draw,  rapid_record_loss,
                created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?
            )
            """,
            row,
        )
        await db.commit()


# =========================
# MAIN
# =========================
async def main():
    setup_dirs()

    async with aiofiles.open(USERNAMES_FILE, mode="r", encoding="utf-8") as f:
        data = await f.read()

    usernames = json.loads(data)
    usernames.reverse()

    async with aiosqlite.connect(DB_PATH) as db:
        await setup_db(db)

        pending, skipped = await get_pending(db, usernames)

        logger.info(
            f"Total={len(usernames)} | "
            f"Fresh/skipped={skipped} | "
            f"Pending (new + stale > 1 week)={len(pending)}"
        )

        if not pending:
            logger.info("All players are up to date. Nothing to do.")
            return

        semaphore = asyncio.Semaphore(MAX_CONCURRENCY)
        db_lock = asyncio.Lock()
        timeout = httpx.Timeout(30.0)

        progress = tqdm(
            total=len(pending),
            desc="Fetching players",
            unit="player",
            dynamic_ncols=True,
        )

        success = 0
        failed = 0

        async with httpx.AsyncClient(
            headers={"User-Agent": USER_AGENT},
            timeout=timeout,
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=50),
        ) as client:
            tasks = [process_player(client, db, db_lock, semaphore, u) for u in pending]

            for coro in asyncio.as_completed(tasks):
                try:
                    await coro
                    success += 1
                except Exception as e:
                    failed += 1
                    logger.error(f"Task failed: {e}")

                progress.update(1)
                raw_rate = progress.format_dict.get("rate") or 0
                progress.set_postfix(ok=success, fail=failed, rate=f"{raw_rate:.2f}/s")

        progress.close()
        logger.info(f"Done | success={success} failed={failed} skipped={skipped}")


# =========================
# ENTRY POINT
# =========================
if __name__ == "__main__":
    asyncio.run(main())
