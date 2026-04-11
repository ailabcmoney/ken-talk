import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getApiKey, saveApiKey,
  getKenPrompt, saveKenPrompt,
  getPptPrompt, savePptPrompt,
  clearPptPrompt, clearKenPrompt,
} from '../src/utils/storage';
import { getGoogleClientId, saveGoogleClientId, getGoogleToken, signOutGoogle } from '../src/utils/google-auth';
import { KEN_SYSTEM_PROMPT } from '../src/constants/ken-persona';
import { DEFAULT_PPT_PROMPT } from '../src/constants/ppt-prompt';
import { COLORS, SPACING } from '../src/constants/theme';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [kenPrompt, setKenPrompt] = useState('');
  const [kenPromptDirty, setKenPromptDirty] = useState(false);

  const [pptPrompt, setPptPrompt] = useState('');
  const [pptPromptDirty, setPptPromptDirty] = useState(false);

  const [googleClientId, setGoogleClientId] = useState('');
  const [googleSaved, setGoogleSaved] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    getApiKey().then((key) => {
      if (key) { setApiKey(key); setKeySaved(true); }
    });
    getKenPrompt().then((p) => setKenPrompt(p || KEN_SYSTEM_PROMPT));
    getPptPrompt().then((p) => setPptPrompt(p || DEFAULT_PPT_PROMPT));
    getGoogleClientId().then((id) => {
      if (id) { setGoogleClientId(id); setGoogleSaved(true); }
    });
    getGoogleToken().then((t) => setGoogleConnected(!!t));
  }, []);

  const handleSaveKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) { Alert.alert('請輸入 API Key'); return; }
    await saveApiKey(trimmed);
    setKeySaved(true);
    Alert.alert('已儲存', 'API Key 設定成功！');
  };

  const handleSaveKenPrompt = async () => {
    await saveKenPrompt(kenPrompt);
    setKenPromptDirty(false);
    Alert.alert('已儲存', '老闆 System Prompt 已更新');
  };

  const handleResetKenPrompt = async () => {
    await clearKenPrompt();
    setKenPrompt(KEN_SYSTEM_PROMPT);
    setKenPromptDirty(false);
    Alert.alert('已恢復', '老闆 Prompt 已恢復預設');
  };

  const handleSavePptPrompt = async () => {
    await savePptPrompt(pptPrompt);
    setPptPromptDirty(false);
    Alert.alert('已儲存', '簡報生成 Prompt 已更新');
  };

  const handleResetPptPrompt = async () => {
    await clearPptPrompt();
    setPptPrompt(DEFAULT_PPT_PROMPT);
    setPptPromptDirty(false);
    Alert.alert('已恢復', '簡報 Prompt 已恢復預設');
  };

  const handleSaveGoogleClientId = async () => {
    const trimmed = googleClientId.trim();
    if (!trimmed) { Alert.alert('請輸入 Google Client ID'); return; }
    await saveGoogleClientId(trimmed);
    setGoogleSaved(true);
    Alert.alert('已儲存', 'Google Client ID 設定成功！');
  };

  const handleDisconnectGoogle = async () => {
    await signOutGoogle();
    setGoogleConnected(false);
    Alert.alert('已登出', 'Google 帳號已斷開連結');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* API Key */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API 設定</Text>
        <Text style={styles.sectionHint}>
          需要 OpenAI API Key 來驅動 Ken AI 對話和簡報生成
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.keyInput}
            value={showKey ? apiKey : apiKey ? '••••••••' + apiKey.slice(-8) : ''}
            onChangeText={(text) => { setApiKey(text); setKeySaved(false); }}
            onFocus={() => setShowKey(true)}
            onBlur={() => setShowKey(false)}
            placeholder="sk-proj-..."
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveKey}>
            <Ionicons
              name={keySaved ? 'checkmark-circle' : 'save-outline'}
              size={22}
              color={keySaved ? COLORS.success : '#fff'}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => Linking.openURL('https://platform.openai.com/api-keys')}
        >
          <Ionicons name="key-outline" size={16} color={COLORS.primaryLight} />
          <Text style={styles.linkText}>取得 OpenAI API Key</Text>
        </TouchableOpacity>
      </View>

      {/* Ken System Prompt */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>老闆 System Prompt</Text>
            <Text style={styles.sectionHint}>自訂 Ken 的人格設定與回覆風格</Text>
          </View>
        </View>
        <TextInput
          style={styles.promptInput}
          value={kenPrompt}
          onChangeText={(text) => { setKenPrompt(text); setKenPromptDirty(true); }}
          multiline
          textAlignVertical="top"
          placeholderTextColor={COLORS.textMuted}
        />
        <View style={styles.promptActions}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetKenPrompt}>
            <Ionicons name="refresh" size={16} color={COLORS.textSecondary} />
            <Text style={styles.resetText}>恢復預設</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.promptSaveBtn, !kenPromptDirty && styles.promptSaveBtnDisabled]}
            onPress={handleSaveKenPrompt}
            disabled={!kenPromptDirty}
          >
            <Text style={styles.promptSaveText}>
              {kenPromptDirty ? '儲存變更' : '已儲存'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PPT Prompt */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>簡報生成 Prompt</Text>
            <Text style={styles.sectionHint}>
              自訂簡報產出的指令。用 {'{{conversation}}'} 代表討論內容
            </Text>
          </View>
        </View>
        <TextInput
          style={styles.promptInput}
          value={pptPrompt}
          onChangeText={(text) => { setPptPrompt(text); setPptPromptDirty(true); }}
          multiline
          textAlignVertical="top"
          placeholderTextColor={COLORS.textMuted}
        />
        <View style={styles.promptActions}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetPptPrompt}>
            <Ionicons name="refresh" size={16} color={COLORS.textSecondary} />
            <Text style={styles.resetText}>恢復預設</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.promptSaveBtn, !pptPromptDirty && styles.promptSaveBtnDisabled]}
            onPress={handleSavePptPrompt}
            disabled={!pptPromptDirty}
          >
            <Text style={styles.promptSaveText}>
              {pptPromptDirty ? '儲存變更' : '已儲存'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Google Slides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Google Slides 連結</Text>
        <Text style={styles.sectionHint}>
          輸入 Google Cloud OAuth Client ID 以啟用「存到 Google Slides」功能
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.keyInput}
            value={googleClientId}
            onChangeText={(text) => { setGoogleClientId(text); setGoogleSaved(false); }}
            placeholder="xxxx.apps.googleusercontent.com"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveGoogleClientId}>
            <Ionicons
              name={googleSaved ? 'checkmark-circle' : 'save-outline'}
              size={22}
              color={googleSaved ? COLORS.success : '#fff'}
            />
          </TouchableOpacity>
        </View>
        {googleConnected && (
          <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnectGoogle}>
            <Ionicons name="log-out-outline" size={16} color={COLORS.accent} />
            <Text style={styles.disconnectText}>斷開 Google 連結</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => Linking.openURL('https://console.cloud.google.com/apis/credentials')}
        >
          <Ionicons name="open-outline" size={16} color={COLORS.primaryLight} />
          <Text style={styles.linkText}>前往 Google Cloud Console 建立 Client ID</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>關於 Ken Talk</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>
            跟模擬老闆 Ken 的 AI 討論你的想法，{'\n'}
            討論完畢後一鍵生成專業簡報。{'\n\n'}
            支援下載 PPT 和儲存到 Google Slides。
          </Text>
        </View>
      </View>
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
    paddingBottom: 80,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  keyInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  linkText: {
    fontSize: 13,
    color: COLORS.primaryLight,
  },
  promptInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 13,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 200,
    maxHeight: 400,
    lineHeight: 20,
  },
  promptActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  resetText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  promptSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  promptSaveBtnDisabled: {
    backgroundColor: COLORS.surfaceLight,
  },
  promptSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  aboutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  aboutText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  disconnectText: {
    fontSize: 13,
    color: COLORS.accent,
  },
});
