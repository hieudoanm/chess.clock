import chess.pgn
import io
import json
import os
import pandas as pd
from pathlib import Path

folders = [f.path for f in os.scandir(".") if f.is_dir() and f.path != "./.venv"]
folders.sort()


def flat_json(game: dict):
    uuid: str = game.get("uuid", "")
    pgn: str = game.get("pgn", "")
    time_control: str = game.get("time_control", "")
    time_class: str = game.get("time_class", "")
    rated: bool = game.get("rated", False)
    initial_setup: str = game.get("initial_setup", "")
    fen: str = game.get("fen", "")
    tcn: str = game.get("tcn", "")
    rules: str = game.get("rules", "")
    end_time: int = game.get("end_time", "")
    white_accuracy: float = game.get("accuracies", {}).get("white", 0)
    white_rating: int = game.get("white", {}).get("rating", 0)
    white_result: str = game.get("white", {}).get("result", "")
    white_username: str = game.get("white", {}).get("username", "").lower()
    black_accuracy: float = game.get("accuracies", {}).get("black", 0)
    black_rating: int = game.get("black", {}).get("rating", 0)
    black_result: str = game.get("black", {}).get("result", "")
    black_username: str = game.get("black", {}).get("username", "").lower()
    pgn_info = chess.pgn.read_game(io.StringIO(pgn))
    pgn_headers = pgn_info.headers if pgn_info is not None else chess.pgn.Headers()
    opening: str = pgn_headers.get("ECO", "")
    opening_url: str = pgn_headers.get("ECOUrl", "")
    opening_name: str = " ".join(opening_url.split("/")[-1].split("-"))
    return {
        "uuid": uuid,
        "end_time": end_time,
        "time_control": time_control,
        "time_class": time_class,
        "rated": rated,
        "initial_setup": initial_setup,
        "fen": fen,
        "tcn": tcn,
        "rules": rules,
        "white_accuracy": white_accuracy,
        "white_rating": white_rating,
        "white_result": white_result,
        "white_username": white_username,
        "black_accuracy": black_accuracy,
        "black_rating": black_rating,
        "black_result": black_result,
        "black_username": black_username,
        "pgn": pgn,
        "opening": opening,
        "opening_name": opening_name,
    }


for folder in folders:
    # Parse Games in JSON
    games_file = open(f"{folder}/json/games.json", "r")
    games_json: list[dict] = json.load(games_file)
    games_file.close()
    if not len(games_json) < 10000:
        continue
    games_list: list[dict] = list(map(lambda game: flat_json(game), games_json))
    Path(f"{folder}/csv").mkdir(parents=True, exist_ok=True)
    # Games with PGN
    all_df = pd.DataFrame(games_list)
    all_df.to_csv(f"{folder}/csv/games_with_pgn.csv", index=False)
    # Games without PGN
    games_df = all_df.drop("pgn", axis=1)
    games_df.to_csv(f"{folder}/csv/games.csv", index=False)
    # Check output
    size = os.path.getsize(f"{folder}/csv/games.csv")
    print(folder, "{:,}".format(len(games_json)), f"{round(size/(pow(1024,2)), 2)} MB")
