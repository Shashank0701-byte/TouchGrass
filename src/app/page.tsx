import Link from "next/link";
import { QuestShelf } from "@/components/quest-shelf";
import { NetworkStatus } from "@/components/network-status";
import { LeafMark } from "@/components/leaf-mark";

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
        <NetworkStatus />
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
