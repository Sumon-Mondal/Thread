# Thread Native iOS App & Dynamic Island

A native SwiftUI application bringing Thread's real-time meeting intelligence to iPhone with Apple-grade dark glassmorphism (`.ultraThinMaterial`), Live Activities, and interactive **Dynamic Island** actions.

---

## Architecture Overview

1. **`ThreadApp/`**:
   - `ThreadApp.swift`: Main SwiftUI entrypoint with deep-link routing for 1-tap Dynamic Island approvals (`threadapp://approve?id=...`).
   - `Models/LiveState.swift`: Reactive state manager polling `/api/live-state` and controlling `Activity<ThreadActivityAttributes>`.
   - `Views/CockpitView.swift`: Real-time meeting cockpit, semantic moments, transcript feed, and action queue.
   - `Views/AgentView.swift`: Autonomous agent with native PDF/DOCX resume file picker and prompt console.
   - `Views/GlassComponents.swift`: Reusable frosted obsidian glass cards, gradients, and badges.

2. **`ThreadWidget/`**:
   - `ThreadActivityAttributes.swift`: ActivityKit state container.
   - `ThreadLiveActivity.swift`: Complete Dynamic Island layout:
     - **Compact Leading**: Animated audio waveform.
     - **Compact Trailing**: 3-5 word live summary (e.g., *"Internships Open"*).
     - **Expanded**: Speaker badge, takeaway summary, and interactive **"Approve & Execute"** button.
     - **Lock Screen**: Live meeting status card.

---

## Running in Xcode

1. Open **Xcode** on your Mac.
2. Select **File > New > Project...** -> **iOS App** (SwiftUI, Swift).
   - Product Name: `ThreadApp`
   - Bundle Identifier: `com.thread.meeting`
3. Add a **Widget Extension**:
   - **File > New > Target...** -> **Widget Extension**.
   - Check **"Include Live Activity"**.
   - Target Name: `ThreadWidget`.
4. Drag and drop the `ios/ThreadApp` files into the App target and `ios/ThreadWidget` files into the Widget target.
5. In `Info.plist` for both targets, ensure:
   - `NSSupportsLiveActivities = YES`
   - URL Schemes -> add `threadapp`
6. Select an iPhone 15 Pro / 16 Pro Simulator (or your physical iPhone) and hit **Run (⌘R)**!

---

## Deploying to TestFlight / App Store

1. In Xcode, select the **ThreadApp** target.
2. Under **Signing & Capabilities**, select your **Apple Developer Team**.
3. Select **Product > Destination > Any iOS Device (arm64)**.
4. Select **Product > Archive**.
5. Once the archive completes, click **Distribute App** -> **App Store Connect** -> **Upload** to deploy directly to TestFlight!
