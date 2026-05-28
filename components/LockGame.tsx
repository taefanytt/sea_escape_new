'use client';

import { useEffect, useRef } from 'react';

interface LockGameProps {
  onSuccess: (completed?: boolean) => void;
}

export default function LockGame({ onSuccess }: LockGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cleanup = initLevel(containerRef.current, onSuccess);
    return cleanup;
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}

// =========================
// 主邏輯
// =========================

function initLevel(
  container: HTMLElement,
  onSuccess: (completed?: boolean) => void
) {
  const preload = [
    "/assets/BGinGame.png",
    "/assets/C05v2.png",
    "/assets/C04v2.png",
    "/assets/C03v2.png",
    "/assets/C02v2.png",
    "/assets/C01v2.png"
  ];

  preload.forEach(src => {
    const img = new Image();
    img.src = src;
  });

  let angles: number[] = [180, 90, 180];
  let phase: "start" | "game" | "end" = "start";
  let styleEl: HTMLStyleElement | null = null;
  let winTimer: number | null = null;

  render();
  window.addEventListener("resize", updateScale);

  function render() {
    if (phase === "start") renderStart();
    else if (phase === "game") renderGame();
    else renderEnd();
  }

  function renderStart() {
    container.innerHTML = `
      <div class="lock-game">
        <div class="lock-stage">
          <img src="/assets/LockBGStart.png" class="lock-bg"/>
          <div class="lock-start-panel">
            <img src="/assets/LockStartTextArea.png" class="lock-text"/>
            <div class="lock-desc">
              <h2>圓環鎖扣</h2>
              <p>
                一個古舊的上鎖木箱，上面的鎖扣看起來並不普通……<br>
                似乎要旋轉看看才能解鎖。<br><br>
                利用滑鼠點擊各層圓環，使其順時針旋轉，<br>
                讓所有線段與中心線段連接即可打開木箱。
              </p>
            </div>
            <img src="/assets/LockStartBtn.png" class="lock-start-btn"/>
          </div>
          <img src="/assets/BackBtn.png" class="lock-back-btn"/>
        </div>
      </div>
    `;

    injectStyle();
    updateScale();
    fitStartText();

    container.querySelector<HTMLImageElement>(".lock-start-btn")!.onclick = () => {
      phase = "game";
      render();
    };
    container.querySelector<HTMLImageElement>(".lock-back-btn")!.onclick = () => {
      onSuccess(false);
    };
  }

  function renderGame() {
    container.innerHTML = `
      <div class="lock-game">
        <div class="lock-stage">
          <img src="/assets/BGinGame.png" class="lock-bg"/>
          <img src="/assets/BackBtn.png" class="lock-back-btn"/>
          <div class="lock-disc" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:510px; height:510px;">
            <img src="/assets/C05v2.png" class="lock-full" style="position:absolute; width:100%; height:100%; z-index:1; pointer-events:none;"/>
            <img
              id="img2"
              src="/assets/C04v2.png"
              style="position:absolute; top:50%; left:50%; width:420px; height:420px; transform:translate(-50%, -50%); z-index:2;"
            >
            <img
              id="img1"
              src="/assets/C03v2.png"
              style="position:absolute; top:50%; left:50%; width:320px; height:320px; transform:translate(-50%, -50%); z-index:3;"
            >
            <img
              id="img0"
              src="/assets/C02v2.png"
              style="position:absolute; top:50%; left:50%; width:220px; height:220px; transform:translate(-50%, -50%); z-index:4;"
            >
            <div
              class="lock-hit"
              data-i="2"
              style="position:absolute; top:50%; left:50%; width:420px; height:420px; transform:translate(-50%, -50%); z-index:8;"
            ></div>
            <div
              class="lock-hit"
              data-i="1"
              style="position:absolute; top:50%; left:50%; width:320px; height:320px; transform:translate(-50%, -50%); z-index:9;"
            ></div>
            <div
              class="lock-hit"
              data-i="0"
              style="position:absolute; top:50%; left:50%; width:220px; height:220px; transform:translate(-50%, -50%); z-index:10;"
            ></div>
            <div
              class="lock-center-blocker"
              style="position:absolute; top:50%; left:50%; width:125px; height:125px; transform:translate(-50%, -50%); z-index:11;"
            ></div>
            <img src="/assets/C01v2.png" class="lock-center" style="z-index:5;"/>
          </div>
        </div>
      </div>
    `;

    injectStyle();
    updateScale();
    applyRotation();
    bindEvents();

    container.querySelector<HTMLImageElement>(".lock-back-btn")!.onclick = () => {
      phase = "start";
      render();
    };
  }

  function injectStyle() {
    if (styleEl?.parentNode) styleEl.parentNode.removeChild(styleEl);
    styleEl = document.createElement("style");
    styleEl.id = "lock-style";
    styleEl.innerHTML = `
      .lock-game { width:100%; height:100%; display:flex; justify-content:center; align-items:center; background:#000; }
      .lock-stage { position:relative; width:900px; height:600px; transform:scale(var(--scale)); transform-origin:center; }
      .lock-bg { position:absolute; width:100%; height:100%; object-fit:contain; }
      .lock-back-btn { position:absolute; top:30px; left:50px; width:65px; cursor:pointer; z-index:30; }
      .lock-start-panel {
        position:absolute;
        top:50%;
        left:50%;
        transform:translate(-50%, -50%);
        width:65%;
        aspect-ratio: 1024 / 547;
      }
      .lock-text {
        position:absolute;
        inset:0;
        width:100%;
        height:100%;
        pointer-events:none;
      }
      .lock-desc {
        position:absolute;

        top:12%;
        left:8%;
        width:84%;
        height:62%;

        display:flex;
        flex-direction:column;
        justify-content:center;
        align-items:center;

        color:white;
        text-align:center;
      }
      .lock-desc h2 { margin:0 0 6% 0; font-size:20px; line-height:1.2; }
      .lock-desc p { margin:0; font-size:13px; line-height:1.5; word-break:break-word; }
      .lock-start-btn {
        position:absolute;

        left:50%;
        bottom:8%;
        transform:translateX(-50%);

        width:20%;
        cursor:pointer;
      }
      .lock-disc { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:510px; height:510px; }
      .lock-layer { position:absolute; top:50%; left:50%; }
      .lock-layer img { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); pointer-events:none; transition:0.25s; }
      .lock-hit { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); border-radius:50%; cursor:pointer; }
      .size420 img, .size420 .lock-hit { width:420px; height:420px; }
      .size320 img, .size320 .lock-hit { width:320px; height:320px; }
      .size220 img, .size220 .lock-hit { width:220px; height:220px; }
      .lock-full { position:absolute; width:100%; height:100%; }
      .lock-center { position:absolute; width:125px; height:125px; top:50%; left:50%; transform:translate(-50%, -50%); }
      .lock-end-modal { position:absolute; inset:0; display:flex; justify-content:center; align-items:center; z-index:200; }
      .lock-end-wrapper { position:relative; width:900px; height:600px; transform:scale(var(--scale)); transform-origin:center; }
      .lock-end-bg { position:absolute; width:100%; height:100%; object-fit:contain; }
      .lock-end-panel { position:absolute; top:70%; left:50%; transform:translate(-50%, -50%); width:75%; aspect-ratio:675 / 188; }
      .lock-end-text { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
      .lock-end-desc { position:absolute; top:12.8%; left:7.1%; width:83%; color:#fff; text-align:left; line-height:1.6; font-size:16px; }
      .lock-end-desc p { margin:0; }
      .lock-end-btn { position:absolute; right:6.2%; bottom:9.6%; width:14.8%; cursor:pointer; transition:0.2s; }
    `;
    document.head.appendChild(styleEl);
  }

  function updateScale() {
    const baseW = 900;
    const baseH = 600;
    const scale = Math.min(container.clientWidth / baseW, container.clientHeight / baseH);
    container.style.setProperty("--scale", String(scale));
    if (phase === "start") fitStartText();
  }

  function fitStartText() {
    const desc = container.querySelector<HTMLElement>(".lock-desc");
    const title = desc?.querySelector<HTMLElement>("h2");
    const body = desc?.querySelector<HTMLElement>("p");
    if (!desc || !title || !body) return;

    const baseTitle = 22;
    const baseBody = 16;
    let titleSize = baseTitle;
    let bodySize = baseBody;

    title.style.fontSize = `${titleSize}px`;
    body.style.fontSize = `${bodySize}px`;

    let guard = 0;
    while (desc.scrollHeight > desc.clientHeight && guard < 20) {
      titleSize = Math.max(14, titleSize - 0.5);
      bodySize = Math.max(10, bodySize - 0.5);
      title.style.fontSize = `${titleSize}px`;
      body.style.fontSize = `${bodySize}px`;
      guard += 1;
    }
  }

  function applyRotation() {
    angles.forEach((a, i) => {
      const img = container.querySelector<HTMLImageElement>(`#img${i}`);
      if (!img) return;

      img.style.transition = "none";
      img.style.transform = `translate(-50%, -50%) rotate(${a}deg)`;

      requestAnimationFrame(() => {
        img.style.transition = "transform 0.25s";
      });
    });
  }

  function bindEvents() {
    container.querySelectorAll<HTMLElement>(".lock-hit").forEach(hit => {
      hit.onclick = () => {
        const i = Number(hit.dataset.i);
        angles[i] += 90;

        const img = container.querySelector<HTMLImageElement>(`#img${i}`);
        if (!img) return;

        img.style.transform = `translate(-50%, -50%) rotate(${angles[i]}deg)`;
        checkWin();
      };
    });
  }

  function checkWin() {
    if (angles.every(a => a % 360 === 0)) {
      if (winTimer) window.clearTimeout(winTimer);
      winTimer = window.setTimeout(() => {
        phase = "end";
        render();
      }, 200);
    }
  }

  function renderEnd() {
    container.innerHTML = `
      <div class="lock-end-modal">
      <div class="lock-end-wrapper">
        <img src="/assets/LockBGEnd.png" class="lock-end-bg"/>
        <div class="lock-end-panel">
          <img src="/assets/LockEndTextArea.png" class="lock-end-text"/>
          <div class="lock-end-desc">
            <p>
              箱子裡有張捲起來的紙——「往東轉一次，不要猶豫。」<br>
              紙條上的字跡歪扭，你心中升起一股不安。這艘船的每一個謎題，
              似乎都在測試你的勇氣與直覺。<br><br>
              得到線索：東（E）1
            </p>
          </div>
          <img src="/assets/LockEndConBtn.png" class="lock-end-btn"/>
        </div>
      </div>
      </div>
    `;

    injectStyle();
    updateScale();

    container.querySelector<HTMLImageElement>(".lock-end-btn")!.onclick = () => {
      onSuccess(true);
    };
  }

  return () => {
    window.removeEventListener("resize", updateScale);
    if (winTimer) window.clearTimeout(winTimer);
    if (styleEl?.parentNode) styleEl.parentNode.removeChild(styleEl);
    container.innerHTML = "";
  };
}