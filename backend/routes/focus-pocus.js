const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS, AUTOMATIC_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const NO_QUOTE_RULE =
  'Never place a double-quote (") character inside any JSON string value. Use single quotes or rewrite the phrase, or the JSON breaks.';

// ── Sessions live in memory, deliberately ────────────────────────────────
// The supplied implementation wrote sessions.json to disk. Railway's
// filesystem is ephemeral and resets on every deploy, so a session would
// vanish mid-focus; it also re-read and re-parsed the whole file on every
// request. A focus session is at most four hours old by definition, so memory
// is the right lifetime — and the client carries its own copy, so a server
// restart rehydrates instead of losing the session (see 'sync').
const SESSIONS = new Map();
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_SESSIONS = 5000;

setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, s] of SESSIONS) if ((s.createdAt || 0) < cutoff) SESSIONS.delete(id);
}, 10 * 60 * 1000).unref();

const UI_STRINGS = {
  en: { needTask: 'Tell Focus Pocus what you are working on.', badMinutes: 'A session runs between 1 and 240 minutes.', notFound: 'That session has ended.', noExtensions: 'No extensions left — this is the boundary you set.', notRunning: 'That session is no longer running.', failed: 'Something went wrong. Please try again.' },
  es: { needTask: 'Dinos en qué estás trabajando.', badMinutes: 'Una sesión dura entre 1 y 240 minutos.', notFound: 'Esa sesión ya terminó.', noExtensions: 'No quedan prórrogas: este es el límite que fijaste.', notRunning: 'Esa sesión ya no está en marcha.', failed: 'Algo salió mal. Inténtalo de nuevo.' },
  fr: { needTask: 'Dites-nous sur quoi vous travaillez.', badMinutes: 'Une session dure entre 1 et 240 minutes.', notFound: 'Cette session est terminée.', noExtensions: 'Plus de prolongation — c’est la limite que vous aviez fixée.', notRunning: 'Cette session n’est plus en cours.', failed: 'Une erreur est survenue. Veuillez réessayer.' },
  de: { needTask: 'Sag uns, woran du arbeitest.', badMinutes: 'Eine Session dauert zwischen 1 und 240 Minuten.', notFound: 'Diese Session ist beendet.', noExtensions: 'Keine Verlängerung mehr — das ist die Grenze, die du gesetzt hast.', notRunning: 'Diese Session läuft nicht mehr.', failed: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.' },
  pt: { needTask: 'Diga no que você está trabalhando.', badMinutes: 'Uma sessão dura entre 1 e 240 minutos.', notFound: 'Essa sessão terminou.', noExtensions: 'Sem mais prorrogações — este é o limite que você definiu.', notRunning: 'Essa sessão não está mais em andamento.', failed: 'Algo deu errado. Tente novamente.' },
  ar: { needTask: 'أخبرنا بما تعمل عليه.', badMinutes: 'مدة الجلسة بين دقيقة واحدة و240 دقيقة.', notFound: 'انتهت هذه الجلسة.', noExtensions: 'لم يتبقَ تمديد — هذا هو الحد الذي وضعته بنفسك.', notRunning: 'لم تعد هذه الجلسة قيد التشغيل.', failed: 'حدث خطأ ما. حاول مرة أخرى.' },
  zh: { needTask: '告诉我们你正在做什么。', badMinutes: '一次专注时长在 1 到 240 分钟之间。', notFound: '这个专注时段已经结束。', noExtensions: '没有延长次数了——这是你自己设定的界线。', notRunning: '这个时段已经不在进行中。', failed: '出了点问题。请重试。' },
  ja: { needTask: '今どんな作業をしているか教えてください。', badMinutes: 'セッションは1〜240分の範囲です。', notFound: 'そのセッションは終了しています。', noExtensions: '延長はもうありません。これはあなた自身が決めた区切りです。', notRunning: 'そのセッションはもう動いていません。', failed: '問題が発生しました。もう一度お試しください。' },
  ko: { needTask: '지금 어떤 일을 하고 있는지 알려주세요.', badMinutes: '세션 길이는 1분에서 240분 사이입니다.', notFound: '그 세션은 이미 끝났습니다.', noExtensions: '남은 연장이 없습니다 — 직접 정한 경계입니다.', notRunning: '그 세션은 더 이상 진행 중이 아닙니다.', failed: '문제가 발생했습니다. 다시 시도하세요.' },
  ru: { needTask: 'Скажите, над чем вы работаете.', badMinutes: 'Сессия длится от 1 до 240 минут.', notFound: 'Эта сессия завершена.', noExtensions: 'Продлений больше нет — это граница, которую вы сами поставили.', notRunning: 'Эта сессия больше не идёт.', failed: 'Что-то пошло не так. Попробуйте ещё раз.' },
  hi: { needTask: 'बताइए आप किस पर काम कर रहे हैं।', badMinutes: 'एक सेशन 1 से 240 मिनट का होता है।', notFound: 'वह सेशन खत्म हो चुका है।', noExtensions: 'और बढ़ाना बाकी नहीं — यह सीमा आपने खुद तय की थी।', notRunning: 'वह सेशन अब नहीं चल रहा।', failed: 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।' },
  th: { needTask: 'บอกเราหน่อยว่าคุณกำลังทำอะไรอยู่', badMinutes: 'ช่วงโฟกัสมีความยาวระหว่าง 1 ถึง 240 นาที', notFound: 'ช่วงโฟกัสนี้จบไปแล้ว', noExtensions: 'ต่อเวลาไม่ได้อีกแล้ว นี่คือเส้นที่คุณกำหนดไว้เอง', notRunning: 'ช่วงโฟกัสนี้ไม่ได้กำลังทำงานอยู่แล้ว', failed: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
  vi: { needTask: 'Cho chúng tôi biết bạn đang làm gì.', badMinutes: 'Một phiên kéo dài từ 1 đến 240 phút.', notFound: 'Phiên đó đã kết thúc.', noExtensions: 'Hết lượt gia hạn — đây là ranh giới bạn đã tự đặt ra.', notRunning: 'Phiên đó không còn chạy nữa.', failed: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
};

function t(userLanguage, key) {
  const raw = String(userLanguage || 'en').toLowerCase().trim();
  const lang = UI_STRINGS[raw] ? raw : (UI_STRINGS[raw.split(/[-_]/)[0]] ? raw.split(/[-_]/)[0] : 'en');
  return UI_STRINGS[lang][key] || UI_STRINGS.en[key];
}

const clean = (v, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const MAX_EXTENSIONS = 3;
const EXTENSION_MS = 5 * 60 * 1000;

// Absolute timestamps, never elapsed counters. The tool this replaces stored
// accumulated elapsed time and a reload added to it, which is how a session
// reached 42,521 minutes.
function publicSession(s) {
  if (!s) return null;
  const now = Date.now();
  const running = s.status === 'running';
  return {
    id: s.id,
    task: s.task,
    target: s.target,
    plannedMinutes: s.plannedMinutes,
    startedAt: s.startedAt,
    endsAt: s.endsAt,
    status: s.status,
    extensionsUsed: s.extensionsUsed,
    extensionsLeft: Math.max(0, MAX_EXTENSIONS - s.extensionsUsed),
    completed: s.completed,
    breadcrumb: s.breadcrumb,
    remainingMs: running ? Math.max(0, s.endsAt - now) : 0,
    overtimeMs: running ? Math.max(0, now - s.endsAt) : (s.overtimeMs || 0),
    serverNow: now,
  };
}

// ═══════════════════════════════════════════════════════════════
// Coaching — model-backed. The supplied coach.js matched /tax/ and returned a
// canned sentence, which produces a confidently wrong boundary for any task
// the regex happens to hit. Same three jobs, asked properly.
// ═══════════════════════════════════════════════════════════════

const COACH_RULES = `You help someone put a boundary around one work session. You are not a productivity system and you do not motivate.

NEVER:
- Invent what the task involves, how long it has taken, who it is for, what tools they use, or what is blocking them. You know only the sentence they typed.
- Invent WHERE something is or WHO to ask. No shared drive, no folder name, no colleague, no team, no "whoever manages that". If they need to find a file, say to find it — you do not know where they keep things or whether they work with anyone.
- Propose a target that is the whole task. "Enough for now" is a stopping point, not completion.
- Assume the deadline, the stakes, or that finishing matters more than stopping.
- Praise, encourage, or comment on their productivity.

ALWAYS:
- Write in the second person, plainly, one or two sentences.
- Write finished sentences. Never leave a blank for them to fill in — no [square brackets], no "the person who might have it", no placeholder standing in for a fact you were not given. If you do not know a name, a location or a file, write the sentence without it.
- Make the target something they could point at and say yes or no to when the timer ends.
${NO_QUOTE_RULE}`;

async function coach(kind, body) {
  const { task, enough, target, remaining, minutes, userLanguage, userLocale, userCurrency, userRegion } = body;
  const prompts = {
    stuck: `Someone is mid-session and pressed "I'm stuck".

Working on: ${task}
Enough for this session: ${target}

Give them the smallest next move — one action small enough to start now. Not a technique, not a list, not encouragement. If you cannot tell what the smallest move is from what they typed, say what single fact or decision they need first.

Return ONLY valid JSON: { "nudge": "one or two sentences, second person" }`,

    breadcrumb: `A focus session just ended and the person did NOT reach the target. That is the situation; do not write as though they finished.

The note you are writing is for the version of them who comes back to this later, having forgotten where they were.

Working on: ${task}
Enough for this session: ${target}
What they said remains: ${remaining || 'NOTHING — they left it blank.'}

Write the note that lets them close the laptop and stop carrying this. It names WHERE TO PICK UP — the first thing to do on returning. Do not restate the stopping point, do not summarise the session, and never describe the task as finished or the target as met.

Return ONLY valid JSON: { "breadcrumb": "one or two sentences, second person" }`,
  };

  const raw = await callClaudeWithRetry({
    model: MODELS.FAST,
    max_tokens: 400,
    system: withLanguage(COACH_RULES, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
    messages: [{ role: 'user', content: prompts[kind] }],
  }, { label: `focus-pocus-${kind}` });

  const field = kind === 'prepare' ? 'target' : kind === 'stuck' ? 'nudge' : 'breadcrumb';
  const text = clean(raw?.[field], 400);

  // One short field, so the guard sees the whole thing. Cheap here in a way it
  // is not on the big tools, and this is the field the person acts on.
  if (text) {
    const draft = { [field]: text };
    await runOutputGuard(draft, {
      label: `focus-pocus-${kind}`,
      fields: [[field, text]],
      supplied: `EVERYTHING KNOWN ABOUT THIS PERSON, IN FULL — one or two sentences they typed into a box:
What they are working on: ${task || '(not given)'}
What they said would be enough: ${enough || '(not given)'}
The session's stopping point: ${target || '(not set yet)'}
What they said remains: ${remaining || '(not given)'}
Session length they chose: ${minutes ? minutes + ' minutes' : '(not given)'}

Nothing else is known. Not the deadline, not who it is for, not what is blocking them, not how long it has already taken, not whether it matters.

WHAT FAILS:
1. Any detail about the task that was not in those sentences.
2. A target that is the whole task rather than a place to stop. This tool exists to help someone STOP.
3. An assumed deadline, consequence or stake.
4. Praise, encouragement, or a remark about their productivity.
5. Anything that reads as permission to keep working past the boundary they set.
6. A named technique or a list where one concrete next move was asked for.
7. Describing the task as finished or the target as reached, on a session where the person said they did not get there.
8. A blank for the reader to fill in — [square brackets], "the person who might have it", any placeholder standing in for something nobody supplied. The sentence should read as finished.`,
      promise: 'Focus Pocus puts a boundary around one work session: a stopping point the person can answer yes or no to, and a way out when the time is up.',
      guard: router.outputGuard,
      userLanguage,
      locale: withLocaleContext(userLocale, userCurrency, userRegion),
    });
    return clean(draft[field], 400) || text;
  }
  return text;
}

// prepare needs the model's judgement AND its suggestion, so it does not go
// through the single-field helper. Whether the person's own wording was already
// usable decides whether they are interrupted for approval at all.
const PREPARE_PROMPT = ({ task, enough, minutes }) => `Someone is about to start a ${minutes}-minute focus session.

What they typed they are working on: ${task}
What they typed would make it enough: ${enough || 'NOTHING — they left it blank.'}

Two jobs. First decide whether what they wrote is ALREADY a usable stopping point — something specific enough that they could answer yes or no to it when the timer ends. "Make progress on it", "work on it", "get started" and a blank are not. Then give the target.

NEVER return the task itself as the target. "Sort out the tax paperwork" is the task; a target is one bounded piece of it that fits in ${minutes} minutes and leaves something behind — a pile, a list, a draft, a decision.

Turn that into one concrete stopping point for THIS session. If what they wrote is already concrete and specific, return it close to unchanged rather than rewriting it for the sake of it.

Return ONLY valid JSON: { "target": "one or two sentences, second person", "wasVague": true or false }`;

async function prepareTarget(body) {
  const raw = await callClaudeWithRetry({
    model: MODELS.FAST,
    max_tokens: 400,
    system: withLanguage(COACH_RULES, body.userLanguage) + withLocaleContext(body.userLocale, body.userCurrency, body.userRegion),
    messages: [{ role: 'user', content: PREPARE_PROMPT(body) }],
  }, { label: 'focus-pocus-prepare' });

  let target = clean(raw?.target, 400);
  const task = clean(body.task, 300);
  // The one failure this must never ship: handing back the task as the target.
  if (!target || target.toLowerCase() === task.toLowerCase()) target = '';
  return { target, wasVague: raw?.wasVague !== false };
}

// ═══════════════════════════════════════════════════════════════
// POST /focus-pocus — the three actions that call the model
// ═══════════════════════════════════════════════════════════════
router.post('/focus-pocus', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { action, userLanguage } = req.body || {};
  try {
    if (action === 'prepare') {
      const task = clean(req.body.task, 300);
      if (!task) return res.status(400).json({ error: t(userLanguage, 'needTask') });
      const { target, wasVague } = await prepareTarget({ ...req.body, task });
      return res.json({ target, wasVague });
    }

    if (action === 'stuck') {
      const s = SESSIONS.get(clean(req.body.id, 64));
      if (!s) return res.status(404).json({ error: t(userLanguage, 'notFound') });
      const nudge = await coach('stuck', { ...req.body, task: s.task, target: s.target });
      return res.json({ nudge });
    }

    if (action === 'review') {
      const s = SESSIONS.get(clean(req.body.id, 64));
      if (!s) return res.status(404).json({ error: t(userLanguage, 'notFound') });
      const result = ['yes', 'almost', 'stuck'].includes(req.body.result) ? req.body.result : 'almost';
      s.completed = result;
      s.status = 'done';
      s.overtimeMs = Math.max(0, Date.now() - s.endsAt);
      // "Yes" needs no breadcrumb: done is done, and writing one would invent
      // work the person just told us is finished.
      s.breadcrumb = result === 'yes' ? '' : await coach('breadcrumb', { ...req.body, task: s.task, target: s.target });
      SESSIONS.set(s.id, s);
      return res.json(publicSession(s));
    }

    return res.status(400).json({ error: t(userLanguage, 'failed') });
  } catch (err) {
    console.error('[focus-pocus] Error:', err?.message || err);
    return res.status(500).json({ error: t(userLanguage, 'failed') });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /focus-pocus/session — timer state. No model call, so this sits in the
// automatic bucket: the default 12/minute would kill a session that syncs.
// ═══════════════════════════════════════════════════════════════
router.post('/focus-pocus/session', rateLimit(AUTOMATIC_LIMITS, 'fp-session'), async (req, res) => {
  const { action, userLanguage } = req.body || {};
  try {
    if (action === 'start') {
      const task = clean(req.body.task, 300);
      const minutes = Number(req.body.minutes);
      if (!task) return res.status(400).json({ error: t(userLanguage, 'needTask') });
      if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) {
        return res.status(400).json({ error: t(userLanguage, 'badMinutes') });
      }
      if (SESSIONS.size >= MAX_SESSIONS) {
        const oldest = [...SESSIONS.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
        if (oldest) SESSIONS.delete(oldest[0]);
      }
      const startedAt = Date.now();
      const s = {
        id: crypto.randomUUID(),
        task,
        target: clean(req.body.target, 400) || task,
        plannedMinutes: minutes,
        startedAt,
        endsAt: startedAt + minutes * 60_000,
        status: 'running',
        extensionsUsed: 0,
        completed: null,
        breadcrumb: '',
        overtimeMs: 0,
        createdAt: startedAt,
      };
      SESSIONS.set(s.id, s);
      return res.json(publicSession(s));
    }

    const id = clean(req.body.id, 64);
    let s = SESSIONS.get(id);

    // A deploy restarts the process and empties the map. Rather than tell
    // someone mid-session that their session has ended, rebuild it from the
    // copy the client is already holding. Its own timestamps are the thing
    // being restored, so the clamps below are what keep it honest.
    if (!s && action === 'sync' && req.body.local && req.body.local.id === id) {
      const l = req.body.local;
      const minutes = Number(l.plannedMinutes);
      const endsAt = Number(l.endsAt);
      const startedAt = Number(l.startedAt);
      const sane = Number.isFinite(minutes) && minutes >= 1 && minutes <= 240
        && Number.isFinite(endsAt) && Number.isFinite(startedAt)
        && startedAt <= Date.now() && Date.now() - startedAt < SESSION_TTL_MS
        && endsAt <= startedAt + (240 + MAX_EXTENSIONS * 5) * 60_000;
      if (sane) {
        s = {
          id, task: clean(l.task, 300), target: clean(l.target, 400),
          plannedMinutes: minutes, startedAt, endsAt,
          status: ['running', 'review', 'done'].includes(l.status) ? l.status : 'running',
          extensionsUsed: Math.min(MAX_EXTENSIONS, Math.max(0, Number(l.extensionsUsed) || 0)),
          completed: null, breadcrumb: clean(l.breadcrumb, 400), overtimeMs: 0, createdAt: startedAt,
        };
        SESSIONS.set(id, s);
        console.log('[focus-pocus] rehydrated a session the server had forgotten');
      }
    }

    if (!s) return res.status(404).json({ error: t(userLanguage, 'notFound') });

    if (action === 'sync') return res.json(publicSession(s));

    if (action === 'extend') {
      if (s.status !== 'running') return res.status(409).json({ error: t(userLanguage, 'notRunning') });
      if (s.extensionsUsed >= MAX_EXTENSIONS) return res.status(409).json({ error: t(userLanguage, 'noExtensions') });
      s.extensionsUsed += 1;
      s.endsAt = Math.max(Date.now(), s.endsAt) + EXTENSION_MS;
      SESSIONS.set(s.id, s);
      return res.json(publicSession(s));
    }

    if (action === 'finish-early' || action === 'time-up') {
      s.overtimeMs = Math.max(0, Date.now() - s.endsAt);
      s.status = 'review';
      SESSIONS.set(s.id, s);
      return res.json(publicSession(s));
    }

    if (action === 'discard') {
      SESSIONS.delete(s.id);
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: t(userLanguage, 'failed') });
  } catch (err) {
    console.error('[focus-pocus/session] Error:', err?.message || err);
    return res.status(500).json({ error: t(userLanguage, 'failed') });
  }
});

router.outputStandard = 'v2';
// focus-pocus-v2. Reviewed 2026-08-26. The tool's whole job is helping someone
// STOP, so the guard polices the ways a coach drifts into keeping them going.
router.outputGuard = {
  prohibit: [
    'invented_detail_about_the_task',
    'target_that_is_the_whole_task',
    'assumed_deadline_or_stakes',
    'encouragement_or_praise',
    'advice_to_keep_working_past_the_boundary',
    'productivity_technique_instead_of_a_next_move',
    'placeholder_for_the_reader_to_fill_in',
    'says_the_work_is_finished_when_it_is_not',   // [where you keep it], [person who has it]
  ],
  require: [
    'a_stopping_point_they_can_answer_yes_or_no_to',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
