# StreakBot — Public Community Streak Tracker — Bot specification

**Archetype:** community

**Voice:** warm and concise — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot for tracking daily habit streaks, logging relapses, and comparing progress on a public leaderboard. Users can start new streaks, view personal statistics, and control their visibility in the community leaderboard using simple commands and inline buttons.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- individuals joining a public community
- habit trackers
- productivity enthusiasts

## Success criteria

- users can start and maintain streaks with 24h rolling increments
- public leaderboard updates in real-time with top 10 entries
- users can opt out of leaderboard visibility

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu with welcome message and help
- **/streak** (command, actor: user, command: /streak) — Check or start a new streak based on user status
- **/relapse** (command, actor: user, command: /relapse) — End current streak and record best streak
- **/stats** (command, actor: user, command: /stats) — Display personal streak statistics
- **/leaderboard** (command, actor: user, command: /leaderboard) — Show public leaderboard of top 10 users
- **+ Check /streak** (button, actor: user, callback: streak:check) — Quick action to check streak progress
  - inputs: last check-in timestamp
  - outputs: current streak count, time until next increment
- **Relapse** (button, actor: user, callback: streak:relapse) — End current streak and reset counter
  - inputs: current streak data
  - outputs: new streak values, best streak update
- **Stats** (button, actor: user, callback: streak:stats) — View personal statistics
  - inputs: user profile data
  - outputs: current streak, best streak, join date, rank

## Flows

### streak_check
_Trigger:_ /streak

1. Check if user has active streak
2. If no active streak: start new streak with current timestamp
3. If active streak: calculate days since last increment (24h window)
4. Update streak count if >=24h elapsed
5. Show current streak status and time until next increment

_Data touched:_ User profile, Streak record

### relapse_flow
_Trigger:_ /relapse

1. End current streak
2. Store current streak as best streak candidate if applicable
3. Reset current streak to 0
4. Update user's best streak record
5. Notify user of new streak status

_Data touched:_ Streak record, Best streak

### leaderboard_view
_Trigger:_ /leaderboard

1. Fetch top 10 users by current streak
2. Apply tie-breaker using best streak length
3. Format display with usernames and streak stats
4. Show 'Your rank' row if user is outside top 10

_Data touched:_ User profile, Streak record, Best streak, Leaderboard

### visibility_toggle
_Trigger:_ /hide

1. Mark user as hidden in leaderboard settings
2. Confirm visibility change

_Data touched:_ User profile

### visibility_toggle
_Trigger:_ /show

1. Mark user as visible in leaderboard settings
2. Confirm visibility change

_Data touched:_ User profile

## Owner-supplied settings

The OWNER provides these; they are collected in chat and injected into the environment at deploy. Read each one from the environment where it is used (`ctx.env.<KEY>` / `env.<KEY>` on Cloudflare Workers; `process.env.<KEY>` only as a Node/harness fallback — never the sole read). Do NOT invent your own way of learning the value, do NOT ask for it in a bot message, and do NOT hardcode a default.

- **ADMIN_CHAT_ID** — where abuse reports and critical errors are sent
  - this is the OWNER's own chat id; the platform already knows it. Read `ADMIN_CHAT_ID` via `ctx.env` (prefer toolkit `adminChatId` / `requireOwner`) — never ask a user, never treat whoever writes first as the admin, never invent claim-admin or open manage for everyone.
  - may be UNSET at runtime: the bot must still start, and the feature needing ADMIN_CHAT_ID must say so plainly instead of failing.

Your behavioral specs run WITHOUT these values, so no spec may depend on one.

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

An entity that merely NAMES an owner-supplied setting above (an admin chat, an API account) is not something to store or discover — read it from the environment.

- **User profile** _(retention: persistent)_ — Telegram user metadata and preferences
  - fields: telegram_id, display_name, timezone, join_date, is_visible
- **Streak record** _(retention: persistent)_ — Current streak tracking data
  - fields: current_streak_length, streak_start_timestamp, last_check_in_timestamp
- **Best streak** _(retention: persistent)_ — Historical best streak record
  - fields: highest_streak_ever
- **Leaderboard** _(retention: persistent)_ — Ranked list of users by streak performance
  - fields: user_rank, tie_breaker_best_streak

## Integrations

- **Telegram** (required) — Bot API messaging and inline buttons
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- /hide to opt out of leaderboard visibility
- /show to re-enable leaderboard visibility

## Notifications

- Abuse reports to ADMIN_CHAT_ID
- Critical system errors to ADMIN_CHAT_ID

## Permissions & privacy

- User data is stored persistently but not shared beyond display names in leaderboard
- Users can opt out of public leaderboard visibility at any time

## Edge cases

- Users without explicitly set timezones default to UTC
- Streak calculation when last check-in is exactly 24 hours old
- Leaderboard updates during high-concurrency check-in periods

## Required tests

- Verify streak increment after 24h from last check-in
- Confirm leaderboard visibility toggle works for all users
- Test relapse command resets current streak and updates best streak

## Assumptions

- Timezone handling uses Telegram profile when available
- 24-hour window is based on last check-in timestamp, not calendar days
- Leaderboard shows 'Your rank' row for users outside top 10
