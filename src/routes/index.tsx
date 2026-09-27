import { createFileRoute } from "@tanstack/react-router";
import { MomentsPanel, TranscriptPanel, CenterColumn, AgentQueuePanel, ChatPanel } from "@/components/LivePanels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Meeting — Thread" },
      { name: "description", content: "Thread's real-time meeting cockpit: live transcript, semantic moments, and autonomous agent actions." },
      { property: "og:title", content: "Live Meeting — Thread" },
      { property: "og:description", content: "Thread's real-time meeting cockpit: live transcript, semantic moments, and autonomous agent actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LiveMeeting,
});

function LiveMeeting() {
  return (
    <main className="mx-auto grid w-full max-w-[1560px] grid-cols-1 gap-4 px-4 pb-6 lg:grid-cols-12 lg:h-[calc(100vh-92px)]">
      <div className="flex min-h-[420px] flex-col gap-4 lg:col-span-3 lg:min-h-0">
        <MomentsPanel />
        <TranscriptPanel />
      </div>
      <div className="flex min-h-[500px] flex-col lg:col-span-6 lg:min-h-0">
        <CenterColumn />
      </div>
      <div className="flex min-h-[480px] flex-col gap-4 lg:col-span-3 lg:min-h-0">
        <AgentQueuePanel />
        <ChatPanel />
      </div>
    </main>
  );
}
