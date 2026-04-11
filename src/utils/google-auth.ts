import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_TOKEN_KEY = 'ken_talk_google_token';
const GOOGLE_CLIENT_ID_KEY = 'ken_talk_google_client_id';

// Google OAuth scopes
const SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive.file',
];

export async function getGoogleClientId(): Promise<string | null> {
  return AsyncStorage.getItem(GOOGLE_CLIENT_ID_KEY);
}

export async function saveGoogleClientId(clientId: string): Promise<void> {
  await AsyncStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId);
}

export async function getGoogleToken(): Promise<string | null> {
  const stored = await AsyncStorage.getItem(GOOGLE_TOKEN_KEY);
  if (!stored) return null;
  try {
    const { token, expiresAt } = JSON.parse(stored);
    if (Date.now() > expiresAt) {
      await AsyncStorage.removeItem(GOOGLE_TOKEN_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

async function saveGoogleToken(token: string, expiresIn: number): Promise<void> {
  await AsyncStorage.setItem(
    GOOGLE_TOKEN_KEY,
    JSON.stringify({ token, expiresAt: Date.now() + expiresIn * 1000 })
  );
}

export async function signInWithGoogle(): Promise<string> {
  const clientId = await getGoogleClientId();
  if (!clientId) {
    throw new Error('請先到設定頁面輸入 Google Client ID');
  }

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'ken-talk',
    path: 'auth',
  });

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: SCOPES,
    redirectUri,
    responseType: AuthSession.ResponseType.Token,
    usePKCE: false,
  });

  const result = await request.promptAsync(discovery);

  if (result.type === 'success' && result.authentication) {
    const { accessToken, expiresIn } = result.authentication;
    await saveGoogleToken(accessToken, expiresIn || 3600);
    return accessToken;
  }

  throw new Error('Google 登入失敗或被取消');
}

export async function signOutGoogle(): Promise<void> {
  await AsyncStorage.removeItem(GOOGLE_TOKEN_KEY);
}
