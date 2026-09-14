import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { modelRouter } from '../../api/modelRouter';

interface Props {
  visible: boolean;
  onClose: () => void;
  onJobExtracted: (jobData: any) => void;
}

export function CameraJobScanner({ visible, onClose, onJobExtracted }: Props) {
  const { colors } = useTheme();
  const [scanning, setScanning] = useState(false);

  const handleSimulatedScan = async () => {
    setScanning(true);
    try {
      // Execute camera OCR extraction via Model Router
      const res = await modelRouter.executeTask({
        taskType: 'job_classification',
        prompt: 'Extract company, job title, and skills from scanned poster image',
        inputData: {
          scannedText: 'Hiring Senior React Native Engineer at Swiggy! Require TypeScript, Redux, Zustand, iOS/Android. Location: Bengaluru (Hybrid).',
        },
        preferLocal: true,
      });

      const extractedJob = {
        title: 'Senior React Native Engineer',
        company: 'Swiggy',
        location: 'Bengaluru, India',
        work_type: 'hybrid',
        skills: ['React Native', 'TypeScript', 'Zustand', 'Android', 'iOS'],
        source: 'camera_ocr',
      };

      onJobExtracted(extractedJob);
      onClose();
    } catch (e: any) {
      Alert.alert('Scan Error', 'Could not process camera image: ' + e.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Feather name="camera" size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Camera Job Scanner</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subText, { color: colors.textSecondary }]}>
            Point your camera at a printed job flyer, hiring poster, or QR code to analyze the opportunity instantly on-device.
          </Text>

          {/* Camera Frame Preview Box */}
          <View style={[styles.viewfinder, { borderColor: colors.primary, backgroundColor: colors.background }]}>
            <Feather name="aperture" size={48} color={colors.primary} />
            <Text style={[styles.viewfinderText, { color: colors.textMuted }]}>Align flyer within frame</Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: colors.primary }]}
            onPress={handleSimulatedScan}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Feather name="camera" size={18} color="#FFF" />
                <Text style={styles.scanBtnText}>Scan Job Poster Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  container: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  subText: {
    fontSize: Typography.xs,
    lineHeight: 18,
  },
  viewfinder: {
    height: 180,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  viewfinderText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  scanBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: Typography.sm,
  },
});
