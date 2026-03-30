'use client';

import { useState } from 'react';
import { LuFileText, LuSparkles, LuBrain, LuLineChart, LuBookOpen, LuCheckCircle, LuUpload } from 'react-icons/lu';

export default function ExamPractitionerPage() {
  const [activeTab, setActiveTab] = useState<'solver' | 'generator' | 'confidence'>('solver');
  
  // Solver State
  const [questionPaperText, setQuestionPaperText] = useState('');
  const [solverResult, setSolverResult] = useState('');
  const [solving, setSolving] = useState(false);

  // Generator State
  const [templateText, setTemplateText] = useState('');
  const [notesJsonText, setNotesJsonText] = useState('');
  const [generatedPaper, setGeneratedPaper] = useState('');
  const [generatingPaper, setGeneratingPaper] = useState(false);

  // Confidence State
  const [learningNotes, setLearningNotes] = useState('');
  const [quizText, setQuizText] = useState('');
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [preScore, setPreScore] = useState(0);
  const [postScore, setPostScore] = useState(0);
  const [confidenceData, setConfidenceData] = useState<{improvement: number, accuracy: number} | null>(null);

  const handleSolve = async () => {
    if (!questionPaperText) return;
    setSolving(true);
    try {
      const res = await fetch('/api/groq/exam-practitioner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'solve', payload: { questionPaper: questionPaperText } })
      });
      const data = await res.json();
      setSolverResult(data.result || data.error);
    } catch (e) {
      console.error(e);
    }
    setSolving(false);
  };

  const handleGeneratePaper = async () => {
    if (!templateText || !notesJsonText) return;
    setGeneratingPaper(true);
    try {
      const res = await fetch('/api/groq/exam-practitioner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_paper', payload: { template: templateText, notes: notesJsonText } })
      });
      const data = await res.json();
      setGeneratedPaper(data.result || data.error);
    } catch (e) {
      console.error(e);
    }
    setGeneratingPaper(false);
  };

  const handleGenerateQuiz = async () => {
    if (!learningNotes) return;
    setGeneratingQuiz(true);
    try {
      const res = await fetch('/api/groq/exam-practitioner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_quiz', payload: { notes: learningNotes, type: 'pre' } })
      });
      const data = await res.json();
      setQuizText(data.result || data.error);
    } catch (e) {
      console.error(e);
    }
    setGeneratingQuiz(false);
  };

  const calculateConfidence = () => {
    const total = 5;
    const improvement = ((postScore - preScore) / total) * 100;
    const accuracy = (postScore / total) * 100;
    setConfidenceData({ improvement, accuracy });
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-5xl font-black tracking-tighter mb-4">
            Exam <span className="text-student-accent">Practitioner</span>
          </h1>
          <p className="text-os-muted font-bold tracking-widest uppercase text-xs">AI-Powered Question Paper Solver & Generator Framework</p>
        </div>
      </div>

      <div className="flex border-b border-os-border gap-8">
        <button 
          onClick={() => setActiveTab('solver')}
          className={`pb-4 font-black tracking-widest uppercase transition-all ${activeTab === 'solver' ? 'border-b-2 border-student-accent text-student-accent' : 'text-os-muted hover:text-white'}`}
        >
          <span className="flex items-center gap-2"><LuUpload size={18}/> Auto-Solver</span>
        </button>
        <button 
          onClick={() => setActiveTab('generator')}
          className={`pb-4 font-black tracking-widest uppercase transition-all ${activeTab === 'generator' ? 'border-b-2 border-student-accent text-student-accent' : 'text-os-muted hover:text-white'}`}
        >
          <span className="flex items-center gap-2"><LuFileText size={18}/> Paper Generator</span>
        </button>
        <button 
          onClick={() => setActiveTab('confidence')}
          className={`pb-4 font-black tracking-widest uppercase transition-all ${activeTab === 'confidence' ? 'border-b-2 border-student-accent text-student-accent' : 'text-os-muted hover:text-white'}`}
        >
          <span className="flex items-center gap-2"><LuLineChart size={18}/> Confidence Meter</span>
        </button>
      </div>

      {activeTab === 'solver' && (
        <div className="space-y-6">
          <div className="glass-card p-6 bg-gradient-to-br from-student-accent/5 to-transparent">
            <h2 className="text-xl font-black tracking-tight mb-2 flex items-center gap-2">
              <LuUpload className="text-student-accent"/> Upload Question Paper Text
            </h2>
            <textarea 
              value={questionPaperText}
              onChange={(e) => setQuestionPaperText(e.target.value)}
              placeholder="Paste the contents of your Question Paper here..."
              className="w-full h-48 bg-black/40 border border-os-border focus:border-student-accent rounded-xl p-4 text-white outline-none mb-4 resize-none"
            />
            <button 
              onClick={handleSolve}
              disabled={solving}
              className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-4 bg-student-accent hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-black transition-all hover:scale-[1.02]"
            >
              {solving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LuSparkles /> SOLVE PAPER</>}
            </button>
          </div>

          {solverResult && (
            <div className="glass-card p-8 bg-black/60 border border-student-accent/20">
              <h3 className="text-xl font-black tracking-tight text-student-accent mb-6 flex items-center gap-2">
                <LuCheckCircle /> AI Generated Solutions
              </h3>
              <div className="prose prose-invert max-w-none whitespace-pre-wrap font-medium">
                {solverResult}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="glass-card p-6 bg-gradient-to-br from-blue-500/5 to-transparent">
              <h2 className="text-xl font-black tracking-tight mb-2 flex items-center gap-2">
                <LuFileText className="text-blue-500"/> Sample Paper Template
              </h2>
              <textarea 
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                placeholder="E.g., Section A: 5 qs (2 marks)\nSection B: 3 qs (5 marks)..."
                className="w-full h-32 bg-black/40 border border-os-border focus:border-blue-500 rounded-xl p-4 text-white outline-none resize-none"
              />
            </div>
            <div className="glass-card p-6 bg-gradient-to-br from-purple-500/5 to-transparent">
              <h2 className="text-xl font-black tracking-tight mb-2 flex items-center gap-2">
                <LuBookOpen className="text-purple-500"/> Study Notes / JSON Data
              </h2>
              <textarea 
                value={notesJsonText}
                onChange={(e) => setNotesJsonText(e.target.value)}
                placeholder="Paste the conversation, JSON, or study materials here..."
                className="w-full h-32 bg-black/40 border border-os-border focus:border-purple-500 rounded-xl p-4 text-white outline-none resize-none"
              />
            </div>
            <button 
              onClick={handleGeneratePaper}
              disabled={generatingPaper}
              className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-black transition-all hover:scale-[1.02]"
            >
              {generatingPaper ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LuBrain /> GENERATE MOCK PAPER</>}
            </button>
          </div>

          <div className="glass-card p-8 bg-black/60 border border-os-border min-h-[400px]">
            <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2">
              <LuCheckCircle className="text-student-accent"/> Generated Mock Test
            </h3>
            {generatedPaper ? (
              <div className="prose prose-invert max-w-none whitespace-pre-wrap font-medium">
                {generatedPaper}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-os-muted italic text-sm font-bold">
                Output will appear here...
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'confidence' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="glass-card p-6 bg-gradient-to-br from-orange-500/5 to-transparent">
                    <h2 className="text-xl font-black tracking-tight mb-2 flex items-center gap-2">
                        <LuBrain className="text-orange-500"/> Study Notes Input
                    </h2>
                    <textarea 
                        value={learningNotes}
                        onChange={(e) => setLearningNotes(e.target.value)}
                        placeholder="Paste study material to generate Pre/Post MCQs..."
                        className="w-full h-32 bg-black/40 border border-os-border focus:border-orange-500 rounded-xl p-4 text-white outline-none mb-4 resize-none"
                    />
                    <button 
                        onClick={handleGenerateQuiz}
                        disabled={generatingQuiz}
                        className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-black transition-all hover:scale-[1.02]"
                    >
                    {generatingQuiz ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LuSparkles /> GENERATE 5 MCQs</>}
                    </button>
                </div>

                {quizText && (
                    <div className="glass-card p-6 border-orange-500/30 bg-black/50">
                        <h3 className="font-black text-orange-400 mb-4">Generated Quiz (Pre/Post)</h3>
                        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">
                            {quizText}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className="glass-card p-6 bg-gradient-to-br from-green-500/5 to-transparent">
                    <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2">
                        <LuLineChart className="text-green-500"/> Performance & Confidence Meter
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-os-muted">Pre-Test Score (0-5)</label>
                            <input 
                                type="number" 
                                min="0" max="5" 
                                value={preScore} 
                                onChange={(e) => setPreScore(Number(e.target.value))}
                                className="w-full bg-black/40 border border-os-border focus:border-green-500 rounded-xl p-4 text-white outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-os-muted">Post-Test Score (0-5)</label>
                            <input 
                                type="number" 
                                min="0" max="5" 
                                value={postScore} 
                                onChange={(e) => setPostScore(Number(e.target.value))}
                                className="w-full bg-black/40 border border-os-border focus:border-green-500 rounded-xl p-4 text-white outline-none"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={calculateConfidence}
                        className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black transition-all hover:scale-[1.02]"
                    >
                        MEASURE CONFIDENCE
                    </button>
                </div>

                {confidenceData && (
                    <div className="glass-card p-8 border-green-500/30 text-center space-y-6 bg-black/60 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-1 bg-green-500 transition-all duration-1000" style={{ width: `${confidenceData.accuracy}%` }} />
                        
                        <div>
                            <h3 className="text-4xl font-black text-white">{confidenceData.accuracy.toFixed(1)}%</h3>
                            <p className="text-xs font-black text-os-muted uppercase tracking-widest mt-1">Final Accuracy</p>
                        </div>
                        
                        <div className="w-full h-px bg-os-border" />

                        <div>
                            <h3 className={`text-3xl font-black ${confidenceData.improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {confidenceData.improvement > 0 ? '+' : ''}{confidenceData.improvement.toFixed(1)}%
                            </h3>
                            <p className="text-xs font-black text-os-muted uppercase tracking-widest mt-1">Confidence Improvement</p>
                        </div>

                        <div className="pt-4">
                            {confidenceData.improvement < 0 ? (
                                <span className="inline-block px-4 py-2 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-black text-xs tracking-widest uppercase">⚠️ Requires Review</span>
                            ) : confidenceData.improvement === 0 ? (
                                <span className="inline-block px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-black text-xs tracking-widest uppercase">😐 No Change</span>
                            ) : confidenceData.improvement > 40 ? (
                                <span className="inline-block px-4 py-2 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 font-black text-xs tracking-widest uppercase">🔥 High Confidence</span>
                            ) : (
                                <span className="inline-block px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-black text-xs tracking-widest uppercase">📈 Steady Growth</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
}
