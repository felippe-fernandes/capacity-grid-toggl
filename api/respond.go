package main

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
)

const (
	codeInvalidRange  = "invalid_range"
	codeRangeTooLarge = "range_too_large"
	codeInvalidQuery  = "invalid_query"
	codeInvalidLimit  = "invalid_limit"
	codeInvalidCursor = "invalid_cursor"
	codeInvalidID     = "invalid_id"
	codeInvalidBody   = "invalid_body"
	codeInvalidHours  = "invalid_hours"
	codeNotFound      = "not_found"
	codeConflict      = "conflict"
	codeUnavailable   = "unavailable"
	codeInternal      = "internal"
)

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type errorBody struct {
	Error apiError `json:"error"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, errorBody{Error: apiError{Code: code, Message: message}})
}

func writeInternalError(w http.ResponseWriter, r *http.Request, action string, err error) {
	if errors.Is(err, context.Canceled) {
		return
	}
	slog.ErrorContext(r.Context(), action+" failed", "err", err)
	writeError(w, http.StatusInternalServerError, codeInternal, "could not "+action)
}
