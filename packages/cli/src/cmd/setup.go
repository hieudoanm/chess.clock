// Package cmd ..
package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/hieudoanm/chess/src/clients"
	"github.com/hieudoanm/chess/src/data"

	"github.com/spf13/cobra"
)

// setup represents the setup command
var setup = &cobra.Command{
	Use:   "setup",
	Short: "Run the setup operation for the chess app",
	Long: `The setup command is a specific utility to execute operations related to setup within the chess application.

As a component of the chess tools, this command empowers you to interact directly with chess's setup features via the CLI.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		reader := bufio.NewReader(os.Stdin)

		// Default position
		positionIndex := 518

		// Prompt
		fmt.Print("Position (default 518): ")

		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)

		// If user provided input, parse it
		if input != "" {
			val, err := strconv.Atoi(input)
			if err != nil {
				return fmt.Errorf("❌ invalid number")
			}
			positionIndex = val
		}

		// Validate range
		if positionIndex < 1 || positionIndex > len(data.Positions) {
			return fmt.Errorf("❌ position must be between 1 and %d", len(data.Positions))
		}

		var position = data.Positions[positionIndex-1]
		fmt.Printf("Position %d: %s\n", positionIndex, position)

		// ---- convert to FEN ----
		fen := fmt.Sprintf("%s/pppppppp/8/8/8/8/PPPPPPPP/%s w KQkq - 0 1",
			strings.ToLower(position), position)
		fmt.Println("FEN:", fen)

		// ---- lichess.org Cloud Eval ----
		eval, err := clients.CloudEvalCP(fen, "chess960")
		if err != nil {
			return fmt.Errorf("❌ failed to evaluate position: %w", err)
		}

		fmt.Println("Evaluation (centipawns):", eval)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(setup)
}
