"""
mailer.py — SMTP email sending for invite and password-reset flows.

Settings and templates live in the `settings` table, editable live from
the admin dashboard, same pattern as notifications.py. Two send paths:
  - send_email(): swallows errors, safe to call from a user-facing
    request (creating a member, requesting a reset) without risking a
    broken SMTP config breaking that request.
  - send_email_raising(): used by the test-send endpoint, where the
    admin actually needs to know if it failed and why.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from db import get_conn, get_setting

TIMEOUT = 10


def render_template(template: str, context: dict) -> str:
    try:
        return template.format(**context)
    except (KeyError, IndexError):
        return template


def _smtp_settings(conn) -> dict:
    return {
        "enabled": get_setting(conn, "smtp_enabled") == "1",
        "host": get_setting(conn, "smtp_host") or "",
        "port": int(get_setting(conn, "smtp_port") or "587"),
        "username": get_setting(conn, "smtp_username") or "",
        "password": get_setting(conn, "smtp_password") or "",
        "from_address": get_setting(conn, "smtp_from_address") or "",
        "from_name": get_setting(conn, "smtp_from_name") or "uLearn",
        "use_tls": get_setting(conn, "smtp_use_tls") == "1",
    }


def send_email_raising(to_address: str, subject: str, body: str):
    """Raises on failure — used by the admin test-send button, which
    needs to actually report whether the config works."""
    with get_conn() as conn:
        cfg = _smtp_settings(conn)

    if not cfg["host"] or not cfg["from_address"]:
        raise RuntimeError("SMTP host and from-address must be configured first")

    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = f"{cfg['from_name']} <{cfg['from_address']}>"
    msg["To"] = to_address
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(cfg["host"], cfg["port"], timeout=TIMEOUT) as server:
        if cfg["use_tls"]:
            server.starttls()
        if cfg["username"]:
            server.login(cfg["username"], cfg["password"])
        server.sendmail(cfg["from_address"], [to_address], msg.as_string())


def send_email(to_address: str, subject: str, body: str):
    """Fire-and-forget — never raises. Used from real user-facing flows
    (invite, forgot-password) where a broken SMTP config shouldn't break
    the request itself."""
    try:
        with get_conn() as conn:
            if get_setting(conn, "smtp_enabled") != "1":
                return
        send_email_raising(to_address, subject, body)
    except Exception:
        pass
