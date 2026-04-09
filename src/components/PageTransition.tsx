import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Page transition — clean cross-fade with coloured overlay.
 *
 * CRITICAL: The page content wrapper must NEVER use transform or
 * will-change:transform, as that breaks position:fixed for all
 * descendant modals (fixed becomes relative to the transformed ancestor).
 *
 * Solution: animate only `opacity` on the content wrapper (no transform),
 * and use a SEPARATE fixed overlay div (outside the content wrapper)
 * for the coloured wave — that overlay is always a direct child of body
 * via a React portal, so it never affects the stacking context of modals.
 */

import { createPortal } from "react-dom";

const ROUTE_COLORS: Record<string, { from: string; to: string }> = {
  "/veterinaires": { from: "hsl(158,48%,10%)", to: "hsl(36,65%,32%)"  },
  "/animaux":      { from: "hsl(14,55%,26%)",  to: "hsl(36,70%,38%)"  },
  "/blog":         { from: "hsl(268,40%,18%)", to: "hsl(268,32%,32%)" },
  "/":             { from: "hsl(158,48%,10%)", to: "hsl(158,38%,20%)" },
};

function getColors(path: string) {
  return ROUTE_COLORS[path] ?? ROUTE_COLORS["/"];
}

// Inject keyframes once
function ensureKeyframes() {
  if (document.getElementById("ht-transition-kf")) return;
  const s = document.createElement("style");
  s.id = "ht-transition-kf";
  s.textContent = `
    @keyframes htOverlayIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes htOverlayOut {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
  `;
  document.head.appendChild(s);
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location  = useLocation();
  const prevPath  = useRef(location.pathname);
  const timers    = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [displayChildren, setDisplayChildren] = useState(children);

  // Overlay state
  const [overlayVisible, setOverlayVisible]   = useState(false);
  const [overlayPhase, setOverlayPhase]       = useState<"in"|"out">("in");
  const [overlayColors, setOverlayColors]     = useState(getColors(location.pathname));

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const after = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };

  useEffect(() => { ensureKeyframes(); }, []);

  useEffect(() => {
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;
    clear();

    const colors = getColors(location.pathname);
    setOverlayColors(colors);

    // 1. Dim page content (opacity only — no transform, no will-change)

    // 2. Show overlay fading IN
    setOverlayPhase("in");
    setOverlayVisible(true);

    // 3. Swap content at peak (overlay fully opaque)
    after(380, () => {
      setDisplayChildren(children);
      window.scrollTo(0, 0);
    });

    // 4. Fade overlay OUT
    after(420, () => {
      setOverlayPhase("out");
    });

    // 5. Hide overlay
    after(900, () => {
      setOverlayVisible(false);
    });

    return clear;
  }, [location.pathname]);

  // Sync children when idle
  useEffect(() => {
    if (!overlayVisible) setDisplayChildren(children);
  }, [children, overlayVisible]);

  return (
    <>
      {/* 
        Page content: opacity-only transition — NEVER use transform here.
        Using inline style transition (not animation) avoids creating a
        new stacking context that would break position:fixed in modals.
      */}
      {/* 
        NO animation on this wrapper — any opacity/transform creates a stacking
        context that breaks position:fixed on descendant modals (they become
        fixed to this element instead of the viewport). The coloured overlay
        portal covers the screen during swap, so no animation is needed here.
      */}
      <div>
        {displayChildren}
      </div>

      {/* 
        Coloured overlay — rendered via portal directly into document.body
        so it is NEVER a descendant of the animated content wrapper.
        This means it can never affect position:fixed of modals.
      */}
      {overlayVisible && createPortal(
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 88888,  // below modals (z-index: 9999) but above page
            pointerEvents: "none",
            background: `linear-gradient(160deg, ${overlayColors.from} 0%, ${overlayColors.to} 100%)`,
            animation: overlayPhase === "in"
              ? "htOverlayIn  380ms cubic-bezier(0.4,0,0.2,1) both"
              : "htOverlayOut 480ms cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          {/* Subtle wave lines for texture */}
          <svg
            viewBox="0 0 1440 900"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", opacity: 0.12 }}
          >
            <path
              d="M0,200 C360,280 720,120 1080,200 C1260,240 1380,160 1440,200"
              fill="none" stroke="white" strokeWidth="2"
            />
            <path
              d="M0,450 C240,380 600,530 960,440 C1140,400 1320,480 1440,440"
              fill="none" stroke="white" strokeWidth="1.5"
            />
            <path
              d="M0,700 C300,640 720,760 1080,700 C1260,670 1380,720 1440,700"
              fill="none" stroke="white" strokeWidth="1"
            />
          </svg>
        </div>,
        document.body
      )}
    </>
  );
}
