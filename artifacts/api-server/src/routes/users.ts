import { Router, type IRouter } from "express";
import { eq, ilike, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetMyProfileResponse,
  UpdateMyProfileBody,
  UpdateMyProfileResponse,
  GetUserProfileParams,
  GetUserProfileResponse,
  ListUsersQueryParams,
  ListUsersResponse,
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

router.get("/users/me", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, CURRENT_USER_ID));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetMyProfileResponse.parse(formatUser(user)));
});

router.put("/users/me", async (req, res): Promise<void> => {
  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid update profile body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, CURRENT_USER_ID))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(UpdateMyProfileResponse.parse(formatUser(user)));
});

router.get("/users/:userId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const params = GetUserProfileParams.safeParse({ userId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetUserProfileResponse.parse(formatUser(user)));
});

router.get("/users", async (req, res): Promise<void> => {
  const qp = ListUsersQueryParams.safeParse(req.query);
  const search = qp.success ? qp.data.search : undefined;
  const limit = (qp.success ? qp.data.limit : undefined) ?? 20;

  const users = await db
    .select()
    .from(usersTable)
    .where(search ? ilike(usersTable.username, `%${search}%`) : undefined)
    .limit(limit);

  res.json(ListUsersResponse.parse(users.map(formatUser)));
});

export default router;
