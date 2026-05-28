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
  backgroundColor: '#000',
  backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/assets/diary/4.png')`,
  backgroundSize: 'cover, auto 100vh',
  backgroundPosition: 'center, center',
  backgroundRepeat: 'no-repeat, no-repeat',
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

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (droppedItems.length === PIECES.length) setGameState('win');
  }, [droppedItems]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id === `target-${active.id}` && !droppedItems.includes(String(active.id))) {
      setDroppedItems(prev => [...prev, String(active.id)]);
    }
  };

  if (!isMounted) return <div style={CONTAINER} />;

  if (gameState === 'intro') {
    return (
      <div style={CONTAINER}>
          <button id="compass-back-btn" onClick={() => onSuccess(false)} title="返回船艙" />
        <div id="dialogbox" style={{ display: 'flex' }}>
          <div id="dialog_content">
            <h2>迷航日誌</h2>
            <p>航海日誌部分頁面被撕毀。</p>
            <p>也許某幾頁記錄了關鍵的資訊……</p>
            <p>試著把撕毀的頁面拼湊看看。</p>
            <p>桌上散落著被撕毀的紙頁，將紙拼回去即可找到線索。</p>
          </div>
          <button id="startbutton" onClick={() => setGameState('playing')} />
        </div>
      </div>
    );
  }

  if (gameState === 'win') {
    return (
      <div style={CONTAINER}>
          <img
          src="/assets/diary/diaryAll.png"
          alt="完整日誌"
          style={{
            position: 'absolute',
            top: '4%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '46%',
            maxWidth: '560px',
            maxHeight: '58vh',
            objectFit: 'contain',
            userSelect: 'none',
            zIndex: 2,
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: '3%',
          left: '15%',
          right: '15%',
          maxHeight: '32vh',
          overflow: 'hidden',
          backgroundImage: "url('/assets/compass/StoryFrame.png')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          padding: '2% 5%',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 3,
        }}>
          <p style={{
            color: '#fff',
            fontSize: 'clamp(13px, 1.6vw, 18px)',
            lineHeight: 1.75,
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
              fontSize: 'clamp(13px, 1.8vw, 18px)',
              margin: 0,
              textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
            }}>
              得到線索：順序「北 → 西 → 東」
            </p>
            <img
              src="/assets/LockEndConBtn.png"
              alt="確定"
              style={{ width: 'clamp(80px, 8vw, 110px)', cursor: 'pointer', transition: 'transform 0.2s', marginLeft: 'auto' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              onClick={() => onSuccess(true)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={CONTAINER}>
      <button id="compass-back-btn" onClick={() => onSuccess(false)} title="返回船艙" />
      <DndContext collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          width: '95vw',
          maxWidth: '1400px',
        }}>

          {/* 左側：diary01 */}
          <div style={{ width: '440px', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {!droppedItems.includes('diary01') ? (
              <DraggableItem
                id="diary01"
                src="/assets/diary/diary01.png"
                alt="diary piece 1"
                style={{ width: '100%', height: 'auto' }}
              />
            ) : <div />}
          </div>

          {/* 中間：日誌底圖 + 放置區 */}
          <div style={{ width: '440px', flexShrink: 0, position: 'relative' }}>
            <img
              src="/assets/diary/diary.png"
              alt="diary"
              style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }}
            />
            {/* 放置區覆蓋整張底圖，各佔一個象限 */}
            <DroppableHitbox id="target-diary01" style={{ top: '0%', left: '0%', width: '50%', height: '50%' }} />
            <DroppableHitbox id="target-diary02" style={{ top: '0%', right: '0%', width: '50%', height: '50%' }} />
            <DroppableHitbox id="target-diary03" style={{ bottom: '0%', left: '0%', width: '50%', height: '50%' }} />
            {PIECES.map(piece =>
              droppedItems.includes(piece.id) ? (
                <img
                  key={piece.id}
                  src={piece.src}
                  alt={piece.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'fill',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
              ) : null
            )}
          </div>

          {/* 右側：diary02 + diary03 */}
          <div style={{
            width: '440px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {!droppedItems.includes('diary02') && (
              <DraggableItem
                id="diary02"
                src="/assets/diary/diary02.png"
                alt="diary piece 2"
                style={{ width: '100%', height: 'auto' }}
              />
            )}
            {!droppedItems.includes('diary03') && (
              <DraggableItem
                id="diary03"
                src="/assets/diary/diary03.png"
                alt="diary piece 3"
                style={{ width: '100%', height: 'auto' }}
              />
            )}
          </div>

        </div>
      </DndContext>
    </div>
  );
}
