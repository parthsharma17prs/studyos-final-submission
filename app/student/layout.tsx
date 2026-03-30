'use client';

import Sidebar, { SidebarItem } from '@/components/shared/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LuLayoutDashboard,
  LuBookOpen,
  LuActivity,
  LuFileSearch,
  LuSearch,
  LuSwords,
  LuMic,
  LuPhone,
  LuWrench,
  LuCalendar,
  LuTrendingUp,
  LuSettings,
  LuBell,
  LuPenTool,
  LuFileText
} from 'react-icons/lu';

/**
 * Student Layout — Premium dark theme with sidebar
 */

const studentNavItems: SidebarItem[] = [
  { icon: LuLayoutDashboard, label: 'Dashboard', href: '/student/dashboard' },
  { icon: LuMic, label: 'Orbital Voice', href: '/student/ai-call' },
  { icon: LuPhone, label: 'Agent Booker', href: '/student/agent-booker' },
  { icon: LuBookOpen, label: 'Study Notes + Quiz', href: '/student/study' },
  { icon: LuActivity, label: 'My Scorecard', href: '/student/scorecard' },
  { icon: LuFileText, label: 'Exam Practitioner', href: '/student/exam-practitioner' },
  { icon: LuPenTool, label: 'Mock Test', href: '/student/mock-test' },
  { icon: LuFileSearch, label: 'ATS Resume', href: '/student/resume' },
  { icon: LuSearch, label: 'Learning Gaps', href: '/student/gaps' },
  { icon: LuSwords, label: 'Battle Mode', href: '/student/battle' },
  { icon: LuWrench, label: 'MCP AI Tools', href: '/student/mcp' },
  { icon: LuCalendar, label: 'Study Schedule', href: '/student/schedule' },
  { icon: LuTrendingUp, label: 'Exam Predictor', href: '/student/predictor' },
  { icon: LuSettings, label: 'Settings', href: '/student/settings' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('studyos_user');
    if (!stored) {
      // For Demo: Auto-login if no user found
      const mockUser = { name: 'Demo Student', email: 'student@studyos.ai', role: 'student' };
      localStorage.setItem('studyos_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return;
    }
    const parsed = JSON.parse(stored);
    setUser(parsed);
  }, [router]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-student-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <Sidebar
        items={studentNavItems}
        theme="student"
        userName={user.name}
        userEmail={user.email}
      />

      {/* Main content area */}
      <main className="ml-64 min-h-screen">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl border-b border-os-border px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black tracking-tight">
                Welcome back, <span className="text-student-accent">{user.name}</span>
              </h1>
              <p className="text-[10px] text-os-muted uppercase tracking-[0.2em] font-bold mt-1">Ready to dominate today?</p>
            </div>

            <div className="flex items-center gap-6">
              {/* Notification bell */}
              <button className="relative p-2.5 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-os-border">
                <LuBell className="text-os-muted group-hover:text-student-accent transition-colors" size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-student-accent shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
              </button>

              {/* User avatar */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/20 to-transparent border border-red-600/20 flex items-center justify-center">
                <span className="text-student-accent font-black text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="ribbon-student" />

        {/* Page content */}
        <div className="p-10 max-w-7xl mx-auto animate-fade-up">
          {children}
        </div>
      </main>
    </div>
  );
}
