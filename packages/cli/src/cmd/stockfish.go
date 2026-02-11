package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Piece int8
type Color int8

const (
	Empty Piece = 0
	WP    Piece = 1
	WN    Piece = 2
	WB    Piece = 3
	WR    Piece = 4
	WQ    Piece = 5
	WK    Piece = 6
	BP    Piece = -1
	BN    Piece = -2
	BB    Piece = -3
	BR    Piece = -4
	BQ    Piece = -5
	BK    Piece = -6
)

const (
	White Color = 1
	Black Color = -1
)

var pieceValue = map[Piece]int{
	WP: 100, WN: 320, WB: 330, WR: 500, WQ: 900, WK: 20000,
	BP: 100, BN: 320, BB: 330, BR: 500, BQ: 900, BK: 20000,
}

// board is 0..63, a1 = 0, h1 = 7, a8 = 56, h8 = 63
type Move struct {
	from int
	to   int
	prom Piece // promotion piece else Empty
	cap  Piece
}

type Game struct {
	board      [64]Piece
	sideToMove Color
	history    []Move
}

func main() {
	g := NewGame()
	reader := bufio.NewReader(os.Stdin)
	fmt.Println("SimpleGoChess — minimal github.com/hieudoanm/chess.engine. Type 'help' for commands.")
	g.PrintBoard()
	for {
		fmt.Print("> ")
		line, _ := reader.ReadString('\n')
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.Fields(line)
		switch parts[0] {
		case "help":
			fmt.Println(`Commands:
 help
 print
 moves
 undo
 perft N
 go depth N
 quit
 or make move like: e2e4 (or e7e8q for promotion)`)
		case "print":
			g.PrintBoard()
		case "moves":
			mvs := g.GenerateLegalMoves()
			fmt.Printf("Legal moves (%d):\n", len(mvs))
			for _, m := range mvs {
				fmt.Println(formatMove(m))
			}
		case "undo":
			if len(g.history) == 0 {
				fmt.Println("no moves to undo")
			} else {
				g.UndoMove()
			}
		case "perft":
			if len(parts) < 2 {
				fmt.Println("usage: perft N")
				continue
			}
			d, _ := strconv.Atoi(parts[1])
			start := time.Now()
			nodes := g.Perft(d)
			fmt.Printf("perft %d: %d nodes (%.3fs)\n", d, nodes, time.Since(start).Seconds())
		case "go":
			if len(parts) >= 3 && parts[1] == "depth" {
				depth, _ := strconv.Atoi(parts[2])
				start := time.Now()
				move := g.EngineMove(depth)
				elapsed := time.Since(start)
				if move.from == move.to && move.cap == Empty {
					fmt.Println("github.com/hieudoanm/chess.engine found no move")
				} else {
					fmt.Printf("github.com/hieudoanm/chess.engine plays %s (time %s)\n", formatMove(move), elapsed)
					g.MakeMove(move)
					g.PrintBoard()
				}
			} else {
				fmt.Println("usage: go depth N")
			}
		case "quit":
			return
		default:
			// try parse as move e2e4
			if len(parts[0]) >= 4 {
				mvstr := parts[0]
				m, ok := parseMoveString(mvstr, &g)
				if !ok {
					fmt.Println("invalid move format or illegal move")
				} else {
					g.MakeMove(m)
					g.PrintBoard()
				}
			} else {
				fmt.Println("unknown command (type 'help')")
			}
		}
	}
}

// NewGame initializes starting position
func NewGame() Game {
	var g Game
	// set up starting position FEN:
	startFEN := "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w"
	g.parseFEN(startFEN)
	return g
}

func (g *Game) parseFEN(fen string) {
	parts := strings.Split(fen, " ")
	rows := strings.Split(parts[0], "/")
	i := 56 // a8
	for _, r := range rows {
		file := 0
		for _, ch := range r {
			if ch >= '1' && ch <= '8' {
				empty := int(ch - '0')
				for k := 0; k < empty; k++ {
					g.board[i+file] = Empty
					file++
				}
			} else {
				var p Piece
				switch ch {
				case 'p':
					p = BP
				case 'r':
					p = BR
				case 'n':
					p = BN
				case 'b':
					p = BB
				case 'q':
					p = BQ
				case 'k':
					p = BK
				case 'P':
					p = WP
				case 'R':
					p = WR
				case 'N':
					p = WN
				case 'B':
					p = WB
				case 'Q':
					p = WQ
				case 'K':
					p = WK
				}
				g.board[i+file] = p
				file++
			}
		}
		i -= 8
	}
	if len(parts) > 1 && parts[1] == "w" {
		g.sideToMove = White
	} else {
		g.sideToMove = Black
	}
	g.history = nil
}

// PrintBoard shows ascii board
func (g *Game) PrintBoard() {
	for r := 7; r >= 0; r-- {
		fmt.Printf("%d  ", r+1)
		for f := 0; f < 8; f++ {
			p := g.board[r*8+f]
			fmt.Print(pieceChar(p), " ")
		}
		fmt.Println()
	}
	fmt.Println("   a b c d e f g h")
	fmt.Printf("Side to move: %s\n", map[Color]string{White: "White", Black: "Black"}[g.sideToMove])
}

func pieceChar(p Piece) string {
	switch p {
	case WP:
		return "P"
	case WN:
		return "N"
	case WB:
		return "B"
	case WR:
		return "R"
	case WQ:
		return "Q"
	case WK:
		return "K"
	case BP:
		return "p"
	case BN:
		return "n"
	case BB:
		return "b"
	case BR:
		return "r"
	case BQ:
		return "q"
	case BK:
		return "k"
	default:
		return "."
	}
}

// ===== Move generation (basic, legal-only by check test) =====

var knightOffsets = []int{17, 15, 10, 6, -6, -10, -15, -17}
var kingOffsets = []int{1, -1, 8, -8, 9, 7, -7, -9}
var bishopDirs = []int{9, 7, -7, -9}
var rookDirs = []int{8, -8, 1, -1}
var queenDirs = []int{9, 7, -7, -9, 8, -8, 1, -1}

func sqToRC(sq int) (r, c int) {
	return sq / 8, sq % 8
}

func insideBoard(sq int) bool {
	return sq >= 0 && sq < 64
}

func (g *Game) GenerateLegalMoves() []Move {
	var moves []Move
	side := g.sideToMove
	for sq := 0; sq < 64; sq++ {
		p := g.board[sq]
		if p == Empty || (Color(signOf(p)) != side) {
			continue
		}
		switch absPiece(p) {
		case WP, BP:
			moves = append(moves, g.generatePawnMoves(sq)...)
		case WN, BN:
			moves = append(moves, g.generateKnightMoves(sq)...)
		case WB, BB:
			moves = append(moves, g.generateSliderMoves(sq, bishopDirs)...)
		case WR, BR:
			moves = append(moves, g.generateSliderMoves(sq, rookDirs)...)
		case WQ, BQ:
			moves = append(moves, g.generateSliderMoves(sq, queenDirs)...)
		case WK, BK:
			moves = append(moves, g.generateKingMoves(sq)...)
		}
	}
	// now filter to legal (king not in check)
	var legal []Move
	for _, mv := range moves {
		captured := g.board[mv.to]
		g.makeMoveNoRecord(mv)
		kingSafe := !g.isKingAttacked(g.sideToMove.Opposite())
		g.unmakeMoveNoRecord(mv, captured)
		if kingSafe {
			legal = append(legal, mv)
		}
	}
	return legal
}

func (g *Game) generatePawnMoves(sq int) []Move {
	var res []Move
	p := g.board[sq]
	side := signOf(p)
	r, c := sqToRC(sq)
	dir := 8 * side // White side=1 -> +8 (up), Black=-1 -> -8
	// single forward
	fwd := sq + dir
	if insideBoard(fwd) && g.board[fwd] == Empty {
		// promotion?
		if (side == 1 && r == 6) || (side == -1 && r == 1) {
			// promote to Q, R, B, N
			for _, prom := range []Piece{WQ, WR, WB, WN} {
				if side == -1 {
					prom = Piece(int8(-prom))
				}
				res = append(res, Move{from: sq, to: fwd, prom: prom, cap: Empty})
			}
		} else {
			res = append(res, Move{from: sq, to: fwd, prom: Empty, cap: Empty})
			// double
			// startRank := 1
			// if side == 1 {
			// 	startRank = 1 // white pawn at rank 2 r==1?
			// }
			// our r is 0..7 row. For white pawns start at row 1 (rank2). For black row 6.
			if (side == 1 && r == 1) || (side == -1 && r == 6) {
				double := sq + dir*2
				if insideBoard(double) && g.board[double] == Empty {
					res = append(res, Move{from: sq, to: double, prom: Empty, cap: Empty})
				}
			}
		}
	}
	// captures
	for _, dc := range []int{-1, 1} {
		cf := c + dc
		if cf < 0 || cf > 7 {
			continue
		}
		to := fwd + dc
		if !insideBoard(to) {
			continue
		}
		if g.board[to] != Empty && signOf(g.board[to]) == -side {
			// capture (promotion?)
			if (side == 1 && r == 6) || (side == -1 && r == 1) {
				for _, prom := range []Piece{WQ, WR, WB, WN} {
					if side == -1 {
						prom = Piece(int8(-prom))
					}
					res = append(res, Move{from: sq, to: to, prom: prom, cap: g.board[to]})
				}
			} else {
				res = append(res, Move{from: sq, to: to, prom: Empty, cap: g.board[to]})
			}
		}
	}
	return res
}

func (g *Game) generateKnightMoves(sq int) []Move {
	var res []Move
	p := g.board[sq]
	side := signOf(p)
	for _, off := range knightOffsets {
		to := sq + off
		if !insideBoard(to) {
			continue
		}
		// ensure not wrapping rows incorrect (quick check)
		if !knightWrapOK(sq, to) {
			continue
		}
		if g.board[to] == Empty || signOf(g.board[to]) == -side {
			res = append(res, Move{from: sq, to: to, cap: g.board[to]})
		}
	}
	return res
}

func knightWrapOK(from, to int) bool {
	fr, fc := sqToRC(from)
	tr, tc := sqToRC(to)
	dr := abs(fr - tr)
	dc := abs(fc - tc)
	return (dr == 1 && dc == 2) || (dr == 2 && dc == 1)
}

func (g *Game) generateSliderMoves(sq int, dirs []int) []Move {
	var res []Move
	p := g.board[sq]
	side := signOf(p)
	for _, d := range dirs {
		to := sq + d
		for insideBoard(to) && !isWraparound(sq, to, d) {
			if g.board[to] == Empty {
				res = append(res, Move{from: sq, to: to, cap: Empty})
			} else {
				if signOf(g.board[to]) == -side {
					res = append(res, Move{from: sq, to: to, cap: g.board[to]})
				}
				break
			}
			to += d
		}
	}
	return res
}

func (g *Game) generateKingMoves(sq int) []Move {
	var res []Move
	p := g.board[sq]
	side := signOf(p)
	for _, off := range kingOffsets {
		to := sq + off
		if !insideBoard(to) || isWraparound(sq, to, off) {
			continue
		}
		if g.board[to] == Empty || signOf(g.board[to]) == -side {
			res = append(res, Move{from: sq, to: to, cap: g.board[to]})
		}
	}
	// castling not implemented (left as exercise)
	return res
}

func isWraparound(from, to, d int) bool {
	// crude: check column difference for horizontal-like moves
	fr, fc := sqToRC(from)
	tr, tc := sqToRC(to)
	if abs(fc-tc) > 2 { // large jump means wrap occurred
		return true
	}
	// for single-step moves, ensure stepping rows/cols is consistent
	_ = tr
	_ = fr
	return false
}

// helper signs and abs
func signOf(p Piece) int {
	if p < 0 {
		return -1
	}
	if p > 0 {
		return 1
	}
	return 0
}
func absPiece(p Piece) Piece {
	if p < 0 {
		return -p
	}
	return p
}

func abs(a int) int {
	if a < 0 {
		return -a
	}
	return a
}

func (c Color) Opposite() Color {
	if c == White {
		return Black
	}
	return White
}

// make/unmake (with history)
//
// For simplicity, MakeMove appends to history and flips side.

func (g *Game) MakeMove(m Move) {
	captured := g.board[m.to]
	// handle promotions
	moved := g.board[m.from]
	if m.prom != Empty {
		g.board[m.to] = m.prom
	} else {
		g.board[m.to] = moved
	}
	g.board[m.from] = Empty
	g.history = append(g.history, Move{from: m.from, to: m.to, prom: m.prom, cap: captured})
	g.sideToMove = g.sideToMove.Opposite()
}

func (g *Game) UndoMove() {
	if len(g.history) == 0 {
		return
	}
	last := g.history[len(g.history)-1]
	// last.cap stored captured piece
	// revert
	movedPiece := g.board[last.to]
	if last.prom != Empty {
		// it was a promotion: restore pawn for moved side
		if g.sideToMove == White {
			// we are undoing black's move, so moving piece was black promotion -> restore pawn
			g.board[last.from] = Piece(int8(-int(last.prom))) // hmm keep simple: restore pawn of appropriate color
		} else {
			g.board[last.from] = Piece(int8(last.prom)) // simplified handling
		}
	} else {
		g.board[last.from] = movedPiece
	}
	g.board[last.to] = last.cap
	g.history = g.history[:len(g.history)-1]
	g.sideToMove = g.sideToMove.Opposite()
}

// helpers for ephemeral make/unmake used in move legality checks/search
func (g *Game) makeMoveNoRecord(m Move) {
	moved := g.board[m.from]
	if m.prom != Empty {
		g.board[m.to] = m.prom
	} else {
		g.board[m.to] = moved
	}
	g.board[m.from] = Empty
	g.sideToMove = g.sideToMove.Opposite()
}

func (g *Game) unmakeMoveNoRecord(m Move, captured Piece) {
	// attempt to revert
	if m.prom != Empty {
		// restore pawn: we don't track original pawn color; determine by side to move (which was opposite)
		if g.sideToMove == White {
			// after making moveNoRecord, sideToMove was flipped; unmake flips back
			// restore pawn for black (moved piece's color is opposite)
			g.board[m.from] = Piece(int8(-int(m.prom))) // crude
		} else {
			g.board[m.from] = m.prom
		}
	} else {
		g.board[m.from] = g.board[m.to]
	}
	g.board[m.to] = captured
	g.sideToMove = g.sideToMove.Opposite()
}

// isKingAttacked checks if the given side's king square is attacked by opponent
func (g *Game) isKingAttacked(side Color) bool {
	// find king
	var kingSq int = -1
	var kingPiece Piece = WK
	if side == Black {
		kingPiece = BK
	}
	for i := 0; i < 64; i++ {
		if g.board[i] == kingPiece {
			kingSq = i
			break
		}
	}
	if kingSq == -1 {
		// no king? treat as attacked
		return true
	}
	opp := side.Opposite()
	// check knight attacks
	for _, off := range knightOffsets {
		to := kingSq + off
		if !insideBoard(to) || !knightWrapOK(kingSq, to) {
			continue
		}
		p := g.board[to]
		if p != Empty && signOf(p) == int(opp) && absPiece(p) == WN {
			return true
		}
	}
	// pawn attacks
	kR, kC := sqToRC(kingSq)
	for _, dc := range []int{-1, 1} {
		r := kR - int(opp) // pawns attack backward relative to side? easier: check squares that would be pawn attacks for opponent
		c := kC + dc
		if r < 0 || r > 7 || c < 0 || c > 7 {
			continue
		}
		sq := r*8 + c
		p := g.board[sq]
		if p != Empty && signOf(p) == int(opp) && absPiece(p) == WP {
			// absPiece compares to white constants but sign handles color
			return true
		}
	}
	// sliders
	for _, d := range queenDirs {
		to := kingSq + d
		for insideBoard(to) && !isWraparound(kingSq, to, d) {
			p := g.board[to]
			if p == Empty {
				to += d
				continue
			}
			if signOf(p) == int(opp) {
				ap := absPiece(p)
				if (d == 1 || d == -1 || d == 8 || d == -8) && (ap == WR || ap == WQ) {
					return true
				}
				if (d == 9 || d == 7 || d == -7 || d == -9) && (ap == WB || ap == WQ) {
					return true
				}
				// else blocked but not attacking
			}
			break
		}
	}
	// king adjacent
	for _, off := range kingOffsets {
		to := kingSq + off
		if !insideBoard(to) || isWraparound(kingSq, to, off) {
			continue
		}
		p := g.board[to]
		if p != Empty && signOf(p) == int(opp) && absPiece(p) == WK {
			return true
		}
	}
	return false
}

// ===== Simple evaluation =====
func (g *Game) Eval() int {
	score := 0
	for i := 0; i < 64; i++ {
		p := g.board[i]
		if p == Empty {
			continue
		}
		v := pieceValue[p]
		score += v
	}
	// from sideToMove perspective return positive if good for white
	return score
}

// ===== Search (alpha-beta) =====
func (g *Game) EngineMove(depth int) Move {
	best := Move{}
	bestScore := -99999999
	start := time.Now()
	moves := g.GenerateLegalMoves()
	if len(moves) == 0 {
		return best
	}
	// basic move ordering: captures first
	sortMovesCapturesFirst(moves)
	for _, m := range moves {
		captured := g.board[m.to]
		g.makeMoveNoRecord(m)
		score := -g.negamax(depth-1, -99999999, 99999999)
		g.unmakeMoveNoRecord(m, captured)
		if score > bestScore {
			bestScore = score
			best = m
		}
		// quick time check (not required; we keep it simple)
		if time.Since(start) > time.Second*30 {
			break
		}
	}
	return best
}

func (g *Game) negamax(depth, alpha, beta int) int {
	if depth == 0 {
		return g.Eval() * int(g.sideToMove)
	}
	moves := g.GenerateLegalMoves()
	if len(moves) == 0 {
		// checkmate or stalemate
		if g.isKingAttacked(g.sideToMove) {
			return -1000000 * int(g.sideToMove) // mate
		}
		return 0 // stalemate
	}
	sortMovesCapturesFirst(moves)
	value := -99999999
	for _, m := range moves {
		captured := g.board[m.to]
		g.makeMoveNoRecord(m)
		score := -g.negamax(depth-1, -beta, -alpha)
		g.unmakeMoveNoRecord(m, captured)
		if score > value {
			value = score
		}
		if value > alpha {
			alpha = value
		}
		if alpha >= beta {
			break
		}
	}
	return value
}

func sortMovesCapturesFirst(moves []Move) {
	// simple bubble-ish for small lists
	for i := 0; i < len(moves); i++ {
		for j := i + 1; j < len(moves); j++ {
			if moves[j].cap != Empty && moves[i].cap == Empty {
				moves[i], moves[j] = moves[j], moves[i]
			}
		}
	}
}

// ===== perft =====
func (g *Game) Perft(depth int) int {
	if depth == 0 {
		return 1
	}
	nodes := 0
	moves := g.GenerateLegalMoves()
	for _, m := range moves {
		captured := g.board[m.to]
		g.makeMoveNoRecord(m)
		nodes += g.Perft(depth - 1)
		g.unmakeMoveNoRecord(m, captured)
	}
	return nodes
}

// ===== utilities: move parsing/formatting =====

func sqFromAlgebraic(s string) (int, bool) {
	if len(s) != 2 {
		return 0, false
	}
	file := s[0] - 'a'
	rank := s[1] - '1'
	if file < 0 || file > 7 || rank < 0 || rank > 7 {
		return 0, false
	}
	return int(rank)*8 + int(file), true
}

func parseMoveString(s string, g *Game) (Move, bool) {
	// supports e2e4 and e7e8q (promotion)
	if len(s) < 4 {
		return Move{}, false
	}
	fromSq, ok := sqFromAlgebraic(s[0:2])
	if !ok {
		return Move{}, false
	}
	toSq, ok := sqFromAlgebraic(s[2:4])
	if !ok {
		return Move{}, false
	}
	prom := Empty
	if len(s) >= 5 {
		switch s[4] {
		case 'q', 'Q':
			prom = WQ
		case 'r', 'R':
			prom = WR
		case 'b', 'B':
			prom = WB
		case 'n', 'N':
			prom = WN
		default:
			prom = Empty
		}
		if g.board[fromSq] < 0 {
			prom = Piece(-int(prom))
		}
	}
	// find if this move is legal
	for _, mv := range g.GenerateLegalMoves() {
		if mv.from == fromSq && mv.to == toSq {
			// match promotion if provided
			if prom == Empty || mv.prom == prom {
				return mv, true
			}
		}
	}
	return Move{}, false
}

func formatMove(m Move) string {
	return fmt.Sprintf("%s%s", algebraicFrom(m.from), algebraicFrom(m.to))
}

func algebraicFrom(sq int) string {
	r, c := sqToRC(sq)
	return fmt.Sprintf("%c%d", 'a'+c, r+1)
}
