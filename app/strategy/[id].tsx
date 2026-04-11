import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Discussion } from '../../src/types';
import { getDiscussions } from '../../src/utils/storage';
import { generateStrategy, StrategyData } from '../../src/utils/strategy-generator';
import { downloadText, downloadWord } from '../../src/utils/strategy-export';
import { COLORS, SPACING } from '../../src/constants/theme';
import { Platform } from 'react-native';

const S = {
  red: '#C00000',
  blue: '#2F5496',
  teal: '#2EAAAA',
  green: '#548235',
  orange: '#ED7D31',
  purple: '#6C63FF',
  gold: '#D4A017',
};

export default function StrategyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: '溝通策略' });
    getDiscussions().then(ds => {
      const found = ds.find(d => d.id === id);
      if (found) setDiscussion(found);
    });
  }, [id]);

  const handleGenerate = async () => {
    if (!discussion || discussion.messages.length < 2) return;
    setGenerating(true);
    try {
      const data = await generateStrategy(discussion.messages);
      setStrategy(data);
    } catch (err: any) {
      Alert.alert('生成失敗', err.message || '請稍後再試');
    } finally {
      setGenerating(false);
    }
  };

  if (!strategy && !generating) {
    return (
      <View style={st.emptyContainer}>
        <View style={st.emptyCard}>
          <Ionicons name="bulb" size={48} color={S.blue} />
          <Text style={st.emptyTitle}>溝通策略分析</Text>
          <Text style={st.emptyDesc}>
            AI 會分析 Ken 的思維模式，預測他會問什麼問題，{'\n'}
            找出隱藏風險，並給你具體的話術建議
          </Text>
          <TouchableOpacity style={st.genBtn} onPress={handleGenerate}>
            <Ionicons name="analytics" size={20} color="#fff" />
            <Text style={st.genBtnText}>一鍵產出溝通策略</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (generating) {
    return (
      <View style={st.emptyContainer}>
        <ActivityIndicator size="large" color={S.blue} />
        <Text style={[st.emptyTitle, { marginTop: 20 }]}>正在分析 Ken 的思維模式...</Text>
        <Text style={st.emptyDesc}>預測提問、找出風險、生成話術</Text>
      </View>
    );
  }

  const s = strategy!;

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      {/* Header */}
      <View style={st.hero}>
        <Text style={st.heroLabel}>COMMUNICATION STRATEGY</Text>
        <Text style={st.heroTitle}>{s.title}</Text>
        <Text style={st.heroSummary}>{s.summary}</Text>
      </View>

      {/* Ken 最在意什麼 */}
      <View style={[st.card, st.coreCard]}>
        <View style={st.coreBadge}>
          <Ionicons name="heart" size={16} color="#fff" />
          <Text style={st.coreBadgeText}>Ken 最在意</Text>
        </View>
        <Text style={st.coreText}>{s.kenCoreCaresAbout}</Text>
        <Text style={st.coreWhy}>{s.kenCoreCaresWhy}</Text>
      </View>

      {/* Ken 的思維角度 */}
      <Text style={st.sectionTitle}>Ken 看這件事的角度</Text>
      {s.kenMindset?.map((m, i) => (
        <View key={i} style={st.mindsetCard}>
          <View style={[st.mindsetDot, { backgroundColor: [S.red, S.blue, S.teal, S.orange][i % 4] }]}>
            <Text style={st.mindsetDotText}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.mindsetAngle}>{m.angle}</Text>
            <Text style={st.mindsetDetail}>{m.detail}</Text>
          </View>
        </View>
      ))}

      {/* 公司目標對齊 */}
      <Text style={st.sectionTitle}>公司 / 事業目標對齊</Text>
      {s.companyGoals?.map((g, i) => (
        <View key={i} style={st.goalCard}>
          <View style={[st.goalStatus, {
            backgroundColor: g.status === 'aligned' ? S.green : g.status === 'partial' ? S.orange : S.red
          }]}>
            <Text style={st.goalStatusText}>
              {g.status === 'aligned' ? 'ALIGNED' : g.status === 'partial' ? 'PARTIAL' : 'GAP'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.goalName}>{g.goal}</Text>
            <Text style={st.goalNote}>{g.note}</Text>
          </View>
        </View>
      ))}

      {/* Ken 可能的問題 + 回答 */}
      <Text style={st.sectionTitle}>Ken 可能會問的問題</Text>
      <Text style={st.sectionSub}>附建議回答和關鍵句</Text>
      {s.qaCards?.map((qa, i) => (
        <View key={i} style={st.qaCard}>
          <View style={st.qaHeader}>
            <View style={st.qaBadge}><Text style={st.qaBadgeText}>Q{i + 1}</Text></View>
            <Text style={st.qaQuestion}>{qa.question}</Text>
          </View>
          <View style={st.qaIntent}>
            <Ionicons name="eye-outline" size={12} color={S.orange} />
            <Text style={st.qaIntentText}>背後意圖：{qa.intent}</Text>
          </View>
          <View style={st.qaAnswer}>
            <Text style={st.qaAnswerLabel}>建議回答</Text>
            <Text style={st.qaAnswerText}>{qa.answer}</Text>
          </View>
          <View style={st.qaKeyPoint}>
            <Ionicons name="star" size={12} color={S.gold} />
            <Text style={st.qaKeyPointText}>{qa.keyPoint}</Text>
          </View>
        </View>
      ))}

      {/* 超重要金句 */}
      <Text style={st.sectionTitle}>講出來就能推進的金句</Text>
      <Text style={st.sectionSub}>按重要程度排序，Critical 級別的一定要講</Text>
      {s.powerPhrases?.map((p, i) => (
        <View key={i} style={[st.phraseCard, p.level === 'critical' && st.phraseCritical]}>
          <View style={st.phraseLeft}>
            <View style={[st.phraseLevelBadge, {
              backgroundColor: p.level === 'critical' ? S.red : p.level === 'high' ? S.orange : S.teal
            }]}>
              <Text style={st.phraseLevelText}>
                {p.level === 'critical' ? 'CRITICAL' : p.level === 'high' ? 'HIGH' : 'MEDIUM'}
              </Text>
            </View>
            {p.level === 'critical' && <Ionicons name="star" size={14} color={S.gold} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[st.phraseText, p.level === 'critical' && { fontWeight: '800' }]}>
              「{p.phrase}」
            </Text>
            <Text style={st.phraseEffect}>{p.effect}</Text>
          </View>
        </View>
      ))}

      {/* 地雷句 */}
      <Text style={st.sectionTitle}>地雷句 — 講了會被唸</Text>
      {s.dangerPhrases?.map((d, i) => (
        <View key={i} style={st.dangerCard}>
          <View style={st.dangerIcon}>
            <Ionicons name="alert-circle" size={18} color={S.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.dangerPhrase}>「{d.phrase}」</Text>
            <Text style={st.dangerConsequence}>{d.consequence}</Text>
          </View>
        </View>
      ))}

      {/* 隱藏風險 */}
      <Text style={st.sectionTitle}>隱藏風險</Text>
      {s.hiddenRisks?.map((r, i) => (
        <View key={i} style={st.riskCard}>
          <View style={st.riskHeader}>
            <View style={[st.riskSeverity, {
              backgroundColor: r.severity === 'high' ? S.red : r.severity === 'medium' ? S.orange : S.teal
            }]}>
              <Text style={st.riskSeverityText}>{r.severity?.toUpperCase()}</Text>
            </View>
            <Text style={st.riskText}>{r.risk}</Text>
          </View>
          <View style={st.riskMitigation}>
            <Ionicons name="shield-checkmark" size={14} color={S.green} />
            <Text style={st.riskMitigationText}>{r.mitigation}</Text>
          </View>
        </View>
      ))}

      {/* 該做 vs 不該做 */}
      <Text style={st.sectionTitle}>DO vs DON'T</Text>
      {s.dosAndDonts?.map((dd, i) => (
        <View key={i} style={st.ddRow}>
          <View style={[st.ddCol, st.ddDo]}>
            <View style={[st.ddBadge, { backgroundColor: 'rgba(84,130,53,.2)' }]}>
              <Ionicons name="checkmark-circle" size={14} color={S.green} />
              <Text style={[st.ddBadgeText, { color: S.green }]}>DO</Text>
            </View>
            <Text style={st.ddText}>{dd.do}</Text>
          </View>
          <View style={[st.ddCol, st.ddDont]}>
            <View style={[st.ddBadge, { backgroundColor: 'rgba(192,0,0,.15)' }]}>
              <Ionicons name="close-circle" size={14} color={S.red} />
              <Text style={[st.ddBadgeText, { color: S.red }]}>DON'T</Text>
            </View>
            <Text style={st.ddText}>{dd.dont}</Text>
          </View>
        </View>
      ))}

      {/* 特殊觀點 */}
      <Text style={st.sectionTitle}>Ken 可能提出的獨特觀點</Text>
      <Text style={st.sectionSub}>準備好應對這些出人意料的角度</Text>
      {s.uniquePerspectives?.map((p, i) => (
        <View key={i} style={st.perspCard}>
          <View style={st.perspIcon}>
            <Ionicons name="flash" size={18} color={S.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.perspTitle}>{p.perspective}</Text>
            <Text style={st.perspExpl}>{p.explanation}</Text>
          </View>
        </View>
      ))}

      {/* 延伸議題 */}
      <Text style={st.sectionTitle}>可延伸討論的議題</Text>
      {s.extendedTopics?.map((t, i) => (
        <View key={i} style={st.topicCard}>
          <View style={[st.topicNum, { backgroundColor: [S.blue, S.teal, S.orange, S.purple][i % 4] }]}>
            <Text style={st.topicNumText}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.topicTitle}>{t.topic}</Text>
            <Text style={st.topicWhy}>{t.why}</Text>
          </View>
        </View>
      ))}

      {/* 完整話術腳本 */}
      <Text style={st.sectionTitle}>完整話術腳本</Text>
      <View style={st.scriptCard}>
        <View style={st.scriptSection}>
          <View style={[st.scriptBadge, { backgroundColor: S.green }]}>
            <Text style={st.scriptBadgeText}>OPENING</Text>
          </View>
          <Text style={st.scriptText}>「{s.scripts?.opening}」</Text>
        </View>

        {s.scripts?.keyTransitions?.map((t, i) => (
          <View key={i} style={st.scriptSection}>
            <View style={[st.scriptBadge, { backgroundColor: S.blue }]}>
              <Text style={st.scriptBadgeText}>TRANSITION {i + 1}</Text>
            </View>
            <Text style={st.scriptText}>「{t}」</Text>
          </View>
        ))}

        <View style={st.scriptSection}>
          <View style={[st.scriptBadge, { backgroundColor: S.red }]}>
            <Text style={st.scriptBadgeText}>CLOSING</Text>
          </View>
          <Text style={st.scriptText}>「{s.scripts?.closing}」</Text>
        </View>
      </View>

      {/* User Story */}
      {s.userStory && (
        <>
          <Text style={st.sectionTitle}>用戶故事</Text>
          <Text style={st.sectionSub}>一個真實的使用情境，幫助 Ken 具體理解價值</Text>
          <View style={[st.card, { backgroundColor: '#F0F7FF', borderWidth: 1, borderColor: '#D0E0F0', padding: SPACING.lg, marginBottom: SPACING.md }]}>
            <View style={{ marginBottom: SPACING.md }}>
              <View style={[st.scriptBadge, { backgroundColor: S.blue, marginBottom: SPACING.sm }]}>
                <Text style={st.scriptBadgeText}>SCENARIO</Text>
              </View>
              <Text style={{ fontSize: 17, color: W.text, lineHeight: 28 }}>{s.userStory.scenario}</Text>
            </View>
            <View style={{ marginBottom: SPACING.md }}>
              <View style={[st.scriptBadge, { backgroundColor: S.red, marginBottom: SPACING.sm }]}>
                <Text style={st.scriptBadgeText}>PAIN POINT</Text>
              </View>
              <Text style={{ fontSize: 16, color: S.red, lineHeight: 26, fontWeight: '600' }}>{s.userStory.painPoint}</Text>
            </View>
            <View style={{ marginBottom: SPACING.md }}>
              <View style={[st.scriptBadge, { backgroundColor: S.green, marginBottom: SPACING.sm }]}>
                <Text style={st.scriptBadgeText}>OUR SOLUTION</Text>
              </View>
              <Text style={{ fontSize: 16, color: W.text, lineHeight: 26 }}>{s.userStory.solution}</Text>
            </View>
            <View style={{ backgroundColor: '#E8F5E9', borderRadius: 12, padding: SPACING.md }}>
              <View style={[st.scriptBadge, { backgroundColor: S.green, marginBottom: SPACING.sm }]}>
                <Text style={st.scriptBadgeText}>OUTCOME</Text>
              </View>
              <Text style={{ fontSize: 18, color: S.green, fontWeight: '800', lineHeight: 26 }}>{s.userStory.outcome}</Text>
            </View>
          </View>
        </>
      )}

      {/* Moat */}
      {s.moat && (
        <>
          <Text style={st.sectionTitle}>為什麼是我們 + 護城河</Text>
          <Text style={st.sectionSub}>Ken 最在意的問題：為什麼是我們做、為什麼是現在、憑什麼我們會成功</Text>

          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
            <View style={[st.ddRow, { paddingHorizontal: 0 }]}>
              <View style={[st.ddCol, { backgroundColor: '#F0F7FF', borderWidth: 1, borderColor: '#D0E0F0' }]}>
                <View style={[st.ddBadge, { backgroundColor: 'rgba(47,84,150,.15)' }]}>
                  <Ionicons name="people" size={14} color={S.blue} />
                  <Text style={[st.ddBadgeText, { color: S.blue }]}>WHY US</Text>
                </View>
                {s.moat.whyUs?.map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <View style={[st.mindsetDot, { backgroundColor: S.blue, width: 22, height: 22 }]}>
                      <Text style={[st.mindsetDotText, { fontSize: 10 }]}>{i + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 15, color: W.sub, lineHeight: 24, flex: 1 }}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={[st.ddCol, { backgroundColor: '#FFF8F0', borderWidth: 1, borderColor: '#FFE0C0' }]}>
                <View style={[st.ddBadge, { backgroundColor: 'rgba(237,125,49,.15)' }]}>
                  <Ionicons name="time" size={14} color={S.orange} />
                  <Text style={[st.ddBadgeText, { color: S.orange }]}>WHY NOW</Text>
                </View>
                {s.moat.whyNow?.map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <View style={[st.mindsetDot, { backgroundColor: S.orange, width: 22, height: 22 }]}>
                      <Text style={[st.mindsetDotText, { fontSize: 10 }]}>{i + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 15, color: W.sub, lineHeight: 24, flex: 1 }}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={[st.card, { backgroundColor: '#F0FAF0', borderWidth: 1, borderColor: '#C8E6C8', padding: SPACING.lg, marginBottom: SPACING.md }]}>
            <View style={[st.coreBadge, { backgroundColor: S.green }]}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={st.coreBadgeText}>核心護城河</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: W.text, lineHeight: 28, marginBottom: SPACING.sm }}>{s.moat.competitiveEdge}</Text>
            <View style={{ backgroundColor: 'rgba(84,130,53,.08)', borderRadius: 10, padding: SPACING.md }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: S.green, marginBottom: 4 }}>別人為什麼做不到</Text>
              <Text style={{ fontSize: 15, color: W.sub, lineHeight: 24 }}>{s.moat.hardToReplicate}</Text>
            </View>
          </View>
        </>
      )}

      {/* Download buttons */}
      {Platform.OS === 'web' && (
        <View style={st.downloadRow}>
          <TouchableOpacity style={st.dlBtn} onPress={() => downloadWord(s)}>
            <Ionicons name="document-text" size={18} color="#fff" />
            <Text style={st.dlBtnText}>下載 Word</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.dlBtn, st.dlBtnAlt]} onPress={() => downloadText(s)}>
            <Ionicons name="code-slash" size={18} color={S.blue} />
            <Text style={[st.dlBtnText, { color: S.blue }]}>下載文字檔</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={st.regenBtn} onPress={handleGenerate}>
        <Ionicons name="refresh" size={16} color={S.blue} />
        <Text style={st.regenText}>重新生成</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const W = { bg: '#FFFFFF', card: '#F8F8FA', text: '#1C1C1B', sub: '#4A4A4A', muted: '#7F7F7F', border: '#E8E8E8', lightBg: '#F0F0F4' };

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: W.bg },
  content: { paddingBottom: 60 },
  // Empty state
  emptyContainer: { flex: 1, backgroundColor: W.bg, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  emptyCard: { alignItems: 'center', backgroundColor: W.card, borderRadius: 20, padding: SPACING.xl, borderWidth: 1, borderColor: W.border, maxWidth: 420, width: '100%' },
  emptyTitle: { fontSize: 26, fontWeight: '800', color: W.text, marginTop: SPACING.md },
  emptyDesc: { fontSize: 16, color: W.sub, textAlign: 'center', lineHeight: 26, marginTop: SPACING.sm, marginBottom: SPACING.lg },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: S.blue, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14 },
  genBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  // Hero
  hero: { backgroundColor: S.blue, padding: SPACING.xl, paddingTop: SPACING.xl + 20 },
  heroLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,.5)', letterSpacing: 3, marginBottom: SPACING.sm },
  heroTitle: { fontSize: 30, fontWeight: '900', color: '#fff', marginBottom: SPACING.sm },
  heroSummary: { fontSize: 17, color: 'rgba(255,255,255,.8)', lineHeight: 26 },
  // Section title
  sectionTitle: { fontSize: 22, fontWeight: '800', color: W.text, paddingHorizontal: SPACING.lg, marginTop: SPACING.xl, marginBottom: SPACING.xs },
  sectionSub: { fontSize: 15, color: W.muted, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  // Core card
  card: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: 16, overflow: 'hidden' },
  coreCard: { backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FFD4D4', padding: SPACING.lg },
  coreBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: S.red, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, marginBottom: SPACING.sm },
  coreBadgeText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  coreText: { fontSize: 22, fontWeight: '800', color: W.text, marginBottom: SPACING.sm },
  coreWhy: { fontSize: 16, color: W.sub, lineHeight: 24 },
  // Mindset
  mindsetCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  mindsetDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  mindsetDotText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  mindsetAngle: { fontSize: 17, fontWeight: '700', color: W.text, marginBottom: 4 },
  mindsetDetail: { fontSize: 15, color: W.sub, lineHeight: 24 },
  // Goals
  goalCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm, backgroundColor: W.card, marginHorizontal: SPACING.lg, borderRadius: 12, padding: SPACING.md, borderWidth: 1, borderColor: W.border },
  goalStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  goalStatusText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  goalName: { fontSize: 17, fontWeight: '700', color: W.text },
  goalNote: { fontSize: 14, color: W.sub, marginTop: 2 },
  // QA
  qaCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: W.card, borderRadius: 16, padding: SPACING.lg, borderWidth: 1, borderColor: W.border },
  qaHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  qaBadge: { backgroundColor: S.orange, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  qaBadgeText: { fontSize: 13, fontWeight: '900', color: '#fff' },
  qaQuestion: { fontSize: 18, fontWeight: '700', color: W.text, flex: 1, lineHeight: 26 },
  qaIntent: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md, backgroundColor: '#FFF5EE', padding: SPACING.sm + 2, borderRadius: 10 },
  qaIntentText: { fontSize: 14, color: S.orange, flex: 1 },
  qaAnswer: { backgroundColor: W.bg, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: W.border },
  qaAnswerLabel: { fontSize: 12, fontWeight: '700', color: W.muted, letterSpacing: 1, marginBottom: SPACING.sm },
  qaAnswerText: { fontSize: 16, color: W.text, lineHeight: 26 },
  qaKeyPoint: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.sm, backgroundColor: '#FFFCF0', padding: SPACING.sm, borderRadius: 8 },
  qaKeyPointText: { fontSize: 16, fontWeight: '700', color: '#B8860B', flex: 1 },
  // Power phrases
  phraseCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, backgroundColor: W.card, borderRadius: 14, padding: SPACING.lg, borderWidth: 1, borderColor: W.border },
  phraseCritical: { borderColor: '#FFD4D4', backgroundColor: '#FFF5F5' },
  phraseLeft: { alignItems: 'center', gap: 6 },
  phraseLevelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  phraseLevelText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  phraseText: { fontSize: 17, color: W.text, lineHeight: 26, fontWeight: '600' },
  phraseEffect: { fontSize: 14, color: W.muted, marginTop: 6 },
  // Danger phrases
  dangerCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, backgroundColor: '#FFF5F5', borderRadius: 14, padding: SPACING.lg, borderWidth: 1, borderColor: '#FFD4D4' },
  dangerIcon: { marginTop: 2 },
  dangerPhrase: { fontSize: 17, fontWeight: '600', color: S.red, lineHeight: 26 },
  dangerConsequence: { fontSize: 14, color: W.sub, marginTop: 6 },
  // Risks
  riskCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, backgroundColor: W.card, borderRadius: 14, padding: SPACING.lg, borderWidth: 1, borderColor: W.border },
  riskHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  riskSeverity: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  riskSeverityText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  riskText: { fontSize: 17, fontWeight: '600', color: W.text, flex: 1 },
  riskMitigation: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F0FAF0', padding: SPACING.md, borderRadius: 10 },
  riskMitigationText: { fontSize: 15, color: W.sub, flex: 1, lineHeight: 22 },
  // Do/Don't
  ddRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  ddCol: { flex: 1, borderRadius: 14, padding: SPACING.lg },
  ddDo: { backgroundColor: '#F0FAF0', borderWidth: 1, borderColor: '#C8E6C8' },
  ddDont: { backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FFD4D4' },
  ddBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: SPACING.sm },
  ddBadgeText: { fontSize: 12, fontWeight: '900' },
  ddText: { fontSize: 15, color: W.sub, lineHeight: 24 },
  // Perspectives
  perspCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  perspIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0EFFF', justifyContent: 'center', alignItems: 'center' },
  perspTitle: { fontSize: 17, fontWeight: '700', color: W.text, marginBottom: 4 },
  perspExpl: { fontSize: 15, color: W.sub, lineHeight: 24 },
  // Topics
  topicCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  topicNum: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  topicNumText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  topicTitle: { fontSize: 17, fontWeight: '700', color: W.text },
  topicWhy: { fontSize: 14, color: W.sub, lineHeight: 22, marginTop: 4 },
  // Scripts
  scriptCard: { marginHorizontal: SPACING.lg, backgroundColor: W.card, borderRadius: 16, padding: SPACING.lg, borderWidth: 1, borderColor: W.border },
  scriptSection: { marginBottom: SPACING.lg },
  scriptBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: SPACING.sm },
  scriptBadgeText: { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  scriptText: { fontSize: 17, color: W.text, lineHeight: 28, fontStyle: 'italic' },
  // Downloads
  downloadRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  dlBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: S.blue, paddingVertical: 14, borderRadius: 12 },
  dlBtnAlt: { backgroundColor: W.card, borderWidth: 1, borderColor: W.border },
  dlBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // Regen
  regenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md, marginBottom: SPACING.lg, gap: SPACING.xs },
  regenText: { fontSize: 15, color: S.blue },
});
