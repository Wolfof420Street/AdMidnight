import { expect, test } from '@playwright/test';

test('successful login issues an HttpOnly advertiser session cookie', async ({ page, context }) => {
  await page.goto('/login');

  await page.getByTestId('login-email').fill('advertiser@admidnight.local');
  await page.getByTestId('login-password').fill('admidnight-demo');
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL('/');

  const cookies = await context.cookies();
  const sessionCookie = cookies.find((cookie) => cookie.name === 'admidnight_session');

  expect(sessionCookie).toBeTruthy();
  expect(sessionCookie?.value.length).toBeGreaterThan(20);
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(sessionCookie?.sameSite).toBe('Lax');
});