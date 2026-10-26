import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectOperatingSystem,
  getOSModifierKey,
  getOSBackLabel,
  getOSFeatures,
  triggerOSHaptic,
  detectOSColorScheme,
  updateOSStatusBarTheme,
  triggerOSShare,
} from './osOperations';

describe('OS Operations and Hardware Button Features', () => {
  it('correctly detects operating systems from User Agent and Platform strings', () => {
    // Android
    assert.equal(
      detectOperatingSystem('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36', 'Linux armv8l'),
      'android'
    );

    // iOS iPhone
    assert.equal(
      detectOperatingSystem('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'iPhone'),
      'ios'
    );

    // Windows
    assert.equal(
      detectOperatingSystem('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'Win32'),
      'windows'
    );

    // macOS
    assert.equal(
      detectOperatingSystem('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15', 'MacIntel'),
      'macos'
    );

    // Linux
    assert.equal(
      detectOperatingSystem('Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0)', 'Linux x86_64'),
      'linux'
    );
  });

  it('provides correct OS modifier keys', () => {
    assert.equal(getOSModifierKey('macos'), '⌘');
    assert.equal(getOSModifierKey('ios'), '⌘');
    assert.equal(getOSModifierKey('windows'), 'Ctrl');
    assert.equal(getOSModifierKey('android'), 'Ctrl');
    assert.equal(getOSModifierKey('linux'), 'Ctrl');
  });

  it('provides appropriate OS back button labels for smooth navigation', () => {
    assert.equal(getOSBackLabel('android'), 'Back button / swipe');
    assert.equal(getOSBackLabel('ios'), 'Swipe to go back');
    assert.equal(getOSBackLabel('windows'), 'Esc / Alt+←');
    assert.equal(getOSBackLabel('macos'), 'Esc / ⌘+[');
  });

  it('does not throw when haptics are invoked in non-browser/test environment', () => {
    const result = triggerOSHaptic('light');
    assert.equal(result, false);
  });

  it('compiles OS feature snapshot correctly', () => {
    const features = getOSFeatures();
    assert.ok(features.os);
    assert.ok(features.modifierKey);
    assert.ok(features.backKeyLabel);
    assert.equal(typeof features.isMobile, 'boolean');
    assert.equal(typeof features.hasHaptics, 'boolean');
    assert.equal(typeof features.hasNativeShare, 'boolean');
  });

  it('safely detects OS color scheme in server/test environment', () => {
    const scheme = detectOSColorScheme();
    assert.ok(scheme === 'light' || scheme === 'dark');
  });

  it('safely handles OS status bar theme update without DOM error in test environment', () => {
    assert.doesNotThrow(() => {
      updateOSStatusBarTheme('dark');
      updateOSStatusBarTheme('light');
    });
  });

  it('safely executes triggerOSShare without crashing when window.navigator is simulated or absent', async () => {
    const res = await triggerOSShare({ title: 'Test Title', text: 'Test text' });
    assert.ok(res.method === 'failed' || res.method === 'native' || res.method === 'clipboard');
  });
});
