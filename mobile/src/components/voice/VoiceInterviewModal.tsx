import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Alert
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors, Spacing, Radius, Typography } from '../../theme/tokens';

interface VoiceInterviewModalProps {
  visible: boolean;
  onClose: () => void;
  questionText?: string;
  questionCategory?: string;
}

export function VoiceInterviewModal({
  visible,
  onClose,
  questionText = "Tell me about a time you had to debug a high-latency issue under pressure.",
  questionCategory = "STAR Behavioral & System Resilience"
}: VoiceInterviewModalProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Real Expo AV Recording Object
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // Animated wave visualizer values
  const waveAnim1 = useRef(new Animated.Value(10)).current;
  const waveAnim2 = useRef(new Animated.Value(20)).current;
  const waveAnim3 = useRef(new Animated.Value(15)).current;
  const waveAnim4 = useRef(new Animated.Value(25)).current;

  // Recording Timer & Animations
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Animate wave bars
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(waveAnim1, { toValue: 40, duration: 300, useNativeDriver: false }),
            Animated.timing(waveAnim1, { toValue: 10, duration: 300, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(waveAnim2, { toValue: 60, duration: 400, useNativeDriver: false }),
            Animated.timing(waveAnim2, { toValue: 15, duration: 400, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(waveAnim3, { toValue: 50, duration: 250, useNativeDriver: false }),
            Animated.timing(waveAnim3, { toValue: 12, duration: 250, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(waveAnim4, { toValue: 45, duration: 350, useNativeDriver: false }),
            Animated.timing(waveAnim4, { toValue: 18, duration: 350, useNativeDriver: false }),
          ]),
        ])
      ).start();
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      setAnalysisResult(null);
      setTranscribedText('');
      
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone permissions are required to record audio.');
        return;
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsAnalyzing(true);
    
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      
      const uri = recording.getURI();
      setRecording(null);
      
      if (!uri) {
        throw new Error("Recording failed to produce a valid file.");
      }
      
      // Upload to Backend
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://rohan45327-jobblitz.hf.space/api/api/v1';
      
      const formData = new FormData();
      // @ts-ignore
      formData.append('audio', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });

      const response = await fetch(`${apiUrl}/voice/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || 'Analysis failed. Please ensure the backend is running.');
      }

      setTranscribedText(result.transcription);
      
      setAnalysisResult({
        overallScore: result.star_score,
        starBreakdown: {
          situation: result.feedback,
          task: `Duration: ${result.duration_sec}s`,
          action: 'Speech Recognition executed',
          result: 'Audio analyzed by JobBlitz backend'
        },
        speechMetrics: {
          wpm: Math.round((result.transcription.split(' ').length / (result.duration_sec || 1)) * 60),
          confidence: (result.confidence * 100).toFixed(0) + '%',
          fillerWords: 0,
        },
        npuspeed: 'Cloud NLP API (Zero API Keys)'
      });

    } catch (err: any) {
      console.error(err);
      Alert.alert('Analysis Error', err.message);
      setTranscribedText('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="mic-circle" size={26} color={Colors.accentGold} />
              <View style={{ marginLeft: Spacing.xs }}>
                <Text style={styles.headerTitle}>Voice Interview Coach</Text>
                <Text style={styles.headerSub}>Live Microphone & API Speech Scoring</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Question Card */}
            <View style={styles.questionCard}>
              <View style={styles.tagRow}>
                <Text style={styles.tagText}>{questionCategory}</Text>
                <View style={styles.npuTag}>
                  <Text style={styles.npuTagText}>LIVE AUDIO</Text>
                </View>
              </View>
              <Text style={styles.questionText}>"{questionText}"</Text>
            </View>

            {/* Recorder View */}
            <View style={styles.recorderBox}>
              {!isRecording && !isAnalyzing && !analysisResult && (
                <View style={styles.idleBox}>
                  <TouchableOpacity style={styles.micBtn} onPress={handleStartRecording}>
                    <Ionicons name="mic" size={32} color={Colors.textInverse} />
                  </TouchableOpacity>
                  <Text style={styles.micPrompt}>Tap Mic & Speak Your STAR Answer</Text>
                  <Text style={styles.micHint}>Voice is recorded via device mic and sent to the API.</Text>
                </View>
              )}

              {isRecording && (
                <View style={styles.recordingState}>
                  <View style={styles.timerRow}>
                    <View style={styles.recDot} />
                    <Text style={styles.timerText}>
                      00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                    </Text>
                  </View>

                  {/* Waveforms */}
                  <View style={styles.waveRow}>
                    {[waveAnim1, waveAnim2, waveAnim3, waveAnim4, waveAnim2, waveAnim1, waveAnim4, waveAnim3].map((anim, idx) => (
                      <Animated.View key={idx} style={[styles.waveBar, { height: anim }]} />
                    ))}
                  </View>

                  <Text style={styles.listeningText}>Recording live audio...</Text>

                  <TouchableOpacity style={styles.stopBtn} onPress={handleStopRecording}>
                    <Ionicons name="square" size={20} color={Colors.textInverse} />
                    <Text style={styles.stopBtnText}>Finish Answer</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isAnalyzing && (
                <View style={styles.analyzingBox}>
                  <ActivityIndicator size="large" color={Colors.accentGold} />
                  <Text style={styles.analyzingText}>Transcribing & Evaluating Voice Audio...</Text>
                  <Text style={styles.npuNote}>Processing via JobBlitz Cloud</Text>
                </View>
              )}
            </View>

            {/* Transcribed Speech & Analysis Results */}
            {transcribedText ? (
              <View style={styles.transcriptCard}>
                <Text style={styles.sectionHeading}>Live Speech Transcript</Text>
                <Text style={styles.transcriptBody}>"{transcribedText}"</Text>
              </View>
            ) : null}

            {analysisResult && (
              <View style={styles.resultContainer}>
                {/* Score Header */}
                <View style={styles.scoreHeader}>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreNum}>{analysisResult.overallScore}</Text>
                    <Text style={styles.scoreDenom}>/100</Text>
                  </View>
                  <View style={styles.scoreDetails}>
                    <Text style={styles.scoreTitle}>Answer Analyzed!</Text>
                    <Text style={styles.scoreSub}>
                      Pacing: {analysisResult.speechMetrics.wpm} WPM · Confidence: {analysisResult.speechMetrics.confidence}
                    </Text>
                    <Text style={styles.latencyText}>⚡ Inference Mode: {analysisResult.npuspeed}</Text>
                  </View>
                </View>

                {/* STAR Breakdown */}
                <Text style={styles.sectionHeading}>Feedback Evaluation</Text>
                {Object.entries(analysisResult.starBreakdown).map(([key, val]: any) => (
                  <View key={key} style={styles.starRow}>
                    <View style={styles.starLetterBadge}>
                      <Text style={styles.starLetterText}>{key.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                      <Text style={styles.starKeyText}>{key.toUpperCase()}</Text>
                      <Text style={styles.starValText}>{val}</Text>
                    </View>
                  </View>
                ))}

                <TouchableOpacity style={styles.retryBtn} onPress={handleStartRecording}>
                  <Feather name="refresh-cw" size={16} color={Colors.accentGold} />
                  <Text style={styles.retryBtnText}>Practice Another Take</Text>
                </TouchableOpacity>
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
  questionCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  tagText: {
    color: Colors.accentGold,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  npuTag: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  npuTagText: {
    color: Colors.cyberBlue,
    fontSize: 9,
    fontWeight: '800',
  },
  questionText: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: '600',
    lineHeight: 22,
  },
  recorderBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  idleBox: {
    alignItems: 'center',
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  micPrompt: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  micHint: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  recordingState: {
    alignItems: 'center',
    width: '100%',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
    marginRight: Spacing.xs,
  },
  timerText: {
    color: Colors.danger,
    fontSize: Typography.lg,
    fontWeight: '900',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 65,
    marginBottom: Spacing.md,
  },
  waveBar: {
    width: 6,
    backgroundColor: Colors.accentGold,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  listeningText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    marginBottom: Spacing.md,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  stopBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.sm,
    fontWeight: '800',
    marginLeft: Spacing.xs,
  },
  analyzingBox: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  analyzingText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  npuNote: {
    color: Colors.accentGold,
    fontSize: Typography.xs,
    marginTop: 4,
  },
  transcriptCard: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionHeading: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: '800',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  transcriptBody: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  resultContainer: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scoreCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0, 186, 124, 0.15)',
    borderWidth: 2,
    borderColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  scoreNum: {
    color: Colors.success,
    fontSize: Typography.md,
    fontWeight: '900',
  },
  scoreDenom: {
    color: Colors.textSecondary,
    fontSize: 8,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  scoreSub: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  latencyText: {
    color: Colors.accentGold,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
  },
  starLetterBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starLetterText: {
    color: Colors.textInverse,
    fontSize: 11,
    fontWeight: '900',
  },
  starKeyText: {
    color: Colors.accentGold,
    fontSize: 10,
    fontWeight: '800',
  },
  starValText: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glass,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginTop: Spacing.md,
  },
  retryBtnText: {
    color: Colors.accentGold,
    fontSize: Typography.xs,
    fontWeight: '800',
    marginLeft: Spacing.xs,
  },
});
