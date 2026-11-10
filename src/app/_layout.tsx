import { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AppLoadingScreen } from '@/components/common/app-loading-screen';
import { DialogProvider } from '@/context/confirm-dialog-context';
import {
  ThemePreferenceProvider,
  useThemePreference,
} from '@/context/theme-context';
import { ToastProvider } from '@/context/toast-context';
import { useDatabase } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';

// Keep splash screen visible until database migrations are ready
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

function RootNavigation() {
  const { isReady, error } = useDatabase();
  const { activeTheme } = useThemePreference();
  const theme = useTheme();

  useEffect(() => {
    if (isReady || error) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [isReady, error]);

  if (!isReady && !error) {
    return (
      <AppLoadingScreen
        isDark={activeTheme === 'dark'}
        message="Setting up your offline financial vault..."
      />
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: activeTheme === 'dark' ? '#121214' : '#F4F5F7' },
        ]}>
        <Text style={[styles.errorTitle, { color: '#E53935' }]}>
          Failed to load database
        </Text>
        <Text
          style={[
            styles.errorMessage,
            { color: activeTheme === 'dark' ? '#A5ADBA' : '#5E6C84' },
          ]}>
          {error.message}
        </Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ToastProvider>
        <DialogProvider>
          <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.surface,
              },
              headerTintColor: theme.text,
              headerTitleStyle: {
                fontWeight: '700',
              },
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="add"
              options={{
                presentation: 'modal',
                title: 'Transaction',
              }}
            />
            <Stack.Screen
              name="manage-categories"
              options={{
                title: 'Manage Categories',
              }}
            />
          </Stack>
        </DialogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <RootNavigation />
    </ThemePreferenceProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
});
