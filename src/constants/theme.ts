/**
 * Rupee Tracker Design System & Themes
 * Supports Light & Dark themes with Indian Rupee palette accents.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#00875A', // Emerald green
    primaryLight: '#E3FCEF',
    primaryDark: '#006644',
    expense: '#E53935', // Crisp red
    expenseLight: '#FFEBEE',
    income: '#00875A', // Fresh green
    incomeLight: '#E8F5E9',
    text: '#172B4D',
    textSecondary: '#5E6C84',
    textMuted: '#97A0AF',
    background: '#F4F5F7',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#DFE1E6',
    borderSubtle: '#EBECF0',
    backgroundElement: '#EBECF0',
    backgroundSelected: '#DEEBFF',
    tint: '#00875A',
    tabIconDefault: '#8993A4',
    tabIconSelected: '#00875A',
    danger: '#DE350B',
    warning: '#FFAB00',
    success: '#36B37E',
  },
  dark: {
    primary: '#36B37E',
    primaryLight: '#092B1C',
    primaryDark: '#006644',
    expense: '#FF6B6B',
    expenseLight: '#381313',
    income: '#36B37E',
    incomeLight: '#092B1C',
    text: '#F4F5F7',
    textSecondary: '#A5ADBA',
    textMuted: '#6B778C',
    background: '#121214',
    surface: '#1E1F23',
    card: '#1E1F23',
    border: '#2E3136',
    borderSubtle: '#24262A',
    backgroundElement: '#26282D',
    backgroundSelected: '#253858',
    tint: '#36B37E',
    tabIconDefault: '#7A869A',
    tabIconSelected: '#36B37E',
    danger: '#FF5630',
    warning: '#FFAB00',
    success: '#36B37E',
  },
} as const;

export type ThemePalette = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  expense: string;
  expenseLight: string;
  income: string;
  incomeLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  background: string;
  surface: string;
  card: string;
  border: string;
  borderSubtle: string;
  backgroundElement: string;
  backgroundSelected: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  danger: string;
  warning: string;
  success: string;
};

export type ThemeColors = ThemePalette;
export type ThemeColor = keyof ThemeColors;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 75 }) ?? 0;
export const MaxContentWidth = 800;
