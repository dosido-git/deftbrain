import React, { useState, useCallback, useRef } from 'react';
import { Loader2, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Check, CheckCircle2, X, Plus, Edit3, Download, Printer, Mail, Lock, CreditCard, FileText, Heart, Home, Star, AlertCircle, RefreshCw, Send, Scroll, BookOpen, User, Shield, Globe, Smartphone, Cloud, Music, Camera, PawPrint, Key, MessageSquare, Trash2, Copy, Sparkles } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

// ════════════════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════════════════
const useColors = () => {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    d,
    bg: d ? 'bg-zinc-900' : 'bg-stone-50',
    bgCard: d ? 'bg-zinc-800' : 'bg-white',
    bgInset: d ? 'bg-zinc-700' : 'bg-stone-100',
    bgWarm: d ? 'bg-amber-900/20' : 'bg-amber-50/60',
    bgHover: d ? 'hover:bg-zinc-700' : 'hover:bg-stone-50',
    text: d ? 'text-zinc-50' : 'text-stone-900',
    textSec: d ? 'text-zinc-400' : 'text-stone-600',
    textMut: d ? 'text-zinc-500' : 'text-stone-400',
    textWarm: d ? 'text-amber-300' : 'text-amber-800',
    border: d ? 'border-zinc-700' : 'border-stone-200',
    borderWarm: d ? 'border-amber-700/40' : 'border-amber-200',
    accent: d ? 'text-amber-400' : 'text-amber-600',
    accentBg: d ? 'bg-amber-400' : 'bg-amber-600',
    input: d ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:border-amber-500' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-amber-500',
    btn: d ? 'bg-amber-500 hover:bg-amber-400 text-zinc-900' : 'bg-stone-800 hover:bg-stone-900 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-stone-100 hover:bg-stone-200 text-stone-700',
    btnGhost: d ? 'text-zinc-400 hover:text-zinc-100' : 'text-stone-500 hover:text-stone-800',
    btnDis: d ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed',
    tag: d ? 'bg-zinc-700 text-zinc-300' : 'bg-stone-100 text-stone-600',
    successBg: d ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    errBg: d ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
    errText: d ? 'text-red-300' : 'text-red-700',
    letterBg: d ? 'bg-zinc-800 border-amber-700/30' : 'bg-amber-50/40 border-amber-200',
    letterText: d ? 'text-zinc-200' : 'text-stone-800',
    progressDone: d ? 'bg-amber-400' : 'bg-amber-600',
    progressPending: d ? 'bg-zinc-700' : 'bg-stone-200',
    envelopeBg: d ? 'bg-amber-900/30 border-amber-700/50' : 'bg-amber-100/60 border-amber-300',
  };
};

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const CHAPTERS = [
  { id: 'accounts', label: 'Accounts', icon: '🔑', short: 'Accounts' },
  { id: 'documents', label: 'Documents & Files', icon: '📄', short: 'Docs' },
  { id: 'financial', label: 'Financial', icon: '💰', short: 'Financial' },
  { id: 'messages', label: 'Messages', icon: '💌', short: 'Messages' },
  { id: 'wishes', label: 'Wishes', icon: '🏠', short: 'Wishes' },
  { id: 'review', label: 'Review & Export', icon: '📋', short: 'Export' },
];

const ACCOUNT_CATEGORIES = [
  { id: 'financial', label: 'Financial', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { id: 'social', label: 'Social Media', icon: <Globe className="w-4 h-4" /> },
  { id: 'cloud', label: 'Cloud Storage', icon: <Cloud className="w-4 h-4" /> },
  { id: 'subscription', label: 'Subscriptions', icon: <Star className="w-4 h-4" /> },
  { id: 'work', label: 'Work', icon: <FileText className="w-4 h-4" /> },
  { id: 'medical', label: 'Medical', icon: <Shield className="w-4 h-4" /> },
  { id: 'other', label: 'Other', icon: <Key className="w-4 h-4" /> },
];

const SOCIAL_MEDIA_OPTIONS = [
  { value: 'memorialize', label: 'Memorialize (keep as memorial)' },
  { value: 'delete', label: 'Delete after downloading data' },
  { value: 'decide', label: 'Let them decide' },
  { value: 'custom', label: 'Custom instructions' },
];

const DOC_CHECKLIST = [
  { id: 'will', label: 'Will / estate documents', icon: '📄' },
  { id: 'insurance', label: 'Insurance policies (life, health, auto, home)', icon: '📄' },
  { id: 'tax', label: 'Tax returns / financial records', icon: '📄' },
  { id: 'identity', label: 'Birth certificate / passport / ID', icon: '📄' },
  { id: 'property', label: 'Property deeds / vehicle titles', icon: '📄' },
  { id: 'medical', label: 'Medical records / advance directive', icon: '📄' },
  { id: 'photos', label: 'Photos & videos that matter most', icon: '📋' },
  { id: 'sentimental', label: 'Sentimental digital files (journals, creative work)', icon: '📋' },
];

const FOLLOW_UP_PROMPTS = [
  "Do you have any cryptocurrency or digital wallets?",
  "What about cloud storage — Google Drive, Dropbox, iCloud? There might be photos or documents they'd want.",
  "Any subscriptions that should be cancelled to avoid ongoing charges? Streaming, gym, SaaS tools?",
  "Work accounts that need to be handed off or deactivated?",
  "Medical patient portals or insurance accounts?",
  "Social media — do you want profiles memorialized, deleted, or left alone?",
];

const AI_SYSTEM_PROMPT = `You are the AI assistant inside FinalWish, a digital legacy planning tool. Your role is to help users organize their digital life and write meaningful messages for their loved ones.

TONE: Warm, grounded, practical. Not morbid. Not overly cheerful. Think "a kind friend who's good at organizing" — someone who makes a hard task feel manageable.

WHEN HELPING WRITE MESSAGES:
- Write in the user's voice, not yours. Use their words, their level of formality, their humor.
- Favor specific details over generic sentiment.
- Don't add flourishes the user didn't express. If they're matter-of-fact, be matter-of-fact.
- Keep the emotional register honest — don't inflate feelings the user didn't express.
- It's okay for messages to be short. A genuine 3-sentence message beats a flowery page.

WHEN PARSING ACCOUNTS/ITEMS:
- Extract structured data from free-text responses.
- Auto-categorize intelligently.
- Don't ask for information the user shouldn't put in this document (actual passwords, SSNs, PINs).

FORMAT: Always respond in valid JSON matching the schema requested. No markdown fences, no preamble. Pure JSON only.`;

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const FinalWish = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const exportRef = useRef(null);

  // Navigation
  const [screen, setScreen] = useState('welcome'); // welcome | guided | manual | chapter
  const [currentChapter, setCurrentChapter] = useState(0);

  // Welcome
  const [trustedPerson, setTrustedPerson] = useState('');
  const [userName, setUserName] = useState('');

  // Chapter 1: Accounts
  const [accounts, setAccounts] = useState([]);
  const [accountDump, setAccountDump] = useState('');
  const [accountFollowUpIndex, setAccountFollowUpIndex] = useState(0);
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  // Chapter 2: Documents
  const [documents, setDocuments] = useState({});
  const [docNotes, setDocNotes] = useState('');

  // Chapter 3: Financial
  const [financialAccounts, setFinancialAccounts] = useState([]);
  const [financialDump, setFinancialDump] = useState('');
  const [recurringBills, setRecurringBills] = useState('');

  // Chapter 4: Messages
  const [messages, setMessages] = useState([]);
  const [messageRecipient, setMessageRecipient] = useState('');
  const [activeMessageIndex, setActiveMessageIndex] = useState(null);
  const [messageInterview, setMessageInterview] = useState({ relationship: '', whatToKnow: '', memories: '', tone: 'warm' });
  const [messageStep, setMessageStep] = useState(0); // 0=name, 1=relationship, 2=whatToKnow, 3=memories+tone, 4=draft
  const [editingDraft, setEditingDraft] = useState(false);

  // Chapter 5: Wishes
  const [pets, setPets] = useState([]);
  const [homeNotes, setHomeNotes] = useState('');
  const [deviceNotes, setDeviceNotes] = useState('');
  const [memorialWishes, setMemorialWishes] = useState('');
  const [showMemorial, setShowMemorial] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');

  // UI
  const [aiError, setAiError] = useState('');
  const [chapterComplete, setChapterComplete] = useState({});

  // ══════════════════════════════════════════
  // AI HELPERS
  // ══════════════════════════════════════════
  const callAI = useCallback(async (prompt, maxTokens = 2000) => {
    setAiError('');
    try {
      const res = await callToolEndpoint('claude', {
        prompt,
        systemPrompt: AI_SYSTEM_PROMPT,
        maxTokens
      });
      return res.response;
    } catch (e) {
      setAiError(e.message || 'AI request failed. Please try again.');
      return null;
    }
  }, [callToolEndpoint]);

  const parseJSON = useCallback((text) => {
    if (!text) return null;
    try {
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      setAiError('Failed to parse AI response. Please try again.');
      return null;
    }
  }, []);

  // ══════════════════════════════════════════
  // CHAPTER 1: Parse accounts from free text
  // ══════════════════════════════════════════
  const parseAccountDump = useCallback(async () => {
    if (!accountDump.trim()) return;
    const tp = trustedPerson || 'your trusted person';
    const raw = await callAI(`The user is creating a digital legacy document for "${tp}". They described their important accounts:

"${accountDump}"

Extract each account/service mentioned. For each, determine:
- name: the service name
- category: one of: financial, email, social, cloud, subscription, work, medical, other
- priority: one of: critical, important, nice-to-have
- accessNotes: any access hints they mentioned (NOT actual passwords)
- isSocialMedia: boolean

Return JSON array: [{ "name": "...", "category": "...", "priority": "...", "accessNotes": "...", "isSocialMedia": false }]

If no clear accounts found, return an empty array.`, 1500);

    const parsed = parseJSON(raw);
    if (parsed && Array.isArray(parsed)) {
      const newAccounts = parsed.map((a, i) => ({
        id: `acc_${Date.now()}_${i}`,
        name: a.name || 'Unknown',
        category: a.category || 'other',
        priority: a.priority || 'important',
        accessNotes: a.accessNotes || '',
        isSocialMedia: a.isSocialMedia || false,
        socialWish: 'decide',
        socialCustom: '',
      }));
      setAccounts(prev => [...prev, ...newAccounts]);
      setAccountDump('');
      setShowFollowUps(true);
    }
  }, [accountDump, callAI, parseJSON, trustedPerson]);

  const parseFollowUpAnswer = useCallback(async () => {
    if (!followUpAnswer.trim()) {
      setAccountFollowUpIndex(prev => prev + 1);
      setFollowUpAnswer('');
      return;
    }
    const existingNames = accounts.map(a => a.name).join(', ');
    const raw = await callAI(`The user was asked: "${FOLLOW_UP_PROMPTS[accountFollowUpIndex]}"
They answered: "${followUpAnswer}"
They already have these accounts listed: ${existingNames || 'none yet'}

Extract any NEW accounts/services mentioned that aren't already listed. Return JSON array:
[{ "name": "...", "category": "...", "priority": "...", "accessNotes": "...", "isSocialMedia": false }]

If nothing new, return [].`, 1000);

    const parsed = parseJSON(raw);
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      const newAccounts = parsed.map((a, i) => ({
        id: `acc_${Date.now()}_${i}`,
        name: a.name || 'Unknown',
        category: a.category || 'other',
        priority: a.priority || 'important',
        accessNotes: a.accessNotes || '',
        isSocialMedia: a.isSocialMedia || false,
        socialWish: 'decide',
        socialCustom: '',
      }));
      setAccounts(prev => [...prev, ...newAccounts]);
    }
    setAccountFollowUpIndex(prev => prev + 1);
    setFollowUpAnswer('');
  }, [followUpAnswer, accountFollowUpIndex, accounts, callAI, parseJSON]);

  // ══════════════════════════════════════════
  // CHAPTER 3: Parse financial from free text
  // ══════════════════════════════════════════
  const parseFinancialDump = useCallback(async () => {
    if (!financialDump.trim()) return;
    const raw = await callAI(`The user described their financial accounts for a digital legacy document:

"${financialDump}"

Extract each financial item. Categorize as: bank, investment, debt, income, insurance.
Return JSON array: [{ "name": "...", "type": "...", "institution": "...", "notes": "..." }]`, 1500);

    const parsed = parseJSON(raw);
    if (parsed && Array.isArray(parsed)) {
      const items = parsed.map((f, i) => ({
        id: `fin_${Date.now()}_${i}`,
        name: f.name || 'Unknown',
        type: f.type || 'bank',
        institution: f.institution || '',
        notes: f.notes || '',
      }));
      setFinancialAccounts(prev => [...prev, ...items]);
      setFinancialDump('');
    }
  }, [financialDump, callAI, parseJSON]);

  // ══════════════════════════════════════════
  // CHAPTER 4: Generate message draft
  // ══════════════════════════════════════════
  const generateMessageDraft = useCallback(async (msgIndex) => {
    const msg = messages[msgIndex];
    if (!msg) return;
    const tp = trustedPerson || 'someone';
    const raw = await callAI(`Write a personal message from the user to "${msg.recipientName}".

Context:
- Relationship: ${msg.relationship}
- What the user wants them to know: ${msg.whatToKnow}
- Specific memories/references: ${msg.memories || 'none provided'}
- Desired tone: ${msg.tone}
- The user's name: ${userName || 'not provided'}
- This is part of a legacy document prepared for ${tp}

Write the message in the user's voice based on what they shared. Be specific, not generic. Use their words and details. Keep it authentic — don't inflate emotions beyond what was expressed.

Return JSON: { "draft": "the message text", "lengthWords": number }`, 1500);

    const parsed = parseJSON(raw);
    if (parsed && parsed.draft) {
      setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, draft: parsed.draft, hasDraft: true } : m));
      setMessageStep(4);
    }
  }, [messages, callAI, parseJSON, trustedPerson, userName]);

  const adjustMessage = useCallback(async (msgIndex, adjustment) => {
    const msg = messages[msgIndex];
    if (!msg?.draft) return;
    const raw = await callAI(`Adjust this personal legacy message. Adjustment requested: "${adjustment}"

Original message:
"${msg.draft}"

Context: Written to ${msg.recipientName} (${msg.relationship}). Tone: ${msg.tone}.

Return JSON: { "draft": "the adjusted message text" }`, 1500);

    const parsed = parseJSON(raw);
    if (parsed && parsed.draft) {
      setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, draft: parsed.draft } : m));
    }
  }, [messages, callAI, parseJSON]);

  // ══════════════════════════════════════════
  // CHAPTER NAVIGATION
  // ══════════════════════════════════════════
  const goToChapter = useCallback((idx) => {
    setCurrentChapter(idx);
    setScreen('chapter');
    setAiError('');
  }, []);

  const nextChapter = useCallback(() => {
    setChapterComplete(prev => ({ ...prev, [currentChapter]: true }));
    if (currentChapter < CHAPTERS.length - 1) {
      setCurrentChapter(prev => prev + 1);
    }
    setAiError('');
  }, [currentChapter]);

  const prevChapter = useCallback(() => {
    if (currentChapter > 0) setCurrentChapter(prev => prev - 1);
    setAiError('');
  }, [currentChapter]);

  // ══════════════════════════════════════════
  // ACCOUNT HELPERS
  // ══════════════════════════════════════════
  const updateAccount = useCallback((id, field, value) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  }, []);

  const removeAccount = useCallback((id) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  }, []);

  const addManualAccount = useCallback(() => {
    setAccounts(prev => [...prev, {
      id: `acc_${Date.now()}`,
      name: '',
      category: 'other',
      priority: 'important',
      accessNotes: '',
      isSocialMedia: false,
      socialWish: 'decide',
      socialCustom: '',
    }]);
  }, []);

  // ══════════════════════════════════════════
  // FINANCIAL HELPERS
  // ══════════════════════════════════════════
  const addManualFinancial = useCallback(() => {
    setFinancialAccounts(prev => [...prev, {
      id: `fin_${Date.now()}`,
      name: '',
      type: 'bank',
      institution: '',
      notes: '',
    }]);
  }, []);

  const updateFinancial = useCallback((id, field, value) => {
    setFinancialAccounts(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  }, []);

  const removeFinancial = useCallback((id) => {
    setFinancialAccounts(prev => prev.filter(f => f.id !== id));
  }, []);

  // ══════════════════════════════════════════
  // MESSAGE HELPERS
  // ══════════════════════════════════════════
  const startNewMessage = useCallback(() => {
    if (!messageRecipient.trim()) return;
    const newMsg = {
      recipientName: messageRecipient.trim(),
      relationship: '',
      whatToKnow: '',
      memories: '',
      tone: 'warm',
      draft: '',
      hasDraft: false,
    };
    setMessages(prev => [...prev, newMsg]);
    setActiveMessageIndex(messages.length);
    setMessageStep(1);
    setMessageRecipient('');
    setEditingDraft(false);
    setMessageInterview({ relationship: '', whatToKnow: '', memories: '', tone: 'warm' });
  }, [messageRecipient, messages.length]);

  const updateMessageField = useCallback((idx, field, value) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }, []);

  const removeMessage = useCallback((idx) => {
    setMessages(prev => prev.filter((_, i) => i !== idx));
    setActiveMessageIndex(null);
    setMessageStep(0);
  }, []);

  // ══════════════════════════════════════════
  // PET HELPERS
  // ══════════════════════════════════════════
  const addPet = useCallback(() => {
    setPets(prev => [...prev, { id: `pet_${Date.now()}`, name: '', type: '', careNotes: '', guardian: '', vetInfo: '' }]);
  }, []);

  const updatePet = useCallback((id, field, value) => {
    setPets(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }, []);

  const removePet = useCallback((id) => {
    setPets(prev => prev.filter(p => p.id !== id));
  }, []);

  // ══════════════════════════════════════════
  // EXPORT: Generate HTML document
  // ══════════════════════════════════════════
  const generateExportHTML = useCallback(() => {
    const tp = trustedPerson || 'My Trusted Person';
    const un = userName || 'Me';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const priorityLabel = (p) => p === 'critical' ? '🔴 Critical' : p === 'important' ? '🟡 Important' : '🟢 Nice-to-have';
    const catLabel = (c) => ACCOUNT_CATEGORIES.find(x => x.id === c)?.label || c;
    const finTypeLabel = (t) => ({ bank: 'Bank', investment: 'Investment/Retirement', debt: 'Debt', income: 'Income Source', insurance: 'Insurance' })[t] || t;

    const socialWishLabel = (v) => SOCIAL_MEDIA_OPTIONS.find(o => o.value === v)?.label || v;

    const accountsHTML = accounts.length > 0 ? `
      <h2>1. Digital Accounts</h2>
      <p class="count">${accounts.length} accounts documented</p>
      <table>
        <thead><tr><th>Service</th><th>Category</th><th>Priority</th><th>Access Notes</th></tr></thead>
        <tbody>
          ${accounts.map(a => `<tr>
            <td><strong>${a.name}</strong>${a.isSocialMedia ? `<br><em style="color:#888;font-size:0.85em">Social media wish: ${socialWishLabel(a.socialWish)}${a.socialWish === 'custom' ? ' — ' + a.socialCustom : ''}</em>` : ''}</td>
            <td>${catLabel(a.category)}</td>
            <td>${priorityLabel(a.priority)}</td>
            <td>${a.accessNotes || '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : '';

    const docsChecked = Object.entries(documents).filter(([_, v]) => v.checked);
    const docsHTML = docsChecked.length > 0 || docNotes ? `
      <h2>2. Important Documents & Files</h2>
      ${docsChecked.length > 0 ? `<table>
        <thead><tr><th>Document</th><th>Location</th></tr></thead>
        <tbody>${docsChecked.map(([id, v]) => `<tr><td>${DOC_CHECKLIST.find(d => d.id === id)?.label || id}</td><td>${v.location || '—'}</td></tr>`).join('')}</tbody>
      </table>` : ''}
      ${docNotes ? `<div class="note"><strong>Additional notes:</strong> ${docNotes}</div>` : ''}` : '';

    const finHTML = financialAccounts.length > 0 || recurringBills ? `
      <h2>3. Financial Overview</h2>
      <p class="disclaimer">Note: This is a high-level map of what exists, not a financial document. No account numbers or balances are included.</p>
      ${financialAccounts.length > 0 ? `<table>
        <thead><tr><th>Account</th><th>Type</th><th>Institution</th><th>Notes</th></tr></thead>
        <tbody>${financialAccounts.map(f => `<tr><td>${f.name}</td><td>${finTypeLabel(f.type)}</td><td>${f.institution || '—'}</td><td>${f.notes || '—'}</td></tr>`).join('')}</tbody>
      </table>` : ''}
      ${recurringBills ? `<div class="note"><strong>Recurring bills / auto-pay:</strong> ${recurringBills}</div>` : ''}` : '';

    const msgsHTML = messages.filter(m => m.draft).length > 0 ? `
      <h2>4. Personal Messages</h2>
      ${messages.filter(m => m.draft).map(m => `
        <div class="letter">
          <h3>To: ${m.recipientName}</h3>
          <p class="relationship">${m.relationship}</p>
          <div class="letter-body">${m.draft.replace(/\n/g, '<br>')}</div>
        </div>
      `).join('')}` : '';

    const wishesItems = [];
    if (pets.length > 0) {
      wishesItems.push(`<h3>Pets</h3>` + pets.map(p => `<div class="note"><strong>${p.name || 'Pet'}</strong> (${p.type || 'type not specified'})<br>Guardian: ${p.guardian || '—'}<br>Care notes: ${p.careNotes || '—'}<br>Vet: ${p.vetInfo || '—'}</div>`).join(''));
    }
    if (homeNotes) wishesItems.push(`<h3>Home & Property</h3><div class="note">${homeNotes}</div>`);
    if (deviceNotes) wishesItems.push(`<h3>Devices</h3><div class="note">${deviceNotes}</div>`);
    if (memorialWishes) wishesItems.push(`<h3>Memorial Preferences</h3><div class="note">${memorialWishes}</div>`);
    if (specialRequests) wishesItems.push(`<h3>Special Requests</h3><div class="note">${specialRequests}</div>`);
    const wishesHTML = wishesItems.length > 0 ? `<h2>5. Practical Wishes & Instructions</h2>${wishesItems.join('')}` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FinalWish — Prepared for ${tp}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', sans-serif; color: #1c1917; line-height: 1.7; padding: 40px; max-width: 800px; margin: 0 auto; }
  .cover { text-align: center; padding: 80px 20px; page-break-after: always; }
  .cover h1 { font-family: 'Crimson Pro', serif; font-size: 2.8em; font-weight: 600; color: #292524; margin-bottom: 8px; }
  .cover .sub { font-size: 1.1em; color: #78716c; margin-bottom: 40px; }
  .cover .meta { font-size: 0.95em; color: #a8a29e; }
  .intro { background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 24px; margin: 30px 0; font-style: italic; color: #92400e; }
  h2 { font-family: 'Crimson Pro', serif; font-size: 1.8em; color: #292524; margin: 40px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e7e5e4; page-break-before: always; }
  h2:first-of-type { page-break-before: avoid; }
  h3 { font-size: 1.1em; color: #44403c; margin: 20px 0 8px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.9em; }
  th { background: #f5f5f4; text-align: left; padding: 10px 12px; border: 1px solid #e7e5e4; font-weight: 600; }
  td { padding: 10px 12px; border: 1px solid #e7e5e4; vertical-align: top; }
  .count { font-size: 0.85em; color: #78716c; margin-bottom: 12px; }
  .disclaimer { font-size: 0.85em; color: #78716c; font-style: italic; margin-bottom: 12px; }
  .note { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; margin: 12px 0; font-size: 0.95em; }
  .letter { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 28px; margin: 20px 0; page-break-inside: avoid; }
  .letter h3 { font-family: 'Crimson Pro', serif; font-size: 1.4em; color: #92400e; margin: 0 0 4px; }
  .letter .relationship { font-size: 0.85em; color: #a8a29e; margin-bottom: 16px; }
  .letter-body { font-family: 'Crimson Pro', serif; font-size: 1.1em; line-height: 1.8; color: #1c1917; white-space: pre-wrap; }
  .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #e7e5e4; font-size: 0.85em; color: #a8a29e; }
  @media print { body { padding: 20px; } .cover { padding: 120px 20px; } h2 { page-break-before: always; } .letter { page-break-inside: avoid; } }
</style>
</head>
<body>
  <div class="cover">
    <h1>📜 FinalWish</h1>
    <p class="sub">A Digital Legacy Document</p>
    <p class="meta">Prepared by <strong>${un}</strong> for <strong>${tp}</strong></p>
    <p class="meta">${date}</p>
  </div>
  <div class="intro">
    Dear ${tp} — if you're reading this, here's everything I organized to make things easier for you. Start with whichever section is most urgent and take it one step at a time. I tried to be thorough. — ${un}
  </div>
  ${accountsHTML}
  ${docsHTML}
  ${finHTML}
  ${msgsHTML}
  ${wishesHTML}
  <div class="footer">
    <p>Prepared on ${date} using FinalWish</p>
    <p>This document does not constitute a legal will or binding directive. Consult an attorney for legal estate planning.</p>
    <p style="margin-top:8px">💡 Consider reviewing and updating this document annually or after major life changes.</p>
  </div>
</body>
</html>`;
  }, [accounts, documents, docNotes, financialAccounts, recurringBills, messages, pets, homeNotes, deviceNotes, memorialWishes, specialRequests, trustedPerson, userName]);

  const downloadDocument = useCallback(() => {
    const html = generateExportHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (trustedPerson || 'trusted-person').replace(/[^a-zA-Z0-9]/g, '-');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `FinalWish-for-${safeName}-${date}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generateExportHTML, trustedPerson]);

  const printDocument = useCallback(() => {
    const html = generateExportHTML();
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  }, [generateExportHTML]);

  // ══════════════════════════════════════════
  // COMPLETENESS
  // ══════════════════════════════════════════
  const getChapterStatus = useCallback((idx) => {
    switch (idx) {
      case 0: return accounts.length > 0 ? 'done' : 'empty';
      case 1: return Object.values(documents).some(v => v.checked) || docNotes ? 'done' : 'empty';
      case 2: return financialAccounts.length > 0 || recurringBills ? 'done' : 'empty';
      case 3: return messages.some(m => m.hasDraft) ? 'done' : 'empty';
      case 4: return pets.length > 0 || homeNotes || deviceNotes || specialRequests ? 'done' : 'empty';
      case 5: return 'empty';
      default: return 'empty';
    }
  }, [accounts, documents, docNotes, financialAccounts, recurringBills, messages, pets, homeNotes, deviceNotes, specialRequests]);

  // ══════════════════════════════════════════
  // RENDER HELPERS
  // ══════════════════════════════════════════
  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-2">
        {CHAPTERS.map((ch, i) => {
          const status = getChapterStatus(i);
          const isCurrent = i === currentChapter;
          return (
            <button key={ch.id} onClick={() => goToChapter(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all
                ${isCurrent ? `${c.btn} shadow-md` : status === 'done' ? `${c.successBg} border` : `${c.bgInset} ${c.textMut} ${c.bgHover}`}`}>
              {status === 'done' && !isCurrent && <Check className="w-3 h-3" />}
              <span>{ch.icon}</span>
              <span className="hidden sm:inline">{ch.short}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-1">
        {CHAPTERS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= currentChapter ? c.progressDone : c.progressPending}`} />
        ))}
      </div>
    </div>
  );

  const renderNavButtons = (skipLabel) => (
    <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: c.d ? '#3f3f46' : '#e7e5e4' }}>
      {currentChapter > 0 ? (
        <button onClick={prevChapter} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${c.btnSec}`}>
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
      ) : <div />}
      <button onClick={nextChapter} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold ${c.btn}`}>
        {currentChapter === CHAPTERS.length - 2 ? 'Review & Export' : (skipLabel || 'Continue')} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderError = () => aiError ? (
    <div className={`mt-4 p-4 ${c.errBg} border rounded-xl flex items-start gap-3`}>
      <AlertCircle className={`w-5 h-5 ${c.errText} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm ${c.errText}`}>{aiError}</p>
    </div>
  ) : null;

  const renderLoading = (msg) => (
    <div className="flex items-center gap-3 py-6 justify-center">
      <Loader2 className={`w-5 h-5 ${c.accent} animate-spin`} />
      <span className={`text-sm ${c.textSec} animate-pulse`}>{msg || 'Thinking...'}</span>
    </div>
  );

  // ══════════════════════════════════════════
  // SCREEN: WELCOME
  // ══════════════════════════════════════════
  const renderWelcome = () => (
    <div className={c.text}>
      <div className="flex items-center gap-3 mb-6">
        <h2 className={`text-2xl font-bold ${c.text}`}>FinalWish 📜</h2>
      </div>
      <p className={`text-sm ${c.textMut} mb-1`}>Organize what matters. Say what needs to be said.</p>

      <div className={`my-6 p-5 rounded-2xl border-2 ${c.borderWarm} ${c.bgWarm}`}>
        <p className={`text-sm leading-relaxed ${c.textWarm}`}>
          This isn't about dying — it's about caring. Most of us have a tangle of accounts, photos, subscriptions, and unspoken gratitude that would be nearly impossible for someone else to navigate. FinalWish helps you organize it all into a single document you can hand to someone you trust. Takes about 15–30 minutes. Nothing is stored — you'll download everything at the end.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>Your Name</label>
          <input type="text" value={userName} onChange={e => setUserName(e.target.value)}
            placeholder="How you'd sign a letter"
            className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none transition-colors`} />
        </div>
        <div>
          <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>Who is this document for?</label>
          <input type="text" value={trustedPerson} onChange={e => setTrustedPerson(e.target.value)}
            placeholder='e.g. "My partner Alex", "My sister Maria"'
            className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none transition-colors`} />
          <p className={`text-xs ${c.textMut} mt-1.5`}>This name will be woven throughout the document to make it personal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={() => { setScreen('chapter'); setCurrentChapter(0); }}
          disabled={!trustedPerson.trim()}
          className={`group p-5 rounded-2xl border-2 text-left transition-all ${trustedPerson.trim() ? `${c.border} ${c.bgHover} hover:border-amber-400` : `${c.border} opacity-50 cursor-not-allowed`}`}>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className={`w-5 h-5 ${c.accent}`} />
            <span className={`text-sm font-bold ${c.text}`}>Guide Me Through It</span>
          </div>
          <p className={`text-xs ${c.textMut}`}>AI-guided interview, step by step. Recommended for first time.</p>
        </button>
        <button onClick={() => { setScreen('chapter'); setCurrentChapter(0); }}
          disabled={!trustedPerson.trim()}
          className={`group p-5 rounded-2xl border-2 text-left transition-all ${trustedPerson.trim() ? `${c.border} ${c.bgHover} hover:border-amber-400` : `${c.border} opacity-50 cursor-not-allowed`}`}>
          <div className="flex items-center gap-2 mb-2">
            <Edit3 className={`w-5 h-5 ${c.textSec}`} />
            <span className={`text-sm font-bold ${c.text}`}>I Know What I Need</span>
          </div>
          <p className={`text-xs ${c.textMut}`}>Jump to any section. Fill in what you want, skip the rest.</p>
        </button>
      </div>

      <p className={`text-xs ${c.textMut} mt-6 text-center`}>
        ⚠️ This is not a legal document and does not replace a will. Consult an attorney for legal estate planning.
      </p>
    </div>
  );

  // ══════════════════════════════════════════
  // CHAPTER 1: ACCOUNTS
  // ══════════════════════════════════════════
  const renderChapterAccounts = () => {
    const tp = trustedPerson || 'your trusted person';
    return (
      <div>
        <h3 className={`text-lg font-bold ${c.text} mb-1`}>🔑 Digital Accounts & Access</h3>
        <p className={`text-sm ${c.textSec} mb-5`}>What accounts would {tp} need to know about?</p>

        {accounts.length === 0 && !showFollowUps && (
          <div className={`p-5 rounded-2xl border-2 ${c.borderWarm} ${c.bgWarm} mb-5`}>
            <p className={`text-sm ${c.textWarm} mb-3`}>
              Let's start with the accounts that matter most. Don't worry about being complete — we'll catch what you miss. What are the 3–5 accounts {tp} would need?
            </p>
            <textarea value={accountDump} onChange={e => setAccountDump(e.target.value)}
              placeholder="e.g. My Gmail (john@gmail.com), Chase bank account, Netflix subscription, Instagram — password is in my phone notes app..."
              rows={4} className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none mb-3`} />
            <button onClick={parseAccountDump} disabled={loading || !accountDump.trim()}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold ${accountDump.trim() && !loading ? c.btn : c.btnDis}`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 inline mr-2" />Extract Accounts</>}
            </button>
          </div>
        )}

        {loading && accounts.length === 0 && renderLoading('Extracting your accounts...')}

        {accounts.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold ${c.textSec} uppercase`}>{accounts.length} accounts</span>
              <button onClick={addManualAccount} className={`flex items-center gap-1.5 text-xs font-semibold ${c.accent}`}>
                <Plus className="w-3.5 h-3.5" /> Add manually
              </button>
            </div>
            <div className="space-y-3">
              {accounts.map(acc => (
                <div key={acc.id} className={`p-4 rounded-xl border ${c.border} ${c.bgCard}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <input type="text" value={acc.name} onChange={e => updateAccount(acc.id, 'name', e.target.value)}
                        placeholder="Service name" className={`w-full px-3 py-1.5 rounded-lg border text-sm font-semibold ${c.input} outline-none`} />
                      <div className="flex flex-wrap gap-2">
                        <select value={acc.category} onChange={e => updateAccount(acc.id, 'category', e.target.value)}
                          className={`px-2 py-1 rounded-lg border text-xs ${c.input} outline-none`}>
                          {ACCOUNT_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                        </select>
                        <select value={acc.priority} onChange={e => updateAccount(acc.id, 'priority', e.target.value)}
                          className={`px-2 py-1 rounded-lg border text-xs ${c.input} outline-none`}>
                          <option value="critical">🔴 Critical</option>
                          <option value="important">🟡 Important</option>
                          <option value="nice-to-have">🟢 Nice-to-have</option>
                        </select>
                      </div>
                      <input type="text" value={acc.accessNotes} onChange={e => updateAccount(acc.id, 'accessNotes', e.target.value)}
                        placeholder="Access notes (e.g. password in blue notebook, use phone Face ID)"
                        className={`w-full px-3 py-1.5 rounded-lg border text-xs ${c.input} outline-none`} />
                      {acc.isSocialMedia && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {SOCIAL_MEDIA_OPTIONS.map(opt => (
                            <button key={opt.value} onClick={() => updateAccount(acc.id, 'socialWish', opt.value)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${acc.socialWish === opt.value ? (c.d ? 'border-amber-500 bg-amber-900/30 text-amber-300' : 'border-amber-400 bg-amber-50 text-amber-700') : `${c.border} ${c.textMut}`}`}>
                              {opt.label}
                            </button>
                          ))}
                          {acc.socialWish === 'custom' && (
                            <input type="text" value={acc.socialCustom || ''} onChange={e => updateAccount(acc.id, 'socialCustom', e.target.value)}
                              placeholder="Custom instructions..." className={`flex-1 min-w-[150px] px-2.5 py-1 rounded-lg border text-xs ${c.input} outline-none`} />
                          )}
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeAccount(acc.id)} className={`p-1.5 rounded-lg ${c.bgHover} ${c.textMut} hover:text-red-500`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showFollowUps && accountFollowUpIndex < FOLLOW_UP_PROMPTS.length && !loading && (
          <div className={`p-5 rounded-2xl border-2 ${c.borderWarm} ${c.bgWarm} mb-5`}>
            <p className={`text-sm font-semibold ${c.textWarm} mb-3`}>{FOLLOW_UP_PROMPTS[accountFollowUpIndex]}</p>
            <textarea value={followUpAnswer} onChange={e => setFollowUpAnswer(e.target.value)}
              placeholder="Type here, or leave blank to skip..." rows={2}
              className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none mb-3`} />
            <div className="flex gap-2">
              <button onClick={parseFollowUpAnswer} className={`px-4 py-2 rounded-xl text-sm font-bold ${c.btn}`}>
                {followUpAnswer.trim() ? 'Add & Continue' : 'Skip'}
              </button>
              <button onClick={() => setShowFollowUps(false)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${c.btnGhost}`}>
                Done with accounts
              </button>
            </div>
          </div>
        )}

        {loading && accounts.length > 0 && renderLoading('Processing...')}
        {showFollowUps && accountFollowUpIndex >= FOLLOW_UP_PROMPTS.length && (
          <div className={`p-4 rounded-xl ${c.successBg} border mb-5`}>
            <p className={`text-sm font-semibold flex items-center gap-2 ${c.d ? 'text-emerald-300' : 'text-emerald-800'}`}><CheckCircle2 className="w-4 h-4" /> All follow-up questions covered! Review your accounts above and continue.</p>
          </div>
        )}

        {renderError()}
        {renderNavButtons(accounts.length === 0 ? 'Skip for now' : undefined)}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // CHAPTER 2: DOCUMENTS
  // ══════════════════════════════════════════
  const renderChapterDocuments = () => {
    const tp = trustedPerson || 'your trusted person';
    return (
      <div>
        <h3 className={`text-lg font-bold ${c.text} mb-1`}>📄 Important Documents & Files</h3>
        <p className={`text-sm ${c.textSec} mb-5`}>Where would {tp} find the things that matter?</p>

        <div className="space-y-3 mb-6">
          {DOC_CHECKLIST.map(doc => {
            const checked = documents[doc.id]?.checked || false;
            const location = documents[doc.id]?.location || '';
            return (
              <div key={doc.id} className={`p-4 rounded-xl border transition-all ${checked ? (c.d ? 'border-amber-700/40 bg-amber-900/10' : 'border-amber-200 bg-amber-50/50') : c.border}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => setDocuments(prev => ({ ...prev, [doc.id]: { ...prev[doc.id], checked: !checked } }))}
                    className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5 transition-all
                      ${checked ? 'bg-amber-500 border-amber-500 text-white' : c.border}`}>
                    {checked && <Check className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${checked ? c.text : c.textSec}`}>{doc.icon} {doc.label}</span>
                    {checked && (
                      <input type="text" value={location}
                        onChange={e => setDocuments(prev => ({ ...prev, [doc.id]: { ...prev[doc.id], location: e.target.value } }))}
                        placeholder="Where is it? (e.g. filing cabinet, Google Drive, safety deposit box)"
                        className={`w-full mt-2 px-3 py-2 rounded-lg border text-xs ${c.input} outline-none`} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>
            Anything else {tp} would need to find?
          </label>
          <textarea value={docNotes} onChange={e => setDocNotes(e.target.value)}
            placeholder="Keys, safe combinations, storage units, physical items..."
            rows={3} className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none`} />
        </div>

        {renderNavButtons()}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // CHAPTER 3: FINANCIAL
  // ══════════════════════════════════════════
  const renderChapterFinancial = () => {
    const tp = trustedPerson || 'your trusted person';
    return (
      <div>
        <h3 className={`text-lg font-bold ${c.text} mb-1`}>💰 Financial Snapshot</h3>
        <p className={`text-sm ${c.textSec} mb-2`}>A high-level map — not dollar amounts, just what exists and where.</p>
        <p className={`text-xs ${c.textMut} mb-5`}>
          You don't need actual account numbers or balances here. Just enough for {tp} to know what accounts exist and where to start.
        </p>

        {financialAccounts.length === 0 && (
          <div className={`p-5 rounded-2xl border-2 ${c.borderWarm} ${c.bgWarm} mb-5`}>
            <p className={`text-sm ${c.textWarm} mb-3`}>
              Describe your financial accounts in any format — bank accounts, investments, debts, insurance, income sources.
            </p>
            <textarea value={financialDump} onChange={e => setFinancialDump(e.target.value)}
              placeholder="e.g. Chase checking and savings, Fidelity 401k through work, mortgage with Wells Fargo, car loan with Capital One, State Farm for auto insurance..."
              rows={4} className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none mb-3`} />
            <button onClick={parseFinancialDump} disabled={loading || !financialDump.trim()}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold ${financialDump.trim() && !loading ? c.btn : c.btnDis}`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 inline mr-2" />Extract Accounts</>}
            </button>
          </div>
        )}

        {loading && financialAccounts.length === 0 && renderLoading('Organizing your finances...')}

        {financialAccounts.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold ${c.textSec} uppercase`}>{financialAccounts.length} items</span>
              <button onClick={addManualFinancial} className={`flex items-center gap-1.5 text-xs font-semibold ${c.accent}`}>
                <Plus className="w-3.5 h-3.5" /> Add manually
              </button>
            </div>
            <div className="space-y-3">
              {financialAccounts.map(fin => (
                <div key={fin.id} className={`p-4 rounded-xl border ${c.border} ${c.bgCard}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <input type="text" value={fin.name} onChange={e => updateFinancial(fin.id, 'name', e.target.value)}
                        placeholder="Account name" className={`w-full px-3 py-1.5 rounded-lg border text-sm font-semibold ${c.input} outline-none`} />
                      <div className="flex flex-wrap gap-2">
                        <select value={fin.type} onChange={e => updateFinancial(fin.id, 'type', e.target.value)}
                          className={`px-2 py-1 rounded-lg border text-xs ${c.input} outline-none`}>
                          <option value="bank">Bank Account</option>
                          <option value="investment">Investment / Retirement</option>
                          <option value="debt">Debt / Loan</option>
                          <option value="income">Income Source</option>
                          <option value="insurance">Insurance</option>
                        </select>
                        <input type="text" value={fin.institution} onChange={e => updateFinancial(fin.id, 'institution', e.target.value)}
                          placeholder="Institution" className={`flex-1 min-w-[120px] px-2 py-1 rounded-lg border text-xs ${c.input} outline-none`} />
                      </div>
                      <input type="text" value={fin.notes} onChange={e => updateFinancial(fin.id, 'notes', e.target.value)}
                        placeholder="Notes (how to access, contact info)" className={`w-full px-3 py-1.5 rounded-lg border text-xs ${c.input} outline-none`} />
                    </div>
                    <button onClick={() => removeFinancial(fin.id)} className={`p-1.5 rounded-lg ${c.bgHover} ${c.textMut} hover:text-red-500`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2 block`}>Recurring Bills / Auto-Pay</label>
          <textarea value={recurringBills} onChange={e => setRecurringBills(e.target.value)}
            placeholder="List auto-pay items that would need to be cancelled or transferred..."
            rows={3} className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none`} />
        </div>

        {renderError()}
        {renderNavButtons(financialAccounts.length === 0 ? 'Skip for now' : undefined)}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // CHAPTER 4: MESSAGES
  // ══════════════════════════════════════════
  const renderChapterMessages = () => {
    const tp = trustedPerson || 'your trusted person';

    const renderMessageList = () => (
      <div>
        <p className={`text-sm ${c.textSec} mb-5`}>
          Who would you want to receive a personal message from you? These can be short or long, serious or light.
        </p>

        {messages.length > 0 && (
          <div className="space-y-3 mb-5">
            {messages.map((msg, i) => (
              <button key={i} onClick={() => { setActiveMessageIndex(i); setMessageStep(msg.hasDraft ? 4 : 1); setEditingDraft(false); }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${c.envelopeBg} ${c.bgHover}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{msg.hasDraft ? '✉️' : '📝'}</span>
                  <div className="flex-1">
                    <span className={`text-sm font-bold ${c.text}`}>{msg.recipientName}</span>
                    {msg.relationship && <span className={`block text-xs ${c.textMut}`}>{msg.relationship}</span>}
                  </div>
                  {msg.hasDraft && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  <ChevronRight className={`w-4 h-4 ${c.textMut}`} />
                </div>
              </button>
            ))}
          </div>
        )}

        <div className={`p-4 rounded-xl border-2 border-dashed ${c.border}`}>
          <div className="flex gap-2">
            <input type="text" value={messageRecipient} onChange={e => setMessageRecipient(e.target.value)}
              placeholder="Recipient's name (e.g. Mom, Sarah, James)"
              onKeyDown={e => e.key === 'Enter' && startNewMessage()}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm ${c.input} outline-none`} />
            <button onClick={startNewMessage} disabled={!messageRecipient.trim()}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${messageRecipient.trim() ? c.btn : c.btnDis}`}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );

    const renderMessageInterview = () => {
      const idx = activeMessageIndex;
      const msg = messages[idx];
      if (!msg) return null;

      if (messageStep === 1) {
        return (
          <div className={`p-5 rounded-2xl border-2 ${c.borderWarm} ${c.bgWarm}`}>
            <p className={`text-sm font-semibold ${c.textWarm} mb-3`}>What's your relationship with {msg.recipientName}?</p>
            <input type="text" value={msg.relationship} onChange={e => updateMessageField(idx, 'relationship', e.target.value)}
              placeholder='e.g. "my daughter", "my best friend since college", "my business partner"'
              className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none mb-3`} />
            <button onClick={() => setMessageStep(2)} disabled={!msg.relationship.trim()}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold ${msg.relationship.trim() ? c.btn : c.btnDis}`}>
              Continue <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        );
      }

      if (messageStep === 2) {
        return (
          <div className={`p-5 rounded-2xl border-2 ${c.borderWarm} ${c.bgWarm}`}>
            <p className={`text-sm font-semibold ${c.textWarm} mb-3`}>What would you most want {msg.recipientName} to know?</p>
            <textarea value={msg.whatToKnow} onChange={e => updateMessageField(idx, 'whatToKnow', e.target.value)}
              placeholder="Just say what comes to mind — the AI will help shape it into a message..."
              rows={4} className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none mb-3`} />
            <button onClick={() => setMessageStep(3)} disabled={!msg.whatToKnow.trim()}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold ${msg.whatToKnow.trim() ? c.btn : c.btnDis}`}>
              Continue <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        );
      }

      if (messageStep === 3) {
        return (
          <div className={`p-5 rounded-2xl border-2 ${c.borderWarm} ${c.bgWarm}`}>
            <p className={`text-sm font-semibold ${c.textWarm} mb-3`}>
              Anything specific to reference — shared memories, inside jokes, advice for their future? <span className={`font-normal ${c.textMut}`}>(optional)</span>
            </p>
            <textarea value={msg.memories} onChange={e => updateMessageField(idx, 'memories', e.target.value)}
              placeholder="e.g. that road trip to Joshua Tree, the way they always make everyone laugh, tell them to keep painting..."
              rows={3} className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none mb-4`} />

            <p className={`text-xs font-bold ${c.textSec} uppercase tracking-wide mb-2`}>Tone</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {['warm', 'funny', 'heartfelt', 'direct', 'pep talk'].map(t => (
                <button key={t} onClick={() => updateMessageField(idx, 'tone', t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize
                    ${msg.tone === t ? (c.d ? 'border-amber-500 bg-amber-900/30 text-amber-300' : 'border-amber-400 bg-amber-50 text-amber-700') : `${c.border} ${c.textMut}`}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => generateMessageDraft(idx)} disabled={loading}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold ${!loading ? c.btn : c.btnDis}`}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <Sparkles className="w-4 h-4 inline mr-2" />}
                Draft My Message
              </button>
              <button onClick={() => { updateMessageField(idx, 'draft', ''); updateMessageField(idx, 'hasDraft', true); setMessageStep(4); setEditingDraft(true); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${c.btnGhost}`}>
                I'll write it myself
              </button>
            </div>
          </div>
        );
      }

      if (messageStep === 4 && msg.hasDraft) {
        return (
          <div>
            <div className={`p-6 rounded-2xl border-2 ${c.letterBg} mb-4`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className={`text-lg font-bold ${c.text}`} style={{ fontFamily: "'Georgia', serif" }}>To: {msg.recipientName}</h4>
                  <p className={`text-xs ${c.textMut}`}>{msg.relationship}</p>
                </div>
                <button onClick={() => setEditingDraft(!editingDraft)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${c.btnSec}`}>
                  <Edit3 className="w-3.5 h-3.5" /> {editingDraft ? 'Preview' : 'Edit'}
                </button>
              </div>
              {editingDraft ? (
                <textarea value={msg.draft} onChange={e => updateMessageField(idx, 'draft', e.target.value)}
                  rows={8} className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none`}
                  style={{ fontFamily: "'Georgia', serif", lineHeight: '1.8' }} />
              ) : (
                <div className={`text-sm leading-relaxed ${c.letterText} whitespace-pre-wrap`}
                  style={{ fontFamily: "'Georgia', serif", lineHeight: '1.8' }}>
                  {msg.draft}
                </div>
              )}
            </div>

            {!editingDraft && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => adjustMessage(idx, 'Make it shorter and more concise')} disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.btnSec}`}>Shorter</button>
                <button onClick={() => adjustMessage(idx, 'Make it longer with more detail and warmth')} disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.btnSec}`}>Longer</button>
                <button onClick={() => adjustMessage(idx, 'Make it less formal and more casual')} disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.btnSec}`}>Less formal</button>
                <button onClick={() => adjustMessage(idx, 'Make it more emotional and heartfelt')} disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.btnSec}`}>More heartfelt</button>
                <button onClick={() => generateMessageDraft(idx)} disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.btnSec}`}>
                  <RefreshCw className="w-3 h-3 inline mr-1" />Try different approach
                </button>
              </div>
            )}

            {loading && renderLoading('Adjusting your message...')}
          </div>
        );
      }

      return null;
    };

    return (
      <div>
        <h3 className={`text-lg font-bold ${c.text} mb-1`}>💌 Messages That Matter</h3>

        {activeMessageIndex !== null ? (
          <div>
            <button onClick={() => { setActiveMessageIndex(null); setMessageStep(0); }}
              className={`flex items-center gap-2 mb-5 text-sm font-semibold ${c.btnGhost}`}>
              <ChevronLeft className="w-4 h-4" /> Back to messages
            </button>
            {renderMessageInterview()}
            {renderError()}
          </div>
        ) : (
          <div>
            {renderMessageList()}
            {renderNavButtons(messages.length === 0 ? 'Skip for now' : undefined)}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════
  // CHAPTER 5: WISHES
  // ══════════════════════════════════════════
  const renderChapterWishes = () => (
    <div>
      <h3 className={`text-lg font-bold ${c.text} mb-1`}>🏠 Practical Wishes & Instructions</h3>
      <p className={`text-sm ${c.textSec} mb-5`}>Anything else that would help.</p>

      {/* Pets */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-bold ${c.text} flex items-center gap-2`}><PawPrint className="w-4 h-4" /> Pets</span>
          <button onClick={addPet} className={`flex items-center gap-1.5 text-xs font-semibold ${c.accent}`}>
            <Plus className="w-3.5 h-3.5" /> Add pet
          </button>
        </div>
        {pets.length === 0 && <p className={`text-xs ${c.textMut} mb-3`}>No pets added. Click "Add pet" if you have any.</p>}
        {pets.map(pet => (
          <div key={pet.id} className={`p-4 rounded-xl border ${c.border} ${c.bgCard} mb-3`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input type="text" value={pet.name} onChange={e => updatePet(pet.id, 'name', e.target.value)}
                  placeholder="Pet name" className={`px-3 py-1.5 rounded-lg border text-sm ${c.input} outline-none`} />
                <input type="text" value={pet.type} onChange={e => updatePet(pet.id, 'type', e.target.value)}
                  placeholder="Type (dog, cat...)" className={`px-3 py-1.5 rounded-lg border text-sm ${c.input} outline-none`} />
                <input type="text" value={pet.guardian} onChange={e => updatePet(pet.id, 'guardian', e.target.value)}
                  placeholder="Who should take them?" className={`col-span-2 px-3 py-1.5 rounded-lg border text-sm ${c.input} outline-none`} />
                <input type="text" value={pet.careNotes} onChange={e => updatePet(pet.id, 'careNotes', e.target.value)}
                  placeholder="Care notes" className={`col-span-2 px-3 py-1.5 rounded-lg border text-xs ${c.input} outline-none`} />
                <input type="text" value={pet.vetInfo} onChange={e => updatePet(pet.id, 'vetInfo', e.target.value)}
                  placeholder="Vet info" className={`col-span-2 px-3 py-1.5 rounded-lg border text-xs ${c.input} outline-none`} />
              </div>
              <button onClick={() => removePet(pet.id)} className={`p-1.5 rounded-lg ${c.bgHover} ${c.textMut} hover:text-red-500`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Home */}
      <div className="mb-6">
        <label className={`text-sm font-bold ${c.text} mb-2 block flex items-center gap-2`}><Home className="w-4 h-4" /> Home & Property</label>
        <textarea value={homeNotes} onChange={e => setHomeNotes(e.target.value)}
          placeholder="Immediate actions needed, spare keys location, security codes, storage units..."
          rows={3} className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none`} />
      </div>

      {/* Devices */}
      <div className="mb-6">
        <label className={`text-sm font-bold ${c.text} mb-2 block flex items-center gap-2`}><Smartphone className="w-4 h-4" /> Devices</label>
        <textarea value={deviceNotes} onChange={e => setDeviceNotes(e.target.value)}
          placeholder="Phone unlock method, laptop password location, what to do with hardware..."
          rows={3} className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none`} />
      </div>

      {/* Memorial */}
      <div className="mb-6">
        <button onClick={() => setShowMemorial(!showMemorial)}
          className={`flex items-center gap-2 text-sm font-semibold ${c.textSec} ${c.bgHover} px-3 py-2 rounded-lg transition-colors`}>
          {showMemorial ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <Music className="w-4 h-4" /> Funeral / Memorial Preferences <span className={`text-xs ${c.textMut}`}>(optional)</span>
        </button>
        {showMemorial && (
          <textarea value={memorialWishes} onChange={e => setMemorialWishes(e.target.value)}
            placeholder="Any specific wishes? Songs, readings, vibes? Or 'no strong preferences — let them decide'"
            rows={3} className={`w-full mt-3 px-4 py-3 rounded-xl border text-sm ${c.input} outline-none`} />
        )}
      </div>

      {/* Special Requests */}
      <div className="mb-4">
        <label className={`text-sm font-bold ${c.text} mb-2 block flex items-center gap-2`}><Star className="w-4 h-4" /> Special Requests</label>
        <p className={`text-xs ${c.textMut} mb-2`}>
          Things like "donate my book collection to the library" or "tell my coworkers I actually liked working with them" or "delete my browser history without looking."
        </p>
        <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
          placeholder="Whatever matters to you..."
          rows={3} className={`w-full px-4 py-3 rounded-xl border text-sm ${c.input} outline-none`} />
      </div>

      {renderNavButtons()}
    </div>
  );

  // ══════════════════════════════════════════
  // CHAPTER 6: REVIEW & EXPORT
  // ══════════════════════════════════════════
  const renderChapterReview = () => {
    const tp = trustedPerson || 'your trusted person';
    const sections = [
      { label: 'Digital Accounts', count: accounts.length, unit: 'accounts', chapter: 0 },
      { label: 'Documents & Files', count: Object.values(documents).filter(v => v.checked).length, unit: 'items', chapter: 1 },
      { label: 'Financial', count: financialAccounts.length, unit: 'accounts', chapter: 2 },
      { label: 'Personal Messages', count: messages.filter(m => m.hasDraft).length, unit: 'messages', chapter: 3 },
      { label: 'Practical Wishes', count: (pets.length > 0 ? 1 : 0) + (homeNotes ? 1 : 0) + (deviceNotes ? 1 : 0) + (specialRequests ? 1 : 0), unit: 'sections', chapter: 4 },
    ];
    const totalFilled = sections.filter(s => s.count > 0).length;

    return (
      <div>
        <h3 className={`text-lg font-bold ${c.text} mb-1`}>📋 Review & Export</h3>
        <p className={`text-sm ${c.textSec} mb-5`}>Your document for {tp} is ready to review.</p>

        {/* Completeness */}
        <div className={`p-5 rounded-2xl border ${c.border} ${c.bgCard} mb-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${totalFilled >= 4 ? c.successBg : c.bgInset}`}>
              {totalFilled}/5
            </div>
            <div>
              <p className={`text-sm font-bold ${c.text}`}>
                {totalFilled >= 4 ? 'Looking thorough!' : totalFilled >= 2 ? 'Good progress' : 'Just getting started'}
              </p>
              <p className={`text-xs ${c.textMut}`}>Sections completed</p>
            </div>
          </div>
          <div className="space-y-2">
            {sections.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className={`text-sm ${s.count > 0 ? c.text : c.textMut}`}>
                  {s.count > 0 ? <Check className="w-4 h-4 text-emerald-500 inline mr-2" /> : <span className="inline-block w-4 h-4 mr-2" />}
                  {s.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${c.textMut}`}>
                    {s.count > 0 ? `${s.count} ${s.unit}` : 'skipped'}
                  </span>
                  <button onClick={() => goToChapter(s.chapter)} className={`text-xs font-semibold ${c.accent}`}>
                    {s.count > 0 ? 'Edit' : 'Add'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Actions */}
        <div className="space-y-3 mb-6">
          <button onClick={downloadDocument}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold ${c.btn} shadow-lg`}>
            <Download className="w-5 h-5" /> Download as HTML Document
          </button>
          <button onClick={printDocument}
            className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-2xl text-sm font-semibold ${c.btnSec}`}>
            <Printer className="w-5 h-5" /> Print
          </button>
        </div>

        <p className={`text-xs ${c.textMut} text-center`}>
          The downloaded file is self-contained HTML — it opens in any browser and prints cleanly. No internet required to view it.
        </p>

        {/* Closing note */}
        <div className={`mt-6 p-5 rounded-2xl border-2 ${c.borderWarm} ${c.bgWarm}`}>
          <p className={`text-sm ${c.textWarm} leading-relaxed`}>
            You just did something most people never get around to. {tp} will be grateful you took the time. Consider reviewing this every year or after major life changes. Download your document now — nothing from this session is saved.
          </p>
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: c.d ? '#3f3f46' : '#e7e5e4' }}>
          <button onClick={prevChapter} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${c.btnSec}`}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <div />
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // CHAPTER ROUTER
  // ══════════════════════════════════════════
  const renderCurrentChapter = () => {
    switch (currentChapter) {
      case 0: return renderChapterAccounts();
      case 1: return renderChapterDocuments();
      case 2: return renderChapterFinancial();
      case 3: return renderChapterMessages();
      case 4: return renderChapterWishes();
      case 5: return renderChapterReview();
      default: return null;
    }
  };

  // ══════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════
  if (screen === 'welcome') {
    return renderWelcome();
  }

  return (
    <div className={c.text}>
      {renderProgressBar()}
      {renderCurrentChapter()}
    </div>
  );
};

FinalWish.displayName = 'FinalWish';
export default FinalWish;
