// "Flying thumbnail": a copy of the packshot arcs from where it was added into
// the header cart icon. Pure DOM + Web Animations, so it costs nothing until
// used and needs no React state. Skipped for reduced motion or when the target
// isn't on screen.

const TARGET = '[data-cart-trigger], header button[aria-label^="הסל שלי"]';

export function flyToCart(from: Element, src: string) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = document.querySelector(TARGET);
  if (!target) return;

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (!a.width || !b.width || b.bottom < 0 || b.top > window.innerHeight) return;

  const size = Math.min(140, Math.max(64, a.width * 0.5));
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.setAttribute("aria-hidden", "true");
  Object.assign(img.style, {
    position: "fixed",
    zIndex: "80",
    left: `${a.left + a.width / 2 - size / 2}px`,
    top: `${a.top + a.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "contain",
    background: "#fff",
    borderRadius: "2px",
    boxShadow: "0 18px 40px -12px rgba(0,7,58,.45)",
    pointerEvents: "none",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(img);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = img.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 80}px) scale(0.6)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.2 },
    ],
    { duration: 720, easing: "cubic-bezier(0.65, 0, 0.35, 1)" },
  );
  const done = () => {
    img.remove();
    target.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], {
      duration: 360,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    });
  };
  anim.onfinish = done;
  anim.oncancel = () => img.remove();
}
