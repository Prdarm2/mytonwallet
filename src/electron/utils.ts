import { app, BrowserWindow } from 'electron';
import Store from 'electron-store';
import fs from 'fs';

import {
  BASE_URL, BETA_URL, GLOBAL_STATE_CACHE_KEY, PRODUCTION_URL,
} from '../config';

const ALLOWED_URL_ORIGINS = [BASE_URL!, BETA_URL, PRODUCTION_URL].map((url) => (new URL(url).origin));

export let mainWindow: BrowserWindow; // eslint-disable-line import/no-mutable-exports
export const store: Store = new Store();

export function checkIsWebContentsUrlAllowed(url: string): boolean {
  if (!app.isPackaged) {
    return true;
  }

  const parsedUrl = new URL(url);

  if (parsedUrl.pathname === encodeURI(`${__dirname}/index.html`)) {
    return true;
  }

  return ALLOWED_URL_ORIGINS.includes(parsedUrl.origin);
}

export const WINDOW_STATE_FILE = 'window-state.json';
export const FORCE_STORAGE_CAPTURED_SETTINGS_KEY = 'forceStorageCaptured';

export const IS_MAC_OS = process.platform === 'darwin';
export const IS_WINDOWS = process.platform === 'win32';
export const IS_LINUX = process.platform === 'linux';
export const IS_PREVIEW = process.env.IS_PREVIEW === 'true';
export const IS_FIRST_RUN = !fs.existsSync(`${app.getPath('userData')}/${WINDOW_STATE_FILE}`);

// Fix for users who updated to version 1.17.4, which was by mistake loading Beta URL. Can be removed after 31.01.2024.
export function getIsForceStorageCaptureRequired(): Promise<boolean> {
  return new Promise((resolve) => {
    if (store.get(FORCE_STORAGE_CAPTURED_SETTINGS_KEY)) {
      resolve(false);
    }

    const hiddenWindow = new BrowserWindow({ show: false });
    hiddenWindow.loadURL(BETA_URL);
    hiddenWindow.webContents.once('dom-ready', async () => {
      try {
        const globalState = await hiddenWindow.webContents.executeJavaScript(
          `({ ...localStorage })['${GLOBAL_STATE_CACHE_KEY}'];`,
        );
        resolve(Boolean(globalState));
      } catch (error) {
        resolve(false);
      }

      hiddenWindow.close();
    });
  });
}

export function setMainWindow(window: BrowserWindow) {
  mainWindow = window;
}

export const forceQuit = {
  value: false,

  enable() {
    this.value = true;
  },

  disable() {
    this.value = false;
  },

  get isEnabled(): boolean {
    return this.value;
  },
};
