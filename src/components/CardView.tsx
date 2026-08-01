import { useState, useCallback } from "react";
import type { FlashCard } from "../lib/parser";

interface CardViewProps {
  cards: FlashCard[];
  onBack: () => void;
}

export default function CardView({ cards, onBack }: CardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"study" | "list">("study");

  const card = cards[currentIndex];
  const progress = Math.round((mastered.size / cards.length) * 100);

  const goNext = useCallback(() => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % cards.length);
    }, 150);
  }, [cards.length]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i - 1 + cards.length) % cards.length);
    }, 150);
  }, [cards.length]);

  const toggleMastered = useCallback(() => {
    setMastered((prev) => {
      const next = new Set(prev);
      if (next.has(card.id)) {
        next.delete(card.id);
      } else {
        next.add(card.id);
      }
      return next;
    });
  }, [card.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight") {
        goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "m") {
        toggleMastered();
      }
    },
    [goNext, goPrev, toggleMastered]
  );

  if (mode === "list") {
    return (
      <div className="list-view">
        <div className="list-header">
          <button className="btn-back" onClick={onBack}>
            ← 返回编辑
          </button>
          <h2>全部卡片 ({cards.length})</h2>
          <button className="btn-mode" onClick={() => setMode("study")}>
            📖 学习模式
          </button>
        </div>
        <div className="card-list">
          {cards.map((c, i) => (
            <div
              key={c.id}
              className={`list-card ${mastered.has(c.id) ? "mastered" : ""}`}
              onClick={() => {
                setCurrentIndex(i);
                setMode("study");
                setFlipped(false);
              }}
            >
              <span className="list-card-num">{i + 1}</span>
              <div className="list-card-content">
                <strong>{c.front}</strong>
                {c.back !== c.front && <p>{c.back}</p>}
              </div>
              {mastered.has(c.id) && <span className="mastered-badge">✓</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-view" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="card-top-bar">
        <button className="btn-back" onClick={onBack}>
          ← 返回编辑
        </button>
        <div className="progress-info">
          <span>
            {currentIndex + 1} / {cards.length}
          </span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="mastered-count">已掌握 {mastered.size}</span>
        </div>
        <button className="btn-mode" onClick={() => setMode("list")}>
          📋 列表模式
        </button>
      </div>

      <div className="card-stage">
        <div
          className={`flashcard ${flipped ? "flipped" : ""} ${
            mastered.has(card.id) ? "mastered" : ""
          }`}
          onClick={() => setFlipped((f) => !f)}
        >
          <div className="flashcard-inner">
            <div className="flashcard-face flashcard-front">
              <span className="face-label">正面</span>
              <div className="face-content">{card.front}</div>
              <span className="flip-hint">点击翻转 ↻</span>
            </div>
            <div className="flashcard-face flashcard-back">
              <span className="face-label">背面</span>
              <div className="face-content">{card.back}</div>
              <span className="flip-hint">点击翻转 ↻</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-controls">
        <button className="btn-nav" onClick={goPrev}>
          ← 上一张
        </button>
        <button
          className={`btn-master ${mastered.has(card.id) ? "active" : ""}`}
          onClick={toggleMastered}
        >
          {mastered.has(card.id) ? "✓ 已掌握" : "标记掌握"}
        </button>
        <button className="btn-nav" onClick={goNext}>
          下一张 →
        </button>
      </div>

      <div className="keyboard-hints">
        <span>空格：翻转</span>
        <span>←→：切换</span>
        <span>M：标记掌握</span>
      </div>
    </div>
  );
}
