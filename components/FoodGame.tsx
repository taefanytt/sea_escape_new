'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface FoodGameProps {
  onSuccess: (completed?: boolean) => void;
}

type FoodPageState = 'introOne' | 'introTwo' | 'playing' | 'success' | 'fail';
type SupplyKind = 'bottle' | 'bag' | 'coin';

interface FallingSupply {
  id: number;
  kind: SupplyKind;
  x: number;
  y: number;
  size: number;
  speed: number;
}

const GAME_SECONDS = 30;
const PASSING_SCORE = 200;
const ASSET_ROOT = '/assets';

const supplyImages: Record<SupplyKind, string> = {
  bottle: `${ASSET_ROOT}/bottle.png`,
  bag: `${ASSET_ROOT}/bag.png`,
  coin: `${ASSET_ROOT}/coin.png`,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function FoodGame({ onSuccess }: FoodGameProps) {
  const [pageState, setPageState] = useState<FoodPageState>('introOne');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [basketX, setBasketX] = useState(0);
  const [supplies, setSupplies] = useState<FallingSupply[]>([]);

  const stageRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const suppliesRef = useRef<FallingSupply[]>([]);
  const scoreRef = useRef(0);
  const nextSupplyIdRef = useRef(1);
  const basketXRef = useRef(0);
  const basketTargetXRef = useRef(0);
  const controlSpeedRef = useRef(1);
  const hasFinishedRef = useRef(false);

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const finishGame = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    stopAnimation();
    setSupplies([]);
    suppliesRef.current = [];
    setPageState(scoreRef.current >= PASSING_SCORE ? 'success' : 'fail');
  }, [stopAnimation]);

  const syncPointerTarget = useCallback((clientX: number) => {
    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    basketTargetXRef.current = clamp(clientX - rect.left, 42, rect.width - 42);
  }, []);

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    syncPointerTarget(event.clientX);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    syncPointerTarget(touch.clientX);
  };

  const createSupply = (stageWidth: number, elapsedSeconds: number): FallingSupply => {
    const roll = Math.random();
    const kind: SupplyKind = roll < 0.34 ? 'bottle' : roll < 0.68 ? 'bag' : 'coin';
    const sizeMultiplier: Record<SupplyKind, number> = {
      bottle: 0.95,
      bag: 1.08,
      coin: 0.82,
    };
    const speedRange: Record<SupplyKind, { min: number; max: number }> = {
      bottle: { min: 185, max: 275 },
      bag: { min: 145, max: 220 },
      coin: { min: 215, max: 315 },
    };
    const speedSetting = speedRange[kind];
    const size = clamp(stageWidth * 0.075 * sizeMultiplier[kind], 38, 92);
    const speed = (speedSetting.min + Math.random() * (speedSetting.max - speedSetting.min)) * (1 + elapsedSeconds / 70);

    return {
      id: nextSupplyIdRef.current++,
      kind,
      x: Math.random() * Math.max(stageWidth - size, 1) + size / 2,
      y: -size,
      size,
      speed,
    };
  };

  const beginGame = useCallback(() => {
    stopAnimation();

    const width = stageRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    const startX = width / 2;

    scoreRef.current = 0;
    suppliesRef.current = [];
    basketXRef.current = startX;
    basketTargetXRef.current = startX;
    controlSpeedRef.current = 1;
    hasFinishedRef.current = false;
    nextSupplyIdRef.current = 1;

    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setBasketX(startX);
    setSupplies([]);
    setPageState('playing');
  }, [stopAnimation]);

  useEffect(() => {
    if (pageState !== 'playing') {
      stopAnimation();
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    const startedAt = performance.now();
    let lastFrameAt = startedAt;
    let nextSpawnAt = startedAt;

    const tick = (now: number) => {
      const rect = stage.getBoundingClientRect();
      const deltaSeconds = Math.min((now - lastFrameAt) / 1000, 0.05);
      const elapsedSeconds = (now - startedAt) / 1000;
      lastFrameAt = now;

      if (elapsedSeconds >= GAME_SECONDS) {
        setTimeLeft(0);
        finishGame();
        return;
      }

      const nextTimeLeft = Math.max(0, Math.ceil(GAME_SECONDS - elapsedSeconds));
      setTimeLeft(current => (current === nextTimeLeft ? current : nextTimeLeft));

      const basketWidth = clamp(rect.width * 0.18, 92, 168);
      const basketHeight = basketWidth * 0.62;
      const basketTop = rect.height - basketHeight - 24;
      const targetX = clamp(basketTargetXRef.current || rect.width / 2, basketWidth / 2, rect.width - basketWidth / 2);
      const maxStep = 1650 * controlSpeedRef.current * deltaSeconds;
      basketXRef.current += clamp(targetX - basketXRef.current, -maxStep, maxStep);
      basketXRef.current = clamp(basketXRef.current, basketWidth / 2, rect.width - basketWidth / 2);
      setBasketX(basketXRef.current);

      if (now >= nextSpawnAt) {
        suppliesRef.current = [...suppliesRef.current, createSupply(rect.width, elapsedSeconds)];
        const fasterInterval = clamp(820 - elapsedSeconds * 6, 410, 820);
        nextSpawnAt = now + fasterInterval + Math.random() * 240;
      }

      const basketLeft = basketXRef.current - basketWidth / 2;
      const basketRight = basketXRef.current + basketWidth / 2;
      const basketBottom = basketTop + basketHeight;
      let scoreDelta = 0;

      const remainingSupplies: FallingSupply[] = [];
      for (const supply of suppliesRef.current) {
        const movedSupply = {
          ...supply,
          y: supply.y + supply.speed * deltaSeconds,
        };

        const supplyLeft = movedSupply.x - movedSupply.size / 2;
        const supplyRight = movedSupply.x + movedSupply.size / 2;
        const supplyTop = movedSupply.y;
        const supplyBottom = movedSupply.y + movedSupply.size;
        const isCaught =
          supplyBottom >= basketTop + basketHeight * 0.18 &&
          supplyTop <= basketBottom &&
          supplyRight >= basketLeft &&
          supplyLeft <= basketRight;

        if (isCaught) {
          if (movedSupply.kind === 'coin') {
            scoreDelta += 50;
            controlSpeedRef.current *= 0.9;
          } else {
            scoreDelta += 10;
          }
          continue;
        }

        if (movedSupply.y <= rect.height + movedSupply.size) {
          remainingSupplies.push(movedSupply);
        }
      }

      if (scoreDelta > 0) {
        scoreRef.current += scoreDelta;
        setScore(scoreRef.current);
      }

      suppliesRef.current = remainingSupplies;
      setSupplies(remainingSupplies);
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return stopAnimation;
  }, [finishGame, pageState, stopAnimation]);

  useEffect(() => stopAnimation, [stopAnimation]);

  if (pageState === 'introOne') {
    return (
      <section className="food-fullscreen food-story food-story-one">
        <div className="food-image-plane">
          <button className="food-click-target food-back-hitbox" onClick={() => onSuccess(false)} aria-label="返回船艙" />
          <button className="food-click-target food-next-hitbox" onClick={() => setPageState('introTwo')} aria-label="下一頁" />
        </div>
      </section>
    );
  }

  if (pageState === 'introTwo') {
    return (
      <section className="food-fullscreen food-story food-story-two">
        <div className="food-image-plane">
          <button className="food-click-target food-back-hitbox" onClick={() => onSuccess(false)} aria-label="返回船艙" />
          <button className="food-click-target food-start-hitbox" onClick={() => beginGame()} aria-label="開始" />
        </div>
      </section>
    );
  }

  if (pageState === 'success' || pageState === 'fail') {
    const isSuccess = pageState === 'success';

    return (
      <section className={`food-fullscreen food-result ${isSuccess ? 'food-result-success' : 'food-result-fail'}`}>
        <div className="food-image-plane">
          <div className="food-result-score">得分 {score}</div>
          {isSuccess ? (
            <button className="food-click-target food-confirm-hitbox" onClick={() => onSuccess(true)} aria-label="確定" />
          ) : (
            <button className="food-click-target food-retry-hitbox" onClick={() => beginGame()} aria-label="再玩一次" />
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={stageRef}
      className="food-fullscreen food-play-stage"
      onMouseMove={handlePointerMove}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchMove}
    >
      <div className="food-image-plane food-stage-hitboxes">
        <button className="food-click-target food-back-hitbox" onClick={() => onSuccess(false)} aria-label="返回船艙" />
      </div>
      <div className="food-hud" aria-live="polite">
        <span>分數 {score}</span>
        <span>時間 {timeLeft}</span>
      </div>
      {supplies.map(supply => (
        <img
          key={supply.id}
          className="food-supply"
          src={supplyImages[supply.kind]}
          alt=""
          draggable={false}
          style={{
            width: supply.size,
            height: supply.size,
            transform: `translate(${supply.x - supply.size / 2}px, ${supply.y}px)`,
          }}
        />
      ))}
      <img
        className="food-basket"
        src={`${ASSET_ROOT}/basket.png`}
        alt="籃子"
        draggable={false}
        style={{ transform: `translateX(${basketX}px) translateX(-50%)` }}
      />
    </section>
  );
}
