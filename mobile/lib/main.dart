import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'config/constants.dart';
import 'models/user.dart';
import 'screens/home_screen.dart';
import 'screens/phone_login_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Phone OTP Authentication',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          secondary: AppColors.accent,
        ),
        textTheme: GoogleFonts.interTextTheme(Theme.of(context).textTheme),
        scaffoldBackgroundColor: AppColors.background,
      ),
      home: const AuthSessionChecker(),
    );
  }
}

/// Checks secure storage for existing sessions on app launch
class AuthSessionChecker extends StatefulWidget {
  const AuthSessionChecker({super.key});

  @override
  State<AuthSessionChecker> createState() => _AuthSessionCheckerState();
}

class _AuthSessionCheckerState extends State<AuthSessionChecker> {
  final _apiService = ApiService();
  bool _checkingSession = true;
  User? _currentUser;

  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  Future<void> _checkSession() async {
    try {
      final user = await _apiService.getCurrentUser();
      if (mounted) {
        setState(() {
          _currentUser = user;
          _checkingSession = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _checkingSession = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Show a clean loading splash screen while verifying JWT
    if (_checkingSession) {
      return Scaffold(
        backgroundColor: AppColors.primary,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(
                height: 48,
                width: 48,
                child: CircularProgressIndicator(
                  strokeWidth: 3.0,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Securing Connection...',
                style: GoogleFonts.outfit(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Redirect to home if token is valid, otherwise show login screen
    if (_currentUser != null) {
      return HomeScreen(user: _currentUser!);
    } else {
      return const PhoneLoginScreen();
    }
  }
}
