'use client';
import React from 'react';

interface EndGameProps {
  onSuccess: () => void;
}

export default function EndGame({ onSuccess }: EndGameProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const directionContainer = document.createElement('div');
    directionContainer.id = 'direction-container';

    // 返回按鈕
    const backButton = document.createElement('button');
    backButton.id = 'compass-back-btn';
    directionContainer.appendChild(backButton);

    // 故事說明對話框
    const dialogBox = document.createElement('div');
    dialogBox.id = 'dialogbox';
    const dialogContent = document.createElement('div');
    dialogContent.id = 'dialog_content';
    dialogContent.innerHTML = `
      <h2>歸途的方向</h2>
      <p>船舵在風雨中微微晃動，彷彿在等待指令。<br>
         真假難辨的線索已全數集齊，現在，該由你決定最終的航向了……<br><br>
         依照先前線索，在畫面中的四個方位，依正確順序點擊相應次數。</p>
    `;
    const startButton = document.createElement('button');
    startButton.id = 'startbutton';
    startButton.textContent = '開始';
    dialogBox.appendChild(dialogContent);
    dialogBox.appendChild(startButton);
    directionContainer.appendChild(dialogBox);

    // 主要操作舞台
    const dirGameStage = document.createElement('div');
    dirGameStage.id = 'dir-game-stage';
    dirGameStage.style.display = 'none';

    dirGameStage.innerHTML = `
      <button id="clue-toggle-btn"></button>

      <div id="dir-center-compass"></div>

      <button class="dir-arrow btn-up" data-dir="S"></button>
      <button class="dir-arrow btn-left" data-dir="E"></button>
      <button class="dir-arrow btn-right" data-dir="W"></button>
      <button class="dir-arrow btn-down" data-dir="N"></button>

      <div id="clue-modal" style="display: none;">
        <div class="clue-modal-box">
          <p>西 (W) 3</p>
          <hr />
          <p>北 (N) 1</p>
          <hr />
          <p>東 (E) 1</p>
          <hr />
          <p>順序「北 → 西 → 東」</p>
          <hr />
          <p>東 (E) 3</p>
          <button id="clue-close-btn">確定</button>
        </div>
      </div>
    `;

    directionContainer.appendChild(dirGameStage);
    container.appendChild(directionContainer);

    // 返回按鈕事件
    backButton.addEventListener('click', () => {
      const overlay = document.getElementById('level-overlay');
      if (overlay) {
        overlay.style.display = 'none';
        container.innerHTML = '';
      }
    });

    // 核心密碼數據
    const correctSequence = ['N', 'W', 'W', 'W', 'E'];
    let playerInput: string[] = [];

    function initDirectionGameplay() {
      const clueBtn = dirGameStage.querySelector('#clue-toggle-btn') as HTMLButtonElement;
      const clueModal = dirGameStage.querySelector('#clue-modal') as HTMLDivElement;
      const clueClose = dirGameStage.querySelector('#clue-close-btn') as HTMLButtonElement;

      clueBtn.onclick = () => { clueModal.style.display = 'flex'; };
      clueClose.onclick = () => { clueModal.style.display = 'none'; };

      dirGameStage.querySelectorAll<HTMLButtonElement>('.dir-arrow').forEach(btn => {
        btn.onclick = () => {
          const direction = btn.dataset.dir || '';
          playerInput.push(direction);

          const currentIndex = playerInput.length - 1;
          if (playerInput[currentIndex] !== correctSequence[currentIndex]) {
            playerInput = [];
            btn.classList.add('shake-error');
            setTimeout(() => btn.classList.remove('shake-error'), 300);
            return;
          }

          if (playerInput.length === correctSequence.length) {
            checkFinalWinCondition();
          }
        };
      });
    }

    function checkFinalWinCondition() {
      dirGameStage.querySelectorAll('button').forEach(b => (b.style.pointerEvents = 'none'));
      backButton.style.pointerEvents = 'none';

      setTimeout(() => {
        dialogContent.innerHTML = `
          <p>船舵發出沉重的喀噠聲——</p>
          <p>
          船舵停止轉動。
          整艘船劇烈震動了一下。</p>
          <p>
          海面上的濃霧，開始慢慢散去。
          </p>
          <p>
          你聽見風聲改變了方向。
          </p>
          <p>
          當你再次睜眼時，
          </p>
          <p>
          你已經離開了原本的海域。
          </p>
          <p>
          船長沒有回來。
          </p>
          <p>
          但一切再次恢復平靜。
          </p>
        `;
        startButton.textContent = '確定';
        dirGameStage.style.display = 'none';
        dialogBox.style.display = 'flex';
      }, 1000);
    }

    startButton.addEventListener('click', () => {
      if (startButton.textContent === '開始') {
        dialogBox.style.display = 'none';
        dirGameStage.style.display = 'block';
        initDirectionGameplay();
      } else if (startButton.textContent === '確定') {
        onSuccess();
      }
    });

    return () => {
      container.innerHTML = '';
    };
  }, [onSuccess]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}