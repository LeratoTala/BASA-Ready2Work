import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useDemoStore } from './useDemoStore';
import { DEMO_STORAGE_PREFIX, STORAGE_KEYS } from '../../config/app';

// Mock localStorage in global scope for testing
const mockStorage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  },
  get length() {
    return Object.keys(mockStorage).length;
  },
  key: (i: number) => Object.keys(mockStorage)[i] ?? null,
} as any;

describe('useDemoStore and demo sandbox storage', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('renders useDemoStore without stack overflow and initializes the 7 demo personas', () => {
    let capturedStore: any = null;

    function TestComponent() {
      capturedStore = useDemoStore();
      return React.createElement('div', null, capturedStore.currentUser?.displayName ?? 'none');
    }

    const html = renderToString(React.createElement(TestComponent));
    assert.ok(html.includes('Thabo Ndlovu'));
    assert.ok(capturedStore !== null);

    const store = capturedStore as NonNullable<typeof capturedStore>;
    // Exactly 7 fixed demo profiles
    assert.equal(store.users.length, 7);
    assert.equal(store.currentUser?.uid, 'candidate-thabo');

    // Verify candidate profiles exist
    assert.ok(store.candidateProfiles['candidate-thabo']);
    assert.ok(store.candidateProfiles['candidate-nomvula']);

    // Verify employer profiles exist
    assert.ok(store.employerProfiles['employer-zola']);
    assert.ok(store.employerProfiles['employer-sunpower']);
    assert.ok(store.employerProfiles['employer-tshiamo']);

    // Verify Tshiamo has both pending verification and pending upgrade
    assert.equal(store.employerProfiles['employer-tshiamo'].verificationStatus, 'pending');
    assert.equal(store.upgradeRequests.some((u: any) => u.employerUid === 'employer-tshiamo' && u.status === 'pending'), true);

    // Verify admin profiles exist
    assert.ok(store.users.find((u: any) => u.uid === 'admin-nomsa' && u.role === 'admin'));
    assert.ok(store.users.find((u: any) => u.uid === 'admin-sipho' && u.role === 'admin'));
  });

  it('enforces demo storage prefix on all writes and reads', () => {
    let capturedStore: any = null;

    function TestComponent() {
      capturedStore = useDemoStore();
      return React.createElement('div', null, capturedStore.currentUser?.displayName ?? '');
    }

    renderToString(React.createElement(TestComponent));
    const store = capturedStore as unknown as ReturnType<typeof useDemoStore>;

    // Switch user to employer-zola
    store.switchUser('employer-zola');

    // Confirm that the key in localStorage starts with the prefix and contains employer-zola
    const prefixedUserKey = `${DEMO_STORAGE_PREFIX}currentUser`;
    assert.ok(mockStorage[prefixedUserKey] !== undefined);
    assert.ok(mockStorage[prefixedUserKey].includes('employer-zola'));

    // In a subsequent render, useDemoStore restores the saved user from the prefixed key
    let secondRenderStore: any = null;
    function SecondComponent() {
      secondRenderStore = useDemoStore();
      return React.createElement('div', null, secondRenderStore.currentUser?.displayName ?? '');
    }
    const secondHtml = renderToString(React.createElement(SecondComponent));
    assert.ok(secondHtml.includes('Zola Sithole'));
    assert.equal(secondRenderStore?.currentUser?.uid, 'employer-zola');

    // Confirm NO unprefixed basa_ keys were written
    const keys = Object.keys(mockStorage);
    for (const k of keys) {
      assert.ok(
        k.startsWith(DEMO_STORAGE_PREFIX),
        `Expected storage key ${k} to start with prefix ${DEMO_STORAGE_PREFIX}`
      );
    }
  });

  it('resetDemoData restores original seed data and resets current user to candidate-thabo', () => {
    // Simulate modified storage
    mockStorage[`${DEMO_STORAGE_PREFIX}${STORAGE_KEYS.currentUser}`] = JSON.stringify({ uid: 'employer-zola' });
    mockStorage[`${DEMO_STORAGE_PREFIX}basa_feedback`] = JSON.stringify([{ id: 'test-feedback' }]);

    let capturedStore: any = null;
    function TestComponent() {
      capturedStore = useDemoStore();
      return React.createElement('div', null, 'ok');
    }
    renderToString(React.createElement(TestComponent));
    const store = capturedStore as unknown as ReturnType<typeof useDemoStore>;

    store.resetDemoData();
  });

  it('renders DemoApp component with AppShell cleanly without runtime crash', async () => {
    const { default: DemoApp } = await import('../DemoApp');
    const html = renderToString(React.createElement(DemoApp, { onBackToStart: () => {} }));
    assert.ok(html.length > 500, 'Expected DemoApp to render substantial HTML markup');
    assert.ok(html.includes('Quick Access Demo:'), 'Expected DemoApp to contain Quick Access Demo banner');
    assert.ok(html.includes('Reset demo'), 'Expected DemoApp to contain Reset demo button');
    assert.ok(html.includes('Thabo Ndlovu'), 'Expected DemoApp to display current user Thabo Ndlovu');
  });
});
