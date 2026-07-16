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

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: EASE_OUT },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const wordFade: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

/* Reusable scroll-reveal wrapper */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 1, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
            transition={{ duration: 0.4 }}
            className="absolute inset-0 border-b border-white/5 bg-[#0a0f1e]/70 backdrop-blur-xl"
          />
        )}
      </AnimatePresence>

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white"
        >
          Iron<span className="text-blue-500">Mind</span>
        </Link>
        <div className="flex items-center gap-7 text-sm font-light text-gray-300">
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
  const subtitle =
    "Ask any training, nutrition, or recovery question — answers grounded in real principles, never guesses.";

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* grid + mesh depth layers */}
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="bg-mesh pointer-events-none absolute inset-0" />

      {/* radial spotlight behind the wordmark */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(59,130,246,0.30), rgba(139,92,246,0.16) 45%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
          className="animate-gradient-x bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 bg-clip-text text-7xl font-black leading-none tracking-tighter text-transparent sm:text-8xl md:text-[10rem]"
        >
          IronMind
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: EASE_OUT }}
          className="mt-8 text-xs font-light uppercase tracking-[0.35em] text-cyan-300/90 sm:text-sm sm:tracking-[0.45em]"
        >
          AI Fitness Coach — Trained on Real Experience
        </motion.p>

        <motion.p
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          transition={{ delayChildren: 0.9 }}
          className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-1.5 gap-y-1 text-base font-light leading-relaxed text-gray-400 sm:text-lg"
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
          transition={{ duration: 0.8, delay: 1.5, ease: EASE_OUT }}
          className="mt-12 flex items-center justify-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/chat"
              className="animate-border-glow group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-9 py-4 text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10"
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
                className="transition-transform group-hover:translate-x-1"
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
        transition={{ delay: 2.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500 hover:text-gray-300"
        aria-label="Scroll to features"
      >
        <motion.svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
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
      "Answers come only from Sumer's stored principles. If it's not in the knowledge base, IronMind says so instead of inventing advice.",
    icon: <path d="M12 3 5 6v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Zm-1 12-3-3 1.4-1.4L11 12.2l3.6-3.6L16 10l-5 5Z" />,
  },
  {
    title: "Real Experience (5.5 Years)",
    description:
      "Every principle is drawn from 5.5 years of actual lifting — not scraped blog posts or generic fitness filler.",
    icon: <path d="M6.5 6.5 4 9l2 2-1 1-2-2-1 1 8 8 1-1-2-2 1-1 2 2 2.5-2.5-2-2 1-1 2 2 1-1-8-8-1 1 2 2-1 1-2-2Z" />,
  },
  {
    title: "Source Citations",
    description:
      "Each answer shows exactly which principles it drew from, with title and category — so you can trace the reasoning.",
    icon: <path d="M6 2h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm8 1.5V8h4.5L14 3.5ZM8 12h8v1.6H8V12Zm0 3.4h8V17H8v-1.6Z" />,
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group relative rounded-3xl p-px"
    >
      {/* gradient border layer (animates on hover) */}
      <div className="animate-border-shimmer absolute inset-0 rounded-3xl bg-[linear-gradient(110deg,rgba(59,130,246,0.5),rgba(6,182,212,0.15),rgba(139,92,246,0.5),rgba(6,182,212,0.15),rgba(59,130,246,0.5))] opacity-40 transition-opacity duration-500 group-hover:opacity-100" />

      {/* inner card */}
      <div className="relative h-full rounded-3xl bg-gray-900/90 p-9 backdrop-blur-sm">
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          className="mb-6"
          fill="url(#iconGradient)"
        >
          {feature.icon}
        </svg>
        <h3 className="text-xl font-bold text-white">{feature.title}</h3>
        <p className="mt-3 text-sm font-light leading-relaxed text-gray-400">
          {feature.description}
        </p>
        <span className="pointer-events-none absolute right-7 top-7 font-mono text-xs text-white/10">
          0{index + 1}
        </span>
      </div>
    </motion.div>
  );
}

function Features() {
  return (
    <section id="features" className="relative px-6 py-52">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
            Built to be trusted
          </h2>
          <p className="mt-5 text-lg font-light text-gray-400">
            Not another chatbot that confidently invents advice.
          </p>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-20 grid gap-8 md:grid-cols-3"
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
  const inView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <section id="how-it-works" className="relative px-6 py-52">
      <div ref={ref} className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
            How it works
          </h2>
          <p className="mt-5 text-lg font-light text-gray-400">
            Three steps, every time.
          </p>
        </Reveal>

        <div className="relative mt-24 grid gap-16 md:grid-cols-3 md:gap-8">
          {/* connecting timeline line (draws itself on scroll) */}
          <div className="absolute left-0 right-0 top-8 hidden h-px overflow-hidden md:block">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.2 }}
              style={{ transformOrigin: "left" }}
              className="h-full w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500"
            />
          </div>

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.3 + i * 0.2 }}
              className="relative flex flex-col items-center text-center"
            >
              {/* watermark number */}
              <span className="pointer-events-none absolute -top-10 select-none text-8xl font-black leading-none text-white/[0.06]">
                {i + 1}
              </span>

              {/* node on the timeline */}
              <span className="relative z-10 mb-6 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 ring-8 ring-[#0a0f1e]" />

              <h3 className="text-2xl font-bold text-white">{step.title}</h3>
              <p className="mt-3 max-w-xs text-sm font-light leading-relaxed text-gray-400">
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
    <section
      id="about"
      className="relative overflow-hidden px-6 py-52"
      style={{
        background:
          "linear-gradient(180deg, transparent, rgba(59,130,246,0.06) 40%, rgba(139,92,246,0.08) 100%)",
      }}
    >
      <Reveal className="relative mx-auto max-w-4xl text-center">
        {/* decorative quotation mark */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 select-none bg-gradient-to-b from-blue-500/25 to-transparent bg-clip-text font-serif text-[16rem] leading-none text-transparent"
        >
          &ldquo;
        </span>

        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-cyan-400">
          About
        </p>
        <p className="mt-8 text-4xl font-bold leading-tight text-white sm:text-5xl">
          Built by Sumer Thakur — 5.5 years of lifting, translated into AI.
        </p>
        <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-gray-400">
          IronMind turns hard-won training experience into an assistant that only
          speaks from what it actually knows. No hype, no hallucinations — just
          the principles that worked.
        </p>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Final CTA + Footer                                                 */
/* ------------------------------------------------------------------ */

function FinalCTA() {
  return (
    <section className="relative px-6 py-44 text-center">
      <Reveal className="mx-auto max-w-2xl">
        <h2 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
          Ready to start?
        </h2>
        <p className="mt-5 text-lg font-light text-gray-400">
          Ask your first question and see the difference grounded answers make.
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="mt-10 inline-block"
        >
          <Link
            href="/chat"
            className="animate-border-glow inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-9 py-4 text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10"
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
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative px-6 pb-16 pt-20">
      {/* gradient divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-xl font-bold text-white">
            Iron<span className="text-blue-500">Mind</span>
          </p>
          <p className="mt-2 text-sm font-light text-gray-500">
            Built by Sumer Thakur
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/SumerThakur1771/IronMind"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-gray-400 transition-colors hover:border-white/30 hover:text-white"
            aria-label="GitHub repository"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.09.68-.22.68-.49v-1.7c-2.78.62-3.37-1.2-3.37-1.2-.46-1.18-1.11-1.5-1.11-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.55-1.14-4.55-5.05 0-1.11.39-2.02 1.03-2.74-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.74 0 3.92-2.34 4.79-4.57 5.04.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.49A10.02 10.02 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
            </svg>
          </a>
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/5 text-gray-600"
            aria-label="Social link placeholder"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 5.9c-.7.3-1.5.5-2.3.6a4 4 0 0 0 1.8-2.2c-.8.5-1.7.8-2.6 1a4 4 0 0 0-6.8 3.6A11.3 11.3 0 0 1 3.6 4.8a4 4 0 0 0 1.2 5.3c-.6 0-1.2-.2-1.8-.5a4 4 0 0 0 3.2 3.9c-.6.2-1.2.2-1.8.1a4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.3 11.3 11.3 0 0 0 8.1 20c7.3 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.5-1.3 2-2.2Z" />
            </svg>
          </span>
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/5 text-gray-600"
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
    <main className="grain relative min-h-screen overflow-x-hidden bg-[#0a0f1e] font-light text-white antialiased">
      {/* shared gradient definition for feature icons */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="iconGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>

      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <About />
      <FinalCTA />
      <Footer />
    </main>
  );
}
