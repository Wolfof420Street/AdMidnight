# Flutter and plugin keep rules for R8
-dontwarn org.conscrypt.**
-dontwarn io.flutter.embedding.**
-keep class io.flutter.embedding.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugins.** { *; }

# Keep Kotlin metadata used by Flutter plugins.
-keep class kotlin.Metadata { *; }
