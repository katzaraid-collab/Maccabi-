"use client";

// Last resort when the root layout itself fails: no CSS modules or fonts can be
// trusted here, so it stays self-contained.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeContent: "center", gap: 20, padding: 24, background: "#000e62", color: "#fff", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 48, fontWeight: 900 }}>פסק זמן קצר.</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>משהו השתבש בטעינת החנות.</p>
        <button type="button" onClick={reset} style={{ justifySelf: "center", border: 0, background: "#f9d716", color: "#000e62", fontWeight: 800, fontSize: 16, padding: "14px 28px", cursor: "pointer" }}>
          לנסות שוב
        </button>
      </body>
    </html>
  );
}
