package main

import (
	"log"
	"net/http"
	"time"
)

// Keeps a single request bounded; rosters in production are large.
const maxWeeks = 26

type personCapacity struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	WeeklyHours float64   `json:"weeklyHours"`
	Allocated   []float64 `json:"allocated"` // one entry per week, same order as weeks
}

type capacityResponse struct {
	Weeks  []string         `json:"weeks"` // Monday of each week
	People []personCapacity `json:"people"`
}

// handleCapacity serves GET /api/capacity?from=YYYY-MM-DD&to=YYYY-MM-DD
//
// The range is widened to whole weeks (Monday to Sunday). Allocated hours
// count weekdays only.
func (s *server) handleCapacity(w http.ResponseWriter, r *http.Request) {
	from, err := time.Parse(time.DateOnly, r.URL.Query().Get("from"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "from must be YYYY-MM-DD")
		return
	}
	to, err := time.Parse(time.DateOnly, r.URL.Query().Get("to"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "to must be YYYY-MM-DD")
		return
	}
	if to.Before(from) {
		writeError(w, http.StatusBadRequest, "to must not be before from")
		return
	}

	from = mondayOf(from)
	to = mondayOf(to).AddDate(0, 0, 6)

	var weeks []string
	for d := from; d.Before(to); d = d.AddDate(0, 0, 7) {
		weeks = append(weeks, d.Format(time.DateOnly))
	}
	if len(weeks) > maxWeeks {
		writeError(w, http.StatusBadRequest, "range is limited to 26 weeks")
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
		)
		SELECT p.id, p.name, p.weekly_hours::float8, coalesce(al.hours, 0)::float8
		FROM people p
		CROSS JOIN weeks w
		LEFT JOIN allocated al ON al.person_id = p.id AND al.week_start = w.week_start
		ORDER BY p.name, p.id, w.week_start`, from, to)
	if err != nil {
		log.Printf("capacity query: %v", err)
		writeError(w, http.StatusInternalServerError, "could not load capacity")
		return
	}
	defer rows.Close()

	// Rows come ordered by person, then week, so each person's weeks are consecutive.
	people := []personCapacity{}
	for rows.Next() {
		var id int
		var name string
		var weeklyHours, hours float64
		if err := rows.Scan(&id, &name, &weeklyHours, &hours); err != nil {
			log.Printf("capacity scan: %v", err)
			writeError(w, http.StatusInternalServerError, "could not load capacity")
			return
		}
		if len(people) == 0 || people[len(people)-1].ID != id {
			people = append(people, personCapacity{ID: id, Name: name, WeeklyHours: weeklyHours})
		}
		last := &people[len(people)-1]
		last.Allocated = append(last.Allocated, hours)
	}
	if err := rows.Err(); err != nil {
		log.Printf("capacity rows: %v", err)
		writeError(w, http.StatusInternalServerError, "could not load capacity")
		return
	}

	writeJSON(w, http.StatusOK, capacityResponse{Weeks: weeks, People: people})
}

func mondayOf(t time.Time) time.Time {
	offset := (int(t.Weekday()) + 6) % 7 // Monday=0 ... Sunday=6
	return t.AddDate(0, 0, -offset)
}
