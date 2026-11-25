import styles from "./ChatCard.module.css";

export type ChatMessage = readonly ["me" | "them", string];

export type Chat = {
  contact: string;
  status: string;
  messages: readonly ChatMessage[];
};

/**
 * A conversation in no particular messenger. Text, not a picture: it can be read aloud,
 * translated and found.
 */
export function ChatCard({
  chat,
  label,
  className,
}: {
  chat: Chat;
  /** Says what this is to someone who cannot see it. */
  label: string;
  className?: string;
}) {
  return (
    <figure
      className={[styles.card, className ?? ""].filter(Boolean).join(" ")}
      aria-label={label}
    >
      <div className={styles.head} aria-hidden>
        <span className={styles.avatar}>{[...chat.contact][0]}</span>
        <span>
          <b>{chat.contact}</b>
          <small>{chat.status}</small>
        </span>
      </div>
      <ul className={styles.messages}>
        {chat.messages.map(([who, text]) => (
          <li key={text} className={who === "me" ? styles.me : styles.them}>
            {text}
          </li>
        ))}
      </ul>
    </figure>
  );
}
