// constants/Questions.ts

export const QUIZ_DATA: any = {
  // --- MODULE 1: Why Markets Exist? ---
  'm1': [
    {
      question: "Why does a company issue shares to the public in an IPO?",
      options: ["To take a loan from the bank", "To raise Capital for growth without debt", "To give away the company for free", "To pay taxes"],
      correct: 1,
      explanation: "Capital is the money a business needs to expand. IPOs let them raise this money without paying interest."
    },
    {
      question: "What do you call the person or group that started the company?",
      options: ["Shareholder", "Broker", "Promoter", "Regulator"],
      correct: 2,
      explanation: "Promoters are the founders. Even after an IPO, they usually act as the main owners."
    },
    {
      question: "When you buy a share, what do you become?",
      options: ["An Employee", "A Part-Owner (Shareholder)", "A Customer", "A Manager"],
      correct: 1,
      explanation: "A share is a unit of ownership. You are technically a partial owner of that business."
    },
    {
      question: "Which of these is a risk of investing in stocks?",
      options: ["Guaranteed returns", "You can lose your capital", "Fixed interest rates", "Government protection"],
      correct: 1,
      explanation: "Unlike a Fixed Deposit, stocks have no guarantee. If the company fails, the stock price can go to zero."
    },
    {
      question: "What does 'IPO' stand for?",
      options: ["Indian Public Offer", "Initial Public Offering", "Internal Profit Organization", "Immediate Payment Option"],
      correct: 1,
      explanation: "It is the first time a private company offers its shares to the public."
    }
  ],

  // --- MODULE 2: The Ecosystem ---
  'm2': [
    {
      question: "Which body regulates the Indian Stock Market?",
      options: ["RBI", "SEBI", "NSE", "Government of India"],
      correct: 1,
      explanation: "SEBI (Securities and Exchange Board of India) makes the rules to protect investors."
    },
    {
      question: "Which is the oldest Stock Exchange in Asia?",
      options: ["NSE", "NYSE", "BSE (Bombay Stock Exchange)", "LSE"],
      correct: 2,
      explanation: "The BSE was established in 1875."
    },
    {
      question: "To store shares digitally, which account is mandatory?",
      options: ["Savings Account", "Demat Account", "Current Account", "Salary Account"],
      correct: 1,
      explanation: "Demat (Dematerialized) accounts hold your shares in electronic format."
    },
    {
      question: "Who acts as the middleman between you and the Stock Exchange?",
      options: ["The Bank", "The Government", "A Stock Broker", "A Mutual Fund"],
      correct: 2,
      explanation: "You cannot trade directly on the NSE/BSE. You must go through a registered broker like Zerodha or Groww."
    },
    {
      question: "What are Nifty and Sensex?",
      options: ["Banks", "Stock Exchanges", "Market Indices", "Government Schemes"],
      correct: 2,
      explanation: "They are 'Indices' that track the overall health of the market (Nifty 50 tracks top 50 companies)."
    }
  ],

  // --- MODULE 3: Stock Basics ---
  'm3': [
    {
      question: "If you buy 'Equity', what are you buying?",
      options: ["Debt", "Ownership", "Gold", "Insurance"],
      correct: 1,
      explanation: "Equity means ownership in a company."
    },
    {
      question: "Which price changes every second during market hours?",
      options: ["Face Value", "Market Price", "MRP", "Book Value"],
      correct: 1,
      explanation: "Market Price fluctuates based on supply and demand."
    },
    {
      question: "What is a 'Dividend'?",
      options: ["A tax you pay", "A fee to the broker", "A share of the company's profit", "A loan interest"],
      correct: 2,
      explanation: "Profitable companies often share a part of their earnings with shareholders as dividends."
    },
    {
      question: "What is 'Face Value' used for?",
      options: ["Trading", "Accounting & Corporate Actions", "Predicting prices", "Paying taxes"],
      correct: 1,
      explanation: "Face Value is the original value on paper, used to calculate dividends and splits."
    },
    {
      question: "If you buy a stock at ₹100 and sell at ₹150, what is the profit called?",
      options: ["Dividend", "Capital Appreciation", "Interest", "Salary"],
      correct: 1,
      explanation: "Capital Appreciation is the increase in the price of an asset over time."
    }
  ],

  // --- MODULE 4: Market Cap & Sectors ---
  'm4': [
    {
      question: "How is Market Capitalization calculated?",
      options: ["Profit x Loss", "Share Price x Total Number of Shares", "Assets - Liabilities", "Revenue + Cash"],
      correct: 1,
      explanation: "Market Cap tells you the total value of the company. Formula: Current Price × Total Shares."
    },
    {
      question: "Which category of stocks is considered the safest and most stable?",
      options: ["Small Cap", "Mid Cap", "Large Cap", "Penny Stocks"],
      correct: 2,
      explanation: "Large Cap companies (Top 100) are huge, established businesses (like Reliance, TCS) that are less volatile."
    },
    {
      question: "What is a 'Blue Chip' company?",
      options: ["A company that makes chips", "A gambling company", "A nationally recognized, financially sound company", "A failing company"],
      correct: 2,
      explanation: "Blue Chip refers to reliable, profitable, Large Cap companies."
    },
    {
      question: "Which of these is a 'Sector'?",
      options: ["Nifty 50", "IT (Information Technology)", "Sensex", "Demat"],
      correct: 1,
      explanation: "A sector is a group of companies in the same industry, like IT, Pharma, or Auto."
    },
    {
      question: "Why are Small Cap stocks considered risky?",
      options: ["They have low potential", "They are volatile and can fail easily", "They are too expensive", "Foreigners own them"],
      correct: 1,
      explanation: "Small companies have high growth potential but also a higher chance of going out of business."
    }
  ]
};