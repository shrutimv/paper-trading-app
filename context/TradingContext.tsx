import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type Holding = { symbol: string; name: string; quantity: number; averagePrice: number; };
export type WatchlistStock = { symbol: string; shortname: string; exchange: string; };

type TradingContextType = {
  balance: number;
  holdings: Holding[];
  watchlist: WatchlistStock[]; // <-- NEW!
  buyStock: (symbol: string, name: string, price: number, quantity: number) => Promise<boolean>;
  sellStock: (symbol: string, price: number, quantity: number) => Promise<boolean>;
  addToWatchlist: (stock: WatchlistStock) => void; // <-- NEW!
  removeFromWatchlist: (symbol: string) => void; // <-- NEW!
  totalInvestment: number;
};

const TradingContext = createContext<TradingContextType | undefined>(undefined);
const STARTING_BALANCE = 100000;

export const TradingProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState<number>(STARTING_BALANCE);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]); // <-- NEW!

  // Load Saved Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedBalance = await AsyncStorage.getItem('paper_balance');
        const savedHoldings = await AsyncStorage.getItem('paper_holdings');
        const savedWatchlist = await AsyncStorage.getItem('paper_watchlist'); // <-- NEW!
        
        if (savedBalance !== null) setBalance(parseFloat(savedBalance));
        if (savedHoldings !== null) setHoldings(JSON.parse(savedHoldings));
        if (savedWatchlist !== null) setWatchlist(JSON.parse(savedWatchlist)); // <-- NEW!
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
        await AsyncStorage.setItem('paper_watchlist', JSON.stringify(watchlist)); // <-- NEW!
      } catch (e) { console.error("Failed to save trading data", e); }
    };
    saveData();
  }, [balance, holdings, watchlist]);

  // --- NEW: Watchlist Actions ---
  const addToWatchlist = (stock: WatchlistStock) => {
    if (!watchlist.find(s => s.symbol === stock.symbol)) {
      setWatchlist(prev => [...prev, stock]);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s.symbol !== symbol));
  };

  // --- BUY / SELL LOGIC ---
  const buyStock = async (symbol: string, name: string, price: number, quantity: number) => {
    const cost = price * quantity;
    if (balance < cost) return false;

    setBalance(prev => prev - cost);
    setHoldings(prev => {
      const existing = prev.find(h => h.symbol === symbol);
      if (existing) {
        const totalValue = (existing.averagePrice * existing.quantity) + cost;
        const newQuantity = existing.quantity + quantity;
        return prev.map(h => h.symbol === symbol ? { ...h, quantity: newQuantity, averagePrice: totalValue / newQuantity } : h);
      }
      return [...prev, { symbol, name, quantity, averagePrice: price }];
    });
    return true;
  };

  const sellStock = async (symbol: string, price: number, quantity: number) => {
    const existing = holdings.find(h => h.symbol === symbol);
    if (!existing || existing.quantity < quantity) return false;

    const revenue = price * quantity;
    setBalance(prev => prev + revenue);
    setHoldings(prev => {
      if (existing.quantity === quantity) return prev.filter(h => h.symbol !== symbol);
      return prev.map(h => h.symbol === symbol ? { ...h, quantity: h.quantity - quantity } : h);
    });
    return true;
  };

  const totalInvestment = holdings.reduce((sum, h) => sum + (h.averagePrice * h.quantity), 0);

  return (
    <TradingContext.Provider value={{ balance, holdings, watchlist, buyStock, sellStock, addToWatchlist, removeFromWatchlist, totalInvestment }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) throw new Error("useTrading must be used within a TradingProvider");
  return context;
};