//還沒完成先亂寫
'use client';

import { useState } from 'react';

interface FoodGameProps {
  onSuccess: (completed?: boolean) => void;
}

export default function FoodGame({ onSuccess }: FoodGameProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const correctFood = 'fish';

  return (
    <div className="level-screen food-game">
      <button className="level-back" onClick={() => onSuccess(false)} title="返回船艙">
        返回
      </button>

      {!solved ? (
        <div className="level-card">
          <h2>食物選擇</h2>
          <p>從桌上的食物中，選出最適合長時間航行保存的那一樣。</p>
          <div className="food-options">
            <button onClick={() => setSelected('fish')} className={selected === 'fish' ? 'active' : ''}>
              魚
            </button>
            <button onClick={() => setSelected('bread')} className={selected === 'bread' ? 'active' : ''}>
              麵包
            </button>
            <button onClick={() => setSelected('fruit')} className={selected === 'fruit' ? 'active' : ''}>
              水果
            </button>
            <button onClick={() => setSelected('cheese')} className={selected === 'cheese' ? 'active' : ''}>
              起司
            </button>
          </div>
          <button
            disabled={!selected}
            onClick={() => {
              if (selected === correctFood) {
                setSolved(true);
              } else {
                setSelected(null);
              }
            }}
          >
            確認選擇
          </button>
        </div>
      ) : (
        <div className="level-card">
          <h2>選擇正確</h2>
          <p>你選對了保存食物，為接下來的航程補足了能量。</p>
          <button onClick={() => onSuccess(true)}>返回船艙</button>
        </div>
      )}
    </div>
  );
}
