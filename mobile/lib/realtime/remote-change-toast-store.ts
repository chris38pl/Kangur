type ToastPayload = {
  message: string;
  /** Bumps to force re-render / reset dismiss when replacing. */
  nonce: number;
};

type Listener = (toast: ToastPayload | null) => void;

let current: ToastPayload | null = null;
let nonce = 0;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(current);
}

/** Presentation-only toast store. Never triggers data refresh. */
export function showRemoteChangeToast(message: string): void {
  nonce += 1;
  current = { message, nonce };
  emit();
}

export function clearRemoteChangeToast(): void {
  current = null;
  emit();
}

export function subscribeRemoteChangeToast(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}
