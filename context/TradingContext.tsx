import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/src/config/api';
import { useAuth } from './AuthContext';

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

export type Transaction = {
  _id?: string;
  id?: string;
  symbol: string;
  companyName?: string;
  type: 'BUY' | 'SELL';
  productType?: 'cnc' | 'mis';
  quantity: number;
  price: number;
  totalAmount: number;
  stopLoss?: number;
  status?: string;
  createdAt: string;
  pnl?: number;
};

type TradingContextType = {
  isGuest?: boolean;
  setIsGuest?: React.Dispatch<React.SetStateAction<boolean>>;
  balance: number;
  holdings: Holding[];
  watchlist: WatchlistStock[];
  transactions: Transaction[];
  buyStock: (
    symbol: string, 
    name: string, 
    price: number, 
    quantity: number, 
    productType?: 'cnc' | 'mis', 
    stopLoss?: number
  ) => Promise<boolean>;
  sellStock: (
    symbol: string, 
    price: number, 
    quantity: number, 
    productType?: 'cnc' | 'mis'
  ) => Promise<boolean>;
  addToWatchlist: (stock: WatchlistStock) => void;
  removeFromWatchlist: (symbol: string) => void;
  totalInvestment: number;
  setHoldings: React.Dispatch<React.SetStateAction<Holding[]>>;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  fetchTransactions: () => Promise<void>;
};

const TradingContext = createContext<TradingContextType | undefined>(undefined);
const STARTING_BALANCE = 100000;

export const TradingProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isGuest, refreshUser } = useAuth();
  const [balance, setBalance] = useState<number>(STARTING_BALANCE);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchTransactions = async () => {
    try {
      if (user && !isGuest) {
        const res = await axios.get(`${BASE_URL}/api/trade/history`, { withCredentials: true });
        if (res.data && Array.isArray(res.data.transactions)) {
          setTransactions(res.data.transactions);
          return;
        }
      }
      const storageKey = user && !isGuest ? `paper_tx_${user.id || 'user'}` : 'paper_transactions';
      const savedTx = await AsyncStorage.getItem(storageKey);
      if (savedTx) {
        setTransactions(JSON.parse(savedTx));
      }
    } catch (e) {
      console.log("Error loading transaction history:", e);
    }
  };

  // Load Saved Data or Sync with Backend User
  useEffect(() => {
    const loadData = async () => {
      try {
        if (user && !isGuest) {
          if (typeof user.balance === 'number') {
            setBalance(user.balance);
          }
          try {
            const res = await axios.get(`${BASE_URL}/api/trade/holdings`, { withCredentials: true });
            if (res.data && Array.isArray(res.data.holdings)) {
              setHoldings(res.data.holdings);
            }
          } catch {
            const savedHoldings = await AsyncStorage.getItem(`paper_holdings_${user.id || 'user'}`);
            if (savedHoldings) setHoldings(JSON.parse(savedHoldings));
          }
        } else {
          const savedBalance = await AsyncStorage.getItem('paper_balance');
          const savedHoldings = await AsyncStorage.getItem('paper_holdings');
          const savedWatchlist = await AsyncStorage.getItem('paper_watchlist');
          
          if (savedBalance !== null) setBalance(parseFloat(savedBalance));
          if (savedHoldings !== null) setHoldings(JSON.parse(savedHoldings));
          if (savedWatchlist !== null) setWatchlist(JSON.parse(savedWatchlist));
        }
        await fetchTransactions();
      } catch (e) { 
        console.error("Failed to load trading data", e); 
      }
    };
    loadData();
  }, [user, isGuest]);

  // Save Data on Change
  useEffect(() => {
    const saveData = async () => {
      try {
        const txKey = user && !isGuest ? `paper_tx_${user.id || 'user'}` : 'paper_transactions';
        await AsyncStorage.setItem(txKey, JSON.stringify(transactions));

        if (user && !isGuest) {
          await AsyncStorage.setItem(`paper_holdings_${user.id || 'user'}`, JSON.stringify(holdings));
          await AsyncStorage.setItem(`paper_watchlist_${user.id || 'user'}`, JSON.stringify(watchlist));
        } else {
          await AsyncStorage.setItem('paper_balance', balance.toString());
          await AsyncStorage.setItem('paper_holdings', JSON.stringify(holdings));
          await AsyncStorage.setItem('paper_watchlist', JSON.stringify(watchlist));
        }
      } catch (e) { 
        console.error("Failed to save trading data", e); 
      }
    };
    saveData();
  }, [balance, holdings, watchlist, transactions, user, isGuest]);

  // --- Watchlist Actions ---
  const addToWatchlist = (stock: WatchlistStock) => {
    if (!watchlist.find(s => s.symbol === stock.symbol)) {
      setWatchlist(prev => [...prev, stock]);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s.symbol !== symbol));
  };

  // --- BUY LOGIC ---
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

    let newTx: Transaction = {
      id: Date.now().toString(),
      symbol,
      companyName: name || symbol,
      type: 'BUY',
      productType,
      quantity,
      price,
      totalAmount: totalValue,
      stopLoss,
      status: 'EXECUTED',
      createdAt: new Date().toISOString(),
    };

    if (user && !isGuest) {
      try {
        const response = await axios.post(
          `${BASE_URL}/api/trade/buy`,
          { symbol, quantity, price, name, productType, stopLoss },
          { withCredentials: true }
        );
        if (response.data?.balance !== undefined) {
          setBalance(response.data.balance);
        } else {
          setBalance(prev => prev - cost);
        }
        if (response.data?.transaction) {
          newTx = {
            ...response.data.transaction,
            id: response.data.transaction._id || Date.now().toString(),
            createdAt: response.data.transaction.createdAt || new Date().toISOString()
          };
        }
        if (refreshUser) await refreshUser();
      } catch (err) {
        console.log("Backend trade buy failed, recording locally", err);
        setBalance(prev => prev - cost);
      }
    } else {
      setBalance(prev => prev - cost);
    }

    setTransactions(prev => [newTx, ...prev]);

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

  // --- SELL LOGIC ---
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
      revenue = (price * quantity) - (existing.averagePrice * quantity * 0.80);
    }

    const calculatedPnl = (price - existing.averagePrice) * quantity;

    let newTx: Transaction = {
      id: Date.now().toString(),
      symbol,
      companyName: existing.name || symbol,
      type: 'SELL',
      productType,
      quantity,
      price,
      totalAmount: price * quantity,
      status: 'EXECUTED',
      createdAt: new Date().toISOString(),
      pnl: calculatedPnl,
    };

    if (user && !isGuest) {
      try {
        const response = await axios.post(
          `${BASE_URL}/api/trade/sell`,
          { symbol, quantity, price, productType },
          { withCredentials: true }
        );
        if (response.data?.balance !== undefined) {
          setBalance(response.data.balance);
        } else {
          setBalance(prev => prev + revenue);
        }
        if (response.data?.transaction) {
          newTx = {
            ...response.data.transaction,
            id: response.data.transaction._id || Date.now().toString(),
            createdAt: response.data.transaction.createdAt || new Date().toISOString(),
            pnl: calculatedPnl,
          };
        }
        if (refreshUser) await refreshUser();
      } catch (err) {
        console.log("Backend trade sell failed, recording locally", err);
        setBalance(prev => prev + revenue);
      }
    } else {
      setBalance(prev => prev + revenue);
    }

    setTransactions(prev => [newTx, ...prev]);

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
      isGuest,
      balance, 
      holdings, 
      watchlist, 
      transactions,
      buyStock, 
      sellStock, 
      addToWatchlist, 
      removeFromWatchlist, 
      totalInvestment,
      setHoldings,
      setBalance,
      fetchTransactions
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