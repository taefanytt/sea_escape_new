//還沒完成先亂寫
'use client';

import { useState } from 'react';

interface DiaryGameProps {
  onSuccess: (completed?: boolean) => void;
}

export default function DiaryGame({ onSuccess }: DiaryGameProps) {
  const [page, setPage] = useState(1);
  const [finished, setFinished] = useState(false);

  return (
    <div className="level-screen diary-game">
      <button className="level-back" onClick={() => onSuccess(false)} title="返回船艙">
        返回
      </button>

      {!finished ? (
        <div className="level-card">
          <h2>航海日誌</h2>
          <p>翻閱日誌，找到最後一頁的線索。</p>
          <div className="diary-pages">
            <button type="button" onClick={() => setPage(1)} className={page === 1 ? 'active' : ''}>
              第 1 頁
            </button>
            <button type="button" onClick={() => setPage(2)} className={page === 2 ? 'active' : ''}>
              第 2 頁
            </button>
            <button type="button" onClick={() => setPage(3)} className={page === 3 ? 'active' : ''}>
              第 3 頁
            </button>
          </div>
          <div className="diary-content">
            {page === 1 && <p>第一頁：今天風平浪靜，船員低語著未知的目的地。</p>}
            {page === 2 && <p>第二頁：夜晚的海面反射出奇異光芒，似乎有方向的提示。</p>}
            {page === 3 && <p>第三頁：最終線索寫著「東方有光，西方有答案」。</p>}
          </div>
          <button onClick={() => setFinished(true)}>閱讀完畢，離開日誌</button>
        </div>
      ) : (
        <div className="level-card">
          <h2>日誌解讀完成</h2>
          <p>你已經讀完航海日誌，得到下一個線索。</p>
          <button onClick={() => onSuccess(true)}>返回船艙</button>
        </div>
      )}
    </div>
  );
}
