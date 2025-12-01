import React, { useState, useEffect } from 'react';
import { LotterySettings, Ticket, PrizeConfig } from '../types';
import { RefreshCw, ArrowLeft, Trophy, Sparkles, Calculator, AlertCircle, X, Square, CheckSquare, Coins, TrendingUp } from 'lucide-react';
import { getLotteryAdvice } from '../services/geminiService';

const NO_OP = () => {};

// --- Sub-component: Tear Ticket Card ---
const TicketRevealCard: React.FC<{ 
    ticket: Ticket; 
    delay: number;
    onReveal: () => void;
    isAdvancedMode: boolean;
}> = ({ ticket, delay, onReveal, isAdvancedMode }) => {
    // idle -> shaking -> torn
    const [status, setStatus] = useState<'idle' | 'shaking' | 'torn'>('idle');

    useEffect(() => {
        let shakeTimer: ReturnType<typeof setTimeout>;
        let tearTimer: ReturnType<typeof setTimeout>;

        if (delay < 100) {
            setStatus('torn');
            onReveal();
            return;
        }

        const shakeStartTime = Math.max(0, delay - 300);
        
        shakeTimer = setTimeout(() => {
            setStatus(prev => prev === 'idle' ? 'shaking' : prev);
        }, shakeStartTime);

        tearTimer = setTimeout(() => {
            setStatus('torn');
            onReveal();
        }, delay);

        return () => {
            clearTimeout(shakeTimer);
            clearTimeout(tearTimer);
        };
    }, [delay, onReveal]);

    const handleClick = () => {
        if (status !== 'torn') {
            setStatus('torn');
            onReveal();
        }
    };

    const isGrand = ticket.type === 'grand';

    return (
        <div 
            className={`tear-container relative w-24 h-32 rounded-lg select-none transform transition-all
                ${status === 'shaking' ? 'is-shaking' : ''} 
                ${status === 'torn' ? 'is-torn' : ''}
            `}
            onClick={handleClick}
        >
            {/* The Prize Content */}
            <div className={`prize-content w-full h-full rounded-lg border-[3px] flex flex-col items-center justify-center p-2 text-center shadow-inner overflow-hidden relative
                ${isGrand ? 'border-yellow-400 bg-red-600 text-white' : 'border-slate-200 bg-white text-slate-600'}
                ${isGrand && status === 'torn' ? 'shine-effect' : ''}
            `}>
                 {/* Decorative circles for grand prizes */}
                 {isGrand && <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[50%] bg-red-500 rounded-full blur-md opacity-50"></div>}

                <span className={`text-4xl font-black leading-none mb-1 z-10 ${isGrand ? 'text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]' : 'text-slate-300'}`}>
                    {ticket.name[0]}
                </span>
                <span className={`font-bold text-xs truncate w-full z-10 px-1 py-0.5 rounded ${isGrand ? 'bg-red-800/50 text-red-100' : 'text-slate-500'}`}>
                    {ticket.name}
                </span>
                {isAdvancedMode && (
                    <span className={`text-[10px] mt-1 font-mono font-bold z-10 ${isGrand ? 'text-yellow-300' : 'text-slate-400'}`}>${ticket.value}</span>
                )}
            </div>

            {/* The Cover */}
            <div className="tear-cover-left">
                <span className="tear-label transform -rotate-12 translate-x-1 opacity-50">一番</span>
            </div>
            <div className="tear-cover-right">
                <span className="tear-label transform rotate-12 -translate-x-1 opacity-50">くじ</span>
            </div>
        </div>
    );
};

// --- Main Component ---

interface SimulationBoardProps {
  settings: LotterySettings;
  onReset: () => void;
}

const SimulationBoard: React.FC<SimulationBoardProps> = ({ settings, onReset }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [history, setHistory] = useState<Ticket[]>([]);
  const [advice, setAdvice] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  
  const [currentPrizes, setCurrentPrizes] = useState(settings.prizes);
  const [currentRemainingCount, setCurrentRemainingCount] = useState(settings.remainingTickets);
  
  const [animateDraw, setAnimateDraw] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentDrawBatch, setCurrentDrawBatch] = useState<Ticket[]>([]);
  const [pendingState, setPendingState] = useState<{tickets: Ticket[], prizes: PrizeConfig[], count: number} | null>(null);

  const isAdvancedMode = settings.pricePerTicket > 0;

  useEffect(() => {
    const newTickets: Ticket[] = [];
    settings.prizes.forEach(prize => {
        for(let i=0; i<prize.remainingCount; i++) {
            newTickets.push({ id: `${prize.id}-${i}`, name: prize.name, value: prize.marketValue, isRevealed: false, type: 'grand' });
        }
    });
    const currentPrizeCount = newTickets.length;
    const trashCount = settings.remainingTickets - currentPrizeCount;
    for (let i = 0; i < trashCount; i++) {
      newTickets.push({ id: `trash-${i}`, name: '小賞', value: settings.smallPrizeValue, isRevealed: false, type: 'small' });
    }
    for (let i = newTickets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTickets[i], newTickets[j]] = [newTickets[j], newTickets[i]];
    }
    setTickets(newTickets);
    setCurrentPrizes(settings.prizes);
    setCurrentRemainingCount(settings.remainingTickets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
      const runAdvice = async () => {
        const result = await getLotteryAdvice({
            ...settings,
            remainingTickets: currentRemainingCount,
            prizes: currentPrizes
        });
        setAdvice(result);
      };
      runAdvice();
  }, [currentRemainingCount, currentPrizes, settings]);

  const handleDraw = (count: number) => {
    if (tickets.length < count || isDrawing) return;
    setIsDrawing(true);
    const drawn = tickets.slice(0, count).map(t => ({...t, isRevealed: false})); 
    const remaining = tickets.slice(count);
    const newRemainingCount = remaining.length;
    const drawnPrizeNames = drawn.map(d => d.name);
    const newPrizes = currentPrizes.map(p => {
        const countDrawn = drawnPrizeNames.filter(name => name === p.name).length;
        return { ...p, remainingCount: Math.max(0, p.remainingCount - countDrawn) };
    });

    if (animateDraw) {
        setCurrentDrawBatch(drawn);
        setPendingState({ tickets: remaining, prizes: newPrizes, count: newRemainingCount });
        setTimeout(() => setShowModal(true), 100);
    } else {
        const revealed = drawn.map(t => ({...t, isRevealed: true}));
        applyStateUpdate(remaining, newPrizes, newRemainingCount, revealed);
        setIsDrawing(false);
    }
  };

  const applyStateUpdate = (newPool: Ticket[], newPrizes: PrizeConfig[], newCount: number, drawnRevealed: Ticket[]) => {
      setTickets(newPool);
      setCurrentPrizes(newPrizes);
      setCurrentRemainingCount(newCount);
      setHistory([...drawnRevealed.reverse(), ...history]);
  };

  const handleCloseModal = () => {
    if (pendingState) {
        const revealedBatch = currentDrawBatch.map(t => ({...t, isRevealed: true}));
        applyStateUpdate(pendingState.tickets, pendingState.prizes, pendingState.count, revealedBatch);
    }
    setShowModal(false);
    setPendingState(null);
    setIsDrawing(false);
  };

  const costToClear = currentRemainingCount * settings.pricePerTicket;
  const currentBoxValue = 
    currentPrizes.reduce((sum, p) => sum + (p.remainingCount * p.marketValue), 0) + 
    ((currentRemainingCount - currentPrizes.reduce((s, p) => s + p.remainingCount, 0)) * settings.smallPrizeValue) + 
    settings.lastOneValue;
  
  const profit = currentBoxValue - costToClear;
  const profitClass = profit >= 0 ? 'text-emerald-500' : 'text-rose-500';

  const singleDrawEV = isAdvancedMode ? (currentBoxValue - settings.lastOneValue) / (currentRemainingCount || 1) : 0;
  
  const grandPrizeCount = currentPrizes.reduce((sum, p) => sum + p.remainingCount, 0);
  const grandPrizeProb = currentRemainingCount > 0 ? (grandPrizeCount / currentRemainingCount) * 100 : 0;
  
  const isGoodNews = advice.includes("必勝") || advice.includes("神盤") || advice.includes("極熱");
  const isBadNews = advice.includes("勸退") || advice.includes("機率偏低");
  const adviceStyle = isGoodNews 
    ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900" 
    : isBadNews 
        ? "bg-gradient-to-br from-rose-50 to-red-50 border-rose-200 text-rose-900" 
        : "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 text-slate-700";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* --- DRAW RESULT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-300">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2 tracking-wide">
                        <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                        開獎結果 REVEAL
                    </h3>
                    <button 
                        onClick={handleCloseModal}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-900 to-slate-800">
                    <div className="flex flex-wrap justify-center gap-4">
                        {currentDrawBatch.map((ticket, idx) => (
                            <TicketRevealCard 
                                key={ticket.id} 
                                ticket={ticket} 
                                delay={400 + (idx * 300)} 
                                onReveal={NO_OP}
                                isAdvancedMode={isAdvancedMode}
                            />
                        ))}
                    </div>
                </div>
                <div className="p-6 border-t border-white/10 bg-black/40 flex justify-center">
                    <button 
                        onClick={handleCloseModal}
                        className="w-full max-w-sm bg-white hover:bg-slate-100 text-slate-900 font-black py-4 rounded-xl shadow-lg shadow-white/10 transform active:scale-95 transition-all text-base tracking-widest uppercase"
                    >
                        收下獎品 COLLECT
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- HUD DASHBOARD --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Remaining */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden group hover:border-indigo-300 transition-colors cursor-pointer" onClick={onReset}>
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-300 group-hover:bg-indigo-500 transition-colors"></div>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining</span>
                    <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-800">{currentRemainingCount}</span>
                    <span className="text-xs font-bold text-slate-400">/ {settings.totalTickets}</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-800 rounded-full" style={{ width: `${(currentRemainingCount / settings.totalTickets) * 100}%` }}></div>
                </div>
            </div>

            {/* 2. Probability */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Win Rate</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-indigo-600">{grandPrizeProb.toFixed(1)}<span className="text-lg">%</span></span>
                </div>
                <div className="mt-1 text-xs text-indigo-400 font-medium">
                    大獎剩餘 {grandPrizeCount} 個
                </div>
            </div>

            {/* 3. EV (Advanced) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Exp. Value</span>
                 {isAdvancedMode ? (
                     <div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-3xl font-black ${singleDrawEV >= settings.pricePerTicket ? 'text-emerald-600' : 'text-orange-500'}`}>
                                ${singleDrawEV.toFixed(0)}
                            </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400 font-medium">成本 ${settings.pricePerTicket} / 抽</div>
                     </div>
                 ) : (
                     <div className="h-full flex items-center text-slate-300 text-xs italic font-medium"><AlertCircle className="w-3 h-3 mr-1"/> 未啟用</div>
                 )}
            </div>

            {/* 4. Profit (Advanced) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Clear Profit</span>
                {isAdvancedMode ? (
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-3xl font-black ${profitClass}`}>
                                {profit > 0 ? '+' : ''}{profit.toLocaleString()}
                            </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400 font-medium">清台損益預估</div>
                    </div>
                ) : (
                    <div className="h-full flex items-center text-slate-300 text-xs italic font-medium"><AlertCircle className="w-3 h-3 mr-1"/> 未啟用</div>
                )}
            </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- LEFT COLUMN: CONTROLS & LIST --- */}
        <div className="lg:col-span-4 space-y-5 flex flex-col">
            
            {/* Strategy Bubble */}
            <div className={`rounded-2xl p-5 border shadow-sm relative ${adviceStyle} transition-all duration-300`}>
                <div className="absolute -top-3 left-4 bg-white border border-inherit px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm flex items-center gap-1">
                    <Calculator className="w-3 h-3" /> Analysis
                </div>
                <div className="text-sm font-medium whitespace-pre-line leading-relaxed mt-1">
                    {advice}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => handleDraw(1)}
                    disabled={tickets.length === 0 || isDrawing}
                    className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                   <div className="relative z-10 flex flex-col items-center gap-1">
                        {isDrawing && !showModal ? <RefreshCw className="w-6 h-6 animate-spin"/> : <Sparkles className="w-6 h-6 group-hover:animate-pulse"/>}
                        <span className="font-black text-lg">試抽一發</span>
                        {isAdvancedMode && <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">-${settings.pricePerTicket}</span>}
                   </div>
                   {/* Shine effect */}
                   <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
                
                <button
                    onClick={() => handleDraw(5)}
                    disabled={tickets.length < 5 || isDrawing}
                    className="relative overflow-hidden bg-white border-2 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 p-4 rounded-2xl shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 group"
                >
                   <span className="font-black text-2xl">5連抽</span>
                   {isAdvancedMode && <span className="text-[10px] font-bold opacity-60">-${settings.pricePerTicket * 5}</span>}
                </button>
            </div>

             {/* Toggle */}
             <button 
                onClick={() => setAnimateDraw(!animateDraw)}
                className="self-center flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm"
            >
                {animateDraw ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />}
                <span>開啟撕票動畫</span>
            </button>
            
            {/* Prize List (Sticker Style) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                 <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-black text-slate-700 text-xs uppercase flex items-center gap-2 tracking-wider">
                        <Trophy className="w-4 h-4 text-yellow-500" /> Prize List
                    </h3>
                 </div>
                 
                 <div className="p-2 space-y-1.5 overflow-y-auto max-h-[400px]">
                    {currentPrizes.map((prize) => {
                         const original = settings.prizes.find(p => p.id === prize.id)?.remainingCount || 0;
                         const isOut = prize.remainingCount === 0;
                         const totalValue = prize.remainingCount * prize.marketValue;
                         const percent = original > 0 ? (prize.remainingCount / original) * 100 : 0;

                         return (
                            <div key={prize.id} className={`group relative rounded-xl border p-2 flex items-center justify-between transition-all
                                ${isOut ? 'bg-slate-50 border-slate-100 opacity-50 grayscale' : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md'}
                            `}>
                                {/* Progress BG */}
                                {!isOut && <div className="absolute left-0 bottom-0 h-1 bg-indigo-500/10 transition-all duration-500" style={{width: `${percent}%`}}></div>}
                                
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-sm
                                        ${isOut ? 'bg-slate-200 text-slate-400' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}
                                    `}>
                                        {prize.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-700 text-sm leading-none">{prize.name}</div>
                                        {isAdvancedMode && !isOut && (
                                            <div className="text-[10px] font-medium text-indigo-500 mt-1">
                                                餘額 ${totalValue.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right relative z-10">
                                    <div className="text-lg font-black text-slate-800 leading-none">
                                        {prize.remainingCount}
                                        <span className="text-xs text-slate-300 font-medium ml-1">/ {original}</span>
                                    </div>
                                </div>
                            </div>
                         );
                    })}

                    {/* Trash Prizes */}
                    {(() => {
                        const trashCount = Math.max(0, currentRemainingCount - currentPrizes.reduce((a,b)=>a+b.remainingCount,0));
                        return (
                             <div className="rounded-xl border border-dashed border-slate-200 p-2 flex items-center justify-between bg-slate-50/50">
                                 <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-200 text-slate-500">
                                         小
                                     </div>
                                     <div className="text-xs font-bold text-slate-400">其他小賞</div>
                                 </div>
                                 <div className="text-lg font-black text-slate-400 leading-none">{trashCount}</div>
                             </div>
                        );
                    })()}
                 </div>

                 {/* Last One Footer */}
                 <div className="mt-auto bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-3 border-t border-yellow-100 flex justify-between items-center">
                    <span className="font-black text-yellow-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                        <Trophy className="w-3 h-3" /> Last One
                    </span>
                    {isAdvancedMode && <span className="font-black text-yellow-700 font-mono">${settings.lastOneValue}</span>}
                 </div>
            </div>
            
        </div>

        {/* --- RIGHT COLUMN: VISUALS --- */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Visual Grid Box */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 flex-1 min-h-[500px] flex flex-col relative">
                
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                         籤筒概況 Ticket Pool
                    </h3>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wide">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span> 大賞</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> 小賞</span>
                    </div>
                </div>
                
                <div className="flex-1 content-start grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-2">
                    {tickets.map((ticket, index) => (
                        <div 
                            key={ticket.id}
                            className="aspect-[3/4] relative group perspective-500"
                            title={`${ticket.name}`}
                        >
                            <div className={`w-full h-full rounded-md border flex flex-col items-center justify-center select-none transition-all duration-300 transform group-hover:-translate-y-1 group-hover:rotate-1 group-hover:shadow-md
                                ${ticket.type === 'grand' 
                                    ? 'bg-red-50 border-red-200 text-red-600' 
                                    : 'bg-slate-50 border-slate-200 text-slate-300'}
                            `}>
                                <span className={`text-xs font-black ${ticket.type === 'grand' ? 'opacity-100' : 'opacity-50'}`}>
                                    {ticket.type === 'grand' ? ticket.name[0] : '?'}
                                </span>
                                {/* Perforation line visual */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full border-r border-dashed border-current opacity-20"></div>
                            </div>
                        </div>
                    ))}
                    
                    {tickets.length === 0 && (
                        <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-300 animate-in fade-in duration-500 min-h-[300px]">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <Trophy className="w-10 h-10 text-slate-400" />
                            </div>
                            <p className="font-black text-lg text-slate-400">SOLD OUT</p>
                            <p className="text-sm font-medium">恭喜畢業！</p>
                        </div>
                    )}
                </div>
            </div>

            {/* History Ribbon */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-2 flex items-center gap-4 h-20 relative overflow-hidden">
                 <div className="flex flex-col items-start z-10 bg-white pr-4 border-r border-slate-100 h-full justify-center min-w-[80px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History</span>
                    <span className="text-sm font-black text-slate-700">抽獎紀錄</span>
                 </div>
                 
                 <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide items-center py-2 mask-linear-fade">
                    {history.length === 0 && <span className="text-slate-300 text-xs italic font-medium ml-2">尚未開始...</span>}
                    {history.map((ticket, idx) => (
                        <div key={ticket.id + idx} className={`flex-shrink-0 w-12 h-12 rounded-lg border flex items-center justify-center animate-in slide-in-from-right-8 duration-500
                            ${ticket.type === 'grand' ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}
                        `}>
                            <span className="font-black text-xs">{ticket.name[0]}</span>
                        </div>
                    ))}
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SimulationBoard;