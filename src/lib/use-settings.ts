"use client";

import { useEffect, useState } from "react";

export type PublicAppSettings = {
  appName: string;
  primaryColor: string;
  logoUrl: string;
  welcomeMessage: string;
  maintenanceMode: boolean;
  maxFreeVideos: number;
  maxFreeAi: number;
  bunnyCdnHostname: string;
  appUrl: string;
  updatedAt: string;
  hasGroqKey: boolean;
  hasBunny: boolean;
  hasAuth0: boolean;
  hasStripe: boolean;
  hasRazorpay: boolean;
};

const DEFAULTS: PublicAppSettings = {
  appName: "Arynox-EDU",
  primaryColor: "#7c3aed",
  logoUrl: "",
  welcomeMessage: "",
  maintenanceMode: false,
  maxFreeVideos: 10,
  maxFreeAi: 1,
  bunnyCdnHostname: "",
  appUrl: "http://localhost:3000",
  updatedAt: new Date().toISOString(),
  hasGroqKey: false,
  hasBunny: false,
  hasAuth0: false,
  hasStripe: false,
  hasRazorpay: false,
};

let globalSettings: PublicAppSettings = DEFAULTS;
let listeners: Array<(s: PublicAppSettings) => void> = [];

export function notifySettingsChanged() {
  fetch("/api/settings")
    .then((r) => r.json())
    .then((s) => {
      globalSettings = { ...DEFAULTS, ...s };
      listeners.forEach((fn) => fn(globalSettings));
    });
}

export function useAppSettings() {
  const [settings, setSettings] = useState<PublicAppSettings>(globalSettings);

  useEffect(() => {
    listeners.push(setSettings);
    if (globalSettings === DEFAULTS) {
      notifySettingsChanged();
    }
    return () => {
      listeners = listeners.filter((fn) => fn !== setSettings);
    };
  }, []);

  return settings;
}

export function useMaintenanceCheck() {
  const settings = useAppSettings();
  return settings.maintenanceMode;
}

export function changePrimaryColor(color: string) {
  document.documentElement.style.setProperty("--accent", color);
  document.documentElement.style.setProperty("--accent-hover", color + "dd");
  document.documentElement.style.setProperty("--accent-glow", color + "66");
}