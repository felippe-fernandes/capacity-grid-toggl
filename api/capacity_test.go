package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
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

func getCapacity(t *testing.T, s *server, query string) capacityPage {
	t.Helper()
	rec := httptest.NewRecorder()
	s.handleCapacity(rec, httptest.NewRequest(http.MethodGet, "/api/capacity?"+query, nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d: %s", rec.Code, rec.Body.String())
	}
	var page capacityPage
	if err := json.NewDecoder(rec.Body).Decode(&page); err != nil {
		t.Fatalf("decode: %v", err)
	}
	return page
}

func fetchAll(t *testing.T, s *server, query string) (capacityPage, []personCapacity) {
	t.Helper()
	first := getCapacity(t, s, query)
	people := slices.Clone(first.People)
	for next := first.NextCursor; next != ""; {
		page := getCapacity(t, s, query+"&cursor="+url.QueryEscape(next))
		if page.Matched != nil || page.Totals != nil {
			t.Errorf("a later page repeated matched or totals")
		}
		people = append(people, page.People...)
		next = page.NextCursor
	}
	return first, people
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
	first, people := fetchAll(t, s, "from=2025-12-29&to=2026-01-16")

	if want := []string{"2025-12-29", "2026-01-05", "2026-01-12"}; !slices.Equal(first.Weeks, want) {
		t.Fatalf("weeks = %v, want %v", first.Weeks, want)
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
			i := slices.IndexFunc(people, func(p personCapacity) bool { return p.ID == c.id })
			if i < 0 {
				t.Fatalf("person %d missing", c.id)
			}
			if got := people[i].Allocated; !slices.Equal(got, c.want) {
				t.Errorf("allocated = %v, want %v", got, c.want)
			}
		})
	}
}

func TestCapacityPagination(t *testing.T) {
	s := testServer(t)
	const query = "from=2025-12-29&to=2026-01-16&limit=37"
	first, people := fetchAll(t, s, query)

	if first.Matched == nil || len(people) != *first.Matched {
		t.Fatalf("walked %d people, matched = %v", len(people), first.Matched)
	}
	if len(first.People) != 37 || first.NextCursor == "" {
		t.Errorf("first page has %d people, next = %q", len(first.People), first.NextCursor)
	}

	seen := map[int]bool{}
	for i, p := range people {
		if seen[p.ID] {
			t.Fatalf("person %d appears twice", p.ID)
		}
		seen[p.ID] = true
		if i > 0 && people[i-1].Name == p.Name && people[i-1].ID > p.ID {
			t.Errorf("order broken at %s", p.Name)
		}
	}

	for w := range first.Weeks {
		var allocated, capacity float64
		for _, p := range people {
			allocated += p.Allocated[w]
			capacity += p.WeeklyHours
		}
		if got := first.Totals[w]; got.Allocated != allocated || got.Capacity != capacity {
			t.Errorf("week %d totals = %+v, want allocated %v capacity %v", w, got, allocated, capacity)
		}
	}
}

func TestCapacityFilters(t *testing.T) {
	s := testServer(t)
	const week = "from=2026-01-05&to=2026-01-11"
	_, all := fetchAll(t, s, week)

	t.Run("search matches part of the name, ignoring case", func(t *testing.T) {
		page := getCapacity(t, s, week+"&q=OKAF")
		if len(page.People) != 1 || page.People[0].Name != "Dee Okafor" || *page.Matched != 1 {
			t.Fatalf("page = %+v", page)
		}
	})

	t.Run("percent is searched as text, not as a wildcard", func(t *testing.T) {
		if page := getCapacity(t, s, week+"&q=%25"); len(page.People) != 0 || *page.Matched != 0 {
			t.Errorf("page = %+v", page)
		}
	})

	t.Run("over keeps exactly the people over capacity", func(t *testing.T) {
		want := 0
		for _, p := range all {
			if isOver(p) {
				want++
			}
		}
		if want == 0 {
			t.Fatal("expected someone over capacity in the seed")
		}
		first, over := fetchAll(t, s, week+"&over=1")
		if *first.Matched != want || len(over) != want {
			t.Errorf("matched = %d, walked %d, want %d", *first.Matched, len(over), want)
		}
		for _, p := range over {
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
		"from=2026-01-05&to=2026-01-11&limit=0",
		"from=2026-01-05&to=2026-01-11&cursor=!!!",
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
