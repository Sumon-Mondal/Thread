import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { ExternalLink, Pin, ScanLine } from "lucide-react";
import { useDemo } from "@/lib/demo-store";

/** Pinned chat message with a real QR code; Thread decodes it in the browser and queues an agent task. */
export function QrChatCard({ url, from }: { url: string; from: string }) {
  const [src, setSrc] = useState<string>("");
  const [decoded, setDecoded] = useState<string>("");
  const { registerQr } = useDemo();
  const done = useRef(false);

  useEffect(() => {
    void QRCode.toDataURL(url, { margin: 1, width: 200, color: { dark: "#0b0f14", light: "#ffffff" } }).then(setSrc);
  }, [url]);

  useEffect(() => {
    if (!src || done.current) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const res = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
      if (res?.data && !done.current) {
        done.current = true;
        const link = res.data;
        setTimeout(() => { setDecoded(link); registerQr(link, `${from} (chat)`); }, 1200);
      }
    };
    img.src = src;
  }, [src, from, registerQr]);

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-primary">
        <Pin className="size-3" /> Pinned by {from}
      </p>
      <div className="mt-2 flex items-center gap-3">
        {src ? <img src={src} alt="QR code shared in chat" className="size-16 shrink-0 rounded-md bg-white p-1" /> : <div className="size-16 shrink-0 rounded-md bg-white/10" />}
        <div className="min-w-0 flex-1">
          {decoded ? (
            <>
              <p className="text-[11px] font-medium text-emerald-400">Decoded by Thread</p>
              <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{decoded.replace(/^https?:\/\//, "")}</p>
              <a href={decoded} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/25">
                Open <ExternalLink className="size-3" />
              </a>
            </>
          ) : (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><ScanLine className="size-3.5 animate-pulse" /> Scanning QR…</p>
          )}
        </div>
      </div>
    </div>
  );
}
