package main

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type personCapacity struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	WeeklyHours float64   `json:"weeklyHours"`
	Allocated   []float64 `json:"allocated"`
}

type weekTotal struct {
	Allocated float64 `json:"allocated"`
	Capacity  float64 `json:"capacity"`
}

type capacityPage struct {
	Weeks      []string         `json:"weeks"`
	People     []personCapacity `json:"people"`
	Matched    *int             `json:"matched,omitempty"`
	Totals     []weekTotal      `json:"totals,omitempty"`
	NextCursor string           `json:"nextCursor,omitempty"`
}

type querier interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
}

const allocationCTEs = `
	WITH weeks AS (
		SELECT generate_series($1::date, $2::date, interval '1 week')::date AS week_start
	),
	workdays AS (
		SELECT d::date AS day, date_trunc('week', d)::date AS week_start
		FROM generate_series($1::date, $2::date, interval '1 day') AS d
		WHERE extract(isodow FROM d) <= 5
	),
	allocated AS (
		SELECT a.person_id, wd.week_start, sum(a.hours_per_day) AS hours
		FROM assignments a
		JOIN workdays wd ON wd.day BETWEEN a.start_date AND a.end_date
		WHERE a.start_date <= $2 AND a.end_date >= $1
		GROUP BY a.person_id, wd.week_start
	)`

const capacityCTEs = allocationCTEs + `,
	matching AS (
		SELECT p.id, p.name, p.weekly_hours
		FROM people p
		WHERE ($3 = '' OR position(lower($3) IN lower(p.name)) > 0)
		  AND (NOT $4 OR EXISTS (
		    SELECT 1 FROM allocated al
		    WHERE al.person_id = p.id AND al.hours > p.weekly_hours
		  ))
	)`
const peoplePageQuery = capacityCTEs + `,
	page AS (
		SELECT id, name, weekly_hours
		FROM matching
		WHERE $5::text IS NULL OR (name, id) > ($5::text, $6::int)
		ORDER BY name, id
		LIMIT $7
	)
	SELECT pg.id, pg.name, pg.weekly_hours::float8, coalesce(al.hours, 0)::float8
	FROM page pg
	CROSS JOIN weeks w
	LEFT JOIN allocated al ON al.person_id = pg.id AND al.week_start = w.week_start
	ORDER BY pg.name, pg.id, w.week_start`

const matchedTotalsQuery = capacityCTEs + `
	SELECT
		(SELECT count(*) FROM matching)::int,
		coalesce(sum(al.hours), 0)::float8,
		(SELECT coalesce(sum(weekly_hours), 0) FROM matching)::float8
	FROM weeks w
	LEFT JOIN allocated al ON al.week_start = w.week_start AND al.person_id IN (SELECT id FROM matching)
	GROUP BY w.week_start
	ORDER BY w.week_start`

func loadCapacityPage(ctx context.Context, db *pgxpool.Pool, p capacityParams) (capacityPage, error) {
	page := capacityPage{Weeks: p.Weeks}

	if p.After != nil {
		people, next, err := queryPeoplePage(ctx, db, p)
		if err != nil {
			return capacityPage{}, err
		}
		page.People, page.NextCursor = people, next
		return page, nil
	}

	tx, err := db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return capacityPage{}, fmt.Errorf("begin: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	matched, totals, err := queryMatchedTotals(ctx, tx, p)
	if err != nil {
		return capacityPage{}, err
	}
	people, next, err := queryPeoplePage(ctx, tx, p)
	if err != nil {
		return capacityPage{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return capacityPage{}, fmt.Errorf("commit: %w", err)
	}

	page.People, page.NextCursor = people, next
	page.Matched, page.Totals = &matched, totals
	return page, nil
}

func queryMatchedTotals(ctx context.Context, q querier, p capacityParams) (int, []weekTotal, error) {
	rows, err := q.Query(ctx, matchedTotalsQuery, p.From, p.To, p.Search, p.OverOnly)
	if err != nil {
		return 0, nil, fmt.Errorf("totals: %w", err)
	}
	defer rows.Close()

	matched := 0
	totals := make([]weekTotal, 0, len(p.Weeks))
	for rows.Next() {
		var t weekTotal
		if err := rows.Scan(&matched, &t.Allocated, &t.Capacity); err != nil {
			return 0, nil, fmt.Errorf("totals scan: %w", err)
		}
		totals = append(totals, t)
	}
	if err := rows.Err(); err != nil {
		return 0, nil, fmt.Errorf("totals rows: %w", err)
	}
	return matched, totals, nil
}

func queryPeoplePage(ctx context.Context, q querier, p capacityParams) ([]personCapacity, string, error) {
	var afterName *string
	var afterID *int
	if p.After != nil {
		afterName, afterID = &p.After.Name, &p.After.ID
	}

	rows, err := q.Query(ctx, peoplePageQuery, p.From, p.To, p.Search, p.OverOnly, afterName, afterID, p.Limit+1)
	if err != nil {
		return nil, "", fmt.Errorf("people: %w", err)
	}
	defer rows.Close()

	people := []personCapacity{}
	for rows.Next() {
		var id int
		var name string
		var weeklyHours, hours float64
		if err := rows.Scan(&id, &name, &weeklyHours, &hours); err != nil {
			return nil, "", fmt.Errorf("people scan: %w", err)
		}
		if len(people) == 0 || people[len(people)-1].ID != id {
			people = append(people, personCapacity{ID: id, Name: name, WeeklyHours: weeklyHours})
		}
		last := &people[len(people)-1]
		last.Allocated = append(last.Allocated, hours)
	}
	if err := rows.Err(); err != nil {
		return nil, "", fmt.Errorf("people rows: %w", err)
	}

	next := ""
	if len(people) > p.Limit {
		people = people[:p.Limit]
		last := people[len(people)-1]
		next = encodeCursor(cursor{Name: last.Name, ID: last.ID})
	}
	return people, next, nil
}
