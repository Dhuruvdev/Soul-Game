import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, minigamesTable, gameSessionsTable } from "@workspace/db";
import {
  ListMinigamesResponse,
  CreateGameSessionBody,
  CreateGameSessionResponse,
  GetMyGameSessionsResponse,
  CompleteGameSessionParams,
  CompleteGameSessionBody,
  CompleteGameSessionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const CURRENT_USER_ID = 1;

function formatMinigame(mg: typeof minigamesTable.$inferSelect) {
  return {
    id: mg.id,
    name: mg.name,
    slug: mg.slug,
    description: mg.description,
    type: mg.type,
    playerCount: mg.playerCount,
    duration: mg.duration,
    xpReward: mg.xpReward,
    isAvailable: mg.isAvailable,
  };
}

function formatSession(session: typeof gameSessionsTable.$inferSelect, minigame: typeof minigamesTable.$inferSelect) {
  return {
    id: session.id,
    minigame: formatMinigame(minigame),
    score: session.score ?? undefined,
    won: session.won ?? undefined,
    xpEarned: session.xpEarned ?? undefined,
    status: session.status,
    createdAt: session.createdAt.toISOString(),
  };
}

router.get("/minigames", async (req, res): Promise<void> => {
  const games = await db.select().from(minigamesTable).where(eq(minigamesTable.isAvailable, true));
  res.json(ListMinigamesResponse.parse(games.map(formatMinigame)));
});

router.post("/minigames/sessions", async (req, res): Promise<void> => {
  const parsed = CreateGameSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [minigame] = await db.select().from(minigamesTable).where(eq(minigamesTable.id, parsed.data.minigameId));
  if (!minigame) {
    res.status(404).json({ error: "Minigame not found" });
    return;
  }

  const [session] = await db
    .insert(gameSessionsTable)
    .values({
      minigameId: parsed.data.minigameId,
      userId: CURRENT_USER_ID,
      opponentId: parsed.data.opponentId ?? undefined,
      status: "active",
    })
    .returning();

  res.json(CreateGameSessionResponse.parse(formatSession(session, minigame)));
});

router.get("/minigames/sessions", async (req, res): Promise<void> => {
  const rows = await db
    .select({ session: gameSessionsTable, minigame: minigamesTable })
    .from(gameSessionsTable)
    .innerJoin(minigamesTable, eq(gameSessionsTable.minigameId, minigamesTable.id))
    .where(eq(gameSessionsTable.userId, CURRENT_USER_ID));

  res.json(GetMyGameSessionsResponse.parse(rows.map((r) => formatSession(r.session, r.minigame))));
});

router.post("/minigames/sessions/:sessionId/complete", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const params = CompleteGameSessionParams.safeParse({ sessionId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = CompleteGameSessionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select({ session: gameSessionsTable, minigame: minigamesTable })
    .from(gameSessionsTable)
    .innerJoin(minigamesTable, eq(gameSessionsTable.minigameId, minigamesTable.id))
    .where(eq(gameSessionsTable.id, params.data.sessionId));

  if (!existing) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const xpEarned = body.data.won ? existing.minigame.xpReward : Math.floor(existing.minigame.xpReward / 2);

  const [updated] = await db
    .update(gameSessionsTable)
    .set({
      score: body.data.score,
      won: body.data.won,
      xpEarned,
      status: "completed",
    })
    .where(eq(gameSessionsTable.id, params.data.sessionId))
    .returning();

  // Award XP to user
  await db
    .update(usersTable)
    .set({ xp: existing.session.xpEarned ?? 0 + xpEarned } as never)
    .where(eq(usersTable.id, CURRENT_USER_ID));

  res.json(CompleteGameSessionResponse.parse(formatSession(updated, existing.minigame)));
});

export default router;
