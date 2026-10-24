import { ImageResponse } from "next/og";

export const alt = "LedgerLite, a full-stack internship project";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Share card shown when the site link is posted on LinkedIn and other apps.
export default function OpengraphImage() {
  const layers = [
    { name: "Browser", color: "#1267c9" },
    { name: "Next.js", color: "#7a3fd1" },
    { name: "FastAPI", color: "#159447" },
    { name: "PostgreSQL", color: "#be850b" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "white",
          backgroundImage: "linear-gradient(135deg, #073979 0%, #0e61b8 55%, #082d63 100%)",
          borderBottom: "14px solid #ffd65a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 18,
              border: "4px solid rgba(255,255,255,0.8)",
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            LL
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 40, fontWeight: 900 }}>LedgerLite</div>
            <div style={{ fontSize: 24, color: "#cceaff" }}>PSEB internship project</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.02, letterSpacing: -2 }}>
            Clear accounts.
          </div>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.02, letterSpacing: -2, color: "#ffd65a" }}>
            Calmer decisions.
          </div>
          <div style={{ marginTop: 22, fontSize: 30, color: "#d7edff" }}>
            Full-stack Next.js + FastAPI · 47 topics learned
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {layers.map((layer) => (
            <div
              key={layer.name}
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 16,
                backgroundColor: layer.color,
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              {layer.name}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
