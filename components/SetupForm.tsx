import React, { useState, useEffect } from 'react';
import { LotterySettings, PrizeConfig } from '../types';
import { Ticket, Calculator, Plus, Trash2, DollarSign, TrendingUp, ChevronDown, ChevronUp, Settings, BarChart3, Package, Crown } from 'lucide-react';

interface SetupFormProps {
  onStart: (settings: LotterySettings) => void;
}

const SetupForm: React.FC<SetupFormProps> = ({ onStart }) => {
  // Mode Toggle
  const [isAdvanced, setIsAdvanced] = useState(false);

  // Common Settings
  const [totalTickets, setTotalTickets] = useState(80);
  const [remainingTickets, setRemainingTickets] = useState(60);

  // Basic Mode Settings
  const [basicTargetCount, setBasicTargetCount] = useState(5);

  // Advanced Mode Settings
  const [pricePerTicket, setPricePerTicket] = useState(300);
  const [prizes, setPrizes] = useState<PrizeConfig[]>([
    { id: '1', name: 'A賞', remainingCount: 1, marketValue: 2000 },
    { id: '2', name: 'B賞', remainingCount: 1, marketValue: 1500 },
    { id: '3', name: 'C賞', remainingCount: 2, marketValue: 800 },
  ]);
  const [smallPrizeValue, setSmallPrizeValue] = useState(50);
  const [lastOneValue, setLastOneValue] = useState(1200);

  // Computed for Advanced
  const prizesTotalCount = prizes.reduce((sum, p) => sum + p.remainingCount, 0);
  const smallPrizeCount = Math.max(0, remainingTickets - prizesTotalCount);

  // Ensure remaining tickets constraint
  useEffect(() => {
    const minTickets = isAdvanced ? prizesTotalCount : basicTargetCount;
    if (minTickets > remainingTickets) {
      setRemainingTickets(minTickets);
    }
  }, [prizesTotalCount, basicTargetCount, remainingTickets, isAdvanced]);

  const addPrizeRow = () => {
    const nextChar = String.fromCharCode(65 + prizes.length); // A, B, C...
    setPrizes([
      ...prizes, 
      { 
        id: Date.now().toString(), 
        name: `${nextChar}賞`, 
        remainingCount: 1, 
        marketValue: 500 
      }
    ]);
  };

  const removePrizeRow = (id: string) => {
    setPrizes(prizes.filter(p => p.id !== id));
  };

  const updatePrize = (id: string, field: keyof PrizeConfig, value: string | number) => {
    setPrizes(prizes.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalPrizes: PrizeConfig[] = [];
    let finalPrice = 0;
    let finalLastOne = 0;
    let finalSmallValue = 0;

    if (isAdvanced) {
        finalPrizes = prizes;
        finalPrice = pricePerTicket;
        finalLastOne = lastOneValue;
        finalSmallValue = smallPrizeValue;
    } else {
        // Basic Mode: Create a generic "Grand Prize" based on count
        finalPrizes = [{
            id: 'basic-target',
            name: '大賞',
            remainingCount: basicTargetCount,
            marketValue: 0 // Not used in basic mode
        }];
        finalPrice = 0; // Signal to disable financial stats
        finalLastOne = 0;
        finalSmallValue = 0;
    }

    onStart({
      totalTickets,
      pricePerTicket: finalPrice,
      remainingTickets,
      prizes: finalPrizes,
      smallPrizeValue: finalSmallValue,
      lastOneValue: finalLastOne
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-800 mb-2">盤面設定</h2>
        <p className="text-slate-500">輸入當前抽獎進度，讓我們幫你分析機率</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Basic Stats Card */}
        <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
           
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" /> 基礎資訊
           </h3>

           <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">總籤數 (Total)</label>
                  <div className="relative group">
                    <Package className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="number"
                        value={totalTickets}
                        onChange={(e) => setTotalTickets(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">目前剩餘 (Remaining)</label>
                  <div className="relative group">
                    <Ticket className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="number"
                        min={isAdvanced ? prizesTotalCount : basicTargetCount}
                        max={totalTickets}
                        value={remainingTickets}
                        onChange={(e) => setRemainingTickets(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl font-black text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
               </div>
           </div>

           {/* Basic Mode: Target Count Input */}
            {!isAdvanced && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">目標大獎 (A/B/C) 剩餘數量</label>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 group">
                             <Crown className="absolute left-3 top-3 w-5 h-5 text-red-400 group-focus-within:text-red-500" />
                             <input
                                type="number"
                                min="1"
                                max={remainingTickets}
                                value={basicTargetCount}
                                onChange={(e) => setBasicTargetCount(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 bg-red-50 border border-red-200 rounded-xl text-2xl font-black text-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all text-center"
                            />
                        </div>
                        <span className="text-slate-400 font-bold whitespace-nowrap">個大獎</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">適用於不需計算金額，只想看機率的場合</p>
                </div>
            )}
        </div>

        {/* Toggle Button */}
        <div className="flex justify-center">
             <button
                type="button"
                onClick={() => setIsAdvanced(!isAdvanced)}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold border shadow-sm transition-all
                    ${isAdvanced 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}
                `}
            >
                {isAdvanced ? <Settings className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                {isAdvanced ? '收起進階設定' : '開啟進階設定 (價格與損益分析)'}
                {isAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
        </div>

        {/* Section 2: Advanced Settings */}
        {isAdvanced && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300 bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>

            {/* Price Config */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">一抽價格 (Price)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-green-500" />
                <input
                  type="number"
                  value={pricePerTicket}
                  onChange={(e) => setPricePerTicket(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
           </div>

           {/* Prize Table */}
            <div>
                <div className="flex justify-between items-end mb-3">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-500" /> 詳細獎項配置
                    </label>
                    <button 
                        type="button" 
                        onClick={addPrizeRow}
                        className="text-xs flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition font-bold"
                    >
                        <Plus className="w-3 h-3" /> 新增獎項
                    </button>
                </div>
                
                <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 px-2">
                        <div className="col-span-5">名稱</div>
                        <div className="col-span-3 text-center">數量</div>
                        <div className="col-span-3">市價</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Rows */}
                    {prizes.map((prize) => (
                        <div key={prize.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100 group hover:border-purple-200 hover:bg-purple-50/30 transition-colors">
                             <div className="col-span-5">
                                <input 
                                    type="text" 
                                    value={prize.name} 
                                    onChange={(e) => updatePrize(prize.id, 'name', e.target.value)}
                                    className="w-full bg-transparent font-bold text-slate-700 focus:outline-none border-b border-transparent focus:border-purple-300"
                                />
                             </div>
                             <div className="col-span-3">
                                <input 
                                    type="number" 
                                    min="0"
                                    value={prize.remainingCount} 
                                    onChange={(e) => updatePrize(prize.id, 'remainingCount', Number(e.target.value))}
                                    className="w-full text-center bg-white border border-slate-200 rounded-md py-1 font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                             </div>
                             <div className="col-span-3 relative">
                                <span className="absolute left-1.5 top-1.5 text-xs text-slate-400">$</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={prize.marketValue} 
                                    onChange={(e) => updatePrize(prize.id, 'marketValue', Number(e.target.value))}
                                    className="w-full pl-4 pr-1 bg-transparent font-medium text-green-600 focus:outline-none border-b border-transparent focus:border-green-300"
                                />
                             </div>
                             <div className="col-span-1 text-center">
                                <button type="button" onClick={() => removePrizeRow(prize.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                        </div>
                    ))}

                    {/* Small Prize Row */}
                    <div className="grid grid-cols-12 gap-2 items-center bg-slate-100/50 p-2 rounded-lg border border-dashed border-slate-200 mt-2">
                        <div className="col-span-5 text-sm text-slate-500 font-medium pl-1">其餘小賞 (F/G/H...)</div>
                        <div className="col-span-3 text-center text-sm font-mono text-slate-400">{smallPrizeCount}</div>
                        <div className="col-span-3 relative">
                            <span className="absolute left-1.5 top-1.5 text-xs text-slate-400">$</span>
                            <input 
                                type="number" 
                                value={smallPrizeValue} 
                                onChange={(e) => setSmallPrizeValue(Number(e.target.value))}
                                className="w-full pl-4 pr-1 bg-transparent font-medium text-slate-500 focus:outline-none border-b border-transparent focus:border-slate-300"
                            />
                        </div>
                        <div className="col-span-1"></div>
                    </div>
                </div>
            </div>

            {/* Last One */}
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <span className="font-black text-yellow-700 block text-sm flex items-center gap-2">
                        <Crown className="w-4 h-4" /> Last One 賞
                    </span>
                    <span className="text-xs text-yellow-600/80">最後一抽的特別獎勵</span>
                </div>
                <div className="relative w-32">
                    <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-yellow-600" />
                    <input
                        type="number"
                        value={lastOneValue}
                        onChange={(e) => setLastOneValue(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-yellow-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 text-yellow-800 font-bold text-right outline-none"
                    />
                </div>
            </div>
        </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-indigo-500/20 transform transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
          >
            <Calculator className="w-6 h-6" />
            建立模擬盤面
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetupForm;