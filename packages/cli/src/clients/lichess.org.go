package clients

import (
	"encoding/json"
	"net/http"
	"net/url"
)

/* ----------------------------- Lichess Cloud Eval ----------------------------- */
type CloudEval struct {
	Pvs []struct {
		Cp   *int `json:"cp,omitempty"`
		Mate *int `json:"mate,omitempty"`
	} `json:"pvs"`
}

func CloudEvalCP(fen string, variant string) (int, error) {
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
