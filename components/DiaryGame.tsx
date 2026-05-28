'use client';

import { useEffect, useState } from 'react';
import { DndContext, useDraggable, useDroppable, pointerWithin, DragEndEvent } from '@dnd-kit/core';

interface DiaryGameProps {
  onSuccess: (completed?: boolean) => void;
}

interface DraggableItemProps {
  id: string;
  src: string;
  alt: string;
  className?: string;
}

interface DroppableHitboxProps {
  id: string;
  className?: string;
}

function DraggableItem({ id, src, alt, className }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <img
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      src={src}
      alt={alt}
      width={400}
      height={289}
      className={`${className ?? ''} cursor-grab active:cursor-grabbing hover:scale-105 transition-transform touch-none`}
    />
  );
}

function DroppableHitbox({ id, className }: DroppableHitboxProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ backgroundColor: isOver ? 'rgba(255, 255, 255, 0.4)' : 'transparent' }}
      className={`absolute z-20 rounded-md border-2 border-dashed border-white/50 transition-colors ${className ?? ''}`}
    />
  );
}

const PIECES = [
  { id: 'dairy01', src: '/dairy01.png' },
  { id: 'dairy02', src: '/dairy02.png' },
  { id: 'dairy03', src: '/dairy03.png' },
];

const DIALOG = {
  title: '迷航日誌',
  p1: '航海日誌部分頁面被撕毀。',
  p2: '也許某幾頁記錄了關鍵的資訊……',
  p3: '試著把撕毀的頁面拼湊看看。',
  p4: '桌上散落著被撕毀的紙頁，將紙拼回去即可找到線索。',
  btn: '開始',
};

const BG = "min-h-screen w-full bg-[url('/4.png')] bg-cover bg-center bg-no-repeat overflow-hidden";
const OVERLAY = 'relative flex min-h-screen w-full items-center justify-center bg-black/45 px-4 py-6';
const CARD = 'max-w-md w-full rounded-2xl bg-black/70 border border-white/20 p-8 text-white text-center space-y-4';
const BTN = 'mt-4 rounded-lg bg-white/10 border border-white/30 px-6 py-2 text-white hover:bg-white/20 transition-colors';
const BACK_BTN = 'absolute top-4 left-4 z-30 text-sm text-white/60 hover:text-white transition-colors';

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
      setDroppedItems((prev) => [...prev, String(active.id)]);
    }
  };

  if (!isMounted) return <div className={BG}><div className={OVERLAY} /></div>;

  if (gameState === 'intro') {
    return (
      <div className={BG}>
        <div className={OVERLAY}>
          <div className={CARD}>
            <button className="absolute top-4 left-4 text-sm text-white/60 hover:text-white transition-colors" onClick={() => onSuccess(false)}>
              ← 返回
            </button>
            <h2 className="text-2xl font-bold tracking-widest">{DIALOG.title}</h2>
            <p className="text-white/80">{DIALOG.p1}</p>
            <p className="text-white/80">{DIALOG.p2}</p>
            <p className="text-white/80">{DIALOG.p3}</p>
            <p className="text-white/60 text-sm">{DIALOG.p4}</p>
            <button className={BTN} onClick={() => setGameState('playing')}>{DIALOG.btn}</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'win') {
    return (
      <div className={BG}>
        <div className={OVERLAY}>
          <div className={CARD}>
            <h2 className="text-2xl font-bold tracking-widest">日誌還原完成</h2>
            <p className="text-white/80">你成功拼湊了撕毀的頁面，找到了關鍵線索。</p>
            <button className={BTN} onClick={() => onSuccess(true)}>返回船艙</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={BG}>
      <DndContext collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
        <div className={OVERLAY}>
          <button className={BACK_BTN} onClick={() => onSuccess(false)}>← 返回</button>
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-4 lg:flex-row lg:items-center lg:gap-6">

            {/* 左側：dairy01 */}
            <div className="flex w-full min-h-[200px] max-w-[340px] items-center justify-center sm:max-w-[380px] lg:max-w-[340px]">
              {!droppedItems.includes('dairy01') && (
                <DraggableItem id="dairy01" src="/dairy01.png" alt="dairy01" className="h-auto w-full max-w-[340px] shrink-0 object-contain" />
              )}
            </div>

            {/* 中間：目標區域 */}
            <div className="relative flex w-full max-w-[340px] shrink-0 items-center justify-center sm:max-w-[380px] lg:max-w-[340px]">
              <img src="/dairy.png" alt="dairy base" width={400} height={289} className="h-auto w-full object-contain" />
              {/* 開發用感應框，位置確認後可移除 border-2 border-dashed border-white/50 */}
              <DroppableHitbox id="target-dairy01" className="bottom-[16%] left-[24%] w-12 h-12 sm:w-16 sm:h-16" />
              <DroppableHitbox id="target-dairy02" className="top-[24%] right-[24%] w-12 h-12 sm:w-16 sm:h-16" />
              <DroppableHitbox id="target-dairy03" className="top-[16%] left-[24%] w-12 h-12 sm:w-16 sm:h-16" />
              {PIECES.map((piece) =>
                droppedItems.includes(piece.id) ? (
                  <img
                    key={piece.id}
                    src={piece.src}
                    alt={piece.id}
                    className="absolute inset-0 h-auto w-full object-contain pointer-events-none z-10"
                  />
                ) : null
              )}
            </div>

            {/* 右側：dairy02 & dairy03 */}
            <div className="flex w-full min-h-[400px] max-w-[340px] flex-col items-center justify-center gap-4 sm:max-w-[380px] lg:max-w-[340px]">
              {!droppedItems.includes('dairy02') && (
                <DraggableItem id="dairy02" src="/dairy02.png" alt="dairy02" className="h-auto w-full max-w-[340px] shrink-0 object-contain" />
              )}
              {!droppedItems.includes('dairy03') && (
                <DraggableItem id="dairy03" src="/dairy03.png" alt="dairy03" className="h-auto w-full max-w-[340px] shrink-0 object-contain" />
              )}
            </div>

          </div>
        </div>
      </DndContext>
    </div>
  );
}
