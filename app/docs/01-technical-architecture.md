# Technische Architectuur - AiQuizMaker App

## 🏗️ Tech Stack

### Frontend (Mobile App)
```
├── React Native (0.72+)
├── Expo SDK (49+)
├── TypeScript
├── React Navigation 6
├── React Query (data fetching & caching)
├── Zustand (state management)
├── React Hook Form (forms)
├── Expo SecureStore (secure storage)
└── React Native Reanimated 3 (animations)
```

### Backend Integraties
- Bestaande NestJS API (uitgebreid met auth endpoints)
- WebSocket support voor real-time quiz generatie
- Firebase Auth voor gebruikersbeheer
- Stripe API voor betalingen
- RevenueCat voor in-app purchases

### Development Tools
```
├── Expo EAS Build (cloud builds)
├── Expo EAS Submit (app store submissions)
├── Sentry (error tracking)
├── Mixpanel (analytics)
├── CodePush (OTA updates)
└── Flipper (debugging)
```

## 📐 App Architectuur

### Folder Structure
```
app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API & external services
│   ├── store/              # Global state management
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Helper functions
│   ├── types/              # TypeScript types
│   └── constants/          # App constants
├── assets/                 # Images, fonts, etc.
├── app.json               # Expo configuration
└── eas.json               # EAS Build configuration
```

### Key Architectural Decisions

#### 1. **Expo Managed Workflow**
- Snellere development cycle
- OTA updates mogelijk
- Toegang tot native features via Expo SDK
- Makkelijkere maintenance

#### 2. **Offline-First Architecture**
```typescript
// Local SQLite database voor offline support
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('aiquizmaker.db');

// Sync strategie
- Queue offline actions
- Sync when online
- Conflict resolution
```

#### 3. **Authentication Flow**
```typescript
// Multi-provider auth via Firebase
- Email/Password
- Google Sign-In
- Apple Sign-In (iOS)
- Biometric authentication

// Token management
- Secure token storage
- Auto-refresh tokens
- Session management
```

#### 4. **State Management Pattern**
```typescript
// Zustand stores structure
stores/
├── authStore.ts        # User authentication state
├── quizStore.ts        # Quiz data & operations
├── subscriptionStore.ts # Premium status
├── gamificationStore.ts # Points, badges, streaks
└── settingsStore.ts    # User preferences
```

## 🔌 API Integration Layer

### Extended API Endpoints
```typescript
// New endpoints for mobile app
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/user/profile
PUT    /api/user/profile
GET    /api/user/subscription
POST   /api/subscription/create
DELETE /api/subscription/cancel
GET    /api/user/stats
GET    /api/user/achievements
POST   /api/quiz/create (with user context)
GET    /api/quiz/user-quizzes
POST   /api/social/challenge
GET    /api/leaderboard
```

### API Client Configuration
```typescript
// Axios interceptor for auth
import axios from 'axios';
import { authStore } from '@/store/authStore';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await authStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Retry logic for failed requests
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      await authStore.refreshToken();
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);
```

## 🔐 Security Considerations

### Data Protection
- **Expo SecureStore** voor gevoelige data (tokens, credentials)
- **SSL Certificate Pinning** voor API communicatie
- **Obfuscation** van JavaScript code in productie
- **ProGuard/R8** voor Android builds

### Authentication Security
```typescript
// Biometric authentication
import * as LocalAuthentication from 'expo-local-authentication';

const authenticateWithBiometrics = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (hasHardware && isEnrolled) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock AiQuizMaker',
      fallbackLabel: 'Use passcode',
    });
    return result.success;
  }
  return false;
};
```

## 🚀 Performance Optimizations

### 1. **Image Optimization**
- WebP format voor kleinere bestandsgrootte
- Lazy loading met `expo-image`
- Caching strategy voor PDF previews

### 2. **Bundle Size Optimization**
- Tree shaking enabled
- Dynamic imports voor grote libraries
- Asset optimization pipeline

### 3. **Memory Management**
```typescript
// Quiz data pagination
const QUIZ_PAGE_SIZE = 10;

// Image cache limits
Image.getCacheSize();
Image.clearCache();

// Navigation stack limits
navigation.popToTop();
```

### 4. **Network Optimization**
- Request batching
- GraphQL voor efficiënte data fetching (future)
- CDN voor static assets

## 📱 Platform-Specific Features

### iOS
- Apple Sign-In
- Haptic feedback
- SF Symbols
- iOS-specific animations

### Android
- Material Design 3
- Google Sign-In
- Android-specific permissions
- Adaptive icons

## 🧪 Testing Strategy

```typescript
// Testing stack
├── Jest (unit tests)
├── React Native Testing Library
├── Detox (E2E tests)
└── Maestro (UI testing)

// Test coverage targets
- Unit tests: 80%
- Integration tests: 60%
- E2E tests: Critical paths
```

## 📊 Monitoring & Analytics

### Crash Reporting (Sentry)
```typescript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: false,
  debug: __DEV__,
});
```

### User Analytics (Mixpanel)
```typescript
// Track key events
- App opened
- Quiz created
- Quiz completed
- Subscription started
- Achievement unlocked
- Social share
```

### Performance Monitoring
- API response times
- Screen load times
- JS bundle load time
- Memory usage alerts