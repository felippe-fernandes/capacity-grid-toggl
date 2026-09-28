package main

import "net/http"

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
	page, err := loadCapacityPage(r.Context(), s.db, p)
	if err != nil {
		writeInternalError(w, r, "load capacity", err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}
