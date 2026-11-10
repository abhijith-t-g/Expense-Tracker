import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/common/empty-state';
import { AddTransactionButton } from '@/components/expense/add-transaction-button';
import { TransactionItem } from '@/components/expense/transaction-item';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useConfirmDialog } from '@/context/confirm-dialog-context';
import { useToast } from '@/context/toast-context';
import { useBalance } from '@/hooks/use-balance';
import { useExpenses } from '@/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';
import {
  CURRENCY_SYMBOL,
  formatINR,
  paiseToInputString,
  parseAmountInputToPaise,
} from '@/services/currency';
import type { TransactionWithCategory } from '@/types/database';

export default function DashboardScreen() {
  const theme = useTheme();
  const { showSuccess } = useToast();
  const { showConfirm } = useConfirmDialog();

  const recentFilter = useMemo(() => ({ limit: 5 }), []);

  const {
    summary: balanceSummary,
    isLoading: isBalanceLoading,
    refresh: refreshBalance,
    setAvailableBalance,
  } = useBalance();

  const {
    expenses: recentExpenses,
    isLoading: isExpensesLoading,
    refresh: refreshExpenses,
    deleteTransaction,
  } = useExpenses(recentFilter);

  // Available Balance Modal State
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');

  // Auto-refresh when Dashboard screen gains focus (e.g. returning from Add/Edit or switching tabs)
  useFocusEffect(
    useCallback(() => {
      refreshBalance();
      refreshExpenses();
    }, [refreshBalance, refreshExpenses])
  );

  const handleOpenBalanceModal = () => {
    setBalanceInput(
      balanceSummary.availableBalancePaise > 0
        ? paiseToInputString(balanceSummary.availableBalancePaise)
        : ''
    );
    setIsBalanceModalOpen(true);
  };

  const handleSaveAvailableBalance = async () => {
    const paise = parseAmountInputToPaise(balanceInput);
    await setAvailableBalance(paise);
    setIsBalanceModalOpen(false);
    showSuccess(`Available balance updated to ${formatINR(paise)}`);
  };

  const handleDeleteWithConfirm = (item: TransactionWithCategory) => {
    showConfirm({
      title: 'Delete Transaction',
      message: `Are you sure you want to delete "${item.title}" (${formatINR(item.amount)})?`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        await deleteTransaction(item.id);
        await refreshBalance();
        showSuccess('Transaction deleted');
      },
    });
  };

  const handleRefresh = async () => {
    await Promise.all([refreshBalance(), refreshExpenses()]);
  };

  const isRefreshing = isBalanceLoading || isExpensesLoading;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.appName, { color: theme.primary }]}>
                Rupee Tracker
              </Text>
              <Text style={[styles.monthLabel, { color: theme.textSecondary }]}>
                {balanceSummary.monthLabel}
              </Text>
            </View>

            <Pressable
              hitSlop={8}
              style={[
                styles.settingsBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => router.push('/settings')}>
              <Ionicons
                name="settings-outline"
                size={20}
                color={theme.text}
              />
            </Pressable>
          </View>

          {/* Available Balance Hero Card */}
          <Card variant="elevated" style={styles.balanceHeroCard}>
            <View style={styles.balanceTopRow}>
              <View style={styles.balanceLabelGroup}>
                <Text
                  style={[
                    styles.balanceCaption,
                    { color: theme.textSecondary },
                  ]}>
                  Available Balance
                </Text>
                <View
                  style={[
                    styles.currencyPill,
                    { backgroundColor: theme.primaryLight },
                  ]}>
                  <Text
                    style={[
                      styles.currencyPillText,
                      { color: theme.primary },
                    ]}>
                    {CURRENCY_SYMBOL} INR
                  </Text>
                </View>
              </View>

              {/* Direct Set Balance Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.setBalanceBtn,
                  {
                    backgroundColor: pressed
                      ? theme.backgroundSelected
                      : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleOpenBalanceModal}>
                <Ionicons
                  name="wallet-outline"
                  size={14}
                  color={theme.primary}
                />
                <Text
                  style={[styles.setBalanceBtnText, { color: theme.primary }]}>
                  Set Balance
                </Text>
              </Pressable>
            </View>

            <Pressable onPress={handleOpenBalanceModal}>
              <Text
                style={[
                  styles.balanceAmount,
                  {
                    color:
                      balanceSummary.availableBalancePaise >= 0
                        ? theme.text
                        : theme.expense,
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {formatINR(balanceSummary.availableBalancePaise)}
              </Text>
            </Pressable>

            {/* Opening Balance Subtext */}
            <View style={styles.balanceFooterRow}>
              <View style={styles.openingBadge}>
                <Ionicons
                  name="arrow-forward-circle-outline"
                  size={14}
                  color={theme.textMuted}
                />
                <Text
                  style={[styles.openingBadgeText, { color: theme.textMuted }]}
                  numberOfLines={1}>
                  Opening Balance: {formatINR(balanceSummary.openingBalancePaise)}
                </Text>
              </View>
              <Pressable hitSlop={6} onPress={handleOpenBalanceModal}>
                <Text style={[styles.adjustLink, { color: theme.primary }]}>
                  Adjust
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Standalone Monthly Income & Monthly Expenses Cards (Responsive, No Overflow) */}
          <View style={styles.incomeExpenseRow}>
            {/* Monthly Income Card */}
            <Card variant="outlined" style={styles.statCard}>
              <View style={styles.statHeader}>
                <View
                  style={[
                    styles.statIconCircle,
                    { backgroundColor: theme.incomeLight },
                  ]}>
                  <Ionicons
                    name="arrow-down-circle"
                    size={16}
                    color={theme.income}
                  />
                </View>
                <Text
                  style={[
                    styles.statCategoryLabel,
                    { color: theme.textSecondary },
                  ]}
                  numberOfLines={1}>
                  Income
                </Text>
              </View>

              <Text
                style={[styles.statAmount, { color: theme.income }]}
                numberOfLines={1}
                ellipsizeMode="tail"
                adjustsFontSizeToFit
                minimumFontScale={0.75}>
                +{formatINR(balanceSummary.monthlyIncomePaise, {
                  showSign: false,
                  hideZeroDecimals: true,
                })}
              </Text>

              <Text
                style={[styles.statSubtext, { color: theme.textMuted }]}
                numberOfLines={1}>
                This month
              </Text>
            </Card>

            {/* Monthly Expenses Card */}
            <Card variant="outlined" style={styles.statCard}>
              <View style={styles.statHeader}>
                <View
                  style={[
                    styles.statIconCircle,
                    { backgroundColor: theme.expenseLight },
                  ]}>
                  <Ionicons
                    name="arrow-up-circle"
                    size={16}
                    color={theme.expense}
                  />
                </View>
                <Text
                  style={[
                    styles.statCategoryLabel,
                    { color: theme.textSecondary },
                  ]}
                  numberOfLines={1}>
                  Expenses
                </Text>
              </View>

              <Text
                style={[styles.statAmount, { color: theme.expense }]}
                numberOfLines={1}
                ellipsizeMode="tail"
                adjustsFontSizeToFit
                minimumFontScale={0.75}>
                -{formatINR(balanceSummary.monthlyExpensePaise, {
                  showSign: false,
                  hideZeroDecimals: true,
                })}
              </Text>

              <Text
                style={[styles.statSubtext, { color: theme.textMuted }]}
                numberOfLines={1}>
                This month
              </Text>
            </Card>
          </View>

          {/* Recent Transactions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Recent Transactions
              </Text>
              {recentExpenses.length > 0 && (
                <Pressable
                  hitSlop={8}
                  onPress={() => router.push('/expenses')}>
                  <Text style={[styles.viewAllText, { color: theme.primary }]}>
                    View All
                  </Text>
                </Pressable>
              )}
            </View>

            {recentExpenses.length === 0 ? (
              <Card variant="outlined">
                <EmptyState
                  title="No transactions recorded"
                  description="Start by recording an expense or income for this month."
                  actionTitle="Add Transaction"
                  onAction={() => router.push('/add')}
                />
              </Card>
            ) : (
              <View style={styles.transactionsList}>
                {recentExpenses.map((txn) => (
                  <TransactionItem
                    key={txn.id}
                    item={txn}
                    showDate
                    onEdit={(item) =>
                      router.push({
                        pathname: '/add',
                        params: { id: item.id.toString() },
                      })
                    }
                    onDelete={() => handleDeleteWithConfirm(txn)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Set / Add Available Balance Modal */}
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
                <View style={styles.modalTitleRow}>
                  <View
                    style={[
                      styles.modalIconBox,
                      { backgroundColor: theme.primaryLight },
                    ]}>
                    <Ionicons
                      name="wallet-outline"
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Set Available Balance
                  </Text>
                </View>
                <Pressable onPress={() => setIsBalanceModalOpen(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </View>

              <Text
                style={[styles.modalDesc, { color: theme.textSecondary }]}>
                Enter the exact money you currently have. Rupee Tracker will
                update your financial balance accordingly.
              </Text>

              {/* Amount Input */}
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
                  selectTextOnFocus
                />
              </View>

              {/* Quick Preset Increments */}
              <View style={styles.quickChipRow}>
                {[1000, 5000, 10000, 25000].map((rupees) => (
                  <Pressable
                    key={rupees}
                    style={[
                      styles.quickChip,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      const current =
                        parseAmountInputToPaise(balanceInput) / 100;
                      setBalanceInput((current + rupees).toString());
                    }}>
                    <Text
                      style={[
                        styles.quickChipText,
                        { color: theme.textSecondary },
                      ]}>
                      +{CURRENCY_SYMBOL}{rupees.toLocaleString('en-IN')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsBalanceModalOpen(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Update Balance"
                  variant="primary"
                  onPress={handleSaveAvailableBalance}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Floating Add Transaction Action */}
        <AddTransactionButton variant="floating" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six + 40,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceHeroCard: {
    padding: Spacing.four,
    gap: Spacing.two,
    borderRadius: Radius.lg,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  balanceCaption: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currencyPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  currencyPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  setBalanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  setBalanceBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginVertical: Spacing.one,
  },
  balanceFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.half,
  },
  openingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flex: 1,
    marginRight: Spacing.two,
  },
  openingBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  adjustLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.two + 4,
    borderRadius: Radius.lg,
    gap: Spacing.half,
    overflow: 'hidden',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  statIconCircle: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCategoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: Spacing.half,
  },
  statSubtext: {
    fontSize: 11,
    fontWeight: '500',
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsList: {
    gap: Spacing.two,
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
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  modalIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalDesc: {
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
    fontSize: 26,
    fontWeight: '700',
    marginRight: Spacing.two,
  },
  balanceTextInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    padding: 0,
  },
  quickChipRow: {
    flexDirection: 'row',
    gap: Spacing.one + 2,
    flexWrap: 'wrap',
  },
  quickChip: {
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
});
