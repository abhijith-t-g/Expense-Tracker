import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { BackupRepository } from '@/repositories/backup-repository';
import type { BackupData, ImportMode, ImportResult } from '@/types/backup';

export const BackupService = {
  /**
   * Generates a JSON backup file and opens the native Share dialog.
   */
  async exportBackup(): Promise<{ success: boolean; filePath?: string; message?: string }> {
    try {
      const data = await BackupRepository.exportAllData();
      const jsonString = JSON.stringify(data, null, 2);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `rupee-tracker-backup-${timestamp}.json`;
      const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

      if (!directory) {
        throw new Error('Unable to access device file system directory.');
      }

      const fileUri = `${directory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Rupee Tracker Backup',
          UTI: 'public.json',
        });
      }

      return {
        success: true,
        filePath: fileUri,
        message: 'Backup exported successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown export error.',
      };
    }
  },

  /**
   * Prompts user to select a JSON backup file and imports it into SQLite.
   */
  async importBackup(mode: ImportMode = 'merge'): Promise<ImportResult> {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return {
          success: false,
          importedCategories: 0,
          importedTransactions: 0,
          message: 'Import canceled by user.',
        };
      }

      const fileAsset = pickerResult.assets[0];
      const fileContent = await FileSystem.readAsStringAsync(fileAsset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      let parsedData: unknown;
      try {
        parsedData = JSON.parse(fileContent);
      } catch {
        throw new Error('Selected file is not valid JSON.');
      }

      const backupData = parsedData as BackupData;
      if (!backupData || !Array.isArray(backupData.transactions) || !Array.isArray(backupData.categories)) {
        throw new Error(
          'Invalid backup file format: Missing categories or transactions list.'
        );
      }

      return await BackupRepository.importAllData(backupData, mode);
    } catch (error) {
      return {
        success: false,
        importedCategories: 0,
        importedTransactions: 0,
        message: error instanceof Error ? error.message : 'Failed to import backup.',
      };
    }
  },
};

