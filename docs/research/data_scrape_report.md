# Dataset Scrape Report: OpenFront.io Legacy Data

**Date:** May 29, 2026  
**Source:** `ref/` CSV exports  
**Target:** Front-Nexus MVP (Firebase/Firestore)

---

## 1. Core Data Entities

### Players (`users.csv`, `players_daily.csv`, `users_games.csv`)
*   **Identified Fields:**
    *   `id` / `user_id`: Primary identifier.
    *   `username` / `display_name`: Visual identity.
    *   `total_wins`, `total_score`, `total_games`: Aggregated lifetime performance.
    *   `ffa_wins`, `team_wins`, `duos_wins`, etc.: Performance broken down by game mode.
    *   `win_rate`: Derived field available in daily logs.
*   **Adjustments Needed:**
    *   **ELO Mapping:** The legacy data does not explicitly contain an "ELO" column. We will need to decide if we derive ELO from `total_score` / `total_wins` or if we start a new ELO system from scratch in Front-Nexus.
    *   **K/D Ratio:** Missing from the CSV headers. Since `users_games.csv` exists, we may be able to calculate it if kills/deaths are nested in any JSON blobs (not visible in basic headers) or if we assume a specific scoring weight.

### Clans (`clans.csv`, `clans_daily.csv`)
*   **Identified Fields:**
    *   `id`, `clan_name`, `full_name`, `tag` (inferred from `won_for_clan` in games).
    *   `total_wins`, `total_score`, `position` (Global Rank).
    *   `description`, `discord_url`: Metadata for clan profiles.
*   **Adjustments Needed:**
    *   **Clan ELO:** Similar to players, ELO is absent. The `position` field gives a historical ranking we can use for initial seeding.

### Game History (`game_stats.csv`, `users_games.csv`)
*   **Identified Fields:**
    *   `game_id`, `date`, `game_type`, `map_name`.
    *   `winner_player`, `winner_clan`, `winning_team_color`.
    *   `peak_players`, `duration`.
*   **Adjustments Needed:**
    *   **Participant Lists:** `players_usernames` in `game_stats.csv` appears to be a list/blob. We need to verify if this lists everyone or just top performers.

---

## 2. Front-Nexus Schema Mapping

| Front-Nexus Type | CSV Source | Property Mapping |
| :--- | :--- | :--- |
| `PlayerStats` | `users.csv` + `players_daily.csv` | `username` → `username`, `wins` → `total_wins`, `matches` → `total_games` |
| `ClanRanking` | `clans.csv` | `name` → `clan_name`, `tag` → `tag`, `elo` → (TBD: Map from `total_score`?) |
| `MatchRecord` | `users_games.csv` | `won` → `result`, `date` → `timestamp`, `map` → `map_name` |

---

## 3. Recommendations & Next Steps

1.  **Metric Derivation:** Calculate an "Initial ELO" for the leaderboard using a weighted formula: `(Total Wins * 10) + (Total Score / 100)`.
2.  **Schema Alignment:** The Front-Nexus `PlayerStats` type (in `src/types.ts`) expects `kd: number` and `elo: number`. We should update the ingest script to calculate these from available totals.
3.  **Data Ingestion:** Create a migration script that reads these CSVs and pushes them to Firestore as the "Base State" for the new dashboard.
4.  **UI Adjustments:** Add "Map Popularity" or "Peak Player" charts to the Player/Clan profiles based on the rich data in `game_stats_daily.csv`.
