// Vietnam Life Telegram bot: voice or text -> transcription -> AI extracts records -> saved to the site's data.
// Secrets live in Supabase Vault (read through public.vl_secret, service role only).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SITE = "https://t0niske.github.io/vietnam-life/";
const TZ = "Asia/Ho_Chi_Minh";

const CATS = ["Аренда", "Питание", "Кафе и рестораны", "Транспорт", "Путешествия", "Коммуналка", "Здоровье", "Другое"];
const EVT: Record<string, string> = { sport: "Спорт", work: "Работа", flight: "Перелёт", sight: "Экскурсия", beach: "Отдых", health: "Здоровье", other: "Другое" };
const HEALTH = ["Врач", "Анализы", "Прививка", "Страховка", "Спорт", "Другое"];

const secrets = new Map<string, string>();
async function secret(name: string): Promise<string> {
  if (!secrets.has(name)) {
    const { data } = await db.rpc("vl_secret", { p_name: name });
    secrets.set(name, data ?? "");
  }
  return secrets.get(name)!;
}

async function tg(method: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${await secret("telegram_bot_token")}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}
const say = (chat_id: number, text: string, extra: Record<string, unknown> = {}) =>
  tg("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra });

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const money = (n: number) => Math.round(n).toLocaleString("ru-RU").replace(/ | /g, " ") + " ₫";
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
const weekday = () => new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, weekday: "long" }).format(new Date());
const dshort = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });

/* ---------- Groq (free tier): models are picked from what the account can use, so retired models don't break the bot ---------- */
const GROQ = "https://api.groq.com/openai/v1";
const PREFER_STT = ["whisper-large-v3-turbo", "whisper-large-v3"];
const PREFER_LLM = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "moonshotai/kimi-k2-instruct", "openai/gpt-oss-20b", "llama-3.1-8b-instant"];
let groqModels: string[] | null = null;
async function groqModel(prefer: string[], kind: "stt" | "llm"): Promise<string> {
  if (!groqModels) {
    const r = await fetch(`${GROQ}/models`, { headers: { authorization: `Bearer ${await secret("groq_api_key")}` } });
    const j = await r.json();
    if (!r.ok) throw new Error("Groq: " + (j.error?.message ?? r.status));
    groqModels = (j.data ?? []).filter((m: { active?: boolean }) => m.active !== false).map((m: { id: string }) => m.id);
  }
  const list = groqModels!;
  const isStt = (id: string) => /whisper|transcri|speech/i.test(id);
  return prefer.find((id) => list.includes(id)) ?? list.find((id) => (kind === "stt") === isStt(id) && !/guard|tts|playai|orpheus|compound/i.test(id)) ?? prefer[0];
}

/* ---------- speech to text: Groq Whisper, or OpenAI as an alternative ---------- */
async function transcribe(fileId: string): Promise<string> {
  const groq = await secret("groq_api_key"), openai = await secret("openai_api_key");
  if (!groq && !openai) throw new Error("NO_STT_KEY");
  const f = await tg("getFile", { file_id: fileId });
  if (!f.ok) throw new Error("Не удалось скачать голосовое");
  const audio = await (await fetch(`https://api.telegram.org/file/bot${await secret("telegram_bot_token")}/${f.result.file_path}`)).blob();
  const form = new FormData();
  form.append("file", audio, "voice.ogg");
  form.append("model", groq ? await groqModel(PREFER_STT, "stt") : "gpt-4o-mini-transcribe");
  form.append("language", "ru");
  const r = await fetch(groq ? "https://api.groq.com/openai/v1/audio/transcriptions" : "https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${groq || openai}` },
    body: form,
  });
  const j = await r.json();
  if (!r.ok) throw new Error("Распознавание речи: " + (j.error?.message ?? r.status));
  return String(j.text ?? "").trim();
}

/* ---------- text -> records: Groq free tier, or Claude if an Anthropic key is set instead ---------- */
const RECORD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["records", "question"],
  properties: {
    records: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "date", "title", "amount_vnd", "category", "event_type", "time_from", "time_to", "health_kind"],
        properties: {
          kind: { type: "string", enum: ["expense", "event", "note", "health"] },
          date: { type: "string", description: "YYYY-MM-DD" },
          title: { type: "string" },
          amount_vnd: { type: "number" },
          category: { type: "string", enum: [...CATS, ""] },
          event_type: { type: "string", enum: [...Object.keys(EVT), ""] },
          time_from: { type: "string", description: "HH:MM or empty" },
          time_to: { type: "string", description: "HH:MM or empty" },
          health_kind: { type: "string", enum: [...HEALTH, ""] },
        },
      },
    },
    question: { type: "string" },
  },
};

type Rec = {
  kind: "expense" | "event" | "note" | "health"; date: string; title: string; amount_vnd: number;
  category: string; event_type: string; time_from: string; time_to: string; health_kind: string;
};

const prompt = (rate: number) => `Ты разбираешь короткие голосовые заметки пары, которая живёт во Вьетнаме, и превращаешь их в записи для их планера.
Сегодня ${today()} (${weekday()}), часовой пояс ${TZ}. Относительные даты («завтра», «в пятницу», «вчера») переводи в YYYY-MM-DD.
Типы записей:
- expense: потраченные деньги. amount_vnd в вьетнамских донгах («150 тысяч», «150к» = 150000, «полтора миллиона» = 1500000). Суммы в долларах переводи по курсу ${rate} ₫ за $. category одна из списка. title — что купили, коротко.
- event: дело или встреча в календаре. title, date, time_from/time_to если названо время, event_type из списка.
- note: задача без даты («купить переходник», «продлить визу»). title — текст задачи.
- health: визит к врачу, анализы, страховка. health_kind из списка, amount_vnd — стоимость, если есть.
Одно сообщение может содержать несколько записей. Поля, которые не подходят к типу, оставляй пустой строкой или 0.
Если смысл непонятен, верни пустой records и короткий уточняющий вопрос по-русски в question; иначе question пустой.`;

// the free models follow the format less strictly than structured output, so every field is checked here
const hhmm = (t: unknown) => {
  const m = String(t ?? "").match(/^(\d{1,2})(?:[:.](\d{2}))?$/);
  return m && +m[1] < 24 ? m[1].padStart(2, "0") + ":" + (m[2] ?? "00") : "";
};
// deno-lint-ignore no-explicit-any
function normalize(o: any): { records: Rec[]; question: string } {
  const kinds = ["expense", "event", "note", "health"];
  // deno-lint-ignore no-explicit-any
  const records = (Array.isArray(o?.records) ? o.records : []).map((r: any) => ({
    kind: kinds.includes(r?.kind) ? r.kind : "note",
    date: String(r?.date ?? ""),
    title: String(r?.title ?? "").trim(),
    amount_vnd: Math.max(0, Number(r?.amount_vnd) || 0),
    category: String(r?.category ?? ""),
    event_type: String(r?.event_type ?? ""),
    time_from: hhmm(r?.time_from),
    time_to: hhmm(r?.time_to),
    health_kind: String(r?.health_kind ?? ""),
  })).filter((r: Rec) => r.title || r.amount_vnd);
  return { records, question: String(o?.question ?? "") };
}

async function extract(text: string): Promise<{ records: Rec[]; question: string }> {
  const { data: s } = await db.from("vl_sections").select("body").eq("sec", "settings").maybeSingle();
  const rate = Number(s?.body?.rate) || 25000;

  // free path: Groq chat model in JSON mode
  const groq = await secret("groq_api_key");
  if (groq) {
    const r = await fetch(`${GROQ}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${groq}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: await groqModel(PREFER_LLM, "llm"),
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt(rate) + "\n\nОтвечай только JSON-объектом по этой JSON-схеме:\n" + JSON.stringify(RECORD_SCHEMA) },
          { role: "user", content: text },
        ],
      }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error("Groq: " + (j.error?.message ?? r.status));
    return normalize(JSON.parse(j.choices?.[0]?.message?.content || "{}"));
  }

  // paid alternative: Claude with structured output, used only if an Anthropic key is added instead
  const key = await secret("anthropic_api_key");
  if (!key) throw new Error("NO_AI_KEY");
  const client = new Anthropic({ apiKey: key });
  const res = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    output_config: { effort: "low", format: { type: "json_schema", schema: RECORD_SCHEMA } },
    system: prompt(rate),
    messages: [{ role: "user", content: text }],
  } as any);
  if (res.stop_reason === "refusal") return { records: [], question: "Не получилось разобрать сообщение, переформулируйте, пожалуйста." };
  const block = res.content.find((b) => b.type === "text");
  return normalize(JSON.parse(block && block.type === "text" ? block.text : "{}"));
}

/* ---------- save ---------- */
async function save(r: Rec): Promise<{ sec: string; id: string; line: string }> {
  const id = uid();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : today();
  let sec: string, item: Record<string, unknown>, line: string, front = false;
  if (r.kind === "expense") {
    sec = "expenses";
    item = { id, date, cat: CATS.includes(r.category) ? r.category : "Другое", amount: Math.round(r.amount_vnd || 0), note: r.title };
    line = `💸 Расход ${money(r.amount_vnd || 0)} · ${esc(String(item.cat))}${r.title ? " · " + esc(r.title) : ""} · ${dshort(date)}`;
  } else if (r.kind === "event") {
    sec = "events";
    item = { id, date, from: r.time_from || "", to: r.time_to || "", title: r.title, type: EVT[r.event_type] ? r.event_type : "other", done: false };
    line = `📅 ${esc(r.title)} · ${dshort(date)}${r.time_from ? " " + r.time_from + (r.time_to ? "–" + r.time_to : "") : ""}`;
  } else if (r.kind === "health") {
    sec = "health";
    item = { id, date, kind: HEALTH.includes(r.health_kind) ? r.health_kind : "Другое", title: r.title, cost: Math.round(r.amount_vnd || 0), note: "" };
    line = `🩺 ${esc(r.title)} · ${dshort(date)}${r.amount_vnd ? " · " + money(r.amount_vnd) : ""}`;
  } else {
    sec = "notes";
    front = true;
    item = { id, text: r.title, done: false };
    line = `📝 ${esc(r.title)}`;
  }
  const { error } = await db.rpc("vl_append", { p_sec: sec, p_item: item, p_front: front });
  if (error) throw new Error(error.message);
  return { sec, id, line };
}

/* ---------- updates ---------- */
// deno-lint-ignore no-explicit-any
async function handle(u: any) {
  if (u.callback_query) {
    const q = u.callback_query, chat = q.message.chat.id;
    const { data: link } = await db.from("vl_tg_links").select("email").eq("chat_id", chat).maybeSingle();
    const [, sec, id] = String(q.data || "").split(":");
    if (link && sec && id) {
      await db.rpc("vl_remove", { p_sec: sec, p_id: id });
      await tg("answerCallbackQuery", { callback_query_id: q.id, text: "Отменено" });
      // deno-lint-ignore no-explicit-any
      const kb = (q.message.reply_markup?.inline_keyboard ?? []).map((row: any[]) => row.filter((b) => b.callback_data !== q.data)).filter((row: any[]) => row.length);
      await tg("editMessageText", { chat_id: chat, message_id: q.message.message_id,
        text: q.message.text + "\n\n↩️ Одна запись отменена", reply_markup: { inline_keyboard: kb } });
    } else await tg("answerCallbackQuery", { callback_query_id: q.id });
    return;
  }
  const m = u.message;
  if (!m) return;
  const chat = m.chat.id, text: string = m.text ?? "";

  if (text.startsWith("/start")) {
    const code = text.split(/\s+/)[1];
    if (code) {
      const { data: c } = await db.from("vl_tg_codes").select("email, expires_at").eq("code", code).maybeSingle();
      if (!c || new Date(c.expires_at) < new Date()) return say(chat, "Ссылка устарела. Откройте сайт → Настройки → «Подключить Telegram» ещё раз.");
      await db.from("vl_tg_links").upsert({ chat_id: chat, email: c.email });
      await db.from("vl_tg_codes").delete().eq("code", code);
      return say(chat, `Готово, бот подключён к <b>${esc(c.email)}</b> ✅\n\nНадиктуйте голосовое или напишите, например:\n• «Потратил 150 тысяч на кофе»\n• «Завтра в 10 стоматолог»\n• «Купить переходник»\n\nВсё появится на сайте: ${SITE}`);
    }
  }
  const { data: link } = await db.from("vl_tg_links").select("email").eq("chat_id", chat).maybeSingle();
  if (!link) return say(chat, `Это личный бот Vietnam Life. Чтобы подключить его, войдите на сайте ${SITE} → Настройки → «Подключить Telegram».`);
  if (text === "/start" || text === "/help") return say(chat, "Отправьте голосовое или текст: расходы, дела в календарь, заметки, визиты к врачу. Я сам разложу всё по разделам сайта.");

  let input = text;
  const voice = m.voice ?? m.audio ?? m.video_note;
  try {
    if (voice) {
      await tg("sendChatAction", { chat_id: chat, action: "typing" });
      input = await transcribe(voice.file_id);
    }
    if (!input) return say(chat, "Пришлите голосовое или текст.");
    await tg("sendChatAction", { chat_id: chat, action: "typing" });
    const { records, question } = await extract(input);
    const heard = voice ? `🎙 «${esc(input)}»\n\n` : "";
    if (!records.length) return say(chat, heard + (question || "Не нашёл, что записать. Скажите, например: «потратил 200 тысяч на продукты»."));
    const saved = [];
    for (const r of records) saved.push(await save(r));
    const buttons = saved.map((s, i) => [{ text: saved.length > 1 ? `↩️ Отменить ${i + 1}` : "↩️ Отменить", callback_data: `u:${s.sec}:${s.id}` }]);
    await say(chat, heard + "Записал:\n" + saved.map((s) => s.line).join("\n"), { reply_markup: { inline_keyboard: buttons } });
  } catch (e) {
    const msg = String((e as Error).message);
    if (msg === "NO_STT_KEY" || msg === "NO_AI_KEY") return say(chat, "Бот ещё не до конца настроен: нужен бесплатный ключ Groq. Как только он будет добавлен, я начну понимать голосовые и текст.");
    console.error(e);
    return say(chat, "Что-то пошло не так, запись не сохранена. Попробуйте ещё раз.");
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  // Telegram sends the secret registered with setWebhook; anything else is rejected
  if (req.headers.get("x-telegram-bot-api-secret-token") !== (await secret("telegram_webhook_secret"))) return new Response("forbidden", { status: 403 });
  const update = await req.json();
  EdgeRuntime.waitUntil(handle(update).catch((e) => console.error(e)));
  return new Response("ok");
});
