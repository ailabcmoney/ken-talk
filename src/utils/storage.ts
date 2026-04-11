import AsyncStorage from '@react-native-async-storage/async-storage';
import { Discussion } from '../types';

const DISCUSSIONS_KEY = 'ken_talk_discussions';
const API_KEY_KEY = 'ken_talk_api_key';
const KEN_PROMPT_KEY = 'ken_talk_ken_prompt';
const PPT_PROMPT_KEY = 'ken_talk_ppt_prompt';

export async function getDiscussions(): Promise<Discussion[]> {
  const data = await AsyncStorage.getItem(DISCUSSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveDiscussion(discussion: Discussion): Promise<void> {
  const discussions = await getDiscussions();
  const idx = discussions.findIndex((d) => d.id === discussion.id);
  if (idx >= 0) {
    discussions[idx] = discussion;
  } else {
    discussions.unshift(discussion);
  }
  await AsyncStorage.setItem(DISCUSSIONS_KEY, JSON.stringify(discussions));
}

export async function deleteDiscussion(id: string): Promise<void> {
  const discussions = await getDiscussions();
  const filtered = discussions.filter((d) => d.id !== id);
  await AsyncStorage.setItem(DISCUSSIONS_KEY, JSON.stringify(filtered));
}

export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(API_KEY_KEY);
}

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(API_KEY_KEY, key);
}

export async function getKenPrompt(): Promise<string | null> {
  return AsyncStorage.getItem(KEN_PROMPT_KEY);
}

export async function saveKenPrompt(prompt: string): Promise<void> {
  await AsyncStorage.setItem(KEN_PROMPT_KEY, prompt);
}

export async function getPptPrompt(): Promise<string | null> {
  return AsyncStorage.getItem(PPT_PROMPT_KEY);
}

export async function savePptPrompt(prompt: string): Promise<void> {
  await AsyncStorage.setItem(PPT_PROMPT_KEY, prompt);
}

export async function clearPptPrompt(): Promise<void> {
  await AsyncStorage.removeItem(PPT_PROMPT_KEY);
}

export async function clearKenPrompt(): Promise<void> {
  await AsyncStorage.removeItem(KEN_PROMPT_KEY);
}
