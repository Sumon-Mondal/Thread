import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { Maximize2, Mic, MessageSquare, Minimize2, Phone, PhoneOff, Users, Video, X } from "lucide-react";
import clip1 from "@/assets/caller-clip1.mp4.asset.json";
import clip2 from "@/assets/caller-clip2.mp4.asset.json";
import clip3 from "@/assets/caller-clip3.mp4.asset.json";
import { useDemo } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

export const ZOOM_INTRO_EVENT = "thread-zoom-intro";
export function startZoomIntro() {
  window.dispatchEvent(new Event(ZOOM_INTRO_EVENT));
}

type Phase = "idle" | "ringing" | "fullscreen" | "docked";

/** 3 clips (~30s) played back to back with a cross-fade, then repeated. Clip 2 = she holds up a card (QR). */
const PLAYLIST = [clip1.url, clip2.url, clip3.url];
const QR_CLIP = 1;
const QR_FROM = 2.2;
const QR_TO = 8;

function captionFor(clip: number, t: number) {
  if (clip === 0) return t < 5 ? "…so our Summer 2027 engineering internship applications are open as of today." : "Applications close October 18 at 11:59 PM Eastern — no extensions.";
  if (clip === 1) return "Here's the QR code — scan it to open the application right now.";
  return t < 5 ? "We also have a Q&A panel with current interns next week, so bring your questions." : "Referrals from today's session get priority review.";
}

/** Opening scene for the judges: incoming Zoom call → full screen → docks left while Thread starts working. */
export function ZoomCallIntro() {
  const { play, reset, setScenario, registerQr } = useDemo();
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);
  const refs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
  const [slots, setSlots] = useState<[number, number]>([0, 1]); // clip index loaded in each video slot
  const [active, setActive] = useState(0);
  const [clipTime, setClipTime] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [qrSrc, setQrSrc] = useState("");
  const qrDone = useRef(false);

  const currentClip = slots[active] ?? 0;
  const showQr = currentClip === QR_CLIP && clipTime >= QR_FROM && clipTime <= QR_TO;
  const qrUrl = typeof window !== "undefined" ? `${window.location.origin}/apply/internship-app` : "/apply/internship-app";

  useEffect(() => {
    void QRCode.toDataURL(qrUrl, { margin: 1, width: 240, color: { dark: "#0b0f14", light: "#ffffff" } }).then(setQrSrc);
  }, [qrUrl]);

  // Thread "reads" the QR she holds up: decode the exact image shown in the video.
  useEffect(() => {
    if (!showQr || !qrSrc || qrDone.current) return;
    qrDone.current = true;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const res = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
      if (res?.data) registerQr(res.data, "Sarah Chen (on camera)");
    };
    img.src = qrSrc;
  }, [showQr, qrSrc, registerQr]);

  function playActive(unmute: boolean) {
    const v = refs[active]?.current;
    if (!v) return;
    if (unmute) v.muted = false;
    v.play().then(() => { if (unmute) setMuted(false); }).catch(() => { v.muted = true; setMuted(true); void v.play().catch(() => {}); });
  }

  function onEnded(slot: number) {
    if (slot !== active) return;
    const other = slot === 0 ? 1 : 0;
    const ov = refs[other]?.current;
    if (ov) { ov.currentTime = 0; ov.muted = muted; void ov.play().catch(() => {}); }
    setActive(other);
    setClipTime(0);
    // preload the clip after next into the slot that just finished
    const next = ((slots[other] ?? 0) + 1) % PLAYLIST.length;
    window.setTimeout(() => setSlots((s) => { const n: [number, number] = [s[0], s[1]]; n[slot] = next; return n; }), 450);
  }

  const clear = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };

  useEffect(() => {
    const start = () => {
      clear(); setScenario("discovery"); reset();
      qrDone.current = false; setSlots([0, 1]); setActive(0); setClipTime(0);
      setPhase("ringing");
    };
    window.addEventListener(ZOOM_INTRO_EVENT, start);
    return () => { window.removeEventListener(ZOOM_INTRO_EVENT, start); clear(); };
  }, [reset, setScenario]);

  function accept() {
    clear();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { dock(); } else {
      setPhase("fullscreen");
      timers.current.push(window.setTimeout(dock, 9200));
    }
    window.setTimeout(() => playActive(true), 60);
  }
  function dock() { clear(); setPhase("docked"); play(); }
  // Expand/minimize only resize the window — the video keeps playing where it is.
  function expand() { clear(); setPhase("fullscreen"); }
  function minimize() { clear(); setPhase("docked"); }
  function close() { clear(); refs.forEach((r) => r.current?.pause()); setPhase("idle"); }

  if (phase === "idle") return null;

  if (phase === "ringing") {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/70 backdrop-blur-sm animate-fade-in">
        <div className="glass-panel w-[340px] rounded-3xl p-6 text-center animate-scale-in">
          <p className="meta-chip mx-auto w-fit text-primary">Zoom · Incoming call</p>
          <div className="relative mx-auto mt-5 size-24 overflow-hidden rounded-full ring-2 ring-primary/60">
            <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-primary/40" />
            <video src={clip1.url} muted playsInline autoPlay loop className="size-full object-cover" />
          </div>
          <p className="mt-4 text-lg font-semibold">Sarah Chen is calling…</p>
          <p className="text-xs text-muted-foreground">Nova Dynamics · Internship Discovery Day</p>
          <div className="mt-6 flex justify-center gap-6">
            <button onClick={close} aria-label="Decline" className="flex size-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground"><PhoneOff className="size-6" /></button>
            <button onClick={accept} aria-label="Accept" className="flex size-14 items-center justify-center rounded-full bg-emerald-500 text-background animate-pulse"><Phone className="size-6" /></button>
          </div>
        </div>
      </div>
    );
  }

  const full = phase === "fullscreen";
  return (
    <>
      {full && <div className="fixed inset-0 z-[70] bg-background/90" />}
      <div
        className={cn(
          "fixed z-[75] overflow-hidden border border-border bg-background shadow-2xl transition-all duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)]",
          full ? "left-[4vw] top-[6vh] h-[88vh] w-[92vw] rounded-3xl" : "bottom-20 left-5 h-[180px] w-[320px] rounded-2xl",
        )}
      >
        {videoFailed ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-secondary">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-semibold text-primary">SC</div>
            <p className="text-sm font-medium">Sarah Chen</p>
          </div>
        ) : (
          <div className="flex size-full items-center justify-center bg-background">
            {/* 16:9 stage so the QR overlay stays locked onto the card she holds */}
            <div className="relative aspect-video max-h-full w-full">
              {slots.map((clip, slot) => (
                <video
                  key={slot}
                  ref={refs[slot]}
                  src={PLAYLIST[clip]}
                  muted={slot !== active || muted}
                  playsInline
                  preload="auto"
                  onEnded={() => onEnded(slot)}
                  onTimeUpdate={(e) => { if (slot === active) setClipTime(e.currentTarget.currentTime); }}
                  onError={() => { if (slot === active) setVideoFailed(true); }}
                  className={cn("absolute inset-0 size-full object-cover transition-opacity duration-[400ms]", slot === active ? "opacity-100" : "opacity-0")}
                />
              ))}
              {qrSrc && (
                <img
                  src={qrSrc}
                  alt="QR code Sarah is holding up"
                  className={cn(
                    "pointer-events-none absolute left-[20.5%] top-[37%] w-[12%] -rotate-3 rounded-[3px] bg-white p-[0.4%] shadow-lg transition-opacity duration-300",
                    showQr ? "opacity-95" : "opacity-0",
                  )}
                />
              )}
            </div>
          </div>
        )}
        {!videoFailed && muted && (
          <button onClick={() => playActive(true)} className="absolute right-3 top-10 z-10 rounded-full bg-background/70 px-3 py-1 text-[11px] font-medium text-foreground ring-1 ring-border hover:bg-background/90">Tap for sound</button>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="meta-chip bg-background/60 text-foreground"><span className="mr-1 inline-block size-2 rounded-full bg-destructive" />Zoom · Sarah Chen</span>
          {!full && <span className="meta-chip bg-primary/20 text-primary">Thread listening</span>}
          {showQr && <span className="meta-chip bg-emerald-500/20 text-emerald-400">QR detected</span>}
        </div>
        {full ? (
          <>
            <p key={captionFor(currentClip, clipTime)} className="absolute inset-x-0 bottom-24 mx-auto w-fit max-w-[80%] rounded-xl bg-background/75 px-5 py-2.5 text-center text-lg animate-fade-in">{captionFor(currentClip, clipTime)}</p>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-6 bg-background/70 py-4 text-xs text-muted-foreground">
              {[[Mic, "Mute"], [Video, "Stop video"], [Users, "Participants"], [MessageSquare, "Chat"]].map(([I, l]) => {
                const Icon = I as typeof Mic;
                return <span key={l as string} className="flex flex-col items-center gap-1"><Icon className="size-5 text-foreground" />{l as string}</span>;
              })}
              <button onClick={minimize} aria-label="Minimize call" className="flex flex-col items-center gap-1 text-foreground">
                <Minimize2 className="size-5" />Minimize
              </button>
              <button onClick={dock} className="rounded-lg bg-destructive px-3 py-1.5 font-semibold text-destructive-foreground">Skip</button>
            </div>
          </>
        ) : (
          <>
            <button onClick={expand} aria-label="Expand call" className="absolute inset-0 cursor-pointer" />
            <button onClick={expand} aria-label="Expand call" className="absolute bottom-2 right-2 rounded-full bg-background/70 p-1.5 text-foreground"><Maximize2 className="size-3.5" /></button>
            <button onClick={close} aria-label="Close call" className="absolute right-2 top-2 z-10 rounded-full bg-background/70 p-1"><X className="size-3.5" /></button>
          </>
        )}
      </div>
    </>
  );
}
