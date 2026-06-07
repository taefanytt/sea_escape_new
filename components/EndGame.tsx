'use client';
import React, { useState, useEffect } from 'react';
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

  const correctSequence = ['N', 'W', 'W', 'W', 'E'];
  const badSequence = ['N', 'W', 'W', 'W', 'E', 'E', 'E'];

  // 💡 監聽螢幕寬度來動態更新縮放因子（與羅盤關完全一致）
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

  useEffect(() => {
    if (stage === 'ending') {
      onEndingResult?.('good');
    }

    if (stage === 'fail') {
      onEndingResult?.('bad');
    }
  }, [onEndingResult, stage]);

  const handleDirClick = (dir: string) => {
    if (stage !== 'playing' || locked) return;

    const nextInput = [...playerInput, dir];
    const isBadPrefix = nextInput.every((val, idx) => val === badSequence[idx]);
    const isCorrectPrefix = nextInput.every((val, idx) => val === correctSequence[idx]);

    if (!isBadPrefix && !isCorrectPrefix) {
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

    if (isBadPrefix && nextInput.length === badSequence.length) {
      setLocked(true);
      setTimeout(() => setStage('fail'), 300);
      return;
    }

    if (isCorrectPrefix && nextInput.length === correctSequence.length) {
      setTimeout(() => {
        setLocked((prev) => {
          if (!prev) {
            setStage('ending');
          }
          return true;
        });
      }, 800);
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
      style={{ '--scale': scale } as React.CSSProperties} /* 💡 把縮放因子傳給 CSS */
    >
      <Image
        className={stage === 'ending' || stage === 'fail' ? 'ending-bg-image' : ''}
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

      {/* 💡 恢復乾淨結構：直接在層級下控制 stage 狀態 */}
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
              onClick={onSuccess} 
              aria-label="重新開始"
            />
          )}
        </div>
      )}

      {stage === 'playing' && (
        <div id="dir-game-stage">
          <button 
            id="clue-toggle-btn" 
            onClick={() => setShowClueModal(true)} 
            aria-label="查看線索" 
          />

          <div id="dir-center-compass"></div>

          <button 
            className={`dir-arrow btn-up ${errorBtn === 'S' ? 'shake-error' : ''}`} 
            onClick={() => handleDirClick('S')} 
            aria-label="南"
            onTouchStart={(e) => {
              e.preventDefault();
              handleDirClick('S');
            }}
          />
          <button 
            className={`dir-arrow btn-left ${errorBtn === 'E' ? 'shake-error' : ''}`} 
            onClick={() => handleDirClick('E')} 
            aria-label="東"
            onTouchStart={(e) => {
              e.preventDefault();
              handleDirClick('E');
            }}
          />
          <button 
            className={`dir-arrow btn-right ${errorBtn === 'W' ? 'shake-error' : ''}`} 
            onClick={() => handleDirClick('W')} 
            aria-label="西"
            onTouchStart={(e) => {
              e.preventDefault();
              handleDirClick('W');
            }}
          />
          <button 
            className={`dir-arrow btn-down ${errorBtn === 'N' ? 'shake-error' : ''}`} 
            onClick={() => handleDirClick('N')} 
            aria-label="北"
            onTouchStart={(e) => {
              e.preventDefault();
              handleDirClick('N');
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
  );
}
