'use client';

import { useState, useEffect } from 'react';
import { LuSwords, LuShield, LuZap, LuSearch, LuTrophy } from 'react-icons/lu';
import confetti from 'canvas-confetti';

const MOCK_QUESTIONS = [
  { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"], ans: 0 },
  { q: "Choose the correct HTML element for the largest heading:", options: ["<heading>", "<h6>", "<h1>", "<head>"], ans: 2 },
  { q: "What is the correct HTML element for inserting a line break?", options: ["<break>", "<br>", "<lb>"], ans: 1 },
  { q: "What does CSS stand for?", options: ["Colorful Style Sheets", "Cascading Style Sheets", "Computer Style Sheets"], ans: 1 },
  { q: "Where in an HTML document is the correct place to refer to an external style sheet?", options: ["<body>", "<head>", "At the end"], ans: 1 },
  { q: "Which HTML tag is used to define an internal style sheet?", options: ["<css>", "<script>", "<style>"], ans: 2 },
  { q: "Inside which HTML element do we put the JavaScript?", options: ["<scripting>", "<script>", "<javascript>"], ans: 1 },
  { q: "What is the correct syntax for referring to an external script called 'xxx.js'?", options: ["<script href='xxx.js'>", "<script src='xxx.js'>", "<script name='xxx.js'>"], ans: 1 },
  { q: "How do you write 'Hello World' in an alert box?", options: ["alert('Hello World');", "msg('Hello World');", "alertBox('Hello World');"], ans: 0 },
  { q: "How do you create a function in JavaScript?", options: ["function:myFunction()", "function = myFunction()", "function myFunction()"], ans: 2 }
];

const MOCK_USERS = ["Alex_Dev", "TechNinja99", "CodeMaster", "SarahByte", "GamerCoder", "ByteMe"];

export default function BattleMode() {
  const [matchState, setMatchState] = useState<'idle' | 'searching' | 'found' | 'countdown' | 'playing' | 'finished'>('idle');
  const [opponent, setOpponent] = useState('');
  const [countdown, setCountdown] = useState(3);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [scores, setScores] = useState({ you: 0, opponent: 0 });
  const [userAnswered, setUserAnswered] = useState<number | null>(null);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startSearch = () => {
    setMatchState('searching');
    setTimeout(() => {
      setOpponent(MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]);
      setMatchState('found');
      setTimeout(() => {
        setMatchState('countdown');
        let count = 3;
        setCountdown(count);
        const int = setInterval(() => {
          count--;
          if (count <= 0) {
            clearInterval(int);
            setMatchState('playing');
            setCurrentQIndex(0);
            setScores({ you: 0, opponent: 0 });
          } else {
            setCountdown(count);
          }
        }, 1000);
      }, 2000);
    }, 3000);
  };

  useEffect(() => {
    if (matchState !== 'playing' || userAnswered !== null) return;
    
    setOpponentAnswered(false);
    const timeout = setTimeout(() => {
      setOpponentAnswered(true);
    }, Math.random() * 2000 + 1000);

    return () => clearTimeout(timeout);
  }, [currentQIndex, matchState, userAnswered]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleAnswer = (optionIdx: number) => {
    if (userAnswered !== null) return;
    setUserAnswered(optionIdx);

    const isCorrect = optionIdx === MOCK_QUESTIONS[currentQIndex].ans;
    const opponentCorrect = Math.random() > 0.4;

    setScores(s => {
      const newState = {
        you: isCorrect ? s.you + 10 : s.you,
        opponent: opponentCorrect ? s.opponent + 10 : s.opponent
      };
      
      setTimeout(() => {
        if (currentQIndex < MOCK_QUESTIONS.length - 1) {
          setUserAnswered(null);
          setOpponentAnswered(false);
          setCurrentQIndex(q => q + 1);
        } else {
          setMatchState('finished');
          if (newState.you >= newState.opponent) {
            triggerConfetti();
          }
        }
      }, 2000);
      
      return newState;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-center mt-12 px-4 pb-20">

      <div>
        <h2 className="text-4xl font-black tracking-tighter mb-4 text-student-accent glow-text-red flex items-center justify-center gap-4">
          Peer Battle Mode <LuSwords />
        </h2>
        <p className="text-os-muted text-lg max-w-xl mx-auto">Challenge your classmates to a real-time smart quiz in your Tech Stack.</p>
      </div>

      {matchState === 'idle' && (
        <div className="glass-card p-12 mt-12 bg-black border-2 border-student-accent glow-red relative overflow-hidden flex flex-col items-center">
           <LuZap size={64} className="text-student-accent mb-6 animate-pulse" />
           <h3 className="text-3xl font-black mb-4">Find a Match</h3>
           <p className="text-os-muted mb-8 max-w-sm">Randomly pairs you with a student studying the same subject or tech stack.</p>
           <button onClick={startSearch} className="btn-primary-student py-4 px-12 text-xl tracking-widest font-black uppercase flex items-center gap-3 hover:scale-105 transition-transform">
             <LuSearch size={24} /> Search Player
           </button>
        </div>
      )}

      {matchState === 'searching' && (
        <div className="glass-card p-24 mt-12 flex flex-col items-center">
           <div className="w-16 h-16 border-4 border-student-accent border-t-transparent rounded-full animate-spin mb-6" />
           <h3 className="text-2xl font-black text-student-accent animate-pulse tracking-widest uppercase">Searching Servers...</h3>
           <p className="text-os-muted mt-4">Looking for a worthy opponent...</p>
        </div>
      )}

      {matchState === 'found' && (
        <div className="glass-card p-16 mt-12 border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
           <h3 className="text-4xl font-black text-green-500 mb-8 uppercase tracking-widest animate-pulse">Match Found!</h3>
           <div className="flex flex-col md:flex-row justify-center items-center gap-12 text-3xl font-bold">
              <div className="flex flex-col items-center">
                 <div className="w-24 h-24 bg-student-accent/20 rounded-full flex items-center justify-center mb-4 border-2 border-student-accent text-student-accent text-4xl">Y</div>
                 <span className="text-xl">You</span>
              </div>
              <div className="text-5xl text-os-muted italic font-black">VS</div>
              <div className="flex flex-col items-center">
                 <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mb-4 border-2 border-orange-500 text-orange-500 text-4xl">{opponent.charAt(0)}</div>
                 <span className="text-xl text-orange-400">{opponent}</span>
              </div>
           </div>
        </div>
      )}

      {matchState === 'countdown' && (
        <div className="glass-card p-32 mt-12 border-2 border-student-accent flex justify-center items-center">
           <div className="text-9xl font-black text-student-accent animate-ping glow-text-red">
             {countdown}
           </div>
        </div>
      )}

      {matchState === 'playing' && (
        <div className="text-left mt-8">
           <div className="flex justify-between items-center bg-os-card p-6 rounded-2xl border border-os-border mb-8 shadow-lg">
             <div className="flex flex-col">
               <span className="text-sm text-os-muted uppercase tracking-widest font-black">You</span>
               <div className="text-4xl font-black text-student-accent">{scores.you}</div>
             </div>
             <div className="text-xl font-black text-os-muted px-6 py-2 bg-black/50 rounded-full border border-os-border">
               Q {currentQIndex + 1} / 10
             </div>
             <div className="flex flex-col text-right">
               <span className="text-sm text-os-muted uppercase tracking-widest font-black">{opponent}</span>
               <div className="text-4xl font-black text-orange-500">{scores.opponent}</div>
             </div>
           </div>

           <div className="glass-card p-8 md:p-12 relative overflow-hidden">
             {opponentAnswered && (
                 <div className="absolute top-4 right-4 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest animate-pulse whitespace-nowrap z-10 transition-all">
                    Opponent Answered!
                 </div>
             )}
             <div className="flex justify-between items-start mb-8 min-h-[4rem]">
                <h3 className="text-3xl font-bold leading-tight z-10 max-w-[80%]">{MOCK_QUESTIONS[currentQIndex].q}</h3>
             </div>

             <div className="space-y-4 relative z-10">
               {MOCK_QUESTIONS[currentQIndex].options.map((opt, idx) => {
                 let btnClass = "w-full text-left p-6 rounded-xl border-2 transition-all font-bold text-lg ";
                 
                 if (userAnswered === null) {
                   btnClass += "border-os-border hover:border-student-accent hover:bg-student-accent/5";
                 } else {
                   const isCorrectAns = MOCK_QUESTIONS[currentQIndex].ans === idx;
                   if (userAnswered === idx) {
                     btnClass += isCorrectAns ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]" : "border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]";
                   } else if (isCorrectAns) {
                     btnClass += "border-green-500/50 bg-green-500/5 text-green-400/80";
                   } else {
                     btnClass += "border-os-border opacity-50 cursor-not-allowed";
                   }
                 }

                 return (
                   <button 
                     key={idx} 
                     disabled={userAnswered !== null}
                     onClick={() => handleAnswer(idx)}
                     className={btnClass}
                   >
                     {opt}
                   </button>
                 );
               })}
             </div>
           </div>
        </div>
      )}

      {matchState === 'finished' && (
        <div className="glass-card p-16 mt-12 bg-gradient-to-br border-2 border-student-accent relative overflow-hidden">
           <LuTrophy size={100} className={`mx-auto mb-8 ${scores.you >= scores.opponent ? 'text-yellow-400 DropShadow-red' : 'text-os-muted'}`} />
           <h3 className="text-6xl font-black mb-4 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-white to-os-muted">
             {scores.you > scores.opponent ? 'Victory!' : scores.you < scores.opponent ? 'Defeat' : 'Draw!'}
           </h3>
           <p className="text-xl text-os-muted mb-12 font-bold tracking-widest uppercase">
             {scores.you > scores.opponent ? 'You crushed it!' : scores.you === scores.opponent ? 'It was a tie!' : 'Better luck next time.'}
           </p>

           <div className="flex justify-center items-center gap-6 md:gap-12 text-3xl font-bold mb-12 relative z-10">
              <div className="flex flex-col items-center p-8 bg-os-card rounded-2xl border-2 border-student-accent/50 shadow-[0_0_40px_rgba(255,0,0,0.2)] min-w-[150px] md:min-w-[200px]">
                 <div className="text-student-accent text-sm tracking-widest uppercase mb-4">You</div>
                 <div className="text-7xl text-white outline-none font-black">{scores.you}</div>
              </div>
              <div className="text-5xl text-os-muted italic font-black">VS</div>
              <div className="flex flex-col items-center p-8 bg-os-card rounded-2xl border-2 border-orange-500/50 min-w-[150px] md:min-w-[200px]">
                 <div className="text-orange-500 text-sm tracking-widest uppercase mb-4">{opponent}</div>
                 <div className="text-7xl text-white outline-none font-black">{scores.opponent}</div>
              </div>
           </div>

           <button onClick={() => setMatchState('idle')} className="btn-primary-student px-12 py-5 text-xl tracking-widest font-black uppercase hover:scale-105 transition-transform z-10 relative">
              Return to Lobby
           </button>
        </div>
      )}

    </div>
  );
}