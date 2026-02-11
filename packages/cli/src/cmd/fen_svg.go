/*
Copyright © 2025 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"fmt"
	"os"

	"github.com/notnil/chess"
	"github.com/spf13/cobra"
)

// fen2svgCmd represents the fen2svg command
var fen2svgCmd = &cobra.Command{
	Use:   "svg",
	Short: "Run the svg operation for the chess.graphics app",
	Long: `The svg command is a specific utility to execute operations related to svg within the chess.graphics application.

As a component of the chess tools, this command empowers you to interact directly with chess.graphics's svg features via the CLI.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		fenStr, _ := cmd.Flags().GetString("fen")
		outputFile, _ := cmd.Flags().GetString("out")

		if fenStr == "" {
			return fmt.Errorf("❌ you must provide a FEN string using --fen")
		}
		if outputFile == "" {
			outputFile = "board.svg"
		}

		game := chess.NewGame()
		opt, err := chess.FEN(fenStr)
		if err != nil {
			return fmt.Errorf("❌ failed to parse PGN: %w", err)
		}
		opt(game)

		board := game.Position().Board()
		svg := renderBoardSVG(board)

		if err := os.WriteFile(outputFile, []byte(svg), 0644); err != nil {
			return fmt.Errorf("❌ failed to write SVG: %w", err)
		}

		fmt.Println("✅ SVG saved to", outputFile)
		return nil
	},
}

func renderBoardSVG(board *chess.Board) string {
	const squareSize = 60
	const boardSize = squareSize * 8
	svg := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d">`, boardSize, boardSize)

	// Draw squares
	for rank := 0; rank < 8; rank++ {
		for file := 0; file < 8; file++ {
			x := file * squareSize
			y := (7 - rank) * squareSize
			color := "#b58863" // dark
			if (rank+file)%2 == 1 {
				color = "#f0d9b5" // light
			}
			svg += fmt.Sprintf(`<rect x="%d" y="%d" width="%d" height="%d" fill="%s"/>`, x, y, squareSize, squareSize, color)
		}
	}

	svg += `</svg>`
	return svg
}

func init() {
	fenCmd.AddCommand(fen2svgCmd)
	fen2svgCmd.Flags().String("fen", "", "FEN string to render")
	fen2svgCmd.Flags().String("out", "", "Output SVG file (default: board.svg)")
}
