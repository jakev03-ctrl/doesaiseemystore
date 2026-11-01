import ContactForm from "../components/ContactForm";
import Footer from "../components/Footer";

export const metadata = {
  title: "Contact | DoesAISeeMyStore",
  description: "Questions, feedback or a report you'd like removed? Get in touch with DoesAISeeMyStore.",
};

export default function Contact() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "doesaiseemystore@outlook.com";
  return (
    <>
      <main className="wrap narrow">
        <header className="top">
          <a href="/" className="logo">
            DoesAI<b>See</b>MyStore
          </a>
          <nav className="topnav" aria-label="Main">
            <a href="/news">News</a>
          </nav>
        </header>

        <div className="page-intro">
          <h1>Get in touch</h1>
          <p className="sub">
            Questions, feedback, ideas, or a report you'd like removed? Send us a message and we'll
            get back to you.
            {email && (
              <>
                {" "}
                You can also email <a href={`mailto:${email}`}>{email}</a>.
              </>
            )}
          </p>
        </div>

        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
