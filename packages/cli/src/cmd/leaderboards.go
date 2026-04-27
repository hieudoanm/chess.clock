package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/spf13/cobra"

	"github.com/hieudoanm/chess.insights/src/data"
	"github.com/hieudoanm/chess.insights/src/utils/requests"
)

func country(url string) (string, string) {
	if url == "" {
		return "-", "-"
	}

	trimmed := strings.TrimSuffix(url, "/")
	parts := strings.Split(trimmed, "/")
	if len(parts) == 0 {
		return "-", "-"
	}

	code := strings.ToUpper(parts[len(parts)-1])
	if name, ok := data.Countries[code]; ok {
		return code, name
	}
	return code, "-"
}

func printTop(title string, players []Player, limit int) {
	if len(players) == 0 {
		return
	}

	fmt.Println()
	fmt.Println(title)
	fmt.Println()

	fmt.Printf(
		"| %-4s | %-32s | %-24s | %-24s | %-6s | %-24s |\n",
		"Rank", "Name", "Username", "Country", "Score", "W / D / L",
	)
	fmt.Printf("| %-4s | %-32s | %-24s | %-24s | %-6s | %-24s |\n", strings.Repeat("-", 4), strings.Repeat("-", 32), strings.Repeat("-", 24), strings.Repeat("-", 24), strings.Repeat("-", 6), strings.Repeat("-", 24))

	if len(players) < limit {
		limit = len(players)
	}

	for i := 0; i < limit; i++ {
		p := players[i]

		name := p.Name
		if name == "" {
			name = "-"
		}

		w := strconv.Itoa(p.WinCount)
		d := strconv.Itoa(p.DrawCount)
		l := strconv.Itoa(p.LossCount)
		wdl := fmt.Sprintf("%s / %s / %s", w, d, l)

		_, countryName := country(p.Country)

		fmt.Printf(
			"| %-4d | %-32s | %-24s | %-24s | %-6d | %-24s |\n",
			p.Rank,
			name,
			strings.ToLower(p.Username),
			countryName,
			p.Score,
			wdl,
		)
	}
}

type Player struct {
	Rank      int    `json:"rank"`
	Username  string `json:"username"`
	Name      string `json:"name"`
	Score     int    `json:"score"`
	Country   string `json:"country"`
	Title     string `json:"title"`
	WinCount  int    `json:"win_count"`
	DrawCount int    `json:"draw_count"`
	LossCount int    `json:"loss_count"`
}

type LeaderboardsResponse struct {
	LiveBullet   []Player `json:"live_bullet"`
	LiveBlitz    []Player `json:"live_blitz"`
	LiveRapid    []Player `json:"live_rapid"`
	LiveBlitz960 []Player `json:"live_blitz960"`
}

var leaderboardsCmd = &cobra.Command{
	Use:   "leaderboards",
	Short: "Run the leaderboards operation for the chess.com app",
	Long: `The leaderboards command is a specific utility to execute operations related to leaderboards within the chess.com application.

As a component of the chess tools, this command empowers you to interact directly with chess.com's leaderboards features via the CLI.`,
	Run: func(cmd *cobra.Command, args []string) {
		top, _ := cmd.Flags().GetInt("top")
		countryFilter, _ := cmd.Flags().GetString("country")

		if top <= 0 {
			top = 5
		}

		url := "https://api.chess.com/pub/leaderboards"
		body, err := requests.Get(url, requests.Options{})
		if err != nil {
			fmt.Fprintln(os.Stderr, "❌ Failed to fetch leaderboards:", err)
			os.Exit(1)
		}

		var data LeaderboardsResponse
		if err := json.Unmarshal(body, &data); err != nil {
			fmt.Fprintln(os.Stderr, "❌ Failed to parse response:", err)
			os.Exit(1)
		}

		filterPlayers := func(players []Player) []Player {
			if countryFilter == "" {
				return players
			}
			var filtered []Player
			for _, p := range players {
				code, _ := country(p.Country)
				if code == strings.ToUpper(countryFilter) {
					filtered = append(filtered, p)
				}
			}
			return filtered
		}

		printTop("♟ Live Bullet", filterPlayers(data.LiveBullet), top)
		printTop("♞ Live Blitz", filterPlayers(data.LiveBlitz), top)
		printTop("⏱ Live Rapid", filterPlayers(data.LiveRapid), top)
		printTop("♜ Live Blitz 960", filterPlayers(data.LiveBlitz960), top)
	},
}

func init() {
	rootCmd.AddCommand(leaderboardsCmd)

	leaderboardsCmd.Flags().Int("top", 5, "Number of top players to display")
	leaderboardsCmd.Flags().String("country", "", "Filter players by country code (e.g., US, RU)")
}
