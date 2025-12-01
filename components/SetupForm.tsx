import React, { useState } from 'react';
import { LotterySettings, PrizeConfig } from '../types';
import { Plus, Trash2, DollarSign, ChevronDown, ChevronUp, Settings, BarChart3, Package, Crown, Ticket, ArrowRight, Brush } from 'lucide-react';
import { soundEngine } from '../utils/sound';

interface SetupFormProps {
  onStart: (settings: LotterySettings) => void;
}

const SetupForm: React.FC<SetupFormProps> = ({ onStart }) => {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [totalTickets, setTotalTickets] = useState<number | string>(80);
  const [remainingTickets, setRemainingTickets] = useState<number | string>(60);
  const [basicTargetCount, setBasicTargetCount] = useState<number | string>(5);
  const [pricePerTicket, setPricePerTicket] = useState<number | string>(300);
  const [prizes, setPrizes] = useState<PrizeConfig[]>([
    { id: '1', name: 'A賞', remainingCount: 1, marketValue: 2000 },
    { id: '2', name: 'B賞', remainingCount: 1, marketValue: 1500 },
    { id: '3', name: 'C賞', remainingCount: 2, marketValue: 800 },
  ]);
  const [smallPrizeValue, setSmallPrizeValue] = useState<number | string>(50);
  const [lastOneValue, setLastOneValue] = useState<number | string>(1200);

  const getVal = (v: number | string) => (v === '' ? 0 : Number(v));
  const prizesTotalCount = prizes.reduce((sum, p) => sum + p.remainingCount, 0);
  const currentRemaining = getVal(remainingTickets);
  const smallPrizeCount = Math.max(0, currentRemaining - prizesTotalCount);

  const playClick = () => soundEngine.playClick();

  const addPrizeRow = () => {
    playClick();
    const nextChar = String.fromCharCode(65 + prizes.length);
    setPrizes([...prizes, { id: Date.now().toString(), name: `${nextChar}賞`, remainingCount: 1, marketValue: 500 }]);
  };

  const removePrizeRow = (id: string) => {
    playClick();
    setPrizes(prizes.filter(p => p.id !== id));
  };

  const updatePrize = (id: string, field: keyof PrizeConfig, value: string | number) => {
    setPrizes(prizes.map(p => {
        if (p.id !== id) return p;
        if (field === 'name') return { ...p, name: value as string };
        return { ...p, [field]: value === '' ? 0 : Number(value) };
    }));
  };

  const handleInputChange = (setter: (val: string | number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '') setter('');
      else setter(Number(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playDrawStart();

    const finalTotal = getVal(totalTickets);
    let finalRemaining = getVal(remainingTickets);
    const finalBasicTarget = getVal(basicTargetCount);

    let finalPrizes: PrizeConfig[] = [];
    let finalPrice = 0;
    let finalLastOne = 0;
    let finalSmallValue = 0;

    if (isAdvanced) {
        finalPrizes = prizes;
        finalPrice = getVal(pricePerTicket);
        finalLastOne = getVal(lastOneValue);
        finalSmallValue = getVal(smallPrizeValue);
        const minTickets = prizesTotalCount;
        if (finalRemaining < minTickets) {
            finalRemaining = minTickets;
            setRemainingTickets(minTickets);
        }
    } else {
        const actualTarget = Math.min(finalBasicTarget, finalRemaining);
        finalPrizes = [{ id: 'basic-target', name: '大賞', remainingCount: actualTarget, marketValue: 0 }];
        finalPrice = 0;
        finalLastOne = 0;
        finalSmallValue = 0;
    }

    onStart({
      totalTickets: finalTotal,
      pricePerTicket: finalPrice,
      remainingTickets: finalRemaining,
      prizes: finalPrizes,
      smallPrizeValue: finalSmallValue,
      lastOneValue: finalLastOne
    });
  };

  const InputField = ({ label, value, onChange, icon: Icon, big = false }: any) => (
      <div className="space-y-1">
        <label className="block text-xs font-bold font-serif text-stone-400 uppercase tracking-widest flex items-center gap-2">
            {Icon && <Icon className="w-3 h-3" />} {label}
        </label>
        <div className="relative group">
            <input
                type="number"
                min="1"
                value={value}
                onChange={onChange}
                onFocus={() => soundEngine.playHover()}
                className={`w-full bg-transparent border-b-2 border-stone-200 rounded-none text-japan-dark 
                font-serif font-black ${big ? 'text-4xl py-2' : 'text-xl py-1'}
                focus:border-japan-red focus:outline-none transition-all placeholder:text-stone-300`}
            />
        </div>
      </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Main Card */}
        <div className="washi-card p-10 relative overflow-hidden bg-white">
           <div className="grid grid-cols-2 gap-12">
               <InputField label="總籤數" value={totalTickets} onChange={handleInputChange(setTotalTickets)} icon={Package} />
               <InputField label="剩餘籤數" value={remainingTickets} onChange={handleInputChange(setRemainingTickets)} icon={Ticket} />
           </div>

            {!isAdvanced && (
                <div className="mt-10 pt-8 border-t border-dashed border-stone-300">
                    <div className="w-full text-center">
                        <InputField label="大獎總數" value={basicTargetCount} onChange={handleInputChange(setBasicTargetCount)} icon={Crown} big={true} />
                        <p className="text-xs text-stone-400 mt-2 font-serif">請輸入您鎖定的大獎剩餘數量</p>
                    </div>
                </div>
            )}
        </div>

        {/* Advanced Toggle */}
        <div className="flex justify-center">
             <button
                type="button"
                onClick={() => { playClick(); setIsAdvanced(!isAdvanced); }}
                className={`flex items-center gap-2 px-6 py-2 text-xs font-bold font-serif tracking-widest transition-all
                    ${isAdvanced 
                        ? 'text-japan-red underline decoration-2 underline-offset-4' 
                        : 'text-stone-400 hover:text-stone-600'}
                `}
            >
                {isAdvanced ? <Settings className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />}
                進階設定 {isAdvanced ? '開啟' : '關閉'}
            </button>
        </div>

        {/* Advanced Section */}
        {isAdvanced && (
        <div className="washi-card p-8 animate-flip-in relative bg-white border-t-4 border-t-japan-indigo">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-japan-indigo text-white px-3 py-1 text-[10px] font-bold tracking-widest rounded-sm">
                詳細設定
            </div>
            
            {/* Price */}
            <div className="mb-10 max-w-[200px] mx-auto text-center">
               <InputField label="一抽價格" value={pricePerTicket} onChange={handleInputChange(setPricePerTicket)} icon={DollarSign} />
           </div>

           {/* Prizes */}
            <div>
                <div className="flex justify-between items-end mb-4 border-b border-stone-200 pb-2">
                    <label className="text-sm font-black font-serif text-stone-600 flex items-center gap-2">
                        <Brush className="w-4 h-4" /> 賞單詳情
                    </label>
                    <button 
                        type="button" 
                        onClick={addPrizeRow}
                        className="text-xs font-bold flex items-center gap-1 text-japan-indigo hover:bg-stone-100 px-3 py-1 rounded transition"
                    >
                        <Plus className="w-3 h-3" /> 新增
                    </button>
                </div>
                
                <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-stone-400 px-2 uppercase tracking-wide mb-2">
                        <div className="col-span-4">賞名</div>
                        <div className="col-span-3 text-center">剩餘</div>
                        <div className="col-span-4 text-right">市價</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Rows */}
                    {prizes.map((prize) => (
                        <div key={prize.id} className="grid grid-cols-12 gap-2 items-center hover:bg-stone-50 p-2 rounded transition-colors group">
                             <div className="col-span-4">
                                <input 
                                    type="text" 
                                    value={prize.name} 
                                    onChange={(e) => updatePrize(prize.id, 'name', e.target.value)}
                                    className="w-full bg-transparent font-serif font-black text-japan-dark focus:outline-none text-lg border-b border-transparent focus:border-stone-300"
                                />
                             </div>
                             <div className="col-span-3">
                                <input 
                                    type="number" 
                                    min="0"
                                    value={prize.remainingCount} 
                                    onChange={(e) => updatePrize(prize.id, 'remainingCount', e.target.value)}
                                    className="w-full text-center bg-transparent border-b border-stone-200 py-1 font-serif font-bold focus:border-japan-red outline-none"
                                />
                             </div>
                             <div className="col-span-4">
                                <input 
                                    type="number" 
                                    min="0"
                                    value={prize.marketValue} 
                                    onChange={(e) => updatePrize(prize.id, 'marketValue', e.target.value)}
                                    className="w-full bg-transparent text-right font-serif text-stone-600 focus:outline-none focus:text-japan-red font-bold border-b border-transparent focus:border-stone-300"
                                />
                             </div>
                             <div className="col-span-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={() => removePrizeRow(prize.id)} className="text-stone-300 hover:text-japan-red">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                        </div>
                    ))}

                    <div className="grid grid-cols-12 gap-2 items-center p-3 mt-4 bg-stone-50 rounded">
                        <div className="col-span-4 text-xs font-bold text-stone-500 font-serif">其餘小賞</div>
                        <div className="col-span-3 text-center text-sm font-bold text-stone-400 font-serif">{smallPrizeCount}</div>
                        <div className="col-span-4">
                            <input 
                                type="number" 
                                value={smallPrizeValue} 
                                onChange={handleInputChange(setSmallPrizeValue)}
                                className="w-full bg-transparent text-right font-serif font-bold text-stone-500 focus:outline-none border-b border-stone-200 focus:border-stone-400"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Last One */}
            <div className="mt-8 bg-japan-gold/5 border border-japan-gold/20 rounded p-4 flex items-center justify-between">
                <div>
                    <span className="font-black font-serif text-japan-gold block text-sm flex items-center gap-2">
                        <Crown className="w-4 h-4 fill-current" /> Last One 賞
                    </span>
                </div>
                <div className="w-32 flex items-center gap-1 border-b border-japan-gold/30">
                    <DollarSign className="w-4 h-4 text-japan-gold/50" />
                    <input
                        type="number"
                        value={lastOneValue}
                        onChange={handleInputChange(setLastOneValue)}
                        className="w-full bg-transparent py-1 px-2 text-right text-japan-gold font-bold text-lg outline-none font-serif"
                    />
                </div>
            </div>
        </div>
        )}

        <div className="pt-6 flex justify-center">
          <button
            type="submit"
            className="group relative inline-flex items-center justify-center p-1"
          >
            {/* Outer ring */}
            <div className="absolute inset-0 border-2 border-japan-red rounded opacity-80 group-hover:opacity-100 transition-opacity transform rotate-1 group-hover:rotate-0 transition-transform duration-300"></div>
            <div className="absolute inset-0 border-2 border-japan-red rounded opacity-80 group-hover:opacity-100 transition-opacity transform -rotate-1 group-hover:rotate-0 transition-transform duration-300"></div>
            
            <div className="relative bg-japan-red hover:bg-red-700 text-white font-serif font-black py-4 px-12 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]">
               <div className="flex flex-col items-center leading-none">
                    <span className="text-2xl tracking-[0.5em] ml-2">模擬開始</span>
                    <span className="text-[10px] tracking-widest uppercase opacity-70 mt-1">Start Simulation</span>
               </div>
            </div>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetupForm;