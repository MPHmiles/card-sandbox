kimport React, { useState, useRef, useEffect } from "react";
import "./index.css";

const CARD_WIDTH = 100;
const CARD_HEIGHT = 145;

// Card image list
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
      window.innerWidth/2 - CARD_WIDTH/2 + Math.floor(Math.random()*20-10),
      window.innerHeight/2 - CARD_HEIGHT/2 + Math.floor(Math.random()*20-10)
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
  const dragOffset = useRef([0,0]);
  const dragStart = useRef([0,0]);
  const [paintMode, setPaintMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [painting, setPainting] = useState(false);
  const canvasRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const clickThreshold = 5;

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mouse & touch handlers
  const handlePointerDown = (e, card) => {
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setCards(prev => {
      const newCards = prev.filter(c => c.id !== card.id);
      newCards.push(card); // bring to top
      return newCards;
    });

    setDraggingCardId(card.id);
    dragOffset.current = [clientX - card.pos[0], clientY - card.pos[1]];
    dragStart.current = [clientX, clientY];
  };

  const handlePointerUp = (e, card) => {
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    if (draggingCardId !== card.id) return;
    const dx = Math.abs(clientX - dragStart.current[0]);
    const dy = Math.abs(clientY - dragStart.current[1]);

    if (dx < clickThreshold && dy < clickThreshold) {
      setCards(prev => prev.map(c => {
        if (c.id === card.id) {
          c.clickCount = (c.clickCount || 0) + 1;
          if (c.clickCount >= 2) { // two clicks to flip
            c.faceUp = !c.faceUp;
            c.clickCount = 0;
          }
        }
        return c;
      }));
    }

    setDraggingCardId(null);
  };

  const handlePointerMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (draggingCardId !== null) {
      const [offsetX, offsetY] = dragOffset.current;
      setCards(prev => prev.map(c => c.id === draggingCardId ? {
        ...c,
        pos: [clientX - offsetX, clientY - offsetY]
      } : c));
    }

    if (painting) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.fillStyle = eraserMode ? "rgb(230,220,255)" : "black";
      ctx.beginPath();
      ctx.arc(clientX, clientY, 8, 0, 2*Math.PI);
      ctx.fill();
    }
  };

  const handleCanvasDown = () => {
    if (paintMode || eraserMode) setPainting(true);
  };

  const handlePointerUpGlobal = () => {
    setDraggingCardId(null);
    setPainting(false);
  };

  // Buttons
  const flipAll = () => setCards(prev => prev.map(c => ({ ...c, faceUp: !c.faceUp })));
  const shuffle = () => setCards(shuffleArray(initDeck()));
  const clearPaint = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
  };

  // Random number 1-6
  const [dice, setDice] = useState(null);
  const rollDice = () => setDice(Math.floor(Math.random()*6)+1);

  return (
    <div
      style={{ width:"100vw", height:"100vh", position:"relative", backgroundColor:"rgb(230,220,255)" }}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUpGlobal}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUpGlobal}
    >
      <h1 style={{ position:"absolute", top:10, left:10, zIndex:2 }}>Howard's</h1>

      <div style={{
        position:"absolute",
        top:10,
        right:10,
        display:"flex",
        flexDirection: isMobile ? "column" : "row",
        gap:"10px",
        zIndex:2
      }}>
        <button onClick={flipAll}>Flip All</button>
        <button onClick={shuffle}>Shuffle</button>
        <button onClick={() => { setPaintMode(!paintMode); setEraserMode(false); }}>Paint: {paintMode?"ON":"OFF"}</button>
        <button onClick={() => { setEraserMode(!eraserMode); setPaintMode(false); }}>Eraser: {eraserMode?"ON":"OFF"}</button>
        <button onClick={clearPaint}>Clear Paint</button>
        <button onClick={rollDice}>Roll Dice {dice!==null ? `🎲 ${dice}` : ""}</button>
      </div>

      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ position:"absolute", top:0, left:0, zIndex:0 }}
        onMouseDown={handleCanvasDown}
        onTouchStart={handleCanvasDown}
      />

      {cards.map((card, idx) => (
        <img
          key={card.id}
          src={card.faceUp ? card.front : card.back}
          alt="card"
          style={{
            position:"absolute",
            left: card.pos[0],
            top: card.pos[1],
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            zIndex: idx+1,
            cursor:"pointer",
            borderRadius:"8px",
            backgroundColor:"white",
            userSelect:"none",
            WebkitUserDrag:"none",
            pointerEvents:"auto"
          }}
          draggable={false}
          onMouseDown={(e)=>handlePointerDown(e, card)}
          onMouseUp={(e)=>handlePointerUp(e, card)}
          onTouchStart={(e)=>handlePointerDown(e, card)}
          onTouchEnd={(e)=>handlePointerUp(e, card)}
        />
      ))}
    </div>
  );
}

