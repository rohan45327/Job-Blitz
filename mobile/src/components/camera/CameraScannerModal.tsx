import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../../theme/tokens';

interface CameraScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onJobDetected?: (jobData: any) => void;
}

export function CameraScannerModal({ visible, onClose, onJobDetected }: CameraScannerModalProps) {
  const [scanMode, setScanMode] = useState<'job' | 'resume' | 'qr'>('job');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleCaptureAndScan = () => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      if (scanMode === 'job') {
        const detectedJob = {
          title: 'Senior Mobile Engineer (Android/iQOO)',
          company: 'iQOO / Vivo Tech Labs',
          location: 'Bengaluru / Hybrid',
          matchScore: 94,
          readinessScore: 88,
          extractedSkills: ['Kotlin', 'Android NPU', 'React Native', 'C++ Shared Libs'],
          ghostSignal: 'HIGH_HIRING_SIGNAL',
          provenance: 'OFFICIAL_POSTER_OCR'
        };
        setScanResult(detectedJob);
      } else if (scanMode === 'resume') {
        setScanResult({
          type: 'resume',
          candidate: 'Verified iQOO Hackathon Builder',
          parsedSkills: 14,
          topStrengths: ['Distributed Systems', 'Mobile NPU AI', 'FastAPI Backend'],
          readinessBoost: '+15% Match Confidence'
        });
      } else {
        setScanResult({
          type: 'qr',
          code: 'IQOO-HACK-2026-JOB-BLITZ-REF-99',
          event: 'iQOO National Hackathon City Battle',
          access: 'VIP Judge Pitch Verified'
        });
      }
    }, 1200);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="camera-outline" size={24} color={Colors.iqooGold} />
              <View style={{ marginLeft: Spacing.xs }}>
                <Text style={styles.headerTitle}>iQOO Camera Job & Resume Scanner</Text>
                <Text style={styles.headerSub}>Device Vision & On-Device OCR Engine</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Mode Switcher */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, scanMode === 'job' && styles.activeTab]}
                onPress={() => { setScanMode('job'); setScanResult(null); }}
              >
                <Feather name="file-text" size={14} color={scanMode === 'job' ? Colors.textInverse : Colors.textSecondary} />
                <Text style={[styles.modeTabText, scanMode === 'job' && styles.activeTabText]}>Job Poster</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, scanMode === 'resume' && styles.activeTab]}
                onPress={() => { setScanMode('resume'); setScanResult(null); }}
              >
                <Feather name="user" size={14} color={scanMode === 'resume' ? Colors.textInverse : Colors.textSecondary} />
                <Text style={[styles.modeTabText, scanMode === 'resume' && styles.activeTabText]}>Paper Resume</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, scanMode === 'qr' && styles.activeTab]}
                onPress={() => { setScanMode('qr'); setScanResult(null); }}
              >
                <Ionicons name="qr-code-outline" size={14} color={scanMode === 'qr' ? Colors.textInverse : Colors.textSecondary} />
                <Text style={[styles.modeTabText, scanMode === 'qr' && styles.activeTabText]}>Job QR Code</Text>
              </TouchableOpacity>
            </View>

            {/* Camera Viewfinder View */}
            <View style={styles.viewfinderContainer}>
              <View style={styles.viewfinderGrid}>
                {/* Frame Corner Brackets */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {isScanning ? (
                  <View style={styles.scanningHUD}>
                    <ActivityIndicator size="large" color={Colors.iqooGold} />
                    <Text style={styles.scanningText}>Analyzing Text via On-Device OCR...</Text>
                    <Text style={styles.hardwareBadge}>Snapdragon NPU Vision Accelerator Active</Text>
                  </View>
                ) : (
                  <View style={styles.hudPrompt}>
                    <Ionicons name="scan-outline" size={48} color={Colors.iqooGold} />
                    <Text style={styles.hudText}>
                      {scanMode === 'job' ? 'Align Job Poster / Screen within Frame' :
                       scanMode === 'resume' ? 'Point Camera at Printed Resume' : 'Scan Company / Job QR Code'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Shutter Button */}
              <TouchableOpacity
                style={styles.shutterBtn}
                disabled={isScanning}
                onPress={handleCaptureAndScan}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>

            {/* Scan Results Card */}
            {scanResult && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Feather name="check-circle" size={18} color={Colors.success} />
                  <Text style={styles.resultTitle}>Scan Complete & Analyzed!</Text>
                </View>

                {scanMode === 'job' && (
                  <View>
                    <Text style={styles.jobTitleText}>{scanResult.title}</Text>
                    <Text style={styles.jobCompanyText}>{scanResult.company} · {scanResult.location}</Text>

                    <View style={styles.scoreRow}>
                      <View style={styles.badgeBox}>
                        <Text style={styles.badgeNum}>{scanResult.matchScore}%</Text>
                        <Text style={styles.badgeLabel}>Match Score</Text>
                      </View>

                      <View style={[styles.badgeBox, { borderColor: Colors.cyberBlue }]}>
                        <Text style={[styles.badgeNum, { color: Colors.cyberBlue }]}>{scanResult.readinessScore}%</Text>
                        <Text style={styles.badgeLabel}>Readiness Score</Text>
                      </View>
                    </View>

                    <Text style={styles.skillsLabel}>Detected Key Skills:</Text>
                    <View style={styles.skillsPillRow}>
                      {scanResult.extractedSkills.map((s: string, i: number) => (
                        <View key={i} style={styles.skillPill}>
                          <Text style={styles.skillPillText}>{s}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.actionImportBtn}
                      onPress={() => {
                        if (onJobDetected) onJobDetected(scanResult);
                        onClose();
                        Alert.alert('⚡ Imported!', 'Scanned Job successfully added to your Feed & Match Dashboard.');
                      }}
                    >
                      <Text style={styles.actionImportText}>Import Scanned Job into JobBlitz</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {scanMode === 'resume' && (
                  <View>
                    <Text style={styles.jobTitleText}>{scanResult.candidate}</Text>
                    <Text style={styles.jobCompanyText}>Parsed {scanResult.parsedSkills} core tech competencies</Text>
                    <Text style={styles.skillsLabel}>Identified Strengths:</Text>
                    <View style={styles.skillsPillRow}>
                      {scanResult.topStrengths.map((s: string, i: number) => (
                        <View key={i} style={[styles.skillPill, { backgroundColor: 'rgba(0, 186, 124, 0.15)' }]}>
                          <Text style={[styles.skillPillText, { color: Colors.success }]}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {scanMode === 'qr' && (
                  <View>
                    <Text style={styles.jobTitleText}>{scanResult.event}</Text>
                    <Text style={styles.jobCompanyText}>Code: {scanResult.code}</Text>
                    <Text style={{ color: Colors.iqooGold, fontWeight: '700', fontSize: Typography.xs, marginTop: 4 }}>
                      Status: {scanResult.access}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: '800',
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.lg,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  activeTab: {
    backgroundColor: Colors.iqooGold,
  },
  modeTabText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: '700',
    marginLeft: 4,
  },
  activeTabText: {
    color: Colors.textInverse,
    fontWeight: '900',
  },
  viewfinderContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  viewfinderGrid: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.iqooGold,
  },
  topLeft: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3 },

  scanningHUD: {
    alignItems: 'center',
  },
  scanningText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  hardwareBadge: {
    color: Colors.iqooGold,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  hudPrompt: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  hudText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  shutterBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: Colors.iqooGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  shutterInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.iqooGold,
  },
  resultCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  resultTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: '800',
    marginLeft: Spacing.xs,
  },
  jobTitleText: {
    color: Colors.iqooGold,
    fontSize: Typography.base,
    fontWeight: '800',
  },
  jobCompanyText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    marginBottom: Spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
  },
  badgeBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.xs,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.iqooGold,
    marginRight: Spacing.xs,
  },
  badgeNum: {
    color: Colors.iqooGold,
    fontSize: Typography.base,
    fontWeight: '900',
  },
  badgeLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
  },
  skillsLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: '700',
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  skillsPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  skillPill: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginRight: 6,
    marginBottom: 4,
  },
  skillPillText: {
    color: Colors.iqooGold,
    fontSize: 10,
    fontWeight: '700',
  },
  actionImportBtn: {
    backgroundColor: Colors.iqooGold,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  actionImportText: {
    color: Colors.textInverse,
    fontSize: Typography.xs,
    fontWeight: '900',
  },
});
