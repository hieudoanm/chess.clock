/*
Copyright © 2025 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"github.com/spf13/cobra"
)

// fenCmd represents the platform command
var fenCmd = &cobra.Command{
	Use:   "fen",
	Short: "Run the fen operation for the chess app",
	Long: `The fen command is a specific utility to execute operations related to fen within the chess application.

As a component of the chess tools, this command empowers you to interact directly with chess's fen features via the CLI.`,
}

func init() {
	rootCmd.AddCommand(fenCmd)

	// Example flag: list platforms
	fenCmd.Flags().BoolP("list", "l", false, "List popular chess platforms")
}
