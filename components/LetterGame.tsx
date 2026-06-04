'use client';

import { useEffect, useRef } from 'react';

interface LetterGameProps {
  onSuccess: (completed?: boolean) => void;
}

export default function LetterGame({ onSuccess }: LetterGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = `
      <div class="letter-game-box">
          <button id="real-back-button" class="real-back-btn" style="display: block;">
            <img src="/assets/BackBtn.png" alt="返回" style="width:100%;height:100%;object-fit:contain;" />
          </button>

          <div class="stage-wrapper">
              <img id="game-stage" src="/assets/letter_1.png" alt="遊戲背景" />
              <img id="drag-candle" src="/assets/letter_candle.png" alt="蠟燭" draggable="true" style="display: none;" />
              
              <div id="hotspot-start" class="hotspot" style="display: block;"></div>
              <div id="hotspot-letter-target" class="hotspot" style="display: none;"></div>
              <div id="hotspot-click-next" class="hotspot" style="display: none;"></div>
              <div id="hotspot-win" class="hotspot" style="display: none;"></div>
          </div>
      </div>
      <style>
            .letter-game-box {
              position: relative; /* 讓真實返回按鈕可以相對於這個大框框做絕對定位 */
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #111; /* 保持精美置中時的黑底沉浸感 */
              border-radius: 0;
              padding: 0;
              box-sizing: border-box;
              overflow: hidden;
            }

            .real-back-btn {
              position: absolute;
              top: 20px;
              left: 20px;
              width: 50px;
              height: 50px;
              background: transparent;  /* 移除背景色 */
              border: none;
              border-radius: 0;         /* 移除圓角 */
              padding: 0;
              cursor: pointer;
              z-index: 100;
              display: flex;
              justify-content: center;
              align-items: center;
              box-shadow: none;         /* 移除陰影 */
              transition: transform 0.1s;
            }
            .real-back-btn:hover {
              background: transparent;
            }
            .real-back-btn:active {
              transform: scale(0.95);
            }
            .stage-wrapper {
              position: relative;
              display: flex;
              width: 100%;
              height: 100%;
              align-items: center;
              justify-content: center;
              max-width: none;
              max-height: none;
              min-height: 0;
            }

            #game-stage {
              display: block;
              width: 100%;
              height: 100%;
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              user-select: none;
              -webkit-user-drag: none;
            }

            #drag-candle {
              position: absolute;
              top: 52%;
              left: 72%;
              width: 8%;
              min-width: 48px;
              cursor: grab;
              z-index: 5;
            }

          .hotspot {
              position: absolute;
              cursor: pointer;
              background: rgba(0, 0, 0, 0);
          }

          #hotspot-start {
              top: 15%; left: 0%;
              width: 100%; height: 85%;
              z-index: 10;
          }

          #hotspot-letter-target {
              top: 40%; left: 25%;
              width: 50%; height: 45%;
              z-index: 10;
          }

          #hotspot-click-next {
              top: 20%; left: 15%;
              width: 70%; height: 70%;
              z-index: 10;
          }

          #hotspot-win {
              top: 0%; left: 0%;
              width: 100%; height: 100%;
              z-index: 10;
          }
      </style>
    `;

    const gameStage = container.querySelector<HTMLImageElement>('#game-stage');
    const dragCandle = container.querySelector<HTMLImageElement>('#drag-candle');
    const realBackButton = container.querySelector<HTMLButtonElement>('#real-back-button'); // 🌟 抓取新按鈕
    const hotspotStart = container.querySelector<HTMLDivElement>('#hotspot-start');
    const hotspotLetter = container.querySelector<HTMLDivElement>('#hotspot-letter-target');
    const hotspotNext = container.querySelector<HTMLDivElement>('#hotspot-click-next');
    const hotspotWin = container.querySelector<HTMLDivElement>('#hotspot-win');

    let currentStep = 1;

    const cleanupFns: Array<() => void> = [];

    const register = <T extends EventTarget>(
      element: T | null,
      type: string,
      listener: EventListenerOrEventListenerObject
    ) => {
      if (!element) return;
      element.addEventListener(type, listener);
      cleanupFns.push(() => element.removeEventListener(type, listener));
    };

    // 🌟 更改處：將點擊監聽改綁在「真實實體按鈕」上，並對齊你的返回與隱藏邏輯
    register(realBackButton, 'click', (e: Event) => {
      if (e) e.stopPropagation(); 
      
      if (currentStep === 1) {
        // 步驟 1 點返回：直接退出關卡
        onSuccess(false);
      } 
      else if (currentStep === 2) {
        // 🌟 依據鎖扣邏輯：步驟 2 (letter_2-1) 點返回：回到步驟 1 (letter_1)
        currentStep = 1;
        if (gameStage) gameStage.src = '/assets/letter_1.png';
        if (hotspotStart) hotspotStart.style.display = 'block';
        if (dragCandle) dragCandle.style.display = 'none';
        if (hotspotLetter) hotspotLetter.style.display = 'none';
        if (realBackButton) realBackButton.style.display = 'block'; // 確保返回按鈕在
      }
      else if (currentStep === 3) {
        // 步驟 3 (letter_2-2) 點返回：回到步驟 2 (letter_2-1 重新烤信)
        currentStep = 2;
        if (gameStage) gameStage.src = '/assets/letter_2-1.png';
        if (hotspotNext) hotspotNext.style.display = 'none';
        
        // 🌟 依據新邏輯：在步驟 2 時返回鈕依然要開著，讓玩家可以一路退回第一頁說明
        if (realBackButton) realBackButton.style.display = 'block'; 
        
        if (dragCandle) {
          dragCandle.style.display = 'block';
          dragCandle.style.visibility = 'visible';
        }
        if (hotspotLetter) hotspotLetter.style.display = 'block';
      }
    });

    register(hotspotStart, 'click', () => {
      currentStep = 2;
      if (hotspotStart) hotspotStart.style.display = 'none';
      if (gameStage) gameStage.src = '/assets/letter_2-1.png';
      if (dragCandle) dragCandle.style.display = 'block';
      if (hotspotLetter) hotspotLetter.style.display = 'block';
      
      // 🌟 進入步驟 2，返回鈕維持 block 不隱藏
      if (realBackButton) realBackButton.style.display = 'block';
    });

    if (dragCandle) {
      dragCandle.ondragstart = () => {
        setTimeout(() => {
          if (dragCandle) dragCandle.style.visibility = 'hidden';
        }, 0);
      };
      dragCandle.ondragend = () => {
        if (currentStep === 2 && dragCandle) dragCandle.style.visibility = 'visible';
      };
      cleanupFns.push(() => {
        if (dragCandle) {
          dragCandle.ondragstart = null;
          dragCandle.ondragend = null;
        }
      });
    }

    if (hotspotLetter) {
      register(hotspotLetter, 'dragover', (event) => {
        event.preventDefault();
      });
      register(hotspotLetter, 'drop', (event) => {
        event.preventDefault();
        currentStep = 3;
        if (dragCandle) dragCandle.style.display = 'none';
        if (hotspotLetter) hotspotLetter.style.display = 'none';
        if (gameStage) gameStage.src = '/assets/letter_2-2.png';
        if (realBackButton) realBackButton.style.display = 'block';
        if (hotspotNext) hotspotNext.style.display = 'block';
      });
    }

    register(hotspotNext, 'click', () => {
      currentStep = 4;
      if (hotspotNext) hotspotNext.style.display = 'none';
      
      // 最後一頁線索頁，為了防呆與強制玩家通關，隱藏左上角返回按鈕
      if (realBackButton) realBackButton.style.display = 'none'; 
      
      if (gameStage) gameStage.src = '/assets/letter_3.png';
      if (hotspotWin) hotspotWin.style.display = 'block';
    });

    register(hotspotWin, 'click', () => {
      if (hotspotWin) hotspotWin.style.display = 'none';
      onSuccess(true);
    });

    return () => {
      cleanupFns.forEach(fn => fn());
      container.innerHTML = '';
    };
  }, [onSuccess]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}