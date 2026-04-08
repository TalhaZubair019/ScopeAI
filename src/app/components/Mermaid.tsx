import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Download, Check, ZoomIn, ZoomOut, Maximize, Expand, Minimize } from "lucide-react";

mermaid.initialize({
  startOnLoad: true,
  theme: "dark",
  themeVariables: {
    primaryColor: "#6366f1",
    primaryTextColor: "#fff",
    primaryBorderColor: "#818cf8",
    lineColor: "#475569",
    secondaryColor: "#1e1b4b",
    tertiaryColor: "#020617",
    fontFamily: "Outfit, sans-serif",
    fontSize: "13px",
  },
  flowchart: {
    padding: 30,
    nodeSpacing: 60,
    rankSpacing: 90,
    htmlLabels: true,
    curve: "basis",
  },
  securityLevel: "loose",
});

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute("data-processed");
      mermaid.contentLoaded();

      mermaid
        .render("mermaid-svg-" + Math.random().toString(36).substr(2, 9), chart)
        .then((result) => {
          if (ref.current) {
            ref.current.innerHTML = result.svg;
          }
        })
        .catch((err) => {
          console.error("Mermaid Render Error:", err);
          if (ref.current) {
            ref.current.innerHTML = `<div class="p-6 text-center text-slate-500 border border-dashed border-white/5 rounded-xl bg-white/2"><p class="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Neural Visualization Error</p><p class="text-[11px] font-light">The AI generated a complex diagram that exceeded the current visualization limits. Re-initializing the plan may fix this.</p></div>`;
          }
        });
    }
  }, [chart]);

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 5));
  };

  const handleFullscreen = () => {
    if (!wrapperRef.current) return;
    
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setStartX(e.pageX - (containerRef.current?.offsetLeft || 0));
    setStartY(e.pageY - (containerRef.current?.offsetTop || 0));
    setScrollLeft(containerRef.current?.scrollLeft || 0);
    setScrollTop(containerRef.current?.scrollTop || 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current.offsetLeft || 0);
    const y = e.pageY - (containerRef.current.offsetTop || 0);
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walkX;
    containerRef.current.scrollTop = scrollTop - walkY;
  };

  const handleDownload = () => {
    if (!ref.current) return;
    const svg = ref.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `scopeai-flowchart-${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div 
      ref={wrapperRef} 
      className={`w-full relative group overflow-hidden ${isFullscreen ? "h-screen w-screen bg-black" : "rounded-2xl border border-white/5 bg-black/40"}`}
    >
      {/* Sticky Control Bar Container - Always Visible */}
      <div className="sticky top-0 right-0 w-full flex justify-end p-4 pointer-events-none z-30 h-0 overflow-visible">
        <div className="flex items-center gap-2 pointer-events-auto transition-all">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-black/80 border border-white/10 backdrop-blur-xl shadow-2xl">
            <button
              onClick={() => handleZoom(0.2)}
              className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all outline-hidden cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(-0.2)}
              className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all outline-hidden cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setScale(1)}
              className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all outline-hidden cursor-pointer"
              title="Reset Zoom"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={handleFullscreen}
              className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all outline-hidden cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <div className="px-2 text-[9px] font-bold text-indigo-400 font-mono w-10 text-center">
              {Math.round(scale * 100)}%
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/90 border border-indigo-400/50 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-indigo-500 hover:scale-105 transition-all backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.3)] outline-hidden cursor-pointer"
          >
            {downloaded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download SVG</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`w-full overflow-auto scrollbar-hide select-none p-8 ${
          isFullscreen ? "h-[calc(100vh-20px)]" : "min-h-[400px]"
        } ${
          scale > 1
            ? isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default justify-center flex"
        }`}
      >
        <div
          ref={ref}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
            pointerEvents: isDragging ? "none" : "auto",
            transition: isDragging ? "none" : "transform 0.3s ease",
          }}
          className="text-white min-w-full flex justify-center transition-none"
        >
          {/* Chart rendered here via manual mermaid.render call */}
        </div>
      </div>
    </div>
  );
};

export default Mermaid;
