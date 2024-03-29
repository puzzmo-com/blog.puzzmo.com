+++
title = 'How the Puzzmo API handles integrations on a per-game basis'
date = 2023-12-22T12:56:32Z
authors = ["orta"]
tags = ["tech", "api", "plugins"]
theme = "outlook-hayesy-beta"
draft = true
+++

### Control

At heart, programming is the art of deciding which systems interact with each other and where decision making happens. This tension became very apparent as we started to first build out the leaderboard systems in Puzzmo. At the beginning, decision's around control were easy as there was only 2 leaderboards for each game. The API would provide these two leaderboards for every game at the place where we kept the rest of the leaderboard infra. Done.

When we decided that each game should start having some different leaderboards, this is still totally easy to contain - we'll make a `leaderboards.ts` file which lists all the games and says what the leaderboards per-game are are. Great.

So we start looking at another system, news. Again, easy at first, we have time and points of puzzles played by friends or best-ofs. Again, we can put that logic with the news generation code. Also, not a surprise to find out that we want news items to be different on a per-game basis. OK, `news.ts` in a lib file.

Repeat this pattern for User Statistics, Puzzle Statistics, Game editorials, Highlights (e.g. looking through your historical records to say 'Least Wednesday rotations') and you start to see yourself in a position where making a new game and integrating into Puzzmo's API-level systems is quite a thing.

So, we needed a new abstraction. I turned to a system I've used a million times before.

### Plugins

Yep, that's the story. Once again, re-inventing plugin infrastructure in another codebase. When I start to get a bit itchy that too many things are in too many places, I re-read up on aspect-oriented programming and try to think "what are the aspects of this system which I want centralizing". So, this is what I came up with.

You use TypeScript's relatively recent "satisfies" operator to allow for custom config game objects which still have literal values, tied to a generic type that handles a lot of the API setup and providing types for the messages between the games/app/api.

```ts
/** Provides some base-line information about the statistics we which store, a game's specific implementation would override these with real types */
type GameData = { pipelineStats: any[]; puzzleAggregateStats: any[]; userAggregateStats: any[] }

/** Ensures all items in a tuple have undefined added */
type AddUndefined<Tuple extends readonly unknown[]> = { [Index in keyof Tuple]: Tuple[Index] | undefined }

/**
 * A generalized game extension point for the API, with each feature like leaderboards, news etc, then this lets provides
 * a hook in point for a game to provide its unique results
 */
export type APIGame<Stats extends GameData> = {
  /** The games slug in the db */
  slug: CoreGames | ExperimentalGames | PrereleaseGames

  /**  So that we can keep an aggregate of all words found across all games */
  wordsFound: (stat: Stats["pipelineStats"]) => number

  /** Update the stats which you see on the user profile based on */
  updateUserAggregateStats: (
    gamePlay: RichGamePlay,
    pipelineData: Stats["pipelineStats"],
    userStats: UserStatsJSON,
    prior: AddUndefined<Stats["userAggregateStats"]>,
    util: UserAggUtil
  ) => Promise<Stats["userAggregateStats"]>

  /** Basically what are highlights of this gameplay */
  gameplayUserHighlights: (
    gamePlay: GamePlay,
    userStats: UserStatsJSON,
    dailyDayMonFirst: number | undefined,
    daily: Daily | undefined | null,
    viewerIsParticipant: boolean,
    weekday: string | undefined
  ) => { title: string | undefined; bestIDs: string[] }

  /** Items which might appear under puzzle recs on the today page */
  editorialForDailyPuzzleRec: (streak: Streak, rec: RichDaily["puzzles"][number]) => Promise<Editorial | undefined>

  /** Social news items which can come from any game play from someone else (and maybe your gameplay on the same puzzle)   */
  socialNewsForPuzzle: (
    puzzle: Puzzle & { game: Game },
    fGP: GamePlay,
    friend: User,
    yourGameplay: GamePlay | undefined,
    utils: SocialNewsUtil
  ) => TopicNewsItem[]

  /** Social news items which can come from any game play from someone else (and maybe your gameplay on the same puzzle) */
  newsItemFromPuzzleAggregate: (
    puzzle: Puzzle & { game: Game },
    data: Stats["puzzleAggregateStats"],
    usageStats: PuzzleStats<object>,
    yourGameplay: GamePlay | undefined,
    util: NewsFromPuzzleAggregateUtil
  ) => Promise<TopicNewsItem[]>

  /** Social news items which come from your personal best x,y,z */
  newsItemsFromUserAggregateStats: (
    stats: UserStatsJSON,
    dayStartingMon: number,
    // e.g. "Monday", "Tuesday"
    dayString: string,
    isInDateRange: (date: number | undefined | null) => boolean,
    startDatestamp: number,
    endDatestamp: number
  ) => Promise<TopicNewsItem[]>

  /** Custom leaderboards (e.g. not score) */
  leaderboardsForGame: (puzzleID: string) => LeaderboardSubset[]

  /** Update the single aggregate stat for a puzzle  */
  updatePuzzleAggregateStats: (
    pipelineStates: Stats["pipelineStats"],
    gameplay: GamePlay,
    priorResults: AddUndefined<Stats["puzzleAggregateStats"]>,
    utils: PuzzleAggregateStatsUtils
    }
  ) => Promise<Stats["puzzleAggregateStats"]>

  /** The key used in the aggregate stats which are just for this game */
  userAggregateStatsKey: string | null

  /**  The position in which we keep "top firstPlaceDailyScoreFinishes" in the tuple */
  userAggregateStatsFinishesIndex: number | null
}
```

This being the direct type from our API gives you a sense of what sort of integration points we need when thinking about how "Puzzmo" interacts with an individual game. We provide a default fallback implementation that is mostly a NOOP for all of these points, and until someone comes and and says "this game is far along enough to warrant hooking in" then no implementation is needed. This is one of the key "TODO"s on taking a Puzzmo Experimental game like Wordbind to "production".

So, let's take a look at a concrete example of that. This is how we integrate Really Bad Chess into API:

```ts
import { secondsToHms } from "$shared/secondsToHms"
import type { BestOfStat, ReallyBadChessStats } from "$shared/statsAPI"
import { reallyBadChessStatsKeys, reallyBadChessStatsPuzzleAggregateStatsObjToArr, reallyBadChessStatsUserAggregateStatsObjToArr } from "$shared/statsAPIRuntime"

import type { LeaderboardData } from "$tasks/completion/leaderboardMeta"

import type { APIGame, TopicNewsItem } from "./gameRepo"

// Keys for our stats tuples:
const uk = reallyBadChessStatsKeys.userAggregateStats
const pk = reallyBadChessStatsKeys.puzzleAggregateStats

const slug = "really-bad-chess"

const reallyBadChessGame = {
  slug,
  // So that we can keep an aggregate of all words found across all games
  wordsFound: () => 0,
  // Update the stats which you see on the user profile based on
  updateUserAggregateStats: async (gamePlay, pipelineData, userStats, prior, util) => {
    const pk = reallyBadChessStatsKeys.pipelineStats
    const isMostMoves = pipelineData[pk.moves] > (prior[uk.longestGame] || 0)

    return reallyBadChessStatsUserAggregateStatsObjToArr({
      leastMoves: util.updateWeekStat(
        pipelineData[pk.moves],
        (priorV) => pipelineData[pk.moves] < (priorV || Number.MAX_VALUE),
        prior[uk.leastMoves]
      ),
      fastestWin: util.updateWeekStat(
        gamePlay.combinedTimeSecs,
        (priorV) => gamePlay.combinedTimeSecs < (priorV || Number.MAX_VALUE),
        prior[uk.fastestWin]
      ),
      leastPiecesLost: util.updateWeekStat(
        pipelineData[pk.piecesLost],
        (priorV) => pipelineData[pk.piecesLost] < (priorV || Number.MAX_VALUE),

        prior[uk.leastPiecesLost]
      ),

      mostPiecesTaken: util.updateWeekStat(
        pipelineData[pk.piecesTaken],
        (priorV) => pipelineData[pk.piecesTaken] > (priorV || 0),
        prior[uk.mostPiecesTaken]
      ),

      mostPoints: util.updateWeekStat(gamePlay.pointsAwarded, (priorV) => gamePlay.pointsAwarded > (priorV || 0), prior[uk.mostPoints]),
      longestGame: isMostMoves ? pipelineData[pk.moves] : prior[uk.longestGame] || 0,

      totalPiecesTaken: (prior[uk.totalPiecesTaken] || 0) + pipelineData[pk.piecesTaken],
      totalPiecesLost: (prior[uk.totalPiecesLost] || 0) + pipelineData[pk.piecesLost],

      totalPawnsUpgraded: (prior[uk.totalPawnsUpgraded] || 0) + pipelineData[pk.pawnsUpgraded],
      totalMovesMade: (prior[uk.totalMovesMade] || 0) + pipelineData[pk.moves],
      totalCastles: (prior[uk.totalCastles] || 0) + pipelineData[pk.castles],
      totalEnPassantTakes: (prior[uk.totalEnPassantTakes] || 0) + pipelineData[pk.enPassantTake],

      totalGames: (prior[uk.totalGames] || 0) + 1,
      timePlayed: (prior[uk.timePlayed] || 0) + gamePlay.elapsedTimeSecs, // _not combined_,

      checkmatesWithPawns: (prior[uk.checkmatesWithPawns] || 0) + pipelineData[pk.checkmateWithPawn],
      checkmatesWithBishops: (prior[uk.checkmatesWithBishops] || 0) + pipelineData[pk.checkmateWithBishop],
      checkmatesWithKnights: (prior[uk.checkmatesWithKnights] || 0) + pipelineData[pk.checkmateWithKnight],
      checkmatesWithRooks: (prior[uk.checkmatesWithRooks] || 0) + pipelineData[pk.checkmateWithRook],
      checkmatesWithQueens: (prior[uk.checkmatesWithQueens] || 0) + pipelineData[pk.checkmateWithQueen],
      checkmatesWithYourKing: (prior[uk.checkmatesWithYourKing] || 0) + pipelineData[pk.checkmateWithYourKing],

      finishes: prior[uk.finishes] || [0, 0, 0, 0, 0, 0],

      bestStreak: util.streak?.[gamePlay.puzzle.game.slug]?.max || 0,

      totalPoints: (prior[uk.totalPoints] || 0) + gamePlay.pointsAwarded,
    })
  },

  gameplayUserHighlights: (gameplay, userStats, dayStartingMon, _daily, viewerIsParticipant, day) => {
    const rbc = userStats.rbc
    const bestIDs: string[] = []
    let title: string | undefined = undefined
    if (!rbc) return { title, bestIDs }

    const you = viewerIsParticipant ? "You" : "They"

    if (dayStartingMon && rbc[uk.fastestWin]?.[dayStartingMon]?.[0] === gameplay.combinedTimeSecs) {
      bestIDs.push("puz-[puzzleID]-time")
      title = `${you} got a new fastest ${day} time!`
    }

    if (dayStartingMon && rbc[uk.leastMoves]?.[dayStartingMon]?.[0] === gameplay.metric3) {
      bestIDs.push("puz-[puzzleID]-turns")
      title = `${you} set a record for ${day} fewest moves to win!`
    }

    if (dayStartingMon && rbc[uk.mostPoints]?.[dayStartingMon]?.[0] === gameplay.pointsAwarded) {
      bestIDs.push("puz-[puzzleID]-score")
      title = `${you} got a new ${day} high score!`
    }

    if (dayStartingMon && rbc[uk.leastPiecesLost]?.[dayStartingMon]?.[0] === gameplay.metric2) {
      bestIDs.push("puz-[puzzleID]-pieces-lost")
      title = `${you} set a record for least casualties!`
    }

    return { title, bestIDs }
  },
  
  // Items which might appear under puzzle recs on the today page
  editorialForDailyPuzzleRec: async (_streak, _rec) => undefined,

  // Social news items which can come from any game play from someone else (and maybe your gameplay on the same puzzle)
  socialNewsForPuzzle: (puzzle, fGP, friend, yourGameplay, utils) => {
    const { userRef, friendIsTagged, gameName } = utils
    const time = secondsToHms(fGP.combinedTimeSecs)

    const topic: "friend" | "tagged_friend" = friendIsTagged ? "tagged_friend" : "friend"

    if (!yourGameplay) {
      const md = `${userRef(friend)} solved today's ${gameName} in ${fGP.metric3} moves.`
      return [{ user: friend, md, topic }]
    } else {
      const solved = `[solved](/play/${puzzle.game.slug}/${fGP.id})`
      if (fGP.combinedTimeSecs === yourGameplay.combinedTimeSecs) {
        const md = `${userRef(friend)} ${solved} today's ${gameName} in the same time as you: ${time}.`
        return [{ user: friend, md, topic }]
      }

      const diff = Math.abs(yourGameplay.metric3 - fGP.metric3)
      const suffix = fGP.metric3 > yourGameplay.metric3 ? "more" : "better"
      //your PAL Chris solved today's really bad chess in 10m:30s with 23 moves — 2 less than your solve.
      const md = `${userRef(friend)} ${solved} today's ${gameName} in ${time} with ${fGP.metric3} moves — ${diff} ${suffix} than your solve.`
      return [{ user: friend, md, topic }]
    }
  },

  // News items which are more generalized and show up in yesterday's news
  newsItemFromPuzzleAggregate: async (_puzzle, data, usageStats, _yourGameplay, util) => {
    const { playerDrivenStat, gameName } = util
    const items: TopicNewsItem[] = []
    const totalGames = usageStats.completed.counts[0] + usageStats.tried.counts[0] || 0
    const totalCompletes = usageStats.completed.counts[0] || 0

    const link = (str: string, stat: BestOfStat) => (stat[2] ? `[${str}](/play/really-bad-chess/${stat[2]})` : str)

    // RBC least moves
    const mp = await playerDrivenStat({
      stat: data[pk.lowestMovesStat],
      topic: "global",
      icon: "ReallyBadChess",
      mainStr: (users, verb, score) =>
        `${users} ${link("checkmated", data[pk.lowestMovesStat])} the black king in only: **${score}** moves.`,
      manyStr: (count, score) => `${count} players tied for the least moves in ${gameName}: ${score}.`,
    })

    if (mp) items.push(mp)

    // RBC least losses
    const ll = await playerDrivenStat({
      stat: data[pk.lowestPiecesLostStat],
      topic: "global",
      icon: "ReallyBadChess",
      mainStr: (users, verb, score) => {
        if (score === 0) {
          return `${users} ${link("completed", data[pk.lowestPiecesLostStat])} a ${gameName} game without losing a piece.`
        } else {
          const s = score === 1 ? "" : "s"
          const loss = link("lowest losses", data[pk.lowestPiecesLostStat])
          return `${users} ${verb} the ${loss} on ${gameName} losing only: **${score}** piece${s}.`
        }
      },
      manyStr: (count, score) => {
        if (score === 0) {
          return `${count} players completed ${gameName} without losing a piece.`
        } else {
          const s = score === 1 ? "" : "s"
          return `${count} players completed ${gameName} losing only **${score}** piece${s}.`
        }
      },
    })
    if (ll) items.push(ll)

    const checkMaters = ["Pawn", "Bishop", "Knight", "Rook", "Queen", "King"]
    const indexToGetPositionInStats = pk.checkmateWithPawnCount

    let highestCheckmateValue = 0,
      lowestCheckmateValue = 100000000

    let highestCheckMaterIndex = 0,
      lowestCheckMaterIndex = 0

    checkMaters.forEach((_piece, index) => {
      const idx = indexToGetPositionInStats + index
      const checks = data[idx] as number

      if (checks > highestCheckmateValue) {
        highestCheckMaterIndex = index
        highestCheckmateValue = checks
      }

      if (checks && checks < lowestCheckmateValue) {
        lowestCheckMaterIndex = index
        lowestCheckmateValue = checks
      }
    })

    const highestPercent = Math.round(((data[indexToGetPositionInStats + highestCheckMaterIndex] as number) / totalCompletes) * 100 || 0)
    totalGames &&
      checkMaters[highestCheckMaterIndex] &&
      checkMaters[highestCheckMaterIndex] !== "Queen" &&
      items.push({
        md: `${highestPercent}% of players checkmated with their ${checkMaters[highestCheckMaterIndex]} in ${gameName}.`,
        icon: "ReallyBadChess",
        topic: "global",
      })

    const lowestPercent = Math.round(((data[indexToGetPositionInStats + lowestCheckMaterIndex] as number) / totalCompletes) * 100 || 1)
    totalGames &&
      checkMaters[lowestCheckmateValue] &&
      lowestCheckMaterIndex !== highestCheckMaterIndex &&
      lowestPercent > 0 &&
      lowestPercent < 11 &&
      items.push({
        md: `${lowestPercent}% of players checkmated with their ${checkMaters[lowestCheckmateValue]} in ${gameName}.`,
        icon: "ReallyBadChess",
        topic: "global",
      })

    return items
  },

  newsItemsFromUserAggregateStats: async (stats, dayStartingMon, dayString, isInDateRange) => {
    if (!stats.rbc) return []

    const messages: string[] = []
    const rbc = stats.rbc

    const hasPlayed7Games = rbc[uk.totalGames] > 7

    // Hints moves
    if (hasPlayed7Games && isInDateRange(rbc[uk.leastMoves]?.[dayStartingMon]?.[1])) {
      const moves = rbc[uk.leastMoves]?.[dayStartingMon]?.[0]
      if (moves) messages.push(`You beat Really Bad Chess in only ${moves} moves — a new ${dayString} best!`)
    }

    // Fastest
    if (hasPlayed7Games && isInDateRange(rbc[uk.fastestWin]?.[dayStartingMon]?.[1])) {
      const time = rbc[uk.fastestWin]?.[dayStartingMon]?.[0]
      if (time) messages.push(`You beat Really Bad Chess in ${secondsToHms(time)} — a new ${dayString} best!`)
    }

    // Least pieces lost
    if (hasPlayed7Games && isInDateRange(rbc[uk.leastPiecesLost]?.[dayStartingMon]?.[1])) {
      const losses = rbc[uk.leastPiecesLost]?.[dayStartingMon]?.[0]
      if (losses !== null || losses !== undefined) {
        const s = losses === 1 ? "" : "s"
        messages.push(`You beat Really Bad Chess game only losing ${losses} piece${s} — a new personal best!`)
      }
    }

    return messages.map((md) => ({ md, icon: "ReallyBadChess", topic: "you" }))
  },

  // Custom leaderboards (e.g. not score)
  leaderboardsForGame: (puzzleID) => {
    const leaderboards = [] as Omit<LeaderboardData, "slug" | "type">[]

    leaderboards.push(
      {
        name: "Fewest pieces lost",
        id: "puz-" + puzzleID + "-pieces-lost",
        direction: "LowestIsBetter",
        formatString: "%@ pieces",
        stableID: `game-${slug}:least-lost`,
        _meta: {
          gamePlayToScore: (gamePlay) => gamePlay.metric2,
          sqlValue: "metric2",
        },
      },
      {
        name: "Fewest moves",
        id: "puz-" + puzzleID + "-win-turns",
        direction: "LowestIsBetter",
        formatString: "%@ moves",
        stableID: `game-${slug}:least-moves`,
        _meta: {
          gamePlayToScore: (gamePlay) => gamePlay.metric3,
          sqlValue: "metric3",
        },
      },
      {
        name: "Fastest win",
        id: "puz-" + puzzleID + "-time",
        direction: "LowestIsBetter",
        formatString: "[time]",
        stableID: `game-${slug}:fastest-win`,
        _meta: {
          filter: (gamePlay) => gamePlay.combinedTimeSecs > 0,
          gamePlayToScore: (gamePlay) => gamePlay.combinedTimeSecs,
          sqlValue: "combinedTimeSecs",
        },
      },
      {
        name: "Fewest pieces taken",
        id: "puz-" + puzzleID + "-captures",
        direction: "LowestIsBetter",
        formatString: "%@ pieces",
        stableID: `game-${slug}:least-taken`,
        _meta: {
          gamePlayToScore: (gamePlay) => gamePlay.metric1,
          sqlValue: "metric1",
        },
      }
    )
    return leaderboards
  },

  // Update the single aggregate stat for a puzzle
  updatePuzzleAggregateStats: async (pipelineStats, gameplay, prior, { bestOfScoreStat }) => {
    const k = reallyBadChessStatsKeys.puzzleAggregateStats
    const ppk = reallyBadChessStatsKeys.pipelineStats

    return reallyBadChessStatsPuzzleAggregateStatsObjToArr({
      totalPiecesLost: (prior[k.totalPiecesLost] || 0) + pipelineStats[ppk.piecesLost],
      totalPiecesCaptured: (prior[k.totalPiecesCaptured] || 0) + pipelineStats[ppk.piecesTaken],
      totalMoves: (prior[k.totalMoves] || 0) + pipelineStats[ppk.moves],

      lowestMovesStat: bestOfScoreStat(pipelineStats[ppk.moves], gameplay, prior[k.lowestMovesStat], { smallerisBetter: true }),
      lowestPiecesLostStat: bestOfScoreStat(pipelineStats[ppk.piecesLost], gameplay, prior[k.lowestPiecesLostStat], {
        smallerisBetter: true,
      }),

      pawnsUpgradedCount: (prior[k.pawnsUpgradedCount] || 0) + pipelineStats[ppk.pawnsUpgraded],
      enPassantTakeCount: (prior[k.enPassantTakeCount] || 0) + pipelineStats[ppk.enPassantTake],

      checkmateWithPawnCount: (prior[k.checkmateWithPawnCount] || 0) + pipelineStats[ppk.checkmateWithPawn],
      checkmateWithBishopCount: (prior[k.checkmateWithBishopCount] || 0) + pipelineStats[ppk.checkmateWithBishop],
      checkmateWithKnightCount: (prior[k.checkmateWithKnightCount] || 0) + pipelineStats[ppk.checkmateWithKnight],
      checkmateWithRookCount: (prior[k.checkmateWithRookCount] || 0) + pipelineStats[ppk.checkmateWithRook],
      checkmateWithQueenCount: (prior[k.checkmateWithQueenCount] || 0) + pipelineStats[ppk.checkmateWithQueen],
      checkmateWithYourKingCount: (prior[k.checkmateWithYourKingCount] || 0) + pipelineStats[ppk.checkmateWithYourKing],

      totalGames: (prior[k.totalGames] || 0) + 1,
    })
  },

  // The key used in the aggregate stats which are just for this game
  userAggregateStatsKey: "rbc" as const,
  // The position in which we keep "top firstPlaceDailyScoreFinishes" in the tuple
  userAggregateStatsFinishesIndex: uk.finishes,
} satisfies APIGame<ReallyBadChessStats>

export default reallyBadChessGame
```

By using `satisfies APIGame<ReallyBadChessStats>` we get all of the tooling and type-checking like we might get with `const reallyBadChessGame: APIGame<ReallyBadChessStats> = { ... }` but we keep the literal strings around too. This was quite useful at the beginning because I had a vending function with overrides like:


```ts
// Lost of these for each game
export function gameExtensionForSlug(slug: typeof reallyBadChessGame.slug): typeof reallyBadChessGame

// order is important, this needs to go last
export function gameExtensionForSlug(slug: string): APIGame<GameData>
export function gameExtensionForSlug(slug: string): APIGame<GameData> {
  if (allGameExtensions.has(slug as any)) return allGameExtensions.get(slug as any)!
  return noopGame
}
```

Yet in the end, all that turned out to just not be worth the overhead when reading error messages in this area of the codebase - it became better to just make it always return the generalized type. So, err, I guess I wasn't satisfied with `satisfies`? ... Either way, this plugin infra makes makes it possible for someone working on a game to load up the API codebase, find the game and know that all of the changes (and tests!) are safely scoped to a single file which they can tweak to their hearst contents. It can go through PR review and make its way to staging for testing, and then production after that. Lots of reasonable checks and balances.

For scaling Puzzmo to more games, abstraction really paid for itself in terms of reducing overall complexity for the folks implementing games and gave us the ability to start working at a higher level, like the leaderboards as a config objects instead hardcoding a list and mapping somewhere inside the internals of the leaderboard generators.