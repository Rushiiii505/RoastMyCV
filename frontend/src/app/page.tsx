"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  Sparkles, 
  Flame, 
  CheckSquare, 
  Square, 
  RotateCcw, 
  ArrowRight, 
  Zap, 
  Award,
  TrendingDown,
  Terminal as TerminalIcon
} from "lucide-react";

import DecryptedText from "@/components/reactbits/DecryptedText";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import SplitText from "@/components/reactbits/SplitText";
import Shuffle from "@/components/reactbits/Shuffle";
import SkiperButton from "@/components/skiper/SkiperButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AnalysisResult {
  overall_score: number;
  agency_verdict: string;
  design_critique: string;
  impact_critique: string;
  phrasing_critique: string;
  extracted_skills: string[];
  quick_fixes: string[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedFixes, setCompletedFixes] = useState<Record<number, boolean>>({});
  
  // Custom API Key Management
  const [apiKey, setApiKey] = useState<string>("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState<string>("");

  React.useEffect(() => {
    const savedKey = localStorage.getItem("roastmycv_gemini_key");
    if (savedKey) {
      setApiKey(savedKey);
      setTempKeyInput(savedKey);
    }
  }, []);

  const saveApiKey = (keyToSave: string) => {
    const trimmed = (keyToSave || "").trim();
    setApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem("roastmycv_gemini_key", trimmed);
    } else {
      localStorage.removeItem("roastmycv_gemini_key");
    }
    setShowKeyModal(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Only PDF files are supported!");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Only PDF files are supported!");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    if (apiKey.trim()) {
      formData.append("custom_api_key", apiKey.trim());
    }

    try {
      const isProd = process.env.NODE_ENV === 'production';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (isProd ? "/api/backend" : "http://localhost:8000");
      
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to analyze resume.");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      
      // Fire festive pop-art confetti
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#7000FF", "#CCFF00", "#FF4500", "#0055FF", "#FFFFFF"]
      });
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429") || msg.includes("quota")) {
        setError("🔥 API rate limit hit! The free Gemini tier has a daily cap. Wait a minute and try again, or switch to a paid API key.");
      } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("❌ Cannot reach the backend server. Make sure FastAPI is running: cd backend && source venv/bin/activate && uvicorn main:app --port 8000");
      } else {
        setError(msg || "Something went wrong. Check the backend logs for details.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleFix = (index: number) => {
    setCompletedFixes(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <main className="min-h-screen pb-32 pt-8 px-4 sm:px-8 max-w-7xl mx-auto space-y-12 overflow-hidden">
      
      {/* Pitch Deck Top Navigation Bar */}
      <nav className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl border-4 border-black bg-white shadow-[6px_6px_0px_#000000]">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl bg-[#CCFF00] border-3 border-black flex items-center justify-center font-black text-2xl -rotate-3 shadow-[2px_2px_0px_#000000]">
            🔥
          </div>
          <div>
            <span className="font-heading text-2xl tracking-tighter uppercase font-black">RoastMyCV</span>
            <span className="ml-2 text-xs font-bold bg-[#7000FF] text-white px-2 py-0.5 rounded-full border-2 border-black">AGENCY V2.0</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyModal(true)}
            className={cn(
              "sticker-badge cursor-pointer transition-all active:translate-y-0.5",
              apiKey ? "bg-[#CCFF00] text-black border-black" : "bg-[#7000FF] text-white border-black"
            )}
          >
            {apiKey ? "🔑 KEY SET" : "🔑 ADD API KEY"}
          </button>
          <span className="sticker-badge bg-[#FF4500] text-white rotate-1 hidden sm:inline-flex">
            HARSH MODE
          </span>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="text-center space-y-6 max-w-4xl mx-auto pt-6">
        <div className="flex flex-col items-center gap-4 relative">
          <span className="bg-[#FF4500] text-white font-black text-sm sm:text-base px-6 py-2 rounded-full border-4 border-black -rotate-2 shadow-[4px_4px_0px_#000000] z-10">
            PITCH DECK EDITION 🚀
          </span>
          <Shuffle
            text="ROAST MY CV"
            shuffleDirection="down"
            duration={0.35}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.03}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover={true}
            respectReducedMotion={true}
          />
        </div>

        <p className="text-xl sm:text-2xl font-bold max-w-2xl mx-auto text-black bg-[#CCFF00] p-4 rounded-2xl border-4 border-black shadow-[6px_6px_0px_#000000] -rotate-1">
          The unapologetic AI creative director grading your resume with zero filter.
        </p>
      </header>

      {/* Hero Dropzone Section */}
      <section className="max-w-4xl mx-auto">
        <SpotlightCard 
          spotlightColor="rgba(204, 255, 0, 0.4)" 
          className="rounded-3xl border-6 border-black bg-white p-8 sm:p-12 text-center"
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative rounded-2xl border-4 border-dashed border-black p-8 sm:p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-6",
              isDragging ? "bg-[#CCFF00]/40 border-solid scale-[0.99]" : "bg-[#F4F4F0] hover:bg-[#CCFF00]/15"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="application/pdf"
              className="hidden"
            />

            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-[#7000FF] border-4 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center text-white -rotate-6 transition-transform group-hover:rotate-0">
                <UploadCloud size={48} strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#FF4500] text-white p-2 rounded-full border-3 border-black shadow-[2px_2px_0px_#000000] rotate-12">
                <Flame size={20} />
              </div>
            </div>

            {!file ? (
              <div className="space-y-2">
                <h3 className="text-3xl font-heading font-black uppercase">
                  DROP YOUR RESUME HERE (PDF)
                </h3>
                <p className="text-lg font-bold text-gray-700">
                  Or click anywhere to upload. Prepare for truth.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 bg-[#CCFF00] text-black px-6 py-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000000] font-black text-xl rotate-1">
                  <FileText size={28} />
                  <span>{file.name}</span>
                  <span className="text-xs bg-black text-white px-2 py-1 rounded-md ml-2">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-600">Click to swap file</p>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <SkiperButton
              variant="yellow"
              size="xl"
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              icon={isAnalyzing ? <RotateCcw className="animate-spin" size={28} /> : <Flame size={28} />}
              className="w-full sm:w-auto"
            >
              {isAnalyzing ? (
                <DecryptedText text="ANALYZING RESUME..." speed={30} />
              ) : (
                "ROAST MY CV NOW"
              )}
            </SkiperButton>

            {file && (
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setError(null);
                }}
                className="px-6 py-4 rounded-2xl border-4 border-black bg-white font-black text-lg shadow-[4px_4px_0px_#000000] hover:bg-gray-100 active:translate-y-1"
              >
                Clear File
              </button>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-2xl bg-[#FF0055] text-white border-4 border-black font-bold flex items-center justify-center gap-3 shadow-[4px_4px_0px_#000000]"
            >
              <AlertCircle size={24} />
              <span>{error}</span>
            </motion.div>
          )}
        </SpotlightCard>
      </section>

      {/* Analysis Output Dashboard */}
      <AnimatePresence>
        {result && (
          <motion.section
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
            className="space-y-12 pt-8"
          >
            {/* Top Score Banner (Pitch Deck Style) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              
              {/* Score Gauge */}
              <div className="md:col-span-5 rounded-3xl border-4 border-black bg-[#FF4500] text-white p-8 shadow-[8px_8px_0px_#000000] flex flex-col items-center justify-center text-center relative overflow-hidden -rotate-1">
                <div className="absolute top-4 left-4 bg-black text-[#CCFF00] text-xs font-black px-3 py-1 rounded-full border-2 border-white uppercase tracking-widest">
                  SCORECARD VERDICT
                </div>
                <div className="text-8xl sm:text-9xl font-heading font-black tracking-tight my-4 drop-shadow-[4px_4px_0px_#000000]">
                  {result.overall_score}
                  <span className="text-4xl text-[#CCFF00]">/100</span>
                </div>
                <div className="bg-black text-white px-6 py-2 rounded-xl border-3 border-white font-black text-lg uppercase tracking-wider rotate-2 shadow-[2px_2px_0px_#FFFFFF]">
                  {result.overall_score >= 80 ? "🔥 AGENCY APPROVED" : result.overall_score >= 60 ? "⚠️ NEEDS HEAVY WORK" : "💀 TOTAL REWRITE NEEDED"}
                </div>
              </div>

              {/* Agency Verdict */}
              <div className="md:col-span-7 rounded-3xl border-4 border-black bg-[#CCFF00] text-black p-8 shadow-[8px_8px_0px_#000000] flex flex-col justify-between rotate-1">
                <div className="space-y-3">
                  <span className="sticker-badge bg-[#7000FF] text-white">
                    CREATIVE DIRECTOR'S VERDICT
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-heading font-black leading-tight uppercase">
                    "{result.agency_verdict}"
                  </h3>
                </div>
                <div className="pt-6 border-t-3 border-black/20 flex items-center justify-between text-sm font-black uppercase">
                  <span>PITCH DECK ROAST</span>
                  <span className="flex items-center gap-1 text-[#7000FF]">
                    <Sparkles size={16} /> 100% BLUNT
                  </span>
                </div>
              </div>

            </div>

            {/* Bento Grid Feedback (Pitch Deck Cards Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Design Card */}
              <SpotlightCard 
                spotlightColor="rgba(255, 255, 255, 0.2)"
                className="rounded-3xl border-4 border-black bg-[#7000FF] text-white shadow-[8px_8px_0px_#000000] flex flex-col -rotate-1"
              >
                <div className="p-6 border-b-4 border-black bg-black text-[#CCFF00] flex items-center justify-between">
                  <h3 className="text-2xl font-heading font-black uppercase flex items-center gap-2">
                    🎨 Design & Layout
                  </h3>
                  <span className="text-xs bg-[#7000FF] text-white px-2 py-1 rounded font-bold">CARD 01</span>
                </div>
                <div className="p-6 text-lg font-bold leading-relaxed space-y-4 flex-1">
                  <p>{result.design_critique}</p>
                </div>
              </SpotlightCard>

              {/* Impact Card */}
              <SpotlightCard 
                spotlightColor="rgba(204, 255, 0, 0.2)"
                className="rounded-3xl border-4 border-black bg-[#FF4500] text-white shadow-[8px_8px_0px_#000000] flex flex-col rotate-1"
              >
                <div className="p-6 border-b-4 border-black bg-black text-[#FF4500] flex items-center justify-between">
                  <h3 className="text-2xl font-heading font-black uppercase flex items-center gap-2">
                    💥 Impact & ROI
                  </h3>
                  <span className="text-xs bg-[#FF4500] text-white px-2 py-1 rounded font-bold">CARD 02</span>
                </div>
                <div className="p-6 text-lg font-bold leading-relaxed space-y-4 flex-1">
                  <p>{result.impact_critique}</p>
                </div>
              </SpotlightCard>

              {/* Phrasing Card */}
              <SpotlightCard 
                spotlightColor="rgba(112, 0, 255, 0.2)"
                className="rounded-3xl border-4 border-black bg-[#0055FF] text-white shadow-[8px_8px_0px_#000000] flex flex-col -rotate-1"
              >
                <div className="p-6 border-b-4 border-black bg-black text-white flex items-center justify-between">
                  <h3 className="text-2xl font-heading font-black uppercase flex items-center gap-2">
                    📝 Buzzwords & Voice
                  </h3>
                  <span className="text-xs bg-[#0055FF] text-white px-2 py-1 rounded font-bold">CARD 03</span>
                </div>
                <div className="p-6 text-lg font-bold leading-relaxed space-y-4 flex-1">
                  <p>{result.phrasing_critique}</p>
                </div>
              </SpotlightCard>

            </div>

            {/* Quick Fixes Checklist Section */}
            {result.quick_fixes && result.quick_fixes.length > 0 && (
              <div className="rounded-3xl border-4 border-black bg-[#CCFF00] p-8 shadow-[8px_8px_0px_#000000] space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-black pb-4">
                  <div>
                    <span className="sticker-badge bg-black text-white mb-2">ACTION PLAN</span>
                    <h3 className="text-4xl font-heading font-black uppercase">
                      ⚡ IMMEDIATE FIXES REQUIRED
                    </h3>
                  </div>
                  <div className="text-sm font-black bg-white px-4 py-2 rounded-xl border-3 border-black shadow-[2px_2px_0px_#000000]">
                    CHECK AS YOU FIX
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.quick_fixes.map((fix, idx) => {
                    const isChecked = !!completedFixes[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleFix(idx)}
                        className={cn(
                          "p-4 rounded-2xl border-3 border-black bg-white cursor-pointer transition-all flex items-start gap-4 shadow-[4px_4px_0px_#000000] hover:-translate-y-0.5",
                          isChecked && "bg-black text-white line-through opacity-80"
                        )}
                      >
                        <div className="mt-1 text-black">
                          {isChecked ? (
                            <CheckSquare className="text-[#CCFF00]" size={24} />
                          ) : (
                            <Square size={24} />
                          )}
                        </div>
                        <span className="text-lg font-black">{fix}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extracted Skills Cloud */}
            <div className="rounded-3xl border-4 border-black bg-white p-8 shadow-[8px_8px_0px_#000000] space-y-6">
              <div className="flex items-center justify-between border-b-4 border-black pb-4">
                <h3 className="text-3xl font-heading font-black uppercase flex items-center gap-2">
                  🏷️ DETECTED SKILLS & KEYWORDS
                </h3>
                <span className="text-xs font-black bg-[#7000FF] text-white px-3 py-1 rounded-full border-2 border-black">
                  {result.extracted_skills.length} FOUND
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {result.extracted_skills.map((skill, index) => {
                  const bgColors = ["bg-[#7000FF] text-white", "bg-[#CCFF00] text-black", "bg-[#FF4500] text-white", "bg-[#0055FF] text-white"];
                  const colorClass = bgColors[index % bgColors.length];
                  const rotate = index % 2 === 0 ? "rotate-2" : "-rotate-2";
                  return (
                    <span
                      key={index}
                      className={cn(
                        "px-5 py-2 rounded-full border-3 border-black font-black text-lg shadow-[3px_3px_0px_#000000] transition-transform hover:scale-110 cursor-default",
                        colorClass,
                        rotate
                      )}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Retro Terminal Raw Log */}
            <div className="terminal-box">
              <div className="flex items-center justify-between border-b-2 border-[#CCFF00]/30 pb-3 mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <TerminalIcon size={16} />
                  <span>AGENCY_ROAST_ENGINE_OUTPUT.LOG</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-400">[SYSTEM] Resume analysis complete. Generating pitch deck critique...</p>
                <p className="text-[#CCFF00]">✓ Overall Score: {result.overall_score}/100</p>
                <p className="text-[#FF4500]">✓ Design Critique: {result.design_critique}</p>
                <p className="text-[#0055FF]">✓ Impact Critique: {result.impact_critique}</p>
                <p className="text-[#7000FF]">✓ Phrasing Critique: {result.phrasing_critique}</p>
                <p className="text-white pt-2 animate-blink">_ READY FOR NEXT RESUME SUBMISSION...</p>
              </div>
            </div>

          </motion.section>
        )}
      </AnimatePresence>

      {/* Pop-Art API Key Modal Overlay */}
      <AnimatePresence>
        {showKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl border-6 border-black p-8 max-w-lg w-full shadow-[12px_12px_0px_#000000] space-y-6 relative -rotate-1"
            >
              <div className="flex items-center justify-between border-b-4 border-black pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#CCFF00] border-3 border-black flex items-center justify-center text-xl font-bold">
                    🔑
                  </div>
                  <h3 className="text-3xl font-heading font-black uppercase">
                    GEMINI API KEY
                  </h3>
                </div>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="w-10 h-10 rounded-xl bg-black text-white font-black text-xl hover:bg-[#FF4500] transition-colors border-2 border-black"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-base font-bold text-gray-800">
                  Enter your free Gemini API Key so you can roast unlimited resumes without hitting shared rate limits!
                </p>
                <div className="bg-[#F4F4F0] p-4 rounded-2xl border-3 border-black text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>Don't have a key yet?</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#7000FF] text-white px-3 py-1.5 rounded-lg border-2 border-black font-black uppercase hover:bg-black transition-colors"
                  >
                    GET FREE KEY 🚀
                  </a>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider block text-black">
                    Your Gemini API Key:
                  </label>
                  <input
                    type="password"
                    value={tempKeyInput}
                    onChange={(e) => setTempKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-3 rounded-2xl border-4 border-black font-mono text-sm bg-white focus:outline-none focus:ring-4 focus:ring-[#CCFF00] shadow-[4px_4px_0px_#000000]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => saveApiKey(tempKeyInput)}
                  className="flex-1 bg-[#CCFF00] text-black font-black text-lg py-3 px-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000000] hover:bg-[#B8E600] active:translate-y-0.5 transition-all uppercase"
                >
                  SAVE KEY
                </button>
                {apiKey && (
                  <button
                    onClick={() => {
                      setTempKeyInput("");
                      saveApiKey("");
                    }}
                    className="bg-[#FF0055] text-white font-black text-sm py-3 px-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000000] hover:bg-black transition-all uppercase"
                  >
                    REMOVE KEY
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
