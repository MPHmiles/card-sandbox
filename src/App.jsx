import React, { useState, useRef, useEffect } from "react";
import "./index.css";

const CARD_WIDTH = 100;
const CARD_HEIGHT = 145;

// List all card images
const filenames = [
  "ace_of_spades.png","2_of_spades.png","3_of_spades.png","4_of_spades.png","5_of_spades.png","6_of_spades.png","7_of_spades.png","8_of_spades.png","9_of_spades.png","10_of_spades.png","jack_of_spades.png","queen_of_spades.png","king_of_spades.png",
  "ace_of_hearts.png","2_of_hearts.png","3_of_hearts.png","4_of_hearts.png","5_of_hearts.png","6_of_hearts.png","7_of_hearts.png","8_of_hearts.png","9_of_hearts.png","10_of_hearts.png","jack_of_hearts.png","queen_of_hearts.png","king_of_hearts.png",
  "ace_of_diamonds.png","2_of_diamonds.png","3_of_diamonds.png","4_of_diamonds.png","5_of_diamonds.png","6_of_diamonds.png","7_of_diamonds.png","8_of_diamonds.png","9_of_diamonds.png","10_of_diamonds.png","jack_of_diamonds.png","queen_of_diamonds.png","king_of_diamonds.png",
  "ace_of_clubs.png","2_of_clubs.png","3_of_clubs.png","4_of_clubs.png","5_of_clubs.png","6_of_clubs.png","7_of_clubs.png","8_of_clubs.png","9_of_clubs.png","10_of_clubs.png","jack_of_clubs.png","queen_of_clubs.png","king_of_clubs.png",
  "black_joker.png","red_joker.png"
];

let cardId = 0;

// Initialize deck with slight random offsets
const initDeck = () => {
  return filenames.map(file => ({
    id: cardId++,
    front: `/cards/${file}`,
    back: `/cards/back.png`,
    faceUp: false,
    clickCount: 0,
    pos: [
      window.innerWidth / 2 - CARD_WIDTH / 2 + Math.floor(Math.random() * 20 - 10),
      window.innerHeight / 2 - CARD_HEIGHT / 2 + Math.floor(Math.random() * 20 - 10)
    ]
  }));
};

// Fisher-Yates shuffle
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function App() {
  const [cards, setCards] = useState(shuffleArray(initDeck()));
  const [draggingCardId, setDraggingCardId] = useState(null);
  const dragOffset = useRef([0, 0]);
  const dragStart = useRef([0, 0]);
  const [paintMode, setPaintMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [painting, setPainting] = useState(false);
  const [dice, setDice] = useState(1);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const clickThreshold = 5;

  // Zoom & pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastTouch = useRef(null);
  const pinchDistance = useRef(null);
  const lastOffset = useRef({ x: 0, y: 0 });

  // Mouse / touch handlers
  const handleMouseDown = (e, card) => {
    e.stopPropagation();
    setCards(prev => {
      const newCards = prev.filter(c => c.id !== card.id);
      newCards.push(card); // bring to top
      return newCards;
    });
    setDraggingCardId(card.id);
    dragOffset.current = [e.clientX - card.pos[0], e.clientY - card.pos[1]];
    dragStart.current = [e.clientX, e.clientY];
  };

  const handleMouseUp = (e, card) => {
    if (draggingCardId !== card.id) return;
    const dx = Math.abs(e.clientX - dragStart.current[0]);
    const dy = Math.abs(e.clientY - dragStart.current[1]);
    if (dx < clickThreshold && dy < clickThreshold) {
      setCards(prev => prev.map(c => {
        if (c.id === card.id) {
          c.clickCount = (c.clickCount || 0) + 1;
          if (c.clickCount >= 2) {
            c.faceUp = !c.faceUp;
            c.clickCount = 0;
          }
        }
        return c;
      }));
    }
    setDraggingCardId(null);
  };

  const handleMouseMove = (e) => {
    if (draggingCardId !== null) {
      const [offsetX, offsetY] = dragOffset.current;
      setCards(prev => prev.map(c => c.id === draggingCardId ? {
        ...c,
        pos: [e.clientX - offsetX, e.clientY - offsetY]
      } : c));
    }
    if (painting) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.fillStyle = eraserMode ? "rgb(230,220,255)" : "black";
      ctx.beginPath();
      ctx.arc(e.nativeEvent.offsetX, e.nativeEvent.offsetY, 8, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const handleMouseUpGlobal = () => {
    setDraggingCardId(null);
    setPainting(false);
  };

  const handleCanvasMouseDown = () => {
    if (paintMode || eraserMode) setPainting(true);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastOffset.current = { ...offset };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistance.current = Math.hypot(dx, dy);
      lastOffset.current = { ...offset };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && lastTouch.current) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      setOffset({ x: lastOffset.current.x + dx, y: lastOffset.current.y + dy });
    } else if (e.touches.length === 2 && pinchDistance.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const scaleChange = newDist / pinchDistance.current;
      setScale(prev => Math.min(Math.max(prev * scaleChange, 0.5), 2)); // min 0.5, max 2
      pinchDistance.current = newDist;
    }
  };

  const flipAll = () => setCards(prev => prev.map(c => ({ ...c, faceUp: !c.faceUp })));
  const shuffle = () => setCards(shuffleArray(initDeck()));
  const clearPaint = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };
  const rollDice = () => setDice(Math.floor(Math.random() * 6) + 1);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "rgb(230,220,255)",
        position: "relative",
        touchAction: "none"
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpGlobal}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => { lastTouch.current = null; pinchDistance.current = null; }}
    >
      <h1 style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>Howard's</h1>

      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: "10px", zIndex: 10, flexWrap: "wrap" }}>
        <button onClick={flipAll}>Flip All</button>
        <button onClick={shuffle}>Shuffle</button>
        <button onClick={() => { setPaintMode(!paintMode); setEraserMode(false); }}>Paint: {paintMode ? "ON" : "OFF"}</button>
        <button onClick={() => { setEraserMode(!eraserMode); setPaintMode(false); }}>Eraser: {eraserMode ? "ON" : "OFF"}</button>
        <button onClick={clearPaint}>Clear Paint</button>
        <button onClick={rollDice}>Dice: {dice}</button>
        <a href="https://docs.google.com/document/d/1y8SCFvIc41yUzB25gZpygUmxQex8ZT0dk8sKQ4Hl2T8/edit?usp=sharing" target="_blank" rel="noopener noreferrer">Instructions</a>
      </div>

      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}
        onMouseDown={handleCanvasMouseDown}
      />

      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%"
        }}
      >
        {cards.map((card, idx) => (
          <img
            key={card.id}
            src={card.faceUp ? card.front : card.back}
            alt="card"
            style={{
              position: "absolute",
              left: card.pos[0],
              top: card.pos[1],
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              zIndex: idx + 1,
              cursor: "pointer",
              borderRadius: "8px",
              backgroundColor: "white",
              userSelect: "none",
              WebkitUserDrag: "none",
              pointerEvents: "auto"
            }}
            draggable={false}
            onMouseDown={(e) => handleMouseDown(e, card)}
            onMouseUp={(e) => handleMouseUp(e, card)}
          />
        ))}
      </div>
    </div>
  );
}

