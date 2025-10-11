/// <reference lib="dom" />

declare global {
  interface Window {
    localStorage: Storage;
    crypto: Crypto;
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  }

  interface Navigator {
    onLine: boolean;
  }

  interface Document {
    visibilityState: string;
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  }

  const window: Window;
  const navigator: Navigator;
  const document: Document;
}

export {};