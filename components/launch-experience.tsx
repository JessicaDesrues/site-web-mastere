"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUpRight, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PerfumeScene from "@/components/perfume-scene";

const launchAt = new Date("2026-12-20T00:00:00+01:00").getTime();

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, launchAt - Date.now());
      const days = Math.floor(remaining / 86_400_000);
      const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
      const minutes = Math.floor((remaining % 3_600_000) / 60_000);
      setTimeLeft({ days, hours, minutes });
    };

    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return timeLeft;
}

function Preloader() {
  return (
    <motion.div
      className="preloader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
      aria-label="Chargement de Nuit Rouge"
    >
      <div className="preloader-mark">
        <DotLottieReact src="/preloader.json" autoplay loop />
      </div>
      <motion.p
        className="preloader-title"
        initial={{ opacity: 0, y: 12, letterSpacing: "0.45em" }}
        animate={{ opacity: 1, y: 0, letterSpacing: "0.24em" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        NUIT ROUGE
      </motion.p>
      <div className="preloader-bottom">
        <span>UNE NOUVELLE SIGNATURE</span>
        <span>01 / 01</span>
      </div>
    </motion.div>
  );
}

export default function LaunchExperience() {
  const [sceneReady, setSceneReady] = useState(false);
  const [minimumTimePassed, setMinimumTimePassed] = useState(false);
  const [entered, setEntered] = useState(false);
  const countdown = useCountdown();
  const handleSceneReady = useCallback(() => setSceneReady(true), []);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumTimePassed(true), 2300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (sceneReady && minimumTimePassed) setEntered(true);
  }, [sceneReady, minimumTimePassed]);

  return (
    <div className="site-shell">
      <PerfumeScene onReady={handleSceneReady} />
      <div className="ambient-glow" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />

      <AnimatePresence>{!entered && <Preloader key="preloader" />}</AnimatePresence>

      <motion.header
        className="site-header"
        initial={{ opacity: 0, y: -18 }}
        animate={entered ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <a href="#accueil" className="wordmark" aria-label="Nuit Rouge, accueil">
          <span className="wordmark-symbol">N<span>°</span>1</span>
          <span className="wordmark-name">NUIT ROUGE</span>
        </a>
        <span className="header-edition">EAU DE PARFUM · ÉDITION 01</span>
        <a href="#decouvrir" className="header-link">
          LE RENDEZ-VOUS <ArrowUpRight size={14} strokeWidth={1.4} />
        </a>
      </motion.header>

      <main>
        <section id="accueil" className="hero-section section-frame">
          <div className="hero-copy content-layer">
            <motion.p
              className="eyebrow hero-eyebrow"
              initial={{ opacity: 0, x: -16 }}
              animate={entered ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.8, delay: 0.35 }}
            >
              <span className="eyebrow-line" /> UNE NOUVELLE INTENSITÉ
            </motion.p>
            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
              animate={entered ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 32, filter: "blur(8px)" }}
              transition={{ duration: 1.15, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              Le rouge,
              <br />
              <em>à l’état pur.</em>
            </motion.h1>
            <motion.p
              className="hero-description"
              initial={{ opacity: 0, y: 16 }}
              animate={entered ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.8, delay: 0.68 }}
            >
              Une empreinte chaude, profonde, inoubliable.
              <br />
              Nuit Rouge se révèle bientôt.
            </motion.p>
            <motion.a
              href="#histoire"
              className="round-link"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={entered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.7, delay: 0.88 }}
              aria-label="Explorer le parfum"
            >
              <span>EXPLORER</span>
              <ArrowDown size={15} strokeWidth={1.5} />
            </motion.a>
          </div>

          <div className="hero-serial" aria-hidden="true">
            <span>NR — 001</span>
            <span>48°51&apos; N / 2°21&apos; E</span>
          </div>
          <div className="hero-bottom content-layer">
            <span className="micro-label">UNE PRÉSENCE QUI RESTE.</span>
            <a href="#histoire" className="scroll-cue">
              DÉFILER POUR RESSENTIR <span className="scroll-cue-line" />
            </a>
          </div>
          <div className="vertical-index" aria-hidden="true">01 — 03</div>
        </section>

        <section id="histoire" className="story-section section-frame">
          <div className="story-copy content-layer">
            <p className="eyebrow"><span className="eyebrow-line" /> L’ACCORD SIGNATURE</p>
            <h2 className="section-title">
              La nuit
              <br />
              <em>a son empreinte.</em>
            </h2>
            <p className="story-description">
              D’abord la rose, veloutée et sombre. Puis le safran, incandescent.
              Enfin, les bois ambrés s’attardent sur la peau.
            </p>
            <div className="note-list">
              <div className="note-row"><span>01</span><span>ROSE NOIRE</span><i>Floral · velouté</i></div>
              <div className="note-row"><span>02</span><span>SAFRAN</span><i>Épicé · vibrant</i></div>
              <div className="note-row"><span>03</span><span>BOIS AMBRÉS</span><i>Chaud · persistant</i></div>
            </div>
            <a href="#decouvrir" className="text-link">LA SUITE, LE 20 DÉCEMBRE <ArrowUpRight size={15} /></a>
          </div>

          <div className="story-stamp" aria-hidden="true">
            <Sparkles size={15} strokeWidth={1} />
            <span>UNE CRÉATION<br />POUR LES HEURES<br />QUI COMPTENT</span>
            <span className="stamp-number">Nº 01</span>
          </div>
          <div className="vertical-index" aria-hidden="true">02 — 03</div>
        </section>

        <section id="decouvrir" className="launch-section section-frame">
          <div className="launch-copy content-layer">
            <p className="eyebrow"><span className="eyebrow-line" /> LE COMPTE À REBOURS EST LANCÉ</p>
            <h2 className="launch-title">Le début<br /><em>d’une histoire.</em></h2>
            <p className="launch-date-label">RENDEZ-VOUS LE</p>
            <p className="launch-date">20<span>.</span>12<span>.</span>26</p>
            <p className="launch-note">Nuit Rouge. Une première rencontre, bientôt.</p>

            <div className="countdown" aria-label={`${countdown.days} jours avant la sortie`}>
              <div><strong>{String(countdown.days).padStart(2, "0")}</strong><span>JOURS</span></div>
              <b>:</b>
              <div><strong>{String(countdown.hours).padStart(2, "0")}</strong><span>HEURES</span></div>
              <b>:</b>
              <div><strong>{String(countdown.minutes).padStart(2, "0")}</strong><span>MINUTES</span></div>
            </div>

            <a href="#accueil" className="launch-back-link">REMONTER <ArrowUpRight size={14} /></a>
          </div>
          <div className="launch-seal" aria-hidden="true">
            <span className="seal-top">NUIT ROUGE</span>
            <span className="seal-center">N<span>°</span>1</span>
            <span className="seal-bottom">20 · 12 · 26</span>
          </div>
          <div className="vertical-index" aria-hidden="true">03 — 03</div>
        </section>
      </main>

      <footer className="site-footer content-layer">
        <span>NUIT ROUGE <i>·</i> ÉDITION 01</span>
        <span>UNE NOUVELLE INTENSITÉ, LE 20.12.26</span>
        <a href="#accueil">HAUT DE PAGE <ArrowUpRight size={12} /></a>
      </footer>
    </div>
  );
}
