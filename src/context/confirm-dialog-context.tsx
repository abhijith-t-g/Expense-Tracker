import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface AlertDialogOptions {
  title: string;
  message: string;
  buttonText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onDismiss?: () => void;
}

interface DialogContextValue {
  showConfirm: (options: ConfirmDialogOptions) => void;
  showAlert: (options: AlertDialogOptions) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  const [confirmConfig, setConfirmConfig] = useState<ConfirmDialogOptions | null>(
    null
  );
  const [alertConfig, setAlertConfig] = useState<AlertDialogOptions | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const showConfirm = useCallback((options: ConfirmDialogOptions) => {
    setConfirmConfig(options);
  }, []);

  const showAlert = useCallback((options: AlertDialogOptions) => {
    setAlertConfig(options);
  }, []);

  const handleConfirmPress = async () => {
    if (!confirmConfig) return;
    try {
      setIsProcessing(true);
      if (confirmConfig.onConfirm) {
        await confirmConfig.onConfirm();
      }
    } finally {
      setIsProcessing(false);
      setConfirmConfig(null);
    }
  };

  const handleCancelPress = () => {
    if (confirmConfig?.onCancel) {
      confirmConfig.onCancel();
    }
    setConfirmConfig(null);
  };

  const handleAlertDismiss = () => {
    if (alertConfig?.onDismiss) {
      alertConfig.onDismiss();
    }
    setAlertConfig(null);
  };

  return (
    <DialogContext.Provider value={{ showConfirm, showAlert }}>
      {children}

      {/* Confirmation Dialog Modal */}
      <Modal
        visible={confirmConfig !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelPress}>
        <View style={styles.modalOverlay}>
          {confirmConfig && (
            <View
              style={[
                styles.dialogCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: confirmConfig.isDestructive
                        ? theme.expenseLight
                        : theme.primaryLight,
                    },
                  ]}>
                  <Ionicons
                    name={
                      confirmConfig.icon ??
                      (confirmConfig.isDestructive
                        ? 'trash-outline'
                        : 'help-circle-outline')
                    }
                    size={22}
                    color={
                      confirmConfig.isDestructive
                        ? theme.danger
                        : theme.primary
                    }
                  />
                </View>
                <Text style={[styles.dialogTitle, { color: theme.text }]}>
                  {confirmConfig.title}
                </Text>
              </View>

              <Text
                style={[styles.dialogMessage, { color: theme.textSecondary }]}>
                {confirmConfig.message}
              </Text>

              <View style={styles.actionsRow}>
                <Button
                  title={confirmConfig.cancelText ?? 'Cancel'}
                  variant="outline"
                  onPress={handleCancelPress}
                  disabled={isProcessing}
                  style={{ flex: 1 }}
                />
                <Button
                  title={confirmConfig.confirmText ?? 'Confirm'}
                  variant={confirmConfig.isDestructive ? 'danger' : 'primary'}
                  loading={isProcessing}
                  onPress={handleConfirmPress}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Alert Dialog Modal */}
      <Modal
        visible={alertConfig !== null}
        transparent
        animationType="fade"
        onRequestClose={handleAlertDismiss}>
        <View style={styles.modalOverlay}>
          {alertConfig && (
            <View
              style={[
                styles.dialogCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.backgroundElement },
                  ]}>
                  <Ionicons
                    name={alertConfig.icon ?? 'information-circle-outline'}
                    size={22}
                    color={theme.primary}
                  />
                </View>
                <Text style={[styles.dialogTitle, { color: theme.text }]}>
                  {alertConfig.title}
                </Text>
              </View>

              <Text
                style={[styles.dialogMessage, { color: theme.textSecondary }]}>
                {alertConfig.message}
              </Text>

              <View style={styles.singleActionRow}>
                <Button
                  title={alertConfig.buttonText ?? 'OK'}
                  variant="primary"
                  onPress={handleAlertDismiss}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          )}
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useConfirmDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(
      'useConfirmDialog must be used within a DialogProvider'
    );
  }
  return context;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  dialogMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
    marginTop: Spacing.one,
  },
  singleActionRow: {
    marginTop: Spacing.one,
  },
});
