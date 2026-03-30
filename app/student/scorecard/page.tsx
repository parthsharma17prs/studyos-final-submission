'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  LuFileText,
  LuTrendingUp,
  LuCircleCheck,
  LuZap,
  LuShieldCheck,
  LuChevronRight,
  LuUpload,
  LuActivity
} from 'react-icons/lu';
import Ribbon from '@/components/shared/Ribbon';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

/**
 * Scorecard Analyzer — Premium design with real data processing
 */

interface Subject {
  name: string;
  grade: string;
  percentage: number;
}

interface AcademicScoring {
  mathematics: number;
  logic: number;
  coding: number;
}

interface MockData {
  totalPercentage: number;
  cgpa: string;
  placementScore: number;
  placementReadiness: Record<string, boolean>;
  subjects: Subject[];
  studyPlan: { day: string; subject: string; focus: string }[];
  academicScoring?: AcademicScoring;
}

const mockScorecard: MockData = {
  totalPercentage: 84.5,
  cgpa: "8.45/10",
  placementScore: 92,
  placementReadiness: {
    "Google": true,
    "Microsoft": true,
    "TCS": true,
    "Infosys": true,
    "Zomato": false
  },
  subjects: [
    { name: "Data Structures", grade: "A", percentage: 92 },
    { name: "Algorithms", grade: "A+", percentage: 95 },
    { name: "Operating Systems", grade: "B", percentage: 72 },
    { name: "Database Systems", grade: "B+", percentage: 81 },
    { name: "Computer Networks", grade: "A", percentage: 88 }
  ],
  studyPlan: [
    { day: "Day 1", subject: "Operating Systems", focus: "Focus on Thread Synchronization and Virtual Memory." },
    { day: "Day 2", subject: "Database Systems", focus: "Practice Normalization and SQL Join optimizations." },
    { day: "Day 3", subject: "Review", focus: "Full mock interview on Core CS fundamentals." }
  ],
  academicScoring: {
    mathematics: 85,
    logic: 90,
    coding: 70
  }
};

export default function ScorecardPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [data, setData] = useState<MockData | null>(null);
  const [error, setError] = useState('');

  const loadSample = () => {
    setIsAnalyzing(true);
    setError('');
    setTimeout(() => {
      setData(mockScorecard);
      localStorage.setItem('studyos_scorecard_data', JSON.stringify(mockScorecard));
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const getBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result?.toString().split(',')[1];
            if (result) resolve(result);
            else reject(new Error('File conversion failed'));
          };
          reader.onerror = (error) => reject(error);
        });
      };

      const base64String = await getBase64(file);

      const res = await fetch('/api/analyze-scorecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64String,
          mimeType: file.type
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error('Failed to analyze scorecard: ' + errText);
      }
      
      const parsedData = await res.json();
      
      // Handle Gemini fallback missing structure
      if (!parsedData.academicScoring) {
        parsedData.academicScoring = { mathematics: 75, logic: 70, coding: 80 };
      }
      
      setData(parsedData);
      // Save to localStorage so summary generation can use it for personalization
      localStorage.setItem('studyos_scorecard_data', JSON.stringify(parsedData));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error parsing document.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const radarChartOptions = {
    chart: { background: 'transparent', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
    theme: { mode: 'dark' as const },
    colors: ['#ef4444'], // student-accent red
    fill: { opacity: 0.2 },
    stroke: { width: 2 },
    markers: { size: 4, colors: ['#ef4444'], strokeColors: '#ef4444', strokeWidth: 1 },
    xaxis: { 
      categories: ['Mathematics', 'Logic', 'Coding'],
      labels: { style: { colors: '#fff', fontSize: '12px', fontWeight: 600 } }
    },
    yaxis: { show: false, min: 0, max: 100 },
    plotOptions: { radar: { polygons: { strokeColors: '#1f1f2e', fill: { colors: ['transparent'] } } } },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-2">Scorecard Analyzer</h2>
          <p className="text-os-muted text-sm uppercase tracking-widest font-bold">Upload Marksheet. Get Career Roadmap.</p>
        </div>
        {!data && !isAnalyzing && (
          <button
            onClick={loadSample}
            className="btn-ghost flex items-center gap-2 border-student-accent/30 text-student-accent hover:bg-student-accent/5"
          >
            <LuZap size={16} /> Try Sample Marksheet
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl font-bold">
          {error}
        </div>
      )}

      {!data && !isAnalyzing && (
        <div className="glass-card p-20 text-center border-dashed border-2 border-os-border hover:border-student-accent/40 transition-all cursor-pointer group relative">
          <input type="file" accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} />
          <div className="w-20 h-20 rounded-3xl bg-student-accent/5 border border-student-accent/20 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
            <LuUpload className="text-student-accent" size={32} />
          </div>
          <h3 className="text-2xl font-black tracking-tight mb-2">Drop your marksheet here</h3>
          <p className="text-os-muted text-sm font-medium">Supports JPG, PNG, and PDF (OCR Powered)</p>
          <div className="mt-8 flex justify-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-os-muted"><LuShieldCheck className="text-green-500" /> SECURE</div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-os-muted"><LuZap className="text-student-accent" /> FAST</div>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="glass-card p-24 text-center">
          <div className="w-16 h-16 border-4 border-student-accent border-t-transparent rounded-full animate-spin mx-auto mb-8" />
          <h3 className="text-3xl font-black tracking-tighter mb-2 animate-pulse">Gemini Vision Analyzing...</h3>
          <p className="text-os-muted text-sm font-medium uppercase tracking-[0.2em]">Extracting grades & placement eligibility</p>
        </div>
      )}

      {data && !isAnalyzing && (
        <div className="space-y-10 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 group">
              <p className="text-[10px] uppercase tracking-[0.2em] text-os-muted mb-4 font-black">Overall CGPA</p>
              <div className="text-6xl font-black text-white group-hover:scale-105 transition-transform">{data.cgpa || '8.2'}</div>
              <div className="mt-6 progress-bar h-2">
                <div className="progress-fill-red" style={{ width: `${data.totalPercentage || 80}%` }} />
              </div>
            </div>

            <div className="glass-card p-8 group bg-gradient-to-br from-student-accent/5 to-transparent border-student-accent/20">
              <p className="text-[10px] uppercase tracking-[0.2em] text-student-accent mb-4 font-black">Placement Score</p>
              <div className="text-6xl font-black text-student-accent glow-text-red group-hover:scale-105 transition-transform">
                {data.placementScore || 85}
              </div>
              <p className="text-[10px] mt-4 text-os-muted uppercase tracking-widest font-bold">Top 2% of candidates</p>
            </div>

            <div className="glass-card p-8 overflow-hidden">
              <p className="text-[10px] uppercase tracking-[0.2em] text-os-muted mb-6 font-black">Company Readiness</p>
              <div className="space-y-3">
                {data.placementReadiness && Object.entries(data.placementReadiness).map(([company, qualified], i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <span className="text-sm font-bold text-os-muted group-hover:text-white transition-colors">{company}</span>
                    {qualified ? (
                      <span className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-widest">
                        <LuCircleCheck size={12} /> Qualified
                      </span>
                    ) : (
                      <span className="text-os-muted/30 text-[10px] font-black uppercase tracking-widest line-through">Incomplete</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Ribbon theme="student" />

          {/* Extracted Feature from Recruit_AI Analytics */}
          {data.academicScoring && (
            <div className="glass-card p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-student-accent/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="flex justify-between items-start mb-8 relative">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                    <LuActivity className="text-student-accent" /> Competency Radar
                  </h3>
                  <p className="text-os-muted text-sm mt-1">Core foundational analysis for targeted study planning</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="flex justify-center -mt-6">
                  <Chart
                    options={radarChartOptions}
                    series={[{ name: 'Score', data: [data.academicScoring.mathematics, data.academicScoring.logic, data.academicScoring.coding] }]}
                    type="radar"
                    height={320}
                  />
                </div>
                
                <div className="space-y-6">
                  {[
                    { label: 'Mathematics', score: data.academicScoring.mathematics },
                    { label: 'Logic & Reasoning', score: data.academicScoring.logic },
                    { label: 'Coding & DS', score: data.academicScoring.coding }
                  ].map((skill, idx) => (
                    <div key={idx} className="space-y-2">
                       <div className="flex justify-between items-center">
                        <div className="font-bold text-sm">{skill.label}</div>
                        <div className="font-black text-student-accent">{skill.score}/100</div>
                       </div>
                       <div className="progress-bar w-full h-2">
                        <div className="bg-student-accent" style={{ width: `${skill.score}%`, height: '100%' }} />
                       </div>
                    </div>
                  ))}
                  <div className="mt-6 p-4 rounded-xl bg-student-accent/10 border border-student-accent/20">
                    <p className="text-xs text-white/80 font-medium leading-relaxed">
                      This academic profiling acts as a personalized context for <strong>AI Summaries & Study Nodes</strong>. The platform will automatically adapt explanations according to your strongest and weakest domains.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subject Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="glass-card p-10">
              <h3 className="text-2xl font-black mb-8 tracking-tighter flex items-center gap-3">
                <LuFileText className="text-student-accent" /> Subject Analytics
              </h3>
              <div className="space-y-6">
                {data.subjects && data.subjects.map((sub, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-xs font-black text-os-muted uppercase tracking-widest block mb-1">{sub.grade}</span>
                        <h4 className="font-bold text-sm tracking-tight">{sub.name}</h4>
                      </div>
                      <span className={`text-sm font-black ${sub.percentage >= 80 ? 'text-green-500' : 'text-student-accent'}`}>
                        {sub.percentage}%
                      </span>
                    </div>
                    <div className="progress-bar w-full h-1">
                      <div className={sub.percentage >= 80 ? 'bg-green-500' : 'bg-student-accent'} style={{ width: `${sub.percentage}%`, height: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Action Plan */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black mb-4 tracking-tighter flex items-center gap-3">
                <LuTrendingUp className="text-student-accent" /> Career Action Plan
              </h3>
              <div className="space-y-4">
                {data.studyPlan && data.studyPlan.map((plan, i) => (
                  <div key={i} className="glass-card p-6 border-l-4 border-student-accent flex items-start gap-5 hover:bg-white/5 transition-colors">
                    <div className="text-[10px] font-black uppercase tracking-widest text-student-accent pt-1">{plan.day}</div>
                    <div>
                      <h4 className="text-sm font-black mb-1">{plan.subject}</h4>
                      <p className="text-xs text-os-muted leading-relaxed">{plan.focus}</p>
                    </div>
                    <LuChevronRight className="ml-auto text-os-border" />
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setData(null); }}
                className="w-full p-4 text-[10px] font-black uppercase tracking-[0.2em] text-os-muted hover:text-white border-t border-os-border transition-colors mt-4"
              >
                Analyze Another Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
