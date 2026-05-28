'use client';

import { useState } from 'react';
import CompassGame from '@/components/CompassGame';
import DiaryGame from '@/components/DiaryGame';
import LetterGame from '@/components/LetterGame';
import FoodGame from '@/components/FoodGame';
import LockGame from '@/components/LockGame';
import EndGame from '@/components/EndGame';

type LevelId = 'compass' | 'diary' | 'letter' | 'food' | 'lock' | 'end' | null;
type PuzzleLevelId = Exclude<LevelId, 'end' | null>;

const REQUIRED_LEVELS: PuzzleLevelId[] = ['compass', 'diary', 'letter', 'food', 'lock'];

export default function Home() {
  const [currentScene, setCurrentScene] = useState<'start' | 'intro' | 'main'>('start');
  const [activeLevel, setActiveLevel] = useState<LevelId>(null);
  const [completedLevels, setCompletedLevels] = useState<PuzzleLevelId[]>([]);

  const handleLevelClose = (level: PuzzleLevelId, completed?: boolean) => {
    if (!completed) {
      setActiveLevel(null);
      return;
    }

    setCompletedLevels(prev => {
      const next = prev.includes(level) ? prev : [...prev, level];
      const allLevelsCompleted = REQUIRED_LEVELS.every(requiredLevel => next.includes(requiredLevel));

      setActiveLevel(allLevelsCompleted ? 'end' : null);
      return next;
    });
  };

  return (
    <main className="game-container">
      {currentScene === 'start' && (
        <section id="scene-start" className="scene" style={{ display: 'block' }}>
          <div id="hitbox-start" className="hitbox" title="開始遊戲" onClick={() => setCurrentScene('intro')} />
        </section>
      )}

      {currentScene === 'intro' && (
        <section id="scene-intro" className="scene" style={{ display: 'block' }}>
          <div id="hitbox-intro" className="hitbox" title="進入船艙" onClick={() => setCurrentScene('main')} />
        </section>
      )}

      {currentScene === 'main' && (
        <section id="scene-main" className="scene" style={{ display: 'block' }}>
          <div className="item-hitbox" data-id="compass" title="羅盤" onClick={() => setActiveLevel('compass')} />
          <div className="item-hitbox" data-id="diary" title="航海日誌" onClick={() => setActiveLevel('diary')} />
          <div className="item-hitbox" data-id="letter" title="羊皮紙" onClick={() => setActiveLevel('letter')} />
          <div className="item-hitbox" data-id="food" title="食物" onClick={() => setActiveLevel('food')} />
          <div className="item-hitbox" data-id="lock" title="鎖" onClick={() => setActiveLevel('lock')} />
          {/* 開發用：直接前往 EndGame（方便測試） */}
          <button id="dev-end-btn" style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 999 }} onClick={() => setActiveLevel('end')}>DEV: End</button>
        </section>
      )}

      {activeLevel !== null && (
        <div id="level-overlay">
          {activeLevel === 'compass' && <CompassGame onSuccess={(done?: boolean) => handleLevelClose('compass', done)} />}
          {activeLevel === 'diary' && <DiaryGame onSuccess={(done?: boolean) => handleLevelClose('diary', done)} />}
          {activeLevel === 'letter' && <LetterGame onSuccess={(done?: boolean) => handleLevelClose('letter', done)} />}
          {activeLevel === 'food' && <FoodGame onSuccess={(done?: boolean) => handleLevelClose('food', done)} />}
          {activeLevel === 'lock' && <LockGame onSuccess={(done?: boolean) => handleLevelClose('lock', done)} />}
          {activeLevel === 'end' && (
            <EndGame onSuccess={() => {
              // reset game after ending: clear progress and return to main scene
              setCompletedLevels([]);
              setActiveLevel(null);
              setCurrentScene('start');
            }} />
          )}
        </div>
      )}
    </main>
  );
}
