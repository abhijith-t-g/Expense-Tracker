export interface SeedCategory {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isDefault: boolean;
}

export const DEFAULT_CATEGORIES: SeedCategory[] = [
  // Expenses
  {
    name: 'Food & Dining',
    icon: 'restaurant',
    color: '#FF6B6B',
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Transport & Fuel',
    icon: 'car',
    color: '#4D96FF',
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Groceries & Daily',
    icon: 'cart',
    color: '#6BCB77',
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Bills & Recharge',
    icon: 'receipt',
    color: '#FFD93D',
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Shopping',
    icon: 'bag-handle',
    color: '#9D4EDD',
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Health & Medical',
    icon: 'medkit',
    color: '#FF5964',
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Entertainment & OTT',
    icon: 'film',
    color: '#F72585',
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Rent & Housing',
    icon: 'home',
    color: '#3A86FF',
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Education',
    icon: 'book',
    color: '#4361EE',
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Other Expense',
    icon: 'ellipsis-horizontal-circle',
    color: '#8D99AE',
    type: 'expense',
    isDefault: true,
  },

  // Incomes
  {
    name: 'Salary',
    icon: 'cash',
    color: '#2EC4B6',
    type: 'income',
    isDefault: true,
  },
  {
    name: 'Freelance & Business',
    icon: 'briefcase',
    color: '#38B000',
    type: 'income',
    isDefault: true,
  },
  {
    name: 'Investments',
    icon: 'trending-up',
    color: '#0077B6',
    type: 'income',
    isDefault: true,
  },
  {
    name: 'Cashback & Rewards',
    icon: 'gift',
    color: '#FF9F1C',
    type: 'income',
    isDefault: true,
  },
  {
    name: 'Other Income',
    icon: 'wallet',
    color: '#2A9D8F',
    type: 'income',
    isDefault: true,
  },
];
