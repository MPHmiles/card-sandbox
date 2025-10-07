import React, { useState, useRef, useEffect } from "react";
import "./index.css";

const WIDTH = 1200;
const HEIGHT = 800;
const CARD_WIDTH = 100;
const CARD_HEIGHT = 145;
const DOUBLE_CLICK_TIME = 300; // milliseconds

// Load card filenames
const filenames = [
  "AS.png","2S.png","3S.png","4S.png","5S.png","6S.png","7S.png","8S.png","9S.png","10S.png","JS.png","QS.png","KS.png",
  "AH.png","2H.png","3H.png","4H.png","5H.png","6H.png","7H.png","8H.png","9H.png","10H.png","JH.png","QH.png","KH.png",
  "AC.png","2C.png","3C.png","4C.png","5C.png","6C.png","7C.png","8C.png","9C.png","10C.png","JC.png","QC.png","KC.png",
  "AD.png","2D.png","3D.png","4D.png","5D.png","6D.png","7D.png","8D.png","9D.png","10D.png","JD.png","QD.png","KD.png"
];

const loadCards = () => {
  const back = "/cards/back.png";
  return filenames.map((f) => ({
    front: `/cards/${f}`,
    back,
    faceUp: false,
    pos: [WIDTH / 2 - CARD_WIDTH / 2, HEIGHT / 2 - CARD_HEIGHT / 2],
    lastClick: 0
  }));
};

// Shuffle and add small random offset
const shuffleAndOffset = (cards) => {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  shuffled.forEach(card => {
    card.pos[0] = WIDTH / 2 - CARD_WIDTH / 2 + Math.floor(Math.random() * 10 - 5);
    card.pos[1] = HEIGHT / 2 - CARD_HEIGHT / 2 + Math.floor(Math.random() * 10 - 5);
  });
  return shuffled;
};

export default function App() {
  const [cards, setCards] = useState(() => shuffleAndOffset(loadCards()));
  const [dragging, setDragging] = useState(null);
  const [paintMode, setPaintMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [painting, setPainting] = useState(false);
  const [paintRadius] = useState(8);

  const canvasRef = useRef(null);

  // Handle mouse move
  const handleMouseMove = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragging !== null) {
      setCards(prev => {
        const newCards = [...prev];
        newCards[dragging.index].pos = [x + dragging.offsetX, y + dragging.offsetY];
        return newCards;
      });
    } else if (painting) {
      drawOnCanvas(x, y);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setPainting(false);
  };

  // Draw on canvas
  const drawOnCanvas = (x, y) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = eraserMode ? "rgb(230,220,255)" : "black";
    ctx.beginPath();
    ctx.arc(x, y, paintRadius, 0, 2 * Math.PI);
    ctx.fill();
  };

  // Card click / drag
  const handleCardMouseDown = (e, index) => {
    e.stopPropagation();
    const card = cards[index];
    const now = Date.now();
    if (now - card.lastClick < DOUBLE_CLICK_TIME) {
      flipCard(index);
    }
    card.lastClick = now;

    const rect = e.target.getBoundingClientRect();
    setDragging({
      index,
      offsetX: card.pos[0] - (e.clientX - rect.left),
      offsetY: card.pos[1] - (e.clientY - rect.top)
    });
    bringToFront(index);
  };

  // Flip single card
  const flipCard = (i) => {
    setCards(prev => {
      const newCards = [...prev];
      newCards[i].faceUp = !newCards[i].faceUp;
      return newCards;
    });
  };

  // Bring card to top
  const bringToFront = (i) => {
    setCards(prev => {
      const newCards = [...prev];
      const [card] = newCards.splice(i, 1);
      newCards.push(card);
      return newCards;
    });
  };

  // Buttons
  const flipAll = () => setCards(prev => prev.map(c => ({ ...c, faceUp: !c.faceUp })));
  const shuffleDeck = () => setCards(prev => shuffleAndOffset(prev.map(c => ({ ...c, faceUp: false }))));
  const clearPaint = () => canvasRef.current.getContext("2d").clearRect(0, 0, WIDTH, HEIGHT);

  return (
    <div className="app" style={{ position: "relative", width: WIDTH, height: HEIGHT }}>
      <h1 style={{ position: "absolute", top: 10, left: 10 }}>Howard's</h1>
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: "10px" }}>
        <button onClick={flipAll}>Flip All</button>
        <button onClick={shuffleDeck}>Shuffle</button>
        <button onClick={() => { setPaintMode(!paintMode); setEraserMode(false); }}>
          Paint: {paintMode ? "ON" : "OFF"}
        </button>
        <button onClick={() => { setEraserMode(!eraserMode); setPaintMode(false); }}>
          Eraser: {eraserMode ? "ON" : "OFF"}
        </button>
        <button onClick={clearPaint}>Clear Paint</button>
      </div>

      {/* Canvas for painting */}
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ position: "absolute", top: 0, left: 0, backgroundColor: "rgb(230,220,255)" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={(e) => {
          if (paintMode || eraserMode) setPainting(true);
        }}
      />

      {/* Cards */}
      {cards.map((card, index) => (
        <img
          key={index}
          src={card.faceUp ? card.front : card.back}
          alt="card"
          style={{
            position: "absolute",
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            left: card.pos[0],
            top: card.pos[1],
            border: "2px solid white",
            borderRadius: "8px",
            cursor: "pointer",
            userSelect: "none",
          }}
          onMouseDown={(e) => handleCardMouseDown(e, index)}
        />
      ))}
    </div>
  );
}

