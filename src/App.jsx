import React, { useRef, useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isPaintingMode, setIsPaintingMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const lastPan = useRef({ x: 0, y: 0 });
  const pinchStart = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    setCtx(context);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth * 2;
      canvas.height = window.innerHeight * 2;
      context.scale(2, 2);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // ---- Drawing ----
  const startDrawing = (x, y) => {
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (x, y) => {
    if (!isDrawing || !ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  // ---- Mouse events ----
  const handleMouseDown = (e) => {
    if (isPaintingMode) {
      startDrawing(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    } else {
      setIsPanning(true);
      lastPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e) => {
    if (isPaintingMode && isDrawing) {
      draw(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    } else if (isPanning) {
      setPan({
        x: e.clientX - lastPan.current.x,
        y: e.clientY - lastPan.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    stopDrawing();
    setIsPanning(false);
  };

  // ---- Touch events ----
  const handleTouchStart = (e) => {
    if (!canvasRef.current) return;

    if (e.touches.length === 2) {
      // Start pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart.current = Math.sqrt(dx * dx + dy * dy);
      return;
    }

    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (isPaintingMode) {
      startDrawing(x, y);
    } else {
      setIsPanning(true);
      lastPan.current = { x: x - pan.x, y: y - pan.y };
    }
  };

  const handleTouchMove = (e) => {
    if (!canvasRef.current) return;
    e.preventDefault();

    if (e.touches.length === 2 && pinchStart.current) {
      // Handle pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scaleChange = dist / pinchStart.current;
      setZoom((z) => Math.min(Math.max(z * scaleChange, 0.5), 2));
      pinchStart.current = dist;
      return;
    }

    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (isPaintingMode && isDrawing) {
      draw(x, y);
    } else if (isPanning) {
      setPan({
        x: x - lastPan.current.x,
        y: y - lastPan.current.y,
      });
    }
  };

  const handleTouchEnd = (e) => {
    stopDrawing();
    setIsPanning(false);
    pinchStart.current = null;
  };

  const handleZoomChange = (e) => setZoom(parseFloat(e.target.value));

  return (
    <div
      className="app"
      style={{
        overflow: "hidden",
        width: "100vw",
        height: "100vh",
        position: "relative",
      }}
    >
      <h1 className="title" style={{ textAlign: "center", marginTop: "10px" }}>
        Howards
      </h1>

      <div
        className="button-container"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "10px",
        }}
      >
        <button onClick={() => setIsPaintingMode(!isPaintingMode)}>
          {isPaintingMode ? "Disable Draw" : "Enable Draw"}
        </button>
        <button onClick={() => window.open("https://wowards.netlify.app", "_blank")}>
          Visit Link
        </button>
      </div>

      <div
        className="play-area"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: "center center",
          transition: "transform 0.15s ease",
          touchAction: "none",
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            border: "1px solid #ccc",
            width: "100vw",
            height: "100vh",
            backgroundColor: "#fff",
            display: "block",
            margin: "0 auto",
            touchAction: "none",
          }}
        />
      </div>

      <div
        className="zoom-slider"
        style={{
          position: "fixed",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          padding: "5px 10px",
          borderRadius: "10px",
        }}
      >
        <label>Zoom</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={zoom}
          onChange={handleZoomChange}
        />
      </div>
    </div>
  );
}

