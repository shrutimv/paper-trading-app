// src/quizData.ts
export const quizData = {
  modules: [
    {
      id: "m1",
      title: "1. Market Basics",
      level: "Beginner",
      description: "Understand how the stock market actually works.",
      content: "The stock market is where shares of pubicly held companies are issued and traded. The primary goal is to provide companies with access to capital in exchange for giving investors a slice of ownership. Key players include the Exchange (like NSE/BSE), Brokers, and Investors.",
      questions: [
        {
          id: "q1",
          question: "What is the primary purpose of a Stock Exchange?",
          options: ["To give free money", "To provide a platform for trading", "To fix stock prices", "To manage bank accounts"],
          correct: 1,
          explanation: "The exchange acts as a regulated marketplace where buyers and sellers can trade existing securities."
        },
        // ... Add 9 more questions
      ]
    },
    {
      id: "m2",
      title: "2. Technical Analysis",
      level: "Intermediate",
      description: "Learn to read charts and price action.",
      content: "Technical analysis is the study of historical market data, including price and volume. Unlike fundamental analysis, it focuses on patterns on charts to predict future price movements. Concepts include Support, Resistance, and Trendlines.",
      questions: [
        {
          id: "q1",
          question: "What does 'Support' represent on a chart?",
          options: ["A price ceiling", "A price floor where buying interest is strong", "The company's profit", "The highest price ever reached"],
          correct: 1,
          explanation: "Support is a price level where a downtrend tends to pause due to a concentration of demand (buying power)."
        }
      ]
    }
  ]
};