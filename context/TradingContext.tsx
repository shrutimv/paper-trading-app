import { BASE_URL } from "@/src/config/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from "./AuthContext";
// Types
export type Holding = { symbol: string; name: string; quantity: number; averagePrice: number; };
export type WatchlistStock = { symbol: string; shortname: string; exchange: string; };

type TradingContextType = {
  isGuest: boolean;
  setIsGuest: React.Dispatch<React.SetStateAction<boolean>>;

  balance: number;
  holdings: Holding[];
  watchlist: WatchlistStock[];

  buyStock: (
    symbol: string,
    name: string,
    price: number,
    quantity: number
  ) => Promise<boolean>;

  sellStock: (
    symbol: string,
    price: number,
    quantity: number
  ) => Promise<boolean>;

  addToWatchlist: (stock: WatchlistStock) => void;
  removeFromWatchlist: (symbol: string) => void;

  totalInvestment: number;
};

const TradingContext = createContext<TradingContextType | undefined>(undefined);
const STARTING_BALANCE = 100000;

export const TradingProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState<number>(STARTING_BALANCE);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]); // <-- NEW!
  const { refreshUser } = useAuth();

  // Load Saved Data
  useEffect(() => {
    const loadData = async () => {

      try {

        const session = await AsyncStorage.getItem("userSession");

        if (!session) return;

        const user = JSON.parse(session);

        // -----------------------
        // GUEST
        // -----------------------

        if (user.isGuest) {

          setIsGuest(true);

          const savedBalance =
            await AsyncStorage.getItem("paper_guest_balance");

          const savedHoldings =
            await AsyncStorage.getItem("paper_guest_holdings");

          const savedWatchlist =
            await AsyncStorage.getItem("paper_guest_watchlist");

          if (savedBalance)
            setBalance(parseFloat(savedBalance));

          if (savedHoldings)
            setHoldings(JSON.parse(savedHoldings));

          if (savedWatchlist)
            setWatchlist(JSON.parse(savedWatchlist));

          return;
        }

        // -----------------------
        // LOGGED IN
        const response = await axios.get(
          `${BASE_URL}/api/auth/me`,
          {
            withCredentials: true,
          }
        );

        const currentUser = response.data.user;
        setIsGuest(false);
        setBalance(currentUser.balance);

        setHoldings([]);

      } catch (err) {

        console.log(err);

      }

    };
    loadData();
  }, []);

  // Save Data on Change
  useEffect(() => {

    if (!isGuest) return;

    const saveGuestData = async () => {

      try {

        await AsyncStorage.setItem(
          "paper_guest_balance",
          balance.toString()
        );

        await AsyncStorage.setItem(
          "paper_guest_holdings",
          JSON.stringify(holdings)
        );

        await AsyncStorage.setItem(
          "paper_guest_watchlist",
          JSON.stringify(watchlist)
        );

      } catch (err) {

        console.log(err);

      }

    };

    saveGuestData();

  }, [balance, holdings, watchlist, isGuest]);

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
  const buyStock = async (
    symbol: string,
    name: string,
    price: number,
    quantity: number
  ) => {

    // ======================
    // GUEST MODE
    // ======================
    if (isGuest) {

      const cost = price * quantity;

      if (balance < cost) return false;

      setBalance(prev => prev - cost);

      setHoldings(prev => {
        const existing = prev.find(h => h.symbol === symbol);

        if (existing) {

          const totalValue =
            existing.averagePrice * existing.quantity + cost;

          const newQuantity =
            existing.quantity + quantity;

          return prev.map(h =>
            h.symbol === symbol
              ? {
                ...h,
                quantity: newQuantity,
                averagePrice: totalValue / newQuantity,
              }
              : h
          );
        }

        return [
          ...prev,
          {
            symbol,
            name,
            quantity,
            averagePrice: price,
          },
        ];
      });

      return true;
    }

    // ======================
    // LOGGED-IN USER
    // ======================
    try {

      const response = await axios.post(
        `${BASE_URL}/api/trade/buy`,
        {
          symbol,
          quantity,
        },
        {
          withCredentials: true,
        }
      );

      const data = response.data;

      setBalance(data.balance);
      await refreshUser();
      console.log("refreshUser called");

      setHoldings(prev => {
        const existing = prev.find(h => h.symbol === symbol);

        if (existing) {

          const totalValue =
            existing.averagePrice * existing.quantity +
            data.transaction.price * quantity;

          const newQuantity =
            existing.quantity + quantity;

          return prev.map(h =>
            h.symbol === symbol
              ? {
                ...h,
                quantity: newQuantity,
                averagePrice: totalValue / newQuantity,
              }
              : h
          );
        }

        return [
          ...prev,
          {
            symbol,
            name,
            quantity,
            averagePrice: data.transaction.price,
          },
        ];
      });

      return true;

    } catch (err: any) {

      console.log("BUY ERROR");
      console.log(err.response?.status);
      console.log(err.response?.data);

      return false;
    }
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
    <TradingContext.Provider
      value={{
        isGuest,
        setIsGuest,

        balance,
        holdings,
        watchlist,

        buyStock,
        sellStock,

        addToWatchlist,
        removeFromWatchlist,

        totalInvestment,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) throw new Error("useTrading must be used within a TradingProvider");
  return context;
};