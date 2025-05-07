import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useExchangeStore = create(
  devtools(
    (set, get) => ({
      // State
      selectedExchange: 'HOSE',
      
      // Exchange mapping
      exchangeMap: {
        'HOSE': 'hsx',
        'HNX': 'hnx',
        // Reverse mapping
        'hsx': 'HOSE',
        'hnx': 'HNX'
      },

      // Actions
      setSelectedExchange: (exchange) => set({ selectedExchange: exchange }),

      // Helpers
      getApiExchange: () => {
        const { selectedExchange, exchangeMap } = get();
        return exchangeMap[selectedExchange] || 'hsx';
      },

      getDisplayExchange: (apiExchange) => {
        const { exchangeMap } = get();
        return exchangeMap[apiExchange] || 'HOSE';
      },

      // Validate if the API exchange matches the selected exchange
      isMatchingExchange: (apiExchange) => {
        const { selectedExchange, exchangeMap } = get();
        return exchangeMap[selectedExchange] === apiExchange;
      }
    }),
    {
      name: 'exchange-store'
    }
  )
);

export default useExchangeStore; 