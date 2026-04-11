import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  Text,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Attachment } from '../types';
import { COLORS, SPACING } from '../constants/theme';

interface Props {
  onSend: (text: string, attachments?: Attachment[]) => void;
  loading: boolean;
}

const GOOGLE_SLIDE_REGEX = /https:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/;

export function ChatInput({ onSend, loading }: Props) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Detect Google Slides link when text changes
  useEffect(() => {
    const match = text.match(GOOGLE_SLIDE_REGEX);
    if (match) {
      const url = match[0];
      const slideId = match[1];
      // Don't add duplicate
      if (!attachments.some(a => a.uri === url)) {
        setAttachments(prev => [...prev, {
          type: 'google-slide',
          uri: url,
          name: 'Google Slides',
          thumbnailUri: `https://lh3.googleusercontent.com/d/${slideId}=w400`,
        }]);
      }
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || loading) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setText('');
    setAttachments([]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAttachments(prev => [...prev, {
        type: 'image',
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
      }]);
    }
  };

  const handlePaste = (e: any) => {
    if (Platform.OS !== 'web') return;
    const clipboardData = e.nativeEvent?.clipboardData || (e as any).clipboardData;
    if (!clipboardData) return;

    // Check for pasted images
    const items = clipboardData.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string;
              setAttachments(prev => [...prev, {
                type: 'image',
                uri: dataUrl,
                name: file.name || 'pasted-image.png',
              }]);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const hasContent = text.trim() || attachments.length > 0;

  // Web drag & drop
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setAttachments(prev => [...prev, {
              type: 'image',
              uri: ev.target?.result as string,
              name: files[i].name,
            }]);
          };
          reader.readAsDataURL(files[i]);
        }
      }
    };
    const prevent = (e: DragEvent) => e.preventDefault();
    document.addEventListener('drop', handler);
    document.addEventListener('dragover', prevent);
    return () => {
      document.removeEventListener('drop', handler);
      document.removeEventListener('dragover', prevent);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Attachment preview */}
      {attachments.length > 0 && (
        <ScrollView horizontal style={styles.attachRow} showsHorizontalScrollIndicator={false}>
          {attachments.map((att, i) => (
            <View key={i} style={styles.attachItem}>
              {att.type === 'image' ? (
                <Image source={{ uri: att.uri }} style={styles.attachThumb} />
              ) : (
                <View style={styles.slideThumb}>
                  <Ionicons name="easel" size={18} color={COLORS.primary} />
                  <Text style={styles.slideLabel} numberOfLines={1}>Google Slides</Text>
                </View>
              )}
              <TouchableOpacity style={styles.attachRemove} onPress={() => removeAttachment(i)}>
                <Ionicons name="close-circle" size={18} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.inputRow}>
        {/* Image button */}
        <TouchableOpacity style={styles.iconBtn} onPress={pickImage} disabled={loading}>
          <Ionicons name="image-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="輸入訊息、貼圖片或 Google Slides 連結..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={4000}
          onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
          blurOnSubmit={Platform.OS !== 'web'}
          {...(Platform.OS === 'web' ? { onPaste: handlePaste } as any : {})}
        />

        {/* Send */}
        <TouchableOpacity
          style={[styles.sendBtn, (!hasContent || loading) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!hasContent || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.text} />
          ) : (
            <Ionicons name="send" size={20} color={COLORS.text} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachRow: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  attachItem: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  attachThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
  },
  slideThumb: {
    width: 80,
    height: 64,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  slideLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  attachRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
