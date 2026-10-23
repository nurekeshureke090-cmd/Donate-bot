1. **Understand the Goal**: The user wants to completely redesign their Telegram Mini App frontend (HTML/CSS/JS) to look modern, premium, and native to Telegram. They provided an index.html, and a proxy endpoint `/api/proxy?path=/games` which connects to the PlayPay.uz API.
2. **Requirements**:
   - Dynamic Games List: Fetch all games dynamically from `/api/proxy?path=/games`. Do not hardcode.
   - Beautiful UI/UX: Telegram native colors (`var(--tg-theme-bg-color)`), smooth animations, rounded corners, grid layout.
   - Game Packages: On click, fetch packages from `/api/proxy?path=/games/{game_id}/packages`. Display in modal or sliding page.
   - User Details Input: Show input for Game ID/Player ID after selecting a package.
   - Loading States: Skeleton loaders/spinners during API fetching.
3. **Current State**: The `index.html` has hardcoded `games` and `gamePackages` arrays, a complex, slightly messy UI, and hardcoded `GAME_MAP`.
4. **Execution Steps**:
   - [ ] Strip out the hardcoded `games` and `gamePackages` from `index.html`.
   - [ ] Implement `fetchGames` that calls `/api/proxy?path=/games` and uses the response to render the list.
   - [ ] Design a clean, Telegram-native grid layout for games.
   - [ ] Implement `openGame(gameId)` which calls `/api/proxy?path=/games/{game_id}/packages`.
   - [ ] Design a beautiful sliding panel or modal for packages.
   - [ ] Implement package selection and show the input for Game ID.
   - [ ] Add skeleton loading states for games and packages.
   - [ ] Maintain Telegram integration (`window.Telegram.WebApp`).
   - [ ] Ensure backward compatibility with existing configuration mechanisms if needed, or focus mainly on the redesign parts.
   - [ ] Complete pre commit steps to ensure proper verification.
