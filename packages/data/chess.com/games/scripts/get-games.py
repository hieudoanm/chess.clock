import sqlite3
from datetime import datetime
import json
import requests
from tqdm import tqdm

# =========================
# CONFIG
# =========================
DB_FILE = "chess_games.db"
user_agent = "ArithmeticErrorMozilla/5.0"

current_month = datetime.now().month
current_year = datetime.now().year

# =========================
# USERS
# =========================
world_chess_champions_usernames = [
    "vladimirkramnik",
    "thevish",
    "magnuscarlsen",
    "chefshouse",
    "gukeshdommaraju",
]

usernames = [
    *world_chess_champions_usernames,
    "anishgiri",
    "azerichess",
    "chesswarrior7197",
    "danielnaroditsky",
    "denlaz",
    "dominguezonyoutube",
    "duhless",
    "fabianocaruana",
    "firouzja2003",
    "ghandeevam2003",
    "gmwso",
    "grischuk",
    "hikaru",
    "lachesisq",
    "levonaronian",
    "liemle",
    "lyonbeast",
    "penguingm1",
    "polish_fighter3000",
    "rpragchess",
    "sergeykarjakin",
    "tradjabov",
    "veselintopalov359",
    "viditchess",
    "vincentkeymer",
    "wonderfultime",
]


# =========================
# DB INIT
# =========================
def init_db(conn):
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        username TEXT,
        uuid TEXT UNIQUE,

        year TEXT,
        month TEXT,
        end_time INTEGER,

        white_username TEXT,
        white_rating INTEGER,
        white_result TEXT,

        black_username TEXT,
        black_rating INTEGER,
        black_result TEXT,

        time_control TEXT,
        time_class TEXT,
        rated INTEGER,
        rules TEXT,

        accuracies_white REAL,
        accuracies_black REAL,

        eco TEXT,
        url TEXT,
        fen TEXT,
        initial_setup TEXT,

        data TEXT
    );
    """)

    conn.commit()


# =========================
# FLATTEN JSON
# =========================
def flatten_json(d, parent_key="", sep="_"):
    items = {}

    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k

        if isinstance(v, dict):
            items.update(flatten_json(v, new_key, sep))

        elif isinstance(v, list):
            items[new_key] = json.dumps(v)

        else:
            items[new_key] = v

    return items


# =========================
# HELPERS
# =========================
def add_zero(n: int):
    return f"{n}" if n > 9 else f"0{n}"


def is_current_month(year, month):
    return str(current_year) == year and (
        add_zero(current_month) == month or add_zero(current_month - 1) == month
    )


# =========================
# MAIN FETCH LOGIC
# =========================
def fetch_all_games(conn):
    cursor = conn.cursor()

    for username in tqdm(usernames):
        print(f"\n📡 Fetching {username}")

        archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"

        try:
            archives = (
                requests.get(archives_url, headers={"User-Agent": user_agent})
                .json()
                .get("archives", [])
            )
        except Exception as e:
            print(f"❌ Failed to fetch archives for {username}: {e}")
            continue

        archives.reverse()

        for archive in archives:
            year, month = archive.split("/")[-2:]

            # skip already processed months (except recent)
            cursor.execute(
                """
                SELECT COUNT(*) FROM games
                WHERE username=? AND year=? AND month=?
            """,
                (username, year, month),
            )

            exists = cursor.fetchone()[0] > 0

            if exists and not is_current_month(year, month):
                continue

            print(f"➡️ {username} {year}-{month}")

            url = f"https://api.chess.com/pub/player/{username}/games/{year}/{month}"

            try:
                response = requests.get(url, headers={"User-Agent": user_agent})
                games = response.json().get("games", [])
            except Exception as e:
                print(f"❌ Failed to fetch games for {username} {year}-{month}: {e}")
                continue

            if not games:
                print(f"⚠️ No games for {username} {year}-{month}")
                continue

            rows = []

            for game in games:
                flat = flatten_json(game)

                rows.append(
                    (
                        username,
                        flat.get("uuid"),
                        year,
                        month,
                        flat.get("end_time"),
                        flat.get("white_username"),
                        flat.get("white_rating"),
                        flat.get("white_result"),
                        flat.get("black_username"),
                        flat.get("black_rating"),
                        flat.get("black_result"),
                        flat.get("time_control"),
                        flat.get("time_class"),
                        int(flat.get("rated", False)),
                        flat.get("rules"),
                        flat.get("accuracies_white"),
                        flat.get("accuracies_black"),
                        flat.get("eco"),
                        flat.get("url"),
                        flat.get("fen"),
                        flat.get("initial_setup"),
                        json.dumps(flat),
                    )
                )

            try:
                cursor.executemany(
                    """
                    INSERT OR IGNORE INTO games (
                        username, uuid,
                        year, month, end_time,
                        white_username, white_rating, white_result,
                        black_username, black_rating, black_result,
                        time_control, time_class, rated, rules,
                        accuracies_white, accuracies_black,
                        eco, url, fen, initial_setup,
                        data
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    rows,
                )

                conn.commit()

                print(f"✅ Inserted {len(rows)} games")

            except Exception as e:
                print(f"❌ DB INSERT ERROR: {e}")


# =========================
# RUN
# =========================
def main():
    conn = sqlite3.connect(DB_FILE)

    init_db(conn)
    fetch_all_games(conn)

    conn.close()
    print("\n🎉 Done!")


if __name__ == "__main__":
    main()
