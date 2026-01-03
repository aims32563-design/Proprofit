
export interface CalculationRecord {
  id: string;
  timestamp: number;
  productName: string;
  costPrice: number;
  sellingPrice: number;
  profit: number;
  margin: number;
  markup: number;
  quantity: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface BusinessProfile {
  name: string;
  industry: string;
  currency: string;
  currencyFormat: 'prefix' | 'suffix';
}

export interface AIInsight {
  type: 'optimization' | 'warning' | 'strategy';
  message: string;
  impact: string;
}
