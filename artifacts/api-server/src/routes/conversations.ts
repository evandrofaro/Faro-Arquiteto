import { Router, type IRouter } from "express";
import { eq, desc, count } from "drizzle-orm";
import { db, conversationsTable, messagesTable, appSettingsTable } from "@workspace/db";
import {
  CreateConversationBody,
  CreateConversationResponse,
  GetConversationParams,
  GetConversationResponse,
  DeleteConversationParams,
  SendMessageParams,
  SendMessageBody,
  SendMessageResponse,
  ListConversationsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getSettings() {
  const rows = await db.select().from(appSettingsTable).limit(1);
  if (rows.length === 0) {
    const inserted = await db
      .insert(appSettingsTable)
      .values({})
      .returning();
    return inserted[0];
  }
  return rows[0];
}

async function callHuggingFace(
  model: string,
  messages: { role: string; content: string }[],
  token: string,
  systemPrompt: string
): Promise<string> {
  const hfMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const url = `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: hfMessages,
      max_tokens: 2048,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HuggingFace API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in HuggingFace response");
  }
  return content;
}

router.get("/conversations", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: conversationsTable.id,
      title: conversationsTable.title,
      model: conversationsTable.model,
      createdAt: conversationsTable.createdAt,
      updatedAt: conversationsTable.updatedAt,
      messageCount: count(messagesTable.id),
    })
    .from(conversationsTable)
    .leftJoin(messagesTable, eq(messagesTable.conversationId, conversationsTable.id))
    .groupBy(conversationsTable.id)
    .orderBy(desc(conversationsTable.updatedAt));

  const parsed = ListConversationsResponse.parse(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
  res.json(parsed);
});

router.post("/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(conversationsTable)
    .values({
      title: parsed.data.title,
      model: parsed.data.model,
    })
    .returning();

  const result = CreateConversationResponse.parse({
    ...row,
    messageCount: 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
  res.status(201).json(result);
});

router.get("/conversations/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetConversationParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  const conversations = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, parsed.data.id))
    .limit(1);

  if (conversations.length === 0) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, parsed.data.id))
    .orderBy(messagesTable.createdAt);

  const conv = conversations[0];
  const result = GetConversationResponse.parse({
    ...conv,
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
    messages: messages.map((m) => ({
      ...m,
      fileContext: m.fileContext ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
  });
  res.json(result);
});

router.delete("/conversations/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteConversationParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  await db.delete(conversationsTable).where(eq(conversationsTable.id, parsed.data.id));
  res.status(204).send();
});

router.post("/conversations/:id/messages", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsParsed = SendMessageParams.safeParse({ id: parseInt(rawId, 10) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  const bodyParsed = SendMessageBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const conversations = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, paramsParsed.data.id))
    .limit(1);

  if (conversations.length === 0) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const conversation = conversations[0];
  const settings = await getSettings();

  const hfToken = settings.huggingfaceToken || process.env.HUGGINGFACE_API_TOKEN;
  if (!hfToken) {
    res.status(400).json({
      error:
        "HuggingFace API token not configured. Please add your token in Settings.",
    });
    return;
  }

  // Build user message content, including file context if provided
  let userContent = bodyParsed.data.content;
  if (bodyParsed.data.fileContext) {
    userContent = `${userContent}\n\n---\nFile context:\n\`\`\`\n${bodyParsed.data.fileContext}\n\`\`\``;
  }
  if (bodyParsed.data.githubFile) {
    userContent = `${userContent}\n\nGitHub file: ${bodyParsed.data.githubFile}`;
  }

  // Save user message
  await db.insert(messagesTable).values({
    conversationId: paramsParsed.data.id,
    role: "user",
    content: userContent,
    fileContext: bodyParsed.data.fileContext ?? null,
  });

  // Get conversation history for context
  const historyMessages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, paramsParsed.data.id))
    .orderBy(messagesTable.createdAt);

  const hfMessages = historyMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  let assistantContent: string;
  try {
    assistantContent = await callHuggingFace(
      conversation.model,
      hfMessages,
      hfToken,
      settings.systemPrompt
    );
  } catch (err) {
    req.log.error({ err }, "HuggingFace API call failed");
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    assistantContent = `Error calling AI model: ${errorMessage}`;
  }

  // Save assistant message
  const [assistantMsg] = await db
    .insert(messagesTable)
    .values({
      conversationId: paramsParsed.data.id,
      role: "assistant",
      content: assistantContent,
      fileContext: null,
    })
    .returning();

  // Update conversation updatedAt
  await db
    .update(conversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(conversationsTable.id, paramsParsed.data.id));

  const result = SendMessageResponse.parse({
    ...assistantMsg,
    fileContext: null,
    createdAt: assistantMsg.createdAt.toISOString(),
  });
  res.json(result);
});

export default router;
