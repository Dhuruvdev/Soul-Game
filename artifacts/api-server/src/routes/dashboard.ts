import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable, activityTable, bondsTable, roomsTable, roomOccupantsTable, minigamesTable, gameSessionsTable, heartsTable } from "@workspace/db";
import {
  GetDashboardResponse,
  GetLeaderboardQueryParams,
  GetLeaderboardResponse,
  GetCompatibilityParams,
  GetCompatibilityResponse,
  GetProfileStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const CURRENT_USER_ID = 1;

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    ...user,
    tags: user.tags ?? [],
    xpToNext: user.xpToNext ?? 100,
    delulu: user.delulu ?? 0,
    redFlag: user.redFlag ?? 0,
    chronicallyOnline: user.chronicallyOnline ?? 0,
    mainCharacterEnergy: user.mainCharacterEnergy ?? 50,
    totalHearts: user.totalHearts ?? 0,
    createdAt: user.createdAt?.toISOString(),
  };
}

router.get("/dashboard", async (req, res): Promise<void> => {
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, CURRENT_USER_ID));
  if (!me) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const recentActivity = await db
    .select({ activity: activityTable, user: usersTable })
    .from(activityTable)
    .innerJoin(usersTable, eq(activityTable.userId, usersTable.id))
    .orderBy(desc(activityTable.createdAt))
    .limit(10);

  const topBondRows = await db
    .select({ bond: bondsTable, user: usersTable })
    .from(bondsTable)
    .innerJoin(usersTable, eq(bondsTable.partnerId, usersTable.id))
    .where(eq(bondsTable.userId, CURRENT_USER_ID))
    .limit(3);

  const rooms = await db.select().from(roomsTable).limit(4);
  const activeRooms = await Promise.all(
    rooms.map(async (room) => {
      const occupants = await db
        .select({ user: usersTable })
        .from(roomOccupantsTable)
        .innerJoin(usersTable, eq(roomOccupantsTable.userId, usersTable.id))
        .where(eq(roomOccupantsTable.roomId, room.id));
      return {
        id: room.id,
        name: room.name,
        slug: room.slug,
        description: room.description,
        theme: room.theme,
        occupantCount: occupants.length,
        maxOccupants: room.maxOccupants,
        occupants: occupants.map((o) => formatUser(o.user)),
        ambience: room.ambience,
      };
    })
  );

  const heartsCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(heartsTable)
    .where(eq(heartsTable.toUserId, CURRENT_USER_ID));

  const gamesToday = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.userId, CURRENT_USER_ID));

  const dailyChallenges = [
    { id: 1, title: "Send 3 Hearts", description: "Spread love to your squad", xpReward: 30, completed: false, type: "social" },
    { id: 2, title: "Play a Mini-Game", description: "Challenge someone to a game", xpReward: 50, completed: false, type: "game" },
    { id: 3, title: "Visit a Room", description: "Hang out in a social room", xpReward: 20, completed: true, type: "room" },
  ];

  const dashboard = {
    profile: formatUser(me),
    recentActivity: recentActivity.map((r) => ({
      id: r.activity.id,
      type: r.activity.type,
      userId: r.activity.userId,
      username: r.user.username,
      message: r.activity.message,
      xpGained: r.activity.xpGained ?? undefined,
      createdAt: r.activity.createdAt.toISOString(),
    })),
    topBonds: topBondRows.map((r) => ({
      id: r.bond.id,
      user: formatUser(r.user),
      xp: r.bond.xp,
      level: r.bond.level,
      streak: r.bond.streak,
      title: r.bond.title ?? undefined,
      lastInteraction: r.bond.lastInteraction.toISOString(),
    })),
    activeRooms,
    dailyChallenges,
    heartsReceived: heartsCount[0]?.count ?? 0,
    gamesPlayedToday: gamesToday[0]?.count ?? 0,
    streakDays: 7,
  };

  res.json(GetDashboardResponse.parse(dashboard));
});

router.get("/leaderboard", async (req, res): Promise<void> => {
  const qp = GetLeaderboardQueryParams.safeParse(req.query);
  const limit = (qp.success ? qp.data.limit : undefined) ?? 10;

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.xp)).limit(limit);

  const entries = users.map((user, i) => ({
    rank: i + 1,
    user: formatUser(user),
    totalXp: user.xp,
    bondsCount: 0,
    gamesWon: 0,
  }));

  res.json(GetLeaderboardResponse.parse(entries));
});

router.get("/compatibility/:userId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const params = GetCompatibilityParams.safeParse({ userId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, CURRENT_USER_ID));
  const [other] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.userId));

  if (!me || !other) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const vibe = Math.floor(Math.random() * 40) + 60;
  const chaos = Math.floor(Math.random() * 80) + 20;
  const loyalty = Math.floor(Math.random() * 40) + 55;
  const humor = Math.floor(Math.random() * 50) + 50;
  const score = Math.floor((vibe + chaos + loyalty + humor) / 4);

  const verdicts = [
    "Certified chaotic duo energy",
    "Soft soulmates with a sprinkle of delulu",
    "Main characters in each other's story",
    "Toxic but make it aesthetic",
  ];
  const titles = ["Chaotic Dream Team", "Soft Duo", "Delulu Partners", "Late Night Besties"];

  res.json(
    GetCompatibilityResponse.parse({
      user: formatUser(other),
      score,
      title: titles[score % titles.length],
      breakdown: { vibe, chaos, loyalty, humor },
      verdict: verdicts[score % verdicts.length],
      bondXp: score * 10,
    })
  );
});

router.get("/profile/stats", async (req, res): Promise<void> => {
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, CURRENT_USER_ID));
  if (!me) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const totalGames = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.userId, CURRENT_USER_ID));

  const gamesWon = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.userId, CURRENT_USER_ID));

  const [topBondRow] = await db
    .select({ bond: bondsTable, user: usersTable })
    .from(bondsTable)
    .innerJoin(usersTable, eq(bondsTable.partnerId, usersTable.id))
    .where(eq(bondsTable.userId, CURRENT_USER_ID))
    .orderBy(desc(bondsTable.xp))
    .limit(1);

  res.json(
    GetProfileStatsResponse.parse({
      user: formatUser(me),
      totalXp: me.xp,
      totalHearts: me.totalHearts,
      totalGames: totalGames[0]?.count ?? 0,
      gamesWon: gamesWon[0]?.count ?? 0,
      longestStreak: 14,
      topBond: topBondRow
        ? {
            id: topBondRow.bond.id,
            user: formatUser(topBondRow.user),
            xp: topBondRow.bond.xp,
            level: topBondRow.bond.level,
            streak: topBondRow.bond.streak,
            title: topBondRow.bond.title ?? undefined,
            lastInteraction: topBondRow.bond.lastInteraction.toISOString(),
          }
        : null,
      favoriteRoom: "Sleepover Lounge",
      topEmojis: ["💖", "🌙", "✨", "🎧", "🍓"],
      chaosLevel: me.delulu ?? 65,
      lateNightActivity: 82,
      toxicDuoTitle: "Certified Delulu Duo",
    })
  );
});

export default router;
