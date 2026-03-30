'use client';

import { useState, useEffect } from 'react';
import { LuPhoneCall, LuUser, LuZap, LuActivity, LuChevronRight, LuCalendar, LuMessageSquare, LuClock } from 'react-icons/lu';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

export default function AgentBooker() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, 'callHistory'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCallHistory(history);
      } catch (err) {
        console.error('Error fetching call history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleCall = async () => {
    if (!phoneNumber) return;
    setIsTriggering(true);
    setStatus(null);

    const callPayload = { 
      phoneNumber, 
      customerName,
      timestamp: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/trigger-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callPayload),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: `Call triggered! ID: \${data.callId || data.callSid}` });
        
        // Save to Firebase History
        const historyDoc = {
          name: customerName || 'Anonymous Student',
          phone: phoneNumber,
          summary: "Student requested a voice mentorship session. Topics: Study Schedule, Score Improvement.",
          status: 'completed',
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'callHistory'), historyDoc);
        // @ts-ignore
        setCallHistory(prev => [{ id: docRef.id, ...historyDoc, createdAt: new Date() }, ...prev]);
      } else {
        throw new Error(data.error || 'Failed to trigger call');
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 p-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter mb-4 italic text-white">
            Agent <span className="text-student-accent">Booker</span>
          </h1>
          <p className="text-os-muted font-bold tracking-[0.3em] uppercase text-[10px]">On-Demand AI Phone Interaction</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-os-border px-8 py-5 rounded-3xl">
           <LuPhoneCall className="text-student-accent" size={32} />
        </div>
      </div>

      <div className="ribbon-student" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
        <div className="lg:col-span-5 glass-card p-10 space-y-8 h-fit">
            <h3 className="text-xl font-black italic tracking-tight flex items-center gap-3">
                <LuZap className="text-student-accent" /> Trigger New Callback
            </h3>
            
            <div className="space-y-4">
                <label className="text-[10px] font-black text-os-muted uppercase tracking-[0.2em] italic">Full Name</label>
                <div className="relative group">
                    <LuUser className="absolute left-5 top-1/2 -translate-y-1/2 text-os-muted group-focus-within:text-student-accent transition-colors" />
                    <input 
                        type="text" 
                        placeholder="e.g. John Doe" 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-black/40 border border-os-border pl-14 pr-6 py-5 rounded-2xl outline-none focus:border-student-accent transition-all text-sm font-bold tracking-widest uppercase placeholder:text-os-muted/30 text-white"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-os-muted uppercase tracking-[0.2em] italic">Phone Number (E.164)</label>
                <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-os-muted font-bold text-lg">+</span>
                    <input 
                        type="text" 
                        placeholder="1234567890" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-black/40 border border-os-border pl-12 pr-6 py-5 rounded-2xl outline-none focus:border-student-accent transition-all text-sm font-bold tracking-widest uppercase placeholder:text-os-muted/30 text-white"
                    />
                </div>
                <p className="text-[9px] text-os-muted italic">Include country code without + (e.g. 1 for US, 91 for India)</p>
            </div>

            <button 
                onClick={handleCall}
                disabled={isTriggering || !phoneNumber}
                className="w-full py-6 bg-student-accent text-white font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(255,51,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-4 border border-white/10"
            >
                {isTriggering ? 'CALLING...' : 'INITIALIZE CALL'}
                <LuZap className={isTriggering ? 'animate-pulse' : 'group-hover:animate-bounce'} />
            </button>

            {status && (
                <div className={`p-6 rounded-2xl border text-[10px] font-black tracking-[0.2em] uppercase text-center animate-in zoom-in-95 duration-300 ${
                  status.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/50 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                    : 'bg-red-500/10 border-red-400/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                }`}>
                    {status.message}
                </div>
            )}
        </div>

        <div className="lg:col-span-7 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-os-muted italic flex items-center gap-3">
                <LuClock className="text-student-accent" /> Call History & Summaries
            </h3>
            
            <div className="space-y-4">
                {isLoadingHistory ? (
                    <div className="p-8 border border-os-border rounded-3xl text-center text-os-muted animate-pulse font-bold uppercase tracking-widest text-xs">
                        Fetching logs...
                    </div>
                ) : callHistory.length === 0 ? (
                    <div className="p-12 border border-dashed border-os-border rounded-3xl text-center space-y-4">
                        <LuMessageSquare size={32} className="mx-auto text-os-border" />
                        <p className="text-xs font-bold text-os-muted uppercase tracking-widest">No call logs available</p>
                    </div>
                ) : (
                    callHistory.map((call, i) => (
                        <div key={call.id} className="glass-card p-8 group hover:border-student-accent/30 transition-all border border-os-border/50">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-black italic tracking-tight text-white group-hover:text-student-accent transition-colors">
                                        {call.name}
                                    </h4>
                                    <p className="text-[10px] font-bold text-os-muted tracking-widest uppercase mt-1">
                                        +{call.phone} • {call.createdAt?.toDate ? call.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                    </p>
                                </div>
                                <span className="bg-green-500/10 text-green-500 text-[9px] font-black uppercase px-3 py-1 rounded-full border border-green-500/20">
                                    {call.status}
                                </span>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                                <p className="text-xs font-medium leading-relaxed text-os-muted italic">
                                    " {call.summary} "
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pb-12">
            <div className="p-10 glass-card bg-gradient-to-br from-white/5 to-transparent border-os-border/50">
                <h3 className="text-xl font-black italic tracking-tighter mb-8 flex items-center gap-4">
                    <LuActivity className="text-student-accent" /> Protocols
                </h3>
                <div className="space-y-6">
                    <div className="flex items-start gap-5">
                        <div className="w-8 h-8 rounded-lg bg-student-accent/10 flex items-center justify-center text-student-accent flex-shrink-0 font-black">1</div>
                        <p className="text-[11px] font-black text-os-muted leading-relaxed uppercase tracking-widest">Agent triggers an outbound VoIP session via Ultravox Voice Intelligence.</p>
                    </div>
                    <div className="flex items-start gap-5">
                        <div className="w-8 h-8 rounded-lg bg-student-accent/10 flex items-center justify-center text-student-accent flex-shrink-0 font-black">2</div>
                        <p className="text-[11px] font-black text-os-muted leading-relaxed uppercase tracking-widest">PSTN connectivity established via Twilio Programmable Voice.</p>
                    </div>
                    <div className="flex items-start gap-5">
                        <div className="w-8 h-8 rounded-lg bg-student-accent/10 flex items-center justify-center text-student-accent flex-shrink-0 font-black">3</div>
                        <p className="text-[11px] font-black text-os-muted leading-relaxed uppercase tracking-widest">Full duplex conversation with <span className="text-white underline italic">Parth</span> begins upon pick-up.</p>
                    </div>
                </div>
            </div>
        </div>
        </div>
    </div>
  );
}
