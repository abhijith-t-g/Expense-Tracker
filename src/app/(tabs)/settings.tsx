import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme as useSystemColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useConfirmDialog } from '@/context/confirm-dialog-context';
import { useToast } from '@/context/toast-context';
import { CURRENT_SCHEMA_VERSION } from '@/db/migrations';
import { useBalance } from '@/hooks/use-balance';
import { useTheme } from '@/hooks/use-theme';
import { BackupService } from '@/services/backup';
import {
  CURRENCY_CODE,
  CURRENCY_SYMBOL,
  formatINR,
  paiseToInputString,
  parseAmountInputToPaise,
} from '@/services/currency';

export default function SettingsScreen() {
  const theme = useTheme();
  const systemColorScheme = useSystemColorScheme();
  const { showSuccess, showError, showInfo } = useToast();
  const { showConfirm, showAlert } = useConfirmDialog();

  const { initialOpeningBalance, setInitialBalance, refresh: refreshBalance } =
    useBalance();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Opening Balance Modal
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');

  const handleOpenBalanceModal = () => {
    setBalanceInput(paiseToInputString(initialOpeningBalance));
    setIsBalanceModalOpen(true);
  };

  const handleSaveInitialBalance = async () => {
    const paise = parseAmountInputToPaise(balanceInput);
    await setInitialBalance(paise);
    setIsBalanceModalOpen(false);
    showSuccess(`Initial opening balance set to ${formatINR(paise)}`);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await BackupService.exportBackup();
      if (res.success) {
        showSuccess('JSON backup ready to share or save');
      } else if (res.message) {
        showInfo(res.message);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unknown export error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (mode: 'merge' | 'replace') => {
    showConfirm({
      title: mode === 'replace' ? 'Replace All Data?' : 'Merge Backup Data?',
      message:
        mode === 'replace'
          ? 'This will erase existing transactions and replace them with the backup data. This action cannot be undone.'
          : 'This will import transactions and categories from the backup into your existing records.',
      confirmText: mode === 'replace' ? 'Yes, Replace' : 'Yes, Merge',
      isDestructive: mode === 'replace',
      onConfirm: async () => {
        try {
          setIsImporting(true);
          const result = await BackupService.importBackup(mode);
          if (result.success) {
            showSuccess(result.message ?? 'Import succeeded');
            refreshBalance();
          } else if (result.message) {
            showAlert({ title: 'Import Notice', message: result.message });
          }
        } catch (err) {
          showError(err instanceof Error ? err.message : 'Failed to import backup');
        } finally {
          setIsImporting(false);
        }
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Personalization & Data Management
          </Text>
        </View>

        {/* Financial Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            Finances & Balance
          </Text>
          <Card variant="outlined" style={styles.card}>
            {/* Opening Balance Config */}
            <Pressable
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: theme.backgroundElement },
              ]}
              onPress={handleOpenBalanceModal}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.primaryLight },
                  ]}>
                  <Ionicons
                    name="wallet-outline"
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>
                    Initial Opening Balance
                  </Text>
                  <Text
                    style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                    Starting amount for carry-forward balance
                  </Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.amountValue, { color: theme.primary }]}>
                  {formatINR(initialOpeningBalance)}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.textMuted}
                />
              </View>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Currency Info */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.backgroundElement },
                  ]}>
                  <Text style={[styles.currencyIcon, { color: theme.text }]}>
                    {CURRENCY_SYMBOL}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>
                    Currency
                  </Text>
                  <Text
                    style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                    Indian Rupee ({CURRENCY_CODE})
                  </Text>
                </View>
              </View>
              <Text style={[styles.badge, { color: theme.textSecondary }]}>
                ₹ INR Only
              </Text>
            </View>
          </Card>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            Categories
          </Text>
          <Card variant="outlined" style={styles.card}>
            <Pressable
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: theme.backgroundElement },
              ]}
              onPress={() => router.push('/manage-categories')}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.backgroundElement },
                  ]}>
                  <Ionicons
                    name="grid-outline"
                    size={20}
                    color={theme.text}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>
                    Manage Categories
                  </Text>
                  <Text
                    style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                    Add or customize expense and income tags
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textMuted}
              />
            </Pressable>
          </Card>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            Appearance
          </Text>
          <Card variant="outlined" style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.backgroundElement },
                  ]}>
                  <Ionicons
                    name={systemColorScheme === 'dark' ? 'moon' : 'sunny'}
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>
                    Theme
                  </Text>
                  <Text
                    style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                    Active: {systemColorScheme === 'dark' ? 'Dark' : 'Light'} Mode
                  </Text>
                </View>
              </View>
              <Text style={[styles.badge, { color: theme.primary }]}>
                Light + Dark
              </Text>
            </View>
          </Card>
        </View>

        {/* Data & Backup Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            Backup & Restore
          </Text>
          <Card variant="outlined" style={styles.card}>
            <View style={styles.backupHeader}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={theme.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  Manual JSON Backup
                </Text>
                <Text
                  style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                  Export or restore all data locally without any cloud or internet dependency.
                </Text>
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <Button
                title="Export JSON Backup"
                variant="primary"
                loading={isExporting}
                icon={
                  <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                }
                onPress={handleExport}
              />

              <View style={styles.importRow}>
                <Button
                  title="Merge Import"
                  variant="outline"
                  loading={isImporting}
                  icon={
                    <Ionicons
                      name="download-outline"
                      size={18}
                      color={theme.primary}
                    />
                  }
                  onPress={() => handleImport('merge')}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Replace All"
                  variant="danger"
                  loading={isImporting}
                  icon={
                    <Ionicons
                      name="refresh-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                  }
                  onPress={() => handleImport('replace')}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </Card>
        </View>

        {/* About Rupee Tracker Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            About Rupee Tracker
          </Text>
          <Card variant="outlined" style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Version
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                1.0.0 (Phase 1)
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.row}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Database & Schema
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                SQLite • Drizzle ORM v{CURRENT_SCHEMA_VERSION}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.row}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Monetary Storage
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                Integer Paise (1 INR = 100 Paise)
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.row}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Offline First
              </Text>
              <Text style={[styles.infoValue, { color: theme.primary }]}>
                100% Private & Local
              </Text>
            </View>
          </Card>
        </View>

        {/* Initial Opening Balance Modal */}
        <Modal
          visible={isBalanceModalOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setIsBalanceModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Initial Opening Balance
                </Text>
                <Pressable onPress={() => setIsBalanceModalOpen(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </View>

              <Text
                style={[styles.modalDescription, { color: theme.textSecondary }]}>
                Set the starting balance you had before tracking in this app.
                This amount will carry forward into each month.
              </Text>

              <View
                style={[
                  styles.balanceInputBox,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}>
                <Text style={[styles.currencyPrefix, { color: theme.primary }]}>
                  {CURRENCY_SYMBOL}
                </Text>
                <TextInput
                  style={[styles.balanceTextInput, { color: theme.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                  value={balanceInput}
                  onChangeText={setBalanceInput}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsBalanceModalOpen(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save Balance"
                  variant="primary"
                  onPress={handleSaveInitialBalance}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  header: {
    paddingTop: Spacing.two,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  buttonGroup: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  importRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  balanceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1.5,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: Spacing.two,
  },
  balanceTextInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    padding: 0,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
});
