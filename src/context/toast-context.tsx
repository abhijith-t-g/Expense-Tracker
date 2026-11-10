import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions | string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-20));

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [fadeAnim, translateY]);

  const showToast = useCallback(
    (options: ToastOptions | string) => {
      const config: ToastOptions =
        typeof options === 'string'
          ? { message: options, type: 'info' }
          : { type: 'info', ...options };

      setToast(config);
      fadeAnim.setValue(0);
      translateY.setValue(-20);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = config.duration ?? 3000;
      setTimeout(() => {
        hideToast();
      }, duration);
    },
    [fadeAnim, translateY, hideToast]
  );

  const showSuccess = useCallback(
    (message: string) => showToast({ message, type: 'success' }),
    [showToast]
  );
  const showError = useCallback(
    (message: string) => showToast({ message, type: 'error' }),
    [showToast]
  );
  const showInfo = useCallback(
    (message: string) => showToast({ message, type: 'info' }),
    [showToast]
  );

  const getTypeStyles = () => {
    switch (toast?.type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          iconColor: theme.income,
          borderColor: theme.income + '40',
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          iconColor: theme.expense,
          borderColor: theme.expense + '40',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          iconColor: theme.primary,
          borderColor: theme.border,
        };
    }
  };

  const typeConfig = getTypeStyles();

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      {toast && (
        <SafeAreaView
          pointerEvents="box-none"
          style={styles.toastContainer}
          edges={['top']}>
          <Animated.View
            style={[
              styles.toastBubble,
              {
                backgroundColor: theme.surface,
                borderColor: typeConfig.borderColor,
                opacity: fadeAnim,
                transform: [{ translateY }],
              },
            ]}>
            <Ionicons
              name={typeConfig.icon}
              size={22}
              color={typeConfig.iconColor}
            />
            <Text
              style={[styles.toastText, { color: theme.text }]}
              numberOfLines={2}>
              {toast.message}
            </Text>
            <Pressable hitSlop={8} onPress={hideToast}>
              <Ionicons name="close" size={18} color={theme.textMuted} />
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  toastBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: Spacing.two + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
