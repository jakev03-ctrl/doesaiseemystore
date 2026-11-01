export default function Footer() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "doesaiseemystore@outlook.com";
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} DoesAISeeMyStore</span>
      <nav aria-label="Footer">
        <a href="/privacy">Privacy</a>
        <a href="/contact">Contact</a>
        {email && <a href={`mailto:${email}`}>{email}</a>}
      </nav>
    </footer>
  );
}
