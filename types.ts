export interface PrizeConfig {
  id: string;
  name: string; // e.g. "A賞", "B賞"
  remainingCount: number;
  marketValue: number;
}

export interface LotterySettings {
  totalTickets: number; // 該套總籤數 (for reference)
  pricePerTicket: number; // 一抽多少錢
  remainingTickets: number; // 目前剩餘總張數
  prizes: PrizeConfig[]; // 重點獎項列表
  smallPrizeValue: number; // 剩下的雜魚賞平均價值
  lastOneValue: number; // Last One 賞價值
}

export interface Ticket {
  id: string;
  name: string;
  value: number;
  isRevealed: boolean;
  type: 'grand' | 'small'; // 大獎或小賞
}
