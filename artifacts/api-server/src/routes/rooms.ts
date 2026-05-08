import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, roomsTable, roomOccupantsTable } from "@workspace/db";
import {
  ListRoomsResponse,
  GetRoomParams,
  GetRoomResponse,
  JoinRoomParams,
  JoinRoomResponse,
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

async function buildRoom(room: typeof roomsTable.$inferSelect) {
  const occupantRows = await db
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
    occupantCount: occupantRows.length,
    maxOccupants: room.maxOccupants,
    occupants: occupantRows.map((r) => formatUser(r.user)),
    ambience: room.ambience,
  };
}

router.get("/rooms", async (req, res): Promise<void> => {
  const rooms = await db.select().from(roomsTable);
  const formatted = await Promise.all(rooms.map(buildRoom));
  res.json(ListRoomsResponse.parse(formatted));
});

router.get("/rooms/:roomId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const params = GetRoomParams.safeParse({ roomId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, params.data.roomId));
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  res.json(GetRoomResponse.parse(await buildRoom(room)));
});

router.post("/rooms/:roomId/join", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const params = JoinRoomParams.safeParse({ roomId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, params.data.roomId));
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  // Upsert occupant
  await db
    .insert(roomOccupantsTable)
    .values({ roomId: params.data.roomId, userId: CURRENT_USER_ID })
    .onConflictDoNothing();

  // Update user's current room
  await db.update(usersTable).set({ currentRoom: room.name }).where(eq(usersTable.id, CURRENT_USER_ID));

  res.json(JoinRoomResponse.parse(await buildRoom(room)));
});

export default router;
