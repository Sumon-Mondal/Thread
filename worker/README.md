# Thread Meeting Bot Worker (Cloud Virtual Machine)

Containerized headless bot process that joins Google Meet or Zoom calls on behalf of the user, extracts closed captions, chat messages, and shared slide QR codes, and streams real-time state to the Thread backend.

---

## 1. Running Locally for Testing

1. Install dependencies:
   ```bash
   cd worker
   npm install
   ```

2. Run the bot against any Google Meet or Zoom URL:
   ```bash
   node bot.js "https://meet.google.com/abc-defg-hij"
   ```

3. Environment Variables (optional, in `.env`):
   ```ini
   MEETING_URL="https://meet.google.com/your-meeting-id"
   BOT_NAME="Thread Assistant (for Sumon)"
   THREAD_SERVER_URL="https://your-thread-app.lovable.app/api/live-state"
   ```

---

## 2. Deploying to the Cloud (Virtual Machine / Containers)

### Deploy to Railway / Render / Fly.io (One-Click Docker)
1. Point your cloud provider to the `worker/` directory.
2. Select **Dockerfile** as the build configuration.
3. Add the environment variable `THREAD_SERVER_URL` pointing to your deployed Thread domain.
4. Deploy! When you trigger a meeting join, the cloud VM starts, joins the meeting, and feeds the mobile and web app.

### Deploy with Docker CLI
```bash
docker build -t thread-worker .
docker run -e MEETING_URL="https://meet.google.com/..." -e THREAD_SERVER_URL="https://..." thread-worker
```
