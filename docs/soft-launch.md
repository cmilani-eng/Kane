# Soft-launch readiness checklist

Kane soft-launch posture: **local-first**, framed **13+** (no in-game age-gate screen), **`adsEnabled=false`**, cosmetics never pay-to-win.  
Primary playtest path remains **`npm run dev`** (Vite). Hosting preview is optional.

This doc is the honest gate before any public preview URL.

## Ready (shipped stubs)

| Area | Status | Where |
|------|--------|--------|
| Ads off | **OK** — flag `false`; SDK stub idle (menu/post-match hooks only); **no player-facing “ads off” chrome** | `flags.adsEnabled`, `src/ads/`, `docs/ads-sdk.md` |
| Age positioning | **OK** — product framed 13+ / not COPPA child-directed; **in-game AgeGate boot confirmation removed** (product decision) | `flags.ageGateMinYears`, `src/firebase/ageGate.ts` (no-op unlock helpers) |
| Hosting preview config | **OK** — `kane-web` target + `kane-preview` channel scripts (not auto-deployed) | `firebase.json`, `npm run hosting:preview`, `docs/firebase-hosting.md` |
| Admin / `#/admin` | **OK** — local stats, match summaries, daily rollup; allowlist mode defaults **open** locally; menu **Stats** is player-facing | `statsPanel`, `adminAllowlist`, `dailyStatsRollup` |
| Cosmetics | **OK** — skins catalog, local equip, in-match tint; **not purchasable**, no combat stats | `cosmeticsCatalog`, Cosmetics menu, `skinAccent` |
| Legal stubs | **OK** — Privacy / Terms placeholders linked from menu | `games/privacy.html`, `games/terms.html` |
| RTDB / Firestore rules drafts | **OK** — deny-by-default drafts documented | `database.rules.json`, `firestore.rules` |
| SP rematch loop | **OK** — species + difficulty + map prefs; end-screen + pause **Rematch** (same setup) or Return to Menu | `endScreen`, `pauseMenu`, `matchPrefs`, `rematchPrefs`, Battlefield |
| PWA manifest + icons | **OK** — Add to Home Screen stubs; **no** offline service worker yet | `public/manifest.webmanifest`, `public/icons/`, `docs/pwa.md` |
| Master volume | **OK** — mute-aware slider on menu + pause; persists `kane.masterVolume.v1` | `audioContext`, `volumeSlider`, pause/menu |
| Reduce motion | **OK** — pause toggle disables under-attack camera nudge + quiets fog scout pulses; persists `kane.reduceMotion.v1` | `motionPrefs`, `pauseMenu`, `scoutPulseDraw`, `BattlefieldScene` |
| Scout sector label | **OK** — fog scout pulse sets a brief HUD chip with 3×3 sector (NW…SE) | `mapSectorAt`, `scoutSectorHint`, `hud.scoutSector` |
| Minimap scout pulse label | **OK** — fog scout pulse shows short Scout · sector mark (distinct from age tip / Cam · / Fog tips) | `minimapScoutPulseLabel`, `hud.minimapScoutPulse` |
| Minimap scout sector tip | **OK** — fog scout pulse minimap label shows Scout · sector · ns age tip (distinct from sector-only mark / Fog age · / Fog · % / pause Cam ·) | `minimapFogRevealAgeTip`, `hud.fogRevealAge` |
| Minimap camera viewport label | **OK** — gold camera frame on the minimap shows a short View mark | `minimapCameraViewportLabel`, `hud.minimapCamView` |
| Minimap camera sector tip | **OK** — camera frame shows Cam · sector from view-center 3×3 (distinct from View mark / Scout · / Focus ·; same copy as pause Cam tip, own minimap key) | `minimapCameraSectorTip`, `hud.minimapCamSector` |
| Minimap supply usage tip | **OK** — minimap chrome shows Supply · used/cap from living player units vs unitCap (distinct surface from pause Supply tip / Pop · n) | `minimapSupplyTipText`, `hud.minimapSupply` |
| Minimap population tip | **OK** — minimap chrome shows Pop · n from living player units (distinct from Supply · used/cap; same count as pause Pop) | `minimapPopulationTipText`, `hud.minimapPop`, `livingByTeam` |
| Minimap idle worker tip | **OK** — minimap chrome shows Idle · n from idle gatherers (distinct surface from pause Idle tip / Workers · tip / HUD idle chip) | `minimapIdleWorkerTipText`, `hud.minimapIdle`, `countIdleWorkers` |
| Minimap army size tip | **OK** — minimap chrome shows Army · n from living player combat units via isMilitaryUnit (distinct surface from pause Army tip / HUD Army button) | `minimapArmyCountTipText`, `hud.minimapArmy`, `isMilitaryUnit` |
| Minimap worker count tip | **OK** — minimap chrome shows Workers · n from living player gatherers (distinct from Idle · n tip) | `minimapWorkerCountTipText`, `hud.minimapWorkers`, `countLivingWorkers` |
| Minimap building count tip | **OK** — minimap chrome shows Buildings · n from living player buildings (distinct surface from pause Buildings tip / army / supply) | `minimapBuildingCountTipText`, `hud.minimapBuildings` |
| Minimap hero status tip | **OK** — minimap chrome shows Hero · Ready / Down / sector from recruit state + living location (distinct surface from pause Hero tip) | `minimapHeroStatusTipText`, `hud.minimapHeroReady`, `playerHeroDown` |
| Minimap fog coverage tip | **OK** — minimap chrome shows Fog · pct% from explored fog cells (distinct from fog age / scout tips) | `minimapFogCoverageTipText`, `hud.minimapFog`, `fogExploredCoveragePct` |
| Minimap fog age tip | **OK** — minimap chrome shows Fog age · ns from lastFogRevealAgeMs (distinct from pause Fog · ns / Fog · pct% / Scout · sector · ns) | `minimapFogAgeTipText`, `hud.minimapFogAge`, `lastFogRevealAgeMs` |
| Minimap selected count tip | **OK** — minimap chrome shows Selected · n from living player selection (distinct from pause Selected tip) | `minimapSelectedCountTipText`, `hud.minimapSelected` |
| Minimap gold stock tip | **OK** — minimap chrome shows Gold · n from player gold wallet (pairs with Crystal; distinct from pause Gold·Crystal tip) | `minimapGoldStockTipText`, `hud.minimapGold`, `walletOf` |
| Minimap crystal stock tip | **OK** — minimap chrome shows Crystal · n from player magic_crystals wallet (distinct from pause Gold·Crystal tip) | `minimapCrystalStockTipText`, `hud.minimapCrystal`, `walletOf` |
| Minimap match clock tip | **OK** — minimap chrome shows Time · mm:ss from live match elapsed (same formatMatchClock as pause/end; distinct surface) | `minimapMatchClockTipText`, `hud.minimapClock`, `formatMatchClock` |
| Minimap vision tip | **OK** — minimap chrome shows Vision · n from max living-player unit vision tiles (distinct from selection Sight · / Fog · %) | `minimapVisionTipText`, `hud.minimapVision`, `maxPlayerVisionTiles` |
| Attention ping | **OK** — hold minimap to drop a temporary look-here mark (world + minimap); short cooldown + ice deny flash; help notes double-tap recenter; no chat | `battlefieldAttentionPing`, `minimapPingCooldown`, help |
| Minimap ping sector tip | **OK** — hold-to-ping arms a brief Mark · sector chip (HUD + minimap), distinct from scout sector | `attentionPingSectorHint`, `minimapPingSectorTip`, `hud.pingSector` |
| Minimap ping age tip | **OK** — minimap ping chip shows Mark · sector · ns age tip (distinct from sector-only HUD mark) | `minimapPingAgeTip`, `hud.pingAge` |
| End-screen recap | **OK** — standing units/buildings from match-summary `*Left` counts (no invented deaths) | `endScreen`, `end.recap` |
| End kill ratio | **OK** — kills/losses tallied on unit remove; end panel shows the line | `playerUnitKills`, `playerUnitLosses`, `end.killRatio` |
| End units trained tip | **OK** — end screen shows Trained · n from player production completions (not starting roster) | `playerUnitsTrained`, `endUnitsTrainedTipLine`, `end.trainedTip` |
| End buildings raised tip | **OK** — end screen shows Raised · n from player construction completions (not starting halls) | `playerBuildingsRaised`, `endBuildingsRaisedTipLine`, `end.raisedTip` |
| End units lost tip | **OK** — end screen shows Lost · n from player unit removals (distinct from kill-ratio line) | `playerUnitLosses`, `endUnitsLostTipLine`, `end.lostTip` |
| End kills tip | **OK** — end screen shows Kills · n from enemy unit removals (distinct from kill-ratio / Lost tips) | `playerUnitKills`, `endKillsTipLine`, `end.killsTip` |
| End buildings lost tip | **OK** — end screen shows Razed · n from player building destructions (distinct from units Lost tip) | `playerBuildingsLost`, `endBuildingsLostTipLine`, `end.bldLostTip` |
| End gathered | **OK** — Keep deposits tally gold/crystal; end panel shows Gathered line | `playerGoldGathered`, `playerCrystalsGathered`, `end.gathered` |
| End gathered tip | **OK** — end screen shows Gathered · n total deposits (gold+crystals; distinct from g/c breakdown) | `endResourcesGatheredTipLine`, `end.gatheredTip` |
| End APM tip | **OK** — end screen shows APM · n from player commands ÷ match minutes (distinct surface from pause APM tip / Time · duration tip) | `playerActions`, `endApmTipLine`, `end.apmTip` |
| End efficiency tip | **OK** — end screen shows Efficiency · pct% from kills/(kills+losses) (distinct from Kills / Lost / kill-ratio) | `endEfficiencyTipLine`, `end.efficiencyTip` |
| End win streak tip | **OK** — end screen shows Streak · n from matchPrefs.winStreak after prefs write (distinct from Best streak · / pause Streak tip) | `endWinStreakTipLine`, `end.winStreakTip`, `matchPrefs.winStreak` |
| End loss streak tip | **OK** — end screen shows Loss streak · n from matchPrefs.lossStreak after prefs write (distinct surface from lobby/pause Loss streak · and end Streak · tips) | `endLossStreakTipLine`, `end.lossStreakTip`, `matchPrefs.lossStreak` |
| End games played tip | **OK** — end screen shows Played · n from matchPrefs gamesPlayed after prefs write (distinct surface from lobby Played tip / end species Played tip) | `endGamesPlayedTipLine`, `end.gamesPlayedTip`, `matchPrefs.gamesPlayed` |
| End win rate tip | **OK** — end screen shows Win rate · n% from matchPrefs gamesWon / gamesPlayed after prefs write (distinct surface from lobby Win rate / Efficiency tips) | `endWinRateTipLine`, `end.winRateTip`, `matchPrefs.gamesWon` |
| End wins tip | **OK** — end screen shows Wins · n from matchPrefs.gamesWon (same lobbyWinsCount; distinct surface from lobby Wins tip) | `endWinsTipLine`, `end.winsTip`, `lobbyWinsCount` |
| End losses tip | **OK** — end screen shows Losses · n from matchPrefs gamesPlayed − gamesWon (same lobbyLossesCount; distinct from lobby Losses / end Lost · n units) | `endLossesTipLine`, `end.lossesTip`, `lobbyLossesCount` |
| End favorite faction tip | **OK** — end screen shows Favorite · name from most-played species in matchPrefs speciesPlays (same favoriteFactionId as lobby; distinct surface from lobby Favorite / end Played tip) | `endFavoriteFactionTipLine`, `end.favoriteFactionTip`, `favoriteFactionId` |
| End best streak tip | **OK** — end screen shows Best streak · n from matchPrefs.bestWinStreak (distinct from current Streak and lobby Best streak) | `endBestWinStreakTipLine`, `end.bestWinStreakTip`, `matchPrefs.bestWinStreak` |
| End vision tip | **OK** — end screen shows Vision · n from max living-player unit vision tiles at match end (same maxPlayerVisionTiles as minimap; distinct surface / key from minimap Vision · / selection Sight ·) | `endVisionTipLine`, `end.visionTip`, `maxPlayerVisionTiles` |
| Worker carry | **OK** — selection panel shows live carry `n/capacity` + resource label when workers haul | `selectionPanel`, `sel.cargo` |
| Fog last-seen | **OK** — brief fade silhouette for enemy buildings after leaving vision (~2.5s) with whole-second age label | `buildingLastSeenGhost`, `BuildingGhostAgeLabels`, `hud.ghostAge` |
| Fog ghost sector tip | **OK** — leave-vision building ghosts show 3×3 last-seen sector tip (distinct from age) | `buildingGhostSectorTip`, `hud.ghostSector` |
| Incomplete build panel | **OK** — selection shows HP + live build % while a structure is under construction | `selectionPanel`, `sel.buildingPct` |
| Hero hotkey tip | **OK** — selecting a hero shows Q/W/E ability names on the selection panel | `selectionPanel`, `sel.heroHotkeys` |
| Hero ability CD | **OK** — selection tip appends live remaining cooldown; ability buttons show Cooldown Ns | `selectionPanel`, `hud.heroCd`, `sel.cooldown` |
| Ability pad charges | **OK** — crystal-cost ability pads show remaining casts from wallet (`floor(crystals / cost)`) | `abilityChargesLeft`, `hud.abilityCharges`, `battlefieldHud` |
| Full-load deposit | **OK** — full workers show deposit-at-Keep hint on the carry line | `selectionPanel`, `sel.cargoFull` |
| Multi-select counts | **OK** — mixed selection title lists unit types × counts | `selectionPanel`, `sel.typeCount` |
| Queue cancel flash | **OK** — canceling a train flashes the queue row + refund copy with Gold / Crystal amounts | `flashQueueCancel`, `formatQueueCancelFlash` |
| Clear rally | **OK** — selection panel Clear rally resets custom rally to default | `clearBuildingRally`, `sel.clearRally` |
| Rally distance | **OK** — selected producer’s rally flag shows tile distance from the building | `rallyDistanceTiles`, `RallyDistanceLabel` |
| Panel rally dist | **OK** — Set-rally / armed panel button echoes the same tile count | `rallyButtonLabel`, `hud.rallyDist` |
| Low-HP pulse | **OK** — selection HP bar/text soft-pulse under 35% (respects reduced motion) | `selectionPanel` `.is-low` |
| Resource gather tip | **OK** — selecting a node shows haul-per-trip + active gatherer count | `selectionPanel`, `sel.gatherTip*` |
| Supply near-cap tint | **OK** — Supply readout amber within 4 of cap, pink at cap (HUD + pause) | `supplyTone`, `battlefieldHud`, `pauseMenu` |
| Supply slots left | **OK** — near-cap / full supply lines append remaining slots (or “full”) | `formatSupplyLine`, `pause.supplyNear` / `supplyFull` |
| Pause supply tip | **OK** — pause shows Supply · used/cap from living pop vs unitCap at open (distinct surface from minimap Supply / Pop · n / spaced-slash supply line) | `pauseSupplyRatioTipLine`, `pause.supplyRatioTip` |
| Pause win streak tip | **OK** — pause shows Streak · n from matchPrefs.winStreak frozen at open (distinct surface from lobby/end Streak tips) | `pauseWinStreakTipLine`, `pause.winStreakTip`, `matchPrefs.winStreak` |
| Pause loss streak tip | **OK** — pause shows Loss streak · n from matchPrefs.lossStreak frozen at open (distinct surface from lobby Loss streak · and pause Streak · tips) | `pauseLossStreakTipLine`, `pause.lossStreakTip`, `matchPrefs.lossStreak` |
| Pause games played tip | **OK** — pause shows Played · n from matchPrefs.gamesPlayed frozen at open (distinct surface from end/lobby Played tips) | `pauseGamesPlayedTipLine`, `pause.gamesPlayedTip`, `matchPrefs.gamesPlayed` |
| Pause win rate tip | **OK** — pause shows Win rate · n% from matchPrefs gamesWon / gamesPlayed frozen at open (distinct surface from lobby/end Win rate tips) | `pauseWinRateTipLine`, `pause.winRateTip`, `matchPrefs.gamesWon` |
| Pause avg duration tip | **OK** — pause shows Avg time · mm:ss from matchPrefs.avgDurationMs frozen at open (distinct surface from lobby Avg time · and pause Time · match-clock tips) | `pauseAvgDurationTipLine`, `pause.avgDurationTip`, `matchPrefs.avgDurationMs` |
| Pause favorite faction tip | **OK** — pause shows Favorite · name from most-played species in matchPrefs.speciesPlays frozen at open (distinct surface from lobby/end Favorite tips) | `pauseFavoriteFactionTipLine`, `pause.favoriteFactionTip`, `favoriteFactionId` |
| Pause population tip | **OK** — pause shows Pop · n from living player units at open (distinct from Supply · used/cap tip) | `pausePopulationTipLine`, `pause.populationTip` |
| Pause army size tip | **OK** — pause shows Army · n from living player combat units at open (same isMilitaryUnit filter as minimap; distinct surface from minimap Army tip / Pop) | `pauseArmySizeTipLine`, `pause.armyTip`, `isMilitaryUnit` |
| Pause building count tip | **OK** — pause shows Buildings · n from living player buildings at open (same filter as minimap; distinct from Army / Pop) | `pauseBuildingCountTipLine`, `pause.buildingsTip` |
| Pause idle workers tip | **OK** — pause shows Idle · n from idle player gatherers at open (same countIdleWorkers as minimap; distinct from Army / Pop) | `pauseIdleWorkersTipLine`, `pause.idleTip`, `countIdleWorkers` |
| Pause hero status tip | **OK** — pause shows Hero · Ready / Down / sector frozen at open (same minimapHeroStatus logic; distinct surface from minimap tip) | `pauseHeroStatusTipLine`, `pause.heroReady`, `minimapHeroStatus` |
| Pause APM tip | **OK** — pause shows APM · n from playerActions ÷ elapsed minutes at open (same math as end APM tip) | `pauseApmTipLine`, `matchApm`, `pause.apmTip` |
| Pause camera sector tip | **OK** — pause shows Cam · sector from view-center 3×3 frozen at open (distinct from minimap Cam mark) | `pauseCameraSectorTipLine`, `pause.camSectorTip` |
| Pause fog age tip | **OK** — pause shows Fog · ns from last fog scout reveal age frozen at open (distinct from minimap sector age) | `pauseFogAgeTipLine`, `pause.fogAgeTip`, `lastFogRevealAgeMs` |
| Pause fog coverage tip | **OK** — pause shows Fog · pct% from explored fog cells frozen at open (same fogExploredCoveragePct as minimap; distinct from Fog · ns age tip) | `pauseFogCoverageTipLine`, `pause.fogCoverageTip`, `fogExploredCoveragePct` |
| Pause selection count tip | **OK** — pause shows Selected · n from living player units selected at open (distinct from sel.selected flavor) | `pauseSelectionCountTipLine`, `pause.selectionCountTip` |
| Pause selected sector tip | **OK** — pause shows Focus · sector from living player selection centroid at open (distinct from Cam · sector / Selected · n) | `pauseSelectedSectorTipLine`, `pause.selectedSectorTip`, `pauseSelectedSectorAt` |
| Pause resource stock tip | **OK** — pause shows Gold · n · Crystal · m from player wallet frozen at open (distinct from stock strip) | `pauseStockTipLine`, `pause.stockTip` |
| CORE hold banner secs | **OK** — victory-hold banner shows remaining seconds clearly (Ns + “left”) | `coreVictoryBanner`, `banner.coreHold*` |
| CORE hold progress tick | **OK** — hold banner progress bar + per-second clock tick | `coreHoldProgress`, `CoreVictoryBanner` |
| Idle army count | **OK** — Idle army chip leads with idle combat unit count | `battlefieldHud`, `hud.idleArmy`, `countIdleMilitary` |
| Idle army threat | **OK** — idle army chip appends 8-way arrow toward nearest living enemy | `nearestIdleArmyThreatArrow`, `hud.idleArmyThreat` |
| Minimap double-tap flash | **OK** — brief gold wash when double-tap recenters on selection/order | `minimap`, `MINIMAP_FOCUS_FLASH_MS` |
| Minimap select blips | **OK** — selected units draw gold/cream blips above camera/order layers | `minimapSelectedUnitBlip`, `minimap` |
| Help species hotkeys | **OK** — Controls help lists Formation/Mutation/Rage only for the current species | `controlsHelpPanel`, `help.formation` / `mutation` / `rage` |
| Help Tab cycle tip | **OK** — Controls help notes Tab/Shift+Tab walks all → one type → all (locked en/pt-BR/es) | `help.cycle`, `help.cycleKeys`, `controlsHelpPanel` |
| Help minimap ping tip | **OK** — Controls help lists Attention mark · hold minimap (cooldown) · double-tap recenter (locked en/pt-BR/es) | `help.ping`, `help.pingKeys`, `controlsHelpPanel` |
| Formation count tip | **OK** — Nobles selection hint shows F + formed/eligible count | `selectionPanel` `formationCountTip` |
| Stance hotkey echo | **OK** — F / R / M flashes the matching stance button on the selection panel | `flashStanceHotkey` |
| Idle gather target | **OK** — idle worker chip hints nearest Gold/Crystals gather target | `nearestIdleGatherResource`, `hud.idleGather` |
| Idle gather type tip | **OK** — idle worker chip shows Gather · Gold/Crystals tip (distinct from cargo / plain idle) | `idleWorkerGatherTypeTip`, `hud.idleGatherType` |
| End share line | **OK** — end screen Copy result pastes one-line KANE summary (result/species/map/difficulty/clock/standing) | `endShareLine`, `end.share*` |
| Empty selection tip | **OK** — bottom panel shows brief select tip (Army / Idle / Home · Tab cycles types) when nothing is selected | `selectionPanel` `kind: empty`, `sel.empty*` |
| Placement Esc hint | **OK** — place-mode cost strip + armed title mention Esc to cancel | `hud.place`, `sel.placeArmedTitle`, `hud.hintPlace` |
| Placement footprint | **OK** — place strip shows tile footprint size (cols×rows) with the ghost wash | `placementFootprintSize`, `hud.placeFoot` |
| Critical alert chip | **OK** — Keep/hero under-attack chip auto-dismisses ~3.2s (does not refresh every hit) | `battlefieldUnderAttack` `chipLifeMs` |
| Attack direction | **OK** — critical under-attack chip shows an 8-way arrow toward the hit from camera center | `attackDirectionArrow`, `hud.attack*` |
| Menu map tip | **OK** — selected skirmish map shows a one-line flavor blurb under the map row (tall + short menus) | `MenuScene`, `menu.mapTip` |
| Account match clock | **OK** — dashboard (and Stats) recent matches show duration as mm:ss | `dashboardPanel`, `formatMatchClock`, `stats.matchLine` |
| Account prefs map tip | **OK** — account prefs block echoes last/selected map flavor (`menu.mapTip`) | `accountProfileText`, `menu.mapTip` |
| Account prefs faction tip | **OK** — account prefs block echoes last/selected faction name · motto (`lobby.factionTip`) | `accountProfileText`, `lobby.factionTip` |
| Pause map name | **OK** — pause overlay shows Map · name from match mapId (distinct surface from end Map tip; setup line still has clock + supply) | `pauseMapTipLine`, `pause.map`, `pause.setup` |
| Pause species motto | **OK** — pause overlay shows species name · motto tip under the map tip | `pauseSpeciesMottoTipLine`, `pause.speciesMotto` |
| Pause difficulty tip | **OK** — pause overlay shows dedicated Difficulty · name tip (distinct from setup line) | `pauseDifficultyTipLine`, `pause.difficultyTip` |
| Pause objective tip | **OK** — pause overlay shows Objective · text from mission state (Keep/CORE or Practice destroy) | `pauseObjectiveTipLine`, `pause.objectiveTip` |
| Pause elapsed | **OK** — pause shows dedicated Elapsed mm:ss (neutral, not supply-tint) | `pause.elapsed`, `pauseMenu` |
| Pause match clock tip | **OK** — pause shows Time · mm:ss tip from frozen elapsed (distinct from Elapsed line wording) | `pauseMatchClockTipLine`, `pause.clockTip` |
| Train queue ETA | **OK** — selection train line shows remaining seconds beside % | `trainRemainSec`, `sel.training*` |
| Train queue total | **OK** — multi-slot queue line appends summed ETA (head remain + waiting full trainSecs) | `trainQueueTotalSec`, `sel.trainingWait` |
| Train button secs | **OK** — production train browse buttons show full train duration beside Gold/Crystal | `trainFullSec`, `sel.trainSec` |
| Unit armor class | **OK** — selection stats show GDD role as Armor · class (HUD label only) | `unitArmorClass`, `sel.armorClass` |
| Unit armor class tip | **OK** — unit selection shows Armor · type tip (middot; distinct from Armor · n value tip and building Structure tip) | `unitArmorClassTip`, `sel.armorTip` |
| Unit armor value tip | **OK** — selection panel shows Armor · n from unit catalog stats (distinct from Armor · type tip and building Structure tip) | `unitArmorValueLabel`, `sel.armorValueTip`, `unitArmorValue` |
| Unit DPS tip | **OK** — selection stats show DPS · n from catalog dmg / attackCooldownMs (same-type only; distinct from Damage · / Rate · tips) | `unitDps`, `sel.dps` |
| Unit heal rate tip | **OK** — selection stats show Heal · n/s from hero healHp / cooldownMs when applicable (same-type only; buildings / non-heal units omit) | `unitHealRate`, `sel.healRateTip` |
| Unit damage tip | **OK** — selection panel shows Damage · n from catalog attack damage (same-type only; distinct from ATK chip / DPS tip) | `unitDamageLabel`, `sel.dmgTip`, `unitDamage` |
| Unit attack type tip | **OK** — selection stats show Atk · Melee/Ranged tip from catalog reach (middot; same-type or shared type; distinct from Damage · / DPS · / Atk CD ·) | `unitAttackType`, `sel.atkTypeTip` |
| Unit range tip | **OK** — selection stats show Range · n from catalog attack reach in map tiles (same-type only; distinct from Sight tip) | `unitAttackRangeLabel`, `sel.rangeTip` |
| Unit speed tip | **OK** — selection stats show Speed · n from catalog move speed in tiles/s (same-type only; distinct from Pace · cadence / Rate · atk tips) | `unitMoveSpeed`, `sel.speedTip` |
| Unit move cadence tip | **OK** — selection stats show Slow/Medium/Fast pace bucket (shared pace; distinct from numeric speed tip) | `unitMoveCadence`, `sel.moveCadenceTip` |
| Unit vision tip | **OK** — selection stats show Sight · n from catalog vision radius in map tiles (same-type only; distinct from Range ·; buildings omit) | `unitVision`, `sel.visionTip` |
| Unit HP max tip | **OK** — selection stats show Max HP · n from catalog max HP (same-type only; distinct from HP · pct% / HP chip) | `unitHpMax`, `sel.hpMaxTip` |
| Selection HP ratio tip | **OK** — selection stats show live health as HP · pct% from current/max (distinct from Max HP · / HP chip) | `selectionHpRatioTipLine`, `sel.hpRatioTip` |
| Building HP max tip | **OK** — building selection stats show Max HP · n from catalog (shared `sel.hpMaxTip`; distinct from HP · pct%) | `buildingHpMax`, `sel.hpMaxTip` |
| Building armor tip | **OK** — building selection stats show Armor · Structure tip (middot via `sel.armorTip`; distinct from Armor · n / unit type tips) | `buildingArmorClass`, `sel.armorTip`, `sel.armor.structure` |
| Building build cost tip | **OK** — building selection stats show catalog Build gold/crystal cost (omitted for free halls) | `buildingBuildCost`, `sel.buildCost*` |
| Building build time tip | **OK** — building selection stats show catalog Build · {n}s (distinct from live remain / progress) | `buildingBuildTime`, `sel.buildTimeTip` |
| Building footprint tip | **OK** — building selection stats show Size · w×h tiles (same as placement ghost) | `buildingFootprint`, `sel.footprintTip` |
| Building prod queue tip | **OK** — building selection stats show Queue · empty / Training · name / Queue · n when the type can train (distinct from live queue ETA row) | `buildingProdQueue`, `sel.prodQueueEmpty`, `sel.prodQueueTraining`, `sel.prodQueueTip` |
| Unit gather yield tip | **OK** — worker selection stats show Yield · n per trip from catalog haul (distinct from cargo / node tip) | `unitGatherYield`, `sel.yieldTip` |
| Unit cargo capacity tip | **OK** — worker selection stats show Cargo · n max (distinct from Yield per trip / live cargo line) | `unitCargoCapacity`, `sel.cargoCapTip` |
| Unit current cargo tip | **OK** — worker selection stats show Cargo · empty / Cargo · n/cap (distinct from Cargo · n max / Yield / carry line) | `unitCurrentCargo`, `sel.cargoNowEmpty`, `sel.cargoNowTip` |
| Unit atk CD tip | **OK** — selection stats show Atk CD · ns from catalog attackCooldownMs (same-type only; distinct from Rate · / DPS · / hero Cooldown Ns) | `unitAttackCooldown`, `sel.atkCdTip` |
| Unit atk speed tip | **OK** — selection stats show Rate · n/s from catalog attackCooldownMs (same-type only; distinct from Atk CD ·) | `unitAttackSpeed`, `sel.atkSpeedTip` |
| Unit supply tip | **OK** — selection stats show Supply · n from catalog (1 slot per unit, same-type only; buildings omit) | `unitSupplyCost`, `sel.supplyTip` |
| Unit train gold tip | **OK** — selection stats show Gold · n from catalog train gold (same-type only; distinct from inline Gold chip) | `unitTrainGold`, `sel.trainGoldTip` |
| Unit train crystal tip | **OK** — selection stats show Crystal · n from catalog train crystals (same-type only; omitted when 0; distinct from inline Crystal chip) | `unitTrainCrystal`, `sel.trainCrystalTip` |
| Unit train duration tip | **OK** — selection stats show catalog full train seconds (same-type only; omitted when 0) | `unitTrainDuration`, `sel.trainDurationTip` |
| Unit role tip | **OK** — selection stats show coarse duty role (worker / combat / hero), distinct from armor class | `unitRole`, `sel.roleTip` |
| Unit species tip | **OK** — selection stats show species name tip when selection shares one species | `unitSpeciesTip`, `sel.speciesTip` |
| Unit name tip | **OK** — selection stats show catalog unit name tip when selection shares one type | `unitNameTip`, `sel.nameTip` |
| Build remain secs | **OK** — incomplete building selection shows construction seconds beside % | `buildRemainSec`, `sel.buildingPct` |
| Building build progress tip | **OK** — incomplete building selection stats show Build · pct% · secs left (distinct from catalog Build ns / Building pct line) | `buildingBuildProgress`, `sel.buildProgressTip` |
| Place build secs | **OK** — place-mode cost strip shows full construction seconds when buildMs > 0 | `hud.placeBuild`, `setPlacementCost` |
| Stock supply tone | **OK** — DOM stock strip uses the same near-cap/full supply tones as HUD/pause | `stockStrip`, `supplyTone` |
| Stock income rate | **OK** — stock strip shows rolling gold/crystal +n/m from deposits (60s window) | `stockIncome`, `hud.incomeRate`, `matchUiStore` |
| Stock deposit tip | **OK** — stock strip shows quiet Deposit at Keep reminder | `stockDepositTipLine`, `hud.depositTip` |
| End meta difficulty | **OK** — end screen meta line shows map · difficulty · mm:ss | `endScreen`, `end.meta` |
| End duration tip | **OK** — end screen shows Time · mm:ss from match elapsed (same formatMatchClock; distinct surface from pause/minimap Time tips / APM) | `endDurationTipLine`, `end.durationTip` |
| End avg duration tip | **OK** — end screen shows Avg time · mm:ss from matchPrefs.avgDurationMs after prefs write (distinct surface from lobby/pause Avg time · and this-match Time · tips) | `endAvgDurationTipLine`, `end.avgDurationTip`, `matchPrefs.avgDurationMs` |
| End species tip | **OK** — end screen shows dedicated Played · faction tip under duration | `endSpeciesPlayedTipLine`, `end.speciesTip` |
| End map tip | **OK** — end screen shows Map · name from match mapId (distinct from Map · w×h size tip / meta line) | `endMapPlayedTipLine`, `end.mapTip` |
| End map size tip | **OK** — end screen shows Map · w×h from match mapId + MAP catalog bounds (distinct surface from lobby Map size / end Map · name) | `endMapSizeTipLine`, `end.mapSizeTip`, `MAP` |
| End difficulty tip | **OK** — end screen shows dedicated Difficulty · label tip under map (distinct from meta line) | `endDifficultyPlayedTipLine`, `end.difficultyTip` |
| End objective result tip | **OK** — end screen shows Objective · Won/Lost framing from match end reason | `endObjectiveResultTipLine`, `end.objectiveTip` |
| Easy AI cushion | **OK** — Easy gives player start gold/crystal cushion + slower AI eco; menu shows a short tip only while Easy is selected | `aiDifficulty`, `MenuScene`, `createBattlefieldWorld` |
| Hard lean tip | **OK** — Hard shows a quiet leaner-start tip (same pattern as Easy); Normal stays tip-free; short/landscape menu shows the tip too | `MenuScene`, `menu.hardTip` |
| In-match tips | **OK** — coach copy covers Pause/Esc, Home, Army, Idle chip, Rematch | `battlefieldTutorial`, `tutorialCoach` |
| Friend lobby UI | **OK** — Create / Join / Leave local stub; quiet “no live sync” note | `lobbyPanel`, `lobbyStub` |
| Lobby map tip | **OK** — lobby shows selected map label · blurb tip from match prefs | `lobbyMapTipLine`, `lobby.mapTip` |
| Lobby faction tip | **OK** — lobby shows selected species name · motto blurb from match prefs | `lobbyFactionTipLine`, `lobby.factionTip` |
| Lobby last faction tip | **OK** — lobby shows Last · faction from match prefs species (distinct from Favorite · / Played · n / selected motto tip) | `lobbyLastFactionTipLine`, `lobby.lastFactionTip`, `matchPrefs.species` |
| Lobby favorite faction tip | **OK** — lobby shows Favorite · name from most-played species in matchPrefs speciesPlays (distinct surface from end Favorite tip / last-faction) | `lobbyFavoriteFactionTipLine`, `lobby.favoriteFactionTip`, `matchPrefs.speciesPlays` |
| Lobby species plays tip | **OK** — lobby shows Plays · n for favorite species play count from speciesPlays (distinct from Played · / Favorite · / Last ·) | `lobbySpeciesPlaysTipLine`, `lobby.speciesPlaysTip`, `matchPrefs.speciesPlays` |
| Lobby last map tip | **OK** — lobby shows Last map · name from match prefs (distinct from selected map blurb tip) | `lobbyLastMapTipLine`, `lobby.lastMapTip` |
| Lobby best map tip | **OK** — lobby shows Best map · name from matchPrefs.bestDurationMapId (map of shortest win; distinct from Last map / Best · clock) | `lobbyBestMapTipLine`, `lobby.bestMapTip`, `matchPrefs.bestDurationMapId` |
| Lobby last map size tip | **OK** — lobby shows Map · w×h from remembered map prefs + MAP catalog (distinct from Last map name tip) | `lobbyLastMapSizeTipLine`, `lobby.lastMapSizeTip`, `MAP` |
| Lobby last difficulty tip | **OK** — lobby shows Last difficulty · label from match prefs (distinct from selected difficulty blurb) | `lobbyLastDifficultyTipLine`, `lobby.lastDifficultyTip` |
| Lobby last duration tip | **OK** — lobby shows Last · mm:ss from match prefs lastDurationMs (distinct from Best · / Avg time · and ~min match-length) | `lobbyLastDurationTipLine`, `lobby.lastDurationTip`, `matchPrefs.lastDurationMs` |
| Lobby best duration tip | **OK** — lobby shows Best · mm:ss from shortest winning match in prefs (distinct from last-duration tip) | `lobbyBestDurationTipLine`, `lobby.bestDurationTip`, `matchPrefs.bestDurationMs` |
| Lobby avg duration tip | **OK** — lobby shows Avg time · mm:ss from career avgDurationMs in prefs (distinct from Last · / Best · / ~min match-length) | `lobbyAvgDurationTipLine`, `lobby.avgDurationTip`, `matchPrefs.avgDurationMs` |
| Lobby avg APM tip | **OK** — lobby shows Avg APM · n from career avgApm in prefs (distinct surface from end/pause APM · match-rate tips) | `lobbyAvgApmTipLine`, `lobby.avgApmTip`, `matchPrefs.avgApm` |
| Lobby last outcome tip | **OK** — lobby last-result tip shows Last · Won/Lost from match prefs lastWon (distinct from Last duration / Last faction / Streak; not a motto tip) | `lobbyLastOutcomeTipLine`, `lobby.lastOutcomeWin` / `lastOutcomeLoss`, `matchPrefs.lastWon` |
| Lobby win streak tip | **OK** — lobby shows Streak · n from matchPrefs.winStreak (distinct from Best streak · / end Streak / pause Streak tip) | `lobbyWinStreakTipLine`, `lobby.winStreakTip`, `matchPrefs.winStreak` |
| Lobby best streak tip | **OK** — lobby shows Best streak · n from matchPrefs.bestWinStreak peak (distinct surface from current Streak · n and end Best streak tip) | `lobbyBestWinStreakTipLine`, `lobby.bestWinStreakTip`, `matchPrefs.bestWinStreak` |
| Lobby loss streak tip | **OK** — lobby shows Loss streak · n from matchPrefs.lossStreak (distinct from Streak · / Best streak · / Losses ·) | `lobbyLossStreakTipLine`, `lobby.lossStreakTip`, `matchPrefs.lossStreak` |
| Lobby games played tip | **OK** — lobby shows Played · n from matchPrefs.gamesPlayed (distinct surface from end/pause Played tips / Plays · n / stats panel) | `lobbyGamesPlayedTipLine`, `lobby.gamesPlayedTip`, `matchPrefs.gamesPlayed` |
| Lobby losses tip | **OK** — lobby shows Losses · n from gamesPlayed − gamesWon (distinct from Played / Win rate) | `lobbyLossesTipLine`, `lobby.lossesTip`, `matchPrefs.gamesPlayed` / `gamesWon` |
| Lobby wins tip | **OK** — lobby shows Wins · n from match prefs gamesWon (distinct from Losses / Win rate) | `lobbyWinsTipLine`, `lobby.winsTip`, `matchPrefs.gamesWon` |
| Lobby win rate tip | **OK** — lobby shows Win rate · n% from matchPrefs gamesWon / gamesPlayed (distinct surface from end Win rate tip / streak / played tips) | `lobbyWinRateTipLine`, `lobby.winRateTip`, `matchPrefs.gamesWon` |
| Lobby difficulty tip | **OK** — lobby shows selected difficulty label · blurb from match prefs | `lobbyDifficultyTipLine`, `lobby.difficultyTip` |
| Lobby match length | **OK** — lobby shows ~min estimate from recent local summaries (default ~10 min) | `lobbyMatchLengthTipLine`, `lobby.matchLength*` |
| Hub → Kane path | **OK** — picker cards link `./kane/`; hash forward + manifest start_url match `games/PATHS.md` | `hub.gamePlayHref`, `games/registry.test.ts` |
| Hub Kane path tip | **OK** — Kane hub card shows Soft-launch path · /kane/ tip | `hubKanePathTip`, `hub.kanePathTip` |
| Hub Blob path tip | **OK** — Blob Evolution hub card shows Soft-launch path · /blob-evolution/ tip | `hubBlobPathTip`, `hub.blobPathTip` |
| Hub → Blob path | **OK** — picker cards link `./blob-evolution/`; Vite entry `main.js` guarded in registry tests | `hubLinks`, `games/PATHS.md` |
| Soft-launch Kane path tip | **OK** — menu soft-launch strip lists `/kane/` (trailing slash, PATHS.md) | `softLaunchKanePathTip`, `softLaunchStatusStrip` |
| Soft-launch Blob path tip | **OK** — menu soft-launch strip lists `/blob-evolution/` (trailing slash, PATHS.md) | `softLaunchBlobPathTip`, `softLaunchStatusStrip` |
| Soft-launch hub path tip | **OK** — menu soft-launch strip shows Hub · / tip (PATHS.md root) | `softLaunchHubPathTip`, `soft.hubPathTip` |
| Hub legal footer | **OK** — Privacy / Terms footer hrefs stay `/privacy.html` and `/terms.html` after the games/ move | `hubLegalHref`, `games/privacy.html` |
| Hub footer year | **OK** — picker footer shows `© {year}` from the calendar year | `hubFooterYear`, `hub.year`, `#hub-year` |
| Legal hub-back | **OK** — Privacy / Terms use `← Games` `#hub-back` to `/` (Blob parity) | `games/privacy.html`, `games/terms.html` |
| Kane → hub back | **OK** — soft-launch strip shows `hub /`; menu ← Games returns to the picker | `softLaunchStatusStrip`, `MenuScene` `menu.games` |
| Menu Games aria | **OK** — menu mounts `#kane-menu-games` with localized `aria-label` (Back to Games hub) | `menuGamesLink`, `menu.gamesAria` |
| Blob → hub back | **OK** — Blob Evolution keeps a fixed ← Games link to `/` with `aria-label` (Back to Games hub) | `games/blob-evolution/index.html` `#hub-back` |
| Hub status badges | **OK** — every hub card shows Live or Soft launch from `games.json` status | `hub.ts` `statusPill`, `hub.live` / `hub.experimental` |
| Hub Live aria | **OK** — Live status pill sets `aria-label` via `hub.liveAria` (Status: Live) | `hub.ts` `statusPill`, `hub.liveAria` |
| Hub Soft launch aria | **OK** — Soft launch pill sets `aria-label` via `hub.experimentalAria` | `hub.ts` `statusPill`, `hub.experimentalAria` |
| Hub card focus | **OK** — keyboard focus-visible ring on `.hub-card` (accent outline + soft glow) | `games/hub/hub.css` |
| Hub card Enter | **OK** — picker subtitle + card `aria-label` note Tab · Enter opens | `hub.subtitle`, `hub.cardOpen`, `hub.ts` |
| Hub document title | **OK** — picker tab title is `KANE · Game picker` (localized) | `hub.documentTitle`, `games/index.html` |
| Kane document title | **OK** — play tab is `KANE · BUILD. COMMAND. CONQUER.` | `brandDocumentTitle`, `games/kane/index.html` |
| Blob document title | **OK** — Blob tab is `Blob Evolution 3D · Eat. Evolve. Ascend.` | `games/blob-evolution/index.html` |
| Legal document titles | **OK** — Privacy / Terms tabs are `KANE · Privacy` / `KANE · Terms` | `games/privacy.html`, `games/terms.html` |
| Hub meta description | **OK** — picker `#hub-meta` is a short localized blurb | `hub.meta`, `games/index.html` |
| Kane meta description | **OK** — play `#kane-meta` is name · tagline — genre | `brandMetaDescription`, `games/kane/index.html` |
| Blob meta description | **OK** — Blob `#blob-meta` is title · tagline — blurb | `games/blob-evolution/index.html` |
| Legal meta descriptions | **OK** — Privacy / Terms stubs carry short `#privacy-meta` / `#terms-meta` blurbs | `games/privacy.html`, `games/terms.html` |

## Remaining gaps (honest)

1. **Hosting** — live site https://kane-rts-game.web.app (`kane-rts-game`). GHA deploy on `dev` uses `FIREBASE_SERVICE_ACCOUNT_KANE_RTS_GAME` (Firebase Hosting GitHub integration — see `docs/firebase-hosting.md`).
2. **Firebase Auth / player dashboard** — email/password + anonymous guest + Firestore `users/{uid}` path in client; requires Console Email/Password + Anonymous, **rules deploy** (draft only in repo until Cassio asks), and `VITE_FIREBASE_*` in the Hosting build env. Without env, guest SP falls back to local-only.
3. **No live multiplayer** — lobby codes and command-sync spike are local/transport stubs only.
4. **Ads SDK not bundled** — flipping `adsEnabled` still shows stub logs only (`docs/ads-sdk.md`).
5. **Admin allowlist is soft** — default `open` for local-dev; no Custom Claims / server enforcement. Admin **`#/admin`** tools are separate from menu **Stats**.
6. **Match writes are client-trusted** for SP MVP — Functions deferred; local `#/admin` summaries still device-local.
7. **Legal copy is placeholder** — not counsel-reviewed.
8. **Content depth** — three skirmish maps (Crossing / Ridge / Gap). The coach shows once, then stays quiet until Tips is turned back on. A win offers the next difficulty (same species and map); a loss offers the previous one. Rematch stays on the difficulty just played. Practice has no step down. Hard has no step up. A Hard win offers the next map at Hard, same species; Rematch stays on the map just played. A Hard win on the last map offers the next species at Hard on the first map.
9. **CI is thin** — pull requests run lint, unit tests and the build (`.github/workflows/ci.yml`) and a push to `dev` runs the same checks before auto-deploying Hosting (see `docs/firebase-hosting.md`); there are no browser or gameplay tests yet.
10. **Cosmetics shop** — explicitly out; free unlocks only.
11. **No offline service worker** — installability stubs exist; full offline PWA is later (`docs/pwa.md`).

## Soft-launch “go” bar (minimum)

- [x] Ads still `false` on the build you deploy (`flags.adsEnabled: false`)
- [x] Boot splash → Menu with **no** age-gate / 13+ confirmation screen
- [x] SP match + **Rematch** works on a mid-range phone over LAN Vite (or preview URL) — checked in emulated 640×360 / 780×360 / 844×390 viewports (#343 end screen, #355 + #350 HUD); a real-device pass is still worth doing
- [x] Easy start shows player cushion; Normal/Hard feel unchanged (Easy 300g / 55c, Normal/Hard 220g / 40c)
- [x] Menu/pause volume persists across reload; mute still silences (`kane.masterVolume.v1`; pause Sound toggle + master volume slider)
- [x] PWA manifest + icons load (Add to Home Screen when HTTPS/localhost)
- [x] In-match tips mention Pause, Home, Army, Idle, Rematch
- [x] Menu **Stats** shows player record; `#/admin` shows admin tools when allowed
- [x] Cosmetics equip visible in-match; no power change (accent changes; unit stats and wallet identical)
- [x] Privacy/Terms links open
- [x] Preview channel deploy smoke (when project exists) with **zero** ad network requests — run against live `kane-rts-game.web.app` (boot → match → end screen, only first-party requests); repeat on the preview channel for the release build
- [x] Menu/lobby chrome has **no** “ads off” / age-gate confirmation status dump

## Menu status strip

The title menu shows a one-line soft-launch strip (hosting · admin · cosmetics · vol · pwa · Hub · / · /kane/ · /blob-evolution/) built by `src/presentation/ui/softLaunchStatus.ts`. Ads and age-gate flags stay out of that strip so the main experience stays clean. A ← Games footer link returns to the hub picker at `/`.
