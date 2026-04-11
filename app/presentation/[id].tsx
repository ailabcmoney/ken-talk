import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Discussion, PresentationData } from '../../src/types';
import { getDiscussions } from '../../src/utils/storage';
import { generatePresentationData, createPptx } from '../../src/utils/ppt-generator';
import { getGoogleToken, signInWithGoogle } from '../../src/utils/google-auth';
import { saveToGoogleSlides } from '../../src/utils/google-slides';
import { generatePreviewHTML } from '../../src/utils/html-preview';
import { COLORS, SPACING } from '../../src/constants/theme';

export default function PresentationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savingGoogle, setSavingGoogle] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: '簡報生成' });
    loadDiscussion();
  }, [id]);

  const loadDiscussion = async () => {
    const discussions = await getDiscussions();
    const found = discussions.find((d) => d.id === id);
    if (found) setDiscussion(found);
  };

  const handleGenerate = async () => {
    if (!discussion || discussion.messages.length < 2) return;
    setGenerating(true);
    try {
      const data = await generatePresentationData(discussion.messages, discussion.title);
      setPresentationData(data);
    } catch (err: any) {
      Alert.alert('生成失敗', err.message || '請稍後再試');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPPT = async () => {
    if (!presentationData) return;
    setDownloading(true);
    try {
      const pptx = await createPptx(presentationData);
      if (Platform.OS === 'web') {
        await pptx.writeFile({ fileName: `${presentationData.title}.pptx` });
      } else {
        // On native, write to a temp file and share
        const base64 = await (pptx as any).write({ outputType: 'base64' });
        // For native sharing, we'd use expo-sharing + expo-file-system
        Alert.alert('提示', '原生版下載功能需要 expo-sharing 套件，目前請使用 Web 版下載');
      }
    } catch (err: any) {
      Alert.alert('下載失敗', err.message || '請稍後再試');
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveToGoogleSlides = async () => {
    if (!presentationData) return;
    setSavingGoogle(true);
    try {
      let token = await getGoogleToken();
      if (!token) {
        token = await signInWithGoogle();
      }
      const url = await saveToGoogleSlides(presentationData, token);
      Alert.alert(
        '儲存成功！',
        '簡報已存到你的 Google Drive',
        [
          { text: '打開簡報', onPress: () => { if (Platform.OS === 'web') window.open(url, '_blank'); } },
          { text: '好的' },
        ]
      );
    } catch (err: any) {
      Alert.alert('儲存失敗', err.message || '請確認 Google Client ID 設定');
    } finally {
      setSavingGoogle(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 簡報工坊</Text>
        <Text style={styles.subtitle}>
          從你和 Ken 的討論中，自動產出讓老闆 buy-in 的簡報
        </Text>
      </View>

      {!presentationData && !generating && (
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
          <Ionicons name="sparkles" size={24} color="#fff" />
          <Text style={styles.generateBtnText}>一鍵生成簡報</Text>
        </TouchableOpacity>
      )}

      {generating && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>AI 正在分析討論內容...</Text>
          <Text style={styles.loadingHint}>
            整理重點、建立框架、設計版面
          </Text>
        </View>
      )}

      {presentationData && (
        <>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{presentationData.title}</Text>
            <Text style={styles.previewSubtitle}>{presentationData.subtitle}</Text>
            <Text style={styles.slideCount}>
              共 {presentationData.slides.length + 2} 頁（含封面與結尾）
            </Text>
          </View>

          {presentationData.slides.map((slide, i) => (
            <View key={i} style={styles.slideCard}>
              <View style={styles.slideHeader}>
                <View style={styles.slideNum}>
                  <Text style={styles.slideNumText}>{i + 2}</Text>
                </View>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <View style={styles.layoutBadge}>
                  <Text style={styles.layoutBadgeText}>{slide.layout || 'bullets'}</Text>
                </View>
              </View>

              {/* Bullets */}
              {(slide.layout === 'bullets' || !slide.layout) && slide.bullets?.map((bullet, j) => (
                <View key={j} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}

              {/* Table */}
              {slide.layout === 'table' && slide.table && (
                <View style={styles.tableBox}>
                  <View style={styles.tableHeaderRow}>
                    {slide.table.headers.map((h, j) => (
                      <Text key={j} style={styles.tableHeaderCell}>{h}</Text>
                    ))}
                  </View>
                  {slide.table.rows.map((row, j) => (
                    <View key={j} style={styles.tableRow}>
                      {row.map((cell, k) => (
                        <Text key={k} style={styles.tableCell}>{cell}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Flow */}
              {slide.layout === 'flow' && slide.flow && (
                <View style={styles.flowBox}>
                  {slide.flow.map((node, j) => (
                    <View key={j} style={styles.flowItem}>
                      <View style={[styles.flowNode, node.type === 'decision' && styles.flowDecision]}>
                        <Text style={styles.flowLabel}>{node.label}</Text>
                      </View>
                      {j < (slide.flow?.length || 0) - 1 && <Text style={styles.flowArrow}>→</Text>}
                    </View>
                  ))}
                </View>
              )}

              {/* Icons */}
              {slide.layout === 'icons' && slide.icons && (
                <View style={styles.iconsBox}>
                  {slide.icons.map((item, j) => (
                    <View key={j} style={styles.iconItem}>
                      <Text style={styles.iconEmoji}>{item.icon}</Text>
                      <Text style={styles.iconTitle}>{item.title}</Text>
                      <Text style={styles.iconDesc}>{item.desc}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Timeline */}
              {slide.layout === 'timeline' && slide.timeline && (
                <View style={styles.timelineBox}>
                  {slide.timeline.map((item, j) => (
                    <View key={j} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      <View>
                        <Text style={styles.timelineTime}>{item.time}</Text>
                        <Text style={styles.timelineLabel}>{item.label}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Compare */}
              {slide.layout === 'compare' && slide.compare && (
                <View style={styles.compareBox}>
                  {slide.compare.map((col, j) => (
                    <View key={j} style={styles.compareCol}>
                      <Text style={styles.compareTitle}>{col.title}</Text>
                      {col.items.map((item, k) => (
                        <Text key={k} style={styles.compareItem}>• {item}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Big Number */}
              {slide.layout === 'bigNumber' && slide.bigNumber && (
                <View style={styles.bigNumBox}>
                  <Text style={styles.bigNum}>{slide.bigNumber.number}</Text>
                  <Text style={styles.bigNumLabel}>{slide.bigNumber.label}</Text>
                  {slide.bigNumber.sub && <Text style={styles.bigNumSub}>{slide.bigNumber.sub}</Text>}
                </View>
              )}

              {/* Quote */}
              {slide.layout === 'quote' && slide.quote && (
                <View style={styles.quoteBox}>
                  <Text style={styles.quoteText}>「{slide.quote.text}」</Text>
                  {slide.quote.author && <Text style={styles.quoteAuthor}>— {slide.quote.author}</Text>}
                </View>
              )}

              {/* Matrix */}
              {slide.layout === 'matrix' && slide.matrix && (
                <View style={styles.iconsBox}>
                  {slide.matrix.map((cell, j) => (
                    <View key={j} style={styles.iconItem}>
                      <Text style={styles.iconEmoji}>{cell.icon}</Text>
                      <Text style={styles.iconTitle}>{cell.title}</Text>
                      <Text style={styles.iconDesc}>{cell.desc}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* KPIs */}
              {slide.layout === 'kpis' && slide.kpis && (
                <View style={styles.compareBox}>
                  {slide.kpis.map((kpi, j) => (
                    <View key={j} style={styles.compareCol}>
                      <Text style={styles.bigNum}>{kpi.number}</Text>
                      <Text style={styles.iconTitle}>{kpi.label}</Text>
                      {kpi.sub && <Text style={styles.iconDesc}>{kpi.sub}</Text>}
                    </View>
                  ))}
                </View>
              )}

              {/* Before/After */}
              {slide.layout === 'beforeAfter' && slide.beforeAfter && (
                <View style={styles.compareBox}>
                  <View style={styles.compareCol}>
                    <Text style={[styles.compareTitle, { color: COLORS.textMuted }]}>Before</Text>
                    {slide.beforeAfter.before.map((item, j) => (
                      <Text key={j} style={styles.compareItem}>✕ {item}</Text>
                    ))}
                  </View>
                  <View style={styles.compareCol}>
                    <Text style={[styles.compareTitle, { color: COLORS.success }]}>After</Text>
                    {slide.beforeAfter.after.map((item, j) => (
                      <Text key={j} style={styles.compareItem}>✓ {item}</Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Pyramid */}
              {slide.layout === 'pyramid' && slide.pyramid && (
                <View style={styles.timelineBox}>
                  {slide.pyramid.map((level, j) => (
                    <View key={j} style={[styles.flowNode, { borderColor: COLORS.primaryLight, marginBottom: 4, alignSelf: 'center', width: `${40 + j * 15}%` as any }]}>
                      <Text style={[styles.flowLabel, { textAlign: 'center' }]}>{level}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Subtitle */}
              {slide.subtitle ? (
                <Text style={[styles.slideNotes, { fontStyle: 'normal', color: COLORS.textSecondary }]}>{slide.subtitle}</Text>
              ) : null}

              {slide.notes ? (
                <Text style={styles.slideNotes}>💡 {slide.notes}</Text>
              ) : null}
            </View>
          ))}

          {/* Preview button */}
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={() => {
                if (!presentationData) return;
                const html = generatePreviewHTML(presentationData);
                const w = window.open('', '_blank');
                if (w) { w.document.write(html); w.document.close(); }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="eye-outline" size={20} color="#fff" />
              <Text style={styles.previewBtnText}>預覽完整簡報</Text>
            </TouchableOpacity>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.pptBtn]}
              onPress={handleDownloadPPT}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="download-outline" size={20} color="#fff" />
              )}
              <Text style={styles.actionBtnText}>下載 PPT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.googleBtn]}
              onPress={handleSaveToGoogleSlides}
              disabled={savingGoogle}
            >
              {savingGoogle ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="logo-google" size={20} color="#fff" />
              )}
              <Text style={styles.actionBtnText}>
                {savingGoogle ? '儲存中...' : '存到 Google Slides'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.regenerateBtn}
            onPress={handleGenerate}
          >
            <Ionicons name="refresh" size={18} color={COLORS.primaryLight} />
            <Text style={styles.regenerateText}>重新生成</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 16,
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  generateBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  loadingHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  previewSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  slideCount: {
    fontSize: 12,
    color: COLORS.primaryLight,
  },
  slideCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  slideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  slideNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  slideNumText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  slideTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  layoutBadge: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginLeft: SPACING.sm,
  },
  layoutBadgeText: {
    fontSize: 10,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  // Table
  tableBox: {
    marginLeft: SPACING.xl + SPACING.sm,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  tableHeaderRow: {
    flexDirection: 'row' as const,
    backgroundColor: COLORS.primary,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center' as const,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.xs,
  },
  tableRow: {
    flexDirection: 'row' as const,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.xs,
  },
  // Flow
  flowBox: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'center' as const,
    marginLeft: SPACING.xl + SPACING.sm,
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  flowItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.xs,
  },
  flowNode: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
  },
  flowDecision: {
    borderColor: COLORS.warning,
    transform: [{ rotate: '0deg' }],
  },
  flowLabel: {
    fontSize: 12,
    color: COLORS.text,
  },
  flowArrow: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  // Icons
  iconsBox: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginLeft: SPACING.xl,
    marginTop: SPACING.xs,
    gap: SPACING.md,
  },
  iconItem: {
    alignItems: 'center' as const,
    width: 80,
  },
  iconEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  iconTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: COLORS.text,
    textAlign: 'center' as const,
  },
  iconDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center' as const,
  },
  // Timeline
  timelineBox: {
    marginLeft: SPACING.xl + SPACING.sm,
    marginTop: SPACING.xs,
  },
  timelineItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primaryLight,
    marginTop: 4,
  },
  timelineTime: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: COLORS.primaryLight,
  },
  timelineLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  // Compare
  compareBox: {
    flexDirection: 'row' as const,
    marginLeft: SPACING.xl + SPACING.sm,
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  compareCol: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: SPACING.sm,
  },
  compareTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: COLORS.primaryLight,
    marginBottom: SPACING.xs,
    textAlign: 'center' as const,
  },
  compareItem: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  // Big Number
  bigNumBox: {
    alignItems: 'center' as const,
    marginVertical: SPACING.sm,
  },
  bigNum: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: COLORS.primary,
  },
  bigNumLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
  },
  bigNumSub: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 2,
  },
  // Quote
  quoteBox: {
    marginLeft: SPACING.xl + SPACING.sm,
    marginTop: SPACING.xs,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.md,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic' as const,
    color: COLORS.text,
    lineHeight: 22,
  },
  quoteAuthor: {
    fontSize: 12,
    color: COLORS.primaryLight,
    marginTop: SPACING.xs,
    textAlign: 'right' as const,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: SPACING.xl + SPACING.sm,
    marginBottom: SPACING.xs,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryLight,
    marginTop: 7,
    marginRight: SPACING.sm,
  },
  bulletText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  slideNotes: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    marginLeft: SPACING.xl + SPACING.sm,
    fontStyle: 'italic',
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F5496',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  previewBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  pptBtn: {
    backgroundColor: COLORS.accent,
  },
  googleBtn: {
    backgroundColor: '#4285F4',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  regenerateText: {
    fontSize: 14,
    color: COLORS.primaryLight,
  },
});
