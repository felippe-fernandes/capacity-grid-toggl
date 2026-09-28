package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"slices"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

func testServer(t *testing.T) *server {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set")
	}
	db, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(db.Close)
	return &server{db: db}
}

func getCapacity(t *testing.T, s *server, query string) capacityResponse {
	t.Helper()
	rec := httptest.NewRecorder()
	s.handleCapacity(rec, httptest.NewRequest(http.MethodGet, "/api/capacity?"+query, nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d: %s", rec.Code, rec.Body.String())
	}
	var body capacityResponse
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	return body
}

func isOver(p personCapacity) bool {
	for _, hours := range p.Allocated {
		if hours > p.WeeklyHours {
			return true
		}
	}
	return false
}

func TestCapacityAgainstSeed(t *testing.T) {
	s := testServer(t)
	body := getCapacity(t, s, "from=2025-12-29&to=2026-01-16")

	if want := []string{"2025-12-29", "2026-01-05", "2026-01-12"}; !slices.Equal(body.Weeks, want) {
		t.Fatalf("weeks = %v, want %v", body.Weeks, want)
	}

	cases := []struct {
		name string
		id   int
		want []float64
	}{
		{"weekends are not counted", 1, []float64{40, 0, 30}},
		{"an assignment over a weekend splits between weeks", 2, []float64{0, 32, 8}},
		{"fragmented rows are summed", 4, []float64{0, 45, 40}},
		{"people with no capacity still get their allocations", 5, []float64{0, 20, 0}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			i := slices.IndexFunc(body.People, func(p personCapacity) bool { return p.ID == c.id })
			if i < 0 {
				t.Fatalf("person %d missing", c.id)
			}
			if got := body.People[i].Allocated; !slices.Equal(got, c.want) {
				t.Errorf("allocated = %v, want %v", got, c.want)
			}
		})
	}
}

func TestCapacityFilters(t *testing.T) {
	s := testServer(t)
	const week = "from=2026-01-05&to=2026-01-11"
	all := getCapacity(t, s, week)

	t.Run("search matches part of the name, ignoring case", func(t *testing.T) {
		body := getCapacity(t, s, week+"&q=OKAF")
		if len(body.People) != 1 || body.People[0].Name != "Dee Okafor" {
			t.Fatalf("people = %v", body.People)
		}
		if body.Total != all.Total {
			t.Errorf("total = %d, want %d", body.Total, all.Total)
		}
	})

	t.Run("percent is searched as text, not as a wildcard", func(t *testing.T) {
		if body := getCapacity(t, s, week+"&q=%25"); len(body.People) != 0 {
			t.Errorf("got %d people", len(body.People))
		}
	})

	t.Run("over keeps exactly the people over capacity", func(t *testing.T) {
		want := 0
		for _, p := range all.People {
			if isOver(p) {
				want++
			}
		}
		if want == 0 {
			t.Fatal("expected someone over capacity in the seed")
		}
		body := getCapacity(t, s, week+"&over=1")
		if len(body.People) != want {
			t.Errorf("got %d people, want %d", len(body.People), want)
		}
		for _, p := range body.People {
			if !isOver(p) {
				t.Errorf("%s is not over capacity", p.Name)
			}
		}
	})
}

func TestCapacityRejectsBadInput(t *testing.T) {
	s := testServer(t)
	for _, query := range []string{
		"to=2026-01-16",
		"from=banana&to=2026-01-16",
		"from=2026-01-16&to=2026-01-01",
		"from=2026-01-05&to=2027-01-05",
	} {
		t.Run(query, func(t *testing.T) {
			rec := httptest.NewRecorder()
			s.handleCapacity(rec, httptest.NewRequest(http.MethodGet, "/api/capacity?"+query, nil))
			if rec.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want 400", rec.Code)
			}
		})
	}
}
