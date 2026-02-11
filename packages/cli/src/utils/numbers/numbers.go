package numbers

import (
	"strconv"
	"strings"
)

func Comma(n int) string {
	s := strconv.Itoa(n)
	nLen := len(s)

	if nLen <= 3 {
		return s
	}

	var b strings.Builder
	pre := nLen % 3
	if pre > 0 {
		b.WriteString(s[:pre])
		if nLen > pre {
			b.WriteString(",")
		}
	}

	for i := pre; i < nLen; i += 3 {
		b.WriteString(s[i : i+3])
		if i+3 < nLen {
			b.WriteString(",")
		}
	}

	return b.String()
}
