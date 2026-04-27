from datetime import datetime
import json
from os.path import exists
from pathlib import Path
import requests
import threading
from tqdm import tqdm
import urllib.request

current_month = datetime.now().month
current_year = datetime.now().year
print(current_month, current_year)

world_chess_champions_usernames: list[str] = [
    "vladimirkramnik",  # Vladimir Kramnik
    "thevish",  # Viswanathan Anand
    "magnuscarlsen",  # Magnus Carlsen
    "chefshouse",  # Ding Liren
    "gukeshdommaraju",  # Gukesh Dommaraju
]

usernames: list[str] = [
    *world_chess_champions_usernames,
    "anishgiri",  # Anish Giri
    "azerichess",  # Shakhriyar Mamedyarov
    "chesswarrior7197",  # Nodirbek Abdusattorov
    "danielnaroditsky",  # Daniel Naroditsky
    "denlaz",  # Denis Lazavik
    "dominguezonyoutube",  # Leinier Domínguez
    "duhless",  # Daniil Dubov
    "fabianocaruana",  # Fabiano Caruana
    "firouzja2003",  # Alireza Firouzja
    "ghandeevam2003",  # Arjun Erigaisi
    "gmwso",  # Wesley So
    "grischuk",  # Alexander Grischuk
    "hikaru",  # Hikaru Nakamura
    "lachesisq",  # Ian Nepomniachtchi
    "levonaronian",  # Levon Aronian
    "liemle",  # Lê Quang Liêm
    "lyonbeast",  # MVL - Maxime Vachier-Lagrave
    "penguingm1",  # Andrew Tang
    "polish_fighter3000",  # Jan-Krzysztof Duda
    "rpragchess",  # Praggnanandhaa Rameshbabu
    "sergeykarjakin",  # Sergey Karjakin
    "tradjabov",  # Teimour Radjabov
    "veselintopalov359",  # Veselin Topalov
    "viditchess",  # Vidit Gujrathi
    "vincentkeymer",  # Vincent Keymer
    "wonderfultime",  # Le Tuan Minh
]

print(len(usernames))

user_agent = "ArithmeticErrorMozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0"


def add_zero(number: int):
    return f"{number}" if number > 9 else f"0{number}"


def get_pgn_by_username(username: str):
    print(username)
    Path(f"{username}/json").mkdir(parents=True, exist_ok=True)
    Path(f"{username}/pgn").mkdir(parents=True, exist_ok=True)
    archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"
    archives_response: requests.Response = requests.get(
        archives_url, headers={"User-Agent": user_agent}
    )
    archives_data: dict = archives_response.json()
    archives: list[str] = archives_data.get("archives", [])
    archives.reverse()
    times = list(map(lambda archive: archive.split("/")[-2:], archives))
    for time in times:
        [year, month] = time
        # json
        games_json_file_name = f"{username}/json/{year}-{month}.json"
        games_json_url = (
            f"https://api.chess.com/pub/player/{username}/games/{year}/{month}"
        )
        flag = not exists(games_json_file_name) or (
            str(current_year) == year
            and (
                add_zero(current_month) == month or add_zero(current_month - 1) == month
            )
        )
        print(username, year, month, flag)
        if flag:
            games_json_response = requests.get(
                games_json_url, headers={"User-Agent": user_agent}
            )
            games_json_data = games_json_response.json()
            games: list = games_json_data.get("games", [])
            games_json_file = open(games_json_file_name, "w")
            games_json_file.write(json.dumps(games, indent=2))
        # pgn
        games_pgn_file_name: str = f"{username}/pgn/{year}-{month}.pgn"
        if not exists(games_pgn_file_name) or (
            str(current_year) == year and add_zero(current_month) == month
        ):
            games_pgn_url = f"{games_json_url}/pgn"
            urllib.request.urlretrieve(games_pgn_url, games_pgn_file_name)


for username in tqdm(usernames):
    thread = threading.Thread(target=get_pgn_by_username, args=(username,))
    thread.start()
    thread.join()

print("Done!")
