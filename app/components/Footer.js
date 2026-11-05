export default function Footer() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "doesaiseemystore@outlook.com";
  const owner = process.env.NEXT_PUBLIC_OWNER_NAME || "Jake";
  // Add your business address in Vercel (NEXT_PUBLIC_BUSINESS_ADDRESS) when you have one.
  const address = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "";
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} DoesAISeeMyStore</span>
      <nav aria-label="Footer">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
        {email && <a href={`mailto:${email}`}>{email}</a>}
      </nav>
      <p className="footer-who">
        DoesAISeeMyStore is run by {owner}, based in the United Kingdom{address ? ` · ${address}` : ""}.
      </p>
    </footer>
  );
}
