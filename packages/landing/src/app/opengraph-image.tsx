import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Memex — Encrypted AI Memory for Developers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#0a0a0a",
          fontFamily: "system-ui, sans-serif",
          padding: "60px",
        }}
      >
        {/* Gradient glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, rgba(147,51,234,0.08) 50%, transparent 70%)",
          }}
        />

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: "80px",
            fontWeight: 800,
            letterSpacing: "-2px",
            color: "white",
            marginBottom: "20px",
          }}
        >
          memex
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: "28px",
            color: "#9ca3af",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: 1.4,
          }}
        >
          Persistent, encrypted memory for AI coding agents
        </div>

        {/* Trust signals */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "48px",
            fontSize: "18px",
            color: "#6b7280",
          }}
        >
          <span>AES-256-GCM</span>
          <span style={{ color: "#374151" }}>·</span>
          <span>Local-first</span>
          <span style={{ color: "#374151" }}>·</span>
          <span>Open Source</span>
          <span style={{ color: "#374151" }}>·</span>
          <span>MCP Protocol</span>
        </div>

        {/* Install command */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "40px",
            padding: "16px 28px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: "rgba(255,255,255,0.05)",
            fontSize: "20px",
            fontFamily: "monospace",
            color: "#d1d5db",
          }}
        >
          <span style={{ color: "#6b7280" }}>$</span>
          <span>npx memex-mcp init</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
