"""
rate_limit.py — simple in-memory rate limiting for auth endpoints
(login, Jellyfin login, forgot-password, first-run setup).

In-memory rather than DB-backed: state resets on restart, which is an
acceptable tradeoff here — a restart is rare enough that briefly
reopening the window isn't a meaningful risk, and it avoids adding
write load to SQLite on every single request attempt.

Keyed by (IP, identifier) rather than IP alone or identifier alone:
  - IP alone would let one attacker's failed attempts against many
    different usernames lock out none of them individually but still
    hammer the server.
  - Identifier alone (e.g. just username) would let an attacker lock a
    *specific victim* out of their own account by deliberately failing
    their login repeatedly from anywhere — a denial-of-service on that
    person. Combining both means each IP gets its own budget per
    identifier, closing that griefing vector.
"""

import time
from collections import defaultdict
from fastapi import Request, HTTPException

WINDOW_SECONDS = 15 * 60  # 15 minutes
MAX_ATTEMPTS = 5

_attempts = defaultdict(list)  # key -> [timestamps of failures]


def get_client_ip(request: Request) -> str:
    """uLearn always runs behind a reverse proxy in production, so the
    real client IP arrives via X-Forwarded-For, not request.client —
    trusting request.client alone would bucket every real user under the
    proxy's single IP, making rate limiting either useless (shared
    budget) or actively harmful (one bad actor locks out everyone)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _prune(key: str) -> list:
    now = time.time()
    attempts = [t for t in _attempts[key] if now - t < WINDOW_SECONDS]
    _attempts[key] = attempts
    return attempts


def check_rate_limit(key: str):
    attempts = _prune(key)
    if len(attempts) >= MAX_ATTEMPTS:
        retry_after = int(WINDOW_SECONDS - (time.time() - attempts[0]))
        minutes = max(1, (retry_after + 59) // 60)
        raise HTTPException(
            status_code=429,
            detail=f"Too many attempts. Try again in {minutes} minute{'s' if minutes != 1 else ''}.",
        )


def record_failure(key: str):
    _prune(key)
    _attempts[key].append(time.time())


def record_success(key: str):
    _attempts.pop(key, None)
