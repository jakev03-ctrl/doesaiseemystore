const SOCIALS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/doesaiseemystore/",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1Dy4Xpr88v/",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/doesaiseemystore/",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M5 8.5h3V19H5zM6.5 4a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM10 8.5h2.9v1.4h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.6 2 3.6 4.6V19h-3v-5.4c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V19H10z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@doesaiseemystore.com";
  return (
    <footer className="site-footer">
      <div className="socials">
        {SOCIALS.map((x) => (
          <a key={x.name} href={x.href} target="_blank" rel="noopener noreferrer" aria-label={`DoesAISeeMyStore on ${x.name}`} title={x.name}>
            {x.icon}
          </a>
        ))}
      </div>
      <span>© {new Date().getFullYear()} DoesAISeeMyStore</span>
      <nav aria-label="Footer">
        <a href="/how-we-test">How we test</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
        {email && <a href={`mailto:${email}`}>{email}</a>}
      </nav>
    </footer>
  );
}
