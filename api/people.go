package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5"
)

type updatePersonRequest struct {
	WeeklyHours *float64 `json:"weeklyHours"`
}

type personResponse struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	WeeklyHours float64 `json:"weeklyHours"`
}

// handleUpdatePerson serves PATCH /api/people/{id}
//
// It should update the person's weekly hours. What it returns is yours to
// design — the grid is the consumer, and it has state to keep honest.
func (s *server) handleUpdatePerson(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid person id")
		return
	}
	var req updatePersonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.WeeklyHours == nil {
		writeError(w, http.StatusBadRequest, "weeklyHours is required")
		return
	}
	hours := *req.WeeklyHours
	if hours < 0 || hours > 168 {
		writeError(w, http.StatusBadRequest, "weeklyHours must be between 0 and 168")
		return
	}

	var p personResponse
	err = s.db.QueryRow(r.Context(),
		`UPDATE people SET weekly_hours = $1 WHERE id = $2 RETURNING id, name, weekly_hours::float8`,
		hours, id,
	).Scan(&p.ID, &p.Name, &p.WeeklyHours)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "person not found")
		return
	}
	if err != nil {
		log.Printf("update person: %v", err)
		writeError(w, http.StatusInternalServerError, "could not save weekly hours")
		return
	}
	writeJSON(w, http.StatusOK, p)
}
