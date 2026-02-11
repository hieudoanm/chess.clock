/*
Copyright © 2025 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"github.com/spf13/cobra"
)

// pgnCmd represents the pgn command
var pgnCmd = &cobra.Command{
	Use:   "pgn",
	Short: "Run the pgn operation for the chess.graphics app",
	Long: `The pgn command is a specific utility to execute operations related to pgn within the chess.graphics application.

As a component of the chess tools, this command empowers you to interact directly with chess.graphics's pgn features via the CLI.`,
}

func init() {
	rootCmd.AddCommand(pgnCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// pgnCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// pgnCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
