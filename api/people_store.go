package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	errPersonNotFound = errors.New("person not found")
	errStaleCapacity  = errors.New("weekly hours changed since they were read")
)

type personResponse struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	WeeklyHours float64 `json:"weeklyHours"`
}

func updateWeeklyHours(ctx context.Context, db *pgxpool.Pool, id, hours int, expected *float64) (personResponse, error) {
	var p personResponse
	err := db.QueryRow(ctx, `
		UPDATE people SET weekly_hours = $2
		WHERE id = $1 AND ($3::numeric IS NULL OR weekly_hours = $3)
		RETURNING id, name, weekly_hours::float8`, id, hours, expected).
		Scan(&p.ID, &p.Name, &p.WeeklyHours)
	if err == nil {
		return p, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return personResponse{}, fmt.Errorf("update: %w", err)
	}

	current, err := findPerson(ctx, db, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return personResponse{}, errPersonNotFound
	}
	if err != nil {
		return personResponse{}, fmt.Errorf("find: %w", err)
	}
	return current, errStaleCapacity
}

func findPerson(ctx context.Context, db *pgxpool.Pool, id int) (personResponse, error) {
	var p personResponse
	err := db.QueryRow(ctx, `SELECT id, name, weekly_hours::float8 FROM people WHERE id = $1`, id).
		Scan(&p.ID, &p.Name, &p.WeeklyHours)
	return p, err
}
