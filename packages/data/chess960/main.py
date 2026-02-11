import pandas
import json

positions_df = pandas.read_csv("./positions/positions.csv")
positions_df["position"].to_json(
    "./positions/positions.json", orient="records", indent=4
)


with open("./positions/positions.json", "r") as rf:
    positions: list[str] = json.load(rf)
    with open("./positions/positions.txt", "w") as wf:
        text = ""
        for index, position in enumerate(positions):
            text += str(index + 1) + ". " + position + "\n"
        wf.write(text)
