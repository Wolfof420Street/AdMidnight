/// DeriveEmbeddingUseCase — derives stable embedding from user profile.
/// Pure business logic; no Flutter dependencies.
library derive_embedding_usecase;

import 'dart:math';

class DeriveEmbeddingUseCase {
  List<double> call({
    required String updatedAtIso,
    required List<String> topCategories,
    required double engagementScore,
    required int embeddingDimensions,
  }) {
    final seed = '$updatedAtIso|${topCategories.join(',')}|${engagementScore.toStringAsFixed(6)}';
    final len = embeddingDimensions;
    final chars = seed.codeUnits;
    final raw = List<double>.generate(len, (i) {
      final c = chars[i % chars.length];
      // Deterministic pseudo-random value based on char code and index
      final v = ((c * (i + 137)) % 1000) / 500.0 - 1.0; // range approx [-1,1]
      return v.toDouble();
    });

    // Normalize to unit vector
    double norm = 0.0;
    for (final v in raw) {
      norm += v * v;
    }
    if (norm == 0.0) {
      norm = 1.0;
    } else {
      norm = sqrt(norm);
    }
    return raw.map((v) => v / norm).toList();
  }
}
