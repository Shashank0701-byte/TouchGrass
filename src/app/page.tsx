import Link from "next/link";
import { QuestShelf } from "@/components/quest-shelf";

function LeafMark() {
  return (
    <svg
      aria-hidden="true"
      className="leaf-mark"
      viewBox="0 0 48 48"
      fill="none"
    >
      <path
        d="M38.2 8.6C23.7 8.3 12.1 11.4 9.1 21.1c-1.7 5.4 1.4 10.1 6.4 10.8 8.1 1.1 18.8-8.8 22.7-23.3Z"
        fill="currentColor"
      />
      <path
        d="M11 39c5.6-10.5 12-16.6 21.5-23.4"
        stroke="#F2F2EB"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
      <path d="M13 35.4c4.6.4 8.8 2 12.1 5.1" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="landing-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="topbar">
        <Link className="brand" href="/" aria-label="TouchGrass AI home">
          <LeafMark />
          <span>touchgrass<span className="brand-ai">.ai</span></span>
        </Link>
        <div className="build-label"><span className="status-dot" /> LOCAL-FIRST COMPANION</div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow"><span className="eyebrow-line" /> A LITTLE LESS SCROLL. A LITTLE MORE SKY.</p>
        <h1 id="hero-title">Your next good day<br />starts <em>outside.</em></h1>
        <p className="hero-copy">
          A thoughtful outdoor quest, made with open AI and kept right here on
          your device. Get ready before you go. Then leave the signal behind.
        </p>
        <Link className="primary-link" href="/create">
          <span>Make me a quest</span>
          <span aria-hidden="true" className="arrow">↗</span>
        </Link>
        <div className="hero-note"><span aria-hidden="true">✳</span> No feed. No cloud account. Just you and the outside.</div>
      </section>

      <QuestShelf />

      <section className="promise-strip" aria-label="How TouchGrass works">
        <div className="promise-heading">THE PLAN IS SIMPLE</div>
        <ol className="promise-steps">
          <li><span className="step-number">01</span><span>Make a plan</span></li>
          <li><span className="step-number">02</span><span>Put your phone away</span></li>
          <li><span className="step-number">03</span><span>Come back a little lighter</span></li>
        </ol>
        <div className="tiny-sun" aria-hidden="true">✳</div>
      </section>

      <footer className="page-footer">
        <span>AN AI THAT GIVES YOU A REASON TO LOG OFF.</span>
        <span>MADE FOR THE REAL WORLD&nbsp; <span aria-hidden="true">↗</span></span>
      </footer>
    </main>
  );
}
