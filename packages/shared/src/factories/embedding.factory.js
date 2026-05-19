"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingFactory = void 0;
/**
 * EmbeddingFactory — centralised place for all embedding/centroid generation.
 * DRY: previously duplicated in AdvertiserService and the Next.js campaign wizard.
 *
 * SRP: one class, one concern — producing embedding vectors.
 */
class EmbeddingFactory {
    static DIMENSIONS = 128;
    /**
     * Generate a random centroid for mock/testing.
     * In production: this comes from a trained segmentation model.
     */
    static generateRandomCentroid(dimensions = this.DIMENSIONS) {
        return Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
    }
    /**
     * Normalise a centroid vector to unit length (required before ZK circuit comparison).
     * The circuit's cosine similarity computation requires unit-norm inputs for numeric stability.
     */
    static normalise(embedding) {
        const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
        if (norm === 0)
            throw new Error('Cannot normalise zero vector');
        return embedding.map(v => v / norm);
    }
    /**
     * Validate that a centroid is the right dimensionality.
     */
    static validate(centroid) {
        return (Array.isArray(centroid) &&
            centroid.length === this.DIMENSIONS &&
            centroid.every(v => typeof v === 'number' && isFinite(v)));
    }
}
exports.EmbeddingFactory = EmbeddingFactory;
//# sourceMappingURL=embedding.factory.js.map