# API Extensions voor Mobile App - AiQuizMaker

## 🔌 Nieuwe API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
```typescript
// Request
{
  email: string;
  password?: string; // Optional voor social auth
  provider?: 'google' | 'apple' | 'email';
  providerToken?: string;
  username: string;
  preferences?: {
    notifications: boolean;
    newsletter: boolean;
    language: string;
  };
}

// Response
{
  user: {
    id: string;
    email: string;
    username: string;
    createdAt: Date;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

#### POST /api/auth/login
```typescript
// Request
{
  email?: string;
  username?: string;
  password: string;
  deviceId: string;
  deviceInfo?: {
    platform: 'ios' | 'android';
    version: string;
    model: string;
  };
}

// Response
{
  user: User;
  tokens: AuthTokens;
  subscription: SubscriptionStatus;
}
```

#### POST /api/auth/refresh
```typescript
// Request
{
  refreshToken: string;
}

// Response
{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

#### POST /api/auth/logout
```typescript
// Request
{
  refreshToken: string;
  deviceId: string;
}

// Response
{
  success: boolean;
}
```

### User Profile Endpoints

#### GET /api/user/profile
```typescript
// Response
{
  id: string;
  username: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  totalQuizzes: number;
  subscription: {
    type: 'free' | 'student' | 'pro';
    validUntil?: Date;
    quizzesRemaining?: number;
  };
  stats: {
    streak: number;
    longestStreak: number;
    totalQuestionsAnswered: number;
    averageScore: number;
    studyTime: number; // minutes
  };
  achievements: Achievement[];
  preferences: UserPreferences;
}
```

#### PUT /api/user/profile
```typescript
// Request
{
  username?: string;
  avatar?: string; // base64 or URL
  preferences?: {
    notifications?: boolean;
    soundEffects?: boolean;
    haptics?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
  };
}

// Response
{
  user: UpdatedUser;
}
```

#### DELETE /api/user/account
```typescript
// Request
{
  password: string;
  reason?: string;
}

// Response
{
  success: boolean;
  deleteDate: Date; // 30 dagen grace period
}
```

### Gamification Endpoints

#### GET /api/user/stats
```typescript
// Response
{
  daily: {
    quizzesCreated: number;
    quizzesPlayed: number;
    xpEarned: number;
    perfectScores: number;
  };
  weekly: {
    quizzesCreated: number;
    quizzesPlayed: number;
    xpEarned: number;
    rank: number;
    rankChange: number;
  };
  allTime: {
    quizzesCreated: number;
    quizzesPlayed: number;
    totalXP: number;
    level: number;
    nextLevelXP: number;
    rank: number;
  };
  subjects: {
    [subject: string]: {
      quizzes: number;
      averageScore: number;
      mastery: number; // 0-100
    };
  };
}
```

#### GET /api/user/achievements
```typescript
// Response
{
  unlocked: [
    {
      id: string;
      name: string;
      description: string;
      icon: string;
      unlockedAt: Date;
      xpReward: number;
      rarity: 'common' | 'rare' | 'epic' | 'legendary';
    }
  ];
  inProgress: [
    {
      id: string;
      name: string;
      description: string;
      progress: number; // 0-100
      target: number;
      current: number;
    }
  ];
  locked: Achievement[];
}
```

#### POST /api/user/claim-reward
```typescript
// Request
{
  type: 'daily' | 'achievement' | 'milestone';
  id?: string;
}

// Response
{
  rewards: {
    xp?: number;
    coins?: number;
    items?: string[];
  };
  nextClaimTime?: Date;
}
```

### Social Features Endpoints

#### GET /api/leaderboard
```typescript
// Query params
{
  type: 'global' | 'friends' | 'university';
  period: 'daily' | 'weekly' | 'monthly' | 'alltime';
  limit?: number;
  offset?: number;
}

// Response
{
  leaderboard: [
    {
      rank: number;
      userId: string;
      username: string;
      avatar: string;
      score: number;
      level: number;
      change: number; // Position change
      isCurrentUser: boolean;
    }
  ];
  currentUser: {
    rank: number;
    score: number;
    percentile: number;
  };
}
```

#### POST /api/social/add-friend
```typescript
// Request
{
  username?: string;
  userId?: string;
  qrCode?: string;
}

// Response
{
  friend: User;
  status: 'pending' | 'accepted';
}
```

#### GET /api/social/friends
```typescript
// Response
{
  friends: [
    {
      id: string;
      username: string;
      avatar: string;
      level: number;
      lastActive: Date;
      currentStreak: number;
      status: 'online' | 'offline';
    }
  ];
  pending: FriendRequest[];
}
```

#### POST /api/social/challenge
```typescript
// Request
{
  friendId: string;
  quizId: string;
  type: 'quick' | 'daily' | 'weekly';
  wager?: {
    xp?: number;
    coins?: number;
  };
}

// Response
{
  challenge: {
    id: string;
    status: 'pending' | 'active' | 'completed';
    expiresAt: Date;
  };
}
```

### Subscription Endpoints

#### GET /api/subscription/plans
```typescript
// Response
{
  plans: [
    {
      id: string;
      name: string;
      price: number;
      currency: string;
      interval: 'monthly' | 'yearly';
      features: string[];
      popularBadge?: boolean;
      savings?: string;
    }
  ];
  currentPlan?: {
    id: string;
    validUntil: Date;
    autoRenew: boolean;
  };
}
```

#### POST /api/subscription/create
```typescript
// Request
{
  planId: string;
  paymentMethod: 'iap' | 'stripe';
  receipt?: string; // Voor IAP
  paymentIntentId?: string; // Voor Stripe
}

// Response
{
  subscription: {
    id: string;
    status: 'active' | 'pending';
    validUntil: Date;
    plan: Plan;
  };
}
```

#### POST /api/subscription/cancel
```typescript
// Request
{
  reason?: string;
  feedback?: string;
}

// Response
{
  cancelDate: Date;
  validUntil: Date;
  winBackOffer?: {
    discount: number;
    validFor: number; // days
  };
}
```

### Quiz Endpoints (Extended)

#### POST /api/quiz/create
```typescript
// Request (met user context)
{
  file: File;
  title?: string;
  settings?: {
    language: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionCount?: number;
    questionTypes?: string[];
  };
  isPublic?: boolean;
  tags?: string[];
}

// Response
{
  quiz: Quiz;
  processingTime: number;
  creditsUsed?: number;
  monthlyQuotaRemaining?: number;
}
```

#### GET /api/quiz/user-quizzes
```typescript
// Query params
{
  limit?: number;
  offset?: number;
  sort?: 'recent' | 'popular' | 'score';
  filter?: 'created' | 'played' | 'favorited';
}

// Response
{
  quizzes: [
    {
      id: string;
      title: string;
      questionCount: number;
      playCount: number;
      averageScore: number;
      createdAt: Date;
      lastPlayed?: Date;
      personalBestScore?: number;
      thumbnail?: string;
    }
  ];
  total: number;
}
```

#### POST /api/quiz/{id}/complete
```typescript
// Request
{
  score: number;
  timeSpent: number; // seconds
  answers: {
    questionId: string;
    answer: string;
    correct: boolean;
    timeSpent: number;
  }[];
}

// Response
{
  results: {
    score: number;
    rank: number; // Among all players
    xpEarned: number;
    coinsEarned: number;
    newAchievements?: Achievement[];
    streakMaintained: boolean;
    personalBest: boolean;
  };
  stats: {
    totalPlayers: number;
    averageScore: number;
    yourPercentile: number;
  };
}
```

### Analytics Endpoints

#### POST /api/analytics/event
```typescript
// Request
{
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  sessionId: string;
}

// Response
{
  success: boolean;
}
```

#### POST /api/analytics/batch
```typescript
// Request
{
  events: AnalyticsEvent[];
  deviceInfo: DeviceInfo;
}

// Response
{
  processed: number;
  failed: number;
}
```

## 🔒 Security Considerations

### Authentication Headers
```typescript
// All authenticated requests
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'X-Device-ID': deviceId,
  'X-App-Version': appVersion,
  'X-Platform': 'ios' | 'android'
}
```

### Rate Limiting
```typescript
// Rate limit headers in response
headers: {
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '95',
  'X-RateLimit-Reset': '1640995200'
}

// Premium users get higher limits
const rateLimits = {
  free: { requests: 100, window: '1h' },
  student: { requests: 500, window: '1h' },
  pro: { requests: 2000, window: '1h' }
};
```

### Error Responses
```typescript
// Standardized error format
{
  error: {
    code: string; // 'AUTH_FAILED', 'QUOTA_EXCEEDED', etc.
    message: string;
    details?: any;
    retryAfter?: number; // seconds
  };
  timestamp: Date;
  requestId: string;
}
```

## 🚀 WebSocket Events

### Real-time Quiz Generation
```typescript
// Client -> Server
socket.emit('quiz:generate:start', { fileId, settings });

// Server -> Client
socket.on('quiz:generate:progress', { stage, progress, message });
socket.on('quiz:generate:question', { question, index, total });
socket.on('quiz:generate:complete', { quizId, totalQuestions });
socket.on('quiz:generate:error', { error, canRetry });
```

### Live Challenges
```typescript
// Battle events
socket.on('challenge:invite', { from, quiz, expires });
socket.on('challenge:accepted', { challengeId, startTime });
socket.on('challenge:question', { question, timeLimit });
socket.on('challenge:opponent:answered', { correct, score });
socket.on('challenge:complete', { winner, scores, rewards });
```

### Social Presence
```typescript
// Friend activity
socket.on('friend:online', { userId, username });
socket.on('friend:offline', { userId });
socket.on('friend:playing', { userId, quizTitle });
socket.on('friend:achievement', { userId, achievement });
```