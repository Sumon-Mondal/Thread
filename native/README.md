# Thread native (hidden, not part of the web build)
Source for the future Apple Watch app, watch complication and iPhone widget / Live Activity.
Open in Xcode 16+: create a project with an iOS app, a watchOS app, and a Widget extension, then add these folders.
All targets read the live feed configured in `ThreadShared/LiveState.swift`. The source points at the stable published address, which is not live until the site is published. The preview address requires browser authentication and is not suitable for watchOS. The watch transport still needs authenticated, persistent device pairing before shipping; the current in-memory feed is suitable only for local web demonstrations and may reset or diverge across instances.

## Two-way sync
The watch's Approve / Later buttons POST `{ "command": "approve" | "later" }` to `/api/live-state`. Do not enable native approvals in production until the feed verifies the paired device and persists commands. The existing web demo polls the in-memory queue every 3 seconds; Later has no scheduling implementation yet.
