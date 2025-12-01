import React, { useState, useEffect } from 'react';
import { LotterySettings, Ticket, PrizeConfig } from '../types';
import { RefreshCw, Trophy, Sparkles, Calculator, Square, CheckSquare, Coins, ArrowUpRight, TrendingUp } from 'lucide-react';
import { getLotteryAdvice } from '../services/geminiService';
import { soundEngine } from '../utils/sound';

const NO_OP = () => {};

// --- Custom Japanese Toggle Switch ---
const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between gap-4 cursor-pointer group" onClick={onChange}>
        <span className="text-xs font-bold font-serif text-stone-500 group-hover:text-japan-dark transition-colors tracking-widest">{label}</span>
        <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 border ${checked ? 'bg-japan-red border-japan-red' : 'bg-stone-200 border-stone-300'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 transform ${checked ? 'translate-x-7' : 'translate-x-1'}`}></div>
        </div>
    </div>
);

// --- Ticket Component ---
const TicketRevealCard: React.FC<{ 
    ticket: Ticket; 
    delay: number;
    onReveal: () => void;
    isAdvancedMode: boolean;
}> = ({ ticket, delay, onReveal, isAdvancedMode }) => {
    const [status, setStatus] = useState<'idle' | 'shaking' | 'revealed'>('idle');
    const isGrand = ticket.type === 'grand';

    useEffect(() => {
        let shakeTimer: ReturnType<typeof setTimeout>;
        let revealTimer: ReturnType<typeof setTimeout>;

        if (delay < 50) {
            setStatus('revealed');
            onReveal();
            return;
        }

        const shakeStartTime = Math.max(0, delay - 200);
        shakeTimer = setTimeout(() => setStatus(p => p === 'idle' ? 'shaking' : p), shakeStartTime);
        
        revealTimer = setTimeout(() => {
            setStatus('revealed');
            if(isGrand) soundEngine.playGrandWin();
            else soundEngine.playReveal();
            onReveal();
        }, delay);

        return () => { clearTimeout(shakeTimer); clearTimeout(revealTimer); };
    }, [delay, onReveal, isGrand]);

    const handleClick = () => {
        if (status !== 'revealed') {
            setStatus('revealed');
            if(isGrand) soundEngine.playGrandWin();
            else soundEngine.playReveal();
            onReveal();
        }
    };

    return (
        <div className={`ticket-peel-container w-24 h-36 select-none ${status === 'shaking' ? 'is-shaking' : ''} ${status === 'revealed' ? 'is-revealed' : ''}`} onClick={handleClick}>
            <div className="ticket-inner">
                {/* Front (Locked) */}
                <div className="ticket-front">
                    <div className="border-2 border-dashed border-stone-700/50 p-1 w-full h-full flex flex-col items-center justify-center bg-japan-dark text-white">
                        <div className="text-3xl font-serif font-black mb-1 opacity-90">籤</div>
                        <div className="w-8 h-[1px] bg-stone-500 my-2"></div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-70">Kuji</div>
                    </div>
                </div>

                {/* Back (Revealed) */}
                <div className={`ticket-back overflow-hidden relative ${isGrand ? 'border-japan-red bg-[#fffaf0]' : 'border-stone-300 bg-white'}`}>
                    {isGrand && <div className="absolute top-0 left-0 w-full h-2 bg-japan-red"></div>}
                    
                    <span className={`text-5xl font-serif font-black z-10 ${isGrand ? 'text-japan-red drop-shadow-sm' : 'text-stone-800'}`}>
                        {ticket.name[0]}
                    </span>
                    <span className={`text-xs font-bold z-10 mt-2 px-3 py-1 border font-serif ${isGrand ? 'border-japan-red text-japan-red bg-red-50' : 'border-stone-300 text-stone-500'}`}>
                        {ticket.name}
                    </span>
                    {isAdvancedMode && (
                        <span className="text-[10px] mt-2 font-bold text-stone-400 font-sans">${ticket.value}</span>
                    )}
                </div>
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
  const [soundEnabled, setSoundEnabled] = useState(true);
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
    const trashCount = settings.remainingTickets - newTickets.length;
    for (let i = 0; i < trashCount; i++) {
      newTickets.push({ id: `trash-${i}`, name: '小賞', value: settings.smallPrizeValue, isRevealed: false, type: 'small' });
    }
    for (let i = newTickets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTickets[i], newTickets[j]] = [newTickets[j], newTickets[i]];
    }
    setTickets(newTickets);
  }, []);

  useEffect(() => {
      const runAdvice = async () => {
        const result = await getLotteryAdvice({ ...settings, remainingTickets: currentRemainingCount, prizes: currentPrizes });
        setAdvice(result);
      };
      runAdvice();
  }, [currentRemainingCount, currentPrizes, settings]);

  const toggleSound = () => {
      soundEngine.toggleMute();
      setSoundEnabled(!soundEnabled);
  };

  const handleDraw = (count: number) => {
    if (tickets.length < count || isDrawing) return;
    soundEngine.playClick();
    setIsDrawing(true);
    soundEngine.playDrawStart();

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
        setTimeout(() => setShowModal(true), 500);
    } else {
        const revealed = drawn.map(t => ({...t, isRevealed: true}));
        const hasGrand = revealed.some(t => t.type === 'grand');
        if(hasGrand) soundEngine.playGrandWin(); else soundEngine.playReveal();
        
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
    soundEngine.playClick();
    if (pendingState) {
        const revealedBatch = currentDrawBatch.map(t => ({...t, isRevealed: true}));
        applyStateUpdate(pendingState.tickets, pendingState.prizes, pendingState.count, revealedBatch);
    }
    setShowModal(false);
    setPendingState(null);
    setIsDrawing(false);
  };

  // Calculations
  const costToClear = currentRemainingCount * settings.pricePerTicket;
  const currentBoxValue = 
    currentPrizes.reduce((sum, p) => sum + (p.remainingCount * p.marketValue), 0) + 
    ((currentRemainingCount - currentPrizes.reduce((s, p) => s + p.remainingCount, 0)) * settings.smallPrizeValue) + 
    settings.lastOneValue;
  const profit = currentBoxValue - costToClear;
  const grandPrizeProb = currentRemainingCount > 0 ? (currentPrizes.reduce((sum, p) => sum + p.remainingCount, 0) / currentRemainingCount) * 100 : 0;
  const singleDrawEV = isAdvancedMode ? (currentBoxValue - settings.lastOneValue) / (currentRemainingCount || 1) : 0;

  // Ema (Wooden Plaque) Style Card
  const StatCard = ({ label, value, sub, highlight, icon: Icon }: any) => (
      <div className={`relative p-4 overflow-hidden group transition-all h-full
        bg-[#fffaf0] border border-stone-200
        ${highlight ? 'shadow-md border-japan-red/20' : 'shadow-sm'}
      `}>
          {/* Wood grain effect via CSS gradient */}
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(45deg,transparent_25%,#000_25%,#000_50%,transparent_50%,transparent_75%,#000_75%,#000_100%)] bg-[length:4px_4px]"></div>
          
          {/* Chamfered corners (visual only via pseudo-elements or clip-path if desired, keeping simple for now) */}
          <div className={`absolute top-0 left-0 w-1 h-full ${highlight ? 'bg-japan-red' : 'bg-stone-300'}`}></div>

          <div className="relative z-10 flex flex-col h-full justify-between pl-3">
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold font-serif uppercase tracking-widest text-stone-500`}>{label}</span>
                {Icon && <Icon className={`w-4 h-4 ${highlight ? 'text-japan-red' : 'text-stone-300'}`} />}
            </div>
            <div className={`text-2xl font-black font-serif tracking-tight ${highlight ? 'text-japan-red' : 'text-stone-800'}`}>
                {value}
            </div>
            {sub && <div className="text-[10px] font-bold mt-1 text-stone-400 font-sans">{sub}</div>}
          </div>
      </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      
      {/* --- SCROLL MODAL (Result) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="washi-card max-w-3xl w-full max-h-[80vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl border-4 border-japan-dark">
                {/* Scroll Top */}
                <div className="bg-japan-dark text-white py-4 text-center border-b-2 border-japan-gold relative">
                     <div className="absolute inset-x-0 bottom-0 h-[2px] bg-japan-gold"></div>
                    <h3 className="text-2xl font-black font-serif tracking-[0.3em]">
                        当選結果
                    </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-10 bg-[#fdfbf7] min-h-[300px] flex items-center justify-center">
                    <div className="flex flex-wrap justify-center gap-6">
                        {currentDrawBatch.map((ticket, idx) => (
                            <TicketRevealCard 
                                key={ticket.id} 
                                ticket={ticket} 
                                delay={200 + (idx * 400)} 
                                onReveal={NO_OP}
                                isAdvancedMode={isAdvancedMode}
                            />
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-stone-200 bg-stone-50 flex justify-center">
                    <button 
                        onClick={handleCloseModal}
                        className="w-full max-w-xs bg-japan-red hover:bg-red-800 text-white font-serif font-bold py-3 rounded shadow-lg transition-all active:scale-95 border-2 border-transparent hover:border-japan-gold"
                    >
                        收下籤紙
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- DASHBOARD HUD --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div onClick={() => {soundEngine.playClick(); onReset();}} className="cursor-pointer">
                 <StatCard 
                    label="剩餘籤數" 
                    value={<>{currentRemainingCount} <span className="text-sm text-stone-400 font-sans font-normal">/ {settings.totalTickets}</span></>} 
                    icon={RefreshCw}
                 />
            </div>
            <StatCard 
                label="大獎機率" 
                value={`${grandPrizeProb.toFixed(1)}%`} 
                sub={`剩餘大賞: ${currentPrizes.reduce((a,b)=>a+b.remainingCount,0)}`} 
                highlight={grandPrizeProb > 30}
                icon={TrendingUp}
            />
             {isAdvancedMode ? (
                 <>
                    <StatCard 
                        label="期望值 (EV)" 
                        value={`$${singleDrawEV.toFixed(0)}`} 
                        sub={`成本: $${settings.pricePerTicket}`} 
                        highlight={singleDrawEV > settings.pricePerTicket}
                        icon={ArrowUpRight}
                    />
                    <StatCard 
                        label="包牌損益" 
                        value={`${profit>0?'+':''}${profit.toLocaleString()}`} 
                        sub="若現在全包" 
                        highlight={profit > -500}
                        icon={Calculator}
                    />
                 </>
             ) : (
                 <div className="col-span-2 flex items-center justify-center text-stone-400 font-bold text-xs bg-stone-100 border border-dashed border-stone-300 rounded">
                    財務分析未啟用
                 </div>
             )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- CONTROLS --- */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
            
            {/* Analysis Box */}
            <div className="washi-card p-6 bg-[#fffaf0] border-l-4 border-l-japan-indigo">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-200/50">
                    <Sparkles className="w-4 h-4 text-japan-indigo" />
                    <h4 className="text-xs font-bold font-serif text-japan-indigo uppercase tracking-widest">軍師建議</h4>
                </div>
                <div className="text-sm font-medium text-stone-700 leading-relaxed whitespace-pre-line font-serif">
                    {advice}
                </div>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => handleDraw(1)}
                    disabled={tickets.length === 0 || isDrawing}
                    className="relative overflow-hidden bg-japan-dark hover:bg-stone-800 text-white rounded p-4 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                   <div className="flex flex-col items-center gap-1 relative z-10">
                        {isDrawing && !showModal ? <RefreshCw className="w-6 h-6 animate-spin text-white"/> : <div className="text-2xl font-serif font-black tracking-widest">一抽</div>}
                        <span className="text-[10px] font-bold uppercase opacity-60">Single Draw</span>
                   </div>
                </button>
                
                <button
                    onClick={() => handleDraw(5)}
                    disabled={tickets.length < 5 || isDrawing}
                    className="relative bg-white border border-stone-300 hover:border-japan-red hover:text-japan-red text-stone-600 rounded p-4 active:scale-95 transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1 group shadow-sm"
                >
                   <span className="font-serif font-black text-2xl tracking-widest">五連</span>
                   <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">Multi-Draw</span>
                </button>
            </div>

             {/* Custom Switches */}
             <div className="washi-card p-4 flex justify-around items-center bg-white">
                <ToggleSwitch label="動畫效果" checked={animateDraw} onChange={() => {soundEngine.playClick(); setAnimateDraw(!animateDraw);}} />
                <div className="w-px h-8 bg-stone-200"></div>
                <ToggleSwitch label="音效開關" checked={soundEnabled} onChange={toggleSound} />
            </div>
            
            {/* Prize List (Strip Style) */}
            <div className="washi-card flex-1 flex flex-col overflow-hidden bg-white">
                 <div className="px-5 py-3 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
                    <h3 className="font-serif font-black text-stone-600 text-sm tracking-widest">
                        剩餘賞單
                    </h3>
                 </div>
                 
                 <div className="p-3 space-y-2 overflow-y-auto max-h-[350px] scrollbar-thin">
                    {currentPrizes.map((prize) => {
                         const original = settings.prizes.find(p => p.id === prize.id)?.remainingCount || 0;
                         const isOut = prize.remainingCount === 0;
                         const percent = original > 0 ? (prize.remainingCount / original) * 100 : 0;

                         return (
                            <div key={prize.id} className={`relative p-2 flex items-center justify-between transition-all rounded-sm overflow-hidden border
                                ${isOut ? 'bg-stone-50 border-stone-100 opacity-50' : 'bg-white border-stone-200 shadow-sm'}
                            `}>
                                {/* Progress Bar Background */}
                                {!isOut && <div className="absolute left-0 bottom-0 h-1 bg-japan-red/20 transition-all duration-500 pointer-events-none" style={{width: `${percent}%`}}></div>}
                                
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={`w-8 h-8 flex items-center justify-center font-serif font-black text-lg border
                                        ${isOut ? 'bg-stone-200 border-stone-200 text-stone-400' : 'bg-japan-red border-japan-red text-white'}
                                    `}>
                                        {prize.name[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-stone-700 font-serif">{prize.name}</span>
                                        {isAdvancedMode && <span className="text-[10px] text-stone-400 font-bold font-sans">${prize.marketValue}</span>}
                                    </div>
                                </div>

                                <div className="text-right relative z-10">
                                    <span className={`text-xl font-black font-serif ${isOut ? 'text-stone-300' : 'text-japan-dark'}`}>{prize.remainingCount}</span>
                                    <span className="text-[10px] text-stone-400 ml-1 font-bold">/ {original}</span>
                                </div>
                            </div>
                         );
                    })}
                 </div>
            </div>
        </div>

        {/* --- TICKET GRID --- */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="washi-card p-8 flex-1 min-h-[500px] flex flex-col relative bg-white border border-stone-200 shadow-md">
                
                <div className="flex justify-between items-center mb-8 border-b border-stone-100 pb-4">
                    <h3 className="font-serif font-black text-japan-dark text-lg tracking-widest flex items-center gap-2">
                         <Coins className="w-5 h-5 text-japan-gold" /> 籤筒狀態
                    </h3>
                    <div className="flex gap-6 text-xs font-bold text-stone-400 uppercase tracking-widest">
                        <span className="flex items-center gap-2"><span className="w-3 h-3 border border-japan-red bg-red-50"></span> 大賞</span>
                        <span className="flex items-center gap-2"><span className="w-3 h-3 border border-stone-300 bg-white"></span> 小賞</span>
                    </div>
                </div>
                
                <div className="flex-1 content-start grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
                    {tickets.map((ticket) => (
                        <div 
                            key={ticket.id}
                            className={`aspect-[3/4] rounded-sm shadow-sm border transition-all duration-300 group relative overflow-hidden
                                ${ticket.type === 'grand' 
                                    ? 'bg-red-50 border-japan-red/30' 
                                    : 'bg-white border-stone-200'}
                            `}
                        >
                            {/* Sticker look */}
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-stone-100/50"></div>
                            
                            {/* Hidden indicator */}
                            <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className={`w-2 h-2 rounded-full ${ticket.type === 'grand' ? 'bg-japan-red' : 'bg-stone-300'}`}></div>
                            </div>
                        </div>
                    ))}
                    
                    {tickets.length === 0 && (
                        <div className="col-span-full h-full flex flex-col items-center justify-center text-stone-300 min-h-[300px]">
                            <Trophy className="w-20 h-20 mb-6 opacity-30 text-japan-gold" />
                            <p className="font-serif font-bold text-2xl tracking-[0.5em] text-stone-400">完售御禮</p>
                        </div>
                    )}
                </div>
            </div>

            {/* History Feed */}
            <div className="washi-card h-24 flex items-center relative px-2 bg-stone-50 border-t-2 border-t-japan-red/50">
                 <div className="px-6 border-r border-stone-200 h-12 flex flex-col justify-center text-right">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">抽出</span>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">履歷</span>
                 </div>
                 
                 <div className="flex-1 flex gap-3 overflow-x-auto scrollbar-hide items-center px-4 mask-linear-fade py-2">
                    {history.map((ticket, idx) => (
                        <div key={ticket.id + idx} className={`flex-shrink-0 w-12 h-14 rounded-sm border flex items-center justify-center font-serif font-black text-lg shadow-sm
                            ${ticket.type === 'grand' ? 'bg-japan-red border-japan-red text-white' : 'bg-white border-stone-300 text-stone-400'}
                        `}>
                            {ticket.name[0]}
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