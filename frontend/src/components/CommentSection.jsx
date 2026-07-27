import { useEffect, useState } from "react";
import { api } from "../api";
import { IconMessageCircle, IconTrash } from "../icons.jsx";

function timeAgo(isoLike) {
  const then = new Date(isoLike.replace(" ", "T") + "Z").getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(then).toLocaleDateString();
}

export default function CommentSection({ lessonId }) {
  const [comments, setComments] = useState(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("ct_user") || "null");

  useEffect(() => {
    setComments(null);
    api.getComments(lessonId).then(setComments).catch((e) => setError(e.message));
  }, [lessonId]);

  const submit = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    setError(null);
    try {
      const created = await api.postComment(lessonId, text);
      setComments((prev) => [...(prev || []), created]);
      setDraft("");
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const remove = async (commentId) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await api.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card ct-comments">
      <h4><IconMessageCircle width={14} height={14} /> Discussion {comments?.length > 0 && `(${comments.length})`}</h4>

      {error && <p className="alert alert-danger">{error}</p>}

      {comments === null ? (
        <div className="state-screen" style={{ minHeight: 80 }}><span className="spinner" /></div>
      ) : comments.length === 0 ? (
        <p className="ct-comments-empty">No comments yet — say something about this lesson.</p>
      ) : (
        <ul className="ct-comment-list">
          {comments.map((c) => (
            <li key={c.id} className="ct-comment">
              <div className="ct-comment-head">
                <span className="ct-comment-author">
                  {c.username}
                  {c.is_admin ? <span className="badge badge-accent ct-comment-admin-badge">Admin</span> : null}
                </span>
                <span className="ct-comment-time">{timeAgo(c.created_at)}</span>
                {(c.user_id === currentUser?.id || currentUser?.is_admin) && (
                  <button className="btn btn-ghost btn-icon ct-comment-delete" onClick={() => remove(c.id)} aria-label="Delete comment">
                    <IconTrash width={13} height={13} />
                  </button>
                )}
              </div>
              <p className="ct-comment-body">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form className="ct-comment-form" onSubmit={submit}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          maxLength={2000}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !draft.trim()}>
          {posting ? "Posting…" : "Post comment"}
        </button>
      </form>

      <style>{`
        .ct-comments { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); }
        .ct-comments h4 {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: var(--text-sm);
          margin: 0;
          color: var(--text-muted);
          font-weight: 600;
        }
        .ct-comments-empty { font-size: var(--text-sm); color: var(--text-muted); margin: 0; }
        .ct-comment-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-3); }
        .ct-comment { border-bottom: 1px solid var(--border); padding-bottom: var(--space-3); }
        .ct-comment:last-child { border-bottom: none; padding-bottom: 0; }
        .ct-comment-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .ct-comment-author { font-size: var(--text-sm); font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .ct-comment-admin-badge { padding: 1px 7px; font-size: 10px; }
        .ct-comment-time { font-size: var(--text-xs); color: var(--text-faint); }
        .ct-comment-delete { margin-left: auto; color: var(--text-faint); padding: 4px; }
        .ct-comment-delete:hover { color: var(--danger); background: var(--danger-soft); }
        .ct-comment-body { font-size: var(--text-sm); line-height: 1.55; margin: 0; white-space: pre-wrap; word-break: break-word; }
        .ct-comment-form { display: flex; flex-direction: column; gap: var(--space-2); padding-top: var(--space-2); border-top: 1px solid var(--border); }
        .ct-comment-form textarea {
          font-family: var(--font-body);
          font-size: var(--text-sm);
          color: var(--text);
          background: var(--surface-raised);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 9px 11px;
          resize: vertical;
          min-height: 44px;
        }
        .ct-comment-form textarea:focus { outline: none; border-color: var(--accent-dim); }
        .ct-comment-form button { align-self: flex-end; }
      `}</style>
    </div>
  );
}
