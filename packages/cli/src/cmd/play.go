/*
Copyright © 2025 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/notnil/chess"
	"github.com/spf13/cobra"
)

// playCmd represents the play command
var playCmd = &cobra.Command{
	Use:   "play",
	Short: "Run the play operation for the chess.graphics app",
	Long: `The play command is a specific utility to execute operations related to play within the chess.graphics application.

As a component of the chess tools, this command empowers you to interact directly with chess.graphics's play features via the CLI.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		game := chess.NewGame()
		reader := bufio.NewReader(os.Stdin)

		blind, _ := cmd.Flags().GetBool("blind")

		fmt.Println("♟ Chess CLI - Interactive Play")
		fmt.Println("Type moves in SAN (e.g., e4, Nf3). Type 'exit' to quit.")
		if blind {
			fmt.Println("Blind mode is ON. Board will not be displayed. Type 'show' to view the board temporarily.")
		}
		fmt.Println()

		for game.Outcome() == chess.NoOutcome {
			if !blind {
				fmt.Println(game.Position().Board().Draw())
			}

			fmt.Printf("%s to move: ", game.Position().Turn())

			input, _ := reader.ReadString('\n')
			input = strings.TrimSpace(input)

			if input == "exit" {
				fmt.Println("Exiting game.")
				break
			}

			// In blind mode, show the board temporarily
			if blind && input == "show" {
				fmt.Println(game.Position().Board().Draw())
				continue
			}

			err := game.MoveStr(input)
			if err != nil {
				fmt.Println("❌ Invalid or illegal move:", err)
				continue
			}
		}

		// Print PGN moves
		fmt.Printf("\n♟ Game PGN:\n%s\n", game.String())

		// Print UCI moves
		fmt.Println("\n♟ Game UCI:")
		for _, move := range game.Moves() {
			fmt.Printf("%s ", move.String())
		}
		fmt.Println()

		if game.Outcome() != chess.NoOutcome {
			fmt.Println("Game over:", game.Outcome())
			fmt.Println("Method:", game.Method())
		}

		return nil
	},
}

func init() {
	rootCmd.AddCommand(playCmd)

	// Add blind flag
	playCmd.Flags().Bool("blind", false, "Hide the board after each move")
}
