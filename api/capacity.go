package main

import "net/http"

type personCapacity struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	WeeklyHours float64   `json:"weeklyHours"`
	Allocated   []float64 `json:"allocated"`
}

type capacityResponse struct {
	Weeks  []string         `json:"weeks"`
	People []personCapacity `json:"people"`
	Total  int              `json:"total"`
}

// handleCapacity serves GET /api/capacity?from=YYYY-MM-DD&to=YYYY-MM-DD
//
// It should return, for every person and every week in the requested range,
// how many hours they are allocated and how much capacity they have.
//
// The response shape is yours to design — the grid in web/ is the consumer.
func (s *server) handleCapacity(w http.ResponseWriter, r *http.Request) {
	p, bad := parseCapacityParams(r.URL.Query())
	if bad != nil {
		writeError(w, http.StatusBadRequest, bad.code, bad.message)
		return
	}

	var total int
	if err := s.db.QueryRow(r.Context(), `SELECT count(*) FROM people`).Scan(&total); err != nil {
		writeInternalError(w, r, "load capacity", err)
		return
	}

	rows, err := s.db.Query(r.Context(), `
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
		),
		matching AS (
			SELECT p.id, p.name, p.weekly_hours
			FROM people p
			WHERE ($3 = '' OR position(lower($3) IN lower(p.name)) > 0)
			  AND (NOT $4 OR EXISTS (
			    SELECT 1 FROM allocated al
			    WHERE al.person_id = p.id AND al.hours > p.weekly_hours
			  ))
		)
		SELECT m.id, m.name, m.weekly_hours::float8, coalesce(al.hours, 0)::float8
		FROM matching m
		CROSS JOIN weeks w
		LEFT JOIN allocated al ON al.person_id = m.id AND al.week_start = w.week_start
		ORDER BY m.name, m.id, w.week_start`, p.From, p.To, p.Search, p.OverOnly)
	if err != nil {
		writeInternalError(w, r, "load capacity", err)
		return
	}
	defer rows.Close()

	people := []personCapacity{}
	for rows.Next() {
		var id int
		var name string
		var weeklyHours, hours float64
		if err := rows.Scan(&id, &name, &weeklyHours, &hours); err != nil {
			writeInternalError(w, r, "load capacity", err)
			return
		}
		if len(people) == 0 || people[len(people)-1].ID != id {
			people = append(people, personCapacity{ID: id, Name: name, WeeklyHours: weeklyHours})
		}
		last := &people[len(people)-1]
		last.Allocated = append(last.Allocated, hours)
	}
	if err := rows.Err(); err != nil {
		writeInternalError(w, r, "load capacity", err)
		return
	}

	writeJSON(w, http.StatusOK, capacityResponse{Weeks: p.Weeks, People: people, Total: total})
}
