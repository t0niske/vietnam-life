// Vietnam Life Telegram bot: voice or text -> transcription -> AI turns it into actions -> applied to the site's data.
// Every section of the site can be filled from here; each change gets a "cancel" button that puts the data back.
// Secrets live in Supabase Vault (read through public.vl_secret, service role only).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SITE = "https://t0niske.github.io/vietnam-life/";
const TZ = "Asia/Ho_Chi_Minh";

// the same lists as in app.js
const CATS = ["Аренда", "Питание", "Кафе и рестораны", "Транспорт", "Путешествия", "Коммуналка", "Здоровье", "Другое"];
const EVT: Record<string, string> = { sport: "Спорт", work: "Работа", flight: "Перелёт", sight: "Экскурсия", beach: "Отдых", health: "Здоровье", other: "Другое" };
const HEALTH = ["Врач", "Анализы", "Прививка", "Страховка", "Спорт", "Другое"];
const UTIL: Record<string, string> = { electricity: "электричество", water: "вода", internet: "интернет", garbage: "вывоз мусора", service: "сервис (condo)" };
const USEFUL: Record<string, string> = { sim: "Сим-карты", transport: "Транспорт", visa: "Визы", medicine: "Медицина", banks: "Банки", shopping: "Шопинг", hacks: "Лайфхаки", services: "Сервисы" };
const SETTINGS: Record<string, string> = { name: "имя для приветствия", city: "город", temp: "температура, °C", feels: "ощущается как, °C", budget: "бюджет на месяц, ₫", kwhPrice: "цена кВт·ч, ₫", quote: "девиз под приветствием",
  savePct: "процент на подушку безопасности (0–90)", budgetAuto: "бюджет автоматически по деньгам на счетах и доходам (да/нет)",
  weightGoal: "желаемый вес, кг", notifyMorning: "время утренней сводки (HH:MM или off)", notifyRemind: "время напоминания записать расходы (HH:MM или off)",
  notifyReport: "время вечернего отчёта (HH:MM или off)", notifyMonthly: "время отчёта за месяц 1-го числа (HH:MM или off)",
  tone: "стиль общения бота: friend — по-дружески, с матом и подколами; polite — вежливо, без мата" };
const NUM_SETTINGS = ["temp", "feels", "budget", "kwhPrice", "weightGoal", "savePct"];
// when the scheduled messages go out, unless changed in the settings
const NOTIFY: Record<string, string> = { notifyMorning: "08:00", notifyRemind: "20:00", notifyReport: "21:30", notifyMonthly: "10:00" };
// currency: symbol, default account name
const CUR: Record<string, [string, string]> = { VND: ["₫", "Донги"], RUB: ["₽", "Рубли"], KZT: ["₸", "Тенге"], USD: ["$", "Доллары"], EUR: ["€", "Евро"], THB: ["฿", "Баты"] };
const MEALS = ["Завтрак", "Обед", "Ужин", "Перекус"];
const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAYS_FULL = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const SEC_NAME: Record<string, string> = { expenses: "расход", incomes: "доход", transfers: "обмен", events: "событие", notes: "заметку", goals: "цель", trips: "поездку", health: "запись о здоровье", apartments: "квартиру", weights: "взвешивание" };
// what a record is called in each list section, for finding it by name
// deno-lint-ignore no-explicit-any
const NAME: Record<string, (x: any) => string> = {
  expenses: (x) => x.note, incomes: (x) => x.source, transfers: (x) => x.note, events: (x) => x.title, notes: (x) => x.text,
  goals: (x) => x.title, trips: (x) => x.city, health: (x) => x.title, apartments: (x) => x.name, weights: (x) => x.date,
};

// a missing secret is not remembered, so a key added to the Vault later is picked up without a redeploy
const secrets = new Map<string, string>();
async function secret(name: string): Promise<string> {
  if (!secrets.has(name)) {
    const { data } = await db.rpc("vl_secret", { p_name: name });
    if (!data) return "";
    secrets.set(name, data);
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
const NB = String.fromCharCode(160);
const num = (n: number, frac = 0) => n.toLocaleString("ru-RU", { maximumFractionDigits: frac }).replace(/\s/g, NB);
const money = (n: number) => num(Math.round(n)) + NB + "₫";
const dollars = (n: number) => num(Math.round(n)) + NB + "$";
const cash = (n: number, cur: string) => num(n, cur === "USD" || cur === "EUR" ? 2 : 0) + NB + CUR[cur][0];
const rateText = (n: number) => num(n, n >= 100 ? 0 : n >= 1 ? 2 : 4);
const cap = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1);
const kg = (n: number) => num(n, 1) + NB + "кг";
const addDays = (iso: string, n: number) => new Date(Date.parse(iso + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const prevMonth = (m: string) => addDays(m + "-01", -1).slice(0, 7);
const esc = (s: unknown) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
const todayIdx = () => (new Date(today() + "T12:00:00Z").getUTCDay() + 6) % 7;
const dshort = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
const mlabel = (m: string) => MONTHS[+m.slice(5, 7) - 1] + " " + m.slice(0, 4);
const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
const isMonth = (d: string) => /^\d{4}-\d{2}$/.test(d);
const low = (s: unknown) => String(s ?? "").toLowerCase().replace(/ё/g, "е").trim();
const q = (s: unknown) => "«" + String(s ?? "") + "»";

// the record whose name matches: exactly first, then one name containing the other
function pick<T>(list: T[], name: string, key: (x: T) => string): T | undefined {
  const w = low(name);
  if (!w) return;
  const named = list.filter((x) => low(key(x)));
  return named.find((x) => low(key(x)) === w) ?? named.find((x) => low(key(x)).includes(w) || w.includes(low(key(x))));
}

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

/* ---------- exchange rates: the one from the site's settings, otherwise today's rate from a free public source ---------- */
const live = new Map<string, number>();
async function liveRate(cur: string): Promise<number> {
  if (!live.has(cur)) {
    let v = 0;
    for (const base of ["https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1", "https://latest.currency-api.pages.dev/v1"]) {
      try {
        const j = await (await fetch(`${base}/currencies/${cur.toLowerCase()}.json`)).json();
        v = Number(j?.[cur.toLowerCase()]?.vnd) || 0;
        if (v) break;
      } catch { /* try the mirror */ }
    }
    live.set(cur, v);
  }
  return live.get(cur)!;
}

/* ---------- site data ---------- */
// every section is one row of vl_sections: lists are { items: [...] }, the rest are plain objects
// deno-lint-ignore no-explicit-any
type Item = Record<string, any>;
async function section(sec: string): Promise<Item> {
  const { data } = await db.from("vl_sections").select("body").eq("sec", sec).maybeSingle();
  return data?.body ?? {};
}
async function items(sec: string): Promise<Item[]> {
  const b = await section(sec);
  return Array.isArray(b.items) ? b.items : [];
}
async function rpc(fn: string, args: Record<string, unknown>) {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

// a change and what puts it back
type Op =
  | { op: "remove"; sec: string; id: string }
  | { op: "put"; sec: string; item: Item }
  | { op: "patch"; sec: string; id: string; fields: Item; drop?: string[] }
  | { op: "set"; sec: string; key: string; value: unknown }
  | { op: "goal"; id: string; usd: number };
async function add(sec: string, item: Item, front = false): Promise<Op> {
  await rpc("vl_append", { p_sec: sec, p_item: item, p_front: front });
  return { op: "remove", sec, id: item.id };
}
// cancelling puts back only the fields this change touched, so later changes to the same record stay;
// with drop, a record left with all those fields empty is removed
async function put(sec: string, before: Item, after: Item, drop?: string[]): Promise<Op> {
  await rpc("vl_put", { p_sec: sec, p_item: after });
  const fields: Item = {};
  for (const k of Object.keys(after)) if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) fields[k] = before[k] ?? null;
  return { op: "patch", sec, id: after.id, fields, drop };
}
async function setKey(sec: string, key: string, value: unknown): Promise<Op> {
  const before = (await section(sec))[key];
  await rpc("vl_set", { p_sec: sec, p_key: key, p_value: value });
  return { op: "set", sec, key, value: before ?? null };
}
async function revert(ops: Op[]) {
  for (const o of [...ops].reverse()) {
    if (o.op === "remove") await rpc("vl_remove", { p_sec: o.sec, p_id: o.id });
    else if (o.op === "put") await rpc("vl_put", { p_sec: o.sec, p_item: o.item });
    else if (o.op === "patch") {
      const cur = (await items(o.sec)).find((x) => x.id === o.id);
      if (!cur) continue;
      const next = { ...cur, ...o.fields };
      if (o.drop?.every((k) => !Number(next[k]))) await rpc("vl_remove", { p_sec: o.sec, p_id: o.id });
      else await rpc("vl_put", { p_sec: o.sec, p_item: next });
    } else if (o.op === "set") await rpc("vl_set", { p_sec: o.sec, p_key: o.key, p_value: o.value ?? null });
    else await rpc("vl_goal_add", { p_id: o.id, p_usd: o.usd });
  }
}

// everything the AI needs to know to find existing records, and the numbers for reports
type Ctx = {
  usd: number; budget: number; budgetGross: number; savePct: number; budgetSrc: string; kwhPrice: number; rates: Record<string, number>;
  goals: Item[]; notes: Item[]; events: Item[]; trips: Item[]; apartments: Item[]; expenses: Item[]; incomes: Item[]; transfers: Item[]; accounts: Item[];
  weights: Item[]; utilities: Item[]; settings: Item;
  profile: Item; activities: Item[]; meals: Item[]; shopping: Item[]; recipes: Item[];
  people: { chat_id: number; name: string }[]; me: number;
};
async function context(): Promise<Ctx> {
  const { data } = await db.from("vl_sections").select("sec, body");
  const by: Record<string, Item> = Object.fromEntries((data ?? []).map((r) => [r.sec, r.body ?? {}]));
  const list = (s: string): Item[] => (Array.isArray(by[s]?.items) ? by[s].items : []);
  const st = by.settings ?? {};
  const c: Ctx = {
    usd: 0, budget: 0, budgetGross: 0, savePct: 0, budgetSrc: "", kwhPrice: Number(st.kwhPrice) || 3000, rates: { ...(st.rates ?? {}), ...(st.rate ? { USD: Number(st.rate) } : {}) },
    goals: list("goals"), notes: list("notes"), events: list("events"), trips: list("trips"), apartments: list("apartments"),
    expenses: list("expenses"), incomes: list("incomes"), transfers: list("transfers"), accounts: list("accounts"),
    weights: list("weights").sort((a, b) => (a.date < b.date ? -1 : 1)), utilities: list("utilities"), settings: st,
    profile: by.profile ?? {}, activities: list("activities"), meals: Array.isArray(by.meals?.days) ? by.meals.days : [],
    shopping: list("shopping"), recipes: list("recipes"), people: [], me: 0,
  };
  c.usd = (await vndRate("USD", c)) || 25000;
  const b = await budgetOf(c, st);
  c.budget = b.sum; c.budgetGross = b.gross; c.savePct = b.pct; c.budgetSrc = b.src;
  return c;
}
// the monthly budget, as on the site: automatic (budgetAuto) is the average income once two of the last three
// full months have incomes, until then the money on all accounts plus what was spent this month;
// savePct of it goes to the safety cushion, so sum is what can be spent
async function budgetOf(c: Ctx, st: Item) {
  const now = today().slice(0, 7);
  let gross = Number(st.budget) || 70000000, src = "";
  if (st.budgetAuto) {
    const inc: number[] = [];
    for (let m = prevMonth(now), n = 0; n < 3; n++, m = prevMonth(m)) inc.push(sumOf(c.incomes.filter((i) => i.kind !== "deposit" && String(i.date).startsWith(m)), "vnd"));
    const got = inc.filter((v) => v > 0);
    if (got.length >= 2) { gross = got.reduce((a, b) => a + b, 0) / got.length; src = `средний доход за ${got.length} мес.`; }
    else if (c.accounts.length) {
      // only spending taken from an account is added back: the rest never left the balances
      gross = sumOf(c.expenses.filter((e) => e.acc && String(e.date).startsWith(now)), "amount");
      for (const { acc, bal } of balances(c)) gross += bal * (await vndRate(acc.cur, c));
      src = "деньги на счетах";
    }
  }
  const pct = Math.min(90, Math.max(0, Number(st.savePct) || 0));
  return { sum: Math.round(gross * (1 - pct / 100)), gross: Math.round(gross), pct, src };
}
// ₫ for one unit of the currency; 0 when it is unknown
async function vndRate(cur: string, c: Ctx): Promise<number> {
  return cur === "VND" ? 1 : Number(c.rates[cur]) || (await liveRate(cur));
}

// money left on each account: opening balance plus everything that came in and went out
function balances(c: Ctx): { acc: Item; bal: number }[] {
  return c.accounts.map((a) => {
    let bal = Number(a.start) || 0;
    for (const i of c.incomes) if (i.acc === a.id) bal += Number(i.amount) || 0;
    for (const t of c.transfers) {
      if (t.from === a.id) bal -= Number(t.out) || 0;
      if (t.to === a.id) bal += Number(t.in) || 0;
      if (t.feeAcc === a.id) bal -= Number(t.fee) || 0;
    }
    for (const e of c.expenses) if (e.acc === a.id) bal -= Number(e.cur && e.cur !== "VND" ? e.orig : e.amount) || 0;
    return { acc: a, bal };
  });
}

// a worker is stopped 150 s after it starts (the Free plan's wall clock), even in the middle of an answer;
// AI calls get only what is left of that, so a slow one gives way to the fallback instead of being cut off
const BOOT = Date.now();
const timeLeft = () => BOOT + 145_000 - Date.now();

/* ---------- the AI: Claude when an Anthropic key is in the Vault, the free Groq models without it or when Claude fails ---------- */
const CLAUDE_MODEL = "claude-opus-5-5";
let claudeClient: Anthropic | null = null;
async function claude(): Promise<Anthropic | null> {
  const key = await secret("anthropic_api_key");
  if (!key) return null;
  return claudeClient ??= new Anthropic({ apiKey: key });
}
// one request to Claude: system messages go to the system prompt, the rest must start with the user;
// a safety decline is re-run on another model by the API itself (fallbacks), web search answers can take several rounds (pause_turn)
async function claudeCall(cl: Anthropic, messages: Msg[], opt: { maxTokens?: number; effort?: string; schema?: unknown; web?: boolean; timeoutMs?: number }): Promise<string> {
  if (timeLeft() < 20_000) throw new Error("Claude: no time left in this worker");
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const turns: any[] = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  for (let round = 0; round < 4; round++) {
    const res: any = await cl.beta.messages.create({
      model: CLAUDE_MODEL, max_tokens: opt.maxTokens ?? 16000, system, messages: turns,
      betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      output_config: { effort: opt.effort ?? "medium", ...(opt.schema ? { format: { type: "json_schema", schema: opt.schema } } : {}) },
      ...(opt.web ? { tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }] } : {}),
    } as any, { timeout: Math.max(5_000, Math.min(opt.timeoutMs ?? 90_000, timeLeft() - 12_000)), maxRetries: 0 });
    if (res.stop_reason === "pause_turn") { turns.push({ role: "assistant", content: res.content }); continue; }
    if (res.stop_reason === "refusal") throw new Error("CLAUDE_REFUSAL");
    return res.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
  }
  throw new Error("Claude: too many rounds");
}
// Claude first; on any of its errors (no money on the account, overload) the free Groq models answer instead, if their key is there
async function aiCall(messages: Msg[], opt: { json?: boolean; maxTokens?: number; temperature?: number; noWait?: boolean; effort?: string; web?: boolean } = {}): Promise<string> {
  const cl = await claude();
  if (cl) {
    try {
      const out = await claudeCall(cl, opt.json ? [...messages, { role: "system", content: "Ответь только JSON-объектом, без пояснений и без ```." }] : messages,
        { maxTokens: opt.json ? 16000 : Math.max(4000, (opt.maxTokens ?? 3000) * 3), effort: opt.effort ?? (opt.json ? "low" : "medium"), web: opt.web,
          timeoutMs: opt.noWait ? 20_000 : opt.web ? 90_000 : 60_000 });
      if (!opt.json) return out;
      const j = out.replace(/^```(?:json)?\s*|\s*```$/g, "");
      JSON.parse(j);
      return j;
    } catch (e) {
      console.error(e);
      if (!(await secret("groq_api_key"))) throw e;
    }
  }
  return groqCall(messages, opt);
}
const aiJSON = async (messages: Msg[], maxTokens = 4000): Promise<Item> => JSON.parse(await aiCall(messages, { json: true, maxTokens, temperature: 0.4 }));

/* ---------- text -> actions ---------- */
const KINDS = ["expense", "income", "exchange", "balance", "rate", "event", "note", "health", "utility", "apartment", "trip", "trip_item", "meal",
  "goal", "goal_add", "deposit_back", "weight", "activity", "coach", "meal_plan", "recipe", "shopping", "send", "done", "reschedule", "delete", "useful", "setting", "report", "ask"];
const SECTIONS = ["expenses", "incomes", "transfers", "events", "notes", "goals", "trips", "health", "apartments", "weights"];
const REPORTS = ["expenses", "money", "events", "goals", "notes", "weight", "week", "month"];
const str = { type: "string" }, numb = { type: "number" };
const curs = { type: "string", enum: [...Object.keys(CUR), ""] };
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
        required: ["kind", "date", "date_to", "title", "text", "city", "amount", "currency", "amount_to", "currency_to", "fee", "fee_currency", "account", "account_to",
          "deposit", "category", "event_type", "time_from", "time_to", "health_kind", "month", "util_kind", "kwh", "rooms", "area", "weekday", "meal", "kcal",
          "key", "value", "section", "flag", "minutes", "met", "to"],
        properties: {
          kind: { type: "string", enum: KINDS },
          date: { type: "string", description: "YYYY-MM-DD or empty" },
          date_to: { type: "string", description: "YYYY-MM-DD or empty" },
          title: str, text: str, city: str,
          amount: numb, currency: curs, amount_to: numb, currency_to: curs, fee: numb, fee_currency: curs, account: str, account_to: str, deposit: numb,
          category: { type: "string", enum: [...CATS, ""] },
          event_type: { type: "string", enum: [...Object.keys(EVT), ""] },
          time_from: { type: "string", description: "HH:MM or empty" },
          time_to: { type: "string", description: "HH:MM or empty" },
          health_kind: { type: "string", enum: [...HEALTH, ""] },
          month: { type: "string", description: "YYYY-MM or empty" },
          util_kind: { type: "string", enum: [...Object.keys(UTIL), ""] },
          kwh: numb, rooms: numb, area: numb,
          weekday: { type: "integer", description: "0 = Monday ... 6 = Sunday, -1 if not used" },
          meal: { type: "string", enum: [...MEALS, ""] },
          kcal: numb,
          key: str, value: str,
          section: { type: "string", enum: [...new Set([...SECTIONS, ...REPORTS, "shopping", "menu"]), ""] },
          flag: { type: "boolean" },
          minutes: numb, met: numb, to: str,
        },
      },
    },
    question: { type: "string" },
  },
};

type Rec = {
  kind: string; date: string; date_to: string; title: string; text: string; city: string;
  amount: number; currency: string; amount_to: number; currency_to: string; fee: number; fee_currency: string; account: string; account_to: string; deposit: number;
  category: string; event_type: string; time_from: string; time_to: string; health_kind: string; month: string; util_kind: string;
  kwh: number; rooms: number; area: number; weekday: number; meal: string; kcal: number; key: string; value: string; section: string; flag: boolean;
  minutes: number; met: number; to: string;
};

const lines = (l: string[], empty = "нет") => (l.length ? l.join("\n") : empty);
function known(c: Ctx): string {
  const from = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  const ev = c.events.filter((e) => !e.done && String(e.date) >= from).sort((a, b) => (a.date + a.from < b.date + b.from ? -1 : 1)).slice(0, 40);
  const exp = [...c.expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 15);
  const inc = [...c.incomes].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10);
  return `Подключены к боту: ${c.people.map((p) => q(p.name) + (p.chat_id === c.me ? " (пишет сейчас)" : "")).join(", ") || "только этот чат"}
Счета:
${lines(c.accounts.map((a) => `- ${q(a.name)} (${a.cur})`))}
Цели:
${lines(c.goals.map((g) => `- ${q(g.title)}: накоплено ${g.saved || 0} из ${g.target || 0} $`))}
Незакрытые заметки:
${lines(c.notes.filter((n) => !n.done).slice(0, 40).map((n) => `- ${q(n.text)}`))}
Ближайшие события:
${lines(ev.map((e) => `- ${q(e.title)} ${e.date}${e.from ? " " + e.from : ""}`))}
Поездки:
${lines(c.trips.map((t) => `- ${q(t.city)} ${t.from}…${t.to}; чек-лист: ${(t.checklist ?? []).map((i: Item) => q(i.t) + (i.d ? " (сделано)" : "")).join(", ") || "пусто"}`))}
Квартиры:
${lines(c.apartments.map((a) => `- ${q(a.name)}, ${a.city}${a.current ? " (живут сейчас)" : ""}${depText(a)}`))}
Последние расходы:
${lines(exp.map((e) => `- ${e.date} ${e.amount} VND ${e.cat} ${q(e.note)}${e.cur && e.cur !== "VND" ? ` (${e.orig} ${e.cur})` : ""}${c.accounts.find((a) => a.id === e.acc) ? ", счёт " + q(c.accounts.find((a) => a.id === e.acc)!.name) : ""}`))}
Последние взвешивания:
${lines(c.weights.slice(-5).map((w) => `- ${w.date} ${w.kg} кг`))}
Список покупок: ${lines(c.shopping.map((i) => `- ${q(i.name)}${i.done ? " (куплено)" : ""}`))}
Рецепты: ${c.recipes.map((r) => q(r.title)).join(", ") || "нет"}
Профиль питания: ${c.profile.kcal ? `норма ${c.profile.kcal} ккал, цель ${c.profile.goal_kg || "—"} кг` : "не заполнен"}
Последние доходы:
${lines(inc.map((i) => `- ${i.date} ${i.amount} ${i.cur} ${q(i.source)}`))}`;
}

const prompt = (c: Ctx) => `Ты помощник пары, которая живёт во Вьетнаме. По их голосовому или текстовому сообщению ты заполняешь их сайт-планер: превращаешь сообщение в список действий records.
Сегодня ${today()} (${DAYS_FULL[todayIdx()]}), часовой пояс ${TZ}. Относительные даты («завтра», «в пятницу», «вчера», «через неделю») переводи в YYYY-MM-DD, месяцы — в YYYY-MM.
Деньги: amount — число, как сказано («150 тысяч», «150к» = 150000, «полтора миллиона», «1,5 ляма» = 1500000), currency — его валюта: VND (донги, если валюта не названа), RUB (рубли), KZT (тенге), USD (доллары), EUR (евро), THB (баты). В донги не пересчитывай, это сделает бот.

Виды действий (kind) и их поля:
- expense — потратили деньги. date, amount, currency, category (одна из: ${CATS.join(", ")}), title — что купили, коротко; account — счёт из списка, если назван или назван банк; «с карты», «картой» — account "карта".
  currency — если валюта названа явно («тенге», «рублей», «$») или назван счёт в этой валюте («с рублёвого счёта» — RUB и account этого счёта); иначе VND. «С карты» валюту не меняет: сумма всё равно в донгах.
  Вода, купленная в магазине, — «Питание»; «Коммуналка» — только счета за свет, воду по счётчику, интернет, мусор.
  account всегда копируй точно из списка «Счета». Банк узнавай по валюте: Kaspi/Каспи/Халык — счёт в KZT, Тинькофф/Т-Банк/Сбер/Альфа — счёт в RUB, наличные во Вьетнаме — счёт в VND. currency — валюта цены, а не карты: «кофе 100 тысяч с каспи» — это 100000 VND с счёта в KZT.
- income — получили деньги: зарплата, перевод от кого-то, кэшбэк, продажа. date, amount, currency, title — источник, коротко с заглавной буквы («Зарплата»); account — счёт, если назван.
- exchange — обмен валюты или перевод между своими счетами («поменял 50 тысяч рублей на тенге, получил 270 тысяч, комиссия 500 рублей»). amount + currency — сколько отдали, amount_to + currency_to — сколько получили, fee + fee_currency — комиссия, если названа; account / account_to — счета, если названы; title — заметка.
- balance — сколько сейчас денег на счёте («на каспи осталось 120 тысяч тенге»). account — название счёта (из списка или новое), amount, currency.
- rate — задать курс валюты («курс рубля 280 донгов», «доллар по 25 400»). currency, amount — сколько донгов за 1 единицу.
- event — дело или встреча в календаре. date, title, time_from/time_to (HH:MM, если названо время), event_type (${Object.entries(EVT).map(([k, v]) => k + " — " + v).join(", ")}).
  Запланированный визит к врачу, на анализы или прививку («завтра в 10 стоматолог») — это event с event_type "health".
- note — задача или напоминание без даты («купить переходник», «продлить визу»). title.
- health — уже состоявшийся визит к врачу, сданные анализы, прививка, оплаченная страховка. date, health_kind (${HEALTH.join(", ")}), title, amount + currency — стоимость, text — заметка.
  Если за медицину заплатили, добавь ещё expense с этой суммой и category "Здоровье".
- utility — коммунальный счёт («за свет 900 тысяч», «вода за октябрь 150к», «нагорело 320 киловатт»). month — за какой месяц счёт (YYYY-MM; если не сказано — текущий), util_kind (electricity — свет/электричество, water — вода, internet — интернет/wi-fi, garbage — мусор, service — сервис/обслуживание кондо), amount, currency, kwh — киловатт-часы, если названы.
  Расход в бюджет добавится сам, отдельный expense для коммуналки не нужен.
- apartment — новая квартира. city, title — название или район, amount + currency — аренда в месяц, deposit — депозит, rooms, area (м²), date — заезд, date_to — выезд, text — заметка, flag — true, если живут там сейчас или переезжают туда.
- deposit_back — хозяин вернул залог (депозит) за квартиру («залог вернули», «вернули депозит 12 миллионов, 500 тысяч удержали за уборку»). title — квартира из списка ниже, если названа; amount + currency — сколько вернули на руки (если не сказано — весь залог), account — куда положили, date.
- trip — новая поездка. city — куда, date — с какого числа, date_to — по какое, amount + currency — бюджет, text — заметка.
- trip_item — пункт в чек-лист поездки («в Дананг не забыть забронировать байк»). city — поездка из списка ниже, text — пункт.
- meal — блюдо в недельный план питания. weekday (0 — понедельник … 6 — воскресенье; сегодня ${todayIdx()}), meal (${MEALS.join(", ")}), title — блюдо, text — дополнение, kcal. На несколько дней — по record на каждый день.
- goal — новая цель накопить («хотим накопить 38 миллионов на айфон»). title — на что копим, коротко и с заглавной буквы, без суммы; amount + currency — сколько нужно.
- goal_add — отложили деньги в существующую цель («отложили 5 миллионов на айфон»). title — цель из списка ниже, amount, currency. Это не expense: деньги отложены, а не потрачены.
- done — что-то сделано («купил переходник», «билеты в Дананг купили», «йогу провели», «курицу купил» — пункт списка покупок). section — notes, events, trips или shopping; title — текст заметки, события или пункта чек-листа из списков ниже; city — поездка, если это пункт чек-листа.
- reschedule — перенести событие на другую дату или время. title — событие из списка ниже, date, time_from, time_to.
- delete — удалить запись («удали заметку про визу», «стоматолог отменился», «убери расход на кофе, это ошибка»). Вопрос о записи («ты с рублёвого списал?», «куда записал?») — это ask, а не delete. section (${SECTIONS.join(", ")}), title — текст записи из списков ниже (для расхода — описание, для дохода — источник).
- useful — добавить в шпаргалку «Полезное». key (${Object.entries(USEFUL).map(([k, v]) => k + " — " + v).join(", ")}), text.
- setting — изменить настройку сайта. key (${Object.entries(SETTINGS).map(([k, v]) => k + " — " + v).join(", ")}), value.
- weight — взвесился («вес 78,4», «утром 79 и 2»). amount — вес в килограммах, date, text — заметка. Для удаления взвешивания в delete title — его дата YYYY-MM-DD.
- activity — физическая активность: тренировка, прогулка, спорт («пробежал 5 км за 30 минут», «час играли в пиклбол», «прошёл 12 тысяч шагов»). title — что делал, коротко с заглавной буквы; minutes — длительность (шаги переводи как 1000 шагов ≈ 10 минут ходьбы); met — MET этой активности (ходьба 3.5, быстрая ходьба 4.5, бег 9, велосипед 7, плавание 7, силовая 5, йога 2.5, пиклбол и теннис 6, футбол 7, танцы 5, серфинг 3); date.
- coach — человек хочет похудеть, набрать вес или питаться правильно, просит помочь с питанием или режимом, хочет обновить свои данные для питания. Верни один record с kind "coach", остальные поля пустые: бот сам начнёт с ним разговор.
- meal_plan — составить меню или рацион на неделю, обновить меню, составить список покупок под питание.
- recipe — рецепт или как приготовить блюдо («как готовить фо с курицей», «рецепт на ужин»). title — блюдо.
- shopping — показать список покупок.
- send — написать или переслать сообщение другому человеку, подключённому к боту («напиши Насте, что я задержусь», «отправь Насте список покупок», «нет, ты отправь это Насте»). to — имя из списка «Подключены к боту»; text — что передать, коротко, от лица того, кто пишет; переслать список покупок — section "shopping", меню на сегодня — section "menu"; переслать твой предыдущий ответ из разговора — text пустой.
- report — вопрос о данных, а не новая запись («сколько потратили в этом месяце», «сколько денег на счетах», «что у нас на неделе», «сколько накопили», «что надо сделать», «как мой вес», «отчёт за неделю», «итоги прошлого месяца»). section: expenses (month — какой месяц; date — если спрашивают про конкретный день: «за сегодня», «вчера», «за 4 ноября»), money (доходы, расходы и остатки на счетах; month), events, goals, notes, weight, week (отчёт за последние 7 дней) или month (полный отчёт за месяц; month).
- ask — любой другой вопрос, на который нужен обдуманный ответ, а не готовая сводка: сравнения, причины, советы, прогнозы, расчёты («на что мы больше всего тратим и где сэкономить», «хватит ли денег до конца месяца», «сколько в среднем уходит на еду в неделю», «когда накопим на айфон», «как изменились траты за три месяца»), а также вопросы о жизни во Вьетнаме. text — вопрос целиком своими словами. Если вопрос подходит под report — используй report, иначе ask.
Бот сам присылает напоминания о делах за час, утреннюю сводку, вечером напоминание записать расходы и отчёт за день, в воскресенье — за неделю, 1-го числа — за прошлый месяц. Время меняется через setting (notifyMorning, notifyRemind, notifyReport, notifyMonthly; value — HH:MM или off, чтобы выключить).

Данные на сайте сейчас:
${known(c)}

Правила:
- Одно сообщение может содержать несколько действий: верни их все.
- Учитывай предыдущие реплики разговора: «нет, ты отправь ей», «и ещё одно такое же», «перенеси его на завтра» относятся к сказанному раньше.
- Если сообщение — просто разговор, вопрос или просьба, которую нельзя записать, верни один record с kind "ask" и text — вопрос целиком.
- Для goal_add, deposit_back, done, reschedule, delete и trip_item копируй title и city точно из списков выше. Если подходящей записи нет, ничего не выдумывай: верни пустой records и спроси в question, что имелось в виду.
- Никогда не записывай заново траты из списка «Последние расходы» и из прошлых ответов бота. «Покажи», «сколько», «какие», «все расходы за …», «за сегодня» — это report, а не expense; новый expense только когда в сообщении названа сумма.
- Поля, которые не нужны для этого вида, оставляй пустой строкой, 0, false; weekday — -1.
- Если смысл непонятен, верни пустой records и короткий уточняющий вопрос по-русски в question; иначе question пустой.`;

// the free models follow the format less strictly than structured output, so every field is checked here
const hhmm = (t: unknown) => {
  const m = String(t ?? "").match(/^(\d{1,2})(?:[:.](\d{2}))?$/);
  return m && +m[1] < 24 ? m[1].padStart(2, "0") + ":" + (m[2] ?? "00") : "";
};
const text = (v: unknown) => String(v ?? "").trim();
const amount = (v: unknown) => Math.max(0, Number(String(v ?? "").replace(/\s/g, "").replace(",", ".")) || 0);
const cur = (v: unknown) => (CUR[text(v).toUpperCase()] ? text(v).toUpperCase() : "");
// deno-lint-ignore no-explicit-any
function normalize(o: any): { records: Rec[]; question: string } {
  // deno-lint-ignore no-explicit-any
  const records = (Array.isArray(o?.records) ? o.records : []).filter((r: any) => KINDS.includes(r?.kind)).map((r: any): Rec => ({
    kind: r.kind, date: text(r.date), date_to: text(r.date_to), title: text(r.title), text: text(r.text), city: text(r.city),
    amount: amount(r.amount), currency: cur(r.currency) || "VND", amount_to: amount(r.amount_to), currency_to: cur(r.currency_to) || "VND",
    fee: amount(r.fee), fee_currency: cur(r.fee_currency), account: text(r.account), account_to: text(r.account_to), deposit: amount(r.deposit),
    category: text(r.category), event_type: text(r.event_type), time_from: hhmm(r.time_from), time_to: hhmm(r.time_to), health_kind: text(r.health_kind),
    month: text(r.month), util_kind: text(r.util_kind), kwh: amount(r.kwh), rooms: amount(r.rooms), area: amount(r.area),
    weekday: r.weekday === "" || r.weekday == null || +r.weekday < 0 ? -1 : Math.min(6, Math.trunc(+r.weekday) || 0),
    meal: text(r.meal), kcal: amount(r.kcal), key: text(r.key), value: text(r.value), section: text(r.section), flag: r.flag === true || r.flag === "true",
    minutes: amount(r.minutes), met: amount(r.met), to: text(r.to),
  }));
  return { records, question: text(o?.question) };
}

// the answer format for the free models, short: the full JSON schema alone would eat a third of the free per-minute quota
const FORMAT = `Ответь только JSON: {"records":[{"kind":"…", и только нужные этому виду поля из: date, date_to, title, text, city, amount, currency, amount_to, currency_to, fee, fee_currency, account, account_to, deposit, category, event_type, time_from, time_to, health_kind, month, util_kind, kwh, rooms, area, weekday, meal, kcal, key, value, section, flag, minutes, met, to}], "question":""}`;

async function extract(input: string, c: Ctx, history: Msg[] = []): Promise<{ records: Rec[]; question: string }> {
  // Claude: the exact schema, with the last turns of the conversation so that follow-ups make sense
  const cl = await claude();
  if (cl) {
    try {
      const out = await claudeCall(cl, [{ role: "system", content: prompt(c) }, ...history.slice(-8), { role: "user", content: input }], { maxTokens: 16000, effort: "low", schema: RECORD_SCHEMA, timeoutMs: 40_000 });
      return normalize(JSON.parse(out || "{}"));
    } catch (e) {
      console.error(e);
      if (String((e as Error).message) === "CLAUDE_REFUSAL") return { records: [], question: "Не получилось разобрать сообщение, переформулируйте, пожалуйста." };
      if (!(await secret("groq_api_key"))) throw e;
    }
  }
  // the free path: Groq with the short format
  if (!(await secret("groq_api_key"))) throw new Error("NO_AI_KEY");
  const out = JSON.parse(await groqCall([{ role: "system", content: prompt(c) + "\n\n" + FORMAT }, ...history.slice(-8), { role: "user", content: input }], { json: true, maxTokens: 2500, temperature: 0.4 }));
  return normalize(out);
}

/* ---------- apply one action ---------- */
type Done = { line: string; ops: Op[] };
// the deposit for the AI's context: how much and whether it is back
const depText = (a: Item) => a.deposit ? `, залог ${a.deposit} ₫ ${a.depBack ? "вернули " + a.depBack + (a.depBackSum ? ` (${a.depBackSum} ₫)` : "") : "у хозяина, вернётся при выезде"}` : "";
const miss = (what: string, name: string): Done => ({ line: `❓ Не нашёл ${what} ${q(esc(name))}, ничего не изменил`, ops: [] });
const noRate = (c: string): Done => ({ line: `❓ Не знаю курс ${c}: задайте его, например «курс ${c} 280 донгов»`, ops: [] });

// banks named by voice, by the currency of their cards
const BANKS: [RegExp, string][] = [[/kaspi|каспи|halyk|халык|freedom|фридом/i, "KZT"], [/tinkoff|тинько|т-банк|сбер|альфа|втб|озон/i, "RUB"], [/налич|кэш|cash/i, "VND"]];
// a sum said in a currency other than dong, and the kinds whose sum is in dong unless one is said
const CUR_WORD = /тенге|тг(?![а-яё])|₸|kzt|рубл|руб(?![а-яё])|₽|rub|доллар|бакс|\$|usd|евро|€|eur|бат(?![а-яё])|батов|бата|thb|юан/i;
const DONG_KINDS = ["expense", "health", "utility", "apartment", "trip", "goal", "goal_add", "deposit_back"];
const CARD_SAID = /с карт|картой|по карт|карточк/i;
// the account money comes from or goes to: the named one, else the first one in that currency, else a new one
async function account(name: string, currency: string): Promise<{ acc: Item; ops: Op[] }> {
  const list = await items("accounts");
  // «с карты»: the account set as the card in the site's settings, otherwise the tenge one
  if (name && /карт|card/i.test(name)) {
    const st = await section("settings");
    const card = list.find((a) => a.id === st.cardAcc) ?? list.find((a) => a.cur === "KZT");
    if (card) return { acc: card, ops: [] };
  }
  // a bank that has no account of its own name is the account in its card's currency
  const bankCur = name ? BANKS.find(([re]) => re.test(name))?.[1] : undefined;
  const acc = (name && pick(list, name, (a) => a.name)) || (bankCur && list.find((a) => a.cur === bankCur)) || (!name && list.find((a) => a.cur === currency));
  if (acc) return { acc, ops: [] };
  const created = { id: uid(), name: name ? cap(name) : CUR[currency][1], cur: bankCur ?? currency, start: 0 };
  return { acc: created, ops: [await add("accounts", created)] };
}

async function apply(r: Rec, c: Ctx): Promise<Done> {
  const date = isDate(r.date) ? r.date : today();
  const rate = await vndRate(r.currency, c);
  const vnd = Math.round(r.amount * rate);
  const inVnd = r.currency !== "VND" && r.amount ? ` (${cash(r.amount, r.currency)})` : "";
  // everything but money movements is kept in dong on the site, so other currencies need a rate
  if (!rate && r.amount && !["exchange", "balance", "rate", "income"].includes(r.kind)) return noRate(r.currency);
  switch (r.kind) {
    case "expense": {
      const item: Item = { id: uid(), date, cat: CATS.includes(r.category) ? r.category : "Другое", amount: vnd, note: r.title };
      const ops: Op[] = [];
      // a foreign currency is always paid from an account in it; dong only when the account is named or one exists
      let charged = "";
      let from = "";
      if (r.currency !== "VND" || r.account || c.accounts.some((a) => a.cur === "VND")) {
        const a = await account(r.account, r.currency);
        ops.push(...a.ops);
        item.acc = a.acc.id;
        // the account is charged in its own currency: dong paid with a tenge card comes off in tenge at the set rate
        if (a.acc.cur !== "VND") {
          const k = a.acc.cur === r.currency ? 0 : await vndRate(a.acc.cur, c);
          if (a.acc.cur !== r.currency && !k) return noRate(a.acc.cur);
          const orig = k ? Math.round(vnd / k * 100) / 100 : r.amount;
          Object.assign(item, { orig, cur: a.acc.cur });
          if (a.acc.cur !== r.currency) charged = ` · списано ${cash(orig, a.acc.cur)} с ${esc(a.acc.name)}`;
        }
        from = charged || ` · с ${esc(a.acc.name)}`;
      }
      ops.push(await add("expenses", item));
      const sum = r.currency !== "VND" ? `${cash(r.amount, r.currency)} (≈ ${money(vnd)})` : money(vnd);
      return { line: `💸 Расход ${sum} · ${esc(item.cat)}${r.title ? " · " + esc(r.title) : ""}${from} · ${dshort(date)}`, ops };
    }
    case "income": {
      if (!r.amount) return { line: "❓ Не расслышал сумму дохода", ops: [] };
      const a = await account(r.account, r.currency);
      const item = { id: uid(), date, amount: r.amount, cur: r.currency, vnd, rate, source: r.title || "Доход", acc: a.acc.id };
      const ops = [...a.ops, await add("incomes", item)];
      // say where the rate came from: the site's settings or today's market rate
      const src = c.rates[r.currency] ? "" : ", сегодняшний";
      return {
        line: `💰 Доход ${cash(r.amount, r.currency)}${r.currency !== "VND" ? rate ? ` ≈ ${money(vnd)} (курс ${rateText(rate)}${src})` : " (курс неизвестен)" : ""} · ${esc(item.source)} · ${esc(a.acc.name)} · ${dshort(date)}` +
          (c.savePct ? `\n💡 На подушку безопасности ${c.savePct}%: отложите ${cash(r.amount * c.savePct / 100, r.currency)}` : ""),
        ops,
      };
    }
    case "exchange": {
      if (!r.amount || !r.amount_to) return { line: "❓ Скажите, сколько отдали и сколько получили", ops: [] };
      const a = await account(r.account, r.currency);
      const b = await account(r.account_to, r.currency_to);
      const feeCur = r.fee ? r.fee_currency || r.currency : "";
      const item = {
        id: uid(), date, from: a.acc.id, out: r.amount, to: b.acc.id, in: r.amount_to, fee: r.fee, feeCur,
        feeAcc: r.fee ? (feeCur === b.acc.cur && feeCur !== a.acc.cur ? b.acc.id : a.acc.id) : "", note: r.title,
      };
      const ops = [...a.ops, ...b.ops, await add("transfers", item)];
      const k = r.amount_to / r.amount;
      let line = `🔄 ${cash(r.amount, r.currency)} (${esc(a.acc.name)}) → ${cash(r.amount_to, r.currency_to)} (${esc(b.acc.name)})`;
      if (r.currency !== r.currency_to) line += k >= 1 ? ` · курс 1 ${CUR[r.currency][0]} = ${rateText(k)} ${CUR[r.currency_to][0]}` : ` · курс 1 ${CUR[r.currency_to][0]} = ${rateText(1 / k)} ${CUR[r.currency][0]}`;
      if (r.fee) {
        // the fee is money spent, so it also goes to expenses (without an account: the exchange already took it off)
        const fr = await vndRate(feeCur, c);
        line += ` · комиссия ${cash(r.fee, feeCur)}`;
        if (fr) ops.push(await add("expenses", { id: uid(), date, cat: "Другое", amount: Math.round(r.fee * fr), note: "Комиссия за обмен" }));
      }
      return { line, ops };
    }
    case "balance": {
      const a = await account(r.account, r.currency);
      // the opening balance is shifted so that everything recorded adds up to the amount said
      const bal = balances({ ...c, accounts: [a.acc] })[0].bal;
      const op = await put("accounts", a.acc, { ...a.acc, start: (Number(a.acc.start) || 0) + r.amount - bal });
      // cancelling a new account just removes it
      return { line: `🏦 ${esc(a.acc.name)}: на счёте ${cash(r.amount, a.acc.cur)}`, ops: a.ops.length ? a.ops : [op] };
    }
    case "rate": {
      if (r.currency === "VND" || !r.amount) return { line: "❓ Скажите валюту и сколько донгов за неё дают", ops: [] };
      const rates = { ...((await section("settings")).rates ?? {}), [r.currency]: r.amount };
      // the dollar rate has always been its own setting on the site
      const op = r.currency === "USD" ? await setKey("settings", "rate", r.amount) : await setKey("settings", "rates", rates);
      return { line: `💱 Курс: 1 ${CUR[r.currency][0]} = ${rateText(r.amount)} ₫`, ops: [op] };
    }
    case "event": {
      const item = { id: uid(), date, from: r.time_from, to: r.time_to, title: r.title, type: EVT[r.event_type] ? r.event_type : "other", done: false };
      return { line: `📅 ${esc(r.title)} · ${dshort(date)}${r.time_from ? " " + r.time_from + (r.time_to ? "–" + r.time_to : "") : ""}`, ops: [await add("events", item)] };
    }
    case "note":
      return { line: `📝 ${esc(r.title)}`, ops: [await add("notes", { id: uid(), text: r.title, done: false }, true)] };
    case "health": {
      const item = { id: uid(), date, kind: HEALTH.includes(r.health_kind) ? r.health_kind : "Другое", title: r.title, cost: vnd, note: r.text };
      return { line: `🩺 ${esc(r.title)} · ${dshort(date)}${vnd ? " · " + money(vnd) + inVnd : ""}`, ops: [await add("health", item)] };
    }
    case "utility": {
      const month = isMonth(r.month) ? r.month : today().slice(0, 7);
      const k = UTIL[r.util_kind] ? r.util_kind : r.kwh ? "electricity" : "";
      if (!k) return { line: "❓ Не понял, за что счёт: свет, вода, интернет, мусор или сервис?", ops: [] };
      // only kilowatt-hours said: the bill is counted at the price from the settings
      const sum = vnd || (k === "electricity" ? Math.round(r.kwh * c.kwhPrice) : 0);
      const ex = (await items("utilities")).find((u) => u.month === month);
      const before = ex ?? { id: uid(), month, electricity: 0, water: 0, internet: 0, garbage: 0, service: 0, kwh: 0 };
      const after = { ...before, ...(sum ? { [k]: sum } : {}), ...(r.kwh ? { kwh: Math.round(r.kwh) } : {}) };
      // a month that only had this bill disappears again on cancel
      const ops = [await put("utilities", before, after, [...Object.keys(UTIL), "kwh"])];
      let line = `🔌 Коммуналка за ${mlabel(month)}: ${UTIL[k]}${sum ? " " + money(sum) + inVnd : ""}${r.kwh ? " · " + num(r.kwh) + " кВт·ч" : ""}`;
      if (!vnd && sum) line += ` (по ${money(c.kwhPrice)} за кВт·ч)`;
      if (sum) {
        ops.push(await add("expenses", { id: uid(), date, cat: "Коммуналка", amount: sum, note: `${cap(UTIL[k])} за ${mlabel(month)}` }));
        line += " · добавил в расходы";
      }
      return { line, ops };
    }
    case "apartment": {
      const item = {
        id: uid(), city: r.city, name: r.title || r.city, price: vnd, deposit: Math.round(r.deposit * rate), rooms: r.rooms || 1, area: r.area,
        view: "", from: date, to: isDate(r.date_to) ? r.date_to : "", current: r.flag, img: "apt1", note: r.text,
      };
      const ops: Op[] = [];
      // only one apartment is "where we live now"
      if (item.current) for (const a of (await items("apartments")).filter((a) => a.current)) ops.push(await put("apartments", a, { ...a, current: false }));
      ops.push(await add("apartments", item));
      return { line: `🏠 Квартира ${esc(item.name)}${item.city && item.city !== item.name ? ", " + esc(item.city) : ""}${vnd ? " · " + money(vnd) + " в месяц" : ""}${item.current ? " · живём сейчас" : ""}`, ops };
    }
    case "deposit_back": {
      // the named apartment, otherwise the current one or the latest whose deposit is still with the landlord
      const list = await items("apartments");
      const held = list.filter((a) => a.deposit && !a.depBack).sort((x, y) => (Number(y.current) - Number(x.current)) || (x.from < y.from ? 1 : -1));
      const a = r.title ? pick(list, r.title, NAME.apartments) : held[0];
      if (!a) return r.title ? miss("квартиру", r.title) : { line: "❓ Не нашёл квартиру, за которую залог ещё у хозяина", ops: [] };
      if (a.depBack) return { line: `ℹ️ Залог за ${q(esc(a.name))} уже вернули ${dshort(a.depBack)}`, ops: [] };
      // the money comes in as an income of kind deposit, in the currency it was given back in
      const cur = r.amount ? r.currency : "VND", got = r.amount || Number(a.deposit) || 0, inVndSum = r.amount ? vnd : got;
      if (!got) return { line: "❓ Скажите, сколько вернули", ops: [] };
      const acc = await account(r.account, cur);
      const inc = { id: uid(), date, amount: got, cur, rate: r.amount ? rate : 1, vnd: inVndSum, acc: acc.acc.id, source: "Возврат залога · " + a.name, kind: "deposit" };
      const ops = [...acc.ops, await add("incomes", inc), await put("apartments", a, { ...a, depBack: date, depBackSum: inVndSum, depInc: inc.id })];
      const kept = (Number(a.deposit) || 0) - inVndSum;
      return { line: `🔑 Залог за ${q(esc(a.name))} вернули: ${cash(got, cur)} · ${esc(acc.acc.name)} · ${dshort(date)}${kept > 0 ? " · удержали " + money(kept) : ""}`, ops };
    }
    case "trip": {
      const to = isDate(r.date_to) ? r.date_to : date;
      const item = {
        id: uid(), city: r.city || r.title, from: date, to, budget: vnd, img: "trip1", note: r.text,
        checklist: [{ t: "Купить билеты", d: false }, { t: "Забронировать отель", d: false }, { t: "Составить маршрут", d: false }, { t: "Оформить страховку", d: false }],
      };
      return { line: `✈️ Поездка ${esc(item.city)} · ${dshort(date)}–${dshort(to)}${vnd ? " · бюджет " + money(vnd) : ""}`, ops: [await add("trips", item)] };
    }
    case "trip_item": {
      const t = pick(await items("trips"), r.city || r.title, NAME.trips);
      if (!t) return miss("поездку", r.city || r.title);
      const after = { ...t, checklist: [...(t.checklist ?? []), { t: r.text, d: false }] };
      return { line: `☑️ В чек-лист ${esc(t.city)}: ${esc(r.text)}`, ops: [await put("trips", t, after)] };
    }
    case "meal": {
      const d = r.weekday >= 0 ? r.weekday : todayIdx(), j = Math.max(0, MEALS.indexOf(r.meal));
      const body = await section("meals");
      const before = Array.isArray(body.days) && body.days.length === 7 ? body.days : null;
      const days: Item[] = JSON.parse(JSON.stringify(before ?? DAYS.map((day) => ({ day, items: MEALS.map(() => ({ name: "", desc: "", kcal: 0 })) }))));
      days[d].items[j] = { name: r.title, desc: r.text, kcal: Math.round(r.kcal) };
      await rpc("vl_set", { p_sec: "meals", p_key: "days", p_value: days });
      return { line: `🍽 ${cap(DAYS_FULL[d])}, ${MEALS[j].toLowerCase()}: ${esc(r.title)}`, ops: [{ op: "set", sec: "meals", key: "days", value: before }] };
    }
    case "goal": {
      const usd = Math.round(vnd / c.usd);
      const item = { id: uid(), title: r.title, saved: 0, target: usd, color: "#2f9e5b", icon: "star", featured: false };
      return { line: `🎯 Цель: ${esc(r.title)} · ${dollars(usd)}${vnd ? " (" + money(vnd) + ")" : ""}`, ops: [await add("goals", item)] };
    }
    case "goal_add": {
      const g = pick(await items("goals"), r.title, NAME.goals);
      if (!g) return miss("цель", r.title);
      const usd = Math.round(vnd / c.usd);
      const saved = Number(await rpc("vl_goal_add", { p_id: g.id, p_usd: usd })) || 0;
      return { line: `🎯 +${dollars(usd)} в цель ${q(esc(g.title))} · накоплено ${dollars(saved)} из ${dollars(Number(g.target) || 0)}`, ops: [{ op: "goal", id: g.id, usd: -usd }] };
    }
    case "weight": {
      // only a plausible weight in kilograms; one weighing per day, a second one replaces it
      if (r.amount < 25 || r.amount > 300) return { line: "❓ Не расслышал вес, скажите, например: «вес 78,4»", ops: [] };
      const list = await items("weights"), ex = list.find((w) => w.date === date);
      const prev = list.filter((w) => w.date < date).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
      const item = { id: ex?.id ?? uid(), date, kg: Math.round(r.amount * 10) / 10, note: r.text || ex?.note || "" };
      const op = ex ? await put("weights", ex, item) : await add("weights", item);
      const d = prev ? item.kg - Number(prev.kg) : 0, goal = Number(c.settings.weightGoal) || 0;
      let line = `⚖️ Вес ${kg(item.kg)} · ${dshort(date)}`;
      if (prev) line += ` · ${d ? (d > 0 ? "+" : "−") + kg(Math.abs(d)) : "без изменений"} с ${dshort(prev.date)}`;
      if (goal) line += Math.abs(item.kg - goal) < 0.05 ? " · цель достигнута 🎉" : ` · до цели ${kg(Math.abs(item.kg - goal))}`;
      return { line, ops: [op] };
    }
    case "activity": {
      // calories by MET × weight × hours; the weight is the last weighing
      const min = Math.round(r.minutes || 30), w = lastWeight(c) || Number(c.profile.weight_kg) || 75;
      const met = r.met > 0 && r.met < 20 ? r.met : 4;
      const item = { id: uid(), date, title: cap(r.title || "Тренировка"), minutes: min, met, kcal: Math.round(met * w * min / 60) };
      return { line: `🏃 ${esc(item.title)} · ${min} мин · ≈ ${num(item.kcal)} ккал${c.profile.kcal ? ` · к норме сегодня +${num(Math.round(item.kcal / 2))}` : ""}`, ops: [await add("activities", item)] };
    }
    case "done": {
      if (r.section === "shopping") {
        const list = await items("shopping"), it = pick(list.filter((x) => !x.done), r.title, (x) => x.name);
        if (!it) return miss("в списке покупок", r.title);
        return { line: `✅ Куплено: ${esc(it.name)}`, ops: [await put("shopping", it, { ...it, done: true })] };
      }
      const sec = ["notes", "events", "trips"].includes(r.section) ? r.section : "";
      // a trip checklist item: find the trip, then the item in it
      if (sec === "trips" || (!sec && r.city)) {
        const t = pick(await items("trips"), r.city, NAME.trips);
        const list: Item[] = t?.checklist ?? [];
        const it = pick(list, r.title, (x) => x.t);
        if (!t || !it) return miss("пункт чек-листа", r.title);
        return { line: `✅ ${esc(t.city)}: ${esc(it.t)}`, ops: [await put("trips", t, { ...t, checklist: list.map((x) => (x === it ? { ...x, d: true } : x)) })] };
      }
      for (const s of sec ? [sec] : ["notes", "events"]) {
        const x = pick((await items(s)).filter((x) => !x.done), r.title, NAME[s]);
        if (x) return { line: `✅ ${esc(NAME[s](x))}`, ops: [await put(s, x, { ...x, done: true })] };
      }
      return miss("запись", r.title);
    }
    case "reschedule": {
      const e = pick(await items("events"), r.title, NAME.events);
      if (!e) return miss("событие", r.title);
      const after = { ...e, date: isDate(r.date) ? r.date : e.date, from: r.time_from || (isDate(r.date) ? e.from : ""), to: r.time_to || (r.time_from ? "" : e.to) };
      return { line: `🔁 ${esc(e.title)} → ${dshort(after.date)}${after.from ? " " + after.from + (after.to ? "–" + after.to : "") : ""}`, ops: [await put("events", e, after)] };
    }
    case "delete": {
      if (!SECTIONS.includes(r.section)) return { line: "❓ Не понял, что удалить", ops: [] };
      // newest first, so "the expense on coffee" is the latest one
      const list = (await items(r.section)).sort((a, b) => (String(a.date ?? "") < String(b.date ?? "") ? 1 : -1));
      const x = pick(list, r.title, NAME[r.section]);
      if (!x) return miss(SEC_NAME[r.section], r.title);
      await rpc("vl_remove", { p_sec: r.section, p_id: x.id });
      return { line: `🗑 Удалил ${SEC_NAME[r.section]} ${q(esc(NAME[r.section](x) || ""))}${r.section === "expenses" && x.amount ? " · " + money(x.amount) : ""}`, ops: [{ op: "put", sec: r.section, item: x }] };
    }
    case "useful": {
      if (!USEFUL[r.key]) return { line: "❓ Не понял, в какой раздел «Полезного» записать", ops: [] };
      const old = text((await section("useful"))[r.key]);
      return { line: `📌 ${USEFUL[r.key]}: ${esc(r.text)}`, ops: [await setKey("useful", r.key, old ? old + "\n" + r.text : r.text)] };
    }
    case "setting": {
      if (!SETTINGS[r.key]) return { line: "❓ Такой настройки нет", ops: [] };
      const value = NUM_SETTINGS.includes(r.key) ? amount(r.value.replace(/[^\d.,]/g, "")) || r.amount
        : NOTIFY[r.key] ? (/off|выкл|нет/i.test(r.value) ? "off" : hhmm(r.value) || NOTIFY[r.key])
        : r.key === "budgetAuto" ? !/нет|выкл|off|false|0/i.test(r.value)
        : r.key === "tone" ? (/вежл|без мат|культур|норм|polite/i.test(r.value) ? "polite" : "friend") : r.value;
      const ops = [await setKey("settings", r.key, value)];
      // a budget said as a sum is a fixed one
      if (r.key === "budget" && c.settings.budgetAuto) ops.push(await setKey("settings", "budgetAuto", false));
      if (r.key === "tone") return { line: value === "polite" ? "⚙️ Понял, дальше вежливо и без мата." : "⚙️ Всё, бля, теперь по-дружески 😎", ops };
      return { line: `⚙️ ${cap(SETTINGS[r.key])}: ${esc(typeof value === "number" ? num(value) : value === true ? "да" : value === false ? "нет" : value)}`, ops };
    }
  }
  return { line: "", ops: [] };
}

/* ---------- answers to questions ---------- */
const sumOf = (l: Item[], k: string) => l.reduce((s, e) => s + (Number(e[k]) || 0), 0);
async function report(r: Rec, c: Ctx): Promise<string> {
  const m = isMonth(r.month) ? r.month : today().slice(0, 7);
  if (r.section === "goals") {
    return c.goals.length
      ? "🎯 Цели:\n" + c.goals.map((g) => `• ${esc(g.title)}: ${dollars(+g.saved || 0)} из ${dollars(+g.target || 0)} (${g.target ? Math.round((+g.saved || 0) / g.target * 100) : 0}%)`).join("\n")
      : "Целей пока нет.";
  }
  if (r.section === "events") {
    const to = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
    const ev = c.events.filter((e) => e.date >= today() && e.date <= to).sort((a, b) => (a.date + a.from < b.date + b.from ? -1 : 1));
    return ev.length ? "📅 Ближайшие две недели:\n" + ev.map((e) => `• ${dshort(e.date)}${e.from ? " " + e.from : ""} — ${esc(e.title)}${e.done ? " ✅" : ""}`).join("\n") : "В ближайшие две недели событий нет.";
  }
  if (r.section === "notes") {
    const open = c.notes.filter((n) => !n.done);
    return open.length ? "📝 Надо сделать:\n" + open.map((n) => `• ${esc(n.text)}`).join("\n") : "Все заметки закрыты 🎉";
  }
  if (r.section === "expenses" && isDate(r.date)) return await dayList(c, r.date);
  const exp = c.expenses.filter((e) => String(e.date).startsWith(m));
  const spent = sumOf(exp, "amount");
  if (r.section === "money") {
    const inc = c.incomes.filter((i) => String(i.date).startsWith(m));
    const got = sumOf(inc, "vnd");
    return `💰 ${cap(mlabel(m))}: доходы <b>${money(got)}</b>, расходы <b>${money(spent)}</b>, ${got >= spent ? "плюс" : "минус"} ${money(Math.abs(got - spent))}` + await balancesText(c);
  }
  if (r.section === "weight") return weightText(c, today(), 30) || "Взвешиваний пока нет. Скажите, например: «вес 78,4».";
  if (r.section === "week") return weekReport(c, today());
  if (r.section === "month") return await monthReport(c, isMonth(r.month) ? r.month : today().slice(0, 7));
  const cats: Record<string, number> = {};
  for (const e of exp) cats[e.cat] = (cats[e.cat] || 0) + (Number(e.amount) || 0);
  let out = `💸 Расходы за ${mlabel(m)}: <b>${money(spent)}</b>` + Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `\n• ${esc(k)}: ${money(v)}`).join("");
  if (m === today().slice(0, 7)) out += `\n\nБюджет на траты ${money(c.budget)}${budgetNote(c)}, ${spent <= c.budget ? "осталось " + money(c.budget - spent) : "перерасход " + money(spent - c.budget)}`;
  return out;
}

// days from this one to the end of its month, both included
const daysLeftFrom = (day: string) => Number(addDays(addDays(day.slice(0, 7) + "-28", 4).slice(0, 7) + "-01", -1).slice(8)) - Number(day.slice(8)) + 1;
// what is left of the month's budget, said per day; empty for another month
function leftText(c: Ctx, day: string): string {
  if (day.slice(0, 7) !== today().slice(0, 7)) return "";
  const left = c.budget - sumOf(c.expenses.filter((e) => String(e.date).startsWith(day.slice(0, 7))), "amount"), n = daysLeftFrom(today());
  return left >= 0 ? `До конца месяца на траты осталось ${money(left)}: примерно ${money(left / n)} в день` : `Бюджет месяца превышен на ${money(-left)}`;
}
// where the money is heading: what is on all accounts now, and the everyday pace (without rent and trips)
// of the last 7 days carried on to the month's end; incomes still to come are not counted
const ONE_OFF = ["Аренда", "Путешествия"];
async function forecastData(c: Ctx, day = today()): Promise<{ now: number; pace: number; end: number; runOut: string }> {
  let now = 0;
  for (const { acc, bal } of balances(c)) now += bal * (await vndRate(acc.cur, c));
  // the pace window: the 7 days before today, fewer when the records are younger; only today when there is nothing earlier
  const first = c.expenses.reduce((m, e) => (e.date && e.date < m ? e.date : m), day);
  const from = first > addDays(day, -7) ? first : addDays(day, -7);
  const to = from === day ? addDays(day, 1) : day, n = Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 864e5));
  const pace = sumOf(c.expenses.filter((e) => e.date >= from && e.date < to && !ONE_OFF.includes(e.cat)), "amount") / n;
  const end = now - pace * (daysLeftFrom(day) - 1);
  return { now, pace, end, runOut: pace && end < 0 ? addDays(day, Math.max(0, Math.floor(now / pace))) : "" };
}
async function forecast(c: Ctx, day = today()): Promise<string> {
  if (!c.accounts.length) return "";
  const { now, pace, end, runOut } = await forecastData(c, day);
  if (now <= 0) return "💰 На счетах денег не осталось.";
  let out = `💰 На всех счетах сейчас ≈ ${money(now)}`;
  if (!pace) return out;
  out += `. Обычные траты (без аренды и поездок) ≈ ${money(pace)} в день: `;
  out += end >= 0 ? `при таком темпе к концу месяца останется ≈ ${money(end)}` : `при таком темпе деньги закончатся примерно ${dshort(runOut)}`;
  if (end < now * 0.1) out += `. Чтобы хватило до конца месяца, не больше ≈ ${money(now / daysLeftFrom(day))} в день`;
  return out + " (новые доходы не учтены)";
}
// one day's expenses one by one («покажи все расходы за сегодня»)
async function dayList(c: Ctx, day: string): Promise<string> {
  const list = c.expenses.filter((e) => e.date === day);
  if (!list.length) return `За ${dshort(day)} расходов не записано.`;
  const accName = (id: string) => c.accounts.find((a) => a.id === id)?.name;
  const rows = list.map((e) => `\n• ${money(+e.amount || 0)}${e.cur && e.cur !== "VND" ? ` (${cash(+e.orig || 0, e.cur)})` : ""} · ${esc(e.cat)}${e.note ? " · " + esc(e.note) : ""}${accName(e.acc) ? " · " + esc(accName(e.acc)) : ""}`).join("");
  const left = leftText(c, day);
  const fc = day === today() ? await forecast(c) : "";
  return `💸 Расходы за ${dshort(day)}: <b>${money(sumOf(list, "amount"))}</b>${rows}${left ? "\n\n" + left : ""}${fc ? "\n" + fc : ""}`;
}
// where the budget comes from and how much of it goes to the cushion, e.g. " (деньги на счетах, 20% — 9 000 000 ₫ на подушку)"
const budgetNote = (c: Ctx) => {
  const parts = [c.budgetSrc, c.savePct ? `${c.savePct}% — ${money(c.budgetGross - c.budget)} на подушку` : ""].filter(Boolean);
  return parts.length ? ` (${parts.join(", ")})` : "";
};

async function balancesText(c: Ctx): Promise<string> {
  const bals = balances(c);
  if (!bals.length) return "";
  let total = 0, out = "\n\n🏦 На счетах:";
  for (const { acc, bal } of bals) {
    const k = await vndRate(acc.cur, c);
    total += bal * k;
    out += `\n• ${esc(acc.name)}: ${cash(bal, acc.cur)}${acc.cur !== "VND" && k ? " ≈ " + money(bal * k) : ""}`;
  }
  return out + `\nВсего ≈ <b>${money(total)}</b>`;
}

// expenses between two days, inclusive, by category, biggest first
function spentIn(c: Ctx, from: string, to: string) {
  const list = c.expenses.filter((e) => e.date >= from && e.date <= to);
  const cats: Record<string, number> = {};
  for (const e of list) cats[e.cat] = (cats[e.cat] || 0) + (Number(e.amount) || 0);
  return { list, total: sumOf(list, "amount"), cats: Object.entries(cats).sort((a, b) => b[1] - a[1]) };
}
const catLines = (cats: [string, number][], n = 5) => cats.slice(0, n).map(([k, v]) => `\n• ${esc(k)}: ${money(v)}`).join("");
const change = (now: number, before: number) => (before ? ` (${now >= before ? "+" : "−"}${Math.round(Math.abs(now - before) / before * 100)}% к прошлому)` : "");

// weight now and its change over the last days; empty when nothing was recorded
function weightText(c: Ctx, day: string, days: number): string {
  const l = c.weights.filter((w) => w.date <= day);
  const last = l[l.length - 1];
  if (!last) return "";
  const base = [...l].reverse().find((w) => w.date <= addDays(day, -days));
  const goal = Number(c.settings.weightGoal) || 0;
  let out = `⚖️ Вес ${kg(Number(last.kg))} (${dshort(last.date)})`;
  if (base) { const d = Number(last.kg) - Number(base.kg); out += `, за ${days === 7 ? "неделю" : days + " дней"} ${d ? (d > 0 ? "+" : "−") + kg(Math.abs(d)) : "без изменений"}`; }
  if (goal) out += `, до цели ${kg(Math.abs(Number(last.kg) - goal))}`;
  return out;
}
// days since the last weighing, null when there are none at all
const sinceWeighed = (c: Ctx, day: string) => {
  const last = c.weights.filter((w) => w.date <= day).pop();
  return last ? Math.round((Date.parse(day) - Date.parse(last.date)) / 864e5) : null;
};
const weighNudge = (c: Ctx, day: string) => {
  const n = sinceWeighed(c, day);
  return n !== null && n > 2 ? `\n\n⚖️ Вы не взвешивались ${n} ${n % 10 === 1 && n % 100 !== 11 ? "день" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "дня" : "дней"}. Встаньте на весы и скажите мне вес, например «вес 78,4».` : "";
};

function weekReport(c: Ctx, day: string): string {
  const from = addDays(day, -6), w = spentIn(c, from, day), p = spentIn(c, addDays(from, -7), addDays(day, -7));
  const inc = sumOf(c.incomes.filter((i) => i.date >= from && i.date <= day), "vnd");
  const done = c.events.filter((e) => e.done && e.date >= from && e.date <= day).length;
  const next = c.events.filter((e) => !e.done && e.date > day && e.date <= addDays(day, 7)).sort((a, b) => (a.date + a.from < b.date + b.from ? -1 : 1));
  let out = `📊 <b>Неделя ${dshort(from)} – ${dshort(day)}</b>\n\n💸 Расходы: <b>${money(w.total)}</b>${change(w.total, p.total)}${catLines(w.cats)}`;
  if (inc) out += `\n\n💰 Доходы: ${money(inc)}`;
  const wt = weightText(c, day, 7);
  if (wt) out += `\n\n${wt}`;
  const wa = burnedOn(c, from, day);
  if (wa.length) out += `\n🏃 Тренировок: ${wa.length}, сожжено ≈ ${num(sumOf(wa, "kcal"))} ккал`;
  if (c.goals.length) out += "\n\n🎯 " + c.goals.map((g) => `${esc(g.title)} ${g.target ? Math.round((+g.saved || 0) / g.target * 100) : 0}%`).join(" · ");
  if (done) out += `\n\n✅ Сделано дел: ${done}`;
  out += next.length ? "\n\n📅 На следующей неделе:\n" + next.slice(0, 8).map((e) => `• ${dshort(e.date)}${e.from ? " " + e.from : ""} — ${esc(e.title)}`).join("\n") : "\n\n📅 На следующей неделе дел в календаре нет.";
  return out;
}

async function monthReport(c: Ctx, m: string): Promise<string> {
  const end = addDays(m + "-01", 40).slice(0, 7);
  const last = addDays(end + "-01", -1), s = spentIn(c, m + "-01", last), p = spentIn(c, prevMonth(m) + "-01", addDays(m + "-01", -1));
  const inc = c.incomes.filter((i) => String(i.date).startsWith(m)), got = sumOf(inc, "vnd");
  const util = c.utilities.find((u) => u.month === m);
  const top = [...s.list].sort((a, b) => b.amount - a.amount).slice(0, 3);
  let out = `📅 <b>Итоги: ${mlabel(m)}</b>\n\n💰 Доходы: <b>${money(got)}</b>\n💸 Расходы: <b>${money(s.total)}</b>${change(s.total, p.total)}\n${got >= s.total ? "📈 В плюсе на" : "📉 В минусе на"} ${money(Math.abs(got - s.total))}`;
  out += `\n\nБюджет на траты ${money(c.budget)}: ${s.total <= c.budget ? "уложились, осталось " + money(c.budget - s.total) : "перерасход " + money(s.total - c.budget)}`;
  if (c.savePct && got) out += `\n💡 На подушку ${c.savePct}% от доходов: ${money(got * c.savePct / 100)}`;
  if (s.cats.length) out += `\n\nПо категориям:${catLines(s.cats, 8)}`;
  if (top.length) out += "\n\nКрупнейшие траты:" + top.map((e) => `\n• ${dshort(e.date)} ${esc(e.note || e.cat)} — ${money(e.amount)}`).join("");
  if (util) out += `\n\n🔌 Коммуналка: ${money(Object.keys(UTIL).reduce((a, k) => a + (Number(util[k]) || 0), 0))}${util.kwh ? ", " + num(util.kwh) + " кВт·ч" : ""}`;
  const wt = weightText(c, last, 30);
  if (wt) out += `\n\n${wt}`;
  if (c.goals.length) out += "\n\n🎯 Цели:\n" + c.goals.map((g) => `• ${esc(g.title)}: ${dollars(+g.saved || 0)} из ${dollars(+g.target || 0)}`).join("\n");
  return out + await balancesText(c);
}

/* ---------- free questions: the AI reasons over a digest of all the data ---------- */
// everything worth knowing, compact: months as totals, this month and recent records in full
async function digest(c: Ctx): Promise<string> {
  const day = today(), m = day.slice(0, 7), months = [m];
  while (months.length < 6) months.unshift(prevMonth(months[0]));
  const byMonth = months.map((mm) => {
    const s = spentIn(c, mm + "-01", mm + "-31"), inc = sumOf(c.incomes.filter((i) => String(i.date).startsWith(mm)), "vnd");
    return `${mm}: расходы ${Math.round(s.total)} ₫ (${s.cats.map(([k, v]) => `${k} ${Math.round(v)}`).join(", ") || "нет"}); доходы ${Math.round(inc)} ₫`;
  });
  const cur = c.expenses.filter((e) => String(e.date).startsWith(m)).sort((a, b) => (a.date < b.date ? -1 : 1));
  const bals: string[] = [];
  for (const { acc, bal } of balances(c)) bals.push(`${acc.name}: ${Math.round(bal * 100) / 100} ${acc.cur} (≈ ${Math.round(bal * (await vndRate(acc.cur, c)))} ₫)`);
  const apt = c.apartments.find((a) => a.current);
  const ev = c.events.filter((e) => e.date >= addDays(day, -7) && e.date <= addDays(day, 30)).sort((a, b) => (a.date + a.from < b.date + b.from ? -1 : 1));
  return `Сегодня ${day} (${DAYS_FULL[todayIdx()]}). Бюджет на траты в этом месяце ${c.budget} ₫${budgetNote(c)}; всего ${c.budgetGross} ₫; на подушку безопасности откладывают ${c.savePct}%. Курсы: 1 $ = ${c.usd} ₫${Object.entries(c.rates).filter(([k]) => k !== "USD").map(([k, v]) => `, 1 ${k} = ${v} ₫`).join("")}.
Расходы и доходы по месяцам (₫):
${byMonth.join("\n")}
Прогноз до конца месяца (посчитан кодом): ${plain(await forecast(c)) || "нет счетов"}
Траты этого месяца по дням (₫): ${[...new Set(cur.map((e) => e.date))].map((d) => `${d}: ${Math.round(sumOf(cur.filter((e) => e.date === d), "amount"))}`).join("; ") || "нет"}
Все расходы этого месяца (дата, сумма ₫, категория, описание):
${lines(cur.map((e) => `${e.date} ${e.amount} ${e.cat} ${e.note || ""}${e.cur && e.cur !== "VND" ? ` (${e.orig} ${e.cur})` : ""}${c.accounts.find((a) => a.id === e.acc) ? ", счёт " + c.accounts.find((a) => a.id === e.acc)!.name : ""}`))}
Доходы за последние месяцы:
${lines(c.incomes.filter((i) => i.date >= months[0]).map((i) => `${i.date} ${i.amount} ${i.cur} (${i.vnd} ₫) ${i.source}`))}
Обмены валют:
${lines(c.transfers.slice(-10).map((t) => `${t.date} отдали ${t.out} → получили ${t.in}${t.fee ? ", комиссия " + t.fee + " " + t.feeCur : ""}`))}
Остатки на счетах:
${lines(bals)}
Цели (в $): ${c.goals.map((g) => `${g.title}: ${g.saved || 0} из ${g.target || 0}`).join("; ") || "нет"}
Квартира: ${apt ? `${apt.city}, ${apt.name}, аренда ${apt.price} ₫/мес, с ${apt.from}${depText(apt)}${apt.note ? ", " + apt.note : ""}` : "не указана"}
Коммуналка по месяцам: ${c.utilities.slice(-6).map((u) => `${u.month}: ${Object.keys(UTIL).reduce((a, k) => a + (Number(u[k]) || 0), 0)} ₫${u.kwh ? ", " + u.kwh + " кВт·ч" : ""}`).join("; ") || "нет"}
События (неделя назад — месяц вперёд):
${lines(ev.map((e) => `${e.date}${e.from ? " " + e.from : ""} ${e.title}${e.done ? " (сделано)" : ""}`))}
Открытые задачи: ${c.notes.filter((n) => !n.done).map((n) => n.text).join("; ") || "нет"}
Поездки: ${c.trips.map((t) => `${t.city} ${t.from}…${t.to}, бюджет ${t.budget} ₫`).join("; ") || "нет"}
Вес: ${c.weights.slice(-20).map((w) => `${w.date} ${w.kg}`).join(", ") || "нет записей"}${c.settings.weightGoal ? `; цель ${c.settings.weightGoal} кг` : ""}`;
}

const ASK_SYSTEM = `Ты личный ИИ-помощник пары, которая живёт во Вьетнаме (Нячанг), и разговариваешь с ними в Telegram. У тебя есть все данные из их планера: деньги, счета, планы, питание, вес, тренировки. Ты помнишь разговор и отвечаешь на любые вопросы и просьбы: о деньгах, планах, здоровье, еде, жизни во Вьетнаме, просто поговорить.
Отвечай по-русски, по делу и дружелюбно, как толковый друг-финансист: сначала прямой ответ, потом 2–5 коротких пунктов с цифрами и, если уместно, один конкретный совет.
Главная забота пары — чтобы деньги не закончились до конца месяца. В вопросах о деньгах делай настоящий анализ: темп трат по дням, на что уходит больше всего и как это сравнить с прошлым, хватит ли денег до конца месяца (прогноз в данных уже посчитан — опирайся на него), сколько можно тратить в день и что конкретно урезать. Делай выводы, а не пересказ цифр.
Если вопрос про актуальные вещи (цены, курсы, правила, места, новости), можешь поискать в интернете и коротко сказать, откуда сведения.
Считай аккуратно, опирайся только на данные ниже; если данных не хватает — скажи, чего именно, и что записать, чтобы ответ стал точнее. Не выдумывай записи.
На общие вопросы о жизни во Вьетнаме (визы, банки, транспорт, медицина) отвечай из своих знаний и предупреждай, если правила могли измениться.
Суммы пиши с пробелами между разрядами и знаком валюты (12 500 000 ₫). Не используй таблицы и заголовки; для выделения — только **жирный**. Не длиннее 20 строк.`;

async function ask(question: string, c: Ctx, history: Msg[] = []): Promise<string> {
  const data = await digest(c) + `\nПодключены к боту: ${c.people.map((p) => p.name + (p.chat_id === c.me ? " (пишет сейчас)" : "")).join(", ")}`;
  // the answer goes out as Telegram HTML: everything escaped, only **bold** kept
  const fmt = (s: string) => {
    const t = esc(s.trim()).replace(/^#+\s*/gm, "").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").slice(0, 3800);
    return t ? "💬 " + t : "Не получилось ответить, спросите, пожалуйста, иначе.";
  };
  // Claude reasons over the data at high effort and may look things up on the web; Groq answers from the data alone
  return fmt(await aiCall([{ role: "system", content: ASK_SYSTEM + "\n" + toneText(c) + "\n\nДанные:\n" + data }, ...history.slice(-12), { role: "user", content: question }],
    { maxTokens: 2000, temperature: 0.4, effort: "high", web: true }));
}

/* ---------- the panel: a live widget in the chat (Bot API 10.4 sendWidget) ---------- */
// what an amount typed on the panel's keypad was spent on: icon, what, category
const CHIPS: [string, string, string][] = [
  ["🛒", "Продукты", "Питание"], ["🍜", "Кафе", "Кафе и рестораны"], ["🚕", "Такси", "Транспорт"],
  ["☕", "Кофе", "Кафе и рестораны"], ["🏠", "Для дома", "Другое"], ["🏷", "Другое", "Другое"],
];
// an icon for an expense on the quick-buy buttons: by what it was, else by its category
const ICONS: [RegExp, string][] = [[/пикл|теннис|падел/i, "🏓"], [/кофе|латте|капуч/i, "☕"], [/такси|grab|грэб/i, "🚕"], [/байк|мото|бензин/i, "🛵"],
  [/вода/i, "💧"], [/бильярд/i, "🎱"], [/спорт|зал|йог/i, "💪"], [/стирк|прачеч/i, "🧺"], [/фрукт|манго|банан/i, "🍌"], [/сим|связь|интернет/i, "📶"]];
const CAT_ICON: Record<string, string> = { "Питание": "🛒", "Кафе и рестораны": "🍜", "Транспорт": "🚕", "Здоровье": "💊", "Коммуналка": "💡", "Путешествия": "✈️", "Аренда": "🏠", "Другое": "🏷" };
const iconFor = (e: Item) => ICONS.find(([re]) => re.test(String(e.note ?? "")))?.[1] ?? CAT_ICON[e.cat] ?? "🏷";
// one-tap buys: what was bought at least twice in the last 30 days for the very same sum (pickleball 100 000);
// a tap repeats the latest such expense, with its account, today
function quickBuys(c: Ctx): unknown[] {
  const since = addDays(today(), -30), groups = new Map<string, Item[]>();
  for (const e of c.expenses) {
    if (!e.note || e.date < since || e.cat === "Аренда") continue;
    const k = low(e.note) + "|" + e.amount;
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }
  return [...groups.values()].filter((g) => g.length >= 2).sort((a, b) => b.length - a.length).slice(0, 6).map((g) => {
    const e = [...g].sort((x, y) => (x.date < y.date ? 1 : -1))[0];
    return [iconFor(e), esc(cap(String(e.note)).slice(0, 14)), Math.round(+e.amount), e.id];
  });
}
// two pinned widgets, each one self-contained HTML document run by Telegram in a sandbox without network: they show the state
// they are given (chat_data) and ask the bot through TelegramWidget.request. «Финансы»: the money, the limit, the forecast;
// «Сегодня»: today's expenses, quick buys and a keypad. Sources and browser check: qa/panel_money.html, qa/panel_today.html, qa/panel_check.py
const MONEY_HTML = "<style>\n*{box-sizing:border-box;margin:0}\nbody{font:14px/1.3 system-ui,-apple-system,sans-serif;color:var(--tg-theme-text-color);padding:14px 12px 12px}\n.s{color:var(--tg-theme-hint-color);font-size:12px}\n.row{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.big{font-size:28px;font-weight:700;letter-spacing:-.5px;margin:8px 0 2px}\n.acc{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 12px}\n.acc span{background:var(--tg-theme-secondary-bg-color);border-radius:9px;padding:4px 8px;font-size:12px}\n.tiles{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}\n.tile{background:var(--tg-theme-secondary-bg-color);border-radius:12px;padding:9px 10px}\n.tile b{display:block;font-size:17px;margin-top:2px}\n.bar{height:6px;border-radius:3px;background:var(--tg-theme-secondary-bg-color);overflow:hidden;margin-top:6px}\n.bar i{display:block;height:100%;border-radius:3px;background:var(--tg-theme-button-color);transition:width .6s cubic-bezier(.2,.8,.2,1)}\n.x{color:var(--tg-theme-destructive-text-color)}\n.over i{background:var(--tg-theme-destructive-text-color)}\n.pill{border-radius:12px;padding:9px 11px;font-size:13px;margin-bottom:12px}\n.pill.g{background:rgba(52,168,83,.14)}.pill.r{background:rgba(229,57,53,.13)}\n.pill b{display:block;font-size:14px;margin-bottom:1px}\n.g b{color:#2e9d4f}.r b{color:var(--tg-theme-destructive-text-color)}\nh4{font-size:12px;font-weight:600;color:var(--tg-theme-hint-color);margin:0 0 6px}\n.cat{margin-bottom:7px;font-size:13px}\n.cat .bar{height:5px;margin-top:3px}\n</style><div id=\"app\"></div><script>\nvar A=document.getElementById(\"app\"),W=window.TelegramWidget,S={},busy=0;\nfunction n(x){x=Math.round(x||0);var a=Math.abs(x);return a>=1e6?(x/1e6).toFixed(a>=1e7?1:2).replace('.',',').replace(/,?0+$/,'')+' млн':a>=1e3?Math.round(x/1e3)+' тыс':''+x}\nfunction f(x){return Math.round(+x||0).toLocaleString('ru-RU')}\nfunction R(){var s=S,h='';if(s.mo==null){A.innerHTML='<div class=s>Данных пока нет</div>';return}\nvar top=(s.c&&s.c[0]&&s.c[0][1])||1,used=s.b>0?Math.min(100,s.ms/s.b*100):100;\nh+='<div class=row><b>Финансы · '+s.mo+'</b><span class=s style=\"font-size:19px\" onclick=\"ref()\">'+(busy?'…':'⟳')+'</span></div>';\nh+='<div class=s style=\"margin-top:8px\">На всех счетах</div><div class=big style=\"margin-top:0\">'+n(s.m)+' ₫</div>';\nh+='<div class=acc>'+(s.a||[]).map(function(a){return'<span>'+a[0]+' <b>'+(a[1]=='₫'?n(a[2]):f(a[2]))+'</b> '+a[1]+'</span>'}).join('')+'</div>';\nh+='<div class=tiles><div class=tile><span class=s>Можно в день</span><b'+(s.l>0?'':' class=x')+'>'+(s.l>0?n(s.l)+' ₫':'0 ₫')+'</b><span class=s>ещё '+s.dl+' дн.</span></div>';\nh+='<div class=tile><span class=s>За месяц</span><b>'+n(s.ms)+' ₫</b><span class=s>из '+n(s.b)+' ₫</span><div class=\"bar'+(s.ms>s.b?' over':'')+'\"><i style=\"width:'+used+'%\"></i></div></div></div>';\nh+=s.z?'<div class=\"pill r\"><b>Деньги кончатся ~'+s.z+'</b>если тратить '+n(s.p)+' ₫ в день, как сейчас</div>':'<div class=\"pill g\"><b>До конца месяца хватит</b>останется ~'+n(s.r)+' ₫ при нынешнем темпе</div>';\nif(s.c&&s.c.length)h+='<h4>На что уходит в этом месяце</h4>'+s.c.map(function(c){return'<div class=cat><div class=row><span>'+c[0]+'</span><b>'+n(c[1])+' ₫</b></div><div class=bar><i style=\"width:'+Math.round(c[1]/top*100)+'%\"></i></div></div>'}).join('');\nA.innerHTML=h}\nfunction ref(){if(busy||!W)return;var r=W.request('o');busy=1;R();r.then(function(a){busy=0;try{if(a.result)S=JSON.parse(a.result)}catch(e){}R()},function(){busy=0;R()})}\nfunction load(){try{S=JSON.parse(W&&W.chatData||'{}')}catch(e){}R()}\nif(W){W.onEvent('chatDataChanged',load);if(W.ready)W.ready()}load();\n</script>";
const TODAY_HTML = "<style>\n*{box-sizing:border-box;margin:0}\nbody{font:14px/1.3 system-ui,-apple-system,sans-serif;color:var(--tg-theme-text-color);padding:14px 12px 12px}\n.s{color:var(--tg-theme-hint-color);font-size:12px}\n.row{display:flex;align-items:center;gap:10px}\n.sp{justify-content:space-between}\n.hero{margin:8px 0 10px}\n.big{font-size:28px;font-weight:700;letter-spacing:-.5px}\n.bar{height:6px;border-radius:3px;background:var(--tg-theme-secondary-bg-color);overflow:hidden;margin:6px 0 2px}\n.bar i{display:block;height:100%;border-radius:3px;background:var(--tg-theme-button-color);transition:width .6s cubic-bezier(.2,.8,.2,1)}\n.over i{background:var(--tg-theme-destructive-text-color)}\n.x{color:var(--tg-theme-destructive-text-color)}\n.list{margin:6px 0 12px}\n.it{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--tg-theme-secondary-bg-color);font-size:13px}\n.it:last-child{border-bottom:0}\n.it i{font-style:normal;font-size:17px;width:22px;text-align:center}\n.it .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.it button{padding:4px 9px;font-size:12px}\nh4{font-size:12px;font-weight:600;color:var(--tg-theme-hint-color);margin:0 0 6px}\n.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:6px}\nbutton{border:0;font:inherit;color:inherit;background:var(--tg-theme-secondary-bg-color);border-radius:12px;padding:9px 6px;transition:transform .12s,opacity .12s}\nbutton:active{transform:scale(.95);opacity:.8}\n.qb{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:13px}\n.qb i{font-style:normal;font-size:20px}\n.main{width:100%;margin-top:8px;background:var(--tg-theme-button-color);color:var(--tg-theme-button-text-color);font-weight:600;padding:11px}\n.main:disabled{opacity:.45}\n.del{background:var(--tg-theme-destructive-text-color)!important;color:#fff}\n.amt{font-size:32px;font-weight:700;text-align:center;margin:6px 0 10px;letter-spacing:-.5px}\n.ch{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}\n.ch button,.seg button{font-size:12px;padding:7px 4px}\n.on{background:var(--tg-theme-button-color)!important;color:var(--tg-theme-button-text-color)}\n.seg{display:flex;gap:6px;margin-bottom:8px}.seg button{flex:1}\n.kp{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}\n.kp button{font-size:19px;padding:9px 0}\n.toast{margin-top:10px;border-radius:12px;padding:8px 10px;background:var(--tg-theme-secondary-bg-color);font-size:13px}\n.toast u{color:var(--tg-theme-link-color);text-decoration:none;font-weight:600}\n</style><div id=\"app\"></div><script>\nvar A=document.getElementById(\"app\"),W=window.TelegramWidget,C=__CHIPS__,S={},v=0,num='',ci=0,card=0,dl='',msg='',busy=0,tm;\nfunction n(x){x=Math.round(x||0);var a=Math.abs(x);return a>=1e6?(x/1e6).toFixed(a>=1e7?1:2).replace('.',',').replace(/,?0+$/,'')+' млн':a>=1e3?Math.round(x/1e3)+' тыс':''+x}\nfunction f(x){return Math.round(+x||0).toLocaleString('ru-RU')}\nfunction R(){var s=S,h='';if(s.d==null){A.innerHTML='<div class=s>Данных пока нет</div>';return}\nh+='<div class=\"row sp\"><b>Сегодня, '+s.d+'</b><span class=s style=\"font-size:19px\" onclick=\"ask(\\'r\\')\">⟳</span></div>';\nif(!v){var o=s.l<=0||s.t>s.l,p=s.l>0?Math.min(100,s.t/s.l*100):100;\nh+='<div class=hero><div class=big>'+f(s.t)+' ₫</div><div class=\"bar'+(o?' over':'')+'\"><i style=\"width:'+p+'%\"></i></div><div class=s>'+(s.l>0?(s.t>s.l?'<span class=x>на '+n(s.t-s.l)+' больше лимита</span> '+n(s.l)+' ₫':'можно ещё '+n(s.l-s.t)+' ₫ из '+n(s.l)+' ₫'):'<span class=x>бюджет месяца превышен</span>')+'</div></div>';\nvar e=s.e||[];h+='<h4>Траты за день'+(s.more?' · ещё '+s.more+' выше':'')+'</h4><div class=list>'+(e.length?e.map(function(x){return'<div class=it><i>'+x[0]+'</i><span class=nm>'+x[1]+'<span class=s> · '+x[3]+'</span></span>'+\n(dl==x[4]?'<button class=del onclick=\"dl=\\'\\';ask(\\'d:'+x[4]+'\\')\">Удалить</button><button onclick=\"dl=\\'\\';R()\">Нет</button>':'<b onclick=\"dl=\\''+x[4]+'\\';R()\">'+f(x[2])+'</b>')+'</div>'}).join(''):'<div class=s>Пока ничего не записано</div>')+'</div>';\nvar q=s.q||[];if(q.length)h+='<h4>Быстрая покупка</h4><div class=grid>'+q.map(function(b){return'<button class=qb onclick=\"ask(\\'b:'+b[3]+'\\')\"><i>'+b[0]+'</i>'+b[1]+'<span class=s>'+n(b[2])+'</span></button>'}).join('')+'</div>';\nh+='<button class=main onclick=\"v=1;num=\\'\\';R()\">＋ Записать трату</button>'}\nelse{h+='<div class=amt>'+(num?f(num):'0')+' ₫</div><div class=ch>'+C.map(function(c,i){return'<button class=\"'+(i==ci?'on':'')+'\" onclick=\"ci='+i+';R()\">'+c[0]+' '+c[1]+'</button>'}).join('')+'</div>';\nh+='<div class=seg><button class=\"'+(card?'':'on')+'\" onclick=\"card=0;R()\">Наличные</button><button class=\"'+(card?'on':'')+'\" onclick=\"card=1;R()\">Карта</button></div><div class=kp>'+\n[1,2,3,4,5,6,7,8,9,'000',0,'⌫'].map(function(k){return'<button onclick=\"key(\\''+k+'\\')\">'+k+'</button>'}).join('')+'</div>';\nh+='<div class=row style=\"margin-top:8px\"><button style=\"flex:1\" onclick=\"v=0;R()\">Отмена</button><button class=main style=\"flex:2;margin:0\" '+(+num?'':'disabled')+' onclick=\"go()\">Записать</button></div>'}\nif(msg)h+='<div class=toast>'+msg+(s.u&&!busy?' · <u onclick=\"undo()\">отменить</u>':'')+'</div>';\nA.innerHTML=h}\nfunction key(k){if(k=='⌫')num=num.slice(0,-1);else if(num.length<10&&(num||k!='0'&&k!='000'))num+=k;R()}\nfunction ask(d){if(busy||!W)return;var r=W.request(d);busy=1;msg='Секунду…';R();\nr.then(function(a){busy=0;msg='';if(a.result)try{var o=JSON.parse(a.result);if(o.err)msg=o.err;else{S=o;msg=o.ok||''}}catch(e){}R();clearTimeout(tm);if(msg)tm=setTimeout(function(){msg='';R()},7000)},\nfunction(e){busy=0;msg=e&&e.code=='RATE_LIMITED'?'Слишком часто, подожди секунду':'Не получилось, попробуй ещё раз';R()})}\nfunction go(){v=0;ask('k:'+ci+':'+(+num)+':'+(card?'k':'c'))}\nfunction undo(){var u=S.u;S.u=0;ask('u:'+u)}\nfunction load(){try{var o=JSON.parse(W&&W.chatData||'{}');o.u=S.u;S=o}catch(e){}R()}\nif(W){W.onEvent('chatDataChanged',load);if(W.ready)W.ready()}load();\n</script>";
const PANEL_RE = /^\/panel\b|^(открой |покажи )?(панель|виджет|дашборд)\s*$/i;
// what the panels show, as compact JSON within the 1024-byte limit of a widget's state
const bytes = (x: string) => new TextEncoder().encode(x).length;
const dailyLimit = (c: Ctx, day: string) => Math.round((c.budget - sumOf(c.expenses.filter((e) => String(e.date).startsWith(day.slice(0, 7))), "amount")) / daysLeftFrom(day));
async function moneyState(c: Ctx): Promise<string> {
  const day = today(), m = day.slice(0, 7), fd = await forecastData(c, day);
  const s: Item = {
    mo: MONTHS[+m.slice(5) - 1], m: Math.round(fd.now), l: dailyLimit(c, day), dl: daysLeftFrom(day),
    ms: Math.round(sumOf(c.expenses.filter((e) => String(e.date).startsWith(m)), "amount")), b: Math.round(c.budget),
    p: Math.round(fd.pace), r: Math.round(fd.end), z: fd.runOut ? dshort(fd.runOut) : "",
    a: balances(c).map(({ acc, bal }) => [esc(String(acc.name).slice(0, 16)), (CUR[acc.cur] ?? CUR.VND)[0], Math.round(bal * 100) / 100]),
    c: spentIn(c, m + "-01", day).cats.slice(0, 3).map(([k, v]) => [esc(k), Math.round(v)]),
  };
  let out = JSON.stringify(s);
  while (bytes(out) > 1024 && (s.c.length || s.a.length)) { (s.c.length ? s.c : s.a).pop(); out = JSON.stringify(s); }
  return out;
}
async function todayState(c: Ctx, extra: Item = {}): Promise<string> {
  const day = today(), list = c.expenses.filter((e) => e.date === day);
  const accName = (id: string) => esc(String(c.accounts.find((a) => a.id === id)?.name ?? "").slice(0, 10));
  // the newest 6 fit the bubble's 600 px; the earlier ones are only counted
  const s: Item = {
    d: dshort(day), t: Math.round(sumOf(list, "amount")), l: dailyLimit(c, day),
    e: list.slice(-6).map((e) => [iconFor(e), esc(cap(String(e.note || e.cat)).slice(0, 18)), Math.round(+e.amount), accName(e.acc), e.id]),
    more: Math.max(0, list.length - 6), q: quickBuys(c), ...extra,
  };
  let out = JSON.stringify(s);
  while (bytes(out) > 1024 && (s.q.length || s.e.length)) { (s.q.length ? s.q : s.e).shift(); s.more = list.length - s.e.length; out = JSON.stringify(s); }
  return out;
}
// the webhook has to ask Telegram for widget queries as well; checked once per worker, when a panel is opened
let widgetHook = false;
async function ensureWidgetUpdates() {
  if (widgetHook) return;
  const info = await tg("getWebhookInfo", {});
  const had: string[] = info?.result?.allowed_updates ?? [];
  if (info?.result?.url && !had.includes("widget_query")) {
    await tg("setWebhook", {
      url: info.result.url, secret_token: await secret("telegram_webhook_secret"),
      allowed_updates: [...new Set([...(had.length ? had : ["message", "callback_query"]), "widget_query"])],
    });
  }
  await tg("setMyCommands", { commands: [{ command: "panel", description: "Панель: бюджет на сегодня и быстрые траты" }] });
  widgetHook = true;
}
// the two panels, pinned so that they stay at the top of the chat; their messages are remembered to keep them up to date
async function sendPanel(chat: number, c: Ctx): Promise<string> {
  await ensureWidgetUpdates();
  const ids: Item = {};
  for (const [k, html, state] of [["o", MONEY_HTML, await moneyState(c)], ["t", TODAY_HTML.replace("__CHIPS__", JSON.stringify(CHIPS.map(([i, t]) => [i, t]))), await todayState(c)]]) {
    const r = await tg("sendWidget", { chat_id: chat, html, chat_data: state, allow_queries: true });
    if (!r?.ok) {
      console.error("sendWidget", r);
      return "Не получилось открыть панель: " + esc(r?.description ?? "Telegram не ответил") + ". Если Telegram давно не обновлялся, обновите приложение.";
    }
    ids[k] = r.result.message_id;
  }
  // the earlier panels (and any other pins of this chat) give way to the new pair; «Сегодня» is pinned last, so it shows on top
  await tg("unpinAllChatMessages", { chat_id: chat });
  for (const k of ["o", "t"]) await tg("pinChatMessage", { chat_id: chat, message_id: ids[k], disable_notification: true });
  await db.from("vl_bot_chat").upsert({ chat_id: chat, panels: ids });
  return "";
}
// every chat's two panels get the new numbers; the edits are silent
async function refreshPanels() {
  const { data } = await db.from("vl_bot_chat").select("chat_id, panels");
  const chats = (data ?? []).filter((r: Item) => r.panels?.o || r.panels?.t);
  if (!chats.length) return;
  const c = await context();
  const o = await moneyState(c), t = await todayState(c);
  for (const r of chats) {
    if (r.panels.o) await tg("editMessageWidgetData", { chat_id: r.chat_id, message_id: r.panels.o, chat_data: o });
    if (r.panels.t) await tg("editMessageWidgetData", { chat_id: r.chat_id, message_id: r.panels.t, chat_data: t });
  }
}
// a tap in a panel: «o» refresh «Финансы»; in «Сегодня» «r» refresh, «b:<expense id>» buy that again,
// «k:<chip>:<sum>:<c|k>» a typed sum in cash or by card, «d:<expense id>» delete it, «u:<id>» undo the last of these
async function widgetQuery(q: Item) {
  const chat = q.from?.id;
  const reply = (data: string) => tg("answerWidgetQuery", { widget_query_id: q.id, data });
  const { data: link } = await db.from("vl_tg_links").select("email").eq("chat_id", chat).maybeSingle();
  if (!link) return reply(JSON.stringify({ err: "Бот не подключён к сайту" }));
  const [cmd, a, b, how] = String(q.data ?? "").split(":");
  let c = await context();
  if (cmd === "o") return reply(await moneyState(c));
  let extra: Item = {}, changed = false;
  const done = async (ops: Op[], ok: string) => {
    const { data: row } = await db.from("vl_bot_undo").insert({ chat_id: chat, ops }).select("id").single();
    extra = { ok, u: row?.id ?? 0 };
    changed = true;
  };
  if (cmd === "b" && a) {
    // the same expense again, today: same sum, category, account and currency
    const e = c.expenses.find((x) => x.id === a);
    if (!e) extra = { err: "Эта трата уже удалена, обнови панель" };
    else {
      const item = { ...e, id: uid(), date: today() };
      await done([await add("expenses", item)], `${iconFor(e)} ${esc(cap(String(e.note)))} ${money(+e.amount)} — записал`);
    }
  } else if (cmd === "d" && a) {
    const e = c.expenses.find((x) => x.id === a);
    if (!e) extra = { err: "Эта трата уже удалена" };
    else {
      await rpc("vl_remove", { p_sec: "expenses", p_id: e.id });
      await done([{ op: "put", sec: "expenses", item: e }], `Удалил: ${esc(cap(String(e.note || e.cat)))} ${money(+e.amount)}`);
    }
  } else if (cmd === "k" && CHIPS[+a] && +b > 0 && +b < 1e10) {
    const [icon, what, cat] = CHIPS[+a];
    const r = normalize({ records: [{ kind: "expense", amount: Math.round(+b), currency: "VND", category: cat, title: what, account: how === "k" ? "карта" : "" }] }).records[0];
    const d = await apply(r, c);
    if (d.ops.length) await done(d.ops, `${icon} ${what} ${money(+b)}${how === "k" ? " с карты" : ""} — записал`);
    else extra = { err: "Не записалось: " + plain(d.line) };
  } else if (cmd === "u" && a) {
    const { data: row } = await db.from("vl_bot_undo").select("ops").eq("id", a).eq("chat_id", chat).maybeSingle();
    if (row) {
      await revert(row.ops as Op[]);
      await db.from("vl_bot_undo").delete().eq("id", a);
      extra = { ok: "Отменил" };
      changed = true;
    }
  }
  if (changed) c = await context();
  await reply(await todayState(c, extra));
  // «Финансы» and the other person's panels follow
  if (changed) await refreshPanels();
}

/* ---------- how the bot talks: a best friend with mat and teasing, or polite (settings.tone) ---------- */
const TONE_FRIEND = `Стиль: ты их лучший друг, а не вежливый ассистент. На «ты», живым разговорным языком, с матом и подъёбками («бля», «ну ёпт», «заебал», «охренеть»), угарно и коротко. Подкалывай за лишние и повторяющиеся траты и прямо говори, чем это кончится («бля, опять кофе, так и до 20-го бабки не дотянут»), но по-доброму: ты на их стороне и хочешь, чтобы деньги не кончились. Не повторяй одни и те же шутки и обороты. Настоящих оскорблений нет: не про внешность, пол, национальность, здоровье. Цифры и даты называй точно — шутка не повод врать.`;
const TONE_POLITE = `Стиль: дружелюбно и вежливо, на «вы», без мата.`;
const toneText = (c: Ctx) => (c.settings.tone === "polite" ? TONE_POLITE : TONE_FRIEND);

/* ---------- a tip after every recorded expense ---------- */
const TIP_SYSTEM = `Ты финансовый помощник семьи, которая живёт во Вьетнаме (Нячанг). После каждой новой траты давай один короткий комментарий с практичным советом: 1–3 предложения, не длиннее 300 символов.
Если эту же штуку берут часто (в данных есть, сколько раз за неделю), отметь это и скажи, во что привычка выльется за месяц. Если при текущем темпе деньги кончатся раньше конца месяца, назови дату.
Опирайся на цифры ниже: темп трат, остаток бюджета на день, сравнение категории с прошлым месяцем. Если трата разумная и в бюджет укладывается, скажи это одной фразой и подскажи, как во Вьетнаме тратить на такое меньше (рынки вместо супермаркетов, Grab Bike вместо такси, местная еда, торг и т. п.). Если тратят быстрее, чем позволяет бюджет, предупреди и назови сумму на день.
Даже если трат несколько, дай один общий комментарий на всё сообщение, одним абзацем. Не читай нотаций, не повторяй сумму самой траты, без приветствий, эмодзи и markdown. Суммы пиши с пробелами между разрядами и знаком ₫.`;
// one short tip from the AI with this month's numbers; without the AI, or when it is busy, a plain line about what is left per day
async function expenseTip(ids: string[], c: Ctx): Promise<string> {
  const all = await items("expenses");
  const added = all.filter((e) => ids.includes(e.id));
  if (!added.length) return "";
  const day = today(), m = day.slice(0, 7), pm = prevMonth(m);
  const now = spentIn({ ...c, expenses: all }, m + "-01", day);
  const before = spentIn({ ...c, expenses: all }, pm + "-01", pm + day.slice(7));
  const daysLeft = daysLeftFrom(day);
  const left = c.budget - now.total;
  const simple = left >= 0
    ? `💡 ${leftText({ ...c, expenses: all }, day)}`
    : `💡 Бюджет месяца уже превышен на ${money(-left)}: необязательные траты лучше отложить до следующего месяца`;
  const catOf = (x: { cats: [string, number][] }, k: string) => x.cats.find(([n]) => n === k)?.[1] ?? 0;
  const facts = [
    `Только что записали: ${added.map((e) => `${e.amount} ₫, ${e.cat}${e.note ? ", " + e.note : ""}`).join("; ")}`,
    `Сегодня ${day}, до конца месяца ${daysLeft} дн. (включая сегодня)`,
    `Бюджет на траты в этом месяце ${c.budget} ₫, уже потрачено ${now.total} ₫, ` + (left >= 0 ? `осталось ${left} ₫ — это ${Math.round(left / daysLeft)} ₫ в день` : `бюджет превышен на ${-left} ₫`),
    ...[...new Set(added.map((e) => String(e.cat)))].map((k) => `${k}: в этом месяце ${catOf(now, k)} ₫, за те же дни прошлого месяца ${catOf(before, k)} ₫`),
    ...[...new Set(added.map((e) => low(e.note)).filter(Boolean))].map((n) => {
      const week = all.filter((e) => low(e.note) === n && e.date > addDays(day, -7) && e.date <= day);
      const sum = sumOf(week, "amount");
      return week.length > 1 ? `«${n}» за последние 7 дней: ${week.length} раз, ${Math.round(sum)} ₫; если так каждый день — ≈ ${Math.round(sum / 7 * 30)} ₫ в месяц` : "";
    }),
    c.savePct ? `На подушку безопасности откладывают ${c.savePct}% (уже вычтено из бюджета)` : "",
    plain(await forecast({ ...c, expenses: all })),
  ].filter(Boolean).join("\n");
  try {
    const t = (await aiCall([{ role: "system", content: TIP_SYSTEM + "\n" + toneText(c) }, { role: "user", content: facts }], { maxTokens: 900, temperature: 0.6, noWait: true, effort: "low" }))
      .replace(/\*\*|^#+\s*/gm, "").trim();
    // the free models sometimes repeat the tip for every expense: only the first paragraph, at most three sentences
    const first = (t.split("\n").map((l) => l.trim()).find(Boolean) ?? "").match(/[^.!?]+[.!?]*/g)?.slice(0, 3).join("").trim() ?? "";
    if (first) return "💡 " + esc(first).slice(0, 400);
  } catch (e) { console.error(e); }
  return simple;
}

/* ---------- nutrition coach: interview, daily norm, weekly menu, shopping list, recipes ---------- */
type Msg = { role: string; content: string };
// one answer from Groq (the free fallback). Each model has its own free per-minute quota, so on a rate limit or an error the next one is tried;
// when all of them are busy the bot waits the few seconds Groq asks for and goes round once more
async function groqCall(messages: Msg[], opt: { json?: boolean; maxTokens?: number; temperature?: number; noWait?: boolean } = {}): Promise<string> {
  const key = await secret("groq_api_key");
  if (!key) throw new Error("NO_AI_KEY");
  await groqModel(PREFER_LLM, "llm");
  const models = PREFER_LLM.filter((m) => groqModels!.includes(m));
  let last = "";
  for (let round = 0; round < 2; round++) {
    let wait = 0;
    for (const model of models.length ? models : PREFER_LLM.slice(0, 1)) {
      const r = await fetch(`${GROQ}/chat/completions`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          model, temperature: opt.temperature ?? 0.3, max_tokens: opt.maxTokens ?? 3000, messages,
          ...(opt.json ? { response_format: { type: "json_object" } } : {}),
          // the reasoning models think before answering, which helps with arithmetic and with long menus
          ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: opt.json ? "low" : "medium" } : {}),
        }),
      });
      const j = await r.json().catch(() => ({}));
      const content = j.choices?.[0]?.message?.content;
      if (r.ok && content) {
        if (!opt.json) return String(content);
        try { JSON.parse(content); return String(content); } catch { last = "bad json"; continue; }
      }
      last = j.error?.message ?? String(r.status);
      const m = /try again in ([\d.]+)s/.exec(last);
      if (m) wait = Math.max(wait, Math.min(20, Number(m[1])));
    }
    // a tip is not worth holding the reply for: noWait gives up instead of waiting
    if (!wait || opt.noWait || timeLeft() < wait * 1000 + 15_000) break;
    await new Promise((ok) => setTimeout(ok, wait * 1000 + 300));
  }
  throw new Error("Groq: " + last);
}

// one row per chat: the last turns of the conversation (convo) and, during the nutrition interview, its own history
async function chatState(chat: number): Promise<Item | null> {
  const { data } = await db.from("vl_bot_chat").select("mode, history, convo, updated_at").eq("chat_id", chat).maybeSingle();
  // an interview nobody answered for a day is over; a conversation older than a day starts afresh
  if (data && Date.now() - Date.parse(data.updated_at) > 864e5) return { mode: "chat", history: [], convo: [] };
  return data;
}
async function setChat(chat: number, st: Item | null) {
  await db.from("vl_bot_chat").upsert({ chat_id: chat, ...(st ?? { mode: "chat", history: [] }), updated_at: new Date().toISOString() });
}
const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
async function remember(chat: number, user: string, bot: string) {
  const st = await chatState(chat);
  const convo = [...(st?.convo ?? []), { role: "user", content: user.slice(0, 1500) }, { role: "assistant", content: plain(bot).slice(0, 1500) }].slice(-12);
  await db.from("vl_bot_chat").upsert({ chat_id: chat, convo, updated_at: new Date().toISOString() });
}
// the people linked to the bot by their Telegram first names, looked up once when missing
async function people(): Promise<{ chat_id: number; name: string }[]> {
  const { data } = await db.from("vl_tg_links").select("chat_id, name");
  const out: { chat_id: number; name: string }[] = [];
  for (const l of data ?? []) {
    let name = text_(l.name);
    if (!name) {
      const g = await tg("getChat", { chat_id: l.chat_id });
      name = text_(g.result?.first_name || g.result?.username);
      if (name) await db.from("vl_tg_links").update({ name }).eq("chat_id", l.chat_id);
    }
    out.push({ chat_id: l.chat_id, name: name || "без имени" });
  }
  return out;
}
// a message to another linked person: what was said, the shopping list, today's menu or the bot's previous answer
async function sendTo(r: Rec, chat: number, c: Ctx, history: Msg[]): Promise<string> {
  const others = c.people.filter((p) => p.chat_id !== chat);
  // with two people in the bot the other one is meant even when the name is said differently ("Насте" for "Анастасия")
  const to = pick(others, r.to, (p) => p.name) ?? (others.length === 1 ? others[0] : undefined);
  if (!to) return others.length ? `❓ Кому отправить? Подключены: ${others.map((p) => esc(p.name)).join(", ")}` : "❓ К боту пока подключён только этот чат. Пусть второй человек откроет ссылку «Подключить Telegram» с сайта.";
  const lastBot = [...history].reverse().find((x) => x.role === "assistant")?.content ?? "";
  const body = r.section === "shopping" ? shoppingText(c.shopping)
    : r.section === "menu" ? (menuLine(c, today()).trim() || "Меню на сегодня пока нет.")
    : r.text ? esc(r.text) : esc(lastBot);
  if (!body.trim()) return "❓ Что передать?";
  const me = c.people.find((p) => p.chat_id === chat)?.name;
  await say(to.chat_id, `💬 <b>${esc(me || "Сообщение")}</b> через бота:\n\n${body}`);
  const what = r.text ? `«${esc(r.text)}»` : r.section === "shopping" ? "список покупок" : r.section === "menu" ? "меню на сегодня" : "мой ответ";
  return `📨 Отправлено → ${esc(to.name)}: ${what}`;
}
const lastWeight = (c: Ctx) => Number(c.weights[c.weights.length - 1]?.kg) || 0;

// daily norm by Mifflin–St Jeor, with a deficit (or surplus) for the goal; protein first, then fat, carbs fill the rest
const ACTIVITY: Record<string, [number, string]> = { sedentary: [1.2, "сидячий образ жизни"], light: [1.375, "немного движения"], moderate: [1.55, "активный день"], high: [1.725, "очень активный"] };
function targets(p: Item, weight: number) {
  const w = weight || Number(p.weight_kg) || 75, h = Number(p.height_cm) || 175, a = Number(p.age) || 30, goal = Number(p.goal_kg) || 0;
  const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === "f" ? -161 : 5);
  const tdee = bmr * (ACTIVITY[p.activity]?.[0] ?? 1.375);
  const lose = goal && goal < w - 0.5, gain = goal && goal > w + 0.5;
  const kcal = Math.round(Math.max(lose ? tdee * 0.8 : gain ? tdee * 1.1 : tdee, p.sex === "f" ? 1200 : 1500) / 10) * 10;
  const protein = Math.round((lose ? 2 : 1.6) * (lose ? Math.max(goal, w * 0.85) : w));
  const fat = Math.round(kcal * 0.28 / 9), carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const perWeek = Math.round(Math.abs(tdee - kcal) * 7 / 7700 * 10) / 10;
  return { kcal, protein, fat, carbs, bmr: Math.round(bmr), tdee: Math.round(tdee), perWeek, weeks: perWeek ? Math.ceil(Math.abs(w - goal) / perWeek) : 0 };
}
const targetsText = (t: Item, p: Item) =>
  `🎯 Расчёт: базовый обмен ~${num(t.bmr)} ккал, с твоей активностью ~${num(t.tdee)} ккал.\n` +
  `Для цели — <b>${num(t.kcal)} ккал в день</b>: белки ${t.protein} г, жиры ${t.fat} г, углеводы ${t.carbs} г.` +
  (t.perWeek && p.goal_kg ? `\nЭто около ${num(t.perWeek, 1)} кг в неделю, до ${p.goal_kg} кг — примерно ${t.weeks} нед.` : "") +
  `\nНа тренировки добавляю половину сожжённых калорий — рассказывай, что делал.`;

const PROFILE_KEYS = ["sex", "age", "height_cm", "weight_kg", "goal_kg", "goal_text", "activity", "workouts", "exclude", "likes", "people", "meals_per_day", "cook_minutes", "food_budget_vnd", "equipment"];
const COACH_PROMPT = (p: Item, w: number) => `Ты внимательный нутрициолог и тренер. Человек живёт в Нячанге (Вьетнам). Ты знакомишься с ним, чтобы составить питание под его цель.
Узнай по очереди, по одному-два вопроса за сообщение, коротко, дружелюбно, на «ты»:
пол, возраст, рост; ${w ? `текущий вес уже известен — ${w} кг, не спрашивай` : "текущий вес"}; цель (сколько кг и к какому сроку, или просто питаться правильно);
обычная активность в день (сидячая работа, сколько ходит); тренировки — какие и сколько раз в неделю; что не ест, аллергии, ограничения; любимые продукты;
на сколько человек готовить; сколько раз в день удобно есть; сколько минут в день готов готовить; бюджет на продукты в неделю в донгах; что есть на кухне (плита, духовка, блендер, мультиварка).
Уже известно: ${JSON.stringify(p)}.
Ответь JSON: {"reply": "что сказать человеку", "profile": {только новые или уточнённые поля из: sex ("m" или "f"), age, height_cm, weight_kg, goal_kg, goal_text, activity ("sedentary" | "light" | "moderate" | "high"), workouts, exclude, likes, people, meals_per_day, cook_minutes, food_budget_vnd, equipment}, "done": true или false}.
done = true, когда известно главное: пол, возраст, рост, вес, цель, активность и ограничения в еде; тогда в reply коротко подведи итог, без цифр калорий (их посчитает бот), и больше ничего не спрашивай.
Если человек просит закончить или отвлекается на другое — done = true.`;

async function coachTurn(chat: number, text: string, c: Ctx, st: Item | null): Promise<string> {
  if (/^(стоп|хватит|выход|отмена|потом)\b/i.test(text.trim())) {
    await setChat(chat, null);
    return "Хорошо, остановились. Продолжим, когда скажешь «хочу похудеть».";
  }
  const w = lastWeight(c);
  const history: Msg[] = (st?.history ?? []).slice(-14);
  const out = await aiJSON([{ role: "system", content: COACH_PROMPT(c.profile, w) + "\n" + toneText(c) }, ...history, { role: "user", content: text }], 1500);
  const profile: Item = { ...c.profile };
  for (const k of PROFILE_KEYS) if (out.profile?.[k] != null && out.profile[k] !== "") profile[k] = out.profile[k];
  if (w) profile.weight_kg = w;
  const reply = esc(text_(out.reply) || "Расскажи немного о себе: пол, возраст и рост?");
  if (out.done) {
    const t = targets(profile, w);
    for (const [k, v] of Object.entries({ ...profile, ...t, updated: today() })) await rpc("vl_set", { p_sec: "profile", p_key: k, p_value: v });
    // the goal weight also goes to the fitness page
    if (profile.goal_kg) await rpc("vl_set", { p_sec: "settings", p_key: "weightGoal", p_value: Number(profile.goal_kg) });
    await setChat(chat, null);
    return `${reply}\n\n${targetsText(t, profile)}\n\nСкажи «составь меню на неделю» — распишу питание на 7 дней, список покупок с ценами и рецепты.`;
  }
  for (const [k, v] of Object.entries(profile)) await rpc("vl_set", { p_sec: "profile", p_key: k, p_value: v });
  await setChat(chat, { mode: "coach", history: [...history, { role: "user", content: text }, { role: "assistant", content: JSON.stringify({ reply: out.reply, profile: out.profile ?? {}, done: false }) }] });
  return reply;
}
const text_ = (v: unknown) => String(v ?? "").trim();

// "хочу похудеть", "составь меню на неделю": the coach's own phrases, matched before the AI parses anything
// (\w does not match Cyrillic, so word endings are spelled [а-яё]*)
const COACH_RE = /похудеть|похудени|похудан|сбросить\s+(вес|\d)|скинуть\s+(вес|\d|кил)|набрать\s+(вес|масс)|правильн[а-яё]*\s+питани|(подбери|подобрать|помоги|помогите)[а-яё]*\s+(мне\s+)?(с\s+)?питани|диет/i;
const MENU_RE = /(меню|рацион)\s+на\s+(неделю|7|семь)|состав[а-яё]*\s+(мне\s+)?(меню|рацион)|обнов[а-яё]*\s+меню/i;
// a sum said in digits or in words («сорок тысяч», «полтора миллиона»)
const HAS_SUM = /\d|тысяч|тыщ|миллион|лям|сот|сто(?![а-яё])|двест|трист/i;
function quickIntent(input: string, c: Ctx): Rec | null {
  // a question about today's or yesterday's spending, with no sum in it: the list of that day
  if (!HAS_SUM.test(input) && /покажи|сколько|какие|список|все|\?/i.test(input) && /расход|потрат|трат/i.test(input) && /сегодня|вчера/i.test(input))
    return normalize({ records: [{ kind: "report", section: "expenses", date: /вчера/i.test(input) ? addDays(today(), -1) : today() }] }).records[0];
  const kind = MENU_RE.test(input) ? "meal_plan" : COACH_RE.test(input) ? (c.profile.kcal && /меню|рацион/i.test(input) ? "meal_plan" : "coach") : "";
  return kind ? normalize({ records: [{ kind }] }).records[0] : null;
}

const profileText = (p: Item) => `норма ${p.kcal} ккал в день, белки ${p.protein} г, жиры ${p.fat} г, углеводы ${p.carbs} г; ` +
  `готовить на ${p.people || 1} чел.; приёмов пищи: ${p.meals_per_day || 4}; на готовку до ${p.cook_minutes || 40} мин в день; ` +
  `не ест: ${p.exclude || "ограничений нет"}; любит: ${p.likes || "—"}; кухня: ${p.equipment || "плита"}; бюджет на продукты в неделю: ${p.food_budget_vnd || "не указан"} ₫; тренировки: ${p.workouts || "—"}`;

// the menu, its recipes and a shopping list, written to the site's "Питание" page
async function mealPlan(c: Ctx): Promise<{ text: string; list: string; ops: Op[] }> {
  const p = c.profile;
  if (!p.kcal) throw new Error("NO_PROFILE");
  const base = `Человек живёт в Нячанге (Вьетнам). Продукты — те, что легко купить на местном рынке и в супермаркетах (Lotte Mart, WinMart, Co.op): рыба, морепродукты, курица, свинина, говядина, яйца, тофу, рис, рисовая лапша, овсянка, овощи, тропические фрукты, зелень. Данные: ${profileText(p)}.`;
  const menu = await aiJSON([{ role: "system", content: `Ты нутрициолог. ${base}
Составь меню на 7 дней (Пн–Вс), 4 приёма пищи: Завтрак, Обед, Ужин, Перекус (если приёмов меньше — Перекус пустой). Калорийность дня ≈ норме (±5%), белка — не меньше нормы.
Блюда простые и вкусные, местная кухня и привычная еда вперемешку. Повторяй блюда (готовка впрок): за неделю не больше 10 разных блюд.
Ответь JSON: {"days":[{"day":"Пн","items":[{"meal":"Завтрак","name":"короткое название","desc":"порция в граммах","kcal":число,"protein":число}, ...]}, ... все 7 дней]}` }, { role: "user", content: "Составь меню на неделю." }], 7000);
  const days = DAYS.map((day, i) => {
    const d = (menu.days ?? [])[i] ?? {};
    return { day, items: MEALS.map((m) => {
      const it = (d.items ?? []).find((x: Item) => low(x.meal) === low(m)) ?? {};
      return { name: text_(it.name), desc: text_(it.desc), kcal: Math.round(Number(it.kcal) || 0), protein: Math.round(Number(it.protein) || 0) };
    }) };
  });
  const dishes = [...new Map(days.flatMap((d) => d.items).filter((x) => x.name).map((x) => [low(x.name), x])).values()].slice(0, 12);
  const recipes: Item[] = [];
  for (let i = 0; i < dishes.length; i += 6) {
    const part = dishes.slice(i, i + 6);
    const r = await aiJSON([{ role: "system", content: `Ты повар и нутрициолог. ${base}
Для каждого блюда напиши рецепт на ${p.people || 1} чел. в этой калорийности: ингредиенты с граммовкой, понятные шаги, как приготовить правильно и полезно (меньше масла, как не пересушить и т. п.).
Ответь JSON: {"recipes":[{"title":"как в списке","kcal":на порцию,"time_min":число,"ingredients":["200 г куриного филе", ...],"steps":["…", ...],"tip":"совет"}]}` },
      { role: "user", content: part.map((x) => `${x.name} (${x.desc}, ~${x.kcal} ккал)`).join("\n") }], 6000);
    for (const x of r.recipes ?? []) recipes.push({ id: uid(), title: text_(x.title), kcal: Math.round(Number(x.kcal) || 0), time: Math.round(Number(x.time_min) || 0),
      ingredients: (x.ingredients ?? []).map(text_).filter(Boolean), steps: (x.steps ?? []).map(text_).filter(Boolean), tip: text_(x.tip) });
  }
  const shop = await aiJSON([{ role: "system", content: `Ты помогаешь с покупками. ${base}
По меню и рецептам на неделю составь один общий список покупок на ${p.people || 1} чел. Объединяй одинаковые продукты, указывай количество на всю неделю и примерную цену в донгах в Нячанге сейчас.
Группы: Овощи и зелень, Фрукты, Мясо и рыба, Яйца и молочное, Крупы и бакалея, Другое.
Ответь JSON: {"items":[{"name":"Куриное филе","qty":"1,2 кг","group":"Мясо и рыба","price_vnd":число}]}` },
    { role: "user", content: recipes.map((r) => `${r.title}: ${r.ingredients.join(", ")}`).join("\n") + "\nМеню: " + days.map((d) => `${d.day}: ${d.items.map((x) => x.name).filter(Boolean).join(", ")}`).join("; ") }], 4000);
  const items = (shop.items ?? []).map((x: Item) => ({ id: uid(), name: text_(x.name), qty: text_(x.qty), group: text_(x.group) || "Другое", price: Math.round(Number(x.price_vnd) || 0), done: false })).filter((x: Item) => x.name);
  const ops = [await setKey("meals", "days", days), await setKey("shopping", "items", items), await setKey("recipes", "items", recipes)];
  const total = sumOf(items, "price");
  const avg = Math.round(days.reduce((s, d) => s + d.items.reduce((a, x) => a + x.kcal, 0), 0) / 7);
  const td = days[todayIdx()];
  const text = `🥗 Меню на неделю готово: в среднем ${num(avg)} ккал в день при норме ${num(p.kcal)}.\n\n` +
    `Сегодня, ${DAYS_FULL[todayIdx()]}:\n${td.items.filter((x) => x.name).map((x, i) => `• ${MEALS[i]}: ${esc(x.name)} — ${x.kcal} ккал`).join("\n")}\n\n` +
    `🛒 Список покупок: ${items.length} позиций, примерно ${money(total)}.\n📖 Рецептов: ${recipes.length} — спроси «рецепт ${esc(recipes[0]?.title?.toLowerCase() ?? "блюда")}».\nВсё есть на сайте в разделе «Питание».`;
  return { text, list: shoppingText(items), ops };
}

function shoppingText(items: Item[]): string {
  if (!items.length) return "Списка покупок пока нет. Скажи «составь меню на неделю».";
  const groups = [...new Set(items.map((i) => i.group))];
  return "🛒 <b>Список покупок</b>\n" + groups.map((g) => `\n<b>${esc(g)}</b>\n` + items.filter((i) => i.group === g)
    .map((i) => `${i.done ? "✅" : "▫️"} ${esc(i.name)}${i.qty ? " — " + esc(i.qty) : ""}${i.price ? " · ~" + money(i.price) : ""}`).join("\n")).join("\n") +
    `\n\nИтого примерно <b>${money(sumOf(items.filter((i) => !i.done), "price"))}</b>${items.some((i) => i.done) ? " за то, что ещё не куплено" : ""}`;
}

const recipeFormat = (r: Item) => `📖 <b>${esc(r.title)}</b>${r.kcal ? ` · ${r.kcal} ккал` : ""}${r.time ? ` · ${r.time} мин` : ""}\n\n<b>Ингредиенты</b>\n` +
  r.ingredients.map((x: string) => `• ${esc(x)}`).join("\n") + `\n\n<b>Как готовить</b>\n` + r.steps.map((x: string, i: number) => `${i + 1}. ${esc(x)}`).join("\n") +
  (r.tip ? `\n\n💡 ${esc(r.tip)}` : "");
async function recipeText(name: string, c: Ctx): Promise<string> {
  const found = pick(c.recipes, name, (x) => x.title);
  if (found) return recipeFormat(found);
  const p = c.profile;
  const out = await aiJSON([{ role: "system", content: `Ты повар и нутрициолог. Человек живёт в Нячанге, продукты — с местного рынка и из супермаркетов. ${p.kcal ? "Данные: " + profileText(p) : ""}
Напиши полезный рецепт. Ответь JSON: {"title":"…","kcal":на порцию,"time_min":число,"ingredients":["…"],"steps":["…"],"tip":"как приготовить правильно"}` }, { role: "user", content: name }], 2500);
  const r = { id: uid(), title: text_(out.title) || cap(name), kcal: Math.round(Number(out.kcal) || 0), time: Math.round(Number(out.time_min) || 0),
    ingredients: (out.ingredients ?? []).map(text_).filter(Boolean), steps: (out.steps ?? []).map(text_).filter(Boolean), tip: text_(out.tip) };
  if (r.steps.length) await add("recipes", r);
  return recipeFormat(r);
}

/* ---------- scheduled messages: pg_cron calls the function every 15 minutes ---------- */
// local date, minutes since midnight and weekday (0 = Monday) in Vietnam
function local(now: Date) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const g = (t: string) => f.find((x) => x.type === t)!.value;
  const date = `${g("year")}-${g("month")}-${g("day")}`;
  return { date, min: (+g("hour") % 24) * 60 + +g("minute"), wd: (new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7, day: +g("day") };
}
const minutes = (s: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(s); return m ? +m[1] * 60 + +m[2] : -1; };
// true only the first time a key is seen, so every message goes out once
async function once(key: string): Promise<boolean> {
  const { data } = await db.from("vl_bot_sent").upsert({ key }, { onConflict: "key", ignoreDuplicates: true }).select("key");
  return !!data?.length;
}

// today's menu from the site, and the calories burned in activities on a day
const dayIdx = (day: string) => (new Date(day + "T12:00:00Z").getUTCDay() + 6) % 7;
function menuLine(c: Ctx, day: string): string {
  const d = c.meals[dayIdx(day)];
  const it = (d?.items ?? []).map((x: Item, i: number) => (x.name ? `• ${MEALS[i]}: ${esc(x.name)}${x.kcal ? ` (${x.kcal} ккал)` : ""}` : "")).filter(Boolean);
  return it.length ? "\n\n🍽 По меню:\n" + it.join("\n") : "";
}
const burnedOn = (c: Ctx, from: string, to = from) => c.activities.filter((a) => a.date >= from && a.date <= to);

function morning(c: Ctx, day: string): string {
  const ev = c.events.filter((e) => e.date === day && !e.done).sort((a, b) => (a.from < b.from ? -1 : 1));
  const open = c.notes.filter((n) => !n.done);
  const trip = c.trips.filter((t) => t.from > day && t.from <= addDays(day, 7)).sort((a, b) => (a.from < b.from ? -1 : 1))[0];
  let out = `☀️ Доброе утро! Сегодня ${DAYS_FULL[(new Date(day + "T12:00:00Z").getUTCDay() + 6) % 7]}, ${dshort(day)}.`;
  out += ev.length ? "\n\n📅 В планах:\n" + ev.map((e) => `• ${e.from ? e.from + " " : ""}${esc(e.title)}`).join("\n") : "\n\n📅 В календаре на сегодня ничего нет.";
  if (open.length) out += `\n\n📝 Открытых задач: ${open.length}` + open.slice(0, 3).map((n) => `\n• ${esc(n.text)}`).join("");
  if (trip) { const n = Math.round((Date.parse(trip.from) - Date.parse(day)) / 864e5); out += `\n\n✈️ ${esc(trip.city)} через ${n} ${n === 1 ? "день" : n < 5 ? "дня" : "дней"}`; }
  return out + menuLine(c, day) + weighNudge(c, day);
}

function evening(c: Ctx, day: string): string {
  const s = spentIn(c, day, day);
  const left = c.events.filter((e) => e.date === day && !e.done);
  let out = s.list.length
    ? `📝 Сегодня записано расходов: ${s.list.length} на ${money(s.total)}. Если тратили что-то ещё — надиктуйте, я добавлю.`
    : "📝 За сегодня ещё нет ни одного расхода. Что потратили? Надиктуйте голосовое, например «кофе 60 тысяч, такси 120».";
  if (left.length) out += "\n\nНе отмечены выполненными:\n" + left.map((e) => `• ${esc(e.title)}`).join("\n") + "\nСкажите «сделано: …», если уже готово.";
  if (c.profile.kcal && !burnedOn(c, day).length) out += "\n\n🏃 Была сегодня активность или тренировка? Расскажи — учту калории.";
  return out + weighNudge(c, day);
}

async function dayReport(c: Ctx, day: string): Promise<string> {
  const s = spentIn(c, day, day), m = day.slice(0, 7), mon = spentIn(c, m + "-01", day);
  const inc = sumOf(c.incomes.filter((i) => i.date === day), "vnd");
  const lastDay = +addDays(addDays(m + "-01", 40).slice(0, 7) + "-01", -1).slice(8), daysLeft = lastDay - +day.slice(8);
  const done = c.events.filter((e) => e.done && e.date === day).length;
  const tomorrow = c.events.filter((e) => !e.done && e.date === addDays(day, 1)).sort((a, b) => (a.from < b.from ? -1 : 1));
  let out = `🌙 <b>Итоги дня, ${dshort(day)}</b>\n\n💸 Потрачено: <b>${money(s.total)}</b>${catLines(s.cats, 4)}`;
  if (inc) out += `\n💰 Доходы: ${money(inc)}`;
  const left = c.budget - mon.total;
  out += `\n\nЗа ${MONTHS[+m.slice(5) - 1]}: ${money(mon.total)} из ${money(c.budget)} на траты (${c.budget ? Math.round(mon.total / c.budget * 100) : 0}%)`;
  out += left >= 0 ? (daysLeft > 0 ? `, можно тратить ≈ ${money(left / daysLeft)} в день` : "") : `, перерасход ${money(-left)}`;
  const fc = await forecast(c, day);
  if (fc) out += `\n${fc}`;
  if (done) out += `\n✅ Сделано дел: ${done}`;
  const act = burnedOn(c, day), burned = sumOf(act, "kcal");
  if (burned) out += `\n🏃 ${act.map((a) => esc(a.title)).join(", ")} — ≈ ${num(burned)} ккал`;
  if (c.profile.kcal) out += `\n🥗 Норма еды сегодня: ${num(c.profile.kcal + Math.round(burned / 2))} ккал${burned ? ` (${num(c.profile.kcal)} + половина тренировок)` : ""}`;
  out += tomorrow.length ? "\n\n📅 Завтра:\n" + tomorrow.map((e) => `• ${e.from ? e.from + " " : ""}${esc(e.title)}`).join("\n") : "\n\n📅 На завтра в календаре ничего нет.";
  return out;
}

async function tick(now = new Date()) {
  const { data: links } = await db.from("vl_tg_links").select("chat_id");
  if (!links?.length) return;
  const c = await context(), p = local(now), out: string[] = [];
  // is it time for this scheduled message (within an hour after it, in case a run was missed)
  const at = (key: string) => { const t = minutes(String(c.settings[key] ?? NOTIFY[key])); return t >= 0 && p.min >= t && p.min < t + 60; };
  for (const e of c.events) {
    if (e.done || e.date !== p.date || !e.from) continue;
    const d = minutes(e.from) - p.min;
    if (d > 0 && d <= 60 && await once(`ev:${e.id}:${e.date}:${e.from}`)) out.push(`⏰ Через ${d} мин: <b>${esc(e.title)}</b> в ${e.from}`);
  }
  if (at("notifyMorning") && await once(`morning:${p.date}`)) out.push(morning(c, p.date));
  if (at("notifyRemind") && await once(`remind:${p.date}`)) out.push(evening(c, p.date));
  if (at("notifyReport") && await once(`daily:${p.date}`)) out.push(await dayReport(c, p.date));
  if (p.wd === 6 && at("notifyReport") && await once(`weekly:${p.date}`)) out.push(weekReport(c, p.date));
  if (p.day === 1 && at("notifyMonthly") && await once(`monthly:${p.date.slice(0, 7)}`)) out.push(await monthReport(c, prevMonth(p.date.slice(0, 7))));
  for (const l of links) for (const msg of out) await say(l.chat_id, msg);
  await db.from("vl_bot_sent").delete().lt("sent_at", new Date(now.getTime() - 60 * 864e5).toISOString());
}

/* ---------- updates ---------- */
const EXAMPLES = `• «Потратил 150 тысяч на кофе»
• «Пришла зарплата 180 тысяч рублей»
• «Поменял 50 тысяч рублей на тенге, получил 270 тысяч, комиссия 500 рублей»
• «Свет за октябрь 900 тысяч, 300 киловатт»
• «Завтра в 10 стоматолог»
• «Едем в Далат с 5 по 9 декабря, бюджет 8 миллионов»
• «Отложили 5 миллионов на айфон»
• «Вес 78,4»
• «Хочу похудеть» — расспрошу, посчитаю норму, составлю меню, покупки и рецепты
• «Час играли в пиклбол»
• «Переходник купил» — отмечу заметку
• «Сколько денег на счетах?»
• «На что мы тратим больше всего и где можно сэкономить?»`;

// deno-lint-ignore no-explicit-any
async function handle(u: any) {
  if (u.widget_query) return widgetQuery(u.widget_query);
  if (u.callback_query) {
    const cq = u.callback_query, chat = cq.message.chat.id;
    const { data: link } = await db.from("vl_tg_links").select("email").eq("chat_id", chat).maybeSingle();
    const [type, a, b] = String(cq.data || "").split(":");
    let ok = false;
    if (link && type === "x" && a) {
      const { data: row } = await db.from("vl_bot_undo").select("ops").eq("id", a).eq("chat_id", chat).maybeSingle();
      if (row) {
        await revert(row.ops as Op[]);
        await db.from("vl_bot_undo").delete().eq("id", a);
        ok = true;
      }
    } else if (link && type === "u" && a && b) {
      // buttons sent by the earlier version of the bot
      await rpc("vl_remove", { p_sec: a, p_id: b });
      ok = true;
    }
    await tg("answerCallbackQuery", { callback_query_id: cq.id, text: ok ? "Отменено" : "Уже отменено" });
    if (ok) await refreshPanels();
    // deno-lint-ignore no-explicit-any
    const kb = (cq.message.reply_markup?.inline_keyboard ?? []).map((row: any[]) => row.filter((x) => x.callback_data !== cq.data)).filter((row: any[]) => row.length);
    await tg("editMessageText", {
      chat_id: chat, message_id: cq.message.message_id,
      text: cq.message.text + (ok ? "\n\n↩️ Одна запись отменена" : ""), reply_markup: { inline_keyboard: kb },
    });
    return;
  }
  const m = u.message;
  if (!m) return;
  const chat = m.chat.id, msg: string = m.text ?? "";

  if (msg.startsWith("/start")) {
    const code = msg.split(/\s+/)[1];
    if (code) {
      const { data: c } = await db.from("vl_tg_codes").select("email, expires_at").eq("code", code).maybeSingle();
      if (!c || new Date(c.expires_at) < new Date()) return say(chat, "Ссылка устарела. Откройте сайт → Настройки → «Подключить Telegram» ещё раз.");
      await db.from("vl_tg_links").upsert({ chat_id: chat, email: c.email });
      await db.from("vl_tg_codes").delete().eq("code", code);
      return say(chat, `Готово, бот подключён к <b>${esc(c.email)}</b> ✅\n\nНадиктуйте голосовое или напишите, например:\n${EXAMPLES}\n\nВсё появится на сайте: ${SITE}`);
    }
  }
  const { data: link } = await db.from("vl_tg_links").select("email, name").eq("chat_id", chat).maybeSingle();
  if (!link) return say(chat, `Это личный бот Vietnam Life. Чтобы подключить его, войдите на сайте ${SITE} → Настройки → «Подключить Telegram».`);
  // the Telegram first name is how the others call this person ("отправь Насте")
  const first = text_(m.from?.first_name);
  if (first && first !== link.name) await db.from("vl_tg_links").update({ name: first }).eq("chat_id", chat);
  if (msg === "/start" || msg === "/help") {
    return say(chat, `Отправьте голосовое или текст — я заполню любой раздел сайта: расходы и доходы в любой валюте, обмены между счетами, коммуналку, календарь, заметки, цели, поездки, жильё, питание, здоровье, «Полезное» и настройки. Записываю вес. Могу отметить сделанное, перенести или удалить запись и ответить, сколько потрачено и сколько денег на счетах.

/panel — живая панель прямо в чате: сколько потратили сегодня, хватит ли денег до конца месяца, остатки на счетах и кнопки быстрых трат.

Сам напоминаю о делах за час, утром присылаю план на день, вечером напоминаю записать расходы и присылаю итоги дня, по воскресеньям — отчёт за неделю, 1-го числа — за прошлый месяц. Если не взвешивались больше двух дней — напомню.\n\nНапример:\n${EXAMPLES}`);
  }

  let input = msg;
  const voice = m.voice ?? m.audio ?? m.video_note;
  let replied = false;
  const late = setTimeout(() => {
    if (!replied) say(chat, "⏳ ИИ сейчас тормозит и не успел ответить. Повтори сообщение через минуту; если что-то успело записаться, увидишь это на сайте.");
  }, Math.max(3_000, timeLeft() - 4_000));
  try {
    if (voice) {
      await tg("sendChatAction", { chat_id: chat, action: "typing" });
      input = await transcribe(voice.file_id);
    }
    if (!input) return say(chat, "Пришлите голосовое или текст.");
    await tg("sendChatAction", { chat_id: chat, action: "typing" });
    const c = await context();
    c.people = await people();
    c.me = chat;
    const heard = voice ? `🎙 «${esc(input)}»\n\n` : "";
    // every reply is remembered with the message it answers, so the next message can refer to it
    const st = await chatState(chat);
    const history: Msg[] = st?.convo ?? [];
    const answer = async (t: string, extra: Record<string, unknown> = {}) => {
      replied = true;
      await say(chat, heard + t, extra);
      await remember(chat, input, t);
    };
    // during the nutrition interview every message is an answer to it ("стоп" ends it)
    if (st?.mode === "coach") return answer(await coachTurn(chat, input, c, st));
    if (PANEL_RE.test(input.trim())) {
      replied = true;
      const err = await sendPanel(chat, c);
      if (err) await say(chat, err);
      return;
    }
    // the nutrition coach and the weekly menu are recognised without the AI, so they always start
    const quick = quickIntent(input, c);
    const { records, question } = quick ? { records: [quick], question: "" } : await extract(input, c, history);
    if (!records.length) {
      if (question) return answer(question);
      // nothing to record: answer it like a question instead of a dead end
      await tg("sendChatAction", { chat_id: chat, action: "typing" });
      return answer(await ask(input, c, history));
    }

    // later: long extras (the shopping list) that go out as their own messages
    const done: string[] = [], answers: string[] = [], undo: string[] = [], later: string[] = [], spent: string[] = [];
    let repeats = 0;
    for (const r of records) {
      if (r.kind === "report") { answers.push(await report(r, c)); continue; }
      if (r.kind === "ask") { await tg("sendChatAction", { chat_id: chat, action: "typing" }); answers.push(await ask(r.text || input, c, history)); continue; }
      if (r.kind === "send") { answers.push(await sendTo(r, chat, c, history)); continue; }
      if (r.kind === "coach") { await tg("sendChatAction", { chat_id: chat, action: "typing" }); answers.push(await coachTurn(chat, input, c, null)); continue; }
      if (r.kind === "recipe") { await tg("sendChatAction", { chat_id: chat, action: "typing" }); answers.push(await recipeText(r.title || input, c)); continue; }
      if (r.kind === "shopping") { answers.push(shoppingText(c.shopping)); continue; }
      if (r.kind === "meal_plan") {
        // the menu needs the norm, so without a profile the interview starts first
        if (!c.profile.kcal) { answers.push(await coachTurn(chat, "Хочу, чтобы ты составил мне питание. " + input, c, null)); continue; }
        await say(chat, "🧑‍🍳 Составляю меню на неделю, рецепты и список покупок — это займёт около минуты.");
        const mp = await mealPlan(c);
        answers.push(mp.text);
        later.push(mp.list);
        const { data: row } = await db.from("vl_bot_undo").insert({ chat_id: chat, ops: mp.ops }).select("id").single();
        if (row) undo.push(row.id);
        continue;
      }
      // a sum without a named currency is in dong; paid «с карты» it stays in dong and is charged to the card's account at the rate
      if (DONG_KINDS.includes(r.kind) && !CUR_WORD.test(input)) {
        const named = r.account && !/карт|card/i.test(r.account) && !CARD_SAID.test(input) ? pick(c.accounts, r.account, (a) => a.name) : undefined;
        r.currency = named && named.cur !== "VND" ? named.cur : "VND";
      }
      // a question about what was recorded («ты с рублёвого списал?») is answered, never taken for a request to delete
      if (r.kind === "delete" && !/удал|отмен|убер|убра|сотр|стер|не надо|ошиб|лишн/i.test(input)) {
        await tg("sendChatAction", { chat_id: chat, action: "typing" });
        answers.push(await ask(input, c, history));
        continue;
      }
      if (r.kind === "expense" && !r.account && CARD_SAID.test(input) && records.filter((x) => x.kind === "expense").length === 1) r.account = "карта";
      // the AI sometimes re-reads the expenses it was shown: one that is already recorded is not added again
      // unless the message itself names a sum
      if (r.kind === "expense" && !HAS_SUM.test(input)) {
        const day = isDate(r.date) ? r.date : today(), vnd = Math.round(r.amount * await vndRate(r.currency, c));
        if (c.expenses.some((e) => e.date === day && String(e.note ?? "") === r.title && Math.abs((+e.amount || 0) - vnd) <= 1)) { repeats++; continue; }
      }
      const d = await apply(r, c);
      if (!d.line) continue;
      done.push(d.line);
      if (r.kind === "expense") for (const o of d.ops) if (o.op === "remove" && o.sec === "expenses") spent.push(o.id);
      if (d.ops.length) {
        const { data: row } = await db.from("vl_bot_undo").insert({ chat_id: chat, ops: d.ops }).select("id").single();
        if (row) undo.push(row.id);
      }
    }
    if (repeats && !done.length && !answers.length) answers.push("Эти траты уже записаны, повторно не добавлял.\n\n" + await dayList(c, today()));
    // every recorded expense gets a short tip, after what was recorded
    if (spent.length) { await tg("sendChatAction", { chat_id: chat, action: "typing" }); const t = await expenseTip(spent, c); if (t) answers.unshift(t); }
    // cancel buttons older than a month are not needed any more
    await db.from("vl_bot_undo").delete().lt("created_at", new Date(Date.now() - 30 * 864e5).toISOString());
    const buttons = undo.map((id, i) => [{ text: undo.length > 1 ? `↩️ Отменить ${i + 1}` : "↩️ Отменить", callback_data: `x:${id}` }]);
    const reply = [done.length ? "Записал:\n" + done.join("\n") : "", ...answers].filter(Boolean).join("\n\n");
    await answer(reply, buttons.length ? { reply_markup: { inline_keyboard: buttons } } : {});
    for (const x of later) await say(chat, x);
    if (done.length) await refreshPanels();
  } catch (e) {
    const err = String((e as Error).message);
    if (err === "NO_STT_KEY" || err === "NO_AI_KEY") return say(chat, "Бот ещё не до конца настроен: нужен ключ ИИ (Anthropic или бесплатный Groq). Как только он будет добавлен, я начну понимать голосовые и текст.");
    console.error(e);
    if (/credit balance/i.test(err)) return say(chat, "На счёте Anthropic закончились деньги, ИИ не ответил и ничего не записал. Пополните баланс в console.anthropic.com → Billing.");
    if (/rate limit|tokens per/i.test(err)) return say(chat, "Бесплатный ИИ сейчас перегружен, ничего не записал. Повторите, пожалуйста, через минуту.");
    return say(chat, "Что-то пошло не так, запись не сохранена. Попробуйте ещё раз.");
  } finally {
    clearTimeout(late);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  // the schedule (pg_cron) knocks with the same secret in its own header
  const cron = req.headers.get("x-vl-cron");
  if (cron !== null) {
    if (cron !== (await secret("telegram_webhook_secret"))) return new Response("forbidden", { status: 403 });
    EdgeRuntime.waitUntil(tick().catch((e) => console.error(e)));
    return new Response("ok");
  }
  // Telegram sends the secret registered with setWebhook; anything else is rejected
  if (req.headers.get("x-telegram-bot-api-secret-token") !== (await secret("telegram_webhook_secret"))) return new Response("forbidden", { status: 403 });
  const update = await req.json();
  EdgeRuntime.waitUntil(handle(update).catch((e) => console.error(e)));
  return new Response("ok");
});
