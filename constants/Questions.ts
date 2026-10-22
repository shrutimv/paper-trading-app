// constants/Questions.ts

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export const QUIZ_DATA: Record<string, QuizQuestion[]> = {
  // --- MODULE 1: Origins of Stocks & Why Markets Exist ---
  'm1': [
    {
      question: "Which company issued the world's first publicly traded stock in 1602?",
      options: [
        "British East India Company",
        "Dutch East India Company (VOC)",
        "Standard Oil",
        "Bombay Dyeing"
      ],
      correct: 1,
      explanation: "The Dutch East India Company (VOC) issued shares in 1602 to let citizens pool capital for spice trading voyages and share the risk."
    },
    {
      question: "Where did the Bombay Stock Exchange (BSE) originate in the 1850s?",
      options: [
        "Inside the RBI Headquarters",
        "Under a Banyan Tree in Mumbai Town Hall",
        "On Marine Drive Promenade",
        "In a British Courtroom"
      ],
      correct: 1,
      explanation: "BSE began informally in the 1850s with 22 brokers meeting under a banyan tree near Town Hall, later moving to Dalal Street."
    },
    {
      question: "Why does a growing company prefer issuing equity shares over taking a bank loan?",
      options: [
        "Bank loans are completely illegal for startups",
        "Equity allows raising capital without mandatory monthly interest payments",
        "Bank loans require giving away the entire company",
        "Equity investments must be paid back within 30 days"
      ],
      correct: 1,
      explanation: "Equity provides 'patient capital' without mandatory interest payments or fixed collateral, letting companies invest aggressively in growth."
    },
    {
      question: "What is an Initial Public Offering (IPO)?",
      options: [
        "A private loan between two banks",
        "The first time a company offers its shares to the public to list on an exchange",
        "The process of shutting down an unprofitable business",
        "A penalty issued by SEBI to corrupt companies"
      ],
      correct: 1,
      explanation: "An IPO is the primary market process where a privately held company sells shares to the public for the first time and gets listed."
    },
    {
      question: "When you buy 1 share of a listed company, what is your legal status?",
      options: [
        "A Customer with return rights",
        "An Employee eligible for gratuity",
        "A Part-Owner (Shareholder)",
        "A Creditor who must receive interest"
      ],
      correct: 2,
      explanation: "A share is a fractional unit of ownership. You legally become a part-owner (shareholder) entitled to dividends and voting rights."
    }
  ],

  // --- MODULE 2: The Market Ecosystem & Regulators ---
  'm2': [
    {
      question: "Which statutory authority regulates and polices the Indian stock market?",
      options: ["RBI (Reserve Bank of India)", "SEBI (Securities & Exchange Board of India)", "Ministry of Finance", "NSE Clearing Limited"],
      correct: 1,
      explanation: "SEBI regulates the securities market, protects investors from fraud, and sets guidelines for brokers and listed companies."
    },
    {
      question: "Which of the following is the OLDEST stock exchange in all of Asia?",
      options: ["Tokyo Stock Exchange", "BSE (Bombay Stock Exchange)", "NSE (National Stock Exchange)", "Shanghai Stock Exchange"],
      correct: 1,
      explanation: "The BSE was founded in 1875, making it the oldest stock exchange in Asia."
    },
    {
      question: "Where are your purchased shares physically or digitally stored in India?",
      options: ["On your broker's personal laptop", "Inside a Demat Account managed by NSDL or CDSL", "Inside your bank savings locker", "At the company's factory"],
      correct: 1,
      explanation: "Shares are stored electronically in your Demat account maintained by government-regulated depositories (NSDL or CDSL)."
    },
    {
      question: "What does the NIFTY 50 index track?",
      options: ["The 50 smallest startups in India", "The top 50 largest, blue-chip companies listed on the NSE", "The top 50 gold jewelry merchants", "50 government-owned banks only"],
      correct: 1,
      explanation: "NIFTY 50 tracks the 50 largest Indian companies by free-float market capitalization on the National Stock Exchange."
    },
    {
      question: "If your registered stockbroker goes bankrupt, what happens to your shares?",
      options: [
        "All your shares are permanently lost",
        "Your shares remain 100% safe inside your CDSL/NSDL Demat account",
        "The government auctions your shares to pay the broker's debts",
        "You must pay a 50% penalty to get them back"
      ],
      correct: 1,
      explanation: "Brokers do not hold your shares; they only execute trades. Your shares sit safely in CDSL or NSDL linked to your PAN."
    }
  ],

  // --- MODULE 3: Asset Classes Compared ---
  'm3': [
    {
      question: "If inflation in India is 6% and your savings account yields 3.5%, what is your real return?",
      options: ["+9.5%", "+3.5%", "-2.5% (Purchasing power is eroding)", "0%"],
      correct: 2,
      explanation: "Real Return = Nominal Interest (3.5%) - Inflation (6%) = -2.5%. Your money buys less goods each year despite sitting in the bank."
    },
    {
      question: "Which asset class has historically provided the highest long-term returns to beat inflation?",
      options: ["Cash in a vault", "Equities (Stocks)", "Fixed Deposits", "Government Savings Certificates"],
      correct: 1,
      explanation: "Equities represent ownership in productive, growing businesses and have delivered 12-15% CAGR over multi-decade horizons."
    },
    {
      question: "What is an Index ETF (e.g., NIFTYBEES)?",
      options: [
        "A high-interest personal loan scheme",
        "A fund traded like a stock that passively mimics an entire market index at ultra-low cost",
        "A crypto coin issued by the NSE",
        "A certificate for physical gold bullion kept at home"
      ],
      correct: 1,
      explanation: "Index ETFs passively track an underlying index like Nifty 50, providing instant diversification across 50 top companies with minimal expense ratio."
    },
    {
      question: "Why do investors hold Gold in their long-term portfolios?",
      options: [
        "Because it pays high quarterly dividends",
        "As a hedge against currency depreciation and geopolitical turmoil",
        "Because gold shares double every 6 months",
        "Because it is guaranteed by the NSE"
      ],
      correct: 1,
      explanation: "Gold is an ancient store of value and safe haven that preserves purchasing power when fiat currencies devalue or stock markets panic."
    },
    {
      question: "What does REIT stand for in real estate investing?",
      options: [
        "Real Estate Investment Trust",
        "Regional Equity Income Tax",
        "Reserve Estate Indian Treasury",
        "Retail Electronic Investment Trade"
      ],
      correct: 0,
      explanation: "A REIT (Real Estate Investment Trust) allows retail investors to own fractions of income-generating commercial properties and earn rental dividends."
    }
  ],

  // --- MODULE 4: Why Stock Prices Move ---
  'm4': [
    {
      question: "What is the primary fundamental driver of stock price movement in the market?",
      options: ["Random government lotteries", "Continuous supply and demand between buyers and sellers", "The color of the trading app logo", "The broker's commission rate"],
      correct: 1,
      explanation: "Prices change because buyers bid higher when demand outstrips supply, and sellers offer discounts when supply outstrips demand."
    },
    {
      question: "Who are FIIs and DIIs in the Indian stock market?",
      options: [
        "Foreign & Domestic Institutional Investors (Hedge funds, Mutual funds, LIC)",
        "Financial Internet Influencers & Dealers",
        "Federal Income Investigators & Directors",
        "Foreign Import & Industry Inspectors"
      ],
      correct: 0,
      explanation: "FIIs (Foreign Institutional Investors) and DIIs (Domestic Institutional Investors like Mutual Funds and LIC) manage trillions of rupees and drive market liquidity."
    },
    {
      question: "What generally happens to stock valuations when the RBI sharply raises interest (Repo) rates?",
      options: [
        "Stocks automatically quadruple in value",
        "Borrowing becomes costlier and stocks face downward valuation pressure",
        "The stock market closes for 3 months",
        "Interest rate hikes have zero effect on businesses"
      ],
      correct: 1,
      explanation: "Higher interest rates make business expansion loans more expensive, reduce consumer spending, and make safe fixed deposits more attractive."
    },
    {
      question: "If a company beats analyst earnings expectations by 30%, what is the expected immediate price reaction?",
      options: [
        "The stock is likely to surge due to strong bullish buying sentiment",
        "The stock will immediately drop to zero",
        "The stock will be delisted by SEBI",
        "Trading in the stock will be permanently banned"
      ],
      correct: 0,
      explanation: "Better-than-expected earnings show strong business health, attracting heavy institutional and retail demand."
    },
    {
      question: "Benjamin Graham famously said: 'In the short run the market is a ___, but in the long run it is a ___.'",
      options: [
        "Game; Nightmare",
        "Voting machine; Weighing machine",
        "Bank; Casino",
        "Calculator; Guess"
      ],
      correct: 1,
      explanation: "In the short term, sentiment and hype drive prices (voting machine), but over the long run, true earnings and business value prevail (weighing machine)."
    }
  ],

  // --- MODULE 5: What Buying & Selling Actually Means ---
  'm5': [
    {
      question: "When you buy 100 shares of Tata Motors on the secondary market, where does your money go?",
      options: [
        "Directly to Ratan Tata's personal bank account",
        "To Tata Motors' corporate treasury for building new factories",
        "To the seller who agreed to part with their shares via the exchange",
        "To the Ministry of Transport"
      ],
      correct: 2,
      explanation: "On the secondary exchange market, money transfers from the buyer to the seller. The company itself gets ₹0 from everyday trades."
    },
    {
      question: "What is India's settlement cycle for equity shares?",
      options: ["T+30 Days", "T+1 Business Day", "T+7 Days", "Same-second instant cash delivery only"],
      correct: 1,
      explanation: "India operates on T+1 (Trade Date + 1 Day), meaning shares and funds settle through the clearing corporation by the next business day."
    },
    {
      question: "What is the key difference between CNC (Delivery) and MIS (Intraday)?",
      options: [
        "CNC shares must be sold by 3:20 PM today; MIS can be held for 10 years",
        "CNC allows long-term ownership with 100% cash; MIS uses leverage and must be closed today",
        "MIS does not allow selling; CNC only allows buying",
        "CNC is only for foreign citizens; MIS is for Indians"
      ],
      correct: 1,
      explanation: "CNC (Cash & Carry) means you pay in full and own the shares. MIS (Margin Intraday) gives margin leverage but auto-closes by 3:20 PM."
    },
    {
      question: "What happens if you hold an open MIS (Intraday) position past 3:20 PM?",
      options: [
        "The broker arrests you",
        "The broker's automated risk system auto-squares it off at prevailing market prices",
        "The shares convert to physical certificates mailed to your house",
        "You receive free shares from the exchange"
      ],
      correct: 1,
      explanation: "Brokers automatically square off unclosed intraday positions around 3:20 PM to eliminate overnight margin exposure."
    },
    {
      question: "Who guarantees that the seller gets money and the buyer gets shares without default?",
      options: ["The local police", "The Clearing Corporation (e.g., NSE Clearing / ICCL)", "The company's CEO", "The bank branch manager"],
      correct: 1,
      explanation: "The Clearing Corporation acts as the central counterparty for all trades, eliminating counterparty default risk."
    }
  ],

  // --- MODULE 6: Order Types & Execution Mechanics ---
  'm6': [
    {
      question: "What is the primary risk of using a Market Order during volatile market conditions?",
      options: [
        "The order will never execute",
        "Slippage (the executed price may be significantly worse than expected)",
        "The broker will charge a 20% penalty",
        "The exchange will cancel your Demat account"
      ],
      correct: 1,
      explanation: "A Market Order guarantees execution but takes whatever price is available in the order book, risking price slippage in fast-moving markets."
    },
    {
      question: "If you want to buy a share currently at ₹520, but only if it pulls back to ₹500, what order type should you use?",
      options: ["Market Order", "Limit Order", "Immediate Or Cancel (IOC) Market", "After Market Order at Market Price"],
      correct: 1,
      explanation: "A Limit Order lets you define the exact maximum price you are willing to pay (₹500). It will only execute at ₹500 or better."
    },
    {
      question: "What is the purpose of placing a Stop-Loss (SL) order when entering a trade?",
      options: [
        "To guarantee you make at least 50% profit",
        "To cap your maximum loss and protect your trading capital if the trade fails",
        "To prevent paying brokerage fees",
        "To hide your order from other traders"
      ],
      correct: 1,
      explanation: "A Stop-Loss automatically triggers an exit order if the price falls to your specified risk threshold, preventing small losses from becoming catastrophic."
    },
    {
      question: "What does the 'Bid-Ask Spread' represent in an order book?",
      options: [
        "The tax charged by the government",
        "The difference between the highest price a buyer offers (Bid) and the lowest price a seller asks (Ask)",
        "The dividend yield of the company",
        "The distance between 52-week high and 52-week low"
      ],
      correct: 1,
      explanation: "The Bid-Ask spread is the gap between the best buying bid and best selling offer, indicating liquidity."
    },
    {
      question: "What does GTT stand for in modern Indian brokerage platforms?",
      options: [
        "General Trade Treasury",
        "Good Till Triggered (an order valid until price is hit or up to 1 year)",
        "Government Taxation Target",
        "Guaranteed Total Trading"
      ],
      correct: 1,
      explanation: "GTT (Good Till Triggered) orders stay active for months until your target or stop-loss trigger price is reached."
    }
  ],

  // --- MODULE 7: Fundamental Analysis: What to Inspect ---
  'm7': [
    {
      question: "Which of the following is considered the 'Bottom Line' of a company's P&L statement?",
      options: ["Total Gross Revenue", "Operating Expenses", "Net Profit After Tax (PAT)", "Depreciation allowance"],
      correct: 2,
      explanation: "The bottom line of the Income Statement is Net Profit After Tax (PAT), showing what actually remains for shareholders after all expenses."
    },
    {
      question: "Why is the Cash Flow Statement often more reliable than the Net Profit figure on a P&L?",
      options: [
        "P&L is completely made up by brokers",
        "Cash Flow tracks actual money moving in and out, exposing unpaid credit sales or accounting tricks",
        "Cash flow statements are written by SEBI",
        "Only cash flow statements include taxes"
      ],
      correct: 1,
      explanation: "A company can show paper profits while customers delay payments for years. Operating Cash Flow verifies whether real cash entered the bank."
    },
    {
      question: "What is an 'Economic Moat' as defined by Warren Buffett?",
      options: [
        "A literal water canal built around a factory",
        "A durable competitive advantage that prevents rivals from eroding a company's market share and profits",
        "A special government bailout guarantee",
        "A high bank loan limit"
      ],
      correct: 1,
      explanation: "An Economic Moat is a sustainable competitive edge (brand power, patents, switching costs, network effects) protecting business profits."
    },
    {
      question: "Which of the following demonstrates high 'Pricing Power' for a business?",
      options: [
        "The company has to offer 50% discounts every month to sell products",
        "The company raises prices during inflation and customer demand barely drops",
        "The company changes its products every week to survive",
        "The company pays zero dividends"
      ],
      correct: 1,
      explanation: "Pricing power means a company can raise prices to counter inflation without losing customers (e.g. Apple, Titan, Asian Paints)."
    },
    {
      question: "What are the two components of a Balance Sheet that must always balance?",
      options: [
        "Total Assets = Total Liabilities + Shareholders' Equity",
        "Revenue = Profit + Taxes",
        "Sales = Debt - Expenses",
        "Cash = Dividends × Number of Shares"
      ],
      correct: 0,
      explanation: "The fundamental accounting equation is: Assets = Liabilities + Shareholders' Equity."
    }
  ],

  // --- MODULE 8: Key Financial Ratios Demystified ---
  'm8': [
    {
      question: "How is the Price-to-Earnings (P/E) ratio calculated?",
      options: [
        "Share Price ÷ Earnings Per Share (EPS)",
        "Total Revenue ÷ Total Debt",
        "Net Profit ÷ Dividend per share",
        "Market Cap ÷ Cash in Bank"
      ],
      correct: 0,
      explanation: "P/E = Current Market Price ÷ EPS. It tells you how many rupees investors pay for every ₹1 of profit generated."
    },
    {
      question: "If Company A has an EPS of ₹25 and trades at ₹500, what is its P/E ratio?",
      options: ["10x", "20x", "50x", "12.5x"],
      correct: 1,
      explanation: "P/E = ₹500 ÷ ₹25 = 20x."
    },
    {
      question: "What does Return on Equity (ROE) measure?",
      options: [
        "How fast the stock price doubles in a week",
        "How much net profit management generates from each rupee of shareholders' equity",
        "The total debt owed to foreign banks",
        "The salary of the board of directors"
      ],
      correct: 1,
      explanation: "ROE measures profitability and capital efficiency: Net Income ÷ Shareholders' Equity. An ROE consistently above 15% is excellent."
    },
    {
      question: "Why should investors be cautious of a company with a Debt-to-Equity ratio higher than 2.0?",
      options: [
        "Because it means the company has zero bank accounts",
        "Because heavy interest obligations can cause bankruptcy during economic downturns",
        "Because SEBI automatically cancels such companies' licenses",
        "Because high debt forces stock prices to freeze"
      ],
      correct: 1,
      explanation: "High debt means large fixed interest payments. If revenues decline during a recession, the company risks default or bankruptcy."
    },
    {
      question: "If a stock trading at ₹400 pays an annual cash dividend of ₹16 per share, what is its Dividend Yield?",
      options: ["1.6%", "4.0%", "16%", "25%"],
      correct: 1,
      explanation: "Dividend Yield = (Dividend Per Share ÷ Share Price) × 100 = (₹16 ÷ ₹400) × 100 = 4.0%."
    }
  ],

  // --- MODULE 9: Promoter Health & Governance Red Flags ---
  'm9': [
    {
      question: "What does it mean when promoters 'pledge' their shares?",
      options: [
        "They donate their shares to charity",
        "They use their company shares as collateral to take out loans",
        "They promise to never sell their shares",
        "They transfer shares to retail investors for free"
      ],
      correct: 1,
      explanation: "Promoters pledge shares as collateral with financial institutions to secure personal or business loans."
    },
    {
      question: "Why is a high promoter pledge percentage (e.g., >30%) a dangerous red flag for retail investors?",
      options: [
        "Lenders can forcibly dump the pledged shares in the open market if the stock price drops, causing a crash",
        "Promoters cannot attend board meetings while shares are pledged",
        "Pledged shares do not receive company dividends",
        "The company must double its employee salaries"
      ],
      correct: 0,
      explanation: "If the stock falls below margin thresholds and promoters can't provide cash, lenders dump pledged shares, triggering catastrophic selloffs."
    },
    {
      question: "What does it indicate if top-tier independent auditors abruptly resign citing 'lack of management information'?",
      options: [
        "The company is making too much profit",
        "A severe corporate governance or accounting irregularity red flag",
        "The auditors are retiring due to old age",
        "The company is preparing for an overseas listing"
      ],
      correct: 1,
      explanation: "Auditor resignations usually signify discrepancies in bookkeeping, hidden debts, or refusal by management to disclose financial transactions."
    },
    {
      question: "What is generally considered a healthy promoter holding in an Indian manufacturing company?",
      options: ["Below 5%", "Above 50% with low or zero pledging", "100% held by foreign governments", "0%"],
      correct: 1,
      explanation: "A promoter holding above 50% shows the founders have deep skin in the game, aligning their personal interests with ordinary shareholders."
    },
    {
      question: "What is a 'Related Party Transaction' that warrants investor scrutiny?",
      options: [
        "Selling products to ordinary customers in shopping malls",
        "The listed company buying overpriced assets or lending cheap money to an unlisted entity owned by the promoter's family",
        "Paying taxes to the Government of India",
        "Distributing bonus shares equally to all shareholders"
      ],
      correct: 1,
      explanation: "Unethical promoters sometimes siphon corporate wealth into personal family-owned private entities through related-party deals."
    }
  ],

  // --- MODULE 10: Candlestick Anatomy & Price Action ---
  'm10': [
    {
      question: "What are the 4 fundamental price data points that form a single candlestick?",
      options: [
        "Open, High, Low, Close (OHLC)",
        "Offer, Highest, Lowest, Cost",
        "Opening, Holding, Lending, Closing",
        "Overall, Heavy, Light, Cash"
      ],
      correct: 0,
      explanation: "Every candlestick displays the Open, High, Low, and Close (OHLC) for that specific timeframe."
    },
    {
      question: "What creates a Green (Bullish) candlestick on a chart?",
      options: [
        "The Closing price is HIGHER than the Opening price",
        "The Closing price is LOWER than the Opening price",
        "The High price equals the Low price",
        "Volume is exactly zero"
      ],
      correct: 0,
      explanation: "A green candle forms when buyers succeed in closing the candle above where it opened (Close > Open)."
    },
    {
      question: "What does a candlestick with a very long lower wick (shadow) indicate?",
      options: [
        "Sellers had complete control all session",
        "Strong rejection of lower prices—buyers aggressively bought the dip before candle close",
        "The stock is halting for trading",
        "The company reported a severe quarterly loss"
      ],
      correct: 1,
      explanation: "A long lower shadow indicates that sellers drove prices down, but aggressive buyers absorbed supply and pushed prices back up."
    },
    {
      question: "What is a 'Support Zone' on a stock chart?",
      options: [
        "A price level where selling pressure completely overwhelms all buying",
        "A historical price floor where buying interest has repeatedly stepped in to halt price declines",
        "The commission rate paid to your broker",
        "The maximum price allowed by SEBI in a single day"
      ],
      correct: 1,
      explanation: "Support acts as a demand floor where buyers consider the stock cheap and step in with large orders to stop further falls."
    },
    {
      question: "What happens when a stock decisively breaks above a major multi-month Resistance level with high volume?",
      options: [
        "The old Resistance level often flips into new Support during subsequent pullbacks",
        "The stock is immediately forced to crash to zero",
        "The exchange resets the stock price back to ₹10",
        "Trading volume permanently stops"
      ],
      correct: 0,
      explanation: "Polarity principle: Once broken, previous resistance becomes a new support level as former sellers become interested buyers."
    }
  ],

  // --- MODULE 11: Trends, Volume Confirmation & Breakouts ---
  'm11': [
    {
      question: "What price structure defines a valid Uptrend (Bull Market)?",
      options: [
        "A series of Lower Highs (LH) and Lower Lows (LL)",
        "A series of Higher Highs (HH) and Higher Lows (HL)",
        "A completely horizontal flat line with zero movement",
        "Prices bouncing randomly without pattern"
      ],
      correct: 1,
      explanation: "An uptrend is characterized by successive higher peaks (Higher Highs) and shallower pullbacks (Higher Lows)."
    },
    {
      question: "Why is high trading volume crucial when confirming a breakout above resistance?",
      options: [
        "It proves institutional money is actively participating and backing the price move",
        "It reduces government transaction taxes",
        "Volume is just a decorative color chart with no meaning",
        "It means retail investors are selling everything"
      ],
      correct: 0,
      explanation: "Volume represents institutional participation. A breakout without volume is vulnerable to being a 'Bull Trap' (false breakout)."
    },
    {
      question: "What is a 'Bull Trap' in technical trading?",
      options: [
        "A stock that only bulls are allowed to buy",
        "A false breakout where price briefly pierces resistance to lure buyers, then reverses sharply downward",
        "A company that breeds bulls for agriculture",
        "A rule where brokers charge extra on green days"
      ],
      correct: 1,
      explanation: "A bull trap lures enthusiastic breakout buyers right before institutional players sell into their liquidity, trapping them at the highs."
    },
    {
      question: "What is the safest, highest-probability entry method for a breakout trader?",
      options: [
        "Buying at 9:15 AM before checking market direction",
        "Waiting for the breakout, followed by a low-volume retest of the broken level and a bullish reversal confirmation",
        "Buying when RSI is at 98 on 1-minute charts",
        "Doubling position every time the price drops"
      ],
      correct: 1,
      explanation: "Waiting for a breakout and subsequent retest confirmation provides a superior risk-to-reward ratio and avoids false breakout traps."
    },
    {
      question: "What does it mean if a stock makes a new high but on much lower volume than the previous high?",
      options: [
        "Volume divergence—indicating weakening momentum and a potential upcoming correction",
        "A guaranteed 100% rally tomorrow",
        "That all shares have been bought out",
        "Nothing, price is the only thing that matters"
      ],
      correct: 0,
      explanation: "When price rises while volume contracts, it shows lack of institutional interest and warning of buyer exhaustion."
    }
  ],

  // --- MODULE 12: Risk Management & Trading Psychology ---
  'm12': [
    {
      question: "According to the Golden 1% Rule, if your trading account is ₹2,00,000, what is the maximum loss you should risk on any single trade?",
      options: ["₹20,000", "₹2,000", "₹500", "₹50,000"],
      correct: 1,
      explanation: "1% of ₹2,00,000 = ₹2,000. Risking no more than 1% per trade ensures you can survive long losing streaks without ruining your capital."
    },
    {
      question: "If your maximum allowed risk is ₹1,000, and your stop-loss distance is ₹20 per share, how many shares should you buy?",
      options: ["10 shares", "50 shares", "100 shares", "500 shares"],
      correct: 1,
      explanation: "Position Size = Total Risk ÷ Risk Per Share = ₹1,000 ÷ ₹20 = 50 shares."
    },
    {
      question: "With a 1:2 Risk-to-Reward ratio, what win rate is needed to break even or turn a profit?",
      options: [
        "You must win at least 90% of trades",
        "A win rate of just 35-40% is enough to be comfortably profitable",
        "You must win 100% of trades",
        "Risk-to-reward does not affect profitability"
      ],
      correct: 1,
      explanation: "At 1:2 R:R, winning 4 out of 10 trades (+8R) and losing 6 trades (-6R) still leaves you with a net profit of +2R (40% win rate)."
    },
    {
      question: "What is 'Revenge Trading'?",
      options: [
        "Trading against your competitor's company",
        "Emotionally taking oversized, undisciplined trades immediately after a loss to try and 'make your money back'",
        "Reporting an unethical broker to SEBI",
        "Shorting a stock until it delists"
      ],
      correct: 1,
      explanation: "Revenge trading happens when wounded pride drives a trader to abandon all risk rules after a loss, almost always resulting in catastrophic account blowout."
    },
    {
      question: "What does FOMO stand for in financial market psychology?",
      options: [
        "Future Options Margin Order",
        "Fear Of Missing Out (buying emotionally at the peak out of greed)",
        "Fixed Output Market Operation",
        "Foreign Owner Management Office"
      ],
      correct: 1,
      explanation: "FOMO (Fear Of Missing Out) causes retail traders to chase extended rallies at the top, where smart money is actively distributing and exiting."
    }
  ]
};