"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { price } from "@/lib/config";
import type { Kit } from "@/lib/types";
import s from "./ScrollFilm.module.css";

export type FilmKit = { kit: Kit; handle: string; title: string; price: number; cutout: string };

const LATIN: Partial<Record<Kit, string>> = { home: "HOME", away: "AWAY", third: "THIRD", fourth: "FOURTH" };
const HEB: Partial<Record<Kit, string>> = { home: "בית", away: "חוץ", third: "שלישית", fourth: "רביעית" };

const CHAPTERS = ["הלילה", "החולצות", "הצהוב"];

/* ---------- timeline math ---------- */
const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const inCubic = (t: number) => t * t * t;
const outBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
// A fluorescent strike: two failed sparks, then on.
const strike = (t: number) => (t <= 0 ? 0 : t < 0.18 ? 0.85 : t < 0.32 ? 0.08 : t < 0.42 ? 1 : t < 0.55 ? 0.3 : outCubic(clamp((t - 0.55) / 0.45)) * 0.3 + 0.7);

// Lamp banks strike in this order (fraction of the whole film).
const LAMP_AT = [0, 0.135, 0.175, 0.215];

export function ScrollFilm({ kits, video }: { kits: FilmKit[]; video?: string }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const chapterName = useRef<HTMLSpanElement>(null);
  const shirts = useRef<(HTMLDivElement | null)[]>([]);

  const home = kits.find((k) => k.kit === "home") ?? kits[0];

  useEffect(() => {
    const sec = root.current;
    const st = stage.current;
    if (!sec || !st) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let target = 0;
    let p = -1;
    let raf = 0;
    let running = false;
    let chapter = -1;
    let W = st.clientWidth;
    let H = st.clientHeight;
    const born = performance.now();
    const set = (k: string, v: number) => st.style.setProperty(k, v.toFixed(4));

    const measure = () => {
      const r = sec.getBoundingClientRect();
      const span = sec.offsetHeight - window.innerHeight;
      target = span > 0 ? clamp(-r.top / span) : 0;
    };

    const render = (p: number, intro: number) => {
      const portrait = H > W * 1.05;

      /* Chapter 1: tunnel, floodlights, headline */
      const tun = seg(p, 0, 0.14);
      set("--tun", inCubic(tun));
      set("--cam", inOutCubic(seg(p, 0, 0.3)));
      let lit = 0;
      LAMP_AT.forEach((at, i) => {
        const v = i === 0 ? Math.max(strike(intro), strike(seg(p, 0, 0.04) * 3)) : strike(seg(p, at, at + 0.04));
        set(`--L${i}`, v);
        lit += v / LAMP_AT.length;
      });
      set("--lit", lit);
      set("--h1a", outExpo(Math.min(intro * 1.4, 1)) + inCubic(seg(p, 0.26, 0.32)));
      set("--h1b", outExpo(clamp(intro * 1.4 - 0.18)) + inCubic(seg(p, 0.27, 0.33)));
      set("--h1x", p);
      set("--g1", outExpo(seg(p, 0.12, 0.2)));

      /* Chapter 2: four shirts */
      set("--dim", inOutCubic(seg(p, 0.29, 0.37)));
      set("--h2a", outExpo(seg(p, 0.37, 0.45)) + inCubic(seg(p, 0.57, 0.63)));
      set("--h2b", outExpo(seg(p, 0.39, 0.47)) + inCubic(seg(p, 0.58, 0.64)));
      set("--tags", seg(p, 0.4, 0.44) - seg(p, 0.5, 0.53));

      const sw = Math.min(portrait ? W * 0.62 : H * 0.5, 620);
      const spread = portrait ? sw * 0.42 : Math.min(sw * 0.82, W * 0.19);
      const R = portrait ? sw * 0.62 : sw * 0.95;
      const fan = inOutCubic(seg(p, 0.43, 0.48));
      const orbit = inOutCubic(seg(p, 0.45, 0.6)) * 360;
      const settle = inOutCubic(seg(p, 0.58, 0.68));
      const finalX = portrait ? 0 : -W * 0.2;
      const finalY = portrait ? -H * 0.12 : H * 0.05;
      const finalS = portrait ? 1.2 : 1.5;

      shirts.current.forEach((el, i) => {
        if (!el) return;
        const fly = outCubic(seg(p, 0.29 + i * 0.022, 0.41 + i * 0.022));
        const off = 1.5 - i; // RTL: home starts on the right
        // fan pose
        let x = off * spread;
        let y = Math.abs(off) * sw * 0.05;
        let z = -Math.abs(off) * 80;
        let ry = -off * 16;
        let rz = -off * 5;
        // fly in from deep behind the stage
        x = mix(off * spread * 2.6, x, fly);
        y = mix(-H * 0.5, y, fly);
        z = mix(-2600, z, fly);
        ry = mix(off * 70, ry, fly);
        rz = mix(-off * 40, rz, fly);
        let o = clamp(fly * 2.5);
        // orbit: a ring that turns once, home ends in front
        const th = ((i * 90 + orbit) * Math.PI) / 180;
        const rx = Math.sin(th) * R;
        const rzR = (Math.cos(th) - 1) * R;
        const dep = (Math.cos(th) + 1) / 2;
        x = mix(x, rx, fan);
        y = mix(y, -Math.sin(th) * sw * 0.04, fan);
        z = mix(z, rzR, fan);
        ry = mix(ry, ((i * 90 + orbit) % 360 > 180 ? -1 : 1) * Math.sin(th) * 28, fan);
        rz = mix(rz, 0, fan);
        o = mix(o, 0.45 + 0.55 * dep, fan);
        let sc = 1;
        // settle: home forward, the rest fall away
        if (i === 0) {
          x = mix(x, finalX, settle);
          y = mix(y, finalY, settle);
          z = mix(z, 0, settle);
          ry = mix(ry, 0, settle);
          sc = mix(1, finalS, settle);
          o = mix(o, 1, settle);
        } else {
          z = mix(z, z - 1400, settle);
          o = mix(o, 0, Math.min(settle * 1.6, 1));
        }
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        el.style.opacity = o.toFixed(3);
      });

      /* Chapter 3: yellow, crest, CTAs */
      set("--wipe", inOutCubic(seg(p, 0.63, 0.74)));
      set("--frame", 1 - inOutCubic(seg(p, 0.64, 0.76)));
      set("--crest", outBack(seg(p, 0.72, 0.8)));
      set("--crestO", seg(p, 0.72, 0.745));
      set("--ring", seg(p, 0.76, 0.84));
      set("--h3a", outExpo(seg(p, 0.74, 0.82)));
      set("--h3b", outExpo(seg(p, 0.76, 0.84)));
      set("--big", outExpo(seg(p, 0.7, 0.86)));
      set("--cta", outCubic(seg(p, 0.8, 0.88)));
      set("--p", p);

      const ch = p < 0.3 ? 0 : p < 0.64 ? 1 : 2;
      if (ch !== chapter) {
        chapter = ch;
        st.dataset.ch = String(ch);
        if (counter.current) counter.current.textContent = String(ch + 1).padStart(2, "0");
        if (chapterName.current) chapterName.current.textContent = CHAPTERS[ch];
      }

      const v = vid.current;
      if (v && v.readyState >= 1 && v.duration) {
        const t = p * v.duration;
        if (Math.abs(v.currentTime - t) > 1 / 30) v.currentTime = t;
      }
    };

    let last = performance.now();
    const tick = (now: number) => {
      const intro = clamp((now - born - 250) / 1100);
      // Light inertia (~90ms time constant, frame-rate independent): the film glides to the scrollbar.
      const k = 1 - Math.exp(-Math.min(now - last, 64) / 90);
      last = now;
      p = p < 0 ? target : p + (target - p) * k;
      if (Math.abs(target - p) < 0.0002) p = target;
      render(p, intro);
      if (p !== target || intro < 1) raf = requestAnimationFrame(tick);
      else running = false;
    };
    const wake = () => {
      measure();
      if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const onResize = () => {
      W = st.clientWidth;
      H = st.clientHeight;
      p = -1;
      wake();
    };

    st.dataset.live = "true";
    wake();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Keyboard users tabbing into the CTAs get the final frame, where they are visible.
  const showEnd = () => {
    const sec = root.current;
    if (!sec || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const span = sec.offsetHeight - window.innerHeight;
    const r = sec.getBoundingClientRect();
    const at = clamp(-r.top / span);
    if (at < 0.9) window.scrollTo({ top: window.scrollY + r.top + span * 0.94, behavior: "instant" as ScrollBehavior });
  };

  return (
    <section ref={root} className={s.film} aria-labelledby="film-title">
      <a href="#drop" className={s.skip}>
        דלג על הסרט
      </a>
      <h1 id="film-title" className="sr-only">
        מכבי תל אביב · תלבושות המשחק של עונת 26/27
      </h1>
      <p className="sr-only">
        סרט קצר שמתקדם עם הגלילה: האצטדיון נדלק בלילה, ארבע חולצות המשחק של 26/27 (בית, חוץ, שלישית ורביעית) מסתובבות על
        הבמה, וחולצת הבית הצהובה נשארת במרכז.
      </p>

      <div ref={stage} className={s.stage} data-ch="0">
        {/* ---------- the screen (everything inside the film frame) ---------- */}
        <div className={s.screen}>
          {video ? (
            <video ref={vid} className={s.video} src={video} muted playsInline preload="auto" aria-hidden="true" tabIndex={-1} />
          ) : (
            <div className={s.world} aria-hidden="true">
              {/* Plate 1: Bloomfield at night. Four light sections strike one by one. */}
              <div className={s.plate1}>
                <Image src="/media/match-home-2.webp" alt="" fill priority sizes="100vw" className={s.plateImg} />
                <div className={s.sections}>
                  {/* The two centre sections (seen through the tunnel) strike first. */}
                  {[1, 0, 0, 2].map((l, i) => (
                    <i key={i} style={{ "--L": `var(--L${l})` } as React.CSSProperties} />
                  ))}
                </div>
              </div>
              {/* Plate 2: the away night, graded to navy, behind the shirts. */}
              <div className={s.plate2}>
                <Image src="/media/match-night-away.webp" alt="" fill sizes="100vw" className={s.plateImg} />
              </div>
              <div className={s.tunnel}>
                <i className={s.ceil} />
                <i className={s.floor} />
                <i className={s.wallL} />
                <i className={s.wallR} />
                <i className={s.stripe} />
                <i className={s.lights} />
                <i className={s.portalEdge} />
              </div>
            </div>
          )}
          <div className={s.grain} aria-hidden="true" />

          {/* Ch.1 type */}
          <div className={s.c1}>
            <p className={s.giant1} aria-hidden="true">
              <span className="latin">BLOOMFIELD</span>
            </p>
            <h2 className={s.h1}>
              <span className={s.mask}>
                <span style={{ "--k": "var(--h1a)" } as React.CSSProperties}>הלילה</span>
              </span>
              <span className={s.mask}>
                <span style={{ "--k": "var(--h1b)" } as React.CSSProperties}>של בלומפילד.</span>
              </span>
            </h2>
            <p className={s.tech1} aria-hidden="true">
              <span className="latin">REEL 01 · NIGHT · FLOODLIGHTS</span>
            </p>
          </div>

          {/* Ch.2 type, the Latin sits behind the shirts */}
          <div className={s.c2back} aria-hidden="true">
            <span className="latin">FOUR KITS</span>
          </div>

          {/* Yellow takeover */}
          <div className={s.yellow} aria-hidden="true">
            <Image src="/media/trophy-celebration.webp" alt="" fill sizes="100vw" className={s.trophy} />
          </div>

          {/* Shirts */}
          <div className={s.orbit}>
            {kits.map((k, i) => (
              <div key={k.kit} className={s.shirt} ref={(el) => void (shirts.current[i] = el)} data-kit={k.kit}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={k.cutout} alt="" width={900} height={900} decoding="async" fetchPriority={i === 0 ? "high" : "auto"} />
                <span className={s.tag} aria-hidden="true">
                  <b className="latin">N°{String(i + 1).padStart(2, "0")}</b>
                  <span className="latin">{LATIN[k.kit]}</span>
                  <span>{HEB[k.kit]}</span>
                </span>
              </div>
            ))}
          </div>

          <div className={s.c2}>
            <h2 className={s.h2}>
              <span className={s.mask}>
                <span style={{ "--k": "var(--h2a)" } as React.CSSProperties}>ארבע חולצות.</span>
              </span>
              <span className={s.mask}>
                <span style={{ "--k": "var(--h2b)" } as React.CSSProperties}>צבע אחד.</span>
              </span>
            </h2>
            <ul className={s.roster} aria-label="ארבע חולצות המשחק">
              {kits.map((k, i) => (
                <li key={k.kit}>
                  <span className="latin">{String(i + 1).padStart(2, "0")}</span> {HEB[k.kit]}
                </li>
              ))}
            </ul>
          </div>

          {/* Ch.3 */}
          <div className={s.c3}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.crest} src="/crest.png" alt="" width={400} height={400} aria-hidden="true" />
            <i className={s.ring} aria-hidden="true" />
            <h2 className={s.h3}>
              <span className={s.mask}>
                <span style={{ "--k": "var(--h3a)" } as React.CSSProperties}>הצהוב</span>
              </span>
              <span className={s.mask}>
                <span style={{ "--k": "var(--h3b)" } as React.CSSProperties}>
                  של <span className="latin">26/27</span>.
                </span>
              </span>
            </h2>
            <p className={s.spec}>
              <span className="latin">26/27 · HOME · PUMA</span>
              <span>{home.title}</span>
            </p>
            <div className={s.ctas} onFocus={showEnd}>
              <Link href={`/product/${home.handle}`} className={s.buy}>
                <span>לקנייה</span>
                <span className={s.price}>{price(home.price)}</span>
              </Link>
              <Link href={`/product/${home.handle}#print`} className={s.print}>
                עצב עם שם ומספר
              </Link>
            </div>
          </div>
        </div>

        {/* ---------- the frame: paper margins with the slate ---------- */}
        <div className={s.slate} aria-hidden="true">
          <span className={s.count}>
            <b className="latin" ref={counter}>
              01
            </b>
            <span className="latin">/ 03</span>
            <span className={s.chName} ref={chapterName}>
              {CHAPTERS[0]}
            </span>
          </span>
          <span className={s.rule}>
            <i />
          </span>
          <span className={`latin ${s.slateEnd}`}>MACCABI TEL AVIV · 26/27</span>
        </div>
        <span className={`latin ${s.sideA}`} aria-hidden="true">
          PUMA × MACCABI TEL AVIV · SEASON 26/27
        </span>
        <span className={`latin ${s.sideB}`} aria-hidden="true">
          SCROLL FILM · 3 CHAPTERS
        </span>
      </div>
    </section>
  );
}
