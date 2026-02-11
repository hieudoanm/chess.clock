/*
Copyright © 2025 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"bufio"
	"fmt"
	"math"
	"os"
	"strconv"
	"strings"

	"github.com/spf13/cobra"
)

// eloCmd represents the interactive Elo calculator
var eloCmd = &cobra.Command{
	Use:   "elo",
	Short: "Run the elo operation for the chess.elo app",
	Long: `The elo command is a specific utility to execute operations related to elo within the chess.elo application.

As a component of the chess tools, this command empowers you to interact directly with chess.elo's elo features via the CLI.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		reader := bufio.NewReader(os.Stdin)

		fmt.Print("Enter your rating: ")
		myInput, _ := reader.ReadString('\n')
		myRating, err := strconv.Atoi(strings.TrimSpace(myInput))
		if err != nil {
			return fmt.Errorf("invalid rating: %w", err)
		}

		fmt.Print("Enter opponent's rating: ")
		oppInput, _ := reader.ReadString('\n')
		opponentRating, err := strconv.Atoi(strings.TrimSpace(oppInput))
		if err != nil {
			return fmt.Errorf("invalid opponent rating: %w", err)
		}

		fmt.Print("Enter game result (1=win, 0.5=draw, 0=loss): ")
		scoreInput, _ := reader.ReadString('\n')
		score, err := strconv.ParseFloat(strings.TrimSpace(scoreInput), 64)
		if err != nil || score < 0 || score > 1 {
			return fmt.Errorf("invalid score, must be 0, 0.5, or 1")
		}

		// Optional K-factor
		k := 20
		fmt.Print("Enter K-factor (default 20, press Enter to skip): ")
		kInput, _ := reader.ReadString('\n')
		kInput = strings.TrimSpace(kInput)
		if kInput != "" {
			kTmp, err := strconv.Atoi(kInput)
			if err != nil {
				return fmt.Errorf("invalid K-factor: %w", err)
			}
			k = kTmp
		}

		expected := 1 / (1 + math.Pow(10, float64(opponentRating-myRating)/400))
		newRating := float64(myRating) + float64(k)*(score-expected)

		fmt.Printf("\nYour new rating: %.0f\n", newRating)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(eloCmd)
}
