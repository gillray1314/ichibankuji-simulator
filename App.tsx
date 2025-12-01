import React, { useState } from 'react';
import SetupForm from './components/SetupForm';
import SimulationBoard from './components/SimulationBoard';
import { LotterySettings } from './types';
import { Scroll, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'setup' | 'simulation'>('setup');
  const [settings, setSettings] = useState<LotterySettings | null>(null);

  const handleStartSimulation = (newSettings: LotterySettings) => {
    setSettings(newSettings);
    setCurrentStep('simulation');
  };

  const handleReset = () => {
    setCurrentStep('setup');
    setSettings(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-stone-800">
        {/* Header */}
        <header className="pt-8 pb-4 relative z-40">
            <div className="max-w-2xl mx-auto px-4 flex flex-col items-center justify-center text-center">
                <div className="mb-3">
                    <span className="inline-block border-2 border-japan-red text-japan-red px-3 py-1 font-serif font-black text-sm tracking-widest bg-white shadow-sm">
                        一番賞模擬
                    </span>
                </div>
                <h1 className="text-4xl font-serif font-black tracking-tight text-japan-dark mb-1">
                    一 ‧ 番 ‧ 祭
                </h1>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Ichiban Matsuri Simulator</p>
                
                {currentStep === 'simulation' && (
                    <button 
                        onClick={handleReset}
                        className="mt-6 group flex items-center gap-2 px-5 py-1.5 bg-white hover:bg-stone-50 text-stone-500 font-bold rounded-full border border-stone-200 transition-all shadow-sm hover:border-japan-red hover:text-japan-red"
                    >
                        <RotateCcw className="w-3 h-3 group-hover:-rotate-180 transition-transform duration-500" />
                        <span className="text-xs tracking-widest">重置盤面</span>
                    </button>
                )}
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 py-6 px-4 relative z-10">
            {currentStep === 'setup' && (
                <div className="animate-flip-in">
                    <SetupForm onStart={handleStartSimulation} />
                </div>
            )}

            {currentStep === 'simulation' && settings && (
                <div className="animate-in fade-in duration-700">
                    <SimulationBoard settings={settings} onReset={handleReset} />
                </div>
            )}
        </main>

        {/* Footer */}
        <footer className="py-8 text-center text-stone-400">
            <div className="flex items-center justify-center gap-2 mb-2 opacity-30">
                <div className="h-px w-8 bg-current"></div>
                <Scroll className="w-4 h-4" />
                <div className="h-px w-8 bg-current"></div>
            </div>
            <p className="font-serif text-xs text-stone-500">祝君武運昌隆 • 大賞入手</p>
        </footer>
    </div>
  );
};

export default App;