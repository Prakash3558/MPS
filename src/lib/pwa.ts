// PWA and App Installation Utilities

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners: Array<(canInstall: boolean) => void> = [];

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((callback) => callback(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((callback) => callback(false));
  });
}

export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://') ||
    window.location.search.includes('mode=app') ||
    window.location.search.includes('mode=student-app') ||
    window.location.pathname.startsWith('/app') ||
    window.location.pathname.startsWith('/student-app')
  );
}

export function subscribeInstallPrompt(callback: (canInstall: boolean) => void): () => void {
  listeners.push(callback);
  callback(Boolean(deferredPrompt));
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export async function promptInstallApp(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
  if (!deferredPrompt) {
    return 'unsupported';
  }
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      deferredPrompt = null;
    }
    return choice.outcome;
  } catch (err) {
    console.error('Error prompting PWA installation:', err);
    return 'unsupported';
  }
}

export function getDeviceOS(): 'android' | 'ios' | 'windows' | 'mac' | 'other' {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Win/i.test(ua)) return 'windows';
  if (/Mac/i.test(ua)) return 'mac';
  return 'other';
}

export function downloadWebAppLauncher(schoolName: string = 'MPS'): void {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://modelpublicschool.vercel.app';
  const targetAppUrl = `${currentOrigin}/app`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#1e3a8a">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="MPS">
  <title>MPS</title>
  <link rel="icon" type="image/png" href="${currentOrigin}/logo.png">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #090d16;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 24px;
      box-sizing: border-box;
    }
    .logo {
      width: 96px;
      height: 96px;
      border-radius: 24px;
      background: #ffffff;
      padding: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      margin-bottom: 20px;
      object-fit: contain;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 8px 0;
      font-weight: 800;
    }
    p {
      font-size: 14px;
      color: #94a3b8;
      margin: 0 0 24px 0;
      max-width: 320px;
      line-height: 1.5;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
      transition: all 0.2s;
    }
    .btn:active {
      transform: scale(0.98);
    }
    .spinner {
      margin-top: 24px;
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
  <script>
    setTimeout(function() {
      window.location.href = "${targetAppUrl}";
    }, 800);
  </script>
</head>
<body>
  <img src="${currentOrigin}/logo.png" class="logo" alt="MPS Logo" onerror="this.src='/logo.jpg'">
  <h1>MPS</h1>
  <p>Launching MPS Official App...</p>
  <a href="${targetAppUrl}" class="btn">Open MPS App</a>
  <div class="spinner"></div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'MPS.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
