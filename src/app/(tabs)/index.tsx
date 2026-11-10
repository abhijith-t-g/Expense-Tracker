import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/common/empty-state';
import { ExpenseCard } from '@/components/expense/expense-card';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';
import { CURRENCY_SYMBOL, formatINR } from '@/services/currency';

export default function OverviewScreen() {
  const theme = useTheme();
  const { expenses, summary, breakdown, isLoading, refresh, deleteTransaction } =
    useExpenses({ limit: 10 });

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={theme.primary}
          />
        }>
        {/* App Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.appName, { color: theme.primary }]}>
              Rupee Tracker
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Personal Expense Manager
            </Text>
          </View>
          <Pressable
            style={[
              styles.addHeaderBtn,
              { backgroundColor: theme.primary, borderColor: theme.primaryDark },
            ]}
            onPress={() => router.push('/add')}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text style={styles.addHeaderBtnText}>Add</Text>
          </Pressable>
        </View>

        {/* Balance & Stat Cards */}
        <Card variant="elevated" style={styles.netBalanceCard}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
            Total Net Balance
          </Text>
          <Text
            style={[
              styles.balanceValue,
              {
                color:
                  summary.netPaise >= 0 ? theme.primary : theme.expense,
              },
            ]}>
            {formatINR(summary.netPaise)}
          </Text>
          <View
            style={[
              styles.currencyTag,
              { backgroundColor: theme.primaryLight },
            ]}>
            <Text style={[styles.currencyTagText, { color: theme.primary }]}>
              {CURRENCY_SYMBOL} INR • Offline Ready
            </Text>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <StatCard
            title="Expenses"
            amountPaise={summary.totalExpensePaise}
            type="expense"
            icon="arrow-down-circle"
          />
          <StatCard
            title="Income"
            amountPaise={summary.totalIncomePaise}
            type="income"
            icon="arrow-up-circle"
          />
        </View>

        {/* Category Breakdown (Top Expenses) */}
        {breakdown.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Top Spending
              </Text>
            </View>

            <Card variant="outlined" style={styles.breakdownCard}>
              {breakdown.slice(0, 4).map((item) => (
                <View key={item.categoryId ?? 'uncat'} style={styles.breakdownItem}>
                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownCategoryInfo}>
                      <View
                        style={[
                          styles.breakdownDot,
                          { backgroundColor: item.categoryColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.breakdownCategoryName,
                          { color: theme.text },
                        ]}
                        numberOfLines={1}>
                        {item.categoryName}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.breakdownAmount,
                        { color: theme.text },
                      ]}>
                      {formatINR(item.totalPaise)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.progressBarTrack,
                      { backgroundColor: theme.backgroundElement },
                    ]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: item.categoryColor,
                          width: `${Math.min(100, Math.max(4, item.percentage))}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Recent Transactions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Transactions
            </Text>
            {expenses.length > 0 && (
              <Pressable onPress={() => router.push('/expenses')}>
                <Text style={[styles.viewAllText, { color: theme.primary }]}>
                  View All
                </Text>
              </Pressable>
            )}
          </View>

          {expenses.length === 0 ? (
            <Card variant="outlined">
              <EmptyState
                title="No transactions yet"
                description="Start tracking your expenses in INR. Everything stays securely offline on your device."
                actionTitle="Add First Expense"
                onAction={() => router.push('/add')}
              />
            </Card>
          ) : (
            <View style={styles.transactionsList}>
              {expenses.slice(0, 6).map((item) => (
                <ExpenseCard
                  key={item.id}
                  item={item}
                  onDelete={deleteTransaction}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
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
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  addHeaderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  netBalanceCard: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  currencyTag: {
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  currencyTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownCard: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  breakdownItem: {
    gap: Spacing.one,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  breakdownCategoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  transactionsList: {
    gap: Spacing.two,
  },
});
