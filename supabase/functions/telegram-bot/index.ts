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
  weightGoal: "желаемый вес, кг", notifyMorning: "время утренней сводки (HH:MM или off)", notifyRemind: "время напоминания записать расходы (HH:MM или off)",
  notifyReport: "время вечернего отчёта (HH:MM или off)", notifyMonthly: "время отчёта за месяц 1-го числа (HH:MM или off)" };
const NUM_SETTINGS = ["temp", "feels", "budget", "kwhPrice", "weightGoal"];
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
  usd: number; budget: number; kwhPrice: number; rates: Record<string, number>;
  goals: Item[]; notes: Item[]; events: Item[]; trips: Item[]; apartments: Item[]; expenses: Item[]; incomes: Item[]; transfers: Item[]; accounts: Item[];
  weights: Item[]; utilities: Item[]; settings: Item;
};
async function context(): Promise<Ctx> {
  const { data } = await db.from("vl_sections").select("sec, body");
  const by: Record<string, Item> = Object.fromEntries((data ?? []).map((r) => [r.sec, r.body ?? {}]));
  const list = (s: string): Item[] => (Array.isArray(by[s]?.items) ? by[s].items : []);
  const st = by.settings ?? {};
  const c: Ctx = {
    usd: 0, budget: Number(st.budget) || 70000000, kwhPrice: Number(st.kwhPrice) || 3000, rates: { ...(st.rates ?? {}), ...(st.rate ? { USD: Number(st.rate) } : {}) },
    goals: list("goals"), notes: list("notes"), events: list("events"), trips: list("trips"), apartments: list("apartments"),
    expenses: list("expenses"), incomes: list("incomes"), transfers: list("transfers"), accounts: list("accounts"),
    weights: list("weights").sort((a, b) => (a.date < b.date ? -1 : 1)), utilities: list("utilities"), settings: st,
  };
  c.usd = (await vndRate("USD", c)) || 25000;
  return c;
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

/* ---------- text -> actions: Groq free tier, or Claude if an Anthropic key is set instead ---------- */
const KINDS = ["expense", "income", "exchange", "balance", "rate", "event", "note", "health", "utility", "apartment", "trip", "trip_item", "meal",
  "goal", "goal_add", "weight", "done", "reschedule", "delete", "useful", "setting", "report"];
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
          "key", "value", "section", "flag"],
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
          section: { type: "string", enum: [...new Set([...SECTIONS, ...REPORTS]), ""] },
          flag: { type: "boolean" },
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
};

const lines = (l: string[], empty = "нет") => (l.length ? l.join("\n") : empty);
function known(c: Ctx): string {
  const from = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  const ev = c.events.filter((e) => !e.done && String(e.date) >= from).sort((a, b) => (a.date + a.from < b.date + b.from ? -1 : 1)).slice(0, 40);
  const exp = [...c.expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 15);
  const inc = [...c.incomes].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10);
  return `Счета:
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
${lines(c.apartments.map((a) => `- ${q(a.name)}, ${a.city}${a.current ? " (живут сейчас)" : ""}`))}
Последние расходы:
${lines(exp.map((e) => `- ${e.date} ${e.amount} VND ${e.cat} ${q(e.note)}`))}
Последние взвешивания:
${lines(c.weights.slice(-5).map((w) => `- ${w.date} ${w.kg} кг`))}
Последние доходы:
${lines(inc.map((i) => `- ${i.date} ${i.amount} ${i.cur} ${q(i.source)}`))}`;
}

const prompt = (c: Ctx) => `Ты помощник пары, которая живёт во Вьетнаме. По их голосовому или текстовому сообщению ты заполняешь их сайт-планер: превращаешь сообщение в список действий records.
Сегодня ${today()} (${DAYS_FULL[todayIdx()]}), часовой пояс ${TZ}. Относительные даты («завтра», «в пятницу», «вчера», «через неделю») переводи в YYYY-MM-DD, месяцы — в YYYY-MM.
Деньги: amount — число, как сказано («150 тысяч», «150к» = 150000, «полтора миллиона», «1,5 ляма» = 1500000), currency — его валюта: VND (донги, если валюта не названа), RUB (рубли), KZT (тенге), USD (доллары), EUR (евро), THB (баты). В донги не пересчитывай, это сделает бот.

Виды действий (kind) и их поля:
- expense — потратили деньги. date, amount, currency, category (одна из: ${CATS.join(", ")}), title — что купили, коротко; account — счёт из списка, если назван («с тинькоффа», «с каспи»).
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
- trip — новая поездка. city — куда, date — с какого числа, date_to — по какое, amount + currency — бюджет, text — заметка.
- trip_item — пункт в чек-лист поездки («в Дананг не забыть забронировать байк»). city — поездка из списка ниже, text — пункт.
- meal — блюдо в недельный план питания. weekday (0 — понедельник … 6 — воскресенье; сегодня ${todayIdx()}), meal (${MEALS.join(", ")}), title — блюдо, text — дополнение, kcal. На несколько дней — по record на каждый день.
- goal — новая цель накопить («хотим накопить 38 миллионов на айфон»). title — на что копим, коротко и с заглавной буквы, без суммы; amount + currency — сколько нужно.
- goal_add — отложили деньги в существующую цель («отложили 5 миллионов на айфон»). title — цель из списка ниже, amount, currency. Это не expense: деньги отложены, а не потрачены.
- done — что-то сделано («купил переходник», «билеты в Дананг купили», «йогу провели»). section — notes, events или trips; title — текст заметки, события или пункта чек-листа из списков ниже; city — поездка, если это пункт чек-листа.
- reschedule — перенести событие на другую дату или время. title — событие из списка ниже, date, time_from, time_to.
- delete — удалить запись («удали заметку про визу», «стоматолог отменился», «убери расход на кофе, это ошибка»). section (${SECTIONS.join(", ")}), title — текст записи из списков ниже (для расхода — описание, для дохода — источник).
- useful — добавить в шпаргалку «Полезное». key (${Object.entries(USEFUL).map(([k, v]) => k + " — " + v).join(", ")}), text.
- setting — изменить настройку сайта. key (${Object.entries(SETTINGS).map(([k, v]) => k + " — " + v).join(", ")}), value.
- weight — взвесился («вес 78,4», «утром 79 и 2»). amount — вес в килограммах, date, text — заметка. Для удаления взвешивания в delete title — его дата YYYY-MM-DD.
- report — вопрос о данных, а не новая запись («сколько потратили в этом месяце», «сколько денег на счетах», «что у нас на неделе», «сколько накопили», «что надо сделать», «как мой вес», «отчёт за неделю», «итоги прошлого месяца»). section: expenses (month — какой месяц), money (доходы, расходы и остатки на счетах; month), events, goals, notes, weight, week (отчёт за последние 7 дней) или month (полный отчёт за месяц; month).
Бот сам присылает напоминания о делах за час, утреннюю сводку, вечером напоминание записать расходы и отчёт за день, в воскресенье — за неделю, 1-го числа — за прошлый месяц. Время меняется через setting (notifyMorning, notifyRemind, notifyReport, notifyMonthly; value — HH:MM или off, чтобы выключить).

Данные на сайте сейчас:
${known(c)}

Правила:
- Одно сообщение может содержать несколько действий: верни их все.
- Для goal_add, done, reschedule, delete и trip_item копируй title и city точно из списков выше. Если подходящей записи нет, ничего не выдумывай: верни пустой records и спроси в question, что имелось в виду.
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
  }));
  return { records, question: text(o?.question) };
}

async function extract(input: string, c: Ctx): Promise<{ records: Rec[]; question: string }> {
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
          { role: "system", content: prompt(c) + "\n\nОтвечай только JSON-объектом по этой JSON-схеме:\n" + JSON.stringify(RECORD_SCHEMA) },
          { role: "user", content: input },
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
    max_tokens: 8000,
    output_config: { effort: "low", format: { type: "json_schema", schema: RECORD_SCHEMA } },
    system: prompt(c),
    messages: [{ role: "user", content: input }],
  } as any);
  if (res.stop_reason === "refusal") return { records: [], question: "Не получилось разобрать сообщение, переформулируйте, пожалуйста." };
  const block = res.content.find((b) => b.type === "text");
  return normalize(JSON.parse(block && block.type === "text" ? block.text : "{}"));
}

/* ---------- apply one action ---------- */
type Done = { line: string; ops: Op[] };
const miss = (what: string, name: string): Done => ({ line: `❓ Не нашёл ${what} ${q(esc(name))}, ничего не изменил`, ops: [] });
const noRate = (c: string): Done => ({ line: `❓ Не знаю курс ${c}: задайте его, например «курс ${c} 280 донгов»`, ops: [] });

// the account money comes from or goes to: the named one, else the first one in that currency, else a new one
async function account(name: string, currency: string): Promise<{ acc: Item; ops: Op[] }> {
  const list = await items("accounts");
  const acc = (name && pick(list, name, (a) => a.name)) || (!name && list.find((a) => a.cur === currency));
  if (acc) return { acc, ops: [] };
  const created = { id: uid(), name: name ? cap(name) : CUR[currency][1], cur: currency, start: 0 };
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
      if (r.currency !== "VND" || r.account || c.accounts.some((a) => a.cur === "VND")) {
        const a = await account(r.account, r.currency);
        ops.push(...a.ops);
        item.acc = a.acc.id;
        if (r.currency !== "VND") Object.assign(item, { orig: r.amount, cur: r.currency });
      }
      ops.push(await add("expenses", item));
      return { line: `💸 Расход ${money(vnd)}${inVnd} · ${esc(item.cat)}${r.title ? " · " + esc(r.title) : ""} · ${dshort(date)}`, ops };
    }
    case "income": {
      if (!r.amount) return { line: "❓ Не расслышал сумму дохода", ops: [] };
      const a = await account(r.account, r.currency);
      const item = { id: uid(), date, amount: r.amount, cur: r.currency, vnd, rate, source: r.title || "Доход", acc: a.acc.id };
      const ops = [...a.ops, await add("incomes", item)];
      // say where the rate came from: the site's settings or today's market rate
      const src = c.rates[r.currency] ? "" : ", сегодняшний";
      return {
        line: `💰 Доход ${cash(r.amount, r.currency)}${r.currency !== "VND" ? rate ? ` ≈ ${money(vnd)} (курс ${rateText(rate)}${src})` : " (курс неизвестен)" : ""} · ${esc(item.source)} · ${esc(a.acc.name)} · ${dshort(date)}`,
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
    case "done": {
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
        : NOTIFY[r.key] ? (/off|выкл|нет/i.test(r.value) ? "off" : hhmm(r.value) || NOTIFY[r.key]) : r.value;
      return { line: `⚙️ ${cap(SETTINGS[r.key])}: ${esc(typeof value === "number" ? num(value) : value)}`, ops: [await setKey("settings", r.key, value)] };
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
  if (m === today().slice(0, 7)) out += `\n\nБюджет ${money(c.budget)}, ${spent <= c.budget ? "осталось " + money(c.budget - spent) : "перерасход " + money(spent - c.budget)}`;
  return out;
}

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
  out += `\n\nБюджет ${money(c.budget)}: ${s.total <= c.budget ? "уложились, осталось " + money(c.budget - s.total) : "перерасход " + money(s.total - c.budget)}`;
  if (s.cats.length) out += `\n\nПо категориям:${catLines(s.cats, 8)}`;
  if (top.length) out += "\n\nКрупнейшие траты:" + top.map((e) => `\n• ${dshort(e.date)} ${esc(e.note || e.cat)} — ${money(e.amount)}`).join("");
  if (util) out += `\n\n🔌 Коммуналка: ${money(Object.keys(UTIL).reduce((a, k) => a + (Number(util[k]) || 0), 0))}${util.kwh ? ", " + num(util.kwh) + " кВт·ч" : ""}`;
  const wt = weightText(c, last, 30);
  if (wt) out += `\n\n${wt}`;
  if (c.goals.length) out += "\n\n🎯 Цели:\n" + c.goals.map((g) => `• ${esc(g.title)}: ${dollars(+g.saved || 0)} из ${dollars(+g.target || 0)}`).join("\n");
  return out + await balancesText(c);
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

function morning(c: Ctx, day: string): string {
  const ev = c.events.filter((e) => e.date === day && !e.done).sort((a, b) => (a.from < b.from ? -1 : 1));
  const open = c.notes.filter((n) => !n.done);
  const trip = c.trips.filter((t) => t.from > day && t.from <= addDays(day, 7)).sort((a, b) => (a.from < b.from ? -1 : 1))[0];
  let out = `☀️ Доброе утро! Сегодня ${DAYS_FULL[(new Date(day + "T12:00:00Z").getUTCDay() + 6) % 7]}, ${dshort(day)}.`;
  out += ev.length ? "\n\n📅 В планах:\n" + ev.map((e) => `• ${e.from ? e.from + " " : ""}${esc(e.title)}`).join("\n") : "\n\n📅 В календаре на сегодня ничего нет.";
  if (open.length) out += `\n\n📝 Открытых задач: ${open.length}` + open.slice(0, 3).map((n) => `\n• ${esc(n.text)}`).join("");
  if (trip) { const n = Math.round((Date.parse(trip.from) - Date.parse(day)) / 864e5); out += `\n\n✈️ ${esc(trip.city)} через ${n} ${n === 1 ? "день" : n < 5 ? "дня" : "дней"}`; }
  return out + weighNudge(c, day);
}

function evening(c: Ctx, day: string): string {
  const s = spentIn(c, day, day);
  const left = c.events.filter((e) => e.date === day && !e.done);
  let out = s.list.length
    ? `📝 Сегодня записано расходов: ${s.list.length} на ${money(s.total)}. Если тратили что-то ещё — надиктуйте, я добавлю.`
    : "📝 За сегодня ещё нет ни одного расхода. Что потратили? Надиктуйте голосовое, например «кофе 60 тысяч, такси 120».";
  if (left.length) out += "\n\nНе отмечены выполненными:\n" + left.map((e) => `• ${esc(e.title)}`).join("\n") + "\nСкажите «сделано: …», если уже готово.";
  return out + weighNudge(c, day);
}

function dayReport(c: Ctx, day: string): string {
  const s = spentIn(c, day, day), m = day.slice(0, 7), mon = spentIn(c, m + "-01", day);
  const inc = sumOf(c.incomes.filter((i) => i.date === day), "vnd");
  const lastDay = +addDays(addDays(m + "-01", 40).slice(0, 7) + "-01", -1).slice(8), daysLeft = lastDay - +day.slice(8);
  const done = c.events.filter((e) => e.done && e.date === day).length;
  const tomorrow = c.events.filter((e) => !e.done && e.date === addDays(day, 1)).sort((a, b) => (a.from < b.from ? -1 : 1));
  let out = `🌙 <b>Итоги дня, ${dshort(day)}</b>\n\n💸 Потрачено: <b>${money(s.total)}</b>${catLines(s.cats, 4)}`;
  if (inc) out += `\n💰 Доходы: ${money(inc)}`;
  const left = c.budget - mon.total;
  out += `\n\nЗа ${MONTHS[+m.slice(5) - 1]}: ${money(mon.total)} из ${money(c.budget)} (${c.budget ? Math.round(mon.total / c.budget * 100) : 0}%)`;
  out += left >= 0 ? (daysLeft > 0 ? `, можно тратить ≈ ${money(left / daysLeft)} в день` : "") : `, перерасход ${money(-left)}`;
  if (done) out += `\n✅ Сделано дел: ${done}`;
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
  if (at("notifyReport") && await once(`daily:${p.date}`)) out.push(dayReport(c, p.date));
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
• «Переходник купил» — отмечу заметку
• «Сколько денег на счетах?»`;

// deno-lint-ignore no-explicit-any
async function handle(u: any) {
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
  const { data: link } = await db.from("vl_tg_links").select("email").eq("chat_id", chat).maybeSingle();
  if (!link) return say(chat, `Это личный бот Vietnam Life. Чтобы подключить его, войдите на сайте ${SITE} → Настройки → «Подключить Telegram».`);
  if (msg === "/start" || msg === "/help") {
    return say(chat, `Отправьте голосовое или текст — я заполню любой раздел сайта: расходы и доходы в любой валюте, обмены между счетами, коммуналку, календарь, заметки, цели, поездки, жильё, питание, здоровье, «Полезное» и настройки. Записываю вес. Могу отметить сделанное, перенести или удалить запись и ответить, сколько потрачено и сколько денег на счетах.

Сам напоминаю о делах за час, утром присылаю план на день, вечером напоминаю записать расходы и присылаю итоги дня, по воскресеньям — отчёт за неделю, 1-го числа — за прошлый месяц. Если не взвешивались больше двух дней — напомню.\n\nНапример:\n${EXAMPLES}`);
  }

  let input = msg;
  const voice = m.voice ?? m.audio ?? m.video_note;
  try {
    if (voice) {
      await tg("sendChatAction", { chat_id: chat, action: "typing" });
      input = await transcribe(voice.file_id);
    }
    if (!input) return say(chat, "Пришлите голосовое или текст.");
    await tg("sendChatAction", { chat_id: chat, action: "typing" });
    const c = await context();
    const { records, question } = await extract(input, c);
    const heard = voice ? `🎙 «${esc(input)}»\n\n` : "";
    if (!records.length) return say(chat, heard + (question || "Не нашёл, что записать. Скажите, например: «потратил 200 тысяч на продукты»."));

    const done: string[] = [], answers: string[] = [], undo: string[] = [];
    for (const r of records) {
      if (r.kind === "report") { answers.push(await report(r, c)); continue; }
      const d = await apply(r, c);
      if (!d.line) continue;
      done.push(d.line);
      if (d.ops.length) {
        const { data: row } = await db.from("vl_bot_undo").insert({ chat_id: chat, ops: d.ops }).select("id").single();
        if (row) undo.push(row.id);
      }
    }
    // cancel buttons older than a month are not needed any more
    await db.from("vl_bot_undo").delete().lt("created_at", new Date(Date.now() - 30 * 864e5).toISOString());
    const buttons = undo.map((id, i) => [{ text: undo.length > 1 ? `↩️ Отменить ${i + 1}` : "↩️ Отменить", callback_data: `x:${id}` }]);
    const reply = [done.length ? "Записал:\n" + done.join("\n") : "", ...answers].filter(Boolean).join("\n\n");
    await say(chat, heard + reply, buttons.length ? { reply_markup: { inline_keyboard: buttons } } : {});
  } catch (e) {
    const err = String((e as Error).message);
    if (err === "NO_STT_KEY" || err === "NO_AI_KEY") return say(chat, "Бот ещё не до конца настроен: нужен бесплатный ключ Groq. Как только он будет добавлен, я начну понимать голосовые и текст.");
    console.error(e);
    return say(chat, "Что-то пошло не так, запись не сохранена. Попробуйте ещё раз.");
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
