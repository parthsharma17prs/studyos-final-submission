"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function MockTestPage() {
  const [activeTab, setActiveTab] = useState<'study-tests' | 'global'>('study-tests');
  
  // Custom Tests State
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [confidence, setConfidence] = useState<number>(50);
  const [quizState, setQuizState] = useState<'setup' | 'loading' | 'taking' | 'results'>('setup');
  
  // Quiz taking state
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  // Results
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const q = query(collection(db, 'studySessions'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSessions(docs);
      } catch (err) {
        console.error('Error fetching sessions', err);
      }
    };
    fetchSessions();
  }, []);

  const handleStartTest = async () => {
    if (!selectedSession) return;
    setQuizState('loading');
    
    if (selectedSession.data?.quiz && Array.isArray(selectedSession.data.quiz) && selectedSession.data.quiz.length > 0) {
      setQuestions(selectedSession.data.quiz);
      setQuizState('taking');
      setCurrentQIndex(0);
      setAnswers({});
      return;
    }

    try {
      const response = await fetch('/api/groq/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: JSON.stringify(selectedSession.data || selectedSession.title || '').substring(0, 3000), 
          difficulty: 'medium',
          questionCount: 5
        })
      });
      const data = await response.json();
      
      let qs = [];
      if (Array.isArray(data)) qs = data;
      else if (data.questions) qs = data.questions;
      else if (data.quiz && data.quiz.questions) qs = data.quiz.questions;
      
      setQuestions(qs);
      setQuizState('taking');
      setCurrentQIndex(0);
      setAnswers({});
    } catch (error) {
      console.error(error);
      alert('Failed to generate test.');
      setQuizState('setup');
    }
  };

  const handleSelectAnswer = (key: string) => {
    setAnswers({ ...answers, [currentQIndex]: key });
  };

  const handleNextQ = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    let finalScore = 0;
    questions.forEach((q, idx) => {
      const ans = answers[idx];
      const ansIndex = ans === 'A' ? 0 : ans === 'B' ? 1 : ans === 'C' ? 2 : 3;
      if (ans === q.correct_answer_key || ans === q.correctAnswerIndex?.toString() || ans === q.correct_answer || ansIndex === q.correct) finalScore += 1;
    });
    setScore(finalScore);
    setQuizState('results');

    try {
      await addDoc(collection(db, 'mockTestResults'), {
        sessionId: selectedSession.id,
        topic: selectedSession.title || 'Unknown Topic',
        confidence,
        score: finalScore,
        total: questions.length,
        createdAt: new Date()
      });
    } catch (e) {
      console.error('Error saving', e);
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-os-bg text-white flex flex-col">
      <div className="p-4 bg-os-card border-b border-os-border flex justify-between items-center">
        <h1 className="text-xl font-black text-student-accent">Mock Tests</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('study-tests')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'study-tests' ? 'bg-student-accent text-white' : 'bg-black text-os-muted'}`}
          >
            Study-Based Tests
          </button>
          <button 
             onClick={() => setActiveTab('global')}
             className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'global' ? 'bg-student-accent text-white' : 'bg-black text-os-muted'}`}
          >
            Global Exams (TestLFrame)
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto p-6 h-full">
        {activeTab === 'global' ? (
          <div className="w-full h-full min-h-[80vh] flex flex-col rounded-2xl overflow-hidden border border-os-border bg-[#111]">
            <iframe 
              src={process.env.NODE_ENV === 'production' ? "/global-exam/" : "http://localhost:5173"} 
              className="w-full h-full flex-1 border-none"
              title="Mock Test"
              allow="camera; microphone; fullscreen; display-capture"
            />
          </div>
        ) : (
          <div className="h-full">
            {quizState === 'setup' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[70vh]">
                <div className="bg-os-card p-6 rounded-2xl border border-os-border flex flex-col overflow-hidden">
                  <h2 className="text-lg font-bold mb-4">Your Study Sessions ({sessions.length})</h2>
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {sessions.map((session, i) => (
                      <div 
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedSession?.id === session.id ? 'border-student-accent bg-student-accent/10' : 'border-os-border bg-black hover:border-os-muted'}`}
                      >
                        <h3 className="font-bold">{session.title || session.topic || `Session ${i + 1}`}</h3>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSession ? (
                  <div className="bg-os-card p-6 rounded-2xl border border-os-border flex flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-black text-student-accent mb-2">Confidence Check</h2>
                    <p className="text-os-muted mb-8">How confident are you with this topic?</p>
                    
                    <div className="w-full max-w-sm mb-8">
                      <label className="block text-sm font-bold mb-4 text-white text-left">{confidence}%</label>
                      <input 
                        type="range" min="0" max="100" value={confidence} 
                        onChange={(e) => setConfidence(parseInt(e.target.value))}
                        className="w-full" 
                      />
                    </div>
                    <button onClick={handleStartTest} className="px-8 py-3 bg-student-accent text-white font-bold rounded-xl hover:scale-105">
                      Generate & Start Test
                    </button>
                  </div>
                ) : (
                  <div className="bg-os-card p-6 rounded-2xl border border-os-border flex items-center justify-center text-os-muted">
                    Select a session
                  </div>
                )}
              </div>
            )}
            
            {quizState === 'loading' && <div className="p-10 text-center"><span className="loading loading-spinner text-student-accent w-16 mb-4"></span><p className="text-2xl animate-pulse">Generating dynamically...</p></div>}
            
            {quizState === 'taking' && questions.length > 0 && (
              <div className="max-w-3xl mx-auto mt-10 p-8 bg-os-card rounded-2xl border border-os-border">
                <h2 className="text-2xl font-bold mb-8">{questions[currentQIndex]?.question}</h2>
                <div className="space-y-4">
                  {['A', 'B', 'C', 'D'].map(key => {
                    const opt = questions[currentQIndex]?.options[key] || questions[currentQIndex]?.options[key === 'A' ? 0 : key === 'B' ? 1 : key === 'C' ? 2 : 3];
                    if(!opt) return null;
                    return (
                      <button 
                        key={key} onClick={() => handleSelectAnswer(key)}
                        className={`w-full text-left p-4 rounded-xl border ${answers[currentQIndex] === key ? 'border-student-accent bg-student-accent/10' : 'border-os-border bg-black'}`}
                      >
                        <span className="font-bold mr-4">{key}</span>{opt}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-8 flex justify-end">
                  <button onClick={handleNextQ} className="px-6 py-3 bg-white text-black font-bold rounded-xl">Next</button>
                </div>
              </div>
            )}
            
            {quizState === 'results' && (
              <div className="max-w-2xl mx-auto mt-10 p-8 bg-os-card border border-os-border rounded-2xl text-center">
                 <h2 className="text-4xl text-student-accent mb-2">Test Complete!</h2>
                 <div className="grid grid-cols-2 gap-4 my-8">
                   <div className="p-6 bg-black rounded-2xl border border-gray-800"><p>Confidence</p><p className="text-4xl font-bold text-red-500">{confidence}%</p></div>
                   <div className="p-6 bg-black rounded-2xl border border-gray-800"><p>Accuracy</p><p className="text-4xl font-bold text-green-400">{Math.round((score/questions.length)*100)}%</p></div>
                 </div>
                 <button onClick={() => setQuizState('setup')} className="px-8 py-4 border rounded-xl font-bold">Back</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
