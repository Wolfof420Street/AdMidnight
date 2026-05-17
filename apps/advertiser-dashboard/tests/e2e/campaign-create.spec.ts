import { expect, test } from '@playwright/test';

test('campaign creation triggers the backend call and shows proof-processing state', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill('advertiser@admidnight.local');
  await page.getByTestId('login-password').fill('admidnight-demo');
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL('/');

  await page.route('**/api/v1/advertiser/campaign/create', async (route) => {
    const request = route.request();
    expect(request.method()).toBe('POST');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'campaign-e2e-1',
          status: 'DRAFT',
          budgetMidnight: '10000',
          cpmBidMidnight: '500',
          creative: {
            title: 'Launch Week',
            description: 'Zero-knowledge verified campaign',
            imageUrl: 'https://cdn.example.com/ad.png',
            clickUrl: 'https://example.com',
            advertiserName: 'AdMidnight',
          },
          segment: {
            targetCategories: ['SPORTS', 'TECH'],
            similarityThreshold: 0.75,
          },
        },
        timestamp: new Date().toISOString(),
        requestId: 'e2e-create',
      }),
    });
  });

  await page.goto('/campaign/new');

  await page.getByRole('button', { name: 'SPORTS' }).click();
  await page.getByRole('button', { name: 'TECH' }).click();
  await page.getByTestId('campaign-continue').click();

  await page.getByTestId('campaign-title').fill('Launch Week');
  await page.getByTestId('campaign-description').fill('Zero-knowledge verified campaign');
  await page.getByTestId('campaign-imageUrl').fill('https://cdn.example.com/ad.png');
  await page.getByTestId('campaign-clickUrl').fill('https://example.com');
  await page.getByTestId('campaign-advertiserName').fill('AdMidnight');
  await page.getByTestId('campaign-continue').click();

  await page.getByTestId('campaign-budgetMidnight').fill('10000');
  await page.getByTestId('campaign-cpmBidMidnight').fill('500');
  await page.getByTestId('campaign-startTime').fill('2026-05-16');
  await page.getByTestId('campaign-endTime').fill('2026-05-30');
  await page.getByTestId('campaign-continue').click();

  const submitButton = page.getByTestId('campaign-submit');
  await submitButton.click();

  await expect(page.getByTestId('campaign-loading')).toBeVisible();
  await expect(submitButton).toHaveText('Creating...');
  await expect(page).toHaveURL('/');
});