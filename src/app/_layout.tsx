import { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useDatabase } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';

import { ToastProvider } from '@/context/toast-context';
import { DialogProvider } from '@/context/confirm-dialog-context';

// Keep splash screen visible until database migrations are ready
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isReady, error } = useDatabase();
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
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colorScheme === 'dark' ? '#121214' : '#F4F5F7' },
        ]}>
        <ActivityIndicator size="large" color="#00875A" />
        <Text
          style={[
            styles.loadingText,
            { color: colorScheme === 'dark' ? '#FFFFFF' : '#172B4D' },
          ]}>
          Preparing Rupee Tracker...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colorScheme === 'dark' ? '#121214' : '#F4F5F7' },
        ]}>
        <Text style={[styles.errorTitle, { color: '#E53935' }]}>
          Failed to load database
        </Text>
        <Text
          style={[
            styles.errorMessage,
            { color: colorScheme === 'dark' ? '#A5ADBA' : '#5E6C84' },
          ]}>
          {error.message}
        </Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ToastProvider>
        <DialogProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
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
