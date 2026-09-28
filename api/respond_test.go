package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWriteErrorSendsCodeAndMessage(t *testing.T) {
	rec := httptest.NewRecorder()
	writeError(rec, http.StatusConflict, codeConflict, "someone changed it")

	if rec.Code != http.StatusConflict {
		t.Errorf("status = %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("content type = %q", ct)
	}
	var body errorBody
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body.Error.Code != codeConflict || body.Error.Message != "someone changed it" {
		t.Errorf("body = %+v", body)
	}
}

func TestWriteInternalErrorIgnoresCancelledRequests(t *testing.T) {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)

	writeInternalError(rec, req, "load capacity", context.Canceled)
	if rec.Body.Len() != 0 {
		t.Errorf("wrote %q for a cancelled request", rec.Body.String())
	}

	rec = httptest.NewRecorder()
	writeInternalError(rec, req, "load capacity", errors.New("boom"))
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("status = %d", rec.Code)
	}
}
