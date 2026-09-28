package main

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestLogRequestsRecordsMethodPathAndStatus(t *testing.T) {
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))
	handler := logRequests(logger, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTeapot)
	}))

	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/api/capacity", nil))

	var entry map[string]any
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("log line is not json: %q", buf.String())
	}
	if entry["method"] != "GET" || entry["path"] != "/api/capacity" || entry["status"] != float64(http.StatusTeapot) {
		t.Errorf("entry = %v", entry)
	}
}

func TestWithTimeoutGivesTheRequestADeadline(t *testing.T) {
	var deadline time.Time
	var ok bool
	handler := withTimeout(time.Second, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		deadline, ok = r.Context().Deadline()
	}))

	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil))

	if !ok || time.Until(deadline) > time.Second {
		t.Errorf("deadline = %v, ok = %v", deadline, ok)
	}
}
