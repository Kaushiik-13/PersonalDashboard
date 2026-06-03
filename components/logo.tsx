import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="logo-link">
      <div className="logo">
        <span className="logo-mark">K</span>
        <span className="logo-text">TechIntelligence</span>
      </div>
    </Link>
  );
}
