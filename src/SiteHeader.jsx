export default function SiteHeader({
  brandHref = "#top",
  workHref = "#work",
  aboutHref = "#about",
  contactHref = "#contact"
}) {
  return (
    <header className="site-header">
      <nav className="nav-pill glass-chrome" aria-label="Site navigation">
        <a className="nav-pill-link nav-pill-brand" href={brandHref}>
          cameron
        </a>
        <span className="nav-pill-divider" aria-hidden="true" />
        <a className="nav-pill-link" href={workHref}>
          Case Studies
        </a>
        <a className="nav-pill-link" href={aboutHref}>
          About
        </a>
        <a className="nav-pill-link" href={contactHref}>
          Contact
        </a>
      </nav>
    </header>
  );
}
