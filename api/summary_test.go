package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSummaryMatchesTheFullList(t *testing.T) {
	s := testServer(t)
	const query = "from=2025-12-29&to=2026-01-16"
	_, people := fetchAll(t, s, query)

	var want capacitySummary
	for _, p := range people {
		want.People++
		over, full := false, false
		for _, hours := range p.Allocated {
			want.AllocatedHours += hours
			if hours > p.WeeklyHours {
				over = true
			}
			if p.WeeklyHours > 0 && hours == p.WeeklyHours {
				full = true
			}
		}
		want.CapacityHours += p.WeeklyHours * float64(len(p.Allocated))
		if over {
			want.OverPeople++
		} else if full {
			want.FullPeople++
		}
	}

	rec := httptest.NewRecorder()
	s.handleSummary(rec, httptest.NewRequest(http.MethodGet, "/api/capacity/summary?"+query, nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d: %s", rec.Code, rec.Body.String())
	}
	var got capacitySummary
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if got != want {
		t.Errorf("summary = %+v, want %+v", got, want)
	}
}

func TestSummaryIgnoresFiltersButChecksTheRange(t *testing.T) {
	s := testServer(t)

	rec := httptest.NewRecorder()
	s.handleSummary(rec, httptest.NewRequest(http.MethodGet, "/api/capacity/summary?from=2026-01-16&to=2026-01-01", nil))
	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
}
