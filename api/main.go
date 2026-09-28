package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type server struct {
	db *pgxpool.Pool
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := run(ctx, logger); err != nil {
		logger.Error("api stopped", "err", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, logger *slog.Logger) error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://capacity:capacity@localhost:5432/capacity?sslmode=disable"
	}

	db, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return fmt.Errorf("connect: %w", err)
	}
	defer db.Close()

	if err := waitForDB(ctx, db); err != nil {
		return err
	}

	s := &server{db: db}
	httpServer := &http.Server{
		Addr:              ":8080",
		Handler:           logRequests(logger, s.routes()),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		logger.Info("listening", "addr", httpServer.Addr)
		errCh <- httpServer.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		return fmt.Errorf("listen: %w", err)
	case <-ctx.Done():
	}

	logger.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return httpServer.Shutdown(shutdownCtx)
}

func waitForDB(ctx context.Context, db *pgxpool.Pool) error {
	var err error
	for range 30 {
		if err = db.Ping(ctx); err == nil {
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(time.Second):
		}
	}
	return fmt.Errorf("ping: %w", err)
}

func (s *server) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", s.handleHealth)
	mux.HandleFunc("GET /api/capacity", s.handleCapacity)
	mux.HandleFunc("PATCH /api/people/{id}", s.handleUpdatePerson)
	return mux
}

func (s *server) handleHealth(w http.ResponseWriter, r *http.Request) {
	var people int
	if err := s.db.QueryRow(r.Context(), `SELECT count(*) FROM people`).Scan(&people); err != nil {
		slog.ErrorContext(r.Context(), "health check failed", "err", err)
		writeError(w, http.StatusServiceUnavailable, codeUnavailable, "database unavailable")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "people": people})
}
