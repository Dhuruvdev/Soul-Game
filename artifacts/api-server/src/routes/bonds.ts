import { Router, type IRouter } from "express";
import { eq, or, and } from "drizzle-orm";
import { db, usersTable, bondsTable } from "@workspace/db";
import {
  GetMyBondsResponse,
  GetBondParams,
  GetBondResponse,
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

function formatBond(bond: typeof bondsTable.$inferSelect, user: typeof usersTable.$inferSelect) {
  return {
    id: bond.id,
    user: formatUser(user),
    xp: bond.xp,
    level: bond.level,
    streak: bond.streak,
    title: bond.title ?? undefined,
    lastInteraction: bond.lastInteraction.toISOString(),
  };
}

router.get("/bonds", async (req, res): Promise<void> => {
  const rows = await db
    .select({ bond: bondsTable, user: usersTable })
    .from(bondsTable)
    .innerJoin(usersTable, eq(bondsTable.partnerId, usersTable.id))
    .where(eq(bondsTable.userId, CURRENT_USER_ID));

  res.json(GetMyBondsResponse.parse(rows.map((r) => formatBond(r.bond, r.user))));
});

router.get("/bonds/:userId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const params = GetBondParams.safeParse({ userId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ bond: bondsTable, user: usersTable })
    .from(bondsTable)
    .innerJoin(usersTable, eq(bondsTable.partnerId, usersTable.id))
    .where(
      and(
        eq(bondsTable.userId, CURRENT_USER_ID),
        eq(bondsTable.partnerId, params.data.userId)
      )
    );

  if (!row) {
    res.status(404).json({ error: "Bond not found" });
    return;
  }

  res.json(GetBondResponse.parse(formatBond(row.bond, row.user)));
});

export default router;
