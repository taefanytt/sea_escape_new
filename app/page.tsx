'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CompassGame from '@/components/CompassGame';
import DiaryGame from '@/components/DiaryGame';
import LetterGame from '@/components/LetterGame';
import FoodGame from '@/components/FoodGame';
import LockGame from '@/components/LockGame';
import EndGame from '@/components/EndGame';

type LevelId = 'compass' | 'diary' | 'letter' | 'food' | 'lock' | 'end' | null;
type PuzzleLevelId = Exclude<LevelId, 'end' | null>;
type MusicTrack = 'background' | 'good-ending' | 'bad-ending';

const REQUIRED_LEVELS: PuzzleLevelId[] = ['compass', 'diary', 'letter', 'food', 'lock'];
const MUSIC_SRC: Record<MusicTrack, string> = {
  background: '/assets/背景音樂.mp3',
  'good-ending': '/assets/好結局音樂.mp3',
  'bad-ending': '/assets/壞結局音樂.mp3',
};

export default function Home() {
  const [currentScene, setCurrentScene] = useState<'start' | 'intro' | 'main'>('start');
  const [activeLevel, setActiveLevel] = useState<LevelId>(null);
  const [, setCompletedLevels] = useState<PuzzleLevelId[]>([]);
  const [musicTrack, setMusicTrack] = useState<MusicTrack>('background');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTrack = useCallback((track: MusicTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextSrc = MUSIC_SRC[track];
    const shouldRestart = audio.src !== new URL(nextSrc, window.location.href).href;

    if (shouldRestart) {
      audio.pause();
      audio.src = nextSrc;
      audio.currentTime = 0;
    }

    audio.volume = 0.45;
    audio.loop = track === 'background';
    audio.play().catch(() => {
      // Browsers wait for a user gesture before allowing audio. The next click will retry.
    });
  }, []);

  useEffect(() => {
    playTrack(musicTrack);
  }, [musicTrack, playTrack]);

  useEffect(() => {
    const resumeMusic = () => playTrack(musicTrack);

    window.addEventListener('pointerdown', resumeMusic);
    window.addEventListener('keydown', resumeMusic);

    return () => {
      window.removeEventListener('pointerdown', resumeMusic);
      window.removeEventListener('keydown', resumeMusic);
    };
  }, [musicTrack, playTrack]);

  const startGame = () => {
    setMusicTrack('background');
    setCurrentScene('intro');
    playTrack('background');
  };

  const handleEndingResult = useCallback((result: 'good' | 'bad') => {
    setMusicTrack(result === 'good' ? 'good-ending' : 'bad-ending');
  }, []);

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
      <audio ref={audioRef} src={MUSIC_SRC[musicTrack]} loop preload="auto" />

      {currentScene === 'start' && (
        <section id="scene-start" className="scene" style={{ display: 'block' }}>
          <div 
            id="hitbox-start" 
            className="hitbox" 
            title="開始遊戲" 
            onClick={startGame} 
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                startGame();
              }
            }}
          />
        </section>
      )}

      {currentScene === 'intro' && (
        <section id="scene-intro" className="scene" style={{ display: 'block' }}>
          <div 
            id="hitbox-intro" 
            className="hitbox" 
            title="進入船艙" 
            onClick={() => setCurrentScene('main')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setCurrentScene('main');
              }
            }}
          />
        </section>
      )}

      {currentScene === 'main' && (
        <section id="scene-main" className="scene" style={{ display: 'block' }}>
          <div className="scene-inner">
            <div 
              className="item-hitbox" 
              data-id="compass" 
              title="羅盤" 
              onClick={() => setActiveLevel('compass')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveLevel('compass');
                }
              }}
            />
            <div 
              className="item-hitbox" 
              data-id="diary" 
              title="航海日誌" 
              onClick={() => setActiveLevel('diary')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveLevel('diary');
                }
              }}
            />
            <div 
              className="item-hitbox" 
              data-id="letter" 
              title="羊皮紙" 
              onClick={() => setActiveLevel('letter')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveLevel('letter');
                }
              }}
            />
            <div 
              className="item-hitbox" 
              data-id="food" 
              title="食物" 
              onClick={() => setActiveLevel('food')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveLevel('food');
                }
              }}
            />
            <div 
              className="item-hitbox" 
              data-id="lock" 
              title="鎖" 
              onClick={() => setActiveLevel('lock')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveLevel('lock');
                }
              }}
            />
          </div>
          {/* 開發用：直接前往 EndGame（方便測試） */}
          <button 
            id="dev-end-btn" 
            style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 999 }} 
            onClick={() => setActiveLevel('end')}
          >
            DEV: End
          </button>
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
              setMusicTrack('background');
              setCompletedLevels([]);
              setActiveLevel(null);
              setCurrentScene('start');
            }} onEndingResult={handleEndingResult} />
          )}
        </div>
      )}
    </main>
  );
}
