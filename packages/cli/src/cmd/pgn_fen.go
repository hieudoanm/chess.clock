/*
Copyright © 2025 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/notnil/chess"
	"github.com/spf13/cobra"
)

/* ----------------------------- Eval Models ----------------------------- */
type EvalResult struct {
	MoveNumber int
	Side       string
	MoveSAN    string
	FEN        string
	Eval       int
	CPLoss     int
	Label      string
}

/* ----------------------------- Command ----------------------------- */
var pgn2fenCmd = &cobra.Command{
	Use:   "fen",
	Short: "Run the fen operation for the chess app",
	Long: `The fen command is a specific utility to execute operations related to fen within the chess application.

As a component of the chess tools, this command empowers you to interact directly with chess's fen features via the CLI.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		pgnFile, _ := cmd.Flags().GetString("pgn-file")
		pgnString, _ := cmd.Flags().GetString("pgn")

		if pgnFile == "" && pgnString == "" {
			return fmt.Errorf("❌ you must provide either --pgn-file or --pgn")
		}
		if pgnFile != "" && pgnString != "" {
			return fmt.Errorf("❌ please provide only one of --pgn-file or --pgn")
		}

		var pgn string
		if pgnFile != "" {
			data, err := os.ReadFile(pgnFile)
			if err != nil {
				return fmt.Errorf("❌ failed to read PGN file: %w", err)
			}
			pgn = string(data)
		} else {
			pgn = strings.TrimSpace(pgnString)
		}

		pgn = strings.ReplaceAll(pgn, ". ", ".")

		game := chess.NewGame()
		opt, err := chess.PGN(strings.NewReader(pgn))
		if err != nil {
			return fmt.Errorf("❌ failed to parse PGN: %w", err)
		}
		opt(game)

		moves := game.Moves()
		if len(moves) == 0 {
			return fmt.Errorf("❌ no moves found in PGN")
		}

		// Print table header with Eval column
		fmt.Printf("| %-4s | %-5s | %-6s | %-72s | %-7s | %-7s | %-10s |\n",
			"Move", "Side", "SAN", "FEN", "Eval", "Loss", "Label")
		fmt.Printf("| %-4s | %-5s | %-6s | %-72s | %-7s | %-7s | %-10s |\n", strings.Repeat("-", 4), strings.Repeat("-", 5), strings.Repeat("-", 6), strings.Repeat("-", 72), strings.Repeat("-", 7), strings.Repeat("-", 7), strings.Repeat("-", 10))

		position := chess.NewGame()
		prevEval := 0

		for i, move := range moves {
			position.Move(move)
			fen := position.Position().String()

			// Evaluate move unless --no-eval
			eval := 0

			v, err := cloudEvalCP(fen, "standard")
			if err == nil {
				eval = v
			}
			time.Sleep(300 * time.Millisecond) // avoid rate limit

			cpLoss := abs(eval - prevEval)
			prevEval = eval

			side := "White"
			if i%2 == 1 {
				side = "Black"
			}
			moveNumber := (i / 2) + 1
			label := classifyMove(cpLoss)

			fmt.Printf("| %-4d | %-5s | %-6s | %-72s | %-7d | %-7d | %-10s |\n",
				moveNumber, side, move.String(), fen, eval, cpLoss, label)
		}

		return nil
	},
}

/* ----------------------------- Lichess Cloud Eval ----------------------------- */
type CloudEval struct {
	Pvs []struct {
		Cp   *int `json:"cp,omitempty"`
		Mate *int `json:"mate,omitempty"`
	} `json:"pvs"`
}

func cloudEvalCP(fen string, variant string) (int, error) {
	u := "https://lichess.org/api/cloud-eval"
	q := url.Values{}
	q.Set("fen", fen)
	q.Set("multiPv", "1")
	q.Set("variant", variant)

	resp, err := http.Get(u + "?" + q.Encode())
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	var data CloudEval
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return 0, err
	}

	if len(data.Pvs) == 0 {
		return 0, nil
	}

	pv := data.Pvs[0]
	if pv.Mate != nil {
		if *pv.Mate > 0 {
			return 10000, nil
		}
		return -10000, nil
	}
	if pv.Cp != nil {
		return *pv.Cp, nil
	}
	return 0, nil
}

/* ----------------------------- Helpers ----------------------------- */
func classifyMove(cp int) string {
	switch {
	case cp <= 20:
		return "Best"
	case cp <= 50:
		return "Good"
	case cp <= 100:
		return "Inaccuracy"
	case cp <= 200:
		return "Mistake"
	default:
		return "Blunder"
	}
}

func init() {
	pgnCmd.AddCommand(pgn2fenCmd)
	pgn2fenCmd.Flags().String("pgn-file", "", "Path to a PGN file")
	pgn2fenCmd.Flags().String("pgn", "", "Raw PGN string")
}
