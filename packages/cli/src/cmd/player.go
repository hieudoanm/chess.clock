package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"

	"github.com/hieudoanm/chess/src/utils/colors"
	"github.com/hieudoanm/chess/src/utils/numbers"
	"github.com/hieudoanm/chess/src/utils/requests"
)

/* ----------------------------- Helpers ----------------------------- */

func printRatingsHeader() {
	fmt.Printf(
		"| %-8s | %8s | %8s | %8s | %8s | %8s |\n",
		"Mode",
		"Best",
		"Last",
		"Win",
		"Draw",
		"Loss",
	)
	fmt.Printf(
		"| %-8s | %8s | %8s | %8s | %8s | %8s |\n",
		strings.Repeat("-", 8),
		strings.Repeat("-", 8),
		strings.Repeat("-", 8),
		strings.Repeat("-", 8),
		strings.Repeat("-", 8),
		strings.Repeat("-", 8),
	)
}

func printRating(label string, r ChessRating) {
	fmt.Printf(
		"| %-8s | %8s | %8s | %8s | %8s | %8s |\n",
		label,
		numbers.Comma(r.Best.Rating),
		numbers.Comma(r.Last.Rating),
		numbers.Comma(r.Record.Win),
		numbers.Comma(r.Record.Draw),
		numbers.Comma(r.Record.Loss),
	)
}

/* ----------------------------- Models ----------------------------- */

type PlayerProfile struct {
	Username   string `json:"username"`
	Name       string `json:"name"`
	Country    string `json:"country"`
	Title      string `json:"title"`
	Fide       int    `json:"fide"`
	Followers  int    `json:"followers"`
	Joined     int64  `json:"joined"`
	LastOnline int64  `json:"last_online"`
}

type ChessRatingLast struct {
	Rating int `json:"rating"`
	Date   int `json:"date"`
	Rd     int `json:"rd"`
}

type ChessRatingBest struct {
	Rating int    `json:"rating"`
	Date   int    `json:"date"`
	Game   string `json:"game"`
}

type ChessRatingRecord struct {
	Win  int `json:"win"`
	Draw int `json:"draw"`
	Loss int `json:"loss"`
}

type ChessRating struct {
	Last   ChessRatingLast   `json:"last"`
	Best   ChessRatingBest   `json:"best"`
	Record ChessRatingRecord `json:"record"`
}

type PlayerStats struct {
	ChessBullet ChessRating `json:"chess_bullet"`
	ChessBlitz  ChessRating `json:"chess_blitz"`
	ChessRapid  ChessRating `json:"chess_rapid"`
}

/* ----------------------------- Command ----------------------------- */

var comPlayerCmd = &cobra.Command{
	Use:   "player <username>",
	Short: "Run the player operation for the chess.com app",
	Long: `The player command is a specific utility to execute operations related to player within the chess.com application.

As a component of the chess tools, this command empowers you to interact directly with chess.com's player features via the CLI.`,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		username := strings.ToLower(args[0])

		profileURL := fmt.Sprintf("https://api.chess.com/pub/player/%s", username)
		statsURL := fmt.Sprintf("https://api.chess.com/pub/player/%s/stats", username)

		// ---- profile ----
		profileBody, err := requests.Get(profileURL, requests.Options{})
		if err != nil {
			fmt.Fprintln(os.Stderr, "❌ Failed to fetch player profile:", err)
			os.Exit(1)
		}

		var profile PlayerProfile
		if err := json.Unmarshal(profileBody, &profile); err != nil {
			fmt.Fprintln(os.Stderr, "❌ Failed to parse profile:", err)
			os.Exit(1)
		}

		// ---- stats ----
		statsBody, err := requests.Get(statsURL, requests.Options{})
		if err != nil {
			fmt.Fprintln(os.Stderr, "❌ Failed to fetch player stats:", err)
			os.Exit(1)
		}

		var stats PlayerStats
		if err := json.Unmarshal(statsBody, &stats); err != nil {
			fmt.Fprintln(os.Stderr, "❌ Failed to parse stats:", err)
			os.Exit(1)
		}

		// ---- output ----
		fmt.Println()
		fmt.Printf("♟ Player: %s\n", strings.ToUpper(profile.Username))
		fmt.Println("---------------------------------------------------------------")

		if profile.Name != "" {
			fmt.Printf("Name      : %s\n", profile.Name)
		}
		if profile.Title != "" {
			fmt.Printf("Title     : %s\n", colors.Red(profile.Title))
		}

		_, countryName := country(profile.Country)
		fmt.Printf("Country   : %s\n", countryName)

		if profile.Fide > 0 {
			fmt.Printf("FIDE      : %d\n", profile.Fide)
		}

		fmt.Printf("Followers : %s\n", numbers.Comma(profile.Followers))

		fmt.Println()
		fmt.Println("Ratings")
		fmt.Println()

		printRatingsHeader()
		printRating("Bullet", stats.ChessBullet)
		printRating("Blitz", stats.ChessBlitz)
		printRating("Rapid", stats.ChessRapid)
	},
}

func init() {
	rootCmd.AddCommand(comPlayerCmd)
}
