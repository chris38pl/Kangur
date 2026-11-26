"use client";

import { useSyncExternalStore } from "react";

import { HandoffQr } from "@/components/tools/HandoffQr";
import {
  INVITE_STORAGE_KEY,
  appInviteLink,
  inviteHash,
  isInviteToken,
  readInviteHash,
} from "@/lib/marketing/invite";

import styles from "./InvitePage.module.css";

declare global {
  interface Window {
    /** Left by TAKE_INVITE_EARLY in lib/marketing/invite.ts. */
    __kangurInvite?: string;
  }
}

const noSubscribe = () => () => {};

/** What the early script took out of the address, or what this tab kept from before. */
function readToken(): string {
  if (isInviteToken(window.__kangurInvite)) return window.__kangurInvite;
  // Next.js skips the early script when its bundle starts first. The address still has it.
  const left = readInviteHash(window.location.hash);
  if (left) return left;
  try {
    const kept = window.sessionStorage.getItem(INVITE_STORAGE_KEY);
    if (isInviteToken(kept)) return kept;
  } catch {
    // Storage turned off: only the visit that brought the token knows it.
  }
  return "";
}

/** Null while the server renders: the token exists only in this browser. */
function useInviteToken(): string | null {
  return useSyncExternalStore(noSubscribe, readToken, () => null);
}

/** A mouse or a touchpad: the e-mail is open on a computer, and the app is on a phone. */
const COMPUTER = "(hover: hover) and (pointer: fine)";

function watchPointer(listener: () => void) {
  const query = window.matchMedia(COMPUTER);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

/**
 * Hands the invitation to the app: kangur://invite/<token>, the link the app has always
 * opened. The server HTML keeps its place, so nothing jumps when the token is read.
 */
export function InviteOpen({
  base,
  label,
  missing,
}: {
  base: string;
  label: string;
  missing: string;
}) {
  const token = useInviteToken();
  if (token === null) {
    return (
      <span className={`${styles.open} ${styles.waiting}`} aria-hidden>
        {label}
      </span>
    );
  }
  if (!token) return <p className={styles.missing}>{missing}</p>;
  return (
    <a className={styles.open} href={appInviteLink(base, token)}>
      {label}
    </a>
  );
}

/** On a computer: this page with the invitation, as a code for the phone's camera. */
export function InviteQr({
  title,
  body,
  label,
}: {
  title: string;
  body: string;
  label: string;
}) {
  const token = useInviteToken();
  const computer = useSyncExternalStore(
    watchPointer,
    () => window.matchMedia(COMPUTER).matches,
    () => false,
  );
  if (!token || !computer) return null;

  const url = window.location.origin + window.location.pathname + inviteHash(token);
  return (
    <div className={styles.computer}>
      <div className={styles.qr}>
        <HandoffQr url={url} label={label} />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </div>
  );
}
