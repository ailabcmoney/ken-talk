import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../types';
import { COLORS, SPACING } from '../constants/theme';

interface Props {
  message: Message;
}

export function ChatBubble({ message }: Props) {
  const isKen = message.role === 'ken';
  const hasAttachments = message.attachments && message.attachments.length > 0;

  const openLink = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={[styles.container, isKen ? styles.kenContainer : styles.userContainer]}>
      {isKen && message.narration ? (
        <Text style={styles.narration}>{message.narration}</Text>
      ) : null}

      <View style={[styles.bubble, isKen ? styles.kenBubble : styles.userBubble]}>
        {isKen && <Text style={styles.name}>Ken</Text>}

        {/* Attachments */}
        {hasAttachments && (
          <View style={styles.attachments}>
            {message.attachments!.map((att, i) => (
              <View key={i}>
                {att.type === 'image' ? (
                  <Image source={{ uri: att.uri }} style={styles.attachImage} resizeMode="cover" />
                ) : (
                  <TouchableOpacity
                    style={styles.slideCard}
                    onPress={() => openLink(att.uri)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.slideCardIcon}>
                      <Ionicons name="easel" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.slideCardInfo}>
                      <Text style={styles.slideCardTitle}>{att.name || 'Google Slides'}</Text>
                      <Text style={styles.slideCardUrl} numberOfLines={1}>{att.uri}</Text>
                    </View>
                    <Ionicons name="open-outline" size={14} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {message.content ? (
          <Text style={[styles.content, isKen ? styles.kenText : styles.userText]}>
            {message.content}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.time, isKen ? styles.timeLeft : styles.timeRight]}>
        {new Date(message.timestamp).toLocaleTimeString('zh-TW', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  kenContainer: {
    alignItems: 'flex-start',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  narration: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    maxWidth: '85%',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 18,
  },
  kenBubble: {
    backgroundColor: COLORS.kenBubble,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderTopRightRadius: 4,
  },
  name: {
    fontSize: 11,
    color: COLORS.primaryLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
  },
  kenText: {
    color: COLORS.text,
  },
  userText: {
    color: '#ffffff',
  },
  // Attachments
  attachments: {
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  attachImage: {
    width: 220,
    height: 160,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
  },
  slideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: SPACING.sm + 2,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slideCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideCardInfo: {
    flex: 1,
  },
  slideCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  slideCardUrl: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  // Time
  time: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    paddingHorizontal: SPACING.sm,
  },
  timeLeft: {
    alignSelf: 'flex-start',
  },
  timeRight: {
    alignSelf: 'flex-end',
  },
});
