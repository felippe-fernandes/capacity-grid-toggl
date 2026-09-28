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
