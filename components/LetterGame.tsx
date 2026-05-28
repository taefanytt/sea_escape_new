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
          <div class="stage-wrapper">
              <img id="game-stage" src="/assets/letter_1.png" alt="遊戲背景" />
              <img id="drag-candle" src="/assets/letter_candle.png" alt="蠟燭" draggable="true" style="display: none;" />
              <div id="hotspot-back" class="hotspot" style="display: block;"></div>
              <div id="hotspot-start" class="hotspot" style="display: block;"></div>
              <div id="hotspot-letter-target" class="hotspot" style="display: none;"></div>
              <div id="hotspot-click-next" class="hotspot" style="display: none;"></div>
              <div id="hotspot-win" class="hotspot" style="display: none;"></div>
          </div>
      </div>
      <style>
            .letter-game-box {
              /* Fill the entire overlay area so the image can scale to maximum visible size */
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              background: transparent;
              border-radius: 0;
              padding: 0;
              box-sizing: border-box;
              overflow: hidden;
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

          #hotspot-back {
              top: 0%; left: 10%;
              width: 15%; height: 15%;
              z-index: 30;
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
    const hotspotBack = container.querySelector<HTMLDivElement>('#hotspot-back');
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

    register(hotspotBack, 'click', () => {
      if (currentStep === 1) {
        onSuccess(false);
      } else if (currentStep === 3) {
        currentStep = 2;
        if (gameStage) gameStage.src = '/assets/letter_2-1.png';
        if (hotspotNext) hotspotNext.style.display = 'none';
        if (hotspotBack) hotspotBack.style.display = 'none';
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
      if (hotspotBack) hotspotBack.style.display = 'none';
      if (gameStage) gameStage.src = '/assets/letter_2-1.png';
      if (dragCandle) dragCandle.style.display = 'block';
      if (hotspotLetter) hotspotLetter.style.display = 'block';
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
        if (hotspotBack) hotspotBack.style.display = 'block';
        if (hotspotNext) hotspotNext.style.display = 'block';
      });
    }

    register(hotspotNext, 'click', () => {
      currentStep = 4;
      if (hotspotNext) hotspotNext.style.display = 'none';
      if (hotspotBack) hotspotBack.style.display = 'none';
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
