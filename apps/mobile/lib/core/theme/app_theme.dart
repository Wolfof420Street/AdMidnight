import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color midnight = Color(0xFF0A0E1A);
  static const Color midnightCard = Color(0xFF111827);
  static const Color accent = Color(0xFF00F5D4);
  static const Color proofPurple = Color(0xFF7C3AED);
  static const Color textSecondary = Color(0xFF6B7280);

  static ThemeData get darkTheme => ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: midnight,
        colorScheme: const ColorScheme.dark(
          primary: accent,
          secondary: proofPurple,
          surface: midnightCard,
        ),
        textTheme: GoogleFonts.syneTextTheme(
          ThemeData.dark().textTheme,
        ).apply(bodyColor: Colors.white, displayColor: Colors.white),
        cardTheme: CardThemeData(
          color: midnightCard,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          elevation: 0,
        ),
      );
}
