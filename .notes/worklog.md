# Worklog

Running notes on how this got built — decisions, assumptions, dead ends, and anything
left unfinished. Append as you go; a line or two per entry is right.

---

- branch `feat/capacity-grid`, one small branch per part
- conventional commits (api / web / notes)
- fresh windows machine: installed docker desktop + wsl2, no make so running docker compose directly
- capacity: range widened to full weeks (mon-sun), otherwise last column is a partial week against a full week of capacity
- only weekdays count. ana has 8h/day from 12-29 to 01-04 (includes sat/sun), 7 days would be 56h on a 40h week
- assignments are split into lots of rows (15 for the same assignment), so always sum, never dedupe
- capacity is the current weekly_hours for every week, schema has no history
- max 26 weeks per request. people not paginated yet, 500 is fine but prod has thousands
- jan 1 counts as a working day, there is no holiday data
- week of 2026-01-12: almost everyone is 0 except ids 1-5. looks like a gap in the seed, left as is
- changed branches to one per feature (capacity-view, edit-capacity, decisions), one per part was too granular
- first capacity query used array_agg + FILTER and rebuilt week indexes in go. worked but hard to read, and it sent raw db errors to the client. replaced with cross join people x weeks + generic error message
- eli nakamura has 0 weekly hours and 20h allocated, has to show as over
- frontend: react query for server state (loading, errors, retries, cancelling old requests when the range changes)
- no global store (zustand/redux). server data lives in the react query cache, the date range is local state in App
- plain <table> for the grid. tanstack table felt like too much for fixed columns. with thousands of people i'd add row virtualization (tanstack virtual)
- vite hmr didn't pick up changes on windows + docker, turned on usePolling in vite.config
- no hot reload for go without touching dockerfile/compose, rebuilding only the api container instead
- tailwind for styling, it's what i use day to day. plain css would've been enough here
- zod on the api response and url params. not for env, frontend has none
- range lives in the url via a small useSearchParamsState hook, no lib (nuqs wants a router)
- replaceState not pushState, arrows would flood the back button otherwise
- bad url: invalid dates -> default range, weird but valid -> same fixes as the inputs, url rewritten
- update on the "no global store" line: range ended up in the url, not in App state. still no store
- saw "context canceled" in api/db logs when changing range fast. that's the abort reaching postgres, working as intended. still logged as an error, could skip that
- split src into api/ hooks/ lib/. App.tsx and CapacityGrid.tsx stay where the brief points
- tests: url hook, range clamping, status rules (eli 20/0, dee 40/40). skipped dates.ts (covered through range) and the fetch client. saving effort for the edit flow
- how editing works:
  - capacity column is an input. enter or blur saves, esc cancels, same value or empty does nothing
  - on save, every cached capacity range gets the new weeklyHours right away, so colours update before the server answers
  - the old cache is kept. if the PATCH fails it's put back and the error shows under the input
  - on success the value the server returned replaces the optimistic one
  - no refetch after saving: allocated hours don't depend on weeklyHours, so patching the cache is enough
- edit logic in hooks/useUpdateWeeklyHours, input ui in components/CapacityInput
- api validates weeklyHours 0..168, 404 for unknown person. tested with curl + in the grid (-1 shows the error and rolls back)
- editing capacity rewrites past weeks too, no dates on weekly_hours. would need a capacity_changes table with effective_from, schema is fixed
- not done: two quick saves on the same person can race, no automated test for the edit flow
- after the required parts: stopped logging client cancellations (context canceled) as errors in the capacity endpoint. checked by clicking the arrows fast with `docker compose logs -f api` open, nothing new shows up
- after the required parts: cells over capacity show "+Xh" so the manager doesn't do the math
- filters: name search + "only over-allocated", both in the url with the same useSearchParamsState hook. hook now drops empty params so the url doesn't keep `?q=`
- filters run in the browser, fine for 500 people. with pagination they'd have to move to the api (?q=&over=1)
- no zod on filters, any url value maps to a valid filter (text is a search, anything but over=1 is off)
- with "only over-allocated" on, a person disappears as soon as you fix their capacity. makes sense but could surprise someone, left as is
- tests: filterPeople, parse/serialize filters, empty param removal in the hook. 28 passing
