"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  AnimatePresence,
  type Variants,
} from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Shared animation variants                                          */
/* ------------------------------------------------------------------ */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const wordFade: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* Deterministic particle field (computed from index → no hydration drift) */
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  size: 2 + (i % 4),
  delay: (i % 6) * 0.7,
  duration: 5 + (i % 5),
}));

/* ------------------------------------------------------------------ */
/*  Navigation                                                         */
/* ------------------------------------------------------------------ */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <AnimatePresence>
        {scrolled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 border-b border-white/5 bg-gray-950/70 backdrop-blur-lg"
          />
        )}
      </AnimatePresence>

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Iron<span className="text-blue-500">Mind</span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-300">
          <Link href="/chat" className="transition-colors hover:text-white">
            Chat
          </Link>
          <Link href="/admin" className="transition-colors hover:text-white">
            Admin
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/10 px-4 py-1.5 transition-colors hover:border-blue-500/60 hover:text-white"
          >
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  const subtitle = "Ask any training, nutrition, or recovery question — get answers grounded in real principles, never guesses.";

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-[28rem] w-[28rem] rounded-full bg-purple-600/15 blur-[120px]" />

      {/* floating particles */}
      <div className="pointer-events-none absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="animate-float absolute rounded-full bg-cyan-300/40"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              // custom props consumed by the .animate-float keyframes
              ["--float-delay" as string]: `${p.delay}s`,
              ["--float-duration" as string]: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="animate-gradient-x bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-8xl"
        >
          IronMind
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 text-lg font-medium text-gray-200 sm:text-2xl"
        >
          AI Fitness Coach — Trained on Real Experience
        </motion.p>

        <motion.p
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-x-1.5 gap-y-1 text-base text-gray-400"
          transition={{ delayChildren: 0.8 }}
        >
          {subtitle.split(" ").map((word, i) => (
            <motion.span key={i} variants={wordFade}>
              {word}
            </motion.span>
          ))}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mt-10 flex items-center justify-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/chat"
              className="animate-pulse-glow inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-base font-semibold text-white"
            >
              Start Chatting
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* scroll indicator */}
      <motion.a
        href="#features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 hover:text-gray-300"
        aria-label="Scroll to features"
      >
        <motion.svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M12 5v14M6 13l6 6 6-6" />
        </motion.svg>
      </motion.a>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */

type Feature = { icon: React.ReactNode; title: string; description: string };

const FEATURES: Feature[] = [
  {
    title: "Zero Hallucination",
    description:
      "Answers come only from Sumer's stored principles. If it's not in the knowledge base, IronMind says so instead of making things up.",
    icon: (
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Zm-1.2 13-3-3 1.4-1.4 1.6 1.6 4.6-4.6L17 9l-6 6Z" />
    ),
  },
  {
    title: "Real Experience (5.5 Years)",
    description:
      "Every principle is drawn from 5.5 years of actual lifting — not scraped blog posts or generic fitness filler.",
    icon: (
      <path d="M6.5 6.5 4 9l2 2-1 1-2-2-1 1 8 8 1-1-2-2 1-1 2 2 2.5-2.5-2-2 1-1 2 2 1-1-8-8-1 1 2 2-1 1-2-2Z" />
    ),
  },
  {
    title: "Source Citations",
    description:
      "Each answer shows exactly which principles it drew from, with title and category — so you can see the reasoning.",
    icon: (
      <path d="M6 2h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm8 1.5V8h4.5L14 3.5ZM8 12h8v1.6H8V12Zm0 3.4h8V17H8v-1.6Z" />
    ),
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-md transition-shadow hover:shadow-2xl hover:shadow-blue-500/10"
    >
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 text-cyan-300 ring-1 ring-white/10">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          {feature.icon}
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">
        {feature.description}
      </p>
      <span className="pointer-events-none absolute right-5 top-5 text-xs font-mono text-white/10">
        0{index + 1}
      </span>
    </motion.div>
  );
}

function Features() {
  return (
    <section id="features" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Built to be trusted
          </h2>
          <p className="mt-3 text-gray-400">
            Not another chatbot that confidently invents advice.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How it works                                                       */
/* ------------------------------------------------------------------ */

const STEPS = [
  { title: "Ask", description: "Type your fitness question in plain language." },
  {
    title: "Search",
    description: "IronMind finds the most relevant stored principles by meaning.",
  },
  {
    title: "Answer",
    description: "Get a grounded response with the exact sources it used.",
  },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="relative px-6 py-28">
      <div ref={ref} className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-gray-400">Three steps, every time.</p>
        </div>

        <div className="relative mt-16 grid gap-10 md:grid-cols-3">
          {/* connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:block" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gray-950">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px]">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-950 text-lg font-bold text-white">
                    {i + 1}
                  </span>
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  About                                                              */
/* ------------------------------------------------------------------ */

function About() {
  return (
    <section id="about" className="relative px-6 py-28">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-10 text-center backdrop-blur-sm sm:p-14"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          About
        </p>
        <p className="mt-4 text-2xl font-medium leading-snug text-gray-100 sm:text-3xl">
          Built by Sumer Thakur — 5.5 years of lifting, translated into AI.
        </p>
        <p className="mx-auto mt-5 max-w-xl text-gray-400">
          IronMind turns hard-won training experience into an assistant that only
          speaks from what it actually knows. No hype, no hallucinations — just
          the principles that worked.
        </p>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-lg font-bold text-white">
            Iron<span className="text-blue-500">Mind</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Built by Sumer Thakur
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/SumerThakur1771/IronMind"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-gray-400 transition-colors hover:border-white/30 hover:text-white"
            aria-label="GitHub repository"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.09.68-.22.68-.49v-1.7c-2.78.62-3.37-1.2-3.37-1.2-.46-1.18-1.11-1.5-1.11-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.55-1.14-4.55-5.05 0-1.11.39-2.02 1.03-2.74-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.74 0 3.92-2.34 4.79-4.57 5.04.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.49A10.02 10.02 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
            </svg>
          </a>
          {/* social placeholders */}
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/5 text-gray-600"
            aria-label="Social link placeholder"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 5.9c-.7.3-1.5.5-2.3.6a4 4 0 0 0 1.8-2.2c-.8.5-1.7.8-2.6 1a4 4 0 0 0-6.8 3.6A11.3 11.3 0 0 1 3.6 4.8a4 4 0 0 0 1.2 5.3c-.6 0-1.2-.2-1.8-.5a4 4 0 0 0 3.2 3.9c-.6.2-1.2.2-1.8.1a4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.3 11.3 11.3 0 0 0 8.1 20c7.3 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.5-1.3 2-2.2Z" />
            </svg>
          </span>
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/5 text-gray-600"
            aria-label="Social link placeholder"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1ZM8.3 18H5.7V9.7h2.6V18ZM7 8.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM18.3 18h-2.6v-4.4c0-1.1 0-2.4-1.5-2.4s-1.7 1.1-1.7 2.3V18h-2.6V9.7h2.5v1.1h.1c.4-.7 1.2-1.4 2.5-1.4 2.7 0 3.2 1.8 3.2 4V18Z" />
            </svg>
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white antialiased">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <About />
      <Footer />
    </main>
  );
}
