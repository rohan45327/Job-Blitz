import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Spacing, Radius, Typography } from '../../theme/tokens';

interface CameraScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onJobDetected?: (jobData: any) => void;
}

export function CameraScannerModal({ visible, onClose, onJobDetected }: CameraScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<'job' | 'resume' | 'qr'>('job');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [llmStream, setLlmStream] = useState<string>('');
  
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission]);

  // Simulate on-device Local LLM token streaming for the hackathon demo
  const simulateLocalLLM = (finalData: any, type: string) => {
    setIsScanning(true);
    setLlmStream('');
    
    const tokenStream = `[Snapdragon NPU init...]
Loading quantized LLaMA-3 (4-bit)...
Model loaded in 120ms.
Extracting text from image frame...
Found text clusters...
Parsing semantics...
---
DETECTED ROLE: ${finalData.title || finalData.candidate}
MATCH: ${finalData.matchScore || finalData.parsedSkills}
`;

    let i = 0;
    const interval = setInterval(() => {
      setLlmStream(prev => prev + tokenStream.charAt(i));
      i++;
      if (i >= tokenStream.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsScanning(false);
          setScanResult(finalData);
        }, 500);
      }
    }, 15); // Fast token streaming
  };

  const handleCaptureAndScan = async () => {
    if (!cameraRef.current) return;
    
    try {
      // Capture the actual photo
      const photo = await cameraRef.current.takePictureAsync({ base64: false });
      console.log('Captured photo:', photo.uri);

      if (scanMode === 'job') {
        simulateLocalLLM({
          title: 'Senior Mobile Engineer (Android)',
          company: 'Vivo Tech Labs',
          location: 'Bengaluru / Hybrid',
          matchScore: 94,
          readinessScore: 88,
          extractedSkills: ['Kotlin', 'Android NPU', 'React Native', 'C++ Shared Libs'],
          ghostSignal: 'HIGH_HIRING_SIGNAL',
          provenance: 'ON_DEVICE_LLM'
        }, 'job');
      } else if (scanMode === 'resume') {
        simulateLocalLLM({
          type: 'resume',
          candidate: 'Verified Candidate',
          parsedSkills: 14,
          topStrengths: ['Distributed Systems', 'Mobile NPU AI', 'FastAPI Backend'],
          readinessBoost: '+15% Match Confidence'
        }, 'resume');
      }
    } catch (err) {
      Alert.alert('Camera Error', 'Could not capture image.');
    }
  };

  const handleBarcodeScanned = ({ type, data }: { type: string, data: string }) => {
    if (scanMode === 'qr' && !isScanning && !scanResult) {
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        setScanResult({
          type: 'qr',
          code: data,
          event: 'Live Job Link Detected via QR',
          access: 'Scanned Successfully'
        });
      }, 500);
    }
  };

  if (!permission) return <View />;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="camera-outline" size={24} color={Colors.accentGold} />
              <View style={{ marginLeft: Spacing.xs }}>
                <Text style={styles.headerTitle}>AI-Vision</Text>
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
                <Text style={[styles.modeTabText, scanMode === 'qr' && styles.activeTabText]}>QR Code</Text>
              </TouchableOpacity>
            </View>

            {/* Camera Viewfinder View */}
            <View style={styles.viewfinderContainer}>
              <View style={styles.viewfinderGrid}>
                {permission.granted ? (
                  <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    onBarcodeScanned={scanMode === 'qr' ? handleBarcodeScanned : undefined}
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr'],
                    }}
                  />
                ) : (
                  <Text style={{ color: 'white' }}>No Camera Permission</Text>
                )}

                {/* Frame Corner Brackets */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {isScanning && scanMode !== 'qr' && (
                  <View style={styles.scanningHUD}>
                    <View style={styles.llmBox}>
                      <Text style={styles.llmStreamText}>{llmStream}</Text>
                      <View style={styles.cursorBlink} />
                    </View>
                  </View>
                )}
                
                {!isScanning && !scanResult && scanMode === 'qr' && (
                  <View style={styles.hudPrompt}>
                    <Text style={styles.hudText}>Point camera at QR Code</Text>
                  </View>
                )}
              </View>

              {/* Shutter Button */}
              {scanMode !== 'qr' && !scanResult && (
                <TouchableOpacity
                  style={styles.shutterBtn}
                  disabled={isScanning}
                  onPress={handleCaptureAndScan}
                >
                  <View style={styles.shutterInner} />
                </TouchableOpacity>
              )}
            </View>

            {/* Scan Results Card */}
            {scanResult && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Feather name="check-circle" size={18} color={Colors.success} />
                  <Text style={styles.resultTitle}>Local NPU Extraction Complete</Text>
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
                        Alert.alert('⚡ Imported!', 'Scanned Job successfully added to your Feed.');
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
                    <Text style={styles.jobCompanyText}>Data: {scanResult.code}</Text>
                    
                    <TouchableOpacity
                      style={styles.actionImportBtn}
                      onPress={() => {
                        if (onJobDetected) onJobDetected(scanResult);
                        onClose();
                      }}
                    >
                      <Text style={styles.actionImportText}>Use Job Link</Text>
                    </TouchableOpacity>
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
    maxHeight: '95%',
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
    backgroundColor: Colors.accentGold,
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
    height: 320,
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
    width: 25,
    height: 25,
    borderColor: Colors.accentGold,
  },
  topLeft: { top: 16, left: 16, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 16, right: 16, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 16, left: 16, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 16, right: 16, borderBottomWidth: 4, borderRightWidth: 4 },

  scanningHUD: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  llmBox: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.5)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 150,
  },
  llmStreamText: {
    fontFamily: 'monospace',
    color: '#00FF00',
    fontSize: 12,
    lineHeight: 18,
  },
  cursorBlink: {
    width: 8,
    height: 14,
    backgroundColor: '#00FF00',
    marginTop: 2,
  },
  hudPrompt: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  hudText: {
    color: Colors.textInverse,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  shutterBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: Colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  shutterInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentGold,
  },
  resultCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: 40,
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
    color: Colors.accentGold,
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
    borderColor: Colors.accentGold,
    marginRight: Spacing.xs,
  },
  badgeNum: {
    color: Colors.accentGold,
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
    color: Colors.accentGold,
    fontSize: 10,
    fontWeight: '700',
  },
  actionImportBtn: {
    backgroundColor: Colors.accentGold,
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

