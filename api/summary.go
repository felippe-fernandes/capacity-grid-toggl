package main

import (
	"context"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

type capacitySummary struct {
	People         int     `json:"people"`
	OverPeople     int     `json:"overPeople"`
	FullPeople     int     `json:"fullPeople"`
	AllocatedHours float64 `json:"allocatedHours"`
	CapacityHours  float64 `json:"capacityHours"`
}

const summaryQuery = allocationCTEs + `,
	per_person AS (
		SELECT
			p.weekly_hours,
			bool_or(coalesce(al.hours, 0) > p.weekly_hours) AS is_over,
			bool_or(p.weekly_hours > 0 AND coalesce(al.hours, 0) = p.weekly_hours) AS is_full,
			coalesce(sum(al.hours), 0) AS allocated
		FROM people p
		CROSS JOIN weeks w
		LEFT JOIN allocated al ON al.person_id = p.id AND al.week_start = w.week_start
		GROUP BY p.id, p.weekly_hours
	)
	SELECT
		count(*)::int,
		count(*) FILTER (WHERE is_over)::int,
		count(*) FILTER (WHERE is_full AND NOT is_over)::int,
		coalesce(sum(allocated), 0)::float8,
		(coalesce(sum(weekly_hours), 0) * (SELECT count(*) FROM weeks))::float8
	FROM per_person`

func (s *server) handleSummary(w http.ResponseWriter, r *http.Request) {
	rng, bad := parseWeekRange(r.URL.Query())
	if bad != nil {
		writeError(w, http.StatusBadRequest, bad.code, bad.message)
		return
	}
	summary, err := loadSummary(r.Context(), s.db, rng)
	if err != nil {
		writeInternalError(w, r, "load summary", err)
		return
	}
	writeJSON(w, http.StatusOK, summary)
}

func loadSummary(ctx context.Context, db *pgxpool.Pool, rng weekRange) (capacitySummary, error) {
	var s capacitySummary
	err := db.QueryRow(ctx, summaryQuery, rng.From, rng.To).
		Scan(&s.People, &s.OverPeople, &s.FullPeople, &s.AllocatedHours, &s.CapacityHours)
	if err != nil {
		return capacitySummary{}, fmt.Errorf("summary: %w", err)
	}
	return s, nil
}
