import type { ReactNode } from "react";
import { useEffect, useState } from "react";

/** Logical canvas: fixed 720px height, width spans 960 (4:3) to 1280 (16:9). Scaled uniformly; letter/pillarboxed beyond bounds. */
const LOGICAL_H = 720;
const MIN_AR = 4 / 3;
const MAX_AR = 16 / 9;

function measure() {
  const vv = window.visualViewport;
  const W = vv?.width ?? window.innerWidth;
  const H = vv?.height ?? window.innerHeight;
  const ar = Math.min(MAX_AR, Math.max(MIN_AR, W / H));
  const fw = W / H > ar ? H * ar : W;
  const fh = fw / ar;
  return { fw, fh, lw: Math.round(LOGICAL_H * ar), scale: fh / LOGICAL_H };
}

export default function StageFrame({ children }: { children: ReactNode }) {
  const [m, setM] = useState(measure);
  useEffect(() => {
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setM(measure())); };
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    window.visualViewport?.addEventListener("resize", on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", on); window.removeEventListener("orientationchange", on); window.visualViewport?.removeEventListener("resize", on); };
  }, []);
  return (
    <div className="stage-viewport" data-layout="stage-viewport">
      <div className="stage-frame" data-layout="stage-frame" style={{ width: m.fw, height: m.fh }}>
        {/* transform makes position:fixed descendants (backdrop, modals) pin to this canvas while .stage-scroll scrolls content */}
        <div className="stage-canvas" data-layout="stage-canvas" style={{ width: m.lw, height: LOGICAL_H, transform: `scale(${m.scale})` }}>
          <div className="stage-scroll" data-layout="stage-scroll">{children}</div>
        </div>
      </div>
    </div>
  );
}
