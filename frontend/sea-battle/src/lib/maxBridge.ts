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
    };
    MaxAds?: {
      showFullscreenAd?: () => Promise<void>;
    };
    yaContextCb?: Array<() => void>;
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (options: {
            blockId: string;
            renderTo?: string;
            type?: string;
            platform?: string;
          }) => void;
        };
      };
    };
  }
}

const YANDEX_BLOCK_ID = import.meta.env.VITE_YANDEX_RTB_BLOCK_ID as string | undefined;

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

export async function showGameOverAd(): Promise<void> {
  if (window.MaxAds?.showFullscreenAd) {
    await window.MaxAds.showFullscreenAd();
    return;
  }

  if (YANDEX_BLOCK_ID) {
    await showYandexFallbackAd(YANDEX_BLOCK_ID);
  }
}

async function showYandexFallbackAd(blockId: string): Promise<void> {
  await new Promise<void>((resolve) => {
    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
      window.Ya?.Context?.AdvManager?.render({
        blockId,
        type: 'fullscreen',
        platform: 'touch',
      });
    });

    // The Yandex fullscreen call has no completion callback in this flow.
    window.setTimeout(resolve, 1200);
  });
}
