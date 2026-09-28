> **This branch was made after the deadline.** `main` is what I submitted. Everything here
> is follow-up work from reviewing my own submission, and it is not part of the assessment.

# Decisions

## What did the spec not tell you?

- Weekends. Some assignments run over Saturday and Sunday (Ana has one from Dec 29 to Jan 4).
  I only count weekdays. Counting all 7 days puts her at 56h on a 40h week, which isn't real.
- Partial weeks. The default range ends on a Friday. I widen any range to full weeks
  (Monday to Sunday), so every column compares a full week of work against a full week of capacity.
- How big a range can be. The brief says thousands of people and two years of history,
  so the API caps a request at 26 weeks. I didn't paginate people yet.
- Capacity history. `weekly_hours` is a single number with no dates, so changing it changes
  every week, past ones included. I kept it that way because the schema is fixed.
- Keeping the grid right after a save. I went optimistic: the new hours show up straight away
  in every cached range, and the server's answer replaces them when it comes back. If the save
  fails, the old value comes back and the error shows under the input. No refetch, because
  changing capacity doesn't change allocated hours.
- Server data. React Query handles loading, errors, retries and cancelling old requests when
  the range changes. No global store: server data lives in its cache.
- The range lives in the URL, so a view can be shared or reloaded. It's a small hook that works
  like useState but reads and writes the query string, with replaceState so the arrows don't
  fill the back button. A bad URL falls back to the default range, or gets the same fixes as
  the date inputs, and the URL is rewritten to match what's on screen.
- Zod only where data comes from outside and can be invalid: the API response and the date range in the URL.
- Plain <table> for the grid and Tailwind for styling, which is what I use every day.

## What did you notice that looked wrong?

- The same assignment shows up in many rows (15 for some), with the hours split between them.
  Summing them gives sensible numbers, so I sum and never dedupe.
- Eli Nakamura has 0 weekly hours and 20h allocated. Shown as over-allocated.
- Week of 2026-01-12: almost everyone is at 0 except the first five people. Looks like a gap
  in the seed. I left it.
- Jan 1 counts as a normal working day. There's no holiday data.
- Part-time people are often over, because allocations come in full 8h days.

## What did the AI get wrong that you caught?

- The first version of the capacity query was too clever: `array_agg` with `FILTER`, then
  rebuilding week indexes in Go. It also sent the raw database error to the client on a 500.
  I asked for something I could explain: now it's a plain `CROSS JOIN` of people and weeks,
  grouped in Go, and errors are logged with a generic message sent back.

## What would you do differently with a week?

- Capacity with an effective date: a capacity_changes table (person, effective_from, hours),
  so an edit applies from a chosen week on and the past stays as it was. Needs a schema change.
- Paginate people and virtualize rows with TanStack Virtual. 500 is fine, thousands isn't.
  The filters would move to the API at that point.
- Move the grid to TanStack Table. I like how it keeps table logic apart from markup, and it
  makes sorting (most over-allocated first) and pinned columns easy. Query, Table and Virtual
  are built to work together.
- A test for the edit flow, and handling two quick saves on the same person.
- Decide what "only over-allocated" should do right after an edit. Today the person drops
  out of the list as soon as they're no longer over, which could be confusing.
- A holidays table.
- More time on the visual design. As a standalone project I'd collect references on Behance
  and Dribbble and use Claude Design to explore it. Inside Toggl's overview page it should
  follow their design system.

## After the required parts

- The capacity endpoint no longer logs a cancelled request as an error. Moving between weeks
  fast aborts the old request all the way to Postgres, which is what we want, but it was
  filling the log with "errors" that weren't.
- Cells over capacity show how much over they are (+5h), so the manager doesn't do the math.
- Filters: search by name and "only over-allocated", kept in the URL with the same hook as
  the date range. They run in the browser, which is fine for 500 people.
