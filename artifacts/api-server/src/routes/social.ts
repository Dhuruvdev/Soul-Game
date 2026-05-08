import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, usersTable, friendsTable, heartsTable, complimentsTable, activityTable } from "@workspace/db";
import {
  GetMyFriendsResponse,
  AddFriendBody,
  AddFriendResponse,
  SendHeartBody,
  SendHeartResponse,
  SendComplimentBody,
  SendComplimentResponse,
  GetMyComplimentsResponse,
  GetActivityFeedQueryParams,
  GetActivityFeedResponse,
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

router.get("/users/me/friends", async (req, res): Promise<void> => {
  const rows = await db
    .select({ friend: friendsTable, user: usersTable })
    .from(friendsTable)
    .innerJoin(usersTable, eq(friendsTable.friendId, usersTable.id))
    .where(eq(friendsTable.userId, CURRENT_USER_ID));

  const result = rows.map((r) => ({
    id: r.friend.id,
    user: formatUser(r.user),
    status: r.friend.status,
    bondXp: r.friend.bondXp,
    createdAt: r.friend.createdAt.toISOString(),
  }));

  res.json(GetMyFriendsResponse.parse(result));
});

router.post("/users/me/friends", async (req, res): Promise<void> => {
  const parsed = AddFriendBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [friend] = await db
    .insert(friendsTable)
    .values({
      userId: CURRENT_USER_ID,
      friendId: parsed.data.targetUserId,
      status: "pending",
      bondXp: 0,
    })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.targetUserId));

  res.json(
    AddFriendResponse.parse({
      id: friend.id,
      user: formatUser(user!),
      status: friend.status,
      bondXp: friend.bondXp,
      createdAt: friend.createdAt.toISOString(),
    })
  );
});

router.post("/social/hearts", async (req, res): Promise<void> => {
  const parsed = SendHeartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.insert(heartsTable).values({
    fromUserId: CURRENT_USER_ID,
    toUserId: parsed.data.targetUserId,
  });

  await db
    .update(usersTable)
    .set({ totalHearts: db.$count(heartsTable) } as never)
    .where(eq(usersTable.id, parsed.data.targetUserId));

  const XP_GAINED = 5;
  await db.update(usersTable).set({ xp: db.$count(heartsTable) } as never).where(eq(usersTable.id, CURRENT_USER_ID));

  await db.insert(activityTable).values({
    type: "heart_sent",
    userId: CURRENT_USER_ID,
    message: "You sent a heart",
    xpGained: XP_GAINED,
  });

  res.json(SendHeartResponse.parse({ success: true, xpGained: XP_GAINED, message: "Heart sent! +5 XP" }));
});

router.post("/social/compliments", async (req, res): Promise<void> => {
  const parsed = SendComplimentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.insert(complimentsTable).values({
    fromUserId: CURRENT_USER_ID,
    toUserId: parsed.data.targetUserId,
    message: parsed.data.message,
  });

  const XP_GAINED = 10;
  await db.insert(activityTable).values({
    type: "compliment_received",
    userId: parsed.data.targetUserId,
    message: `Someone sent you a compliment`,
    xpGained: XP_GAINED,
  });

  res.json(SendComplimentResponse.parse({ success: true, xpGained: XP_GAINED, message: "Anonymous compliment sent! +10 XP" }));
});

router.get("/social/compliments", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(complimentsTable)
    .where(eq(complimentsTable.toUserId, CURRENT_USER_ID))
    .orderBy(desc(complimentsTable.createdAt))
    .limit(20);

  res.json(
    GetMyComplimentsResponse.parse(
      rows.map((r) => ({
        id: r.id,
        message: r.message,
        createdAt: r.createdAt.toISOString(),
      }))
    )
  );
});

router.get("/social/activity", async (req, res): Promise<void> => {
  const qp = GetActivityFeedQueryParams.safeParse(req.query);
  const limit = (qp.success ? qp.data.limit : undefined) ?? 20;

  const rows = await db
    .select({ activity: activityTable, user: usersTable })
    .from(activityTable)
    .innerJoin(usersTable, eq(activityTable.userId, usersTable.id))
    .orderBy(desc(activityTable.createdAt))
    .limit(limit);

  res.json(
    GetActivityFeedResponse.parse(
      rows.map((r) => ({
        id: r.activity.id,
        type: r.activity.type,
        userId: r.activity.userId,
        username: r.user.username,
        message: r.activity.message,
        xpGained: r.activity.xpGained ?? undefined,
        createdAt: r.activity.createdAt.toISOString(),
      }))
    )
  );
});

export default router;
