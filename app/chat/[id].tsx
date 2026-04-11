import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Message, Discussion, Attachment } from '../../src/types';
import { getDiscussions, saveDiscussion } from '../../src/utils/storage';
import { sendToKen } from '../../src/utils/ken-ai';
import { readGoogleSlides } from '../../src/utils/google-slides-reader';
import { ChatBubble } from '../../src/components/ChatBubble';
import { ChatInput } from '../../src/components/ChatInput';
import { COLORS, SPACING } from '../../src/constants/theme';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadDiscussion();
  }, [id]);

  useEffect(() => {
    navigation.setOptions({
      title: discussion?.title || '跟 Ken 聊聊',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleGeneratePPT}
          style={styles.headerBtn}
          disabled={messages.length < 2}
        >
          <Ionicons
            name="easel-outline"
            size={22}
            color={messages.length < 2 ? COLORS.textMuted : COLORS.primaryLight}
          />
        </TouchableOpacity>
      ),
    });
  }, [discussion, messages]);

  const loadDiscussion = async () => {
    const discussions = await getDiscussions();
    const found = discussions.find((d) => d.id === id);
    if (found) {
      setDiscussion(found);
      setMessages(found.messages);
    }
  };

  const handleSend = async (text: string, attachments?: Attachment[]) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    // 自動生成標題（第一則訊息）
    let title = discussion?.title || '新討論';
    if (messages.length === 0) {
      title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    }

    try {
      // Build message with attachment context
      let msgForKen = text;
      if (attachments?.length) {
        const parts: string[] = [];
        for (const a of attachments) {
          if (a.type === 'image') {
            parts.push('[用戶附上了一張圖片]');
          } else if (a.type === 'google-slide') {
            try {
              const slideContent = await readGoogleSlides(a.uri);
              parts.push(`[用戶分享了 Google Slides，以下是簡報內容]\n${slideContent}`);
            } catch {
              parts.push(`[用戶分享了 Google Slides: ${a.uri}]`);
            }
          }
        }
        msgForKen = `${parts.join('\n')}\n${text}`;
      }
      const response = await sendToKen(msgForKen, messages);

      const kenMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ken',
        content: response.content,
        narration: response.narration,
        timestamp: Date.now(),
      };

      const allMessages = [...updatedMessages, kenMsg];
      setMessages(allMessages);

      const updatedDiscussion: Discussion = {
        id: id!,
        title,
        messages: allMessages,
        createdAt: discussion?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      setDiscussion(updatedDiscussion);
      await saveDiscussion(updatedDiscussion);
    } catch (err) {
      Alert.alert('錯誤', '無法取得 Ken 的回覆');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePPT = () => {
    if (messages.length < 2) {
      Alert.alert('討論太少', '至少聊幾句再生成簡報吧');
      return;
    }
    router.push(`/presentation/${id}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👔</Text>
            <Text style={styles.emptyTitle}>準備跟 Ken 討論</Text>
            <Text style={styles.emptyHint}>
              直接說你想討論的事{'\n'}Ken 會用他的方式回你
            </Text>
          </View>
        }
      />
      {messages.length >= 2 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.pptBar}
            onPress={handleGeneratePPT}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={styles.pptBarText}>一鍵產出簡報</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.strategyBar}
            onPress={() => router.push(`/strategy/${id}`)}
            activeOpacity={0.8}
          >
            <Ionicons name="bulb-outline" size={16} color="#fff" />
            <Text style={styles.pptBarText}>溝通策略</Text>
          </TouchableOpacity>
        </View>
      )}
      <ChatInput onSend={handleSend} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  messageList: {
    paddingVertical: SPACING.md,
    flexGrow: 1,
  },
  headerBtn: {
    padding: SPACING.sm,
    marginRight: SPACING.xs,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 1,
  },
  pptBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.xs,
  },
  strategyBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F5496',
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.xs,
  },
  pptBarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
