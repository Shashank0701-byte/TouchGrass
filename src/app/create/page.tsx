import Link from "next/link";

export default function CreateQuestPage() {
  return (
    <main className="landing-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span aria-hidden="true" className="create-leaf">✳</span>
          <span>touchgrass<span className="brand-ai">.ai</span></span>
        </Link>
        <Link className="back-link" href="/">BACK HOME <span aria-hidden="true">↗</span></Link>
      </header>
      <section className="hero create-hero" aria-labelledby="create-title">
        <p className="eyebrow"><span className="eyebrow-line" /> GOOD THINGS TAKE A LITTLE PREPARATION</p>
        <h1 id="create-title">Your quest is<br /><em>taking shape.</em></h1>
        <p className="hero-copy">
          We’re setting up your local quest maker. Soon you’ll choose how much
          time you have, pick what sounds good, and save a plan for offline.
        </p>
        <Link className="text-link" href="/">← Back to the beginning</Link>
      </section>
    </main>
  );
}
