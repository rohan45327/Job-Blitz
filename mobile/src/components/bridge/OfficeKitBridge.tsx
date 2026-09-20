import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Modal, ScrollView
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../../theme/tokens';

interface OfficeKitBridgeProps {
  onPasteJobUrl?: (url: string) => void;
  onOpenPitchMode?: () => void;
}

export function OfficeKitBridge({ onPasteJobUrl, onOpenPitchMode }: OfficeKitBridgeProps) {
  const [isPaired, setIsPaired] = useState<boolean>(true);
  const [syncedClipboard, setSyncedClipboard] = useState<string | null>(null);
  const [showBridgeDetails, setShowBridgeDetails] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Simulate laptop-to-phone clipboard sync
  const handleFetchLaptopClipboard = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const mockLaptopJobUrl = 'https://careers.google.com/jobs/results/148920-senior-software-engineer-cloud';
      setSyncedClipboard(mockLaptopJobUrl);
      Alert.alert(
        '⚡ Office Kit Clipboard Synced!',
        `Received Job Link from Laptop:\n\n${mockLaptopJobUrl}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Analyze Job Now',
            onPress: () => {
              if (onPasteJobUrl) onPasteJobUrl(mockLaptopJobUrl);
              setShowBridgeDetails(false);
            },
          },
        ]
      );
    }, 800);
  };

  const handleSendTailoredResumeToLaptop = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      Alert.alert(
        '🚀 Resume Sent to Laptop!',
        'Tailored Resume & STAR Interview Cheat Sheet successfully pushed via Office Kit File Bridge to connected laptop.'
      );
    }, 900);
  };

  return (
    <View style={styles.container}>
      {/* Top Banner Bar */}
      <TouchableOpacity
        style={styles.bridgeBar}
        activeOpacity={0.8}
        onPress={() => setShowBridgeDetails(true)}
      >
        <View style={styles.leftSection}>
          <View style={styles.statusDotActive} />
          <Ionicons name="laptop-outline" size={16} color={Colors.iqooGold} style={styles.icon} />
          <Ionicons name="swap-horizontal" size={14} color={Colors.textSecondary} style={styles.icon} />
          <Ionicons name="phone-portrait-outline" size={16} color={Colors.iqooGold} style={styles.icon} />
          <Text style={styles.bridgeText}>Office Kit Bridge</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.quickSyncBtn} onPress={handleFetchLaptopClipboard}>
            <Feather name="clipboard" size={13} color={Colors.textInverse} />
            <Text style={styles.quickSyncText}>Sync Laptop</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Office Kit Details & Controls Modal */}
      <Modal
        visible={showBridgeDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBridgeDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="hardware-chip-outline" size={22} color={Colors.iqooGold} />
                <Text style={styles.modalTitle}>iQOO Office Kit Bridge</Text>
              </View>
              <TouchableOpacity onPress={() => setShowBridgeDetails(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* Pairing Status Card */}
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <View style={styles.deviceRow}>
                    <Ionicons name="laptop" size={24} color={Colors.textPrimary} />
                    <Feather name="wifi" size={18} color={Colors.success} style={{ marginHorizontal: Spacing.sm }} />
                    <Ionicons name="phone-portrait" size={24} color={Colors.iqooGold} />
                  </View>
                  <View style={styles.pairingTag}>
                    <Text style={styles.pairingTagText}>PITCH READY</Text>
                  </View>
                </View>

                <Text style={styles.statusDesc}>
                  Connected to <Text style={{ color: Colors.iqooGold, fontWeight: '700' }}>iQOO Loaner Device #402</Text> via Snapdragon Low-Latency Office Kit Mesh.
                </Text>
              </View>

              {/* Action Buttons Grid */}
              <Text style={styles.sectionTitle}>Bridge Workflows</Text>

              <TouchableOpacity style={styles.actionCard} onPress={handleFetchLaptopClipboard}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(255, 184, 0, 0.15)' }]}>
                  <Feather name="copy" size={20} color={Colors.iqooGold} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Laptop ➔ Phone Clipboard</Text>
                  <Text style={styles.actionSub}>Auto-import copied job posting URLs directly into JobBlitz match engine.</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={handleSendTailoredResumeToLaptop}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(0, 229, 255, 0.15)' }]}>
                  <MaterialCommunityIcons name="file-send-outline" size={20} color={Colors.cyberBlue} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Phone ➔ Laptop File Transfer</Text>
                  <Text style={styles.actionSub}>Push tailored PDF resume & STAR defense prep sheet straight to desktop.</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  setShowBridgeDetails(false);
                  if (onOpenPitchMode) onOpenPitchMode();
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(0, 186, 124, 0.15)' }]}>
                  <Feather name="tv" size={20} color={Colors.success} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Screen Mirror & Jury Pitch Mode</Text>
                  <Text style={styles.actionSub}>Launch 3-Minute Hackathon Demo Dashboard on paired laptop monitor.</Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              {/* Telemetry Indicator */}
              <View style={styles.telemetryBox}>
                <Feather name="shield" size={14} color={Colors.iqooGold} />
                <Text style={styles.telemetryText}>
                  HackTracker Active: Capturing dual-device bridge interactions & Snapdragon NPU speed.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  bridgeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: Spacing.xs,
  },
  icon: {
    marginRight: 4,
  },
  bridgeText: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: '700',
    marginLeft: 4,
    marginRight: 6,
  },
  badge: {
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    color: Colors.iqooGold,
    fontSize: 9,
    fontWeight: '800',
  },
  rightSection: {},
  quickSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.iqooGold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
  },
  quickSyncText: {
    color: Colors.textInverse,
    fontSize: Typography.xs,
    fontWeight: '800',
    marginLeft: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: '800',
    marginLeft: Spacing.xs,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  statusCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pairingTag: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  pairingTagText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: '900',
  },
  statusDesc: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    lineHeight: 18,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: '800',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  actionSub: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  telemetryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginTop: Spacing.sm,
  },
  telemetryText: {
    color: Colors.iqooGold,
    fontSize: Typography.xs,
    marginLeft: Spacing.xs,
    flex: 1,
    fontWeight: '600',
  },
});
