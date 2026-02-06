
import React, { useState, useCallback, useRef } from 'react';
import { AppState, Subject, Milestone } from './types';
import { SUBJECTS } from './constants';
import { fetchTimelineData, generateMilestoneImage } from './services/geminiService';
import { storageService } from './services/storageService';
import Header from './components/Header';
import SubjectCard from './components/SubjectCard';
import TimelineItem from './components/TimelineItem';
import { Loader2, ChevronRight, ChevronLeft, Download, RefreshCw, Radio } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.SELECTING);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const startGeneration = async (subject: Subject) => {
    setState(AppState.LOADING);
    setIsFromCache(false);
    setError(null);
    try {
      const data = await fetchTimelineData(subject.label);
      setMilestones(data);
      setState(AppState.VIEWING);
      
      data.forEach(async (milestone, index) => {
        const url = await generateMilestoneImage(milestone.imagePrompt);
        setMilestones(prev => {
          const updated = prev.map((m, i) => i === index ? { ...m, imageUrl: url } : m);
          storageService.saveTimeline(subject.id, updated);
          return updated;
        });
      });
    } catch (err) {
      setError("Échec de l'interconnexion. Réessayez.");
      setState(AppState.ERROR);
    }
  };

  const handleSelectSubject = useCallback(async (subject: Subject) => {
    setSelectedSubject(subject);
    const cached = storageService.loadTimeline(subject.id);
    
    if (cached) {
      setMilestones(cached);
      setIsFromCache(true);
      setState(AppState.VIEWING);
    } else {
      await startGeneration(subject);
    }
  }, []);

  const handleUpdateMilestone = (index: number, updated: Milestone) => {
    setMilestones(prev => {
      const next = prev.map((m, i) => i === index ? updated : m);
      if (selectedSubject) storageService.saveTimeline(selectedSubject.id, next);
      return next;
    });
  };

  const handleRegenerate = () => {
    if (selectedSubject && confirm("Lancer une nouvelle analyse IA ?")) {
      startGeneration(selectedSubject);
    }
  };

  const handleExport = () => {
    if (selectedSubject) storageService.exportToJSON(selectedSubject.label, milestones);
  };

  const handleBack = useCallback(() => {
    setState(AppState.SELECTING);
    setSelectedSubject(null);
    setMilestones([]);
    setError(null);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = direction === 'left' ? -600 : 600;
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-transparent text-white overflow-hidden relative">
      <Header showBack={state !== AppState.SELECTING} onBack={handleBack} />

      <main className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
        {state === AppState.SELECTING && (
          <div className="flex-1 overflow-y-auto px-6 py-12 relative">
            <div className="max-w-6xl mx-auto space-y-16 relative z-10">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Radio className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black tracking-[0.5em] text-blue-400 uppercase">
                    Monitoring Global en temps réel
                  </span>
                </div>
                <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none italic uppercase">
                  BRIEF<span className="text-blue-500">.</span>
                </h1>
                <p className="text-slate-400 text-xl max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
                  L'outil de veille stratégique pour explorer les points d'inflexion historiques et scientifiques.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
                {SUBJECTS.map((s) => (
                  <SubjectCard key={s.id} subject={s} onClick={handleSelectSubject} />
                ))}
              </div>

              <div className="pt-20 text-center opacity-30">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[1em]">Intelligence Engine v2.5</p>
              </div>
            </div>
          </div>
        )}

        {state === AppState.LOADING && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl z-50">
            <div className="relative">
              <div className="w-40 h-40 rounded-full border-t border-blue-500/30 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-b border-indigo-500/30 animate-spin-reverse" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
            </div>
            <div className="mt-12 text-center space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-[0.5em] text-white italic">Analyse en cours</h2>
              <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                Compilation du flux : {selectedSubject?.label}
              </p>
            </div>
          </div>
        )}

        {state === AppState.VIEWING && selectedSubject && (
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="absolute top-6 left-12 right-12 flex justify-between items-end z-40 pointer-events-none">
              <div className="pointer-events-auto space-y-2">
                <div className="flex items-center gap-4">
                  <h2 className={`text-6xl font-black bg-gradient-to-r ${selectedSubject.color} bg-clip-text text-transparent tracking-tighter uppercase italic`}>
                    {selectedSubject.label}
                  </h2>
                  {isFromCache && (
                    <span className="px-3 py-1 rounded bg-white/5 text-[9px] text-blue-400 border border-blue-500/20 font-black uppercase tracking-widest backdrop-blur-md">Local Archives</span>
                  )}
                </div>
                <div className="flex gap-8">
                  <button onClick={handleRegenerate} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all group">
                    <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-700" /> Refresh Intelligence
                  </button>
                  <button onClick={handleExport} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
                    <Download className="w-3.5 h-3.5" /> Export Intelligence
                  </button>
                </div>
              </div>
              
              <div className="flex gap-4 pointer-events-auto mb-2">
                <button onClick={() => scroll('left')} className="p-5 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 text-slate-400 hover:text-white hover:scale-110 transition-all active:scale-95 shadow-2xl">
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button onClick={() => scroll('right')} className="p-5 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 text-slate-400 hover:text-white hover:scale-110 transition-all active:scale-95 shadow-2xl">
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center relative overflow-hidden">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />
              <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[120px] bg-gradient-to-r ${selectedSubject.color} opacity-5 blur-[80px] z-0`} />

              <div 
                ref={scrollContainerRef}
                className="flex-1 h-full overflow-x-auto overflow-y-hidden px-[10vw] flex items-center scroll-smooth no-scrollbar"
              >
                <div className="flex h-full items-center">
                  {milestones.map((m, idx) => (
                    <TimelineItem 
                      key={`${m.year}-${idx}`} 
                      milestone={m} 
                      index={idx} 
                      color={selectedSubject.color}
                      onUpdate={(updated) => handleUpdateMilestone(idx, updated)}
                    />
                  ))}
                  <div className="w-[40vw] flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
