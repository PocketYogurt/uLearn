import { useEffect, useState } from "react";
import { api } from "../api";
import { IconCheck, IconDownload, IconFileText } from "../icons.jsx";

/**
 * Renders non-video lesson types (doc/quiz — pdf, txt, md, etc.) since
 * these have no <video> element to play. No natural "ended" event exists
 * for a document, so completion is a manual button here.
 */
export default function DocViewer({ lesson, onMarkComplete }) {
  const ext = (lesson.file_name || "").split(".").pop()?.toLowerCase() || "";
  const isPdf = ext === "pdf";
  const isText = ["txt", "md"].includes(ext);

  const [textContent, setTextContent] = useState(null);
  const [textError, setTextError] = useState(null);

  useEffect(() => {
    if (!isText) return;
    setTextContent(null);
    setTextError(null);
    fetch(api.mediaUrl(lesson.id))
      .then((r) => {
        if (!r.ok) throw new Error(`Couldn't load file (${r.status})`);
        return r.text();
      })
      .then(setTextContent)
      .catch((e) => setTextError(e.message));
  }, [lesson.id, isText]);

  return (
    <div className="ct-doc-viewer card">
      {isPdf && (
        <iframe title={lesson.title} src={api.mediaUrl(lesson.id)} className="ct-doc-frame" />
      )}

      {isText && (
        <div className="ct-doc-text-wrap">
          {textError && <p className="alert alert-danger">{textError}</p>}
          {!textError && textContent === null && <div className="state-screen"><span className="spinner" /></div>}
          {textContent !== null && <pre className="ct-doc-text">{textContent}</pre>}
        </div>
      )}

      {!isPdf && !isText && (
        <div className="empty-state ct-doc-fallback">
          <IconFileText width={32} height={32} />
          <p>This lesson isn't a previewable format ({ext || "unknown"}).</p>
          <a href={api.mediaUrl(lesson.id)} download className="btn btn-primary">
            <IconDownload width={14} height={14} /> Download {lesson.file_name}
          </a>
        </div>
      )}

      <div className="ct-doc-footer">
        <button
          className={`btn ${lesson.completed ? "btn-secondary ct-doc-done" : "btn-primary"}`}
          onClick={() => onMarkComplete(lesson.id)}
        >
          <IconCheck width={14} height={14} /> {lesson.completed ? "Marked complete" : "Mark as complete"}
        </button>
      </div>

      <style>{`
        .ct-doc-viewer {
          overflow: hidden;
          min-height: 360px;
        }
        .ct-doc-frame {
          width: 100%;
          height: 70vh;
          border: none;
          background: #fff;
          display: block;
        }
        .ct-doc-text-wrap {
          padding: var(--space-5);
          max-height: 70vh;
          overflow-y: auto;
        }
        .ct-doc-text {
          white-space: pre-wrap;
          word-break: break-word;
          font-family: var(--font-body);
          font-size: var(--text-base);
          line-height: 1.65;
          color: var(--text);
          margin: 0;
        }
        .ct-doc-fallback { padding: 56px 24px; }
        .ct-doc-footer {
          padding: var(--space-3) var(--space-4) var(--space-4);
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid var(--border);
        }
        .ct-doc-done { color: var(--complete); border-color: rgba(53,196,140,0.35); }
      `}</style>
    </div>
  );
}
