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
              position: relative; 
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #111; 
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
              background: transparent;  
              border: none;
              border-radius: 0;         
              padding: 0;
              cursor: pointer;
              z-index: 100;
              display: flex;
              justify-content: center;
              align-items: center;
              box-shadow: none;         
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
    const realBackButton = container.querySelector<HTMLButtonElement>('#real-back-button'); 
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

    // 🌟 共享的「成功烤信通關」切換邏輯
    const triggerLetterSuccess = () => {
      currentStep = 3;
      if (dragCandle) dragCandle.style.display = 'none';
      if (hotspotLetter) hotspotLetter.style.display = 'none';
      if (gameStage) gameStage.src = '/assets/letter_2-2.png';
      if (realBackButton) realBackButton.style.display = 'block';
      if (hotspotNext) hotspotNext.style.display = 'block';
    };

    register(realBackButton, 'click', (e: Event) => {
      if (e) e.stopPropagation(); 
      
      if (currentStep === 1) {
        onSuccess(false);
      } 
      else if (currentStep === 2) {
        currentStep = 1;
        if (gameStage) gameStage.src = '/assets/letter_1.png';
        if (hotspotStart) hotspotStart.style.display = 'block';
        if (dragCandle) dragCandle.style.display = 'none';
        if (hotspotLetter) hotspotLetter.style.display = 'none';
        if (realBackButton) realBackButton.style.display = 'block'; 
      }
      else if (currentStep === 3) {
        currentStep = 2;
        if (gameStage) gameStage.src = '/assets/letter_2-1.png';
        if (hotspotNext) hotspotNext.style.display = 'none';
        if (realBackButton) realBackButton.style.display = 'block'; 
        
        if (dragCandle) {
          dragCandle.style.display = 'block';
          dragCandle.style.visibility = 'visible';
          // ✅【修改處 2】返回 step2 時重置蠟燭位置，避免觸控拖動後位置殘留
          dragCandle.style.top = '52%';
          dragCandle.style.left = '72%';
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
      if (realBackButton) realBackButton.style.display = 'block';
    });

    // 電腦版滑鼠拖曳防殘影
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

      // ✅【修改處 1】新增手機觸控拖曳支援
      const onTouchMove = (e: TouchEvent) => {
        if (currentStep !== 2) return;
        e.preventDefault(); // 防止頁面捲動干擾拖曳
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 100;
        const y = ((touch.clientY - rect.top) / rect.height) * 100;
        dragCandle.style.left = `${x - 4}%`; // -4% 讓蠟燭中心對齊手指
        dragCandle.style.top  = `${y - 6}%`; // -6% 讓蠟燭中心對齊手指
      };

      const onTouchEnd = (e: TouchEvent) => {
        if (currentStep !== 2) return;
        const touch = e.changedTouches[0];
        const hotRect = hotspotLetter!.getBoundingClientRect();
        // 判斷手指放開時是否落在信件熱區內
        if (
          touch.clientX >= hotRect.left && touch.clientX <= hotRect.right &&
          touch.clientY >= hotRect.top  && touch.clientY <= hotRect.bottom
        ) {
          triggerLetterSuccess();
        }
      };

      dragCandle.addEventListener('touchmove', onTouchMove, { passive: false });
      dragCandle.addEventListener('touchend', onTouchEnd);
      cleanupFns.push(() => {
        dragCandle.removeEventListener('touchmove', onTouchMove);
        dragCandle.removeEventListener('touchend', onTouchEnd);
      });
    }

    if (hotspotLetter) {
      // 1. 電腦端拖曳接收
      register(hotspotLetter, 'dragover', (event) => {
        event.preventDefault();
      });
      register(hotspotLetter, 'drop', (event) => {
        event.preventDefault();
        triggerLetterSuccess();
      });

      // 🌟【關鍵解決方案】手機端觸控防卡死：手機無法拖曳，直接用「點擊信件」來燒信通關！
      register(hotspotLetter, 'click', () => {
        if (currentStep === 2) {
          triggerLetterSuccess();
        }
      });
    }

    register(hotspotNext, 'click', () => {
      currentStep = 4;
      if (hotspotNext) hotspotNext.style.display = 'none';
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