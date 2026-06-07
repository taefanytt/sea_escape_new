'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface EndGameProps {
  onSuccess: () => void;
  onEndingResult?: (result: 'good' | 'bad') => void;
}

type GameStage = 'intro' | 'playing' | 'ending' | 'fail';

export default function EndGame({ onSuccess, onEndingResult }: EndGameProps) {
  const [stage, setStage] = useState<GameStage>('intro');
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [showClueModal, setShowClueModal] = useState<boolean>(false);
  const [errorBtn, setErrorBtn] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [locked, setLocked] = useState<boolean>(false);

  // 💡 響應式縮放因子
  const [scale, setScale] = useState(1);

  // 💡 用來管理「好結局延遲判定」的計時器，防止好結局把壞結局攔截
  const goodEndingTimer = useRef<NodeJS.Timeout | null>(null);

  // 💡 方位配置（反過來）：N在下、W在右、E在左、S在上
  const correctSequence = ['N', 'W', 'W', 'W', 'E'];                // 好結局 (5步)
  const badSequence     = ['N', 'W', 'W', 'W', 'E', 'E', 'E'];       // 壞結局 (好結局路線完，再多點兩次東，共7步)

  // 監聽螢幕寬度
  useEffect(() => {
    const calculateScale = () => {
      const vw = window.innerWidth;
      if (vw < 480) setScale(0.5);
      else if (vw < 768) setScale(0.65);
      else if (vw < 1024) setScale(0.85);
      else setScale(1);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  // 結局結果通知
  useEffect(() => {
    if (stage === 'ending') {
      onEndingResult?.('good');
    }
    if (stage === 'fail') {
      onEndingResult?.('bad');
    }
  }, [onEndingResult, stage]);

  // 重置遊戲
  const handleResetGame = () => {
    if (goodEndingTimer.current) clearTimeout(goodEndingTimer.current);
    setPlayerInput([]);
    setErrorCount(0);
    setLocked(false);
    setErrorBtn(null);
    onSuccess();
  };

  const handleDirClick = (dir: string) => {
    if (stage !== 'playing' || locked) return;

    // 💡 只要玩家點擊了任何按鈕，立刻清除前一次留下的好結局計時器（代表他還想繼續點！）
    if (goodEndingTimer.current) {
      clearTimeout(goodEndingTimer.current);
      goodEndingTimer.current = null;
    }

    const nextInput = [...playerInput, dir];
    const currentStr = nextInput.join('');
    const correctStr = correctSequence.join('');
    const badStr = badSequence.join('');

    // 檢查目前輸入是否符合好結局或壞結局的前綴
    const isValidPath = correctStr.startsWith(currentStr) || badStr.startsWith(currentStr);

    if (!isValidPath) {
      const nextErrorCount = errorCount + 1;
      setErrorCount(nextErrorCount);
      setPlayerInput([]);

      if (nextErrorCount >= 5) {
        setLocked(true);
        setTimeout(() => setStage('fail'), 300);
      } else {
        setErrorBtn(dir);
        setTimeout(() => setErrorBtn(null), 300);
      }
      return;
    }

    setPlayerInput(nextInput);

    // 🎯 判定 A：達到好結局條件（點滿 5 步且完全正確）
    if (currentStr === correctStr) {
      // 💡 關鍵：不立刻進結局！在背景設定一個 1000 毫秒（1秒）的定時器
      // 如果玩家手停下來 1 秒鐘都沒有再點擊，就代表他要好結局！
      goodEndingTimer.current = setTimeout(() => {
        setLocked(true);
        setStage('ending');
      }, 1000); 
      return;
    }

    // 🎯 判定 B：達到壞結局條件（點滿 7 步且完全正確）
    if (currentStr === badStr) {
      setLocked(true);
      setTimeout(() => setStage('fail'), 500);
      return;
    }
  };

  const getBackgroundImageSrc = () => {
    if (stage === 'ending') return '/assets/ending1.png';
    if (stage === 'fail') return '/assets/ending2.png';
    return '/assets/end/end_bg.png';
  };

  return (
    <div 
      id="direction-container" 
      className={stage === 'ending' || stage === 'fail' ? 'ending-bg' : ''}
      style={{ '--scale': scale } as React.CSSProperties}
    >
      <Image
        src={getBackgroundImageSrc()}
        alt="遊戲背景"
        fill
        priority
        quality={75}
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* 對話框框階段 */}
      {(stage === 'intro' || stage === 'ending' || stage === 'fail') && (
        <div id="dialogbox">
          <div id="dialog_content">
            {stage === 'intro' && (
              <>
                <h2>歸途的方向</h2>
                <p>
                  船舵在風雨中微微晃動，彷彿在等待指令。<br />
                  <span style={{ color: '#d8a85f' }}>真假難辨的線索</span>
                  已全數集齊，現在，該由你決定最終的航向了……<br /><br />
                  依照先前線索，在畫面中的四個方位，依正確順序點擊相應次數。
                </p>
              </>
            )}

            {stage === 'ending' && (
              <>
                <p>船舵發出沉重的喀噠聲——</p>
                <p>船舵停止轉動。整艘船劇烈震動了一下。</p>
                <p>海面上的濃霧，開始慢慢散去。</p>
                <p>你聽見風聲改變了方向。</p>
                <p><br />當你再次睜眼時，你已經離開了原本的海域。</p>
                <p>船長沒有回來。但一切再次恢復平靜。</p>
              </>
            )}

            {stage === 'fail' && (
              <>
                <p>船舵在連續的錯誤指令下劇烈反彈——</p>
                <p>狂風瞬間撕裂了主帆，海浪如巨獸般吞噬了甲板。</p>
                <p>迷霧化為實體的黑暗，將整艘船徹底籠罩。</p>
                <p>指針瘋狂旋轉，暴風雨切斷了最後的歸途……</p>
                <p><br />你終究沒能找到正確的方向，永遠留在了這片神祕的海域。</p>
              </>
            )}
          </div>

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
              onClick={handleResetGame} 
              aria-label="重新開始"
            />
          )}
        </div>
      )}


      {stage === 'playing' && (
        <div id="dir-stage-wrapper">
          <div id="dir-game-stage">
            <button 
              id="clue-toggle-btn" 
              onClick={() => setShowClueModal(true)} 
              aria-label="查看線索" 
            />

            <div id="dir-center-compass"></div>

            {/* 方位配置（反過來）：上為南，下為北，左為東，右為西 */}
            {/* ⬆️ 畫面上的按鈕 -> 對應 南 (S) */}
            <button 
              className={`dir-arrow btn-up ${errorBtn === 'S' ? 'shake-error' : ''}`} 
              onClick={(e) => {
                // 💡 桌機點擊時正常執行
                handleDirClick('S');
              }} 
              aria-label="南 (上方)"
              onTouchStart={(e) => {
                e.preventDefault(); // 💡 關鍵：強制阻斷後續的 onClick，防止手機版重複判定！
                handleDirClick('S');
              }}
            />

            {/* ⬇️ 畫面下的按鈕 -> 對應 北 (N) */}
            <button 
              className={`dir-arrow btn-down ${errorBtn === 'N' ? 'shake-error' : ''}`} 
              onClick={(e) => {
                handleDirClick('N');
              }} 
              aria-label="北 (下方)"
              onTouchStart={(e) => {
                e.preventDefault(); // 💡 關鍵：強制阻斷後續的 onClick
                handleDirClick('N');
              }}
            />

            {/* ⬅️ 畫面左的按鈕 -> 對應 東 (E) */}
            <button 
              className={`dir-arrow btn-left ${errorBtn === 'E' ? 'shake-error' : ''}`} 
              onClick={(e) => {
                handleDirClick('E');
              }} 
              aria-label="東 (左方)"
              onTouchStart={(e) => {
                e.preventDefault(); // 💡 關鍵：強制阻斷後續的 onClick
                handleDirClick('E');
              }}
            />

            {/* ➡️ 畫面右的按鈕 -> 對應 西 (W) */}
            <button 
              className={`dir-arrow btn-right ${errorBtn === 'W' ? 'shake-error' : ''}`} 
              onClick={(e) => {
                handleDirClick('W');
              }} 
              aria-label="西 (畫面右方)"
              onTouchStart={(e) => {
                e.preventDefault(); // 💡 關鍵：強制阻斷後續的 onClick
                handleDirClick('W');
              }}
            />

            {showClueModal && (
              <div id="clue-modal">
                <div className="clue-modal-box">
                  <p>西 (W) 3</p>
                  <hr />
                  <p>北 (N) 1</p>
                  <hr />
                  <p>東 (E) 1</p>
                  <hr />
                  <p style={{ color: '#d8a85f', fontWeight: 'bold' }}>順序「北 → 西 → 東」</p>
                  <hr />
                  <p>🧭 提示：若想通往別的結局，最後一步或許有其他轉機...</p>
                  <button id="clue-close-btn" onClick={() => setShowClueModal(false)}>
                    確定
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}