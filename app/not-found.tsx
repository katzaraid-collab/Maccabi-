import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap" style={{ minHeight: "80svh", display: "grid", placeContent: "center", justifyItems: "center", textAlign: "center", gap: 16, paddingTop: "var(--header-h)" }}>
      <p className="display latin" style={{ fontSize: "clamp(120px, 24vw, 300px)", color: "var(--yellow)", WebkitTextStroke: "3px var(--navy)" }}>
        404
      </p>
      <h1 className="display" style={{ fontSize: "clamp(32px, 5vw, 56px)" }}>
        הכדור יצא החוצה.
      </h1>
      <Link href="/" className="btn btn-navy">
        חזרה למגרש <span className="arrow">←</span>
      </Link>
    </div>
  );
}
