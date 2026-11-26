import { expect, test, type Page } from '@playwright/test';
import { expectFindingToFail, findingDetails } from '../../src/findings';
import { chartPath, readFixture, type Fixture } from '../../src/openmrs';

interface Screen {
  name: string;
  /** Relative to the config baseURL. */
  path: string;
  /** Proves the screen actually rendered before its title is read. */
  ready: (page: Page) => Promise<void>;
}

// The fixture file is written by the setup project, so it is read inside the test, not at load time.
const screensFor = (fixture: Fixture): Screen[] => [
  {
    name: 'P2 location picker',
    path: 'login/location?update=true',
    ready: (page) => expect(page.getByRole('radio').first()).toBeVisible(),
  },
  {
    name: 'P3 service queues',
    path: 'home/service-queues',
    ready: (page) =>
      expect(page.getByRole('heading', { name: 'Patients Currently In Queue' })).toBeVisible(),
  },
  {
    name: 'P4 patient search',
    path: `search?query=${fixture.familyName}`,
    ready: (page) =>
      expect(page.getByText(`${fixture.givenName} ${fixture.familyName}`).first()).toBeVisible(),
  },
  {
    name: 'P5 patient registration',
    path: 'patient-registration',
    ready: (page) =>
      expect(page.getByRole('heading', { name: 'Create new patient' })).toBeVisible(),
  },
  {
    name: 'P6 patient chart',
    path: chartPath(fixture.patientUuid, 'Patient Summary'),
    ready: (page) =>
      expect(page.getByRole('heading', { name: 'Vitals', exact: true })).toBeVisible(),
  },
  {
    name: 'P8 appointments',
    path: 'home/appointments',
    ready: (page) =>
      expect(page.getByRole('heading', { name: /^Appointments for:/ })).toBeVisible(),
  },
];

test(
  'M8 · 2.4.2 Page Titled (A) · every screen has its own descriptive title',
  findingDetails('M8'),
  async ({ context, browser, baseURL }) => {
    const screens = screensFor(readFixture());
    // Every screen stays open in its own tab, proven rendered, so the titles can be read after the mark.
    const opened = new Map<string, Page>();

    // P1 is the login page, reached without a session.
    const anonymous = await browser.newContext({ baseURL, storageState: undefined });
    const loginPage = await anonymous.newPage();
    await loginPage.goto('login');
    await expect(loginPage.getByLabel(/username/i)).toBeVisible();
    opened.set('P1 login (signed out)', loginPage);

    for (const screen of screens) {
      const screenPage = await context.newPage();
      await screenPage.goto(screen.path);
      await screen.ready(screenPage);
      opened.set(screen.name, screenPage);
    }

    expectFindingToFail('M8');
    const readTitles = async () => {
      const titles: Record<string, string> = {};
      for (const [name, screenPage] of opened) titles[name] = await screenPage.title();
      return titles;
    };
    const verdict = async () => {
      const titles = await readTitles();
      const values = Object.values(titles);
      return {
        genericOrEmpty: values.filter((t) => t.trim() === '' || t.trim() === 'OpenMRS').length,
        allDistinct: new Set(values).size === values.length,
        titles,
      };
    };
    await expect
      .poll(verdict, {
        timeout: 5_000,
        message: '[M8] screens need descriptive, distinct titles. Actual',
      })
      .toMatchObject({ genericOrEmpty: 0, allDistinct: true });
    await anonymous.close();
  },
);
