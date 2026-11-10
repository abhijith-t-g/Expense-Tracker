import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme as useSystemColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CURRENT_SCHEMA_VERSION } from '@/db/migrations';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BackupService } from '@/services/backup';
import { CURRENCY_CODE, CURRENCY_SYMBOL } from '@/services/currency';

export default function SettingsScreen() {
  const theme = useTheme();
  const systemColorScheme = useSystemColorScheme();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await BackupService.exportBackup();
      if (res.success) {
        Alert.alert('Backup Ready', 'Your JSON backup is ready to save or share.');
      } else if (res.message) {
        Alert.alert('Export Result', res.message);
      }
    } catch (err) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (mode: 'merge' | 'replace') => {
    Alert.alert(
      mode === 'replace' ? 'Replace All Data?' : 'Merge Backup Data?',
      mode === 'replace'
        ? 'This will erase current transactions and replace them with the backup file data.'
        : 'This will import all transactions and categories from the backup file into your current database.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: mode === 'replace' ? 'Yes, Replace' : 'Yes, Merge',
          style: mode === 'replace' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setIsImporting(true);
              const result = await BackupService.importBackup(mode);
              if (result.success) {
                Alert.alert('Import Completed', result.message);
              } else if (result.message) {
                Alert.alert('Import Notice', result.message);
              }
            } catch (err) {
              Alert.alert('Import Failed', err instanceof Error ? err.message : 'Unknown error');
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Preferences & Data Management
          </Text>
        </View>

        {/* Currency & Locale Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            Currency & Locale
          </Text>
          <Card variant="outlined" style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.primaryLight },
                  ]}>
                  <Text style={[styles.currencyIcon, { color: theme.primary }]}>
                    {CURRENCY_SYMBOL}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>
                    Default Currency
                  </Text>
                  <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                    Fixed to Indian Rupee ({CURRENCY_CODE})
                  </Text>
                </View>
              </View>
              <Text style={[styles.badge, { color: theme.primary }]}>
                ₹ INR
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.backgroundElement },
                  ]}>
                  <Ionicons
                    name="calculator-outline"
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
                <View>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>
                    Storage Precision
                  </Text>
                  <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                    Monetary values stored in integer paise
                  </Text>
                </View>
              </View>
              <Text style={[styles.badge, { color: theme.textSecondary }]}>
                100 Paise = ₹1
              </Text>
            </View>
          </Card>
        </View>

        {/* Theme Section */}
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
                    System Theme
                  </Text>
                  <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                    Currently active: {systemColorScheme === 'dark' ? 'Dark' : 'Light'} Mode
                  </Text>
                </View>
              </View>
              <Text style={[styles.badge, { color: theme.primary }]}>
                Automatic
              </Text>
            </View>
          </Card>
        </View>

        {/* Data & Backup Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            Manual Backup & Restore
          </Text>
          <Card variant="outlined" style={styles.card}>
            <View style={styles.backupHeader}>
              <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  Offline JSON Backup
                </Text>
                <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                  Export or import your expenses without any cloud or internet dependency.
                </Text>
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <Button
                title="Export JSON Backup"
                variant="primary"
                loading={isExporting}
                icon={<Ionicons name="share-outline" size={18} color="#FFFFFF" />}
                onPress={handleExport}
              />

              <View style={styles.importRow}>
                <Button
                  title="Merge Import"
                  variant="outline"
                  loading={isImporting}
                  icon={<Ionicons name="download-outline" size={18} color={theme.primary} />}
                  onPress={() => handleImport('merge')}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Replace All"
                  variant="danger"
                  loading={isImporting}
                  icon={<Ionicons name="refresh-outline" size={18} color="#FFFFFF" />}
                  onPress={() => handleImport('replace')}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </Card>
        </View>

        {/* Database & App Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            Architecture & Database
          </Text>
          <Card variant="outlined" style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Database Engine
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                SQLite (expo-sqlite)
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.row}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Database ORM
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                Drizzle ORM
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.row}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Schema Version
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                v{CURRENT_SCHEMA_VERSION} (Migration Ready)
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.row}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Offline First
              </Text>
              <Text style={[styles.infoValue, { color: theme.primary }]}>
                Yes (Zero Backend)
              </Text>
            </View>
          </Card>
        </View>
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
    fontSize: 14,
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
    paddingVertical: Spacing.one,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
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
    marginTop: 2,
  },
  badge: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two,
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
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
