"""
notifications.py — outbound Discord/Telegram notifications for course
events (completion, new course added). Settings and templates live in the
`settings` table, editable live from the admin dashboard — no redeploy
needed to change a webhook URL or reword a message.

Sending is best-effort: a broken webhook should never break the user
action that triggered it (marking a lesson complete, rescanning the
library), so every send is wrapped and failures are swallowed after a
short timeout.
"""

import requests
from db import get_conn, get_setting

TIMEOUT = 5


def render_template(template: str, context: dict) -> str:
    try:
        return template.format(**context)
    except (KeyError, IndexError):
        # A placeholder in the template doesn't match the available
        # context for this event — better to send the raw template than
        # to fail the notification (and the user action) entirely.
        return template


def _send_discord(webhook_url: str, message: str):
    resp = requests.post(webhook_url, json={"content": message}, timeout=TIMEOUT)
    resp.raise_for_status()


def _send_telegram(bot_token: str, chat_id: str, message: str):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    resp = requests.post(url, json={"chat_id": chat_id, "text": message}, timeout=TIMEOUT)
    resp.raise_for_status()


def notify(event: str, context: dict):
    """event: 'course_completed' | 'course_added'. Reads current settings,
    renders the matching template, sends to every enabled channel. Never
    raises — failures are silent by design (see module docstring)."""
    try:
        with get_conn() as conn:
            template = get_setting(conn, f"template_{event}") or ""
            discord_enabled = get_setting(conn, "discord_enabled") == "1"
            discord_url = get_setting(conn, "discord_webhook_url") or ""
            telegram_enabled = get_setting(conn, "telegram_enabled") == "1"
            telegram_token = get_setting(conn, "telegram_bot_token") or ""
            telegram_chat_id = get_setting(conn, "telegram_chat_id") or ""

        if not template:
            return
        message = render_template(template, context)

        if discord_enabled and discord_url:
            try:
                _send_discord(discord_url, message)
            except requests.RequestException:
                pass

        if telegram_enabled and telegram_token and telegram_chat_id:
            try:
                _send_telegram(telegram_token, telegram_chat_id, message)
            except requests.RequestException:
                pass
    except Exception:
        # Belt and braces — a notification must never take down the
        # actual request that triggered it.
        pass
