import React, { useState } from 'react';
import SetupForm from './components/SetupForm';
import SimulationBoard from './components/SimulationBoard';
import { LotterySettings } from './types';
import { Sparkles } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-1.5 rounded-lg shadow-md">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">
                        ICHI-SIM <span className="text-indigo-600">一番賞模擬</span>
                    </h1>
                </div>
                {currentStep === 'simulation' && (
                    <button 
                        onClick={handleReset}
                        className="text-xs font-bold text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        重新設定
                    </button>
                )}
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 py-6 px-4">
            {currentStep === 'setup' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SetupForm onStart={handleStartSimulation} />
                    
                    {/* Instructions */}
                    <div className="max-w-xl mx-auto mt-12">
                        <div className="bg-white/60 p-6 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-sm">
                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs">?</span>
                                快速上手指南
                            </h4>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-500">1.</span>
                                    查看店家的配率表，輸入該套一番賞的總籤數 (如 80)。
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-500">2.</span>
                                    數一下目前還剩幾張籤、剩幾個大獎 (A/B/C賞)。
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-500">3.</span>
                                    若需要詳細計算期望值與損益，請開啟「進階設定」。
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-500">4.</span>
                                    點擊「建立模擬盤面」，系統會自動生成並打亂籤筒。
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {currentStep === 'simulation' && settings && (
                <div className="animate-in fade-in duration-500">
                    <SimulationBoard settings={settings} onReset={handleReset} />
                </div>
            )}
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-100">
            <p className="font-medium">Designed for Ichiban Kuji Fans</p>
            <p className="mt-1 opacity-70">Probability Analysis Tool • 2024</p>
        </footer>
    </div>
  );
};

export default App;