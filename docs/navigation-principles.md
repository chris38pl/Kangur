# Navigation Principles

**Audience:** anyone adding a mobile screen  
**Read time:** ~5 minutes  
**Code:** [`mobile/lib/navigation/`](../mobile/lib/navigation/)

---

## Screen classes

| Class | Meaning | Examples |
|-------|---------|----------|
| **Root** | App anchors (tabs). Never “below” these. | Home, Workspace, History, Profile |
| **Task** | A user job. When it ends, its history must disappear. | Shopping Mode, AI Import, Create List, Invite accept, notification deep-links |
| **Details** | Hierarchical drill-down. Back walks up. | List → item edit, Profile → Account → Change password, Home → Menu |

**Decision question:** *Is this a separate user job that must not remain in history after it ends?* → Task. Otherwise Root or Details.

---

## Task vs Session

```text
Task
 ├── always has an Intent   (what the user did → side effects, including navigation)
 └── may have a Session     (durable / resumable domain state: ACTIVE, PAUSED, …)
```

| Example | Session | Intent |
|---------|---------|--------|
| Shopping | yes | yes |
| AI Import | yes if resume/draft needed | yes |
| Invite accept | no | yes |
| Notification deep-link | no | yes |
| Premium / OAuth callback | usually no | yes |

Do **not** invent a Session for every workflow. Invite and notification screens are Intent-only Tasks.

---

## Task lifecycle (only when there is a Session)

```text
started → active → paused → completed
                      ↘ cancelled
```

Shopping maps roughly to `STARTING` / `ACTIVE` / resumable / `FINISHING→ENDED` / `discard`. UI calls Intent methods (`complete`, `cancel`, …); the Intent owns analytics, cache, and navigation.

Intent-only Tasks skip these states — just actions (`accept`, `dismiss`, …) then navigation.

---

## Navigation ownership

| Layer | May navigate? |
|-------|----------------|
| UI components | **No** |
| Feature screen | Only `navigateBack()`, `openDetails()`, and simple `replaceDetails()` |
| Task Intent | **Yes** (`finishTask`, `goRoot`, `finishTaskAndOpen`, …) |
| Navigation module | **Yes** — implementation (`dismissTo`, …) |

No raw `router.replace("/(tabs)")` in screens. Screens describe *what happened*; Intents decide *where to go*.

---

## Root Back (Android)

Config SSOT: `RootScreens` in [`mobile/lib/navigation/root-screens.ts`](../mobile/lib/navigation/root-screens.ts).

| `back` value | Behavior |
|--------------|----------|
| `"home"` | Switch to Home tab (do not exit) |
| `"exit"` | First press: toast; second within 2s: exit app |

Today: Home → `exit`; Workspace / History / Profile → `home`. Nested Details under a Root tab (e.g. Home → Menu) use `navigateBack()` first.

Adding a Root tab = add an entry to `RootScreens`.

---

## Navigation API

| Method | Responsibility |
|--------|----------------|
| `goRoot()` | Leave stacks and land on app Root (today: Home tabs) |
| `finishTask()` | End Task → Root; clear Task history |
| `finishTaskAndOpen(href)` | End Task → Root → push Details |
| `replaceDetails(href)` | Replace current Details (e.g. Edit → saved Product) |
| `navigateBack()` | One step back in hierarchy |
| `navigateUp()` | Up to parent when back is unavailable |
| `openDetails(href)` | Push Details |
| `openTask(href)` | Push Task |

`goRoot` is intentional: Home is only the current Root implementation.

---

## Checklist: new screen

1. Class? Root / Task / Details.
2. If Task: Intent always; Session only if resume/durable state.
3. End of Task → Intent → `finishTask` / `finishTaskAndOpen` (never leave Task frames under Root).
4. Details → `navigateBack` / `replaceDetails`; do not call `finishTask`.
5. New Root tab → `RootScreens` entry.
6. No navigation from dumb UI components.
