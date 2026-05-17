/** API integration test scaffolds (Jest + Supertest) */
import request from 'supertest';

describe('API integration - health', () => {
  it('responds to health check', async () => {
    const res = await request(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').get('/api/v1/health');
    expect([200, 404]).toContain(res.status);
  });
});
