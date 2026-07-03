import { useCallback, useEffect, useRef, useState } from "react";
import "./FlipBook.css";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Static (non-animating) transform/z-index for a page given how many pages
// have been turned so far ("current"). Pages before `current` rest, turned,
// on the left; pages from `current` onward rest, unturned, on the right.
function staticStyle(index, current, total) {
  if (index < current) {
    // Turned pages: zIndex 0..total-1. Kept well below every resting
    // page's range (see below) so a flipped, invisible page can never
    // sit on top of — and swallow scroll/tap gestures meant for — the
    // page currently facing the reader.
    return { angle: -180, zIndex: index };
  }
  // Resting (not-yet-turned) pages: zIndex total..2*total, decreasing
  // with index so the front-most one (index === current) is always the
  // highest of this group. Its minimum possible value (total+1) is still
  // above the maximum possible turned-page value (total-1), so the two
  // groups never overlap no matter how far into the book `current` is.
  return { angle: 0, zIndex: total * 2 - index };
}

export default function FlipBook({ pages }) {
  const total = pages.length;
  const [current, setCurrent] = useState(0);

  const bookRef = useRef(null);
  const pageRefs = useRef([]);
  const shineRefs = useRef([]);
  const rafRef = useRef(null);
  const dragRef = useRef(null);

  const setPageAngle = useCallback((index, angle, zIndex) => {
    const el = pageRefs.current[index];
    if (!el) return;
    el.style.transform = `rotateY(${angle}deg)`;
    if (zIndex !== undefined) el.style.zIndex = zIndex;

    // Dim the page as it turns edge-on, like light catching a real sheet of paper.
    const shine = shineRefs.current[index];
    if (shine) {
      const proximityToEdge = 1 - Math.abs(Math.abs(angle) - 90) / 90;
      shine.style.opacity = Math.max(0, proximityToEdge * 0.45);
    }
  }, []);

  const applyStatic = useCallback(
    (index, cur) => {
      const { angle, zIndex } = staticStyle(index, cur, total);
      setPageAngle(index, angle, zIndex);
    },
    [total, setPageAngle]
  );

  // Whenever the settled page count changes, snap every non-dragging page
  // to its resting transform.
  useEffect(() => {
    for (let i = 0; i < total; i++) {
      if (dragRef.current && dragRef.current.index === i) continue;
      applyStatic(i, current);
    }
  }, [current, total, applyStatic]);

  const animate = useCallback((index, from, to, onDone) => {
    cancelAnimationFrame(rafRef.current);
    const distance = Math.abs(to - from);
    const duration = 220 + 260 * (distance / 180); // longer travel, longer settle
    const start = performance.now();

    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const angle = from + (to - from) * easeOutCubic(p);
      setPageAngle(index, angle);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        onDone && onDone();
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [setPageAngle]);

  const finishForward = useCallback(
    (index, from) => {
      setPageAngle(index, from, total * 2 + 10);
      animate(index, from, -180, () => setCurrent((c) => Math.max(c, index + 1)));
    },
    [animate, setPageAngle, total]
  );

  const abortForward = useCallback(
    (index, from) => {
      setPageAngle(index, from, total * 2 + 10);
      animate(index, from, 0, () => applyStatic(index, current));
    },
    [animate, applyStatic, current, setPageAngle, total]
  );

  const finishBackward = useCallback(
    (index, from) => {
      setPageAngle(index, from, total * 2 + 10);
      animate(index, from, 0, () => setCurrent((c) => Math.min(c, index)));
    },
    [animate, setPageAngle, total]
  );

  const abortBackward = useCallback(
    (index, from) => {
      setPageAngle(index, from, total * 2 + 10);
      animate(index, from, -180, () => applyStatic(index, current));
    },
    [animate, applyStatic, current, setPageAngle, total]
  );

  const next = useCallback(() => {
    if (dragRef.current || current >= total) return;
    finishForward(current, 0);
  }, [current, total, finishForward]);

  const prev = useCallback(() => {
    if (dragRef.current || current <= 0) return;
    finishBackward(current - 1, -180);
  }, [current, finishBackward]);

  const goTo = useCallback(
    (target) => {
      if (dragRef.current) return;
      setCurrent(target);
    },
    []
  );

  // ---------------------------------------------------------------
  // Drag handling — grabbing the edge of a page turns it, with real
  // position + velocity based release logic (fling to complete,
  // ease back to cancel, tap to flip fully).
  // ---------------------------------------------------------------
  const onPointerMove = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;

      // Axis-lock: don't commit to a horizontal page-turn until the
      // gesture has clearly moved more horizontally than vertically.
      // This lets a vertical swipe that starts on the edge-grab strip
      // (which overlaps the padded sides of scrollable page content)
      // fall through to native scrolling instead of turning the page.
      if (!d.axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          // Vertical intent — bail out of the page-turn gesture and let the
          // browser handle it as a normal scroll. We just clear the drag
          // state here; the pointerup handler (still attached) will do the
          // actual listener cleanup once the gesture ends.
          dragRef.current = null;
          return;
        }
        d.axis = "horizontal";
      }

      // We've committed to a horizontal drag — stop the browser's native
      // vertical pan for the rest of this gesture.
      e.preventDefault();

      if (Math.abs(dx) > 4) d.moved = true;

      const now = performance.now();
      const dt = now - d.lastT;
      if (dt > 0) d.velocity = (e.clientX - d.lastX) / dt;
      d.lastX = e.clientX;
      d.lastT = now;

      const reach = 1.35; // drag doesn't need to cross the full width to complete
      let angle;
      if (d.direction === "forward") {
        angle = (dx / d.width) * -reach * 180;
      } else {
        angle = -180 + (dx / d.width) * reach * 180;
      }
      angle = Math.max(-180, Math.min(0, angle));
      d.angle = angle;
      setPageAngle(d.index, angle, total * 2 + 10);
    },
    [setPageAngle, total]
  );

  const onPointerUp = useCallback(() => {
    const d = dragRef.current;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    dragRef.current = null;
    if (!d) return;

    const tapDuration = performance.now() - d.startT;
    const isTap = !d.moved && tapDuration < 250;
    const flingSpeed = 0.55; // px/ms

    if (d.direction === "forward") {
      const shouldComplete = isTap || d.angle <= -90 || d.velocity < -flingSpeed;
      shouldComplete ? finishForward(d.index, d.angle) : abortForward(d.index, d.angle);
    } else {
      const shouldComplete = isTap || d.angle >= -90 || d.velocity > flingSpeed;
      shouldComplete ? finishBackward(d.index, d.angle) : abortBackward(d.index, d.angle);
    }
  }, [onPointerMove, finishForward, abortForward, finishBackward, abortBackward]);

  const startDrag = useCallback(
    (direction) => (e) => {
      if (dragRef.current) return;
      const index = direction === "forward" ? current : current - 1;
      if (index < 0 || index >= total) return;

      const rect = bookRef.current.getBoundingClientRect();
      dragRef.current = {
        index,
        direction,
        startX: e.clientX,
        startY: e.clientY,
        width: rect.width,
        lastX: e.clientX,
        lastT: performance.now(),
        startT: performance.now(),
        velocity: 0,
        angle: direction === "forward" ? 0 : -180,
        moved: false,
        axis: null,
      };
      // passive:false so we can preventDefault() once a gesture is
      // confirmed horizontal, stopping the browser from also scrolling.
      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp);
    },
    [current, total, onPointerMove, onPointerUp]
  );

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div className="flipbook">
      <div className="book-wrap">
        <div className="book-shadow" />
        <div className={`edge-stack edge-right ${current >= total ? "hidden" : ""}`} />
        <div className={`edge-stack edge-left ${current === 0 ? "hidden" : ""}`} />

        <div className="book" ref={bookRef}>
          {pages.map((page, i) => (
            <div
              className="page"
              key={page.label}
              ref={(el) => (pageRefs.current[i] = el)}
            >
              <div className={`page-face page-front ${page.className}`}>
                {page.content}
                <div className="shine" ref={(el) => (shineRefs.current[i] = el)} />
              </div>
              <div className="page-face page-back">
                <span className="monogram">E&amp;O</span>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`edge-grab edge-grab-prev ${current === 0 ? "disabled" : ""}`}
          onPointerDown={startDrag("backward")}
        />
        <div
          className={`edge-grab edge-grab-next ${current >= total ? "disabled" : ""}`}
          onPointerDown={startDrag("forward")}
        />
      </div>

      <div className="controls">
        <button className={`nav-btn ${current === 0 ? "disabled" : ""}`} onClick={prev} aria-label="Previous page">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="page-indicator">
          {current === 0 ? "Cover" : pages[Math.min(current, total - 1)].label}
        </div>
        <button className={`nav-btn ${current >= total ? "disabled" : ""}`} onClick={next} aria-label="Next page">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="dots">
        {pages.map((page, i) => (
          <div
            key={page.label}
            className={`dot ${i === Math.min(current, total - 1) ? "active" : ""}`}
            title={page.label}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <div className="swipe-hint">Drag a page edge, tap it, or use the arrows to turn the page</div>
    </div>
  );
}