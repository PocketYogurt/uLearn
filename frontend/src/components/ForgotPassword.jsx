import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useBranding } from "../BrandingContext.jsx";
import { BrandMark } from "../icons.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { site_name, logo_url } = useBranding();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ct-auth-screen">
      <div className="ct-auth-card card">
        {logo_url ? (
          <img src={`/api${logo_url}`} alt="" className="ct-auth-logo" />
        ) : (
          <span className="ct-auth-mark"><BrandMark size={26} /></span>
        )}
        <h1 className="display ct-auth-title">Reset your password</h1>

        {sent ? (
          <>
            <p className="ct-auth-sub">
              If that email is registered, a reset link is on its way — check your inbox (and spam folder).
            </p>
            <Link to="/login" className="btn btn-secondary ct-auth-submit" style={{ textAlign: "center" }}>
              Back to sign in
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <p className="ct-auth-sub">Enter the email on your account and we'll send a reset link, if email is set up for this site.</p>
            {error && <p className="alert alert-danger">{error}</p>}
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
            </div>
            <button type="submit" className="btn btn-primary ct-auth-submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Send reset link"}
            </button>
            <Link to="/login" className="ct-back-link">Back to sign in</Link>
          </form>
        )}
      </div>

      <style>{`
        .ct-auth-screen {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-6);
          background:
            radial-gradient(circle at 18% -8%, var(--accent-soft), transparent 42%),
            var(--bg);
        }
        .ct-auth-card {
          width: 100%;
          max-width: 368px;
          padding: 36px 30px 30px;
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          box-shadow: var(--shadow-lg);
        }
        .ct-auth-mark { color: var(--accent); margin-bottom: var(--space-1); }
        .ct-auth-logo { height: 40px; width: auto; max-width: 180px; object-fit: contain; margin-bottom: var(--space-1); }
        .ct-auth-title { font-size: var(--text-xl); }
        .ct-auth-sub { color: var(--text-muted); font-size: var(--text-sm); margin: -8px 0 4px; line-height: 1.5; }
        .ct-auth-submit { padding: 11px; font-size: var(--text-md); text-decoration: none; }
        .ct-back-link { text-align: center; font-size: var(--text-sm); color: var(--text-muted); text-decoration: none; }
        .ct-back-link:hover { color: var(--text); }
      `}</style>
    </div>
  );
}
