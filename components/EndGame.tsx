'use client';
import React, { useState } from 'react';
import Image from 'next/image';

interface EndGameProps {
  onSuccess: () => void;
}

type GameStage = 'intro' | 'playing' | 'ending';

export default function EndGame({ onSuccess }: EndGameProps) {
  const [stage, setStage] = useState<GameStage>('intro');
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [showClueModal, setShowClueModal] = useState<boolean>(false);
  const [errorBtn, setErrorBtn] = useState<string | null>(null);

  // 核心正確密碼順序
  const correctSequence = ['N', 'W', 'W', 'W', 'E'];

  // 處理方位按鈕點擊
  const handleDirClick = (dir: string) => {
    const nextInput = [...playerInput, dir];
    const currentIndex = nextInput.length - 1;

    // 檢查這次點擊是否與正確答案相符
    if (nextInput[currentIndex] !== correctSequence[currentIndex]) {
      setPlayerInput([]); // 答錯了，重設玩家輸入
      setErrorBtn(dir);   // 觸發該按鈕的 CSS 震動動畫 (shake-error)
      setTimeout(() => setErrorBtn(null), 300);
      return;
    }

    setPlayerInput(nextInput);

    // 檢查是否全數答對通關
    if (nextInput.length === correctSequence.length) {
      setTimeout(() => {
        setStage('ending'); // 切換到通關結局狀態，背景會自動更換為 ending1.png
      }, 1000);
    }
  };

  return (
    <div 
      id="direction-container" 
      className={stage === 'ending' ? 'ending1-bg' : ''}
      style={{ 
        position: 'relative', 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {/* 💡 終極修正背景方案：
        直接使用 Next.js Image 元件填滿底層，依據 stage 狀態切換預設背景與結局背景。
        這能完全繞過 CSS 中 !important 導致行內樣式失效的 Bug。
      */}
      <Image
        src={stage === 'ending' ? '/assets/ending1.png' : '/assets/end/end_bg.png'}
        alt="遊戲背景"
        fill
        priority
        quality={100}
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* 💡 這裡已經把原先的黑色半透明遮罩層 (rgba(0, 0, 0, 0.55)) 拿掉了 */}

      {/* 主要內容包裝層：
        確保所有互動 UI 都在背景圖之上 (zIndex: 10)
      */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        
        {/* ==========================================
           1. 故事說明對話框 (遊戲前導 intro 與 結束通關 ending 共用)
           ========================================== */}
        {(stage === 'intro' || stage === 'ending') && (
          <div id="dialogbox" style={{ display: 'flex' }}>
            <div id="dialog_content">
              {stage === 'intro' ? (
                <>
                  <h2>歸途的方向</h2>
                  <p>
                    船舵在風雨中微微晃動，彷彿在等待指令。<br />
                    真假難辨的線索已全數集齊，現在，該由你決定最終的航向了……<br /><br />
                    依照先前線索，在畫面中的四個方位，依正確順序點擊相應次數。
                  </p>
                </>
              ) : (
                <>
                  <p>船舵發出沉重的喀噠聲——</p>
                  <p>船舵停止轉動。整艘船劇烈震動了一下。</p>
                  <p>海面上的濃霧，開始慢慢散去。</p>
                  <p>你聽見風聲改變了方向。</p>
                  <p>當你再次睜眼時，你已經離開了原本的海域。</p>
                  <p>船長沒有回來。但一切再次恢復平靜。</p>
                </>
              )}
            </div>

            {/* 依據不同階段顯示「開始」或「重新開始」按鈕 */}
            {stage === 'intro' ? (
              <button 
                id="startbutton" 
                onClick={() => setStage('playing')} 
                aria-label="開始"
              />
            ) : (
              <button 
                id="endgame-playagain-btn" 
                type="button" 
                onClick={onSuccess} 
                aria-label="重新開始"
              />
            )}
          </div>
        )}

        {/* ==========================================
           2. 主要操作舞台 (僅在遊戲進行中 playing 顯示)
           ========================================== */}
        {stage === 'playing' && (
          <div id="dir-game-stage">
            {/* 查看線索按鈕 */}
            <button 
              id="clue-toggle-btn" 
              onClick={() => setShowClueModal(true)} 
              aria-label="查看線索" 
            />

            {/* 中央轉動羅盤視覺 */}
            <div id="dir-center-compass"></div>

            {/* 四個互動方位按鈕：對應你的 CSS 位置與背景圖 */}
            <button 
              className={`dir-arrow btn-up ${errorBtn === 'S' ? 'shake-error' : ''}`} 
              onClick={() => handleDirClick('S')} 
              aria-label="南"
            />
            <button 
              className={`dir-arrow btn-left ${errorBtn === 'E' ? 'shake-error' : ''}`} 
              onClick={() => handleDirClick('E')} 
              aria-label="東"
            />
            <button 
              className={`dir-arrow btn-right ${errorBtn === 'W' ? 'shake-error' : ''}`} 
              onClick={() => handleDirClick('W')} 
              aria-label="西"
            />
            <button 
              className={`dir-arrow btn-down ${errorBtn === 'N' ? 'shake-error' : ''}`} 
              onClick={() => handleDirClick('N')} 
              aria-label="北"
            />

            {/* ==========================================
               3. 線索提示彈窗 (Modal)
               ========================================== */}
            {showClueModal && (
              <div id="clue-modal">
                <div className="clue-modal-box">
                  <p>西 (W) 3</p>
                  <hr />
                  <p>北 (N) 1</p>
                  <hr />
                  <p>東 (E) 1</p>
                  <hr />
                  <p>順序「北 → 西 → 東」</p>
                  <hr />
                  <p>東 (E) 3</p>
                  <button id="clue-close-btn" onClick={() => setShowClueModal(false)}>
                    確定
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}