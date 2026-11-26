import { expect, test as setup, request } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { requireEnv } from '../../src/env';
import {
  AUTH_DIR,
  STATE_FILE,
  basicAuthHeader,
  createSession,
  ensureFixture,
  restBaseUrl,
  waitUntilReady,
  writeFixture,
} from '../../src/openmrs';

setup('authenticate and seed fixture', async () => {
  const username = requireEnv('OPENMRS_USERNAME');
  const password = requireEnv('OPENMRS_PASSWORD');
  const location = requireEnv('OPENMRS_LOCATION_UUID');
  mkdirSync(AUTH_DIR, { recursive: true });

  const api = await request.newContext({
    baseURL: restBaseUrl,
    extraHTTPHeaders: {
      Accept: 'application/json',
      Authorization: basicAuthHeader(username, password),
    },
  });

  await setup.step('wait until OpenMRS is ready', () => waitUntilReady(api));

  await setup.step('create session and save storage state', async () => {
    await createSession(api, location);
    await api.storageState({ path: STATE_FILE });
  });

  await setup.step('ensure fixture patient, active visit and vitals', async () => {
    const { fixture, created, reused } = await ensureFixture(api, location);
    expect(fixture.patientUuid, 'fixture patient uuid').toMatch(/^[0-9a-f-]{36}$/);
    writeFixture(fixture);
    setup.info().annotations.push({
      type: 'fixture',
      description: `created: ${created.join(', ') || 'nothing'}; reused: ${reused.join(', ') || 'nothing'}`,
    });
  });

  await api.dispose();
});
