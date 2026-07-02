"use client";

export default function BlobTrackerPage() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#07101c" }}>
      <a
        href="/"
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          zIndex: 100,
          padding: "6px 12px",
          fontSize: 11,
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#5eead4",
          background: "rgba(7,16,28,0.72)",
          border: "1px solid rgba(94,234,212,0.3)",
          borderRadius: 4,
          textDecoration: "none",
        }}
      >
        ← back to site
      </a>
      <iframe
        src="https://blob-tracker-three.vercel.app"
        allow="camera"
        className="w-full h-full border-0"
        title="blob tracker"
      />
    </div>
  );
}
