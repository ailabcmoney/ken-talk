import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Discussion } from '../src/types';
import { getDiscussions, deleteDiscussion, saveDiscussion } from '../src/utils/storage';
import { DiscussionItem } from '../src/components/DiscussionItem';
import { COLORS, SPACING } from '../src/constants/theme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

function AnimatedHero({ onStart }: { onStart: () => void }) {
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const slideTitle = useRef(new Animated.Value(30)).current;
  const fadeSubtitle = useRef(new Animated.Value(0)).current;
  const slideSubtitle = useRef(new Animated.Value(20)).current;
  const fadeAvatar = useRef(new Animated.Value(0)).current;
  const scaleAvatar = useRef(new Animated.Value(0.8)).current;
  const fadeFeatures = useRef(new Animated.Value(0)).current;
  const slideFeatures = useRef(new Animated.Value(40)).current;
  const fadeBtn = useRef(new Animated.Value(0)).current;
  const scaleBtn = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Avatar entrance
      Animated.parallel([
        Animated.timing(fadeAvatar, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAvatar, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
      // Title
      Animated.parallel([
        Animated.timing(fadeTitle, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideTitle, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]),
      // Subtitle
      Animated.parallel([
        Animated.timing(fadeSubtitle, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideSubtitle, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]),
      // Features
      Animated.parallel([
        Animated.timing(fadeFeatures, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideFeatures, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]),
      // Button
      Animated.parallel([
        Animated.timing(fadeBtn, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleBtn, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
    ]).start();

    // Continuous pulse on button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Glow ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const features = [
    { icon: 'chatbubbles', label: 'AI 模擬老闆對話' },
    { icon: 'easel', label: '一鍵生成簡報' },
    { icon: 'download', label: '下載 PPT' },
    { icon: 'logo-google', label: '存到 Google Slides' },
  ];

  return (
    <View style={heroStyles.container}>
      {/* Background decorations */}
      <View style={heroStyles.bgCircle1} />
      <View style={heroStyles.bgCircle2} />
      <View style={heroStyles.bgLine1} />
      <View style={heroStyles.bgLine2} />

      {/* Avatar with glow */}
      <Animated.View style={[heroStyles.avatarWrap, {
        opacity: fadeAvatar,
        transform: [{ scale: scaleAvatar }],
      }]}>
        <Animated.View style={[heroStyles.glowRing, {
          opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
          transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
        }]} />
        <Image
          source={require('../assets/ken-avatar.png')}
          style={heroStyles.avatar}
        />
      </Animated.View>

      {/* Title */}
      <Animated.View style={{
        opacity: fadeTitle,
        transform: [{ translateY: slideTitle }],
      }}>
        <Text style={heroStyles.title}>Ken Talk</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View style={{
        opacity: fadeSubtitle,
        transform: [{ translateY: slideSubtitle }],
      }}>
        <Text style={heroStyles.subtitle}>
          跟老闆討論想法，AI 幫你一鍵做出{'\n'}讓老闆 Buy-in 的專業簡報
        </Text>
      </Animated.View>

      {/* Features */}
      <Animated.View style={[heroStyles.features, {
        opacity: fadeFeatures,
        transform: [{ translateY: slideFeatures }],
      }]}>
        {features.map((f, i) => (
          <View key={i} style={heroStyles.featureItem}>
            <View style={heroStyles.featureIcon}>
              <Ionicons name={f.icon as any} size={20} color={COLORS.primary} />
            </View>
            <Text style={heroStyles.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* CTA Button */}
      <Animated.View style={{
        opacity: fadeBtn,
        transform: [{ scale: Animated.multiply(scaleBtn, pulseAnim) }],
      }}>
        <TouchableOpacity style={heroStyles.ctaBtn} onPress={onStart} activeOpacity={0.8}>
          <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
          <Text style={heroStyles.ctaText}>開始跟 Ken 討論</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Quote */}
      <Text style={heroStyles.quote}>
        「工作是最高級的娛樂」— Ken
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);

  useFocusEffect(
    useCallback(() => {
      getDiscussions().then(setDiscussions);
    }, [])
  );

  const handleNewChat = async () => {
    const newDiscussion: Discussion = {
      id: Date.now().toString(),
      title: '新討論',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveDiscussion(newDiscussion);
    router.push(`/chat/${newDiscussion.id}`);
  };

  const handleDelete = (id: string) => {
    Alert.alert('刪除討論', '確定要刪除這個討論嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          await deleteDiscussion(id);
          setDiscussions((prev) => prev.filter((d) => d.id !== id));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.open('/landing/index.html', '_self');
            }
          }}
          activeOpacity={0.7}
        >
          <Image
            source={require('../assets/ken-avatar.png')}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.title}>Ken Talk</Text>
            <Text style={styles.subtitle}>跟 Ken 討論，一鍵出簡報</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {discussions.length === 0 ? (
        <AnimatedHero onStart={handleNewChat} />
      ) : (
        <FlatList
          data={discussions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DiscussionItem
              discussion={item}
              onPress={() => router.push(`/chat/${item.id}`)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      {discussions.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleNewChat} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const heroStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.04,
    top: '10%',
    right: -60,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4ECDC4',
    opacity: 0.03,
    bottom: '15%',
    left: -40,
  },
  bgLine1: {
    position: 'absolute',
    width: 1,
    height: '40%',
    backgroundColor: COLORS.border,
    left: '20%',
    top: '5%',
    opacity: 0.3,
  },
  bgLine2: {
    position: 'absolute',
    width: 1,
    height: '30%',
    backgroundColor: COLORS.border,
    right: '15%',
    bottom: '10%',
    opacity: 0.2,
  },
  avatarWrap: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  title: {
    fontSize: isWeb ? 48 : 36,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: isWeb ? 2 : 1,
  },
  subtitle: {
    fontSize: isWeb ? 18 : 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: isWeb ? 28 : 22,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    maxWidth: 500,
  },
  featureItem: {
    alignItems: 'center',
    width: isWeb ? 110 : 80,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  quote: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: SPACING.xl,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl + 20,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  settingsBtn: {
    padding: SPACING.sm,
  },
  list: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
