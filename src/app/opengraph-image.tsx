import { ImageResponse } from "next/og";

export const alt =
  "Dexta Synergy Services: design, software and print from one creative team";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default social preview (WhatsApp, LinkedIn, X, Facebook) for any page
 * that doesn't set its own image. Brand royal with the cyan accent.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#00086B",
        color: "#E8F3FF",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -160,
          top: -160,
          width: 620,
          height: 620,
          borderRadius: 9999,
          background: "#000C99",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 80,
          bottom: -220,
          width: 420,
          height: 420,
          borderRadius: 9999,
          background: "#00ABFF",
          opacity: 0.9,
          display: "flex",
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: -2,
          color: "#FFFFFF",
        }}
      >
        Dexta
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 820,
            color: "#FFFFFF",
          }}
        >
          Design, software and print from one creative team
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#00ABFF" }}>
          Dexta Synergy Services · Port Harcourt, Nigeria
        </div>
      </div>
    </div>,
    size,
  );
}
