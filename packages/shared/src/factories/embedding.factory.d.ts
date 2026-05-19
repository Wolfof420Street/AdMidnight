/**
 * EmbeddingFactory — centralised place for all embedding/centroid generation.
 * DRY: previously duplicated in AdvertiserService and the Next.js campaign wizard.
 *
 * SRP: one class, one concern — producing embedding vectors.
 */
export declare class EmbeddingFactory {
    static readonly DIMENSIONS = 128;
    /**
     * Generate a random centroid for mock/testing.
     * In production: this comes from a trained segmentation model.
     */
    static generateRandomCentroid(dimensions?: number): number[];
    /**
     * Normalise a centroid vector to unit length (required before ZK circuit comparison).
     * The circuit's cosine similarity computation requires unit-norm inputs for numeric stability.
     */
    static normalise(embedding: number[]): number[];
    /**
     * Validate that a centroid is the right dimensionality.
     */
    static validate(centroid: unknown): centroid is number[];
}
//# sourceMappingURL=embedding.factory.d.ts.map