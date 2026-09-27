<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Live meeting panels live in src/components/LivePanels.tsx — shared by / and the /panel side panel so both stay identical.
- /panel hides the top nav, tour and call overlay (ChromeGate in __root) — it must fit a narrow window beside Zoom/Meet.
- Meeting chat messages and approved scripted replies live in DemoProvider so the main meeting and side panel share one conversation.
- Sarah's demo email recipient lives in the shared demo-recipient constant, and its queue approval must send successfully before marking executed, so mock contacts cannot receive mail and failed sends stay pending.
- Always run what you changed and show it — a successful build is not verification. Web changes: run the dev server and open the affected route. iOS changes: `xcodegen generate`, build, then `simctl install`/`launch` on a booted device and screenshot the screen you touched.
- This machine's Xcode has no `Simulator.app`, so simulator devices only run headlessly: screenshots work via `simctl io <device> screenshot`, but tapping does not. To reach a state behind a tap, override the stored preference with a launch argument (e.g. `simctl launch <device> com.sumonmondal.ThreadApp -Thread_homeDensity standard`).
