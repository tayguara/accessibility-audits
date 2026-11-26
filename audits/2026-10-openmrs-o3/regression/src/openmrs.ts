import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { baseUrl } from './env';

// Public UUIDs of the OpenMRS reference distribution (same ones the upstream e2e suite uses).
/** Identifier generator source for "OpenMRS ID". */
export const IDGEN_OPENMRS_ID_SOURCE = '8549f706-7e85-4c1d-9424-217d50a2988b';
export const IDENTIFIER_TYPE_OPENMRS_ID = '05a29f94-c0ed-11e2-94be-8c13b969e334';
export const VISIT_TYPE_FACILITY = '7b0f5697-27e3-40c4-8bae-f4049abfb4ed';
export const ENCOUNTER_TYPE_VITALS = '67a71486-1a54-468f-ac3e-7091a9a79584';

/** CIEL concepts for vitals; OpenMRS pads concept UUIDs with "A" to 36 characters. */
const ciel = (code: number): string => String(code).padEnd(36, 'A');
export const VITALS_OBS: { concept: string; value: number }[] = [
  { concept: ciel(5085), value: 120 }, // systolic
  { concept: ciel(5086), value: 80 }, // diastolic
  { concept: ciel(5087), value: 70 }, // pulse
  { concept: ciel(5088), value: 36.8 }, // temperature
  { concept: ciel(5092), value: 98 }, // SpO2
  { concept: ciel(5242), value: 16 }, // respiratory rate
  { concept: ciel(5089), value: 70 }, // weight
  { concept: ciel(5090), value: 170 }, // height
];

export const FIXTURE_GIVEN_NAME = 'Regression';
export const FIXTURE_FAMILY_NAME = 'Wcagfixture';
/** The Vitals widget needs more than one page (page size 5 on the summary). */
export const VITALS_ENCOUNTERS_WANTED = 12;

export const AUTH_DIR = resolve(__dirname, '..', '.auth');
export const STATE_FILE = resolve(AUTH_DIR, 'state.json');
export const FIXTURE_FILE = resolve(AUTH_DIR, 'fixture.json');

export interface Fixture {
  patientUuid: string;
  givenName: string;
  familyName: string;
}

export function readFixture(): Fixture {
  return JSON.parse(readFileSync(FIXTURE_FILE, 'utf8')) as Fixture;
}

export function writeFixture(fixture: Fixture): void {
  mkdirSync(dirname(FIXTURE_FILE), { recursive: true });
  writeFileSync(FIXTURE_FILE, JSON.stringify(fixture, null, 2));
}

export type ChartView = 'Patient Summary' | 'Vitals & Biometrics';

/** Relative to the config baseURL (`<base>/spa/`). */
export function chartPath(patientUuid: string, view: ChartView): string {
  return `patient/${patientUuid}/chart/${encodeURIComponent(view)}`;
}

export const restBaseUrl = `${baseUrl}/ws/rest/v1/`;

export function basicAuthHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

async function expectOk(response: APIResponse, what: string): Promise<void> {
  if (!response.ok()) {
    throw new Error(`${what} failed: HTTP ${response.status()} ${await response.text()}`);
  }
}

async function getJson<T>(api: APIRequestContext, path: string, what: string): Promise<T> {
  const response = await api.get(path);
  await expectOk(response, what);
  return (await response.json()) as T;
}

async function postJson<T>(
  api: APIRequestContext,
  path: string,
  data: unknown,
  what: string,
): Promise<T> {
  const response = await api.post(path, { data });
  await expectOk(response, what);
  return (await response.json()) as T;
}

/** First start of a fresh volume answers 302 -> /initialsetup until the install finishes. */
export async function waitUntilReady(api: APIRequestContext): Promise<void> {
  await expect
    .poll(
      async () => {
        try {
          return (await api.get('session', { maxRedirects: 0, timeout: 10_000 })).status();
        } catch (error) {
          return `unreachable (${(error as Error).message.split('\n')[0] ?? ''})`;
        }
      },
      {
        timeout: 30_000,
        message: `OpenMRS not ready at ${baseUrl} (first start can take up to ~1 h: docker compose logs -f backend)`,
      },
    )
    .toBe(200);
}

export async function createSession(
  api: APIRequestContext,
  sessionLocation: string,
): Promise<void> {
  const session = await postJson<{ authenticated: boolean; sessionLocation?: { uuid: string } }>(
    api,
    'session',
    { sessionLocation, locale: 'en' },
    'POST session',
  );
  expect(session.authenticated, 'session is authenticated').toBe(true);
  expect(session.sessionLocation?.uuid, 'session has the requested location').toBe(sessionLocation);
}

export interface EnsureResult {
  fixture: Fixture;
  created: string[];
  reused: string[];
}

export async function ensureFixture(
  api: APIRequestContext,
  locationUuid: string,
): Promise<EnsureResult> {
  const created: string[] = [];
  const reused: string[] = [];

  // Patient
  const found = await getJson<{ results: { uuid: string }[] }>(
    api,
    `patient?q=${FIXTURE_FAMILY_NAME}&v=custom:(uuid,display)`,
    'GET patient',
  );
  let patientUuid = found.results[0]?.uuid;
  if (patientUuid) {
    reused.push('patient');
  } else {
    const { identifier } = await postJson<{ identifier: string }>(
      api,
      `idgen/identifiersource/${IDGEN_OPENMRS_ID_SOURCE}/identifier`,
      {},
      'POST idgen identifier',
    );
    const patient = await postJson<{ uuid: string }>(
      api,
      'patient',
      {
        person: {
          names: [{ givenName: FIXTURE_GIVEN_NAME, familyName: FIXTURE_FAMILY_NAME }],
          gender: 'F',
          birthdate: '1985-03-12',
          addresses: [{ address1: '1 Fixture Street', cityVillage: 'Testville', country: 'Kenya' }],
        },
        identifiers: [
          {
            identifier,
            identifierType: IDENTIFIER_TYPE_OPENMRS_ID,
            location: locationUuid,
            preferred: true,
          },
        ],
      },
      'POST patient',
    );
    patientUuid = patient.uuid;
    created.push('patient');
  }

  // Active visit
  const visits = await getJson<{ results: { uuid: string; startDatetime: string }[] }>(
    api,
    `visit?patient=${patientUuid}&includeInactive=false&v=custom:(uuid,startDatetime,stopDatetime)`,
    'GET visit',
  );
  let visit = visits.results[0];
  if (visit) {
    reused.push('visit');
  } else {
    visit = await postJson<{ uuid: string; startDatetime: string }>(
      api,
      'visit',
      {
        patient: patientUuid,
        visitType: VISIT_TYPE_FACILITY,
        location: locationUuid,
        startDatetime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      'POST visit',
    );
    created.push('visit');
  }

  // Vitals encounters (one table row each)
  const vitals = await getJson<{ results: { uuid: string }[] }>(
    api,
    `encounter?patient=${patientUuid}&encounterType=${ENCOUNTER_TYPE_VITALS}&v=custom:(uuid)`,
    'GET encounter',
  );
  const missing = VITALS_ENCOUNTERS_WANTED - vitals.results.length;
  if (missing > 0) {
    const start = new Date(visit.startDatetime).getTime();
    const now = Date.now();
    for (let i = 1; i <= missing; i++) {
      const when = new Date(start + ((now - start) * i) / (missing + 1));
      await postJson(
        api,
        'encounter',
        {
          patient: patientUuid,
          encounterType: ENCOUNTER_TYPE_VITALS,
          location: locationUuid,
          visit: visit.uuid,
          encounterDatetime: when.toISOString(),
          obs: VITALS_OBS.map((obs) => ({ ...obs, obsDatetime: when.toISOString() })),
        },
        'POST encounter',
      );
    }
    created.push(`${missing} vitals encounters`);
  } else {
    reused.push(`${vitals.results.length} vitals encounters`);
  }

  return {
    fixture: { patientUuid, givenName: FIXTURE_GIVEN_NAME, familyName: FIXTURE_FAMILY_NAME },
    created,
    reused,
  };
}
