# AI Quiz Maker Mobile App

Flutter mobile application for AI Quiz Maker that provides a native mobile experience for creating and taking AI-generated quizzes from PDF documents.

## 🚀 Features

- **Native Mobile Experience**: Optimized for iOS and Android
- **PDF Upload**: Camera integration for document scanning
- **Offline Quiz Taking**: Download quizzes for offline use
- **Push Notifications**: Quiz reminders and updates
- **Touch-Optimized UI**: Intuitive mobile interface
- **Cross-Platform**: Single codebase for iOS and Android

## 🛠️ Tech Stack

- **Framework**: Flutter
- **Language**: Dart
- **State Management**: Provider/Riverpod
- **Storage**: Hive/SQLite
- **HTTP Client**: Dio
- **UI**: Material Design 3

## 📁 Project Structure

```
mobile_app/
├── lib/
│   ├── main.dart              # App entry point
│   ├── models/                # Data models
│   ├── services/              # API and storage services
│   ├── screens/               # App screens
│   ├── widgets/               # Reusable widgets
│   ├── providers/             # State management
│   ├── composables/           # Business logic
│   └── utils/                 # Utility functions
├── android/                   # Android-specific files
├── ios/                       # iOS-specific files
├── assets/                    # Static assets
└── test/                      # Test files
```

## 🚀 Getting Started

### Prerequisites

- Flutter SDK 3.0+
- Dart SDK 3.0+
- Android Studio / Xcode
- Android/iOS device or emulator

### Installation

1. **Install Flutter**:
   Follow the [Flutter installation guide](https://docs.flutter.dev/get-started/install)

2. **Clone and setup**:
   ```bash
   cd mobile_app
   flutter pub get
   ```

3. **Configure API endpoint**:
   Edit `lib/utils/constants.dart`:
   ```dart
   const String API_BASE_URL = 'https://your-api-url.run.app';
   ```

### Running the App

```bash
# Check Flutter setup
flutter doctor

# Run on connected device/emulator
flutter run

# Run on specific platform
flutter run -d android
flutter run -d ios
```

### Building for Production

```bash
# Android APK
flutter build apk

# Android App Bundle
flutter build appbundle

# iOS
flutter build ios
```

## 📱 Development Status

**Current Status**: Work in Progress

### Completed Features
- [x] Project structure setup
- [x] Basic navigation
- [x] API service integration
- [x] File upload composable
- [x] Quiz interaction composable

### In Progress
- [ ] UI/UX implementation
- [ ] Offline storage
- [ ] Push notifications
- [ ] Camera integration
- [ ] Quiz sharing

### Planned Features
- [ ] Biometric authentication
- [ ] Dark/Light theme
- [ ] Multiple language support
- [ ] Quiz analytics
- [ ] Social sharing

## 🧪 Testing

```bash
# Unit tests
flutter test

# Integration tests
flutter test integration_test/

# Widget tests
flutter test test/widget_test.dart
```

## 📦 Dependencies

Key dependencies in `pubspec.yaml`:
- `http` - API communication
- `provider` - State management
- `shared_preferences` - Local storage
- `file_picker` - File selection
- `image_picker` - Camera integration

## 🚀 Deployment

### Android
1. Build APK/AAB
2. Upload to Google Play Console
3. Follow Play Store guidelines

### iOS
1. Build for iOS
2. Upload to App Store Connect
3. Follow App Store guidelines

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Documentation

- [Main Project README](../README.md)
- [API Documentation](../api/README.md)
- [Web App Documentation](../web/README.md)
- [Infrastructure Documentation](../terraform/README.md)
