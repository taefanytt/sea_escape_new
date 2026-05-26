// components/CompassGame.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface CompassGameProps {
  onSuccess: (completed?: boolean) => void; // completed=true 表示通關
}

export default function CompassGame({ onSuccess }: CompassGameProps) {
  // --- 1. React 狀態控管 ---
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'calibrating' | 'win'>('intro');
  const [dialogText, setDialogText] = useState({
    title: "破碎的偏航儀",
    p1: "羅盤碎片散落在外，指針無法運作...",
    p2: "請將碎片拉到一塊拼湊完整，點擊碎片可以調整角度。",
    btn: "開始"
  });
  const [dialogVisible, setDialogVisible] = useState(true);
  const rotationInitialized = useRef(false);

  // --- 2. 使用 useRef 來記憶遊戲中的常數與變數 (防止 React 重複渲染時資料不見) ---
  const compassWrapperRef = useRef<HTMLDivElement>(null);
  const compassFullRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  
  // 核心控制變數
  const isPuzzlePhaseDone = useRef(false);
  const compassFinalAngle = useRef(0);
  const piecesElements = useRef<HTMLDivElement[]>([]);

  // ==========================================
  // 3. 核心解密邏輯 (組員寫的 JS 完美對接區)
  // ==========================================
  useEffect(() => {
    // 只有在開始遊戲（進入 playing 狀態）後，才去初始化碎片
    if (gameState !== 'playing') return;
    if (piecesElements.current.length > 0) return; // 防止重複初始化

    const piecesData = [
      { id: "n", elementId: "npiece", angle: 90 },
      { id: "w", elementId: "wpiece", angle: 180 },
      { id: "s", elementId: "spiece", angle: 270 },
      { id: "e", elementId: "epiece", angle: 90 }
    ];

    piecesData.forEach(p => {
      const piece = document.getElementById(p.elementId) as HTMLDivElement;
      if (!piece) return;

      // 隨機散落位置與初始設定
      (piece as any).currentX = Math.random() * 260 - 130;
      (piece as any).currentY = Math.random() * 260 - 130;
      (piece as any).currentAngle = p.angle;

      updatePieceStyle(piece);
      piecesElements.current.push(piece);

      let clickStartX = 0;
      let clickStartY = 0;

      // --- 拖曳與點擊整合邏輯 ---
      piece.addEventListener("mousedown", (e) => {
        if (isPuzzlePhaseDone.current) return;
        e.preventDefault();
        piece.style.zIndex = "1000";

        clickStartX = e.clientX;
        clickStartY = e.clientY;

        const startX = e.clientX - (piece as any).currentX;
        const startY = e.clientY - (piece as any).currentY;

        function onMouseMove(moveEvent: MouseEvent) {
          (piece as any).currentX = moveEvent.clientX - startX;
          (piece as any).currentY = moveEvent.clientY - startY;
          updatePieceStyle(piece);
        }

        function onMouseUp(upEvent: MouseEvent) {
          piece.style.zIndex = "";
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);

          const moveDistance = Math.sqrt(
            Math.pow(upEvent.clientX - clickStartX, 2) + 
            Math.pow(upEvent.clientY - clickStartY, 2)
          );

          if (moveDistance < 5) {
            // 純點擊 -> 旋轉 90 度
            (piece as any).currentAngle = ((piece as any).currentAngle + 90) % 360;
            updatePieceStyle(piece);
          }

          // 每次放開檢查是否通關
          checkWinCondition();
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    });

    function updatePieceStyle(piece: HTMLDivElement) {
      piece.style.left = `calc(50% + ${(piece as any).currentX}px)`;
      piece.style.top = `calc(50% + ${(piece as any).currentY}px)`;
      piece.style.transform = `translate(-50%, -50%) rotate(${(piece as any).currentAngle}deg)`;
    }

    // --- 第一階段：拼圖完成判定 ---
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

      const positionsMatch = deltaX >= 255 && deltaX <= 315 && deltaY >= 255 && deltaY <= 315;
      const anglesMatch = 
        ((n as any).currentAngle - (e as any).currentAngle) % 360 === 0 && 
        ((n as any).currentAngle - (s as any).currentAngle) % 360 === 0 && 
        ((n as any).currentAngle - (w as any).currentAngle) % 360 === 0;

      if (positionsMatch && anglesMatch) {
        isPuzzlePhaseDone.current = true;
        compassFinalAngle.current = (n as any).currentAngle;

        // 隱藏碎片
        piecesElements.current.forEach(p => p.style.display = "none");

        // 更新對話框文字，並切換至「校準中提示 (calibrating)」狀態
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
  }, [gameState]);

  // ==========================================
  // 4. 核心新增：第二階段 - 完整羅盤旋轉 (當按下了「知道了」之後觸發)
  // ==========================================
  const initCompassRotation = () => {
    const compassFull = compassFullRef.current;
    if (!compassFull) return;

    const compassElement = compassFull;
    compassElement.style.cursor = "grab";

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      compassElement.style.cursor = "grabbing";

      const rect = compassElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      const baseAngle = compassFinalAngle.current;

      function onMouseMove(moveEvent: MouseEvent) {
        const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
        const angleDiff = currentAngle - startAngle;
        compassFinalAngle.current = (baseAngle + angleDiff) % 360;

        compassElement.style.transform = `translate(-50%, -50%) rotate(${compassFinalAngle.current}deg)`;
      }

      function onMouseUp() {
        compassElement.style.cursor = "grab";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        // 每次轉完放開檢查是否最終通關
        checkFinalWinCondition();
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    if (rotationInitialized.current) return;
    rotationInitialized.current = true;
    compassFull.addEventListener("mousedown", handleMouseDown);
  };

  // --- 第二階段：最終校準檢查 ---
  const checkFinalWinCondition = () => {
    let normalizedAngle = (compassFinalAngle.current % 360 + 360) % 360;

    if (normalizedAngle <= 8 || normalizedAngle >= 352) {
      if (compassFullRef.current) {
        compassFullRef.current.style.transform = "translate(-50%, -50%) rotate(0deg)";
        compassFullRef.current.style.pointerEvents = "none";
      }

      // 指針平滑轉向西方 (270度)
      setTimeout(() => {
        if (pointerRef.current) {
          pointerRef.current.style.transform = "translate(-50%, -50%) rotate(270deg)";
        }

        setTimeout(() => {
          setDialogText({
            title: "羅盤的指針停留在西方——",
            p1: "得到線索：「向西轉三次」",
            p2: "",
            btn: "確定"
          });
          setDialogVisible(true);
          setGameState('win');
        }, 1000);
      }, 500);
    }
  };

  // --- 5. 按鈕點擊的分流控制器 ---
  const handleBtnClick = () => {
    if (dialogText.btn === "開始") {
      setDialogVisible(false);
      setGameState('playing');
    } else if (dialogText.btn === "知道了") {
      // 關閉說明對話框，正式開始讓玩家「手動旋轉羅盤」
      setDialogVisible(false);
      if (compassFullRef.current) {
        compassFullRef.current.style.display = "block";
        compassFullRef.current.style.transform = `translate(-50%, -50%) rotate(${compassFinalAngle.current}deg)`;
      }
      if (pointerRef.current) {
        pointerRef.current.style.transform = "translate(-50%, -50%) rotate(0deg)";
        pointerRef.current.style.opacity = "1";
      }
      // 啟動旋轉監聽
      initCompassRotation();
    } else if (dialogText.btn === "確定") {
      onSuccess(true); // 正式通關
    }
  };

  return (
    <div id="compass-container">
      {/* 💡 完美保留組員原本的返回功能：點擊直接回主船艙 */}
      <button id="compass-back-btn" onClick={() => onSuccess(false)} title="返回船艙" />

      {/* 對話框：利用 React 狀態控制顯示或隱藏 */}
      {dialogVisible && (gameState === 'intro' || gameState === 'calibrating' || gameState === 'win') && (
        <div id="dialogbox" style={{ display: 'flex' }}>
          <div id="dialog_content">
            <h2>{dialogText.title}</h2>
            <p>{dialogText.p1}</p>
            {dialogText.p2 && <p>{dialogText.p2}</p>}
          </div>
          <button id="startbutton" onClick={handleBtnClick}>
            {dialogText.btn}
          </button>
        </div>
      )}

      {/* 遊戲操作舞台 */}
      <div 
        id="compass-wrapper" 
        ref={compassWrapperRef}
        style={{ display: gameState !== 'intro' ? 'block' : 'none' }}
      >
        {/* 完整羅盤大圖 */}
        <div id="compass-full" ref={compassFullRef} style={{ display: 'none' }} />

        {/* 拼圖碎片 (只有在還沒進入校準階段時顯示) */}
        {!isPuzzlePhaseDone.current && (
          <>
            <div className="puzzle-piece" id="npiece" />
            <div className="puzzle-piece" id="wpiece" />
            <div className="puzzle-piece" id="spiece" />
            <div className="puzzle-piece" id="epiece" />
          </>
        )}

        {/* 羅盤指針 */}
        <div id="pointer" ref={pointerRef} style={{ opacity: 0 }} />
      </div>
    </div>
  );
}