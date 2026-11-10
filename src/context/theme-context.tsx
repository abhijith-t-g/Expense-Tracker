import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { eq } from 'drizzle-orm';
import { Colors, type ThemeColors } from '@/constants/theme';
import { getDb } from '@/db/client';
import { appMetadata } from '@/db/schema';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  themeMode: ThemeMode;
  activeTheme: 'light' | 'dark';
  theme: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isLoading: boolean;
}

const THEME_METADATA_KEY = 'theme_preference';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemePreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved theme preference from SQLite app_metadata
  useEffect(() => {
    let ignore = false;
    async function loadTheme() {
      try {
        const db = getDb();
        const rows = await db
          .select()
          .from(appMetadata)
          .where(eq(appMetadata.key, THEME_METADATA_KEY))
          .limit(1);

        if (!ignore && rows.length > 0) {
          const val = rows[0].value as ThemeMode;
          if (val === 'light' || val === 'dark' || val === 'system') {
            setThemeModeState(val);
          }
        }
      } catch {
        // Database might not be ready yet or no record
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadTheme();
    return () => {
      ignore = true;
    };
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      const db = getDb();
      await db
        .insert(appMetadata)
        .values({
          key: THEME_METADATA_KEY,
          value: mode,
        })
        .onConflictDoUpdate({
          target: appMetadata.key,
          set: { value: mode },
        });
    } catch {
      // ignore persistence error
    }
  }, []);

  // Compute active theme based on user selection or device scheme
  const activeTheme: 'light' | 'dark' =
    themeMode === 'system'
      ? deviceColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : themeMode;

  const theme = Colors[activeTheme];

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        activeTheme,
        theme,
        setThemeMode,
        isLoading,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemePreference(): ThemeContextValue {
  const context = useContext(ThemeContext);
  const deviceColorScheme = useDeviceColorScheme();

  if (!context) {
    const fallbackActive: 'light' | 'dark' =
      deviceColorScheme === 'dark' ? 'dark' : 'light';
    return {
      themeMode: 'system',
      activeTheme: fallbackActive,
      theme: Colors[fallbackActive],
      setThemeMode: async () => {},
      isLoading: false,
    };
  }

  return context;
}

