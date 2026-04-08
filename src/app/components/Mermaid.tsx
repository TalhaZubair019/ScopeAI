import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Download, Check } from "lucide-react";

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
  },
  securityLevel: "loose",
  fontFamily: "Outfit, Inter, sans-serif",
});

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute("data-processed");
      mermaid.contentLoaded();
      
      // Force re-render for dynamic content with error handling
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

  const handleDownload = () => {
    if (!ref.current) return;
    const svg = ref.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
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
    <div className="w-full relative group">
      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
      >
        {downloaded ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-500">Saved</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5" />
            <span>Download SVG</span>
          </>
        )}
      </button>

      <div className="w-full flex justify-center p-8 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto scrollbar-hide">
        <div 
          ref={ref} 
          className="mermaid text-white min-w-full flex justify-center scale-95 md:scale-100 origin-top transition-all"
        >
          {chart}
        </div>
      </div>
    </div>
  );
};

export default Mermaid;
