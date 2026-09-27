// Hidden preview of the future watchOS companion (not linked in the menu).
import { createFileRoute } from "@tanstack/react-router";
import { WatchFrame, WatchFace, WatchLive, WatchMoment, WatchUpcoming, WatchActions } from "@/components/watch/WatchViews";

export const Route = createFileRoute("/watch")({
  head: () => ({
    meta: [
      { title: "Apple Watch Preview — Thread" },
      { name: "description", content: "Preview of Thread on Apple Watch: live meeting glance, moment alerts and action items." },
      { property: "og:title", content: "Apple Watch Preview — Thread" },
      { property: "og:description", content: "Thread on your wrist: live meeting, moments and actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  return (
    <main className="mx-auto w-[calc(100%-1.5rem)] max-w-[1560px] pb-16">
      <h1 className="text-2xl font-semibold tracking-tight">Apple Watch preview</h1>
      <p className="mt-1 text-sm text-muted-foreground">Future watchOS companion. Start the meeting and the screens update live.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-8">
        <WatchFrame label="Watch face"><WatchFace /></WatchFrame>
        <WatchFrame label="Live meeting"><WatchLive /></WatchFrame>
        <WatchFrame label="Moment alert"><WatchMoment /></WatchFrame>
        <WatchFrame label="Up next"><WatchUpcoming /></WatchFrame>
        <WatchFrame label="Action items"><WatchActions /></WatchFrame>
      </div>
    </main>
  );
}
