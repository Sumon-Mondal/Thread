import { createFileRoute } from "@tanstack/react-router";
import { LiveActivityWidget } from "@/components/LiveActivityWidget";
import { formatClock } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";

export const Route = createFileRoute("/lockscreen")({
  head: () => ({
    meta: [
      { title: "Lock Screen — Thread" },
      { name: "description", content: "Thread's Live Activity on your lock screen — meeting moments without unlocking your phone." },
      { property: "og:title", content: "Lock Screen — Thread" },
      { property: "og:description", content: "Thread's Live Activity on your lock screen — meeting moments without unlocking your phone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LockScreen,
});

function LockScreen() {
  const { elapsed } = useDemo();
  const now = new Date();
  const time = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, "0")}`;
  const date = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-[1560px] items-center justify-center px-4 pb-10 pt-4">
      {/* Phone frame */}
      <div className="relative aspect-[9/19.5] h-[78vh] max-h-[860px] overflow-hidden rounded-[52px] border border-white/15 bg-gradient-to-b from-[#0b1226] via-[#07080c] to-[#0c0a1a] shadow-[0_40px_120px_rgba(0,0,0,0.7)]">
        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-3 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />

        {/* Lock screen clock */}
        <div className="mt-16 text-center">
          <p className="text-sm font-medium text-white/70">{date}</p>
          <p className="mt-1 text-7xl font-bold tracking-tight text-white/95">{time}</p>
          <p className="meta-chip mt-2 text-white/40">Driving mode · Thread is listening</p>
        </div>

        {/* Live Activity */}
        <div className="absolute inset-x-3 bottom-24">
          <LiveActivityWidget />
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-white/40" />

        <span className="sr-only">Meeting elapsed {formatClock(elapsed)}</span>
      </div>
    </main>
  );
}
