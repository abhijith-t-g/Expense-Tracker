import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import { useTheme } from '@/hooks/use-theme';
import type { Category, TransactionType } from '@/types/database';

const PALETTE_COLORS = [
  '#FF6B6B',
  '#4D96FF',
  '#6BCB77',
  '#FFD93D',
  '#9D4EDD',
  '#FF5964',
  '#F72585',
  '#3A86FF',
  '#2EC4B6',
  '#38B000',
  '#0077B6',
  '#FF9F1C',
  '#2A9D8F',
  '#E76F51',
];

const AVAILABLE_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'cart',
  'restaurant',
  'car',
  'receipt',
  'bag-handle',
  'medkit',
  'film',
  'home',
  'book',
  'cash',
  'briefcase',
  'trending-up',
  'gift',
  'wallet',
  'airplane',
  'fitness',
  'game-controller',
  'paw',
];

export default function CategoriesScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const { categories, isLoading, refresh, addCategory, deleteCategory } =
    useCategories(activeTab);

  // New Category Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('pricetag');
  const [selectedColor, setSelectedColor] = useState(PALETTE_COLORS[0]);

  const handleCreateCategory = async () => {
    if (!newName.trim()) {
      Alert.alert('Required', 'Please enter a category name');
      return;
    }

    try {
      await addCategory({
        name: newName.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type: activeTab,
        isDefault: false,
      });
      setNewName('');
      setIsModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleDeletePrompt = (cat: Category) => {
    if (cat.isDefault) {
      Alert.alert('Protected', 'Default system categories cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Delete "${cat.name}"? Transactions using it will be kept as uncategorized.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCategory(cat.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Categories</Text>
          <Pressable
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={() => setIsModalVisible(true)}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addBtnText}>New</Text>
          </Pressable>
        </View>

        {/* Tab Toggle: Expense vs Income */}
        <View
          style={[
            styles.toggleContainer,
            { backgroundColor: theme.backgroundElement },
          ]}>
          <Pressable
            style={[
              styles.toggleTab,
              activeTab === 'expense' && {
                backgroundColor: theme.card,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab('expense')}>
            <Text
              style={[
                styles.toggleText,
                {
                  color:
                    activeTab === 'expense'
                      ? theme.expense
                      : theme.textSecondary,
                  fontWeight: activeTab === 'expense' ? '700' : '500',
                },
              ]}>
              Expense Categories
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.toggleTab,
              activeTab === 'income' && {
                backgroundColor: theme.card,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab('income')}>
            <Text
              style={[
                styles.toggleText,
                {
                  color:
                    activeTab === 'income'
                      ? theme.income
                      : theme.textSecondary,
                  fontWeight: activeTab === 'income' ? '700' : '500',
                },
              ]}>
              Income Categories
            </Text>
          </Pressable>
        </View>

        {/* Category List */}
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={theme.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
          renderItem={({ item }) => {
            const iconName = (item.icon in Ionicons.glyphMap
              ? item.icon
              : 'pricetag') as keyof typeof Ionicons.glyphMap;

            return (
              <Card variant="outlined" style={styles.categoryCard}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: `${item.color}20` },
                  ]}>
                  <Ionicons name={iconName} size={22} color={item.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.categoryTag, { color: theme.textMuted }]}>
                    {item.isDefault ? 'Default' : 'Custom'}
                  </Text>
                </View>
                {!item.isDefault && (
                  <Pressable
                    hitSlop={10}
                    onPress={() => handleDeletePrompt(item)}>
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={theme.danger}
                    />
                  </Pressable>
                )}
              </Card>
            );
          }}
        />

        {/* Add Category Modal */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Add {activeTab === 'expense' ? 'Expense' : 'Income'} Category
                </Text>
                <Pressable onPress={() => setIsModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Name
              </Text>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: theme.backgroundElement,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="e.g. Subscriptions, Gym, Coffee"
                placeholderTextColor={theme.textMuted}
                value={newName}
                onChangeText={setNewName}
              />

              {/* Color Selection */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Choose Color
              </Text>
              <View style={styles.paletteRow}>
                {PALETTE_COLORS.slice(0, 7).map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.paletteDot,
                      { backgroundColor: color },
                      selectedColor === color && styles.paletteDotSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>

              {/* Icon Selection */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Choose Icon
              </Text>
              <View style={styles.iconSelectionRow}>
                {AVAILABLE_ICONS.slice(0, 8).map((icon) => (
                  <Pressable
                    key={icon}
                    style={[
                      styles.iconSelectBtn,
                      {
                        backgroundColor:
                          selectedIcon === icon
                            ? theme.backgroundSelected
                            : theme.backgroundElement,
                        borderColor:
                          selectedIcon === icon
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedIcon(icon)}>
                    <Ionicons
                      name={icon}
                      size={20}
                      color={
                        selectedIcon === icon ? theme.primary : theme.text
                      }
                    />
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save Category"
                  variant="primary"
                  onPress={handleCreateCategory}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
    gap: Spacing.half,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: Spacing.half,
  },
  toggleTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
  },
  toggleText: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: Spacing.six,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryTag: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
    borderTopWidth: 1,
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nameInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 15,
    borderWidth: 1,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  paletteDot: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
  },
  paletteDotSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  iconSelectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  iconSelectBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
});

