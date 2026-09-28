package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

type badRequest struct {
	code    string
	message string
}

type weekRange struct {
	From  time.Time
	To    time.Time
	Weeks []string
}

type cursor struct {
	Name string `json:"n"`
	ID   int    `json:"i"`
}

type capacityParams struct {
	weekRange
	Search   string
	OverOnly bool
	Limit    int
	After    *cursor
}

func parseWeekRange(q url.Values) (weekRange, *badRequest) {
	from, err := time.Parse(time.DateOnly, q.Get("from"))
	if err != nil {
		return weekRange{}, &badRequest{codeInvalidRange, "from must be YYYY-MM-DD"}
	}
	to, err := time.Parse(time.DateOnly, q.Get("to"))
	if err != nil {
		return weekRange{}, &badRequest{codeInvalidRange, "to must be YYYY-MM-DD"}
	}
	if to.Before(from) {
		return weekRange{}, &badRequest{codeInvalidRange, "to must not be before from"}
	}

	r := weekRange{From: mondayOf(from), To: mondayOf(to).AddDate(0, 0, 6)}
	if days := r.To.Sub(r.From).Hours() / 24; days+1 > maxWeeks*7 {
		return weekRange{}, &badRequest{codeRangeTooLarge, fmt.Sprintf("range is limited to %d weeks", maxWeeks)}
	}
	for d := r.From; d.Before(r.To); d = d.AddDate(0, 0, 7) {
		r.Weeks = append(r.Weeks, d.Format(time.DateOnly))
	}
	return r, nil
}

func parseCapacityParams(q url.Values) (capacityParams, *badRequest) {
	r, bad := parseWeekRange(q)
	if bad != nil {
		return capacityParams{}, bad
	}

	p := capacityParams{
		weekRange: r,
		Search:    strings.TrimSpace(q.Get("q")),
		OverOnly:  q.Get("over") == "1",
		Limit:     defaultLimit,
	}
	if utf8.RuneCountInString(p.Search) > maxSearchLen {
		return capacityParams{}, &badRequest{codeInvalidQuery, fmt.Sprintf("q is limited to %d characters", maxSearchLen)}
	}
	if raw := q.Get("limit"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n < 1 || n > maxLimit {
			return capacityParams{}, &badRequest{codeInvalidLimit, fmt.Sprintf("limit must be between 1 and %d", maxLimit)}
		}
		p.Limit = n
	}
	if raw := q.Get("cursor"); raw != "" {
		c, err := decodeCursor(raw)
		if err != nil {
			return capacityParams{}, &badRequest{codeInvalidCursor, "cursor is not valid"}
		}
		p.After = &c
	}
	return p, nil
}

func encodeCursor(c cursor) string {
	b, _ := json.Marshal(c)
	return base64.RawURLEncoding.EncodeToString(b)
}

func decodeCursor(s string) (cursor, error) {
	b, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		return cursor{}, err
	}
	var c cursor
	if err := json.Unmarshal(b, &c); err != nil {
		return cursor{}, err
	}
	if c.Name == "" || c.ID <= 0 {
		return cursor{}, errors.New("cursor is missing name or id")
	}
	return c, nil
}

func mondayOf(t time.Time) time.Time {
	offset := (int(t.Weekday()) + 6) % 7
	return t.AddDate(0, 0, -offset)
}
