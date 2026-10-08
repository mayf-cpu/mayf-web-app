/**
 * Best-effort In-App Browser (IAB) detection and metadata utilities.
 *
 * NOTE & COMPLIANCE:
 * Mobile OS and social platform sandboxes (Instagram, Facebook, TikTok, etc.)
 * enforce strict application security policies. A website CANNOT universally
 * force another mobile host application to switch into Chrome or Safari.
 * Therefore, this utility provides:
 * 1. Best-effort heuristic detection for popular social in-app WebViews.
 * 2. Android Chrome intent URI generation where technically supported.
 * 3. Human-readable manual bypass instructions (e.g. 3-dots menu -> Open in Browser).
 * 4. Strictly avoids infinite redirects or loops.
 * 5. Retains the standard canonical HTTPS URL.
 */

export interface InAppBrowserInfo {
  isLikelyInAppBrowser: boolean;
  appName: string;
  os: 'android' | 'ios' | 'other';
  isAndroid: boolean;
  isIOS: boolean;
  androidChromeIntentUrl: string | null;
  canonicalUrl: string;
  instructions: {
    title: string;
    steps: string[];
    note: string;
  };
}

/**
 * Detects if the current user agent matches common in-app browsers
 */
export function detectInAppBrowser(customUserAgent?: string): InAppBrowserInfo {
  if (typeof window === 'undefined') {
    return {
      isLikelyInAppBrowser: false,
      appName: 'Browser',
      os: 'other',
      isAndroid: false,
      isIOS: false,
      androidChromeIntentUrl: null,
      canonicalUrl: 'https://mayf.co.in',
      instructions: {
        title: 'Open in External Browser',
        steps: ['Use your device browser menu.'],
        note: 'Website fully functional.',
      },
    };
  }

  const ua = customUserAgent || navigator.userAgent || '';
  const searchParams = new URLSearchParams(window.location.search);
  const debugForceIAB = searchParams.get('preview_iab') === '1' || searchParams.get('iab') === '1';

  // OS detection
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const os: 'android' | 'ios' | 'other' = isAndroid ? 'android' : isIOS ? 'ios' : 'other';

  // App signatures
  let appName = 'In-App Browser';
  let isLikelyInAppBrowser = false;

  if (/Instagram/i.test(ua)) {
    appName = 'Instagram';
    isLikelyInAppBrowser = true;
  } else if (/FBAN|FBAV|FB_IAB|Messenger/i.test(ua)) {
    appName = 'Facebook / Messenger';
    isLikelyInAppBrowser = true;
  } else if (/TikTok|musical_ly|ByteLocale|Bytedance/i.test(ua)) {
    appName = 'TikTok';
    isLikelyInAppBrowser = true;
  } else if (/Twitter|TwitterAndroid|Twitter for iPhone/i.test(ua)) {
    appName = 'X (Twitter)';
    isLikelyInAppBrowser = true;
  } else if (/LinkedInApp/i.test(ua)) {
    appName = 'LinkedIn';
    isLikelyInAppBrowser = true;
  } else if (/Snapchat/i.test(ua)) {
    appName = 'Snapchat';
    isLikelyInAppBrowser = true;
  } else if (/Pinterest/i.test(ua)) {
    appName = 'Pinterest';
    isLikelyInAppBrowser = true;
  } else if (/MicroMessenger/i.test(ua)) {
    appName = 'WeChat';
    isLikelyInAppBrowser = true;
  } else if (/Line\//i.test(ua)) {
    appName = 'LINE';
    isLikelyInAppBrowser = true;
  } else if (/Telegram/i.test(ua)) {
    appName = 'Telegram';
    isLikelyInAppBrowser = true;
  } else if (/WhatsApp/i.test(ua)) {
    appName = 'WhatsApp';
    isLikelyInAppBrowser = true;
  } else if (isAndroid && /; wv\)/i.test(ua)) {
    appName = 'Android WebView';
    isLikelyInAppBrowser = true;
  } else if (isIOS && !/Safari/i.test(ua) && /AppleWebKit/i.test(ua)) {
    // iOS UIWebView or non-Safari WKWebView
    appName = 'iOS In-App Browser';
    isLikelyInAppBrowser = true;
  }

  // Allow preview testing if ?iab=1 or ?preview_iab=1
  if (debugForceIAB) {
    isLikelyInAppBrowser = true;
    if (appName === 'In-App Browser') {
      appName = isIOS ? 'Instagram (iOS Simulation)' : 'Instagram (Android Simulation)';
    }
  }

  // Canonical HTTPS URL resolution
  let canonicalUrl = window.location.href;
  const canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (canonicalEl?.href) {
    canonicalUrl = canonicalEl.href;
  }

  // Android Chrome Intent URL
  // Form: intent://<host_and_path>#Intent;scheme=https;package=com.android.chrome;end
  let androidChromeIntentUrl: string | null = null;
  if (isAndroid || debugForceIAB) {
    try {
      const urlObj = new URL(canonicalUrl);
      const urlWithoutScheme = `${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
      androidChromeIntentUrl = `intent://${urlWithoutScheme}#Intent;scheme=https;package=com.android.chrome;end`;
    } catch {
      androidChromeIntentUrl = null;
    }
  }

  // Platform and App Specific Instructions
  const instructions = getBrowserInstructions(appName, isIOS, isAndroid);

  return {
    isLikelyInAppBrowser,
    appName,
    os,
    isAndroid,
    isIOS,
    androidChromeIntentUrl,
    canonicalUrl,
    instructions,
  };
}

/**
 * Returns contextual instructions depending on the social platform and operating system
 */
function getBrowserInstructions(
  appName: string,
  isIOS: boolean,
  isAndroid: boolean
): { title: string; steps: string[]; note: string } {
  if (isIOS) {
    if (appName.includes('Instagram')) {
      return {
        title: 'Open in Safari from Instagram',
        steps: [
          'Tap the three dots (⋯ or ⋮) in the top-right corner of the screen.',
          'Select "Open in external browser" or "Open in Safari".',
          'Enjoy full formula rendering, audio recitation, and saved downloads.',
        ],
        note: 'Apple iOS security prevents websites from forcing Safari to launch directly.',
      };
    }
    if (appName.includes('Facebook')) {
      return {
        title: 'Open in Safari from Facebook',
        steps: [
          'Tap the three dots (⋯) in the bottom-right or top-right corner.',
          'Tap "Open in Safari" or "Open in external browser".',
        ],
        note: 'Apple iOS privacy restrictions require manual browser launch.',
      };
    }
    return {
      title: 'Open in Safari (iOS)',
      steps: [
        'Tap the Share icon or the three dots (⋯) in your app header or footer.',
        'Choose "Open in Safari" or "Open in Default Browser".',
        'Alternatively, copy the link and paste it into Safari or Chrome.',
      ],
      note: 'Mobile app sandboxes do not allow automatic external browser triggers on iOS.',
    };
  }

  if (isAndroid) {
    if (appName.includes('Instagram') || appName.includes('Facebook')) {
      return {
        title: 'Open in Chrome from ' + appName,
        steps: [
          'Click the "Open in Browser" button above (triggers Chrome intent).',
          'If your app restricts intents, tap the three dots (⋮) in the top-right corner.',
          'Select "Open in Chrome" or "Open in external browser".',
        ],
        note: 'Some Android social apps block background intents; use the 3-dot menu if the button does not open Chrome.',
      };
    }
    return {
      title: 'Open in Chrome (Android)',
      steps: [
        'Tap "Open in Browser" to launch Google Chrome directly via Android intent.',
        'If prompt does not appear, tap the three dots (⋮) menu in the top right.',
        'Tap "Open in Chrome" or "Open in default browser".',
      ],
      note: 'Intent support depends on your social application permissions.',
    };
  }

  return {
    title: 'Open in Your Default Browser',
    steps: [
      'Copy this page link using the button above.',
      'Open Chrome, Safari, Edge, or Firefox and paste the link into the address bar.',
    ],
    note: 'Standalone browsers provide unrestricted cookies, downloads, and full hardware acceleration.',
  };
}
