import json
from pathlib import Path
import requests

TITLES: list[str] = [
    "GM",
    "IM",
    "FM",
    "CM",
    "NM",
    "WGM",
    "WIM",
    "WFM",
    "WCM",
    "WNM",
]
USER_AGENT = "ArithmeticErrorMozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0"
titled_players: list[dict] = []

for title in TITLES:
    url = f"https://api.chess.com/pub/titled/{title}"
    response = requests.get(url, headers={"User-Agent": USER_AGENT})
    data: dict = response.json()
    usernames: list[str] = data.get("players", [])
    json_file_path = f"./json/titles/{title}.json"
    with open(json_file_path, "w", encoding="utf-8") as json_file:
        json.dump(usernames, json_file, indent=2)


usernames = []
titles_dir = Path("./json/titles")
for title in TITLES:
    json_file_path = titles_dir / f"{title}.json"
    try:
        # Skip missing files
        if not json_file_path.exists():
            print(f"⚠️ File not found: {json_file_path}")
            continue

        # Skip empty files
        if json_file_path.stat().st_size == 0:
            print(f"⚠️ Empty file skipped: {json_file_path}")
            continue

        # Load JSON safely
        with open(json_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                usernames.extend(data)
            else:
                print(f"⚠️ Non-list JSON skipped: {json_file_path}")
    except json.JSONDecodeError:
        print(f"❌ Invalid JSON in file: {json_file_path}")
        continue

# Write merged JSON
output_path = titles_dir / "all.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(usernames, f, indent=2, ensure_ascii=False)
    print("✅ Done! Merged usernames written to all.json")
