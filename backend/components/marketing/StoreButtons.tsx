"use client";

import { useSyncExternalStore } from "react";

import {
  UTM_STORAGE_KEY,
  appStoreLink,
  hasUtm,
  parseStoredUtm,
  playStoreLink,
  readUtm,
} from "@/lib/marketing/store-links";

type Platform = "ios" | "android";

function detectPlatform(): Platform | null {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  // iPadOS reports itself as a Mac; touch points give it away.
  if (
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  return null;
}

const noSubscribe = () => () => {};

/**
 * The campaign as a stable string (useSyncExternalStore compares snapshots):
 * utm_* from this URL, else the one remembered by UtmCapture.
 */
function readCampaignSnapshot(): string {
  const fromUrl = readUtm(window.location.search);
  if (hasUtm(fromUrl)) return JSON.stringify(fromUrl);
  try {
    return window.sessionStorage.getItem(UTM_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function GooglePlayIcon() {
  return (
    <svg
      className="mkt-store-icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden
    >
      <path fill="#EA4335" d="M3.6 2.2 13.2 12 3.6 21.8V2.2Z" />
      <path fill="#FBBC04" d="m13.2 12 2.9 2.9 5.3-3c.7-.4.7-1.4 0-1.8l-5.3-3-2.9 2.9Z" />
      <path fill="#4285F4" d="M13.2 12 3.6 21.8c.3.5.9.8 1.5.8.3 0 .6-.1.9-.2l10.1-5.7L13.2 12Z" />
      <path fill="#34A853" d="M13.2 12 16.1 9.1 6 3.4c-.3-.2-.6-.2-.9-.2-.6 0-1.2.3-1.5.8L13.2 12Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      className="mkt-store-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M18.7 12.7c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.7-1.7-3.3-1.7-1.4-.1-2.7.8-3.4.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.7 2.3-1.6 2.8-.4 6.9 1.1 9.2.8 1.1 1.7 2.4 2.9 2.3 1.2-.1 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c1-1.5 1.4-2.9 1.4-3 .1 0-2.7-1-2.8-3.4ZM15.5 5.8c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3Z"
      />
    </svg>
  );
}

/**
 * App Store and Google Play buttons. The visitor's own store comes first: iPhone/iPad
 * → App Store, Android → Google Play. Server HTML and desktop keep Google Play first.
 * Links carry the campaign: Apple `pt`/`ct`, Google Play `referrer` with utm_*.
 * Server HTML credits this site and `page`; the client swaps in the visitor's campaign.
 */
export function StoreButtons({
  id,
  appStoreUrl,
  playStoreUrl,
  appStoreSmall,
  playSmall,
  page,
  className,
}: {
  id?: string;
  appStoreUrl: string;
  playStoreUrl: string;
  appStoreSmall: string;
  playSmall: string;
  /** Short name of the page, reported to the stores for visitors without a campaign. */
  page?: string;
  className?: string;
}) {
  const platform = useSyncExternalStore(
    noSubscribe,
    detectPlatform,
    () => null,
  );
  const campaign = useSyncExternalStore(
    noSubscribe,
    readCampaignSnapshot,
    () => "",
  );
  const utm = parseStoredUtm(campaign);

  return (
    <div
      className={className ? `mkt-stores ${className}` : "mkt-stores"}
      id={id}
      data-platform={platform ?? undefined}
    >
      <a
        className="mkt-store-btn mkt-store-play"
        href={playStoreLink(playStoreUrl, utm, page)}
        target="_blank"
        rel="noopener"
      >
        <GooglePlayIcon />
        <span>
          <small>{playSmall}</small>
          Google Play
        </span>
      </a>
      <a
        className="mkt-store-btn mkt-store-ios"
        href={appStoreLink(appStoreUrl, utm, page)}
        target="_blank"
        rel="noopener"
      >
        <AppleIcon />
        <span>
          <small>{appStoreSmall}</small>
          App Store
        </span>
      </a>
    </div>
  );
}
