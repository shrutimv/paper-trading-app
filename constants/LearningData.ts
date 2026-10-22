export interface LearningSection {
  heading: string;
  body: string;
  proTip?: string;
}

export interface LearningModule {
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  readTime: string;
  tagline: string;
  takeaway: string;
  content: LearningSection[];
}

export const LEARNING_DATA: Record<string, LearningModule> = {
  // --- MODULE 1: The Origin of Stocks & Why Markets Exist ---
  'm1': {
    title: "Origins of Stocks & Why Markets Exist",
    level: "Beginner",
    readTime: "4 min read",
    tagline: "From spice trade ships in 1602 to Dalal Street banyan trees.",
    takeaway: "Stocks allow companies to raise patient capital for massive growth without bank debt, and give everyday citizens a seat at the wealth creation table.",
    content: [
      {
        heading: "The 1602 Spice Route Problem",
        body: "Over 400 years ago, Dutch merchants sailed perilous oceans to Asia to trade spices like nutmeg and cloves. A single voyage cost a fortune, and pirate attacks or shipwrecks could bankrupt an entire family.\n\nIn 1602, the **Dutch East India Company (VOC)** had a breakthrough idea: Instead of one rich merchant funding one risky ship, why not let **hundreds of ordinary citizens pool small amounts of money**? In return, every citizen received a paper certificate representing partial ownership of the voyage.\n\nWhen the ships returned loaded with spices, profits were split proportionally. This was the birth of the **World's First Publicly Traded Stock**.",
        proTip: "Stocks were invented to spread catastrophic business risk across thousands of people."
      },
      {
        heading: "The Mumbai Banyan Tree (BSE 1875)",
        body: "In India, the stock market began under a humble **banyan tree** in front of Mumbai Town Hall in the 1850s. A small group of 22 Gujarati and Parsi brokers met daily to trade shares of cotton mills and banks.\n\nIn **1875**, this informal gathering officially became 'The Native Share & Stock Brokers Association'—known today as the **BSE (Bombay Stock Exchange)**, the oldest stock exchange in Asia. The road where it stood became **Dalal Street**.",
        proTip: "Dalal Street literally translates to 'Broker's Street' in Marathi/Hindi."
      },
      {
        heading: "Why Companies Issue Stocks: Debt vs. Equity",
        body: "Imagine you launch a cloud kitchen costing ₹20 Lakhs, but you only have ₹10 Lakhs. You have two options:\n\n1. **Debt (Bank Loan):** You borrow ₹10 Lakhs. Even if your kitchen has zero customers for 6 months, the bank will still forcefully demand ₹12,000 monthly interest and collateral.\n2. **Equity (Selling Shares):** You invite an investor who gives you ₹10 Lakhs in exchange for 20% ownership of your business. If the business fails, you don't owe them interest; if it booms into a ₹10 Crore empire, their 20% slice is worth ₹2 Crores.\n\nThe Stock Market is the global bridge where companies raise **Capital without interest** and investors earn long-term ownership wealth.",
      },
      {
        heading: "What is an IPO (Initial Public Offering)?",
        body: "When a private company reaches a huge scale (like Zomato, Tata Tech, or Swiggy) and wants to raise hundreds of crores from the general public, it lists on the stock exchange through an **Initial Public Offering (IPO)**.\n\nAfter the IPO, its shares can be freely bought and sold by millions of people in seconds through the secondary market.",
        proTip: "IPOs are primary market events; everyday trading happens on the secondary market."
      }
    ]
  },

  // --- MODULE 2: The Indian Market Ecosystem ---
  'm2': {
    title: "The Market Ecosystem & Regulators",
    level: "Beginner",
    readTime: "4 min read",
    tagline: "Who runs the show: Exchanges, SEBI, Brokers, and Digital Vaults.",
    takeaway: "You never trade directly with an exchange; your registered broker routes orders, SEBI protects your rights, and NSDL/CDSL holds your shares securely.",
    content: [
      {
        heading: "The Exchanges: NSE vs. BSE",
        body: "An exchange is a centralized digital marketplace where buyers and sellers meet.\n\n• **BSE (Bombay Stock Exchange):** Asia's oldest exchange (1875) with over 5,000 listed companies.\n• **NSE (National Stock Exchange):** Launched in 1992, NSE introduced electronic screen-based trading to India and handles the vast majority of daily trading volume and derivatives.",
        proTip: "Most large Indian companies (e.g. Reliance, TCS) are dual-listed on both NSE and BSE."
      },
      {
        heading: "SEBI: The Guardian of the Market",
        body: "What stops promoters from lying about their profits or running away with public money? **SEBI (Securities and Exchange Board of India)**.\n\nEstablished in 1992, SEBI is the statutory market watchdog. It enforces disclosure norms, prevents insider trading, penalizes market manipulation, and ensures that retail investors are treated fairly.",
        proTip: "SEBI guarantees fairness of process, but it does NOT guarantee you won't lose money on bad investments."
      },
      {
        heading: "Demat & Trading Account: How They Work",
        body: "To invest in Indian stocks, you need a three-in-one ecosystem:\n\n1. **Bank Account:** Holds your liquid cash (INR).\n2. **Trading Account:** Provided by your broker (e.g., Zerodha, Groww, AngelOne) to place Buy and Sell orders.\n3. **Demat Account (Dematerialized):** A digital locker maintained by government-supervised depositories (**CDSL** or **NSDL**) that holds your actual shares safely in digital form.",
        proTip: "Even if your broker goes bankrupt, your shares remain 100% safe inside CDSL/NSDL under your PAN."
      },
      {
        heading: "What are Indices? (Nifty 50 & Sensex)",
        body: "With thousands of listed stocks, how do you know if the overall market had a good or bad day?\n\n• **NIFTY 50:** Tracks the weighted performance of the top 50 largest blue-chip companies listed on the NSE.\n• **SENSEX:** Tracks the top 30 bellwether companies listed on the BSE.\n\nWhen news reports say 'The Market fell 1%', they mean Nifty or Sensex dropped 1%.",
      }
    ]
  },

  // --- MODULE 3: All Asset Classes Compared ---
  'm3': {
    title: "Asset Classes: Where Money Grows",
    level: "Beginner",
    readTime: "5 min read",
    tagline: "Stocks, Bonds, Mutual Funds, ETFs, Gold, and Real Estate.",
    takeaway: "Never put all your eggs in one basket. Balance high-growth equities with stable debt and gold to survive inflation.",
    content: [
      {
        heading: "The Inflation Monster",
        body: "If consumer inflation in India is 6% per year, ₹1,00,000 kept in a savings bank earning 3% interest is actually **losing ₹3,000 in purchasing power every year**.\n\nInvesting is not a luxury—it is the only way to beat inflation and preserve your future purchasing power.",
        proTip: "Real Return = Nominal Interest Rate minus Inflation Rate."
      },
      {
        heading: "The 4 Core Asset Classes",
        body: "1. **Equities (Stocks):** High risk, high historical return (12-15% CAGR over long horizons). You own a piece of productive businesses.\n2. **Debt & Fixed Deposits:** Low risk, predictable return (6-7.5%). You lend money to banks or the Government of India in exchange for fixed interest.\n3. **Gold:** Moderate risk, ancient hedge against currency depreciation and geopolitical war (8-10% historical return).\n4. **Real Estate / REITs:** High capital entry, rental income (2-4% yield) + property price appreciation.",
      },
      {
        heading: "Mutual Funds vs. Index ETFs",
        body: "Don't have time to research individual balance sheets? \n\n• **Mutual Funds:** A professional Fund Manager pools money from thousands of investors to buy a basket of 40-60 diversified stocks.\n• **Index ETFs (e.g. NIFTYBEES):** A passively managed fund that blindly mimics the Nifty 50 at near-zero expense ratio (0.04%). You buy it on your trading app like a single stock.",
        proTip: "Over 10+ year periods, passive Index Funds outperform more than 75% of active fund managers."
      }
    ]
  },

  // --- MODULE 4: Why Stock Prices Move ---
  'm4': {
    title: "Why Stock Prices Move",
    level: "Beginner",
    readTime: "5 min read",
    tagline: "The invisible forces of Supply, Demand, Earnings, and Sentiment.",
    takeaway: "In the short run, the market is a voting machine (sentiment & liquidity); in the long run, it is a weighing machine (actual company profits).",
    content: [
      {
        heading: "The Universal Law of Supply & Demand",
        body: "A stock price does not move because an algorithm felt like it. It moves because real human beings and institutional funds are willing to pay more or accept less.\n\n• **More Buyers than Sellers (Demand > Supply):** Buyers bid higher prices to get their hands on shares → **Price Rises 📈**.\n• **More Sellers than Buyers (Supply > Demand):** Sellers slash their asking prices to dump shares → **Price Falls 📉**.",
        proTip: "The market is a continuous double auction matching engine, exactly like an airport currency booth or vegetable mandi."
      },
      {
        heading: "Catalyst 1: Quarterly Earnings (Q1, Q2, Q3, Q4)",
        body: "Every 3 months, public companies are legally required to report their Revenue, Net Profit, and Future Guidance. \n\nIf analysts expect TCS to make ₹10,000 Crore profit and it reports ₹12,000 Crore, the stock jumps. If it misses estimates, traders hit the panic sell button.",
      },
      {
        heading: "Catalyst 2: Big Institutional Money (FIIs & DIIs)",
        body: "Retail traders like you and me trade in thousands of rupees. Institutional giants trade in thousands of crores:\n\n• **FIIs (Foreign Institutional Investors):** Wall Street hedge funds, pension funds from USA/Europe.\n• **DIIs (Domestic Institutional Investors):** Indian Mutual Funds, LIC, pension funds.\n\nWhen FIIs pump billions of dollars into India, the entire Nifty rallies; when US interest rates rise and FIIs pull dollars out, Indian markets experience pullbacks.",
        proTip: "Track daily FII / DII net buy/sell numbers—they dictate institutional tide direction."
      },
      {
        heading: "Catalyst 3: Macroeconomics (RBI Repo Rate)",
        body: "When the **Reserve Bank of India (RBI)** increases interest rates, borrowing becomes expensive for companies and home buyers. Business expansion slows down, making fixed deposits more attractive than risky stocks. Hence, rate hikes generally cool down the stock market.",
      }
    ]
  },

  // --- MODULE 5: What Buying & Selling Actually Means ---
  'm5': {
    title: "Anatomy of a Trade: Under the Hood",
    level: "Intermediate",
    readTime: "5 min read",
    tagline: "What actually happens behind the scenes from the click to settlement.",
    takeaway: "When you buy secondary shares, the company gets ₹0; money goes to the seller, and shares arrive in your Demat account in T+1 business days.",
    content: [
      {
        heading: "Does Company Receive Money When You Buy?",
        body: "A widespread myth among beginners is that buying Reliance shares gives money to Mukesh Ambani. **It does not!**\n\nThe company only received money once during its IPO or FPO. Everyday trading is on the **Secondary Market**, where you are simply buying from another investor who chose to exit.\n\nIf you buy 10 shares of Infosys from Ramesh, your money goes to Ramesh's broker account, not to Infosys headquarters.",
        proTip: "The secondary market provides liquidity—ensuring you can convert your stock back to cash anytime."
      },
      {
        heading: "The T+1 Settlement Cycle in India",
        body: "India is one of the fastest markets in the world, operating on a **T+1 (Trade Date + 1 Day)** settlement schedule:\n\n• **Day T (Monday 11:00 AM):** You execute a Buy order for 5 shares of Tata Motors.\n• **Day T+1 (Tuesday Evening):** The Clearing Corporation (NSE Clearing / ICCL) transfers the shares into your CDSL/NSDL Demat account and debits your broker's settlement account.\n\nBefore 2001, Indian paper share transfers took up to 60 days via physical post!",
      },
      {
        heading: "Delivery (CNC) vs. Intraday (MIS)",
        body: "Every time you place a trade in your broker app, you pick between two products:\n\n1. **CNC (Cash and Carry / Delivery):** You pay 100% upfront cash. You can hold the stock for days, months, or 30 years in your Demat account.\n2. **MIS (Margin Intraday Square-off):** You get up to 5x leverage from your broker, BUT you must close the trade before **3:20 PM today**. If you don't, the broker's system auto-squares it off at whatever market price prevails.",
        proTip: "Never use intraday leverage unless you have strict risk management rules and stop losses."
      }
    ]
  },

  // --- MODULE 6: Order Types & Execution Mechanics ---
  'm6': {
    title: "Order Types & Market Depth Mechanics",
    level: "Intermediate",
    readTime: "5 min read",
    tagline: "Market, Limit, Stop-Loss, and Reading the Bid-Ask Depth.",
    takeaway: "Market orders guarantee execution but risk price slippage; Limit orders guarantee price but risk non-execution.",
    content: [
      {
        heading: "Market Order vs. Limit Order",
        body: "• **Market Order:** 'Buy this stock RIGHT NOW at whatever price the lowest seller is asking.' It executes instantly, but if the market is moving fast, you might suffer **slippage** (buying higher than you thought).\n• **Limit Order:** 'I only want to buy if the price drops to ₹450 or lower.' Your order sits in the order book until a seller agrees to match your exact price.",
        proTip: "For volatile or low-volume stocks, ALWAYS use Limit orders to avoid nasty price shocks."
      },
      {
        heading: "Stop-Loss (SL) & Stop-Loss Market (SL-M)",
        body: "A **Stop-Loss** is your insurance policy. It automatically sells your shares if the trade goes against you, preventing a small 2% loss from turning into a devastating 40% loss.\n\n• **Trigger Price:** The threshold price that wakes up your sleeping order.\n• If you buy at ₹1,000, you can set a Stop-Loss at ₹970. If the stock plunges to ₹970, your broker immediately executes a sell order to protect your capital.",
      },
      {
        heading: "Market Depth (Level 2 Quotes)",
        body: "When you view a stock's order book, you see the **Top 5 Bids (Buyers)** and **Top 5 Asks (Sellers)**.\n\n• **Bid:** The highest price buyers are currently willing to pay.\n• **Ask / Offer:** The lowest price sellers are willing to accept.\n• **Spread:** The difference between the highest Bid and lowest Ask. Highly liquid stocks like Reliance have a spread of just 5 paise; illiquid penny stocks have huge spreads.",
        proTip: "A massive wall of Bid quantity at a specific round number often acts as short-term support."
      }
    ]
  },

  // --- MODULE 7: What to Inspect Before Buying ---
  'm7': {
    title: "Fundamental Analysis: What to Inspect",
    level: "Intermediate",
    readTime: "6 min read",
    tagline: "Reading Balance Sheets, P&L, Cash Flow, and Competitive Moats.",
    takeaway: "Don't buy stocks based on WhatsApp tips. Inspect the three financial statements: Revenue growth, Operating margins, and Free Cash Flow.",
    content: [
      {
        heading: "The 3 Sacred Financial Statements",
        body: "Before investing your hard-earned money, inspect the company's financial report:\n\n1. **Profit & Loss (P&L):** Shows Revenue (Top line), Expenses, Taxes, and Net Profit (Bottom line) over the year.\n2. **Balance Sheet:** A snapshot of Assets (Cash, factories, inventory) vs Liabilities (Loans, payables) and Shareholders' Equity.\n3. **Cash Flow Statement:** Shows actual cash entering and leaving the bank. Profit on paper is useless if customers haven't actually paid cash!",
        proTip: "Always check 'Cash Flow from Operations'—it should be equal to or higher than Net Profit."
      },
      {
        heading: "Revenue vs. Net Profit Growth",
        body: "Look for companies with **consistent 12-15%+ annual Revenue (Sales) growth** over 5 years. \n\nEqually important is **Operating Margin**: If a company makes ₹100 in sales and spends ₹80 on manufacturing, its margin is 20%. Companies that can expand their margins during inflation have immense pricing power.",
      },
      {
        heading: "The Economic Moat (Warren Buffett's Secret)",
        body: "A castle without a moat will eventually be conquered. An **Economic Moat** is a company's competitive advantage that stops rivals from copying it:\n\n• **Brand Power:** Apple, Titan, Maggi (people pay extra without thinking).\n• **High Switching Costs:** TCS/Infosys (banks cannot easily rip out software systems).\n• **Network Effects:** Zomato, NSE (more buyers attract more sellers).\n• **Low Cost Advantage:** D-Mart (bulk procurement allows unbeatable discounts).",
        proTip: "Always ask: If I gave a competitor ₹5,000 Crores, could they destroy this company? If no, it has a wide moat."
      }
    ]
  },

  // --- MODULE 8: Key Financial Ratios Demystified ---
  'm8': {
    title: "Key Financial Ratios Made Simple",
    level: "Intermediate",
    readTime: "5 min read",
    tagline: "P/E, P/B, EPS, ROE, Debt-to-Equity, and Dividend Yield.",
    takeaway: "A great company at an absurdly high price can be a terrible investment. Ratios tell you if the valuation makes sense.",
    content: [
      {
        heading: "EPS (Earnings Per Share)",
        body: "EPS is the net profit divided by the total number of shares in circulation.\n\nIf a company earns ₹100 Crore net profit and has 10 Crore shares, **EPS = ₹10**. It measures how much profit belongs to each single share you hold.",
      },
      {
        heading: "P/E Ratio (Price to Earnings)",
        body: "The P/E ratio tells you: **'How many rupees are investors willing to pay for every ₹1 of company profit?'**\n\n• Formula: **Current Share Price ÷ EPS**\n• If a stock trades at ₹200 and has an EPS of ₹10, its P/E is **20x**.\n\nA high P/E (e.g. 70x) means investors expect massive future growth. A low P/E (e.g. 8x) might mean the company is undervalued—or that it is in serious trouble (a value trap). Always compare P/E with industry peers!",
        proTip: "Never compare a Tech stock's P/E (often 30-50x) with a PSU Bank's P/E (often 6-10x)."
      },
      {
        heading: "ROE (Return on Equity) & Debt-to-Equity",
        body: "• **ROE (Return on Equity):** Measures how efficiently management generates profit from shareholders' money. Look for companies with **ROE consistently above 15%**.\n• **Debt-to-Equity Ratio:** Total Debt divided by Equity. A ratio > 1.5 is a warning sign; a ratio < 0.5 means the company is virtually debt-free and safe from bankruptcy during economic recessions.",
      },
      {
        heading: "Dividend Yield",
        body: "If a company pays ₹20 cash dividend per share every year, and its share price is ₹500:\n\n**Dividend Yield = (₹20 ÷ ₹500) × 100 = 4%**.\n\nPSUs (like Coal India, ONGC) often provide high dividend yields, functioning like regular rental income for retirees.",
      }
    ]
  },

  // --- MODULE 9: Promoter Health & Red Flags ---
  'm9': {
    title: "Promoter Health & Corporate Governance",
    level: "Intermediate",
    readTime: "4 min read",
    tagline: "Spotting promoter pledges, fraud signals, and red flags early.",
    takeaway: "Never invest in promoters who take public investors for a ride. Check promoter holding and pledge percentage before anything else.",
    content: [
      {
        heading: "Skin in the Game: Promoter Holding",
        body: "The promoters are the founders and controlling family. If the promoters own **50%+ of the company**, their personal wealth rises and falls with yours. They have huge 'skin in the game'.\n\nIf promoters are steadily dumping their shares every quarter, it is a huge warning signal that insiders know something bad is coming.",
        proTip: "A sharp drop in promoter holding over 3 consecutive quarters is a major exit signal."
      },
      {
        heading: "The Danger of Pledged Shares",
        body: "Sometimes promoters need money for personal ventures or other businesses. They go to a non-banking lender and **pledge their company shares as collateral** for a loan.\n\nIf the stock price falls, the lender will demand extra margin. If the promoter can't pay, the lender will dump millions of pledged shares on the open market, causing an uncontrollable crash.\n\n**Rule of Thumb:** Avoid companies where more than **10-15% of promoter holdings are pledged**.",
      },
      {
        heading: "Corporate Governance Red Flags",
        body: "Watch out for these classic red flags:\n\n1. **Frequent Auditor Resignations:** If a reputed auditor abruptly quits citing 'health reasons', fraud is often brewing.\n2. **Related Party Transactions:** When the company lends money to another private company owned by the promoter's brother.\n3. **Frequent Name Changes:** Companies changing their names to include trendy buzzwords (like 'AI', 'Green Energy') with zero actual business in that field.",
      }
    ]
  },

  // --- MODULE 10: Candlestick Anatomy & Price Action ---
  'm10': {
    title: "Candlestick Anatomy & Price Action",
    level: "Advanced",
    readTime: "5 min read",
    tagline: "OHLC, Green vs Red bodies, Wicks, and Support & Resistance.",
    takeaway: "Candlesticks reveal the psychological battle between buyers (bulls) and sellers (bears) across any timeframe.",
    content: [
      {
        heading: "The 4 OHLC Price Points",
        body: "Every single candlestick on your chart summarizes trading activity across a fixed timeframe (e.g., 5-minute, 1-hour, or 1-day) using 4 prices:\n\n• **O (Open):** The first price executed in that timeframe.\n• **H (High):** The highest price reached during the period.\n• **L (Low):** The lowest price reached during the period.\n• **C (Close):** The final price when the candle ended.\n\n• **Green (Bullish) Candle:** Close > Open (Price went up).\n• **Red (Bearish) Candle:** Close < Open (Price went down).",
        proTip: "The thick rectangle is the 'Real Body'; the thin lines at top and bottom are 'Wicks' or 'Shadows'."
      },
      {
        heading: "Reading the Wicks (Price Rejection)",
        body: "Wicks show where the price went, but couldn't stay:\n\n• **Long Lower Wick:** Sellers tried to push prices down, but aggressive buyers stepped in and pushed the price back up before close. This shows **Bullish Support & Rejection of lower prices**.\n• **Long Upper Wick:** Buyers tried to rally, but sellers slammed prices down before close. This shows **Bearish Resistance & Rejection of higher prices**.",
      },
      {
        heading: "Support and Resistance Zones",
        body: "• **Support (The Floor):** A price level where buying interest is historically strong enough to halt or reverse a downward trend.\n• **Resistance (The Ceiling):** A price level where selling pressure is historically strong enough to halt or reverse an upward rally.\n\nWhen a stock decisively breaks above a key Resistance level with high volume, that old Resistance flips into **New Support**.",
        proTip: "Always draw Support and Resistance as flexible zones or bands, not razor-thin lines."
      }
    ]
  },

  // --- MODULE 11: Trends, Volume Confirmation & Breakouts ---
  'm11': {
    title: "Trends, Volumes & Breakout Dynamics",
    level: "Advanced",
    readTime: "5 min read",
    tagline: "Higher Highs, Volume as the fuel of price, and avoiding fakeouts.",
    takeaway: "The trend is your friend until the bend at the end. Price without volume is like a car without fuel.",
    content: [
      {
        heading: "The 3 Market Trends",
        body: "Prices never move in straight lines; they move in waves:\n\n1. **Uptrend (Bull Market):** Forms a sequence of **Higher Highs (HH) and Higher Lows (HL)**. Every pullback stops above the previous low.\n2. **Downtrend (Bear Market):** Forms a sequence of **Lower Highs (LH) and Lower Lows (LL)**. Every bounce fails below the previous peak.\n3. **Sideways / Consolidation:** Price oscillates between a horizontal support floor and resistance ceiling. Wait for a breakout before committing capital.",
      },
      {
        heading: "Volume: The Fuel of Price Action",
        body: "Volume is the total number of shares traded during a given period. It tells you whether institutional money is participating or if the move is just retail noise.\n\n• **Bullish Confirmation:** Price rises + Volume expands dramatically (Institutions are buying aggressively).\n• **Divergence Warning:** Price creeps higher but Volume is drying up (Move is running on fumes; high chance of sudden reversal).",
        proTip: "A breakout above resistance on low volume is almost always a 'Bull Trap' (fakeout)."
      },
      {
        heading: "How to Trade Breakouts Safely",
        body: "Amateur traders jump in the exact second a resistance line is pierced. Experienced traders wait for one of two confirmations:\n\n1. **Candle Close Confirmation:** A strong daily candle closes decisively ABOVE the resistance zone.\n2. **The Pullback & Retest:** Price breaks out, pulls back gently to touch the old resistance (now new support) on low volume, and bounces with a green candle. That bounce is the highest-probability entry.",
      }
    ]
  },

  // --- MODULE 12: Risk Management & Trading Psychology ---
  'm12': {
    title: "Risk Management & Trading Psychology",
    level: "Expert",
    readTime: "6 min read",
    tagline: "The 1% Rule, Risk-to-Reward 1:2, and Defeating FOMO.",
    takeaway: "Trading is not about being right 90% of the time. It is about losing small when you are wrong and letting winners run when you are right.",
    content: [
      {
        heading: "The Golden 1% Risk Rule",
        body: "Never risk losing more than **1% of your total trading capital on any single trade**.\n\nIf your total account is ₹1,00,000, your maximum allowed loss on a trade is ₹1,000.\n\n• If your trade has a Stop-Loss of ₹10 per share, you can buy: **₹1,000 ÷ ₹10 = 100 shares**.\n• If your Stop-Loss is ₹50 per share, you can only buy: **₹1,000 ÷ ₹50 = 20 shares**.\n\nThis simple math ensures you can survive 10 consecutive bad trades and still have 90% of your capital intact.",
        proTip: "Position size must be calculated from your Stop-Loss distance, NEVER from gut feeling."
      },
      {
        heading: "Risk-to-Reward (R:R) & The Win Rate Myth",
        body: "You do NOT need a 80% win rate to be profitable in the stock market:\n\nIf your Risk-to-Reward ratio is **1:2** (Risk ₹1,000 to make ₹2,000):\n• Out of 10 trades, you lose 6 trades: -₹6,000\n• Out of 10 trades, you win 4 trades: +₹8,000\n• **Net Profit: +₹2,000**, with only a 40% win rate!\n\nSuccessful traders protect their capital ruthlessly and cut losing trades without hesitation.",
      },
      {
        heading: "The Two Deadly Psychological Traps",
        body: "1. **FOMO (Fear of Missing Out):** A stock has already surged 18% in one day. You see green everywhere on Twitter and buy at the very top. Whales use your greed as exit liquidity and dump shares on you.\n2. **Revenge Trading:** You take an unexpected loss of ₹2,000. Angry and hurt, you immediately take a huge 5x leverage trade to 'win your money back'. Within 30 minutes, your loss balloons to ₹15,000.",
        proTip: "After a painful loss, step away from your trading screen for at least 1 hour. Never trade with elevated emotions."
      }
    ]
  }
};