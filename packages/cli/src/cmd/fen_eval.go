package cmd

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"

	"github.com/spf13/cobra"

	"github.com/hieudoanm/chess/src/utils/numbers"
	"github.com/hieudoanm/chess/src/utils/requests"
)

/* ----------------------------- Models ----------------------------- */

type CloudEvalPV struct {
	Moves string `json:"moves"`
	CP    int    `json:"cp"`
}

type CloudEvalResponse struct {
	FEN    string        `json:"fen"`
	Depth  int           `json:"depth"`
	KNodes int           `json:"knodes"`
	PVs    []CloudEvalPV `json:"pvs"`
}

/* ----------------------------- Command ----------------------------- */

var evalCmd = &cobra.Command{
	Use:   "eval",
	Short: "Run the eval operation for the chess app",
	Long: `The eval command is a specific utility to execute operations related to eval within the chess application.

As a component of the chess tools, this command empowers you to interact directly with chess's eval features via the CLI.`,
	Run: func(cmd *cobra.Command, args []string) {
		fen, _ := cmd.Flags().GetString("fen")
		multiPv, _ := cmd.Flags().GetInt("multipv")

		if fen == "" {
			fmt.Fprintln(os.Stderr, "❌ --fen is required")
			os.Exit(1)
		}

		if multiPv <= 0 {
			multiPv = 1
		}

		apiURL := fmt.Sprintf(
			"https://lichess.org/api/cloud-eval?fen=%s&multiPv=%d&variant=standard",
			url.QueryEscape(fen),
			multiPv,
		)

		body, err := requests.Get(apiURL, requests.Options{})
		if err != nil {
			fmt.Fprintln(os.Stderr, "❌ Failed to fetch evaluation:", err)
			os.Exit(1)
		}

		var eval CloudEvalResponse
		if err := json.Unmarshal(body, &eval); err != nil {
			fmt.Fprintln(os.Stderr, "❌ Failed to parse evaluation:", err)
			os.Exit(1)
		}

		// ---- output ----
		fmt.Println()
		fmt.Println("♞ lichess.org Cloud Evaluation")
		fmt.Println("------------------------------------------------")
		fmt.Printf("Depth : %d\n", eval.Depth)
		fmt.Printf("Nodes : %s\n", numbers.Comma(eval.KNodes))
		fmt.Println()

		for i, pv := range eval.PVs {
			fmt.Printf(
				"#%d  %+0.2f  %s\n",
				i+1,
				float64(pv.CP)/100.0,
				pv.Moves,
			)
		}
	},
}

func init() {
	evalCmd.Flags().String(
		"fen",
		"",
		"FEN string to evaluate (required)",
	)

	evalCmd.Flags().Int(
		"multipv",
		3,
		"Number of principal variations",
	)

	fenCmd.AddCommand(evalCmd)
}
