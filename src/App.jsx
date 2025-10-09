import React, { useState, useRef, useEffect } from "react";
import "./index.css";

const CARD_WIDTH = 100;
const CARD_HEIGHT = 145;

const filenames = [
  "ace_of_spades.png","2_of_spades.png","3_of_spades.png","4_of_spades.png","5_of_spades.png","6_of_spades.png","7_of_spades.png","8_of_spades.png","9_of_spades.png","10_of_spades.png","jack_of_spades.png","queen_of_spades.png","king_of_spades.png",
  "ace_of_hearts.png","2_of_hearts.png","3_of_hearts.png","4_of_hearts.png","5_of_hearts.png","6_of_hearts.png","7_of_hearts.png","8_of_hearts.png","9_of_hearts.png","10_of_hearts.png","jack_of_hearts.png","queen_of_hearts.png","king_of_hearts.png",
  "ace_of_diamonds.png","2_of_diamonds.png","3_of_diamonds.png","4_of_diamonds.png","5_of_diamonds.png","6_of_diamonds.png","7_of_diamonds.png","8_of_diamonds.png","9_of_diamonds.png","10_of_diamonds.png","jack_of_diamonds.png","queen_of_diamonds.png","king_of_diamonds.png",
  "ace_of_clubs.png","2_of_clubs.png","3_of_clubs.png","4_of_clubs.png","5_of_clubs.png","6_of_clubs.png","7_of_clubs.png","8_of_clubs.png","9_of_clubs.png","10_of_clubs.png","jack_of_clubs.png","queen_of_clubs.png","king_of_clubs.png",
  "black_joker.png","red_joker.png"
];

let cardId = 0;
const initDeck = () =>
  filenames.map(file => ({
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
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const lastPan = useRef({ x: 0, y: 0 });
  const pinchStart = useRef(null);
  const pinchMidpoint = useRef({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const clickThreshold = 5;
  const lastPaintPos = useRef({ x: 0, y: 0 });

  const handleTouch = (handler) => (e) => {
    const touch = e.touches[0];
    handler({
      clientX: touch.clientX,
      clientY: touch.clientY,
      stopPropagation: () => e.stopPropagation(),
      nativeEvent: e.nativeEvent
    });
  };

  const handleMouseDown = (e, card) => {
    e.stopPropagation();
    setCards(prev => {
      const newCards = prev.filter(c => c.id !== card.id);
      newCards.push(card);
      return newCards;
    });
    setDraggingCardId(card.id);
    dragOffset.current = [
      (e.clientX - pan.x) / zoom - card.pos[0],
      (e.clientY - pan.y) / zoom - card.pos[1]
    ];
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
        pos: [(e.clientX - pan.x) / zoom - offsetX, (e.clientY - pan.y) / zoom - offsetY]
      } : c));
    }
    if (painting) {
      const ctx = canvasRef.current.getContext("2d");
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      ctx.strokeStyle = eraserMode ? "rgb(230,220,255)" : "black";
      ctx.lineWidth = 6 / zoom;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lastPaintPos.current.x, lastPaintPos.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPaintPos.current = { x, y };
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (paintMode || eraserMode) {
      setPainting(true);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      lastPaintPos.current = { x, y };
    }
  };

  const handleMouseUpGlobal = () => {
    setDraggingCardId(null);
    setPainting(false);
  };

  const handleZoomChange = (e) => setZoom(parseFloat(e.target.value));

  const handleTouchStartCanvas = (e) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      pinchStart.current = Math.sqrt(dx * dx + dy * dy);
      pinchMidpoint.current = { x: (t1.clientX + t2.clientX)/2, y: (t1.clientY + t2.clientY)/2 };
    } else if (paintMode || eraserMode) {
      setPainting(true);
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (touch.clientX - rect.left - pan.x) / zoom;
      const y = (touch.clientY - rect.top - pan.y) / zoom;
      lastPaintPos.current = { x, y };
    } else {
      const touch = e.touches[0];
      lastPan.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
    }
  };

  const handleTouchMoveCanvas = (e) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinchStart.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchStart.current;

      // zoom around midpoint
      const newZoom = Math.min(Math.max(zoom * scale, 0.1), 1);
      const mx = pinchMidpoint.current.x;
      const my = pinchMidpoint.current.y;
      setPan(prev => ({
        x: mx - (mx - prev.x) * (newZoom / zoom),
        y: my - (my - prev.y) * (newZoom / zoom)
      }));
      setZoom(newZoom);
      pinchStart.current = dist;
      return;
    }

    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (touch.clientX - rect.left - pan.x) / zoom;
    const y = (touch.clientY - rect.top - pan.y) / zoom;

    if (painting) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.strokeStyle = eraserMode ? "rgb(230,220,255)" : "black";
      ctx.lineWidth = 6 / zoom;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lastPaintPos.current.x, lastPaintPos.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPaintPos.current = { x, y };
    } else {
      setPan({ x: touch.clientX - lastPan.current.x, y: touch.clientY - lastPan.current.y });
    }
  };

  const handleTouchEndCanvas = () => {
    setPainting(false);
    pinchStart.current = null;
  };

  const flipAll = () => setCards(prev => prev.map(c => ({ ...c, faceUp: !c.faceUp })));
  const shuffle = () => setCards(shuffleArray(initDeck()));
  const clearPaint = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  const rollDice = () => alert("🎲 You rolled a " + (Math.floor(Math.random() * 6) + 1) + "!");

  useEffect(() => {
    const preventScroll = (e) => {
      if (draggingCardId !== null || painting) e.preventDefault();
    };
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => document.removeEventListener("touchmove", preventScroll);
  }, [draggingCardId, painting]);

  const isMobile = window.innerWidth < 768;

  return (
    <div
      style={{
        width: "100vw", height: "100vh", overflow: "hidden",
        position: "relative", backgroundColor: "rgb(230,220,255)", touchAction: "none"
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpGlobal}
      onTouchMove={handleTouch(handleMouseMove)}
      onTouchEnd={handleMouseUpGlobal}
    >
      <h1 style={{ position: "absolute", top: 10, left: 10, zIndex: 3 }}>Howard's</h1>

      {!isMobile ? (
        <div style={{
          position: "absolute", top: 10, right: 10, display: "flex",
          gap: "8px", zIndex: 3, flexWrap: "wrap", alignItems: "center"
        }}>
          <button onClick={flipAll}>Flip All</button>
          <button onClick={shuffle}>Shuffle</button>
          <button onClick={() => { setPaintMode(!paintMode); setEraserMode(false); }}>
            Paint: {paintMode ? "ON" : "OFF"}
          </button>
          <button onClick={() => { setEraserMode(!eraserMode); setPaintMode(false); }}>
            Eraser: {eraserMode ? "ON" : "OFF"}
          </button>
          <button onClick={clearPaint}>Clear</button>
          <button onClick={() => window.open("https://docs.google.com/document/d/1y8SCFvIc41yUzB25gZpygUmxQex8ZT0dk8sKQ4Hl2T8/edit?usp=sharing", "_blank")}>Link</button>
          <button onClick={rollDice}>🎲 Roll</button>
          <label>Zoom <input type="range" min="0.1" max="1" step="0.01" value={zoom} onChange={handleZoomChange} /></label>
        </div>
      ) : (
        <>
          <button
            style={{ position: "absolute", top: 10, right: 10, zIndex: 4, padding: "8px 12px" }}
            onClick={() => setMenuOpen(!menuOpen)}
          >☰ Menu</button>

          {menuOpen && (
            <div style={{
              position: "absolute", top: 50, right: 10, zIndex: 5, background: "white",
              borderRadius: "8px", padding: "10px", display: "flex", flexDirection: "column",
              gap: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
            }}>
              <button onClick={flipAll}>Flip All</button>
              <button onClick={shuffle}>Shuffle</button>
              <button onClick={() => { setPaintMode(!paintMode); setEraserMode(false); }}>
                Paint: {paintMode ? "ON" : "OFF"}
              </button>
              <button onClick={() => { setEraserMode(!eraserMode); setPaintMode(false); }}>
                Eraser: {eraserMode ? "ON" : "OFF"}
              </button>
              <button onClick={clearPaint}>Clear</button>
              <button onClick={() => window.open("https://docs.google.com/document/d/1y8SCFvIc41yUzB25gZpygUmxQex8ZT0dk8sKQ4Hl2T8/edit?usp=sharing", "_blank")}>Link</button>
              <button onClick={rollDice}>🎲 Roll</button>
              <label>Zoom<input type="range" min="0.1" max="1" step="0.01" value={zoom} onChange={handleZoomChange} /></label>
            </div>
          )}
        </>
      )}

      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0", width: "100%", height: "100%",
          position: "absolute", top: 0, left: 0
        }}
      >
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}
          onMouseDown={handleCanvasMouseDown}
          onTouchStart={handleTouchStartCanvas}
          onTouchMove={handleTouchMoveCanvas}
          onTouchEnd={handleTouchEndCanvas}
        />

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
              touchAction: "none"
            }}
            draggable={false}
            onMouseDown={(e) => handleMouseDown(e, card)}
            onMouseUp={(e) => handleMouseUp(e, card)}
            onTouchStart={handleTouch((e) => handleMouseDown(e, card))}
            onTouchEnd={handleTouch((e) => handleMouseUp(e, card))}
          />
        ))}
      </div>
    </div>
  );
}

