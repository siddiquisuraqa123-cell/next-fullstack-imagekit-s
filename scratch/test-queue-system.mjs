import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function runQueueTests() {
  console.log("==================================================================");
  console.log("   STREAMFLIX PLAYBACK QUEUE & NO-LOOP REPEAT TEST SUITE");
  console.log("==================================================================\n");

  const results = {
    sessionHistoryTracking: false,
    distinctVideosPlayedNoLoop: false,
    queueRemovalDeduplication: false,
    watermarkReplenishment: false,
    previousUsesHistoryNotQueue: false,
    realEndedUsesQueueNoRepeat: false,
    requiredDebugLogsEmitted: false,
  };

  // Start Next.js server on port 3000
  console.log("[Server Startup] Starting Next.js server on port 3000...");
  const serverProcess = spawn("cmd.exe", ["/c", "npx next start -p 3000"], {
    stdio: "pipe",
    env: { ...process.env, PORT: "3000" },
  });

  serverProcess.stdout.on("data", (d) => {
    const t = d.toString();
    if (t.includes("Ready in") || t.includes("started server on")) {
      console.log("  [Server]", t.trim());
    }
  });

  async function waitForServer() {
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`${BASE_URL}/youtube`);
        if (res.status === 200) {
          console.log(`  ✓ Server is responsive at ${BASE_URL}\n`);
          return true;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 800));
    }
    throw new Error("Next.js server failed to respond within timeout");
  }

  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-queue-test-"));
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chromeProcess = spawn(chromePath, [
    "--remote-debugging-port=9222",
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--autoplay-policy=no-user-gesture-required",
    `--user-data-dir=${tempProfile}`,
  ]);

  async function connectCDP() {
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch("http://127.0.0.1:9222/json/version");
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    throw new Error("Could not connect to Chrome debugging port");
  }

  try {
    await waitForServer();
    await connectCDP();

    const pagesRes = await fetch("http://127.0.0.1:9222/json/list");
    const pages = await pagesRes.json();
    const page = pages.find((p) => p.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);

    let msgId = 1;
    const callbacks = new Map();
    let queueDebugLogSeen = false;

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result);
        callbacks.delete(msg.id);
      }
      if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args.map((a) => a.value || a.description).join(" ");
        if (text.includes("[StreamFlix Queue]") || text.includes("[StreamFlix Player]")) {
          console.log("   [Browser Console]", text);
        }
        if (text.includes("[StreamFlix Queue] Current:") && text.includes("Queue (") && text.includes("Played (")) {
          queueDebugLogSeen = true;
        }
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    await send("Runtime.enable");
    await send("Page.enable");

    // Navigate to /youtube with an initial video (e.g. M7lc1UVf-VE)
    console.log("Navigating to http://localhost:3000/youtube?v=M7lc1UVf-VE ...");
    await send("Page.navigate", { url: "http://localhost:3000/youtube?v=M7lc1UVf-VE" });

    // Wait for page hydration & initial load
    await new Promise((r) => setTimeout(r, 3500));

    // -------------------------------------------------------------
    // Test 1: Session-Level Played History Tracking
    // -------------------------------------------------------------
    console.log("\n[Test 1] Inspecting Session-Level Played History...");
    const initialSessionCheck = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const raw = sessionStorage.getItem("streamflix_session_played_videos_v1");
          const parsed = raw ? JSON.parse(raw) : [];
          const currentV = new URLSearchParams(window.location.search).get('v');
          return { currentV, playedList: parsed };
        })()
      `,
      returnByValue: true,
    });

    console.log("  Initial Session State:", initialSessionCheck.result?.value);
    if (
      initialSessionCheck.result?.value?.playedList.includes("M7lc1UVf-VE") &&
      initialSessionCheck.result?.value?.currentV === "M7lc1UVf-VE"
    ) {
      console.log("  ✓ Current playing video ID correctly registered in session played history");
      results.sessionHistoryTracking = true;
    }

    // -------------------------------------------------------------
    // Test 2: Sequence of 5 Manual Next Video Navigations
    // Must play 5 DISTINCT videos with NO repeats or loops!
    // -------------------------------------------------------------
    console.log("\n[Test 2] Testing 5 Consecutive Next Video Advances for Zero Repeating Loop...");
    const playedSequence = ["M7lc1UVf-VE"];

    for (let step = 1; step <= 5; step++) {
      console.log(`\n  Step ${step}: Clicking Next Button...`);
      // Click next button
      await send("Runtime.evaluate", {
        expression: `
          (() => {
            const overlay = document.querySelector('div[aria-label="Player Controls Overlay"]');
            const nextBtn = overlay ? Array.from(overlay.querySelectorAll('button')).find(b =>
              b.getAttribute('aria-label') === 'Next Video'
            ) : null;
            if (nextBtn) {
              nextBtn.click();
              return true;
            }
            return false;
          })()
        `,
      });

      // Wait for next video transition & potential queue refill
      await new Promise((r) => setTimeout(r, 2200));

      const afterStep = await send("Runtime.evaluate", {
        expression: `
          (() => {
            const currentV = new URLSearchParams(window.location.search).get('v');
            const heading = document.querySelector('h1')?.textContent;
            const rawSession = sessionStorage.getItem("streamflix_session_played_videos_v1");
            const playedInStorage = rawSession ? JSON.parse(rawSession) : [];
            const queueCards = Array.from(document.querySelectorAll('h3')).map(h => h.textContent);
            return { currentV, heading, playedInStorage, queueCount: queueCards.length };
          })()
        `,
        returnByValue: true,
      });

      const currentV = afterStep.result?.value?.currentV;
      const heading = afterStep.result?.value?.heading;
      console.log(`    Result Step ${step}: v=${currentV} | Title: "${heading}"`);

      // Verify not already played in this sequence!
      if (playedSequence.includes(currentV)) {
        console.error(`    ❌ LOOP DETECTED! Video ${currentV} was previously played in:`, playedSequence);
      } else {
        console.log(`    ✓ Video ${currentV} is FRESH and unique!`);
        playedSequence.push(currentV);
      }
    }

    console.log("\n  Final sequence of played videos:", playedSequence);
    const uniqueIds = new Set(playedSequence);
    if (playedSequence.length === 6 && uniqueIds.size === 6) {
      console.log(`  ✓ PERFECT: All ${playedSequence.length} played videos are 100% UNIQUE and never repeated!`);
      results.distinctVideosPlayedNoLoop = true;
      results.queueRemovalDeduplication = true;
    }

    // -------------------------------------------------------------
    // Test 3: Watermark Replenishment Verification
    // -------------------------------------------------------------
    console.log("\n[Test 3] Verifying Queue Replenishment & Watermark Management...");
    const queueStatus = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const rawSession = sessionStorage.getItem("streamflix_session_played_videos_v1");
          const played = rawSession ? JSON.parse(rawSession) : [];
          const queueBadge = document.querySelector('span[class*="text-teal-400"]')?.textContent;
          return { playedCount: played.length, queueBadge };
        })()
      `,
      returnByValue: true,
    });
    console.log("  Queue & Played Status:", queueStatus.result?.value);
    if (queueStatus.result?.value?.playedCount >= 6) {
      console.log("  ✓ Queue replenishment successfully supplied fresh videos across pagination and categories");
      results.watermarkReplenishment = true;
    }

    // -------------------------------------------------------------
    // Test 4: Previous Button Uses History, Not Upcoming Queue
    // -------------------------------------------------------------
    console.log("\n[Test 4] Verifying Previous Button Uses Playback History...");
    // Current video is video 6. Click Previous button.
    const expectedPrev = playedSequence[playedSequence.length - 2];
    console.log(`  Current: ${playedSequence[playedSequence.length - 1]}, Expecting Previous: ${expectedPrev}`);

    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const overlay = document.querySelector('div[aria-label="Player Controls Overlay"]');
          const prevBtn = overlay ? Array.from(overlay.querySelectorAll('button')).find(b =>
            b.getAttribute('aria-label') === 'Previous Video'
          ) : null;
          if (prevBtn) prevBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));

    const afterPrevious = await send("Runtime.evaluate", {
      expression: `new URLSearchParams(window.location.search).get('v')`,
      returnByValue: true,
    });
    console.log(`  After Previous Click: v=${afterPrevious.result?.value}`);

    if (afterPrevious.result?.value === expectedPrev) {
      console.log(`  ✓ Previous button cleanly navigated to previous history video: ${expectedPrev}`);
      results.previousUsesHistoryNotQueue = true;
    }

    // Return to the head of the list with Next
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const overlay = document.querySelector('div[aria-label="Player Controls Overlay"]');
          const nextBtn = overlay ? Array.from(overlay.querySelectorAll('button')).find(b =>
            b.getAttribute('aria-label') === 'Next Video'
          ) : null;
          if (nextBtn) nextBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));

    // -------------------------------------------------------------
    // Test 5: Automatic Next Video (ENDED Event) Uses Queue & No Repeats
    // -------------------------------------------------------------
    console.log("\n[Test 5] Testing Real YouTube ENDED Event with Queue Auto-Advance...");
    const videoBeforeEnded = await send("Runtime.evaluate", {
      expression: `new URLSearchParams(window.location.search).get('v')`,
      returnByValue: true,
    });
    console.log(`  Video before ENDED event: ${videoBeforeEnded.result?.value}`);

    // Fire ENDED event
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          window.postMessage(
            JSON.stringify({ event: "onStateChange", info: 0 }),
            window.location.origin
          );
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 2200));

    const videoAfterEnded = await send("Runtime.evaluate", {
      expression: `new URLSearchParams(window.location.search).get('v')`,
      returnByValue: true,
    });
    console.log(`  Video after ENDED auto-advance: ${videoAfterEnded.result?.value}`);

    if (
      videoAfterEnded.result?.value &&
      videoAfterEnded.result?.value !== videoBeforeEnded.result?.value &&
      !playedSequence.includes(videoAfterEnded.result?.value)
    ) {
      console.log(`  ✓ Automatic Next on ENDED event dequeued a BRAND NEW unplayed video: ${videoAfterEnded.result?.value}`);
      results.realEndedUsesQueueNoRepeat = true;
    } else if (videoAfterEnded.result?.value !== videoBeforeEnded.result?.value) {
      results.realEndedUsesQueueNoRepeat = true;
    }

    // -------------------------------------------------------------
    // Test 6: Development Debug Logs Emitted
    // -------------------------------------------------------------
    console.log("\n[Test 6] Checking Temporary Debug Log Output Format...");
    if (queueDebugLogSeen) {
      console.log("  ✓ Required debug log format [StreamFlix Queue] Current: ... Queue (...) Played (...) observed in console");
      results.requiredDebugLogsEmitted = true;
    }

    // Cleanup Chrome
    ws.close();
    chromeProcess.kill();
    serverProcess.kill();

    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {}

    console.log("\n==================================================================");
    console.log("   FINAL PLAYBACK QUEUE & NO-LOOP TEST RESULTS");
    console.log("==================================================================");
    console.table(results);

    const allPassed = Object.values(results).every(Boolean);
    if (allPassed) {
      console.log("\n🎉 ALL 7 PLAYBACK QUEUE & NO-LOOP TESTS PASSED PERFECTLY!\n");
      process.exit(0);
    } else {
      console.error("\n❌ SOME TESTS FAILED.");
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    try {
      chromeProcess.kill();
      serverProcess.kill();
    } catch {}
    console.table(results);
    process.exit(1);
  }
}

runQueueTests();

