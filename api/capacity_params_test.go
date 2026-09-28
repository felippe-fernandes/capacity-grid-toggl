package main

import (
	"net/url"
	"strings"
	"testing"
)

func mustQuery(t *testing.T, raw string) url.Values {
	t.Helper()
	q, err := url.ParseQuery(raw)
	if err != nil {
		t.Fatalf("parse %q: %v", raw, err)
	}
	return q
}

func TestParseWeekRange(t *testing.T) {
	cases := []struct {
		name, query string
		first, last string
		count       int
		code        string
	}{
		{"widens to whole weeks", "from=2026-01-07&to=2026-01-14", "2026-01-05", "2026-01-12", 2, ""},
		{"a sunday stays in its own week", "from=2026-01-11&to=2026-01-11", "2026-01-05", "2026-01-05", 1, ""},
		{"26 weeks is allowed", "from=2026-01-05&to=2026-07-05", "2026-01-05", "2026-06-29", 26, ""},
		{"27 weeks is too many", "from=2026-01-05&to=2026-07-06", "", "", 0, codeRangeTooLarge},
		{"absurd range is refused without building it", "from=0001-01-01&to=9999-12-31", "", "", 0, codeRangeTooLarge},
		{"missing from", "to=2026-01-14", "", "", 0, codeInvalidRange},
		{"impossible date", "from=2026-02-30&to=2026-03-01", "", "", 0, codeInvalidRange},
		{"to before from", "from=2026-01-14&to=2026-01-07", "", "", 0, codeInvalidRange},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			r, bad := parseWeekRange(mustQuery(t, c.query))
			if c.code != "" {
				if bad == nil || bad.code != c.code {
					t.Fatalf("bad = %+v, want code %q", bad, c.code)
				}
				return
			}
			if bad != nil {
				t.Fatalf("unexpected error %+v", bad)
			}
			if len(r.Weeks) != c.count || r.Weeks[0] != c.first || r.Weeks[len(r.Weeks)-1] != c.last {
				t.Errorf("weeks = %v", r.Weeks)
			}
		})
	}
}

func TestParseCapacityParams(t *testing.T) {
	const week = "from=2026-01-05&to=2026-01-11"

	t.Run("defaults", func(t *testing.T) {
		p, bad := parseCapacityParams(mustQuery(t, week))
		if bad != nil || p.Limit != defaultLimit || p.Search != "" || p.OverOnly || p.After != nil {
			t.Errorf("p = %+v, bad = %+v", p, bad)
		}
	})

	t.Run("reads search, over and limit", func(t *testing.T) {
		p, bad := parseCapacityParams(mustQuery(t, week+"&q=%20dee%20&over=1&limit=50"))
		if bad != nil || p.Search != "dee" || !p.OverOnly || p.Limit != 50 {
			t.Errorf("p = %+v, bad = %+v", p, bad)
		}
	})

	t.Run("cursor survives a round trip", func(t *testing.T) {
		want := cursor{Name: "Dee Okafor", ID: 4}
		p, bad := parseCapacityParams(mustQuery(t, week+"&cursor="+encodeCursor(want)))
		if bad != nil || p.After == nil || *p.After != want {
			t.Errorf("after = %+v, bad = %+v", p.After, bad)
		}
	})

	for _, c := range []struct{ name, extra, code string }{
		{"limit zero", "&limit=0", codeInvalidLimit},
		{"limit too big", "&limit=201", codeInvalidLimit},
		{"limit not a number", "&limit=abc", codeInvalidLimit},
		{"cursor not base64", "&cursor=!!!", codeInvalidCursor},
		{"cursor without fields", "&cursor=e30", codeInvalidCursor},
		{"search too long", "&q=" + strings.Repeat("a", maxSearchLen+1), codeInvalidQuery},
	} {
		t.Run(c.name, func(t *testing.T) {
			if _, bad := parseCapacityParams(mustQuery(t, week+c.extra)); bad == nil || bad.code != c.code {
				t.Errorf("bad = %+v, want code %q", bad, c.code)
			}
		})
	}
}
