import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, appSettingsTable } from "@workspace/db";
import {
  GetSettingsResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function ensureSettings() {
  const rows = await db.select().from(appSettingsTable).limit(1);
  if (rows.length === 0) {
    const [inserted] = await db.insert(appSettingsTable).values({}).returning();
    return inserted;
  }
  return rows[0];
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await ensureSettings();
  const result = GetSettingsResponse.parse({
    defaultModel: settings.defaultModel,
    huggingfaceToken: settings.huggingfaceToken
      ? `****${settings.huggingfaceToken.slice(-4)}`
      : null,
    systemPrompt: settings.systemPrompt,
  });
  res.json(result);
});

router.put("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const current = await ensureSettings();

  // If huggingfaceToken looks like a masked value (****xxxx), keep the existing one
  const isMasked =
    parsed.data.huggingfaceToken &&
    /^\*{4}/.test(parsed.data.huggingfaceToken);

  const updateValues: Partial<typeof appSettingsTable.$inferInsert> = {};
  if (parsed.data.defaultModel !== undefined) {
    updateValues.defaultModel = parsed.data.defaultModel;
  }
  if (parsed.data.systemPrompt !== undefined) {
    updateValues.systemPrompt = parsed.data.systemPrompt;
  }
  if (parsed.data.huggingfaceToken !== undefined && !isMasked) {
    updateValues.huggingfaceToken = parsed.data.huggingfaceToken || null;
  }

  const [updated] = await db
    .update(appSettingsTable)
    .set(updateValues)
    .where(eq(appSettingsTable.id, current.id))
    .returning();

  const result = UpdateSettingsResponse.parse({
    defaultModel: updated.defaultModel,
    huggingfaceToken: updated.huggingfaceToken
      ? `****${updated.huggingfaceToken.slice(-4)}`
      : null,
    systemPrompt: updated.systemPrompt,
  });
  res.json(result);
});

export default router;
