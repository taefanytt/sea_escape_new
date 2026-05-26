'use client';

import { useEffect, useRef } from 'react';

interface LockGameProps {
  onSuccess: (completed?: boolean) => void;
}

export default function LockGame({ onSuccess }: LockGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preload = [
      '/assets/BGinGame.png',
      '/assets/C05v2.png',
      '/assets/C04v2.png',
      '/assets/C03v2.png',
      '/assets/C02v2.png',
      '/assets/C01v2.png'
    ];
    preload.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    let angles = [180, 90, 180];
    let started = false;
    let styleEl: HTMLStyleElement | null = null;
    let mounted = true;

    const render = () => {
      if (!mounted || !container) return;
      if (!started) {
        renderStart();
      } else {
        renderGame();
      }
    };

    const renderStart = () => {
      if (!container) return;
      container.innerHTML = `
        <div class="lock-game">
            <div class="lock-stage">
                <img src="/assets/LockBGStart.png" class="lock-bg"/>
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
                <img src="/assets/BackBtn.png" class="lock-back-btn"/>
            </div>
        </div>
      `;

      injectStyle();
      updateScale();

      const startBtn = container.querySelector('.lock-start-btn');
      const backBtn = container.querySelector('.lock-back-btn');
      startBtn?.addEventListener('click', () => {
        started = true;
        render();
      });
      backBtn?.addEventListener('click', () => onSuccess(false));
    };

    const renderGame = () => {
      if (!container) return;
      container.innerHTML = `
        <div class="lock-game">
            <div class="lock-stage">
                <img src="/assets/BGinGame.png" class="lock-bg"/>
                <img src="/assets/BackBtn.png" class="lock-back-btn"/>
                <div class="lock-disc">
                    <img src="/assets/C05v2.png" class="lock-full"/>
                    <div class="lock-layer size420">
                        <div class="lock-hit" data-i="2"></div>
                        <img id="img2" src="/assets/C04v2.png">
                    </div>
                    <div class="lock-layer size320">
                        <div class="lock-hit" data-i="1"></div>
                        <img id="img1" src="/assets/C03v2.png">
                    </div>
                    <div class="lock-layer size220">
                        <div class="lock-hit" data-i="0"></div>
                        <img id="img0" src="/assets/C02v2.png">
                    </div>
                    <img src="/assets/C01v2.png" class="lock-center"/>
                </div>
            </div>
        </div>
      `;

      injectStyle();
      updateScale();
      applyRotation();
      bindEvents();

      const backBtn = container.querySelector('.lock-back-btn');
      backBtn?.addEventListener('click', () => {
        started = false;
        render();
      });
    };

    const injectStyle = () => {
      if (styleEl) return;
      styleEl = document.createElement('style');
      styleEl.id = 'lockgame-style';
      styleEl.textContent = `
        .lock-game { width:100%; height:100%; display:flex; justify-content:center; align-items:center; background:#000; }
        .lock-stage { position:relative; width:900px; height:600px; transform:scale(var(--scale)); transform-origin:center; }
        .lock-bg { position:absolute; width:100%; height:100%; object-fit:contain; }
        .lock-back-btn { position:absolute; top:30px; left:50px; width:65px; cursor:pointer; }
        .lock-text { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:65%; }
        .lock-desc { position:absolute; top:45%; left:50%; transform:translate(-50%, -50%); width:55%; color:white; text-align:center; }
        .lock-desc h2 { margin-bottom:30px; font-size:24px; }
        .lock-desc p { font-size:16px; line-height:1.7; }
        .lock-start-btn { position:absolute; top:69%; left:50%; transform:translate(-50%, -50%); width:120px; cursor:pointer; }
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
        .lock-end-text { position:absolute; top:70%; left:50%; transform:translate(-50%, -50%); width:75%; pointer-events:none; }
        .lock-end-desc { position:absolute; top:70%; left:50%; transform:translate(-50%, -50%); width:65%; color:#fff; text-align:left; line-height:1.6; font-size:16px; }
        .lock-end-btn { position:absolute; bottom:18%; right:17%; width:100px; cursor:pointer; transition:0.2s; }
      `;
      document.head.appendChild(styleEl);
    };

    const updateScale = () => {
      if (!container) return;
      const baseW = 900;
      const baseH = 600;
      const scale = Math.min(container.clientWidth / baseW, container.clientHeight / baseH);
      container.style.setProperty('--scale', scale.toString());
    };

    const applyRotation = () => {
      angles.forEach((a, i) => {
        const img = container.querySelector(`#img${i}`) as HTMLImageElement | null;
        if (!img) return;
        img.style.transition = 'none';
        img.style.transform = `translate(-50%, -50%) rotate(${a}deg)`;
        requestAnimationFrame(() => {
          img.style.transition = 'transform 0.25s';
        });
      });
    };

    const bindEvents = () => {
      container.querySelectorAll<HTMLDivElement>('.lock-hit').forEach(hit => {
        hit.onclick = () => {
          const i = Number(hit.dataset.i);
          angles[i] += 90;
          const img = container.querySelector<HTMLImageElement>(`#img${i}`);
          if (img) {
            img.style.transform = `translate(-50%, -50%) rotate(${angles[i]}deg)`;
          }
          checkWin();
        };
      });
    };

    const checkWin = () => {
      if (angles.every(a => a % 360 === 0)) {
        setTimeout(showModal, 200);
      }
    };

    const showModal = () => {
      const modal = document.createElement('div');
      modal.className = 'lock-end-modal';
      modal.innerHTML = `
            <div class="lock-end-wrapper">
                <img src="/assets/LockBGEnd.png" class="lock-end-bg"/>
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
        `;
      const btn = modal.querySelector<HTMLImageElement>('.lock-end-btn');
      btn?.addEventListener('click', () => onSuccess(true));
      container.appendChild(modal);
    };

    render();
    window.addEventListener('resize', updateScale);

    return () => {
      mounted = false;
      window.removeEventListener('resize', updateScale);
      if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      if (container) container.innerHTML = '';
    };
  }, [onSuccess]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
