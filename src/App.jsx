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
  const [menuOpen, setMenuOpen] = useState(false);
  const dragOffset = useRef([0,0]);
  const dragStart = useRef([0,0]);
  const [paintMode, setPaintMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [painting, setPainting] = useState(false);
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x:0,y:0});
  const lastPan = useRef({x:0,y:0});
  const pinchStart = useRef(null);

  const clickThreshold = 5;

  // touch helpers
  const handleTouch = (handler) => (e) => {
    const touch = e.touches[0];
    handler({
      clientX: touch.clientX,
      clientY: touch.clientY,
      stopPropagation: () => e.stopPropagation(),
      nativeEvent: e.nativeEvent
    });
  };

  // drag + flip
  const handleMouseDown = (e, card) => {
    e.stopPropagation();
    setCards(prev => {
      const newCards = prev.filter(c => c.id !== card.id);
      newCards.push(card);
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

  // move + paint
  const handleMouseMove = (e) => {
    if (draggingCardId !== null) {
      const [offsetX, offsetY] = dragOffset.current;
      setCards(prev => prev.map(c => c.id === draggingCardId ? {
        ...c,
        pos: [(e.clientX - offsetX - pan.x) / zoom, (e.clientY - offsetY - pan.y) / zoom]
      } : c));
    }
    if (painting) {
      const ctx = canvasRef.current.getContext("2d");
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      ctx.fillStyle = eraserMode ? "rgb(230,220,255)" : "black";
      ctx.beginPath();
      ctx.arc(x, y, 8/zoom, 0, 2*Math.PI);
      ctx.fill();
    }
  };

  // draw start
  const handleCanvasMouseDown = () => {
    if (paintMode || eraserMode) setPainting(true);
  };

  const handleMouseUpGlobal = () => {
    setDraggingCardId(null);
    setPainting(false);
  };

  // zoom slider
  const handleZoomChange = (e) => setZoom(parseFloat(e.target.value));

  // pinch zoom
  const handleTouchStartCanvas = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart.current = Math.sqrt(dx*dx + dy*dy);
    } else if (paintMode || eraserMode) {
      setPainting(true);
    } else {
      lastPan.current = {x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y};
    }
  };

  const handleTouchMoveCanvas = (e) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinchStart.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const scale = dist / pinchStart.current;
      setZoom(z => Math.min(Math.max(z * scale, 0.5), 2));
      pinchStart.current = dist;
      return;
    }

    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (touch.clientX - rect.left - pan.x) / zoom;
    const y = (touch.clientY - rect.top - pan.y) / zoom;
    if (painting) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.fillStyle = eraserMode ? "rgb(230,220,255)" : "black";
      ctx.beginPath();
      ctx.arc(x, y, 8/zoom, 0, 2*Math.PI);
      ctx.fill();
    } else {
      setPan({x: touch.clientX - lastPan.current.x, y: touch.clientY - lastPan.current.y});
    }
  };

  const handleTouchEndCanvas = () => {
    setPainting(false);
    pinchStart.current = null;
  };

  // buttons
  const flipAll = () => setCards(prev => prev.map(c => ({ ...c, faceUp: !c.faceUp })));
  const shuffle = () => setCards(shuffleArray(initDeck()));
  const clearPaint = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
  };
  const rollDice = () => alert("🎲 You rolled a " + (Math.floor(Math.random() * 6) + 1) + "!");

  // prevent scroll while painting
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
        width:"100vw",height:"100vh",overflow:"hidden",position:"relative",
        backgroundColor:"rgb(230,220,255)",touchAction:"none"
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpGlobal}
      onTouchMove={handleTouch(handleMouseMove)}
      onTouchEnd={handleMouseUpGlobal}
    >
      <h1 style={{ position:"absolute", top:10, left:10, zIndex:3 }}>Howard's</h1>

      {/* buttons */}
      {!isMobile ? (
        <div style={{ position:"absolute", top:10, right:10, display:"flex", gap:"8px", zIndex:3, flexWrap:"wrap" }}>
          <button onClick={flipAll}>Flip All</button>
          <button onClick={shuffle}>Shuffle</button>
          <button onClick={()=>{setPaintMode(!paintMode);setEraserMode(false);}}>Paint: {paintMode?"ON":"OFF"}</button>
          <button onClick={()=>{setEraserMode(!eraserMode);setPaintMode(false);}}>Eraser: {eraserMode?"ON":"OFF"}</button>
          <button onClick={clearPaint}>Clear</button>
          <button onClick={() => window.open("https://wowards.netlify.app","_blank")}>Link</button>
          <button onClick={rollDice}>🎲 Roll</button>
          <label>Zoom <input type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={handleZoomChange}/></label>
        </div>
      ) : (
        <>
          <button
            style={{ position:"absolute", top:10, right:10, zIndex:4, padding:"8px 12px" }}
            onClick={() => setMenuOpen(!menuOpen)}
          >☰ Menu</button>

          {menuOpen && (
            <div style={{
              position:"absolute", top:50, right:10, zIndex:5, background:"white",
              borderRadius:"8px", padding:"10px", display:"flex", flexDirection:"column",
              gap:"8px", boxShadow:"0 2px 6px rgba(0,0,0,0.3)"
            }}>
              <button onClick={flipAll}>Flip All</button>
              <button onClick={shuffle}>Shuffle</button>
              <button onClick={()=>{setPaintMode(!paintMode);setEraserMode(false);}}>Paint: {paintMode?"ON":"OFF"}</button>
              <button onClick={()=>{setEraserMode(!eraserMode);setPaintMode(false);}}>Eraser: {eraserMode?"ON":"OFF"}</button>
              <button onClick={clearPaint}>Clear</button>
              <button onClick={() => window.open("https://wowards.netlify.app","_blank")}>Link</button>
              <button onClick={rollDice}>🎲 Roll</button>
              <label>Zoom<input type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={handleZoomChange}/></label>
            </div>
          )}
        </>
      )}

      <div
        style={{
          transform:`translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin:"0 0",
          width:"100%",height:"100%",position:"absolute",top:0,left:0
        }}
      >
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          style={{ position:"absolute", top:0, left:0, zIndex:0 }}
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
              touchAction:"none"
            }}
            draggable={false}
            onMouseDown={(e)=>handleMouseDown(e, card)}
            onMouseUp={(e)=>handleMouseUp(e, card)}
            onTouchStart={handleTouch((e)=>handleMouseDown(e, card))}
            onTouchEnd={handleTouch((e)=>handleMouseUp(e, card))}
          />
        ))}
      </div>
    </div>
  );
}

