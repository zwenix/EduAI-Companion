/**
 * Console-diagnostics contract.
 *
 * Two rules are pinned here, because both were violated in the deployed app:
 *
 *  1. An expected authentication outcome (wrong password, unknown address,
 *     closed Google popup) must NOT log a `FirebaseError` stack — that is what
 *     filled the console on the preview and hid the real defects.
 *  2. A condition that repeats on every remount (a stale Firestore rule, a
 *     blocked host) must warn ONCE per session, not once per listener restart.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isExpectedAuthFailure,
  logAuthFailure,
  resetConsoleDiagnostics,
  warnOnce,
} from '../src/lib/consoleDiagnostics';

describe('isExpectedAuthFailure', () => {
  it('treats the outcomes a login form already explains as expected', () => {
    for (const code of [
      'auth/invalid-credential',
      'auth/wrong-password',
      'auth/user-not-found',
      'auth/email-already-in-use',
      'auth/weak-password',
      'auth/too-many-requests',
      'auth/popup-closed-by-user',
    ]) {
      expect(isExpectedAuthFailure({ code, message: `Firebase: Error (${code}).` }), code).toBe(true);
    }
  });

  it('recognises the same conditions when only the message carries the code', () => {
    // Older SDK builds report the code inside the message, with no `code`.
    expect(
      isExpectedAuthFailure({ message: 'Firebase: Error (auth/invalid-credential).' })
    ).toBe(true);
  });

  it('keeps genuine configuration failures loud', () => {
    expect(isExpectedAuthFailure({ code: 'auth/unauthorized-domain' })).toBe(false);
    expect(isExpectedAuthFailure({ code: 'auth/invalid-api-key' })).toBe(false);
    expect(isExpectedAuthFailure(new Error('boom'))).toBe(false);
    expect(isExpectedAuthFailure(null)).toBe(false);
  });
});

describe('logAuthFailure', () => {
  let info: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    info = vi.spyOn(console, 'info').mockImplementation(() => {});
    error = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downgrades a wrong password to one info line — no stack, no error', () => {
    const err = Object.assign(new Error('Firebase: Error (auth/invalid-credential).'), {
      code: 'auth/invalid-credential',
    });

    logAuthFailure('Email sign-in failed', err);

    expect(error).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(1);
    expect(String(info.mock.calls[0][0])).toContain('auth/invalid-credential');
    // The error object (and therefore its stack) is not passed to the console.
    expect(info.mock.calls[0]).toHaveLength(1);
  });

  it('still reports a real defect as an error', () => {
    const err = Object.assign(new Error('domain not allowlisted'), {
      code: 'auth/unauthorized-domain',
    });

    logAuthFailure('Email sign-in failed', err);

    expect(info).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][1]).toBe(err);
  });
});

describe('warnOnce', () => {
  beforeEach(() => {
    resetConsoleDiagnostics();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints a recurring condition once per session', () => {
    const warn = console.warn as unknown as ReturnType<typeof vi.spyOn>;
    const err = new Error('Missing or insufficient permissions');

    // The Teacher Dashboard listener restarts on every mount.
    for (let i = 0; i < 25; i += 1) {
      warnOnce('learner-interventions-sync', 'Interventions sync err', err);
    }

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe('Interventions sync err');
    expect(warn.mock.calls[0][1]).toBe(err);
  });

  it('keeps different keys independent, and can be reset', () => {
    const warn = console.warn as unknown as ReturnType<typeof vi.spyOn>;

    warnOnce('a', 'first');
    warnOnce('b', 'second');
    warnOnce('a', 'first again');
    expect(warn).toHaveBeenCalledTimes(2);

    resetConsoleDiagnostics();
    warnOnce('a', 'first after reset');
    expect(warn).toHaveBeenCalledTimes(3);
  });

  it('omits the detail argument when there is none', () => {
    const warn = console.warn as unknown as ReturnType<typeof vi.spyOn>;
    warnOnce('plain', 'no detail');
    expect(warn.mock.calls[0]).toHaveLength(1);
  });
});
