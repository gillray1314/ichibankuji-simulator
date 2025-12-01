import { LotterySettings } from '../types';

export const getLotteryAdvice = async (settings: LotterySettings): Promise<string> => {
  const { remainingTickets, pricePerTicket, prizes, smallPrizeValue, lastOneValue } = settings;

  if (remainingTickets <= 0) {
      return "抽獎已結束，恭喜畢業！";
  }

  // --- SIMPLE MODE ANALYSIS (No Prices) ---
  if (pricePerTicket === 0) {
      const grandPrizeCount = prizes.reduce((sum, p) => sum + p.remainingCount, 0);
      const probability = (grandPrizeCount / remainingTickets) * 100;
      
      let advice = `🎯 **目前大獎機率：${probability.toFixed(1)}%**\n(剩餘 ${grandPrizeCount} 個大獎 / ${remainingTickets} 張籤)\n\n`;

      if (probability >= 50) {
        advice += `🔥 **極熱盤！**\n平均每 2 抽就有 1 個大獎，這機率非常高，建議出手！`;
      } else if (probability >= 20) {
        advice += `📈 **機率不錯**\n大獎密度高於平均，可以嘗試試手氣。`;
      } else if (probability >= 10) {
        advice += `⚖️ **普通盤**\n機率中規中矩，看您對獎品的喜愛程度決定。`;
      } else {
        advice += `📉 **機率偏低**\n目前大獎密度較低，建議觀望或等待其他人先抽。`;
      }

      if (remainingTickets <= 15) {
          advice += `\n\n💡 **Last One 賞注意**\n剩餘張數很少，可以考慮直接包牌帶走 Last One！`;
      }

      return advice;
  }

  // --- ADVANCED MODE ANALYSIS (Financials) ---

  // Calculate Market Value of the Box
  const prizesValue = prizes.reduce((sum, p) => sum + (p.remainingCount * p.marketValue), 0);
  const remainingSmallPrizes = remainingTickets - prizes.reduce((sum, p) => sum + p.remainingCount, 0);
  const smallPrizesValue = remainingSmallPrizes * smallPrizeValue;
  
  const totalBoxValue = prizesValue + smallPrizesValue + lastOneValue; // If you clear the box, you get everything + Last One
  const costToClear = remainingTickets * pricePerTicket;
  const profitClearing = totalBoxValue - costToClear;

  // Calculate Single Draw EV (Expected Value)
  const singleDrawEV = (prizesValue + smallPrizesValue) / remainingTickets;
  const evRatio = (singleDrawEV / pricePerTicket) * 100;

  // Logic Tree

  // 1. CLEAR BOX OPPORTUNITY (Most Important)
  if (profitClearing > 0) {
      return `🤑 **必勝時刻！全包穩賺！**\n清台成本 $${costToClear}，但總價值高達 $${totalBoxValue}。\n直接全包現賺 $${profitClearing}，不要猶豫，馬上掃台！`;
  }

  // 2. High EV Scope
  if (profitClearing > -1000 && remainingTickets <= 15) {
      return `🔥 **射程範圍內！**\n清台僅虧損 $${Math.abs(profitClearing)}，如果有愛或想拚大獎，可以考慮全包帶走 Last One。\n目前單抽期望值回本率：${evRatio.toFixed(1)}%。`;
  }

  // 3. Single Draw EV Analysis
  if (evRatio >= 120) {
      return `🌟 **神盤！超高期望值**\n每一抽的平均價值約 $${singleDrawEV.toFixed(0)}，遠高於票價 $${pricePerTicket}。\n現在抽是正期望值，建議大力進場！`;
  }

  if (evRatio >= 90 && evRatio < 120) {
      return `📈 **盤面不錯**\n單抽回本率 ${evRatio.toFixed(1)}%，大獎密度或價值尚可。\n如果您喜歡這些獎品，這是個合理的進場點。`;
  }

  if (evRatio >= 60 && evRatio < 90) {
      return `⚖️ **普通盤**\n單抽期望值 $${singleDrawEV.toFixed(0)} (回本率 ${evRatio.toFixed(1)}%)。\n除非對特定獎項很有愛，否則建議觀望。`;
  }

  // 4. Bad EV
  return `📉 **盤面極差 (勸退)**\n單抽期望值僅 $${singleDrawEV.toFixed(0)}，抽一次平均虧損 $${(pricePerTicket - singleDrawEV).toFixed(0)}。\n清台預估虧損 $${Math.abs(profitClearing)}。\n請保護好錢包，轉身離開！`;
};