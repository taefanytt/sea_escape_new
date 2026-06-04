'use client';

import { useState, useEffect, useRef } from 'react';

interface CompassGameProps {
  onSuccess: (completed?: boolean) => void;
}

export default function CompassGame({ onSuccess }: CompassGameProps) {
  // 響應式縮放因子
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);

  // React 狀態控管
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'calibrating' | 'win'>('intro');
  const [dialogText, setDialogText] = useState({
    title: "破碎的偏航儀",
    p1: "羅盤碎片散落在外，指針無法運作...",
    p2: "請將碎片拉到一塊拼湊完整，點擊碎片可以調整角度。",
    btn: "開始"
  });
  const [dialogVisible, setDialogVisible] = useState(true);
  const rotationInitialized = useRef(false);

  // useRef 記憶遊戲中的常數與變數
  const compassWrapperRef = useRef<HTMLDivElement>(null);
  const compassFullRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  
  const isPuzzlePhaseDone = useRef(false);
  const compassFinalAngle = useRef(0);
  const piecesElements = useRef<HTMLDivElement[]>([]);

  // 初始化響應式縮放
  useEffect(() => {
    const calculateScale = () => {
      const vw = window.innerWidth;
      if (vw < 480) {
        setScale(0.5);
        scaleRef.current = 0.5;
      } else if (vw < 768) {
        setScale(0.65);
        scaleRef.current = 0.65;
      } else if (vw < 1024) {
        setScale(0.85);
        scaleRef.current = 0.85;
      } else {
        setScale(1);
        scaleRef.current = 1;
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  // 核心遊戲邏輯
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (piecesElements.current.length > 0) return;

    const piecesData = [
      { id: "n", elementId: "npiece", angle: 90 },
      { id: "w", elementId: "wpiece", angle: 180 },
      { id: "s", elementId: "spiece", angle: 270 },
      { id: "e", elementId: "epiece", angle: 90 }
    ];

    // 💡 修正：CSS 使用 transform 縮放，內部的邏輯坐標依然是 100% 原始大小，故不乘 scale
    const baseRange = 130; 
    const scaledPieceSize = 400; 

    piecesData.forEach(p => {
      const piece = document.getElementById(p.elementId) as HTMLDivElement;
      if (!piece) return;

      (piece as any).currentX = Math.random() * baseRange * 2 - baseRange;
      (piece as any).currentY = Math.random() * baseRange * 2 - baseRange;
      (piece as any).currentAngle = p.angle;

      updatePieceStyle(piece);
      piecesElements.current.push(piece);

      let clickStartX = 0;
      let clickStartY = 0;
      let isMouseDown = false;

      const handleStart = (e: MouseEvent | TouchEvent) => {
        if (isPuzzlePhaseDone.current) return;
        isMouseDown = true;

        const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0]?.clientX || 0;
        const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0]?.clientY || 0;

        piece.style.zIndex = "1000";
        clickStartX = clientX;
        clickStartY = clientY;

        // 紀錄點擊當下，手指位置與碎片原本邏輯位置的基準線
        const startX = clientX;
        const startY = clientY;
        const origX = (piece as any).currentX;
        const origY = (piece as any).currentY;

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
          if (!isMouseDown) return;
          const moveX = moveEvent instanceof MouseEvent ? moveEvent.clientX : moveEvent.touches[0]?.clientX || 0;
          const moveY = moveEvent instanceof MouseEvent ? moveEvent.clientY : moveEvent.touches[0]?.clientY || 0;

          // 💡 關鍵修正：手指在螢幕上移動的實際 px，必須除以縮放因子，轉換回 800x800 箱子裡的邏輯 px，手感才不會變慢
          const currentScale = scaleRef.current || 1;
          (piece as any).currentX = origX + (moveX - startX) / currentScale;
          (piece as any).currentY = origY + (moveY - startY) / currentScale;
          
          updatePieceStyle(piece);
        };

        const handleEnd = (upEvent: MouseEvent | TouchEvent) => {
          isMouseDown = false;
          piece.style.zIndex = "";
          document.removeEventListener("mousemove", handleMove);
          document.removeEventListener("touchmove", handleMove);
          document.removeEventListener("mouseup", handleEnd);
          document.removeEventListener("touchend", handleEnd);

          const upX = upEvent instanceof MouseEvent ? upEvent.clientX : (upEvent as TouchEvent).changedTouches[0]?.clientX || clickStartX;
          const upY = upEvent instanceof MouseEvent ? upEvent.clientY : (upEvent as TouchEvent).changedTouches[0]?.clientY || clickStartY;

          const moveDistance = Math.sqrt(
            Math.pow(upX - clickStartX, 2) + 
            Math.pow(upY - clickStartY, 2)
          );

          if (moveDistance < 5) {
            (piece as any).currentAngle = ((piece as any).currentAngle + 90) % 360;
            updatePieceStyle(piece);
          }

          checkWinCondition();
        };

        document.addEventListener("mousemove", handleMove);
        document.addEventListener("touchmove", handleMove, { passive: false });
        document.addEventListener("mouseup", handleEnd);
        document.addEventListener("touchend", handleEnd);
      };

      piece.addEventListener("mousedown", handleStart);
      piece.addEventListener("touchstart", handleStart);
    });

    function updatePieceStyle(piece: HTMLDivElement) {
      piece.style.left = `calc(50% + ${(piece as any).currentX}px)`;
      piece.style.top = `calc(50% + ${(piece as any).currentY}px)`;
      piece.style.transform = `translate(-50%, -50%) rotate(${(piece as any).currentAngle}deg)`;
    }

    function checkWinCondition() {
      if (isPuzzlePhaseDone.current) return;
    
      const n = piecesElements.current.find(p => p.id === "npiece");
      const e = piecesElements.current.find(p => p.id === "epiece");
      const s = piecesElements.current.find(p => p.id === "spiece");
      const w = piecesElements.current.find(p => p.id === "wpiece");
    
      if (!n || !e || !s || !w) return;
    
      const allX = [(n as any).currentX, (e as any).currentX, (s as any).currentX, (w as any).currentX];
      const allY = [(n as any).currentY, (e as any).currentY, (s as any).currentY, (w as any).currentY];
    
      const deltaX = Math.max(...allX) - Math.min(...allX);
      const deltaY = Math.max(...allY) - Math.min(...allY);
    
      // 💡 修正：移除 * scaleRef.current，使手機版能正常判定過關
      const tolerance = 30; 
      const baseMin = 255;  
      const baseMax = 315;  
    
      const positionsMatch = deltaX >= baseMin - tolerance && deltaX <= baseMax + tolerance && 
                             deltaY >= baseMin - tolerance && deltaY <= baseMax + tolerance;
      const anglesMatch = 
        ((n as any).currentAngle - (e as any).currentAngle) % 360 === 0 && 
        ((n as any).currentAngle - (s as any).currentAngle) % 360 === 0 && 
        ((n as any).currentAngle - (w as any).currentAngle) % 360 === 0;
    
      if (positionsMatch && anglesMatch) {
        isPuzzlePhaseDone.current = true;
        compassFinalAngle.current = (n as any).currentAngle;
    
        piecesElements.current.forEach(p => p.style.display = "none");
    
        setDialogText({
          title: "偏航儀盤面已復原！",
          p1: "請用滑鼠按住羅盤旋轉，將【北方 N】對準【上方指針】以完成校準。",
          p2: "",
          btn: "知道了"
        });
        setDialogVisible(true);
        setGameState('calibrating');
      }
    }
  }, [gameState, scale]);

  const initCompassRotation = () => {
    const compassFull = compassFullRef.current;
    if (!compassFull) return;

    compassFull.style.cursor = "grab";

    const handleRotationStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      compassFull.style.cursor = "grabbing";

      const rect = compassFull.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0]?.clientX || 0;
      const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0]?.clientY || 0;

      const startAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
      const baseAngle = compassFinalAngle.current;

      let isRotating = true;

      const handleRotationMove = (moveEvent: MouseEvent | TouchEvent) => {
        if (!isRotating) return;

        const moveX = moveEvent instanceof MouseEvent ? moveEvent.clientX : moveEvent.touches[0]?.clientX || 0;
        const moveY = moveEvent instanceof MouseEvent ? moveEvent.clientY : moveEvent.touches[0]?.clientY || 0;

        const currentAngle = Math.atan2(moveY - centerY, moveX - centerX) * (180 / Math.PI);
        const angleDiff = currentAngle - startAngle;
        compassFinalAngle.current = (baseAngle + angleDiff) % 360;

        // 💡 修正：旋轉時也必須手動加上當前 scale 比例，否則手機版大羅盤會瞬間變大
        const currentScale = scaleRef.current || 1;
        compassFull.style.transform = `translate(-50%, -50%) scale(${currentScale}) rotate(${compassFinalAngle.current}deg)`;
      };

      const handleRotationEnd = () => {
        isRotating = false;
        compassFull.style.cursor = "grab";
        document.removeEventListener("mousemove", handleRotationMove);
        document.removeEventListener("touchmove", handleRotationMove);
        document.removeEventListener("mouseup", handleRotationEnd);
        document.removeEventListener("touchend", handleRotationEnd);

        checkFinalWinCondition();
      };

      document.addEventListener("mousemove", handleRotationMove);
      document.addEventListener("touchmove", handleRotationMove, { passive: false });
      document.addEventListener("mouseup", handleRotationEnd);
      document.addEventListener("touchend", handleRotationEnd);
    };

    if (rotationInitialized.current) return;
    rotationInitialized.current = true;
    compassFull.addEventListener("mousedown", handleRotationStart);
    compassFull.addEventListener("touchstart", handleRotationStart);
  };

  const checkFinalWinCondition = () => {
    let normalizedAngle = (compassFinalAngle.current % 360 + 360) % 360;

    if (normalizedAngle <= 8 || normalizedAngle >= 352) {
      const currentScale = scaleRef.current || 1;

      if (compassFullRef.current) {
        // 💡 修正：維持當前 scale
        compassFullRef.current.style.transform = `translate(-50%, -50%) scale(${currentScale}) rotate(0deg)`;
        compassFullRef.current.style.pointerEvents = "none";
      }

      setTimeout(() => {
        if (pointerRef.current) {
          // 💡 修正：指針轉向時，將當前的 scale 補上，避免巨大化飛走
          pointerRef.current.style.transform = `translate(-50%, -50%) scale(${currentScale}) rotate(270deg)`;
        }

        setTimeout(() => {
          setDialogText({
            title: "",
            p1: "羅盤的指針停留在西方——",
            p2: "得到線索：「向西轉三次」",
            btn: "確定"
          });
          setDialogVisible(true);
          setGameState('win');
        }, 1000);
      }, 500);
    }
  };

  const handleBtnClick = () => {
    if (dialogText.btn === "開始") {
      setDialogVisible(false);
      setGameState('playing');
    } else if (dialogText.btn === "知道了") {
      setDialogVisible(false);
      
      const currentScale = scaleRef.current || 1;

      if (compassFullRef.current) {
        compassFullRef.current.style.display = "block";
        // 💡 修正：大羅盤顯現時鎖定 scale
        compassFullRef.current.style.transform = `translate(-50%, -50%) scale(${currentScale}) rotate(${compassFinalAngle.current}deg)`;
      }
      if (pointerRef.current) {
        // 💡 修正：指針顯現時鎖定 scale，解決手機版看不到指針的問題
        pointerRef.current.style.transform = `translate(-50%, -50%) scale(${currentScale}) rotate(0deg)`;
        pointerRef.current.style.opacity = "1";
      }
      initCompassRotation();
    } else if (dialogText.btn === "確定") {
      onSuccess(true);
    }
  };

  return (
    <div 
      id="compass-container" 
      style={{ '--scale': scale } as React.CSSProperties}
    >
      <button id="compass-back-btn" onClick={() => onSuccess(false)} title="返回船艙" />

      {/* 💡 已完全移除內聯 style 屬性，交給 CSS className 來控管置中與縮放 */}
      {dialogVisible && (gameState === 'intro' || gameState === 'calibrating' || gameState === 'win') && (
        <div
          id="dialogbox"
          className={gameState === 'win' ? 'compass-clue-dialogbox' : undefined}
        >
          <div id="dialog_content">
            {dialogText.title && <h2>{dialogText.title}</h2>}
            <p>{dialogText.p1}</p>
            {dialogText.p2 && <p>{dialogText.p2}</p>}
          </div>
          <button
            id="startbutton"
            className={gameState === 'win' ? 'compass-clue-confirm-btn' : undefined}
            onClick={handleBtnClick}
          >
            {dialogText.btn}
          </button>
        </div>
      )}

      <div 
        id="compass-wrapper" 
        ref={compassWrapperRef}
        style={{ display: gameState !== 'intro' ? 'block' : 'none' }}
      >
        <div id="compass-full" ref={compassFullRef} style={{ display: 'none' }} />

        {!isPuzzlePhaseDone.current && (
          <>
            <div className="puzzle-piece" id="npiece" />
            <div className="puzzle-piece" id="wpiece" />
            <div className="puzzle-piece" id="spiece" />
            <div className="puzzle-piece" id="epiece" />
          </>
        )}

        <div id="pointer" ref={pointerRef} style={{ opacity: 0 }} />
      </div>
    </div>
  );
}