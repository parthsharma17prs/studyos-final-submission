'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  LuUpload,
  LuBrain,
  LuFileText,
  LuBookOpen,
  LuTrendingUp,
  LuDownload,
  LuChevronLeft,
  LuChevronRight,
  LuZap,
  LuCircleHelp,
  LuCircleCheck,
  LuHistory,
  LuVideo,
  LuImage,
  LuPresentation,
  LuTrash2,
  LuVolume2,
  LuVolumeX
} from 'react-icons/lu';
import Flashcards from '@/components/student/Flashcards';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

/**
 * Study Notes + Quiz Generator — Core feature
 * Premium design with Sample Quiz and Flashcards integration
 */

// ─── TYPES ───
interface SummaryItem {
  heading: string;
  description: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  topic: string;
}

interface KeyTerm {
  term: string;
  definition: string;
}

interface StudyData {
  summary: SummaryItem[];
  youtube_recommendations?: { title: string; search_query: string }[];
  quiz: QuizQuestion[];
  keyTerms: KeyTerm[];
  studyStrategy: string;
  confabulationFlags: number[];
}

type Difficulty = 'easy' | 'medium' | 'hard';
type Language = 'English' | 'Hindi' | 'Hinglish';
type ViewMode = 'input' | 'results';
type ResultTab = 'summary' | 'quiz' | 'terms' | 'results';

const sampleStudyData: StudyData = {
  summary: [
    {
      heading: "Artificial Intelligence (AI)",
      description: "AI refers to the simulation of human intelligence in machines that are programmed to think like humans and mimic their actions. The term may also be applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving."
    },
    {
      heading: "Machine Learning (ML)",
      description: "A subset of AI that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. It focuses on the development of computer programs that can access data and use it to learn for themselves."
    },
    {
      heading: "Deep Learning",
      description: "A subfield of machine learning based on artificial neural networks with multiple layers (hence 'deep'). It is especially powerful for tasks like image recognition, natural language processing, and advanced pattern detection."
    },
    {
      heading: "Natural Language Processing (NLP)",
      description: "NLP is a branch of AI that helps computers understand, interpret, and manipulate human language. It is used in applications like translation services, voice-controlled assistants, and sentiment analysis."
    },
    {
      heading: "Computer Vision",
      description: "Computer Vision allows machines to identify and process images in the same way that human vision does. This involves algorithms that can categorize objects, detect motion, and even track human faces."
    }
  ],
  quiz: [
    {
      question: "What is the primary goal of Machine Learning?",
      options: ["To create machines that can perform physical tasks", "To enable machines to learn from data without explicit programming", "To replicate human consciousness", "To build faster computers"],
      correct: 1,
      explanation: "Machine learning focuses on teaching computers to learn from data and improve their performance over time without being specifically programmed for setiap task.",
      topic: "Machine Learning Basics"
    },
    {
      question: "Which field of AI deals with the interaction between computers and human language?",
      options: ["Computer Vision", "Robotics", "Natural Language Processing (NLP)", "Expert Systems"],
      correct: 2,
      explanation: "NLP is the branch of AI that gives computers the ability to understand and respond to text or voice data.",
      topic: "NLP"
    },
    {
      question: "What are Neural Networks inspired by?",
      options: ["Computer hardware architecture", "Biological brains", "Mathematical equations", "Social networks"],
      correct: 1,
      explanation: "Artificial neural networks are computing systems vaguely inspired by the biological neural networks that constitute animal brains.",
      topic: "Deep Learning"
    }
  ],
  keyTerms: [
    { term: "Algorithm", definition: "A set of rules or steps followed by a computer to solve a problem or perform a task." },
    { term: "Neural Network", definition: "A complex network of algorithms modeled after the human brain, used in deep learning." },
    { term: "Supervised Learning", definition: "A type of machine learning where the model is trained on labeled data." },
    { term: "Reinforcement Learning", definition: "Learning through trial and error, based on rewards and penalties." }
  ],
  studyStrategy: "Focus on understanding the hierarchy of AI -> Machine Learning -> Deep Learning. Spend more time on the practical applications of NLP and Computer Vision as they are trending topics.",
  confabulationFlags: []
};

// --- Injected by AI ---
const StaggeredImage = ({ prompt, width, height, className, index = 0 }: { prompt: string, width: number, height: number, className?: string, index?: number }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cleanPrompt = encodeURIComponent(prompt.substring(0, 400));
      setSrc(`https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 1000)}`);
    }, index * 4000);

    return () => clearTimeout(timer);
  }, [prompt, index, width, height]);

  if (error) {
    return <div className={`flex items-center justify-center bg-purple-900/20 text-purple-400 text-xs text-center border border-purple-500/20 ${className}`}>Image Failed<br/>(Rate Limited)</div>;
  }

  if (!src) {
    return <div className={`flex items-center justify-center bg-purple-900/10 text-purple-500/50 text-xs animate-pulse border border-purple-500/10 ${className}`}>Queueing...</div>;
  }

  return (
    <img 
      src={src} 
      alt="Generated Mind Map Content" 
      className={className} 
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};
// ----------------------

export default function StudyPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [language, setLanguage] = useState<Language>('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [activeFormat, setActiveFormat] = useState<'text' | 'image' | 'video' | 'ppt'>('text');
  const [activeTab, setActiveTab] = useState<ResultTab>('summary');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');
  
  // Past Sessions
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedContent, setTransformedContent] = useState<any>(null);

  const handleTransform = async (targetFormat: string) => {
    if (!studyData) return;
    setIsTransforming(true);
    try {
      const response = await fetch('/api/groq/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: targetFormat,
          summaryData: studyData,
        }),
      });

      if (!response.ok) throw new Error('Failed to transform');

      const data = await response.json();
      setTransformedContent(data);
      setActiveFormat(targetFormat as any);
      
      // We will render it directly below the Deep Summary header
    } catch (err: any) {
      console.error(err);
      setError('Transformation failed: ' + err.message);
    } finally {
      setIsTransforming(false);
    }
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const q = query(collection(db, 'studySessions'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const sessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPastSessions(sessions);
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        setIsLoadingSessions(false);
      }
    };
    fetchSessions();
  }, []);

  const loadPastSession = (session: any) => {
    setStudyData(session.data);
    setViewMode('results');
    setActiveTab('summary');
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'studySessions', sessionId));
      setPastSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const loadSample = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setStudyData(sampleStudyData);
      setViewMode('results');
      setActiveTab('summary');
      setIsGenerating(false);
    }, 1500);
  };

  const handleGenerate = async () => {
    if (!inputText.trim() && !file) {
      setError('Please paste some text or upload a file.');
      return;
    }
    setError('');
    setIsGenerating(true);
    
    try {
      // 1. Generate Summary and Key Terms using existing endpoint
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (inputText.trim()) formData.append('content', inputText);
      formData.append('difficulty', difficulty);
      formData.append('language', language);
      formData.append('questionCount', String(questionCount));

      const summaryResponse = await fetch('/api/groq/summarize', {
        method: 'POST',
        body: formData,
      });
      
      const summaryData = await summaryResponse.json();
      
      if (summaryData.error) {
        throw new Error(summaryData.error);
      }

      // 2. Generate Structured Quiz using new Quiz endpoint (LSTM/Framework style)
      const quizResponse = await fetch('/api/groq/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: inputText || (summaryData.summary && Array.isArray(summaryData.summary) ? summaryData.summary.map((s: any) => `${s.heading}: ${s.description}`).join(' ') : ''),
          difficulty: difficulty,
          questionCount: questionCount
        }),
      });

      const rawQuizData = await quizResponse.json();
      if (rawQuizData.error) {
        throw new Error("Quiz Error: " + rawQuizData.error);
      }
      
      // Transform new quiz data to match existing UI structure
      const formattedQuiz = Array.isArray(rawQuizData) ? rawQuizData.map((q: any) => ({
        question: q.question || "Unknown Question",
        options: q.options ? Object.values(q.options) : ["A", "B", "C", "D"],
        correct: ['A', 'B', 'C', 'D'].indexOf(q.correct_answer_key || 'A'),
        explanation: q.correct_answer_text || "",
        topic: q.topic || 'General'
      })) : summaryData.quiz;

      const fullData = {
        ...summaryData,
        quiz: formattedQuiz || []
      };
      
      // Save to Firebase
      try {
        const sessionTitle = (inputText.trim() ? inputText.substring(0, 40) : (file ? file.name : "Untitled Session")) + (inputText.length > 40 ? "..." : "");
        const docRef = await addDoc(collection(db, 'studySessions'), {
          title: sessionTitle,
          data: fullData,
          createdAt: serverTimestamp()
        });
        setPastSessions(prev => [{
            id: docRef.id, 
            title: sessionTitle,
            data: fullData,
            createdAt: new Date()
        }, ...prev]);
      } catch (firebaseErr) {
        console.error('Firebase save error:', firebaseErr);
      }

      setStudyData(fullData);
      setViewMode('results');
      setActiveTab('summary');
    } catch (err: any) {
      console.error('Generation Error:', err);
      setError(err.message || 'AI service is temporarily unavailable.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuizSubmit = () => {
    if (!studyData) return;
    let correct = 0;
    studyData.quiz.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct) correct++;
    });
    setScore(Math.round((correct / studyData.quiz.length) * 100));
    setQuizSubmitted(true);
    setActiveTab('results');
  };

  if (viewMode === 'input') {
    return (
      <div className="max-w-7xl mx-auto flex gap-8">
        {/* Sidebar for Past Chats/Sessions */}
        <div className="w-80 shrink-0 bg-os-card border border-os-border rounded-3xl p-6 hidden lg:flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-widest text-os-muted mb-6 flex items-center gap-2">
            <LuHistory /> Past Sessions
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {isLoadingSessions ? (
              <div className="text-xs text-os-muted animate-pulse">Loading...</div>
            ) : pastSessions.length === 0 ? (
              <div className="text-xs text-os-muted italic">No past sessions found.</div>
            ) : (
              pastSessions.map(session => (
                <div key={session.id} className="relative group/item">
                  <button
                    onClick={() => loadPastSession(session)}
                    className="w-full text-left p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-os-border transition-all group pr-12"
                  >
                    <p className="text-sm font-bold text-white truncate max-w-full">
                      {session.title || 'Untitled Session'}
                    </p>
                    <p className="text-[10px] text-os-muted uppercase mt-1 flex items-center gap-2">
                       <span className="bg-student-accent/20 text-student-accent px-1.5 py-0.5 rounded-sm">Notes</span>
                    </p>
                  </button>
                  <button 
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-os-muted hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-500/10 rounded-lg"
                    title="Delete Session"
                  >
                    <LuTrash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Input Area */}
        <div className="flex-1 space-y-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tighter mb-2">Generate Study Set</h2>
              <p className="text-os-muted text-sm uppercase tracking-widest font-bold">Paste notes. Get AI magic.</p>
            </div>
            <button
              onClick={loadSample}
              className="btn-ghost flex items-center gap-2 border-student-accent text-student-accent bg-student-accent/5 hover:bg-student-accent/10 animate-pulse transition-all"
            >
              <LuZap size={16} /> Try Sample Data
            </button>
          </div>

        {/* Text Input Area */}
        <div className="relative group">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your lecture notes, chapter text, or lecture content here..."
            className="w-full h-80 bg-os-card border-2 border-os-border rounded-3xl p-8 text-white placeholder-os-muted/50 resize-none focus:border-student-accent/50 focus:outline-none transition-all text-base leading-relaxed group-hover:bg-white/[0.01]"
          />
          <div className="absolute bottom-6 right-6 text-[10px] font-black text-os-muted uppercase tracking-widest bg-black px-3 py-1 rounded-full border border-os-border">
            {inputText.length} Characters
          </div>
        </div>

        {/* File Upload */}
        <div className="flex items-center gap-6">
          <label className="btn-ghost cursor-pointer flex items-center gap-2 text-xs uppercase tracking-widest font-black">
            <LuUpload size={16} className="text-student-accent" />
            {file ? file.name : 'Upload PDF / Image'}
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                if(e.target.files && e.target.files.length > 0) {
                  setFile(e.target.files[0]);
                }
              }}
              className="hidden" 
            />
          </label>
          <span className="text-[10px] text-os-muted uppercase tracking-[0.2em] font-bold">
            {file ? 'File Attached Successfully' : 'OCR & Vision Powered'}
          </span>
          {file && (
            <button 
              onClick={() => setFile(null)} 
              className="text-[10px] text-red-500 uppercase font-bold hover:underline"
            >
              Remove
            </button>
          )}
        </div>

        <div className="ribbon-student" />

        {/* Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] text-os-muted uppercase tracking-[0.2em] font-black block mb-4">Difficulty</label>
            <div className="flex flex-col gap-2">
              {['easy', 'medium', 'hard'].map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d as Difficulty)}
                  className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${difficulty === d ? 'bg-student-accent border-student-accent text-white' : 'bg-transparent border-os-border text-os-muted hover:border-os-muted'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-os-muted uppercase tracking-[0.2em] font-black block mb-4">Questions: {questionCount}</label>
            <input
              type="range"
              min={3}
              max={15}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full h-1 bg-os-border rounded-lg appearance-none cursor-pointer accent-student-accent mt-4"
            />
          </div>

          <div>
            <label className="text-[10px] text-os-muted uppercase tracking-[0.2em] font-black block mb-4">Language</label>
            <div className="flex flex-col gap-2">
              {['English', 'Hindi', 'Hinglish'].map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l as Language)}
                  className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${language === l ? 'bg-student-accent border-student-accent text-white' : 'bg-transparent border-os-border text-os-muted hover:border-os-muted'
                    }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || (!inputText.trim() && !file)}
          className={`
            w-full py-6 rounded-2xl text-xl font-black uppercase tracking-[0.2em]
            transition-all duration-500
            ${isGenerating || (!inputText.trim() && !file)
              ? 'bg-os-border text-os-muted cursor-not-allowed opacity-50'
              : 'btn-primary-student'
            }
          `}
        >
          {isGenerating ? 'Analyzing Knowledge...' : 'Generate Knowledge Set'}
        </button>

        {/* Premium Generating Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-10 animate-fade-in">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-student-accent/20 border-t-student-accent animate-spin" />
              <LuBrain size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-student-accent animate-pulse" />
            </div>
            <h3 className="text-3xl font-black tracking-tighter mb-4 animate-pulse">Analyzing Knowledge</h3>
            <p className="text-os-muted text-sm max-w-xs uppercase tracking-widest leading-relaxed">
              Feeding notes to the neural engine. <br />
              Mapping concepts. <br />
              Generating 3D flashcards.
            </p>
            <div className="w-64 h-1 bg-os-border rounded-full mt-12 overflow-hidden">
              <div className="h-full bg-student-accent animate-ribbon-move" style={{ width: '60%' }} />
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

  if (!studyData) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setViewMode('input')}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-os-muted hover:text-white transition-all group"
        >
          <LuChevronLeft className="group-hover:-translate-x-1 transition-transform" /> New Study Session
        </button>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(studyData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'study_session.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="btn-ghost flex items-center gap-2 border-student-accent/20 text-xs text-student-accent hover:bg-student-accent/10 transition-all"
        >
          <LuDownload size={14} /> Download JSON
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-os-card p-1.5 rounded-2xl border border-os-border">
        {[
          { key: 'summary', label: 'Summary', icon: LuFileText },
          { key: 'quiz', label: 'Quiz', icon: LuBrain },
          { key: 'terms', label: 'Flashcards', icon: LuBookOpen },
          { key: 'results', label: 'Analytics', icon: LuTrendingUp, disabled: !quizSubmitted },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && setActiveTab(tab.key as ResultTab)}
            disabled={tab.disabled}
            className={`
              flex-1 py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
              flex items-center justify-center gap-3
              ${activeTab === tab.key
                ? 'bg-student-accent text-white shadow-[0_4px_20px_rgba(229,9,20,0.3)]'
                : tab.disabled ? 'opacity-20 cursor-not-allowed' : 'text-os-muted hover:text-white hover:bg-white/5'
              }
            `}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="ribbon-student" />

      {/* Content Rendering */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 gap-4 animate-fade-up">

          {/* Transformation Controls */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => handleTransform('image')}
              disabled={isTransforming}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                ${activeFormat === 'image' && transformedContent ? 'bg-purple-500/20 border-purple-500 border text-purple-400' : 'bg-os-card border border-os-border text-os-muted hover:text-white'}
              `}
            >
              📷 Generate Mind Map
            </button>
            <button
              onClick={() => handleTransform('video')}
              disabled={isTransforming}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                ${activeFormat === 'video' && transformedContent ? 'bg-red-500/20 border-red-500 border text-red-400' : 'bg-os-card border border-os-border text-os-muted hover:text-white'}
              `}
            >
              🎬 Generate Video Script
            </button>
            <button
              onClick={() => handleTransform('ppt')}
              disabled={isTransforming}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                ${activeFormat === 'ppt' && transformedContent ? 'bg-orange-500/20 border-orange-500 border text-orange-400' : 'bg-os-card border border-os-border text-os-muted hover:text-white'}
              `}
            >
              📊 Generate Presentation
            </button>
          </div>

          {isTransforming && (
            <div className="text-center py-10">
              <span className="loading loading-spinner loading-lg text-student-accent"></span>
              <p className="mt-4 text-sm font-bold text-os-muted uppercase tracking-widest animate-pulse">
                Transforming Content...
              </p>
            </div>
          )}

          {transformedContent && !isTransforming && (
             <div className="mb-10 bg-os-card border border-os-border p-6 rounded-2xl">
               <h3 className="text-2xl font-black mb-4 text-student-accent capitalize">
                 {activeFormat} Generation Result
               </h3>
               
               {activeFormat === 'image' && (
                 <div>
                   <p className="text-sm text-os-muted mb-4">Generated Mind Map Image:</p>
                   {transformedContent.mind_map_prompt && (
                     <div className="w-full flex justify-center mb-6">
                       <StaggeredImage 
                         prompt={transformedContent.mind_map_prompt}
                         width={800} height={400}
                         className="rounded-xl border border-purple-500/30 max-w-full min-h-[400px]"
                         index={0}
                       />
                     </div>
                   )}
                   <code className="block p-4 bg-black/50 rounded-xl text-purple-400 mb-6 whitespace-pre-wrap">
                     {transformedContent.mind_map_prompt}
                   </code>
                   <h4 className="font-bold mb-2">Visual Branch Data:</h4>
                   <div className="space-y-4">
                     {transformedContent.summary?.map((item: any, i: number) => (
                       <div key={i} className="p-4 border border-purple-500/20 bg-purple-500/5 rounded-xl">
                         <h5 className="font-bold text-white mb-2">{item.heading}</h5>
                         <p className="text-sm text-os-muted mb-2">{item.description}</p>
                         <div className="flex gap-4 items-start mt-4">
                           <div className="flex-1">
                             <p className="text-xs text-purple-300"><strong>Visual Prompt:</strong> {item.visual_prompt}</p>
                           </div>
                           <StaggeredImage 
                             prompt={item.visual_prompt || item.heading}
                             width={200} height={200}
                             className="rounded-lg w-24 h-24 object-cover shrink-0"
                             index={i + 1}
                           />
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {activeFormat === 'video' && (
                 <div className="space-y-6">
                   {transformedContent.summary?.map((item: any, i: number) => (
                     <div key={i} className="p-4 border border-red-500/20 bg-red-500/5 rounded-xl flex gap-4">
                       <div className="font-black text-red-400">{item.timestamp}</div>
                       <div>
                         <h5 className="font-bold text-white mb-2">{item.heading}</h5>
                         <p className="text-sm text-white/80">{item.description}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}

               {activeFormat === 'ppt' && (
                 <div>
                    <h4 className="font-bold text-orange-400 mb-4">Detailed Outline</h4>
                    <div className="p-4 border border-orange-500/20 bg-orange-500/5 rounded-xl mb-6 whitespace-pre-wrap text-sm">
                      {transformedContent.presentation_outline}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {transformedContent.summary?.map((item: any, i: number) => (
                        <div key={i} className="p-4 border border-orange-500/20 bg-orange-500/5 rounded-xl">
                          <h5 className="font-bold text-white mb-2">Slide {i+1}: {item.heading}</h5>
                          <p className="text-xs text-os-muted">{item.description}</p>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
             </div>
          )}

          <h3 className="text-4xl font-black tracking-tighter mb-8 italic drop-shadow-2xl">
            Deep <span className="text-student-accent">Summary</span>
          </h3>
          {studyData.summary.map((item, i) => (
            <details
              key={i}
              className="glass-card group transition-all duration-500 overflow-hidden open:ring-2 open:ring-student-accent/30"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <summary className="p-8 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-colors list-none">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-student-accent/10 border border-student-accent/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-student-accent/5">
                    <span className="text-student-accent font-black text-lg">{i + 1}</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-black tracking-tight group-hover:text-student-accent transition-colors">
                      {item.heading}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        isSpeaking ? stopSpeaking() : speak(`${item.heading}. ${item.description}`);
                      }}
                      className="mt-2 text-os-muted hover:text-student-accent flex items-center gap-2 transition-colors z-10 relative"
                    >
                      {isSpeaking ? (
                        <>
                          <LuVolumeX size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Stop Dictation</span>
                        </>
                      ) : (
                        <>
                          <LuVolume2 size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Start Dictation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-os-border flex items-center justify-center group-hover:border-student-accent group-hover:bg-student-accent/10 transition-all">
                  <LuChevronRight size={18} className="text-os-muted group-hover:text-student-accent group-open:rotate-90 transition-transform" />
                </div>
              </summary>
              <div className="px-8 pb-10 mt-2 animate-in slide-in-from-top-4 duration-500">
                <div className="pl-18 border-l-2 border-student-accent/20">
                  <p className="text-base font-medium leading-relaxed text-os-muted/80 whitespace-pre-wrap selection:bg-student-accent/30 drop-shadow-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="space-y-8 animate-fade-up">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black tracking-tighter">AI Quiz</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-os-muted px-4 py-2 border border-os-border rounded-full">
              {Object.keys(selectedAnswers).length} / {studyData.quiz.length} Answered
            </span>
          </div>
          <div className="space-y-8">
            {studyData.quiz.map((q, qi) => (
              <div key={qi} className="glass-card p-10 group">
                <div className="flex items-start gap-4 mb-8">
                  <LuCircleHelp size={24} className="text-student-accent shrink-0 mt-1" />
                  <p className="text-xl font-black tracking-tight leading-tight">{q.question}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {q.options.map((opt, oi) => {
                    const isSelected = selectedAnswers[qi] === oi;
                    const isCorrect = quizSubmitted && oi === q.correct;
                    const isWrong = quizSubmitted && isSelected && oi !== q.correct;

                    return (
                      <button
                        key={oi}
                        onClick={() => !quizSubmitted && setSelectedAnswers(prev => ({ ...prev, [qi]: oi }))}
                        disabled={quizSubmitted}
                        className={`
                          p-6 rounded-2xl text-left text-sm font-bold transition-all border-2
                          ${isCorrect ? 'bg-student-accent border-student-accent text-white shadow-[0_0_30px_rgba(229,9,20,0.3)]' :
                            isWrong ? 'bg-os-border border-os-border text-os-muted opacity-50' :
                              isSelected ? 'bg-student-accent/10 border-student-accent text-white' : 'bg-transparent border-os-border text-os-muted hover:border-os-muted hover:text-white'}
                        `}
                      >
                        <span className="inline-block w-8 font-black text-student-accent opacity-50">{String.fromCharCode(65 + oi)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && (
                  <div className="mt-8 p-6 bg-white/[0.02] rounded-2xl border border-os-border text-xs leading-relaxed text-os-muted">
                    <span className="font-black text-white uppercase tracking-widest block mb-2">AI Explanation</span>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
          {!quizSubmitted && (
            <button
              onClick={handleQuizSubmit}
              disabled={Object.keys(selectedAnswers).length < studyData.quiz.length}
              className={`w-full py-6 rounded-2xl text-xl font-black uppercase tracking-[0.2em] transition-all
                ${Object.keys(selectedAnswers).length === studyData.quiz.length ? 'btn-primary-student' : 'bg-os-border text-os-muted cursor-not-allowed'}
              `}
            >
              Submit Knowledge Test
            </button>
          )}
        </div>
      )}

      {activeTab === 'terms' && (
        <div className="space-y-8 animate-fade-up">
          <h3 className="text-3xl font-black tracking-tighter">Flashcards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {studyData.keyTerms.map((term, i) => (
              <Flashcards key={i} term={term.term} definition={term.definition} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'results' && quizSubmitted && (
        <div className="space-y-12 animate-fade-up text-center py-20">
          <div className="relative inline-block">
            <div className={`text-9xl font-black ${score >= 70 ? 'text-student-accent glow-text-red' : 'text-os-muted'}`}>
              {score}%
            </div>
            <LuCircleCheck size={40} className="absolute -top-4 -right-4 text-student-accent animate-bounce" />
          </div>
          <div className="max-w-xl mx-auto space-y-6">
            <h4 className="text-3xl font-black tracking-tight leading-tight">
              {score >= 80 ? 'Mastery Achieved.' : 'Keep Grinding.'}
            </h4>
            <p className="text-os-muted text-lg leading-relaxed">
              {studyData.studyStrategy}
            </p>
            <button onClick={() => setViewMode('input')} className="btn-primary-student !px-12">
              Next Study Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
