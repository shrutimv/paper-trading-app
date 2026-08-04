import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type Holding = { 
  symbol: string; 
  name: string; 
  quantity: number; 
  averagePrice: number; 
  productType?: 'cnc' | 'mis'; 
  stopLoss?: number; 
};
export type WatchlistStock = { symbol: string; shortname: string; exchange: string; };

type TradingContextType = {
  balance: number;
  holdings: Holding[];
  watchlist: WatchlistStock[];
  buyStock: (symbol: string, name: string, price: number, quantity: number, productType?: 'cnc' | 'mis', stopLoss?: number) => Promise<boolean>;
  sellStock: (symbol: string, price: number, quantity: number, productType?: 'cnc' | 'mis') => Promise<boolean>;
  addToWatchlist: (stock: WatchlistStock) => void;
  removeFromWatchlist: (symbol: string) => void;
  totalInvestment: number;
  setHoldings: React.Dispatch<React.SetStateAction<Holding[]>>;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
};

const TradingContext = createContext<TradingContextType | undefined>(undefined);
const STARTING_BALANCE = 100000;

export const TradingProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState<number>(STARTING_BALANCE);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);

  // Load Saved Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedBalance = await AsyncStorage.getItem('paper_balance');
        const savedHoldings = await AsyncStorage.getItem('paper_holdings');
        const savedWatchlist = await AsyncStorage.getItem('paper_watchlist');
        
        if (savedBalance !== null) setBalance(parseFloat(savedBalance));
        if (savedHoldings !== null) setHoldings(JSON.parse(savedHoldings));
        if (savedWatchlist !== null) setWatchlist(JSON.parse(savedWatchlist));
      } catch (e) { console.error("Failed to load trading data", e); }
    };
    loadData();
  }, []);

  // Save Data on Change
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('paper_balance', balance.toString());
        await AsyncStorage.setItem('paper_holdings', JSON.stringify(holdings));
        await AsyncStorage.setItem('paper_watchlist', JSON.stringify(watchlist));
      } catch (e) { console.error("Failed to save trading data", e); }
    };
    saveData();
  }, [balance, holdings, watchlist]);

  // --- Watchlist Actions ---
  const addToWatchlist = (stock: WatchlistStock) => {
    if (!watchlist.find(s => s.symbol === stock.symbol)) {
      setWatchlist(prev => [...prev, stock]);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s.symbol !== symbol));
  };

  // --- BUY / SELL LOGIC ---
  const buyStock = async (
    symbol: string, 
    name: string, 
    price: number, 
    quantity: number, 
    productType: 'cnc' | 'mis' = 'cnc', 
    stopLoss?: number
  ) => {
    const totalValue = price * quantity;
    const cost = productType === 'mis' ? totalValue * 0.20 : totalValue;
    
    if (balance < cost) return false;

    setBalance(prev => prev - cost);
    setHoldings(prev => {
      const existing = prev.find(h => h.symbol === symbol && (h.productType || 'cnc') === productType);
      if (existing) {
        const totalSharesValue = (existing.averagePrice * existing.quantity) + totalValue;
        const newQuantity = existing.quantity + quantity;
        return prev.map(h => h.symbol === symbol && (h.productType || 'cnc') === productType 
          ? { ...h, quantity: newQuantity, averagePrice: totalSharesValue / newQuantity, stopLoss } 
          : h
        );
      }
      return [...prev, { symbol, name, quantity, averagePrice: price, productType, stopLoss }];
    });
    return true;
  };

  const sellStock = async (
    symbol: string, 
    price: number, 
    quantity: number, 
    productType: 'cnc' | 'mis' = 'cnc'
  ) => {
    const existing = holdings.find(h => h.symbol === symbol && (h.productType || 'cnc') === productType);
    if (!existing || existing.quantity < quantity) return false;

    let revenue = price * quantity;
    if (productType === 'mis') {
      // Leveraged return formula: current value - 80% of purchase value
      // This nets the original 20% margin + or - the full P&L amount.
      revenue = (price * quantity) - (existing.averagePrice * quantity * 0.80);
    }

    setBalance(prev => prev + revenue);
    setHoldings(prev => {
      if (existing.quantity === quantity) {
        return prev.filter(h => !(h.symbol === symbol && (h.productType || 'cnc') === productType));
      }
      return prev.map(h => h.symbol === symbol && (h.productType || 'cnc') === productType 
        ? { ...h, quantity: h.quantity - quantity } 
        : h
      );
    });
    return true;
  };

  const totalInvestment = holdings.reduce((sum, h) => {
    const val = h.averagePrice * h.quantity;
    return sum + ((h.productType || 'cnc') === 'mis' ? val * 0.20 : val);
  }, 0);

  return (
    <TradingContext.Provider value={{ 
      balance, 
      holdings, 
      watchlist, 
      buyStock, 
      sellStock, 
      addToWatchlist, 
      removeFromWatchlist, 
      totalInvestment,
      setHoldings,
      setBalance
    }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) throw new Error("useTrading must be used within a TradingProvider");
  return context;
};