import type { UserProfile } from '../types/game';

declare global {
  interface Window {
    WebApp?: {
      initDataUnsafe?: {
        user?: {
          id?: number | string;
          first_name?: string;
          last_name?: string;
          username?: string;
        };
      };
      ready?: () => void;
      openLink?: (url: string) => void;
      openMaxLink?: (url: string) => void;
      expand?: () => void;
      requestFullscreen?: () => void;
      openSharePopup?: (params: { text?: string; url?: string }) => void;
      shareMessage?: (text: string) => void;
      switchInlineQuery?: (query: string, chatTypes?: Array<'users' | 'groups' | 'channels' | 'bots'>) => void;
    };
    MaxAds?: {
      showFullscreenAd?: () => Promise<void>;
    };
    MRGtag?: Array<Record<string, unknown>>;
  }
}

const VK_AD_CLIENT = import.meta.env.VITE_VK_AD_CLIENT ?? 'ad-1982180';
const VK_AD_SLOT = import.meta.env.VITE_VK_AD_SLOT ?? '1982180';

export function getMaxUser(): UserProfile {
  const user = window.WebApp?.initDataUnsafe?.user;
  if (!user) {
    return {
      id: `local-${Math.floor(Math.random() * 1_000_000)}`,
      name: 'Local Player',
    };
  }

  return {
    id: String(user.id ?? `local-${Math.floor(Math.random() * 1_000_000)}`),
    name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'MAX Player',
  };
}

export function initMaxBridge(): void {
  window.WebApp?.ready?.();
  window.WebApp?.expand?.();
  window.WebApp?.requestFullscreen?.();
}

export function openInviteLink(url: string): void {
  if (url.startsWith('https://max.ru/')) {
    window.WebApp?.openMaxLink?.(url);
    return;
  }

  window.WebApp?.openLink?.(url);
}

export async function shareInviteLink(url: string, roomId: string): Promise<'shared' | 'copied' | 'failed'> {
  const shareText = `Присоединяйся к моей комнате в Морском бое: ${roomId}`;
  const inlineQueryText = `room_${roomId}`;

  try {
    if (window.WebApp?.openSharePopup) {
      window.WebApp.openSharePopup({ text: shareText, url });
      return 'shared';
    }

    // MAX/Telegram-like flow: opens in-app recipient chooser and inserts query to chat.
    if (window.WebApp?.switchInlineQuery) {
      window.WebApp.switchInlineQuery(`${inlineQueryText} ${url}`, ['users', 'groups']);
      return 'shared';
    }

    if (window.WebApp?.shareMessage) {
      window.WebApp.shareMessage(`${shareText}\n${url}`);
      return 'shared';
    }

    if (navigator.share) {
      await navigator.share({
        title: 'Морской бой',
        text: shareText,
        url,
      });
      return 'shared';
    }
  } catch {
    // Fallback to clipboard if share popup is unavailable or canceled.
  }

  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export async function showGameOverAd(): Promise<void> {
  if (window.MaxAds?.showFullscreenAd) {
    await window.MaxAds.showFullscreenAd();
    return;
  }

  await showVkFallbackAd(VK_AD_CLIENT, VK_AD_SLOT);
}

async function showVkFallbackAd(adClient: string, adSlot: string): Promise<void> {
  await new Promise<void>((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999';
    overlay.style.background = 'rgba(2, 6, 23, 0.84)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '16px';

    const card = document.createElement('div');
    card.style.width = '100%';
    card.style.maxWidth = '280px';
    card.style.background = '#ffffff';
    card.style.borderRadius = '16px';
    card.style.padding = '12px';
    card.style.boxSizing = 'border-box';

    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Закрыть';
    close.style.display = 'block';
    close.style.margin = '0 0 10px auto';
    close.style.border = '1px solid #e2e8f0';
    close.style.borderRadius = '10px';
    close.style.padding = '6px 10px';
    close.style.background = '#f8fafc';
    close.style.cursor = 'pointer';

    const adSlotNode = document.createElement('ins');
    adSlotNode.className = 'mrg-tag';
    adSlotNode.style.display = 'inline-block';
    adSlotNode.style.width = '240px';
    adSlotNode.style.height = '400px';
    adSlotNode.setAttribute('data-ad-client', adClient);
    adSlotNode.setAttribute('data-ad-slot', adSlot);

    const cleanup = () => {
      overlay.remove();
      resolve();
    };

    close.onclick = cleanup;
    overlay.onclick = (event) => {
      if (event.target === overlay) {
        cleanup();
      }
    };

    card.appendChild(close);
    card.appendChild(adSlotNode);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    window.MRGtag = window.MRGtag || [];
    window.MRGtag.push({});

    // Safety timeout, so game flow is never blocked by ad loading issues.
    window.setTimeout(cleanup, 10000);
  });
}
