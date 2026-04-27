import json
import os
from tqdm import tqdm


folders: list[str] = [
    f.path for f in os.scandir(".") if f.is_dir() and f.path != "./.venv"
]
folders.sort()
print(folders)

for folder in tqdm(folders):
    files = [f.path for f in os.scandir(f"{folder}/json") if f.is_file()]
    games = list()
    for file in files:
        if "games" in file:
            continue
        games_file = open(file, "r")
        games.extend(json.load(games_file))
        games_file.close()
    games_file = open(f"{folder}/json/games.json", "w")
    games_file.write(json.dumps(games, indent=4))
    games_file.close()
    print(folder, "{:,}".format(len(games)), len(games) > 10000)
