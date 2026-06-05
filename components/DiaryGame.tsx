'use client';

import { useEffect, useState } from 'react';
import { DndContext, useDraggable, useDroppable, pointerWithin, DragEndEvent } from '@dnd-kit/core';

interface DiaryGameProps {
  onSuccess: (completed?: boolean) => void;
}

function DraggableItem({ id, src, alt, style }: {
  id: string; src: string; alt: string; style?: React.CSSProperties;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  return (
    <img
      ref={setNodeRef}
      style={{
        touchAction: 'none',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'transform 0.1s',
        ...style,
        ...(transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50, position: 'relative' } : {}),
      }}
      {...listeners}
      {...attributes}
      src={src}
      alt={alt}
    />
  );
}

function DroppableHitbox({ id, style }: { id: string; style?: React.CSSProperties }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} style={{ position: 'absolute', zIndex: 20, ...style }} />;
}

const PIECES = [
  { id: 'diary01', src: '/assets/diary/diary01.png' },
  { id: 'diary02', src: '/assets/diary/diary02.png' },
  { id: 'diary03', src: '/assets/diary/diary03.png' },
];

const CONTAINER: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  background: `#000 url('/assets/diary/4.png') no-repeat center center / cover`,
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export default function DiaryGame({ onSuccess }: DiaryGameProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'win'>('intro');
  const [droppedItems, setDroppedItems] = useState<string[]>([]);
  const [scale, setScale] = useState(1);
  const [introScale, setIntroScale] = useState(1);

  useEffect(() => {
    setIsMounted(true);

    const calculateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // 拼圖區
      const scaleByWidth = (vw * 0.95) / 1384;
      const scaleByHeight = (vh * 0.88) / 600;
      setScale(Math.min(scaleByWidth, scaleByHeight, 1));
      // intro 對話框（800×800）
      setIntroScale(Math.min((vw * 0.92) / 800, (vh * 0.92) / 800, 1));
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  useEffect(() => {
    if (droppedItems.length === PIECES.length) setGameState('win');
  }, [droppedItems]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id === `target-${active.id}` && !droppedItems.includes(String(active.id))) {
      setDroppedItems(prev => [...prev, String(active.id)]);
    }
  };

  return (
    <div style={CONTAINER}>
      {/* 半透明黑色遮罩 */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0 }} />
      {isMounted && gameState !== 'win' && (
        <button
          id="compass-back-btn"
          style={{ top: 'max(20px, 2vh)', left: 'max(20px, 2vw)', zIndex: 10 }}
          onClick={() => onSuccess(false)} 
          title="返回船艙"
          aria-label="返回"
        />
      )}

      {/* intro 對話框 */}
      {isMounted && gameState === 'intro' && (
        <div style={{
          width: `${Math.round(800 * introScale)}px`,
          height: `${Math.round(800 * introScale)}px`,
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}>
          <div id="dialogbox" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '800px',
            height: '800px',
            transform: `scale(${introScale})`,
            transformOrigin: 'top left',
          }}>
            <div id="dialog_content">
              <h2>迷航日誌</h2>
              <p>航海日誌部分頁面被撕毀。</p>
              <p>也許某幾頁記錄了關鍵的資訊……</p>
              <p>試著把撕毀的頁面拼湊看看。</p>
              <p>桌上散落著被撕毀的紙頁，將紙拼回去即可找到線索。</p>
            </div>
            <button id="startbutton" onClick={() => setGameState('playing')} aria-label="開始" />
          </div>
        </div>
      )}

      {/* win 畫面 */}
      {isMounted && gameState === 'win' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(8px, 2vh, 24px)',
          width: '100%',
          padding: `3vh ${window.innerWidth >= 768 ? 'clamp(2px, 28%, 420px)' : 'clamp(2px, 2%, 12px)'}`,
          boxSizing: 'border-box',
          zIndex: 2,
        }}>
          <img
            src="/assets/diary/diaryAll.png"
            alt="完整日誌"
            style={{
              width: `clamp(160px, 44vw, 560px)`,
              maxHeight: '52vh',
              objectFit: 'contain',
              userSelect: 'none',
            }}
          />
          <div style={{
            width: '100%',
            backgroundImage: "url('/assets/compass/StoryFrame.png')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            padding: 'clamp(8px, 2%, 20px) clamp(12px, 5%, 40px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <p style={{
              color: '#fff',
              fontSize: 'clamp(11px, 2vw, 18px)',
              lineHeight: 1.6,
              margin: 0,
              textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
            }}>
              翻開日誌，你看到前人的筆跡中隱隱透露恐懼與執念：<br />
              「我聽見風的低語...黃金的光芒吸引著我們，也迷惑著我們。」<br />
              你忽然明白，這些人並非貪財，而是被海域與詛咒的力量牽引。
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <p style={{
                color: '#fff',
                fontSize: 'clamp(11px, 2.2vw, 18px)',
                margin: 0,
                textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
              }}>
                得到線索：順序「北 → 西 → 東」
              </p>
              <img
                src="/assets/LockEndConBtn.png"
                alt="確定"
                style={{
                  width: 'clamp(48px, 8vw, 110px)',
                  height: 'auto',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  marginLeft: 'auto',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                onClick={() => onSuccess(true)}
                role="button"
              />
            </div>
          </div>
        </div>
      )}

      {/* playing 拼圖區 */}
      {isMounted && gameState === 'playing' && (
      <DndContext collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
        {window.innerWidth < 768 ? (
          /* ── 手機：三欄，碎片在左右，底圖居中 ── */
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: 1,
            justifyContent: 'center',
            width: '100vw',
            padding: '48px 2px 8px',
            boxSizing: 'border-box',
            gap: '2px',
          }}>
            {/* 左側碎片 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', width: '26vw', flexShrink: 0 }}>
              {!droppedItems.includes('diary01') && (
                <DraggableItem id="diary01" src="/assets/diary/diary01.png" alt="diary piece 1"
                  style={{ width: '100%', height: 'auto' }} />
              )}
              {!droppedItems.includes('diary03') && (
                <DraggableItem id="diary03" src="/assets/diary/diary03.png" alt="diary piece 3"
                  style={{ width: '100%', height: 'auto' }} />
              )}
            </div>

            {/* 中間底圖 */}
            <div style={{ width: '46vw', flexShrink: 0, position: 'relative' }}>
              <img
                src="/assets/diary/diary.png"
                alt="diary"
                style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }}
              />
              <DroppableHitbox id="target-diary01" style={{ top: '0%', left: '0%', width: '50%', height: '50%' }} />
              <DroppableHitbox id="target-diary02" style={{ top: '0%', right: '0%', width: '50%', height: '50%' }} />
              <DroppableHitbox id="target-diary03" style={{ bottom: '0%', left: '0%', width: '50%', height: '50%' }} />
              {PIECES.map(piece =>
                droppedItems.includes(piece.id) ? (
                  <img key={piece.id} src={piece.src} alt={piece.id} style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%', objectFit: 'fill',
                    pointerEvents: 'none', zIndex: 10,
                  }} />
                ) : null
              )}
            </div>

            {/* 右側碎片 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', width: '26vw', flexShrink: 0 }}>
              {!droppedItems.includes('diary02') && (
                <DraggableItem id="diary02" src="/assets/diary/diary02.png" alt="diary piece 2"
                  style={{ width: '100%', height: 'auto' }} />
              )}
            </div>
          </div>
        ) : (
          /* ── 桌機：原本三欄橫排 ── */
          <div style={{
            width: `${Math.round(1384 * scale)}px`,
            height: `${Math.round(620 * scale)}px`,
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: '1384px',
              display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: '2rem',
              transform: `scale(${scale})`, transformOrigin: 'top left',
            }}>
              <div style={{ width: '440px', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {!droppedItems.includes('diary01') ? (
                  <DraggableItem id="diary01" src="/assets/diary/diary01.png" alt="diary piece 1" style={{ width: '100%', height: 'auto' }} />
                ) : <div />}
              </div>
              <div style={{ width: '440px', flexShrink: 0, position: 'relative' }}>
                <img src="/assets/diary/diary.png" alt="diary"
                  style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }} />
                <DroppableHitbox id="target-diary01" style={{ top: '0%', left: '0%', width: '50%', height: '50%' }} />
                <DroppableHitbox id="target-diary02" style={{ top: '0%', right: '0%', width: '50%', height: '50%' }} />
                <DroppableHitbox id="target-diary03" style={{ bottom: '0%', left: '0%', width: '50%', height: '50%' }} />
                {PIECES.map(piece =>
                  droppedItems.includes(piece.id) ? (
                    <img key={piece.id} src={piece.src} alt={piece.id} style={{
                      position: 'absolute', top: 0, left: 0,
                      width: '100%', height: '100%', objectFit: 'fill',
                      pointerEvents: 'none', zIndex: 10,
                    }} />
                  ) : null
                )}
              </div>
              <div style={{ width: '440px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', justifyContent: 'center' }}>
                {!droppedItems.includes('diary02') && (
                  <DraggableItem id="diary02" src="/assets/diary/diary02.png" alt="diary piece 2" style={{ width: '100%', height: 'auto' }} />
                )}
                {!droppedItems.includes('diary03') && (
                  <DraggableItem id="diary03" src="/assets/diary/diary03.png" alt="diary piece 3" style={{ width: '100%', height: 'auto' }} />
                )}
              </div>
            </div>
          </div>
        )}
      </DndContext>
      )}

    </div>
  );
}
