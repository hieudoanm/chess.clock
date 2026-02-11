/*
Copyright © 2025 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/notnil/chess"
	"github.com/spf13/cobra"
)

// pgn2uciCmd represents the pgnToUci command
var pgn2uciCmd = &cobra.Command{
	Use:   "uci",
	Short: "Run the uci operation for the chess app",
	Long: `The uci command is a specific utility to execute operations related to uci within the chess application.

As a component of the chess tools, this command empowers you to interact directly with chess's uci features via the CLI.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		pgnFile, _ := cmd.Flags().GetString("pgn-file")
		pgnString, _ := cmd.Flags().GetString("pgn")

		// validation
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

		// parse PGN
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

		// convert moves to UCI
		var uciMoves []string
		position := chess.NewGame()
		for _, move := range moves {
			uciMoves = append(uciMoves, move.String())
			position.Move(move)
		}

		fmt.Println(strings.Join(uciMoves, " "))
		return nil
	},
}

func init() {
	pgnCmd.AddCommand(pgn2uciCmd)

	pgn2uciCmd.Flags().String("pgn-file", "", "Path to a PGN file")
	pgn2uciCmd.Flags().String("pgn", "", "Raw PGN string")
}
