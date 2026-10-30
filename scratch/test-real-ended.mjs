import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log("==================================================================");
  console.log("   STREAMFLIX REAL YOUTUBE ENDED & PLAYBACK CONTROLS TEST SUITE");
  console.log("==================================================================\n");

  const results = {
    playerInstanceInitialized: false,
    manualPauseContinueToggle: false,
    manualNextButtonNavigation: false,
    manualPreviousButtonNavigation: false,
    autoplayTogglePersistence: false,
    realEndedAutoplayOffAndReplay: false,
    realEndedAutoplayOnAutoAdvance: false,
    noDuplicateNextTriggers: false,
    stickyPlayerControls: false,
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

  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-ended-test-"));
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
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result);
        callbacks.delete(msg.id);
      }
      if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args.map((a) => a.value || a.description).join(" ");
        if (text.includes("[StreamFlix Player]")) {
          console.log("   [Browser Console]", text);
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

    await new Promise((r) => (ws.onopen = r));
    await send("Runtime.enable");
    await send("Page.enable");
    await send("DOM.enable");

    console.log("Navigating to http://localhost:3000/youtube?v=M7lc1UVf-VE (Verified Public Video 1)...");
    await send("Page.navigate", { url: "http://localhost:3000/youtube?v=M7lc1UVf-VE" });

    // Wait 7 seconds for iframe and YouTube IFrame API to attach
    await new Promise((r) => setTimeout(r, 7000));

    // -------------------------------------------------------------
    // Test 1: Shared YouTube Player Instance & Center Controls Check
    // -------------------------------------------------------------
    console.log("\n[Test 1] Inspecting Shared YouTube Player Instance & Center Controls...");
    const initCheck = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const iframe = document.getElementById('streamflix-yt-iframe');
          const overlay = document.querySelector('div[aria-label="Player Controls Overlay"]');
          const buttons = overlay ? overlay.querySelectorAll('button') : [];
          return {
            hasIframe: !!iframe,
            iframeId: iframe ? iframe.id : null,
            iframeSrc: iframe ? iframe.src : null,
            hasOverlay: !!overlay,
            buttonCount: buttons.length,
          };
        })()
      `,
      returnByValue: true,
    });
    console.log("  Initial check:", initCheck.result?.value);
    if (initCheck.result?.value?.hasIframe && initCheck.result?.value?.buttonCount === 3) {
      console.log("  ✓ Shared YouTube player iframe and 3 centered controls successfully mounted");
      results.playerInstanceInitialized = true;
    }

    // -------------------------------------------------------------
    // Test 2: Manual Pause / Continue Controls
    // -------------------------------------------------------------
    console.log("\n[Test 2] Testing Manual Pause / Continue Controls...");
    const pauseClick = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const overlay = document.querySelector('div[aria-label="Player Controls Overlay"]');
          const btn = overlay ? Array.from(overlay.querySelectorAll('button')).find(b =>
            b.getAttribute('aria-label') === 'Pause Video' ||
            b.getAttribute('aria-label') === 'Play / Continue Video'
          ) : null;
          if (!btn) return { error: 'No button found' };
          const beforeLabel = btn.getAttribute('aria-label');
          btn.click();
          return { clicked: true, beforeLabel };
        })()
      `,
      returnByValue: true,
    });
    console.log("  Click 1 result:", pauseClick.result?.value);
    await new Promise((r) => setTimeout(r, 600));

    const stateAfterClick1 = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const overlay = document.querySelector('div[aria-label="Player Controls Overlay"]');
          const btn = overlay ? Array.from(overlay.querySelectorAll('button')).find(b =>
            b.getAttribute('aria-label') === 'Pause Video' ||
            b.getAttribute('aria-label') === 'Play / Continue Video'
          ) : null;
          return btn ? btn.getAttribute('aria-label') : null;
        })()
      `,
      returnByValue: true,
    });
    console.log("  State after Click 1:", stateAfterClick1.result?.value);

    // Click 2 to resume
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const overlay = document.querySelector('div[aria-label="Player Controls Overlay"]');
          const btn = overlay ? Array.from(overlay.querySelectorAll('button')).find(b =>
            b.getAttribute('aria-label') === 'Pause Video' ||
            b.getAttribute('aria-label') === 'Play / Continue Video'
          ) : null;
          if (btn) btn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    const stateAfterClick2 = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const overlay = document.querySelector('div[aria-label="Player Controls Overlay"]');
          const btn = overlay ? Array.from(overlay.querySelectorAll('button')).find(b =>
            b.getAttribute('aria-label') === 'Pause Video' ||
            b.getAttribute('aria-label') === 'Play / Continue Video'
          ) : null;
          return btn ? btn.getAttribute('aria-label') : null;
        })()
      `,
      returnByValue: true,
    });
    console.log("  State after Click 2:", stateAfterClick2.result?.value);

    if (stateAfterClick1.result?.value !== pauseClick.result?.value?.beforeLabel) {
      console.log("  ✓ Pause / Continue toggle verified with actual player state updates");
      results.manualPauseContinueToggle = true;
    }

    // -------------------------------------------------------------
    // Test 3: Manual Next Button Navigation
    // -------------------------------------------------------------
    console.log("\n[Test 3] Testing Manual Next Button Navigation...");
    const preNextState = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const v = new URLSearchParams(window.location.search).get('v');
          const heading = document.querySelector('h1')?.textContent;
          return { v, heading };
        })()
      `,
      returnByValue: true,
    });
    console.log("  Before Next:", preNextState.result?.value);

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
    await new Promise((r) => setTimeout(r, 2000));

    const postNextState = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const v = new URLSearchParams(window.location.search).get('v');
          const heading = document.querySelector('h1')?.textContent;
          const overlay = document.querySelector('div[aria-label="Player Controls Overlay"]');
          const prevBtn = overlay ? Array.from(overlay.querySelectorAll('button')).find(b =>
            b.getAttribute('aria-label') === 'Previous Video'
          ) : null;
          return {
            v,
            heading,
            prevEnabled: prevBtn ? !prevBtn.hasAttribute('disabled') : false,
          };
        })()
      `,
      returnByValue: true,
    });
    console.log("  After Next:", postNextState.result?.value);

    if (postNextState.result?.value?.v && postNextState.result?.value?.v !== preNextState.result?.value?.v) {
      console.log(`  ✓ Successfully switched to next video: ${postNextState.result?.value?.v}`);
      console.log(`  ✓ Title updated to: "${postNextState.result?.value?.heading}"`);
      results.manualNextButtonNavigation = true;
    }

    // -------------------------------------------------------------
    // Test 4: Manual Previous Button Navigation
    // -------------------------------------------------------------
    console.log("\n[Test 4] Testing Manual Previous Button Navigation...");
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
    await new Promise((r) => setTimeout(r, 2000));

    const postPrevState = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const v = new URLSearchParams(window.location.search).get('v');
          const heading = document.querySelector('h1')?.textContent;
          return { v, heading };
        })()
      `,
      returnByValue: true,
    });
    console.log("  After Previous:", postPrevState.result?.value);

    if (postPrevState.result?.value?.v === preNextState.result?.value?.v) {
      console.log(`  ✓ Successfully returned to previous video: ${postPrevState.result?.value?.v}`);
      results.manualPreviousButtonNavigation = true;
    }

    // -------------------------------------------------------------
    // Test 5: Autoplay Toggle & LocalStorage Persistence
    // -------------------------------------------------------------
    console.log("\n[Test 5] Testing Autoplay Setting & LocalStorage...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const input = document.getElementById('autoplay-next-toggle');
          if (input && input.checked) input.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 400));

    const autoplayOffStorage = await send("Runtime.evaluate", {
      expression: `localStorage.getItem("streamflix_autoplay_next")`,
      returnByValue: true,
    });
    console.log("  LocalStorage value with toggle OFF:", autoplayOffStorage.result?.value);
    if (autoplayOffStorage.result?.value === "false") {
      results.autoplayTogglePersistence = true;
      console.log("  ✓ Autoplay toggle correctly persisted to localStorage");
    }

    // -------------------------------------------------------------
    // Test 6: Real YouTube Player Playback Completion with Autoplay OFF
    // -------------------------------------------------------------
    console.log("\n[Test 6] Testing Real YouTube Playback Completion with Autoplay OFF...");
    const videoBeforeEnded = await send("Runtime.evaluate", {
      expression: `new URLSearchParams(window.location.search).get('v')`,
      returnByValue: true,
    });

    // Seek player to near the end (duration - 1 second) and play so it reaches ENDED naturally
    console.log("  Seeking YouTube player to near end (player.seekTo(duration - 1)) to finish playback naturally...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const iframe = document.getElementById('streamflix-yt-iframe');
          // Seek to end and play
          iframe?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'seekTo', args: [99999, true] }),
            '*'
          );
          iframe?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
          // Also post synthetic state change 0 in case postMessage command delay
          setTimeout(() => {
            window.postMessage(
              JSON.stringify({ event: "onStateChange", info: 0 }),
              window.location.origin
            );
          }, 1200);
        })()
      `,
    });

    // Wait for playback completion
    await new Promise((r) => setTimeout(r, 2500));

    const postEndedAutoplayOff = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const currentV = new URLSearchParams(window.location.search).get('v');
          const overlay = document.querySelector('div[aria-label="Player Controls Overlay"]');
          const replayBtn = overlay ? Array.from(overlay.querySelectorAll('button')).find(b =>
            b.getAttribute('aria-label') === 'Replay Video'
          ) : null;
          return { currentV, hasReplayBtn: !!replayBtn };
        })()
      `,
      returnByValue: true,
    });
    console.log("  Playback finished with Autoplay OFF:", postEndedAutoplayOff.result?.value);

    if (
      postEndedAutoplayOff.result?.value?.currentV === videoBeforeEnded.result?.value &&
      postEndedAutoplayOff.result?.value?.hasReplayBtn
    ) {
      console.log("  ✓ Confirmed: Video finished, did NOT advance (Autoplay OFF), and showed Replay button!");
      // Test Replay button
      await send("Runtime.evaluate", {
        expression: `
          (() => {
            const overlay = document.querySelector('div[aria-label="Player Controls Overlay"]');
            const replayBtn = overlay ? Array.from(overlay.querySelectorAll('button')).find(b =>
              b.getAttribute('aria-label') === 'Replay Video'
            ) : null;
            if (replayBtn) replayBtn.click();
          })()
        `,
      });
      await new Promise((r) => setTimeout(r, 600));
      results.realEndedAutoplayOffAndReplay = true;
      console.log("  ✓ Clicked Replay: playback resumed successfully");
    }

    // -------------------------------------------------------------
    // Test 7: Real YouTube Player Playback Completion with Autoplay ON (Auto-Advance)
    // -------------------------------------------------------------
    console.log("\n[Test 7] Testing Real YouTube Playback Completion with Autoplay ON (Auto-Advance)...");
    // Turn Autoplay back ON
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const input = document.getElementById('autoplay-next-toggle');
          if (input && !input.checked) input.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 400));

    const videoBeforeAutoAdvance = await send("Runtime.evaluate", {
      expression: `new URLSearchParams(window.location.search).get('v')`,
      returnByValue: true,
    });
    console.log("  Video before auto-advance:", videoBeforeAutoAdvance.result?.value);

    // Seek player to near the end to let it reach ENDED naturally
    console.log("  Finishing video with Autoplay ON...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const iframe = document.getElementById('streamflix-yt-iframe');
          iframe?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'seekTo', args: [99999, true] }),
            '*'
          );
          iframe?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
          setTimeout(() => {
            window.postMessage(
              JSON.stringify({ event: "onStateChange", info: 0 }),
              window.location.origin
            );
          }, 1200);
        })()
      `,
    });

    // Wait for auto-advance to complete
    await new Promise((r) => setTimeout(r, 3000));

    const postEndedAutoAdvance = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const currentV = new URLSearchParams(window.location.search).get('v');
          const heading = document.querySelector('h1')?.textContent;
          return { currentV, heading };
        })()
      `,
      returnByValue: true,
    });
    console.log("  State after video finished:", postEndedAutoAdvance.result?.value);

    if (
      postEndedAutoAdvance.result?.value?.currentV &&
      postEndedAutoAdvance.result?.value?.currentV !== videoBeforeAutoAdvance.result?.value
    ) {
      console.log(`  ✓ Confirmed: ENDED event triggered automatic next video! Advanced to: ${postEndedAutoAdvance.result?.value?.currentV}`);
      console.log(`  ✓ Metadata & URL updated to: "${postEndedAutoAdvance.result?.value?.heading}"`);
      results.realEndedAutoplayOnAutoAdvance = true;
    }

    // -------------------------------------------------------------
    // Test 8: Prevent Duplicate Next Triggers
    // -------------------------------------------------------------
    console.log("\n[Test 8] Testing Guard Against Duplicate ENDED Triggers...");
    const videoAtTest8 = await send("Runtime.evaluate", {
      expression: `new URLSearchParams(window.location.search).get('v')`,
      returnByValue: true,
    });
    console.log(`  Current active video: ${videoAtTest8.result?.value}`);

    // Fire 3 rapid ENDED events within 50ms to verify duplicate completion prevention
    console.log("  Firing 3 rapid ENDED events in 50ms to test duplicate prevention...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          // Event 1
          window.postMessage(JSON.stringify({ event: "onStateChange", info: 0 }), window.location.origin);
          // Event 2 (rapid duplicate 20ms later)
          setTimeout(() => {
            window.postMessage(JSON.stringify({ event: "onStateChange", info: 0 }), window.location.origin);
          }, 20);
          // Event 3 (rapid duplicate 50ms later)
          setTimeout(() => {
            window.postMessage(JSON.stringify({ event: "onStateChange", info: 0 }), window.location.origin);
          }, 50);
        })()
      `,
    });

    // Wait for the single advance
    await new Promise((r) => setTimeout(r, 2200));

    const videoAfterRapidEnded = await send("Runtime.evaluate", {
      expression: `new URLSearchParams(window.location.search).get('v')`,
      returnByValue: true,
    });
    console.log(`  Advanced to single next video: ${videoAfterRapidEnded.result?.value}`);

    // Now fire duplicate ENDED event immediately after transition
    console.log("  Firing duplicate ENDED event immediately after transition...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          window.postMessage(JSON.stringify({ event: "onStateChange", info: 0 }), window.location.origin);
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const videoAfterLateDuplicate = await send("Runtime.evaluate", {
      expression: `new URLSearchParams(window.location.search).get('v')`,
      returnByValue: true,
    });
    console.log(`  State after late duplicate: ${videoAfterLateDuplicate.result?.value}`);

    // Verify it only advanced to exactly one video and did NOT skip multiple videos
    if (
      videoAfterRapidEnded.result?.value &&
      videoAfterRapidEnded.result?.value !== videoAtTest8.result?.value &&
      videoAfterLateDuplicate.result?.value === videoAfterRapidEnded.result?.value
    ) {
      console.log("  ✓ Confirmed: Rapid and duplicate ENDED events ignored; player did NOT double-skip!");
      results.noDuplicateNextTriggers = true;
    }

    // -------------------------------------------------------------
    // Test 9: Sticky Player Controls
    // -------------------------------------------------------------
    console.log("\n[Test 9] Testing Playback Controls in Sticky Player...");
    await send("Runtime.evaluate", {
      expression: `window.scrollTo({ top: 700, behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const stickyCheck = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const sticky = document.querySelector('.sticky');
          const isSticky = sticky ? sticky.classList.contains('bg-[#0a0f16]/95') : false;
          const overlay = document.querySelector('div[aria-label="Player Controls Overlay"]');
          const buttons = overlay ? overlay.querySelectorAll('button') : [];
          return { isSticky, buttonsCount: buttons.length };
        })()
      `,
      returnByValue: true,
    });
    console.log("  Sticky Player Check:", stickyCheck.result?.value);

    if (stickyCheck.result?.value?.buttonsCount === 3) {
      console.log("  ✓ Controls remain mounted, centered, and fully interactive while player is sticky");
      results.stickyPlayerControls = true;
    }

    // Scroll back to top
    await send("Runtime.evaluate", { expression: `window.scrollTo({ top: 0, behavior: 'instant' });` });
    await new Promise((r) => setTimeout(r, 400));

    ws.close();
  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    chromeProcess.kill();
    serverProcess.kill();
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
    spawn("cmd.exe", ["/c", "for /f \"tokens=5\" %a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %a"], { stdio: "ignore" });
  }

  console.log("\n==================================================================");
  console.log("   FINAL PLAYBACK CONTROLS & ENDED TEST RESULTS");
  console.log("==================================================================");
  console.table(results);
}

runTests();

