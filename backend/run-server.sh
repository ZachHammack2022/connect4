#!/bin/sh
# Run from the repository root so the `backend` package is importable.
cd "$(dirname "$0")/.." && uvicorn backend.app:app --reload
