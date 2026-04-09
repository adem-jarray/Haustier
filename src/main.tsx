import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ── Scroll-reveal via IntersectionObserver ─────────────────────────────────
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.10, rootMargin: "0px 0px -48px 0px" }
);

export function observeRevealElements() {
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    revealObserver.observe(el);
  });
}

// Initial observe after mount
requestAnimationFrame(() => setTimeout(observeRevealElements, 200));

createRoot(document.getElementById("root")!).render(<App />);
