package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
)

type updatePersonRequest struct {
	WeeklyHours         *float64 `json:"weeklyHours"`
	ExpectedWeeklyHours *float64 `json:"expectedWeeklyHours"`
}

type conflictBody struct {
	Error   apiError       `json:"error"`
	Current personResponse `json:"current"`
}

// handleUpdatePerson serves PATCH /api/people/{id}
//
// It should update the person's weekly hours. What it returns is yours to
// design — the grid is the consumer, and it has state to keep honest.
func (s *server) handleUpdatePerson(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, codeInvalidID, "invalid person id")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<10)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	var req updatePersonRequest
	if err := decoder.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, codeInvalidBody, `body must be JSON like {"weeklyHours": 32}`)
		return
	}
	if req.WeeklyHours == nil {
		writeError(w, http.StatusBadRequest, codeInvalidBody, "weeklyHours is required")
		return
	}
	hours := *req.WeeklyHours
	if hours != math.Trunc(hours) || hours < minWeeklyHours || hours > maxWeeklyHours {
		writeError(w, http.StatusBadRequest, codeInvalidHours,
			fmt.Sprintf("weekly hours must be a whole number from %d to %d", minWeeklyHours, maxWeeklyHours))
		return
	}

	p, err := updateWeeklyHours(r.Context(), s.db, id, int(hours), req.ExpectedWeeklyHours)
	switch {
	case errors.Is(err, errPersonNotFound):
		writeError(w, http.StatusNotFound, codeNotFound, "person not found")
	case errors.Is(err, errStaleCapacity):
		writeJSON(w, http.StatusConflict, conflictBody{
			Error:   apiError{Code: codeConflict, Message: "weekly hours changed since you loaded them"},
			Current: p,
		})
	case err != nil:
		writeInternalError(w, r, "save weekly hours", err)
	default:
		writeJSON(w, http.StatusOK, p)
	}
}
