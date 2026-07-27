import { useEffect, useRef } from "react";
import { IconX, IconDownload } from "../icons.jsx";

const WIDTH = 1200;
const HEIGHT = 848;

/**
 * Renders a completion certificate to a <canvas> and offers a PNG download.
 * Deliberately canvas-drawn rather than a screenshot library — zero new
 * dependencies, and it's just text/shapes so canvas is plenty.
 */
export default function Certificate({ courseTitle, username, onClose }) {
  const canvasRef = useRef(null);
  const dateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    // background
    ctx.fillStyle = "#0b0e14";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // subtle radial glow, top-left, matching the app's auth-screen treatment
    const grad = ctx.createRadialGradient(WIDTH * 0.15, -80, 0, WIDTH * 0.15, -80, 700);
    grad.addColorStop(0, "rgba(232,163,61,0.14)");
    grad.addColorStop(1, "rgba(232,163,61,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // outer border
    ctx.strokeStyle = "#262f42";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, WIDTH - 80, HEIGHT - 80);
    ctx.strokeStyle = "#e8a33d";
    ctx.lineWidth = 1;
    ctx.strokeRect(56, 56, WIDTH - 112, HEIGHT - 112);

    // flag mark
    ctx.fillStyle = "#e8a33d";
    const fx = WIDTH / 2 - 18, fy = 108;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + 36, fy);
    ctx.lineTo(fx + 36, fy + 20);
    ctx.lineTo(fx + 18, fy + 32);
    ctx.lineTo(fx, fy + 20);
    ctx.closePath();
    ctx.fill();

    // eyebrow
    ctx.fillStyle = "#8b93a7";
    ctx.font = "600 20px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "3px";
    ctx.fillText("CERTIFICATE OF COMPLETION", WIDTH / 2, 200);
    ctx.letterSpacing = "0px";

    // course title
    ctx.fillStyle = "#e7e9ee";
    ctx.font = "700 52px 'Space Grotesk', sans-serif";
    wrapText(ctx, courseTitle, WIDTH / 2, 300, 920, 62);

    // "awarded to"
    ctx.fillStyle = "#8b93a7";
    ctx.font = "400 20px Inter, sans-serif";
    ctx.fillText("awarded to", WIDTH / 2, 470);

    ctx.fillStyle = "#e8a33d";
    ctx.font = "700 44px 'Space Grotesk', sans-serif";
    ctx.fillText(username, WIDTH / 2, 530);

    // date
    ctx.fillStyle = "#8b93a7";
    ctx.font = "400 18px Inter, sans-serif";
    ctx.fillText(dateStr, WIDTH / 2, 590);

    // footer brand
    ctx.fillStyle = "#5c6478";
    ctx.font = "600 16px 'Space Grotesk', sans-serif";
    ctx.fillText("uLearn", WIDTH / 2, HEIGHT - 90);
  }, [courseTitle, username, dateStr]);

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    const lines = [];
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
  }

  const download = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `${courseTitle.replace(/[^a-z0-9]+/gi, "-")}-certificate.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="ct-cert-backdrop" onClick={onClose}>
      <div className="ct-cert-modal" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-ghost btn-icon ct-cert-close" onClick={onClose} aria-label="Close">
          <IconX width={16} height={16} />
        </button>
        <canvas ref={canvasRef} className="ct-cert-canvas" />
        <div className="ct-cert-actions">
          <button className="btn btn-primary" onClick={download}>
            <IconDownload width={14} height={14} /> Download certificate
          </button>
        </div>
      </div>

      <style>{`
        .ct-cert-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-5);
          z-index: 60;
        }
        .ct-cert-modal {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: var(--space-4);
          box-shadow: var(--shadow-lg);
          max-width: 92vw;
        }
        .ct-cert-close { position: absolute; top: var(--space-2); right: var(--space-2); }
        .ct-cert-canvas {
          width: 100%;
          max-width: 640px;
          height: auto;
          border-radius: var(--radius-sm);
          display: block;
        }
        .ct-cert-actions { display: flex; justify-content: center; margin-top: var(--space-4); }
      `}</style>
    </div>
  );
}
