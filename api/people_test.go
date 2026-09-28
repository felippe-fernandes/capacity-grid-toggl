package main

import (
	"context"
	"encoding/json"
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

func TestUpdatePersonRejectsBadInput(t *testing.T) {
	s := testServer(t)
	cases := []struct {
		name, id, body string
		want           int
	}{
		{"id is not a number", "abc", `{"weeklyHours":10}`, http.StatusBadRequest},
		{"missing field", "5", `{}`, http.StatusBadRequest},
		{"negative hours", "5", `{"weeklyHours":-1}`, http.StatusBadRequest},
		{"more hours than a week has", "5", `{"weeklyHours":169}`, http.StatusBadRequest},
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
	ctx := context.Background()

	var original float64
	if err := s.db.QueryRow(ctx, `SELECT weekly_hours::float8 FROM people WHERE id = 5`).Scan(&original); err != nil {
		t.Fatalf("read original: %v", err)
	}
	t.Cleanup(func() {
		_, _ = s.db.Exec(context.Background(), `UPDATE people SET weekly_hours = $1 WHERE id = 5`, original)
	})

	rec := patchPerson(s, "5", `{"weeklyHours":12.5}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d: %s", rec.Code, rec.Body.String())
	}
	var saved personResponse
	if err := json.NewDecoder(rec.Body).Decode(&saved); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if saved.ID != 5 || saved.WeeklyHours != 12.5 {
		t.Errorf("saved = %+v", saved)
	}

	body := getCapacity(t, s, "from=2026-01-05&to=2026-01-11&q=Nakamura")
	if len(body.People) != 1 || body.People[0].WeeklyHours != 12.5 {
		t.Errorf("capacity after save = %+v", body.People)
	}
}
