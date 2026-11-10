/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useThemePreference } from '@/context/theme-context';

export function useTheme() {
  const { theme } = useThemePreference();
  return theme;
}
