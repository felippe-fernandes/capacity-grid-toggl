package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func patchPerson(s *server, id, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPatch, "/api/people/"+id, strings.NewReader(body))
	req.SetPathValue("id", id)
	rec := httptest.NewRecorder()
	s.handleUpdatePerson(rec, req)
	return rec
}

func restoreEliAfter(t *testing.T, s *server) float64 {
	t.Helper()
	var original float64
	if err := s.db.QueryRow(context.Background(), `SELECT weekly_hours::float8 FROM people WHERE id = 5`).Scan(&original); err != nil {
		t.Fatalf("read original: %v", err)
	}
	t.Cleanup(func() {
		_, _ = s.db.Exec(context.Background(), `UPDATE people SET weekly_hours = $1 WHERE id = 5`, original)
	})
	return original
}

func TestUpdatePersonRejectsBadInput(t *testing.T) {
	s := testServer(t)
	cases := []struct {
		name, id, body string
		want           int
	}{
		{"id is not a number", "abc", `{"weeklyHours":10}`, http.StatusBadRequest},
		{"missing field", "5", `{}`, http.StatusBadRequest},
		{"negative hours", "5", `{"weeklyHours":-1}`, http.StatusBadRequest},
		{"more than 80 hours", "5", `{"weeklyHours":81}`, http.StatusBadRequest},
		{"not a whole number", "5", `{"weeklyHours":12.5}`, http.StatusBadRequest},
		{"unknown field", "5", `{"weeklyHours":10,"name":"x"}`, http.StatusBadRequest},
		{"not json", "5", `hello`, http.StatusBadRequest},
		{"body too large", "5", `{"weeklyHours":` + strings.Repeat("0", 2000) + `1}`, http.StatusBadRequest},
		{"unknown person", "999999", `{"weeklyHours":10}`, http.StatusNotFound},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if rec := patchPerson(s, c.id, c.body); rec.Code != c.want {
				t.Errorf("status = %d, want %d (%s)", rec.Code, c.want, rec.Body.String())
			}
		})
	}
}

func TestUpdatePersonSavesAndReturnsThePerson(t *testing.T) {
	s := testServer(t)
	restoreEliAfter(t, s)

	rec := patchPerson(s, "5", `{"weeklyHours":12}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d: %s", rec.Code, rec.Body.String())
	}
	var saved personResponse
	if err := json.NewDecoder(rec.Body).Decode(&saved); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if saved.ID != 5 || saved.WeeklyHours != 12 {
		t.Errorf("saved = %+v", saved)
	}

	page := getCapacity(t, s, "from=2026-01-05&to=2026-01-11&q=Nakamura")
	if len(page.People) != 1 || page.People[0].WeeklyHours != 12 {
		t.Errorf("capacity after save = %+v", page.People)
	}
}

func TestUpdatePersonChecksTheExpectedValue(t *testing.T) {
	s := testServer(t)
	original := restoreEliAfter(t, s)

	t.Run("saves when the expected value is still current", func(t *testing.T) {
		rec := patchPerson(s, "5", fmt.Sprintf(`{"weeklyHours":20,"expectedWeeklyHours":%v}`, original))
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("refuses a stale expected value and returns the current one", func(t *testing.T) {
		rec := patchPerson(s, "5", `{"weeklyHours":30,"expectedWeeklyHours":7}`)
		if rec.Code != http.StatusConflict {
			t.Fatalf("status = %d: %s", rec.Code, rec.Body.String())
		}
		var body conflictBody
		if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if body.Error.Code != codeConflict || body.Current.ID != 5 || body.Current.WeeklyHours != 20 {
			t.Errorf("body = %+v", body)
		}
	})
}
