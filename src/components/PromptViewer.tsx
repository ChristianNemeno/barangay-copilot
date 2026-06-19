import React, { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, Terminal } from "lucide-react";

interface PromptViewerProps {
  phaseNumber: number;
  title: string;
  xmlContent: string;
}

export default function PromptViewer({ phaseNumber, title, xmlContent }: PromptViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#F1EFE7]/60 border border-[#E5E2D6] rounded-xl overflow-hidden shadow-sm transition-all duration-200">
      <div 
        className="flex items-center justify-between px-4 py-3 bg-[#F1EFE7] cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
        id={`prompt-header-phase-${phaseNumber}`}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center bg-[#A0522D]/10 border border-[#A0522D]/20 text-[#A0522D] font-mono text-xs font-bold px-2.5 py-1 rounded-md">
            PROMPT XML
          </div>
          <span className="text-sm font-semibold text-[#4A4A3A] font-serif">
            Phase {phaseNumber} — {title}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-1.5 hover:bg-[#E5E2D6] text-[#8A8A75] hover:text-[#4A4A3A] rounded-md transition-colors"
            title="Copy prompt templates"
            id={`copy-prompt-btn-${phaseNumber}`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <span className="text-[#8A8A75]">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-[#E5E2D6] bg-white font-mono text-xs text-[#4A4A3A] leading-relaxed overflow-x-auto max-h-96">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#F1EFE7] text-[#8A8A75] text-[10px]">
            <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Prompt Template fed server-side</span>
            <span>Temperature recommended: {phaseNumber === 5 || phaseNumber === 6 ? "0.4 - 0.5" : "0.2"}</span>
          </div>
          <pre className="whitespace-pre-wrap select-all selection:bg-[#A0522D]/10">{xmlContent}</pre>
        </div>
      )}
    </div>
  );
}
