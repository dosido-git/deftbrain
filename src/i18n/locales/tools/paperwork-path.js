// PaperworkPath — pp_* keys for all 13 languages. Self-contained data.
// Brand/tool names (Paperwork Path, Renter's Deposit Saver, Bill Rescue,
// Final Wish) stay as-is across languages. pp_copy_header is the tool name.
// pp_example_location / pp_location_ph carry locale-plausible places per language.
export const paperworkPath = {
  en: {
    pp_title: "Paperwork Path",
    pp_tagline: "The documents you need — and the order to handle them",

    pp_event_label: "What life event are you handling?",
    pp_ev_move: "Moving",
    pp_ev_baby: "New baby",
    pp_ev_job: "New job",
    pp_ev_marriage: "Marriage",
    pp_ev_divorce: "Divorce",
    pp_ev_death: "Loss of a loved one",
    pp_ev_buyhome: "Buying a home",
    pp_ev_retire: "Retiring",

    pp_location_label: "Where are you? (optional — sharpens the specifics)",
    pp_location_ph: "e.g. Ohio, USA · Ontario, Canada · London, UK",

    pp_situation_label: "Anything specific about your situation? (optional)",
    pp_situation_ph: "e.g. Moving out of state with two kids and changing jobs at the same time",

    pp_build: "Build my path",
    pp_building: "Building your path…",
    pp_disclaimer: "General guidance — requirements vary by location and employer. Confirm the specifics for your jurisdiction.",
    pp_error: "Couldn't build your checklist. Please try again.",

    pp_recent: "Recent",

    pp_checklist_title: "Documents to gather",
    pp_order_title: "Your timeline",
    pp_cal_note_rel: "Weeks are counted from {{label}} (week 0). Negative = before, positive = after. Bars show each step’s window; numbers match the steps below.",
    pp_cal_event: "The event",
    pp_cal_week: "wk",
    pp_watch_title: "Easy to miss",
    pp_xref_pre: "Just moving? Protect your deposit first with",
    pp_related: "Related tools",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "DOCUMENTS TO GATHER:",
    pp_copy_where: "where",
    pp_copy_order: "ORDER TO HANDLE IT:",
    pp_copy_watch: "EASY TO MISS:",

    pp_example_situation: "Moving out of state with two kids and starting a new job the same month.",
    pp_example_location: "Austin, Texas, USA",
  },

  es: {
    pp_title: "Paperwork Path",
    pp_tagline: "Los documentos que necesitas — y el orden para gestionarlos",

    pp_event_label: "¿Qué evento de vida estás gestionando?",
    pp_ev_move: "Mudanza",
    pp_ev_baby: "Nuevo bebé",
    pp_ev_job: "Nuevo empleo",
    pp_ev_marriage: "Matrimonio",
    pp_ev_divorce: "Divorcio",
    pp_ev_death: "Pérdida de un ser querido",
    pp_ev_buyhome: "Compra de vivienda",
    pp_ev_retire: "Jubilación",

    pp_location_label: "¿Dónde estás? (opcional — afina los detalles)",
    pp_location_ph: "p. ej. Madrid, España · CDMX, México · Buenos Aires, Argentina",

    pp_situation_label: "¿Algo específico de tu situación? (opcional)",
    pp_situation_ph: "p. ej. Me mudo a otra región con dos hijos y cambio de trabajo a la vez",

    pp_build: "Crear mi ruta",
    pp_building: "Creando tu ruta…",
    pp_disclaimer: "Orientación general — los requisitos varían según el lugar y el empleador. Confirma los detalles para tu jurisdicción.",
    pp_error: "No se pudo crear tu lista. Inténtalo de nuevo.",

    pp_recent: "Recientes",

    pp_checklist_title: "Documentos a reunir",
    pp_order_title: "Tu cronograma",
    pp_cal_note_rel: "Las semanas se cuentan desde {{label}} (semana 0). Negativo = antes, positivo = después. Las barras muestran la ventana de cada paso; los números corresponden a los pasos de abajo.",
    pp_cal_event: "El evento",
    pp_cal_week: "sem",
    pp_watch_title: "Fácil de olvidar",
    pp_xref_pre: "¿Solo te mudas? Protege primero tu depósito con",
    pp_related: "Herramientas relacionadas",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "DOCUMENTOS A REUNIR:",
    pp_copy_where: "dónde",
    pp_copy_order: "ORDEN PARA GESTIONARLO:",
    pp_copy_watch: "FÁCIL DE OLVIDAR:",

    pp_example_situation: "Me mudo a otra ciudad con dos hijos y empiezo un nuevo trabajo el mismo mes.",
    pp_example_location: "Sevilla, España",
  },

  zh: {
    pp_title: "Paperwork Path",
    pp_tagline: "你需要的文件——以及处理它们的顺序",

    pp_event_label: "你正在处理哪件人生大事？",
    pp_ev_move: "搬家",
    pp_ev_baby: "新生儿",
    pp_ev_job: "新工作",
    pp_ev_marriage: "结婚",
    pp_ev_divorce: "离婚",
    pp_ev_death: "亲人离世",
    pp_ev_buyhome: "买房",
    pp_ev_retire: "退休",

    pp_location_label: "你在哪里？（可选——让建议更具体）",
    pp_location_ph: "例如：上海 · 台北 · 新加坡",

    pp_situation_label: "有什么具体情况吗？（可选）",
    pp_situation_ph: "例如：带着两个孩子搬到另一个城市，同时还要换工作",

    pp_build: "生成我的清单",
    pp_building: "正在生成你的清单…",
    pp_disclaimer: "一般性指导——具体要求因地区和雇主而异。请以你所在辖区的规定为准。",
    pp_error: "无法生成清单，请重试。",

    pp_recent: "最近",

    pp_checklist_title: "需要准备的文件",
    pp_order_title: "你的时间线",
    pp_cal_note_rel: "周数以{{label}}（第 0 周）为基准。负数 = 之前，正数 = 之后。色条表示每一步的时间窗口；编号对应下方步骤。",
    pp_cal_event: "事件",
    pp_cal_week: "周",
    pp_watch_title: "容易遗漏",
    pp_xref_pre: "只是搬家？先保护好你的押金：",
    pp_related: "相关工具",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "需要准备的文件：",
    pp_copy_where: "获取途径",
    pp_copy_order: "处理顺序：",
    pp_copy_watch: "容易遗漏：",

    pp_example_situation: "带着两个孩子搬到另一个城市，并在同一个月开始新工作。",
    pp_example_location: "中国上海",
  },

  hi: {
    pp_title: "Paperwork Path",
    pp_tagline: "ज़रूरी दस्तावेज़ — और उन्हें निपटाने का सही क्रम",

    pp_event_label: "आप जीवन की कौन-सी बड़ी घटना संभाल रहे हैं?",
    pp_ev_move: "घर बदलना",
    pp_ev_baby: "नया शिशु",
    pp_ev_job: "नई नौकरी",
    pp_ev_marriage: "शादी",
    pp_ev_divorce: "तलाक़",
    pp_ev_death: "किसी अपने का निधन",
    pp_ev_buyhome: "घर खरीदना",
    pp_ev_retire: "रिटायरमेंट",

    pp_location_label: "आप कहाँ हैं? (वैकल्पिक — सलाह और सटीक होगी)",
    pp_location_ph: "जैसे: दिल्ली · मुंबई · बेंगलुरु",

    pp_situation_label: "आपकी स्थिति में कुछ खास? (वैकल्पिक)",
    pp_situation_ph: "जैसे: दो बच्चों के साथ दूसरे शहर जा रहे हैं और साथ ही नौकरी भी बदल रहे हैं",

    pp_build: "मेरी सूची बनाएँ",
    pp_building: "आपकी सूची बन रही है…",
    pp_disclaimer: "सामान्य मार्गदर्शन — नियम स्थान और नियोक्ता के अनुसार बदलते हैं। अपने क्षेत्र के नियम ज़रूर जाँचें।",
    pp_error: "सूची नहीं बन पाई। कृपया फिर से कोशिश करें।",

    pp_recent: "हाल के",

    pp_checklist_title: "जुटाने वाले दस्तावेज़",
    pp_order_title: "आपकी समय-रेखा",
    pp_cal_note_rel: "सप्ताह {{label}} (सप्ताह 0) से गिने जाते हैं। ऋणात्मक = पहले, धनात्मक = बाद में। पट्टियाँ हर चरण की अवधि दिखाती हैं; संख्याएँ नीचे दिए चरणों से मेल खाती हैं।",
    pp_cal_event: "घटना",
    pp_cal_week: "सप्ताह",
    pp_watch_title: "अक्सर छूट जाता है",
    pp_xref_pre: "सिर्फ़ घर बदल रहे हैं? पहले अपनी जमा राशि सुरक्षित करें:",
    pp_related: "संबंधित टूल",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "जुटाने वाले दस्तावेज़:",
    pp_copy_where: "कहाँ से",
    pp_copy_order: "निपटाने का क्रम:",
    pp_copy_watch: "अक्सर छूट जाता है:",

    pp_example_situation: "दो बच्चों के साथ दूसरे शहर जा रहे हैं और उसी महीने नई नौकरी शुरू कर रहे हैं।",
    pp_example_location: "पुणे, भारत",
  },

  ar: {
    pp_title: "Paperwork Path",
    pp_tagline: "المستندات التي تحتاجها — وترتيب إنجازها",

    pp_event_label: "ما الحدث الحياتي الذي تتعامل معه؟",
    pp_ev_move: "انتقال سكن",
    pp_ev_baby: "مولود جديد",
    pp_ev_job: "وظيفة جديدة",
    pp_ev_marriage: "زواج",
    pp_ev_divorce: "طلاق",
    pp_ev_death: "وفاة شخص عزيز",
    pp_ev_buyhome: "شراء منزل",
    pp_ev_retire: "تقاعد",

    pp_location_label: "أين أنت؟ (اختياري — يجعل التفاصيل أدق)",
    pp_location_ph: "مثل: دبي · الرياض · القاهرة",

    pp_situation_label: "هل من تفاصيل خاصة بوضعك؟ (اختياري)",
    pp_situation_ph: "مثل: أنتقل إلى مدينة أخرى مع طفلين وأغيّر وظيفتي في الوقت نفسه",

    pp_build: "أنشئ خطتي",
    pp_building: "جارٍ إنشاء خطتك…",
    pp_disclaimer: "إرشادات عامة — تختلف المتطلبات حسب المكان وجهة العمل. تأكد من التفاصيل في منطقتك.",
    pp_error: "تعذّر إنشاء قائمتك. حاول مرة أخرى.",

    pp_recent: "الأحدث",

    pp_checklist_title: "مستندات يجب جمعها",
    pp_order_title: "جدولك الزمني",
    pp_cal_note_rel: "تُحسب الأسابيع من {{label}} (الأسبوع 0). سالب = قبل، وموجب = بعد. تُظهر الأشرطة نافذة كل خطوة؛ والأرقام تطابق الخطوات أدناه.",
    pp_cal_event: "الحدث",
    pp_cal_week: "أسبوع",
    pp_watch_title: "يسهل نسيانه",
    pp_xref_pre: "تنتقل لسكن جديد فقط؟ احمِ وديعتك أولًا مع",
    pp_related: "أدوات ذات صلة",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "مستندات يجب جمعها:",
    pp_copy_where: "من أين",
    pp_copy_order: "ترتيب الإنجاز:",
    pp_copy_watch: "يسهل نسيانه:",

    pp_example_situation: "أنتقل إلى مدينة أخرى مع طفلين وأبدأ وظيفة جديدة في الشهر نفسه.",
    pp_example_location: "جدة، السعودية",
  },

  pt: {
    pp_title: "Paperwork Path",
    pp_tagline: "Os documentos de que você precisa — e a ordem para resolvê-los",

    pp_event_label: "Qual evento de vida você está resolvendo?",
    pp_ev_move: "Mudança",
    pp_ev_baby: "Novo bebê",
    pp_ev_job: "Novo emprego",
    pp_ev_marriage: "Casamento",
    pp_ev_divorce: "Divórcio",
    pp_ev_death: "Perda de um ente querido",
    pp_ev_buyhome: "Compra de casa",
    pp_ev_retire: "Aposentadoria",

    pp_location_label: "Onde você está? (opcional — deixa os detalhes mais precisos)",
    pp_location_ph: "ex.: São Paulo, Brasil · Lisboa, Portugal · Recife, Brasil",

    pp_situation_label: "Algo específico na sua situação? (opcional)",
    pp_situation_ph: "ex.: Mudando de estado com dois filhos e trocando de emprego ao mesmo tempo",

    pp_build: "Montar meu roteiro",
    pp_building: "Montando seu roteiro…",
    pp_disclaimer: "Orientação geral — os requisitos variam por local e empregador. Confirme os detalhes para a sua jurisdição.",
    pp_error: "Não foi possível montar sua lista. Tente novamente.",

    pp_recent: "Recentes",

    pp_checklist_title: "Documentos a reunir",
    pp_order_title: "Sua linha do tempo",
    pp_cal_note_rel: "As semanas são contadas a partir de {{label}} (semana 0). Negativo = antes, positivo = depois. As barras mostram a janela de cada etapa; os números correspondem às etapas abaixo.",
    pp_cal_event: "O evento",
    pp_cal_week: "sem",
    pp_watch_title: "Fácil de esquecer",
    pp_xref_pre: "Só se mudando? Proteja seu depósito primeiro com",
    pp_related: "Ferramentas relacionadas",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "DOCUMENTOS A REUNIR:",
    pp_copy_where: "onde",
    pp_copy_order: "ORDEM PARA RESOLVER:",
    pp_copy_watch: "FÁCIL DE ESQUECER:",

    pp_example_situation: "Mudando de cidade com dois filhos e começando um novo emprego no mesmo mês.",
    pp_example_location: "Curitiba, Brasil",
  },

  fr: {
    pp_title: "Paperwork Path",
    pp_tagline: "Les documents qu'il vous faut — et l'ordre pour les traiter",

    pp_event_label: "Quel événement de vie gérez-vous ?",
    pp_ev_move: "Déménagement",
    pp_ev_baby: "Nouveau bébé",
    pp_ev_job: "Nouvel emploi",
    pp_ev_marriage: "Mariage",
    pp_ev_divorce: "Divorce",
    pp_ev_death: "Perte d'un proche",
    pp_ev_buyhome: "Achat immobilier",
    pp_ev_retire: "Retraite",

    pp_location_label: "Où êtes-vous ? (facultatif — affine les détails)",
    pp_location_ph: "ex. Lyon, France · Montréal, Canada · Bruxelles, Belgique",

    pp_situation_label: "Un point particulier dans votre situation ? (facultatif)",
    pp_situation_ph: "ex. Déménagement dans une autre région avec deux enfants et changement d'emploi en même temps",

    pp_build: "Créer mon parcours",
    pp_building: "Création de votre parcours…",
    pp_disclaimer: "Conseils généraux — les exigences varient selon le lieu et l'employeur. Vérifiez les détails pour votre juridiction.",
    pp_error: "Impossible de créer votre liste. Veuillez réessayer.",

    pp_recent: "Récents",

    pp_checklist_title: "Documents à rassembler",
    pp_order_title: "Votre calendrier",
    pp_cal_note_rel: "Les semaines sont comptées à partir de {{label}} (semaine 0). Négatif = avant, positif = après. Les barres montrent la fenêtre de chaque étape ; les numéros correspondent aux étapes ci-dessous.",
    pp_cal_event: "L'événement",
    pp_cal_week: "sem.",
    pp_watch_title: "Facile à oublier",
    pp_xref_pre: "Un simple déménagement ? Protégez d'abord votre dépôt avec",
    pp_related: "Outils associés",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "DOCUMENTS À RASSEMBLER :",
    pp_copy_where: "où",
    pp_copy_order: "ORDRE DE TRAITEMENT :",
    pp_copy_watch: "FACILE À OUBLIER :",

    pp_example_situation: "Déménagement dans une autre ville avec deux enfants et début d'un nouvel emploi le même mois.",
    pp_example_location: "Nantes, France",
  },

  de: {
    pp_title: "Paperwork Path",
    pp_tagline: "Die Dokumente, die du brauchst — und die richtige Reihenfolge",

    pp_event_label: "Welches Lebensereignis steht an?",
    pp_ev_move: "Umzug",
    pp_ev_baby: "Neues Baby",
    pp_ev_job: "Neuer Job",
    pp_ev_marriage: "Heirat",
    pp_ev_divorce: "Scheidung",
    pp_ev_death: "Verlust eines Angehörigen",
    pp_ev_buyhome: "Hauskauf",
    pp_ev_retire: "Ruhestand",

    pp_location_label: "Wo bist du? (optional — macht die Angaben genauer)",
    pp_location_ph: "z. B. München, Deutschland · Wien, Österreich · Zürich, Schweiz",

    pp_situation_label: "Etwas Besonderes an deiner Situation? (optional)",
    pp_situation_ph: "z. B. Umzug in ein anderes Bundesland mit zwei Kindern und gleichzeitigem Jobwechsel",

    pp_build: "Meinen Fahrplan erstellen",
    pp_building: "Fahrplan wird erstellt…",
    pp_disclaimer: "Allgemeine Orientierung — Anforderungen variieren je nach Ort und Arbeitgeber. Prüfe die Details für deine Region.",
    pp_error: "Deine Liste konnte nicht erstellt werden. Bitte versuch es erneut.",

    pp_recent: "Zuletzt",

    pp_checklist_title: "Dokumente zum Zusammenstellen",
    pp_order_title: "Dein Zeitplan",
    pp_cal_note_rel: "Wochen werden ab {{label}} (Woche 0) gezählt. Negativ = davor, positiv = danach. Balken zeigen das Zeitfenster jedes Schritts; die Nummern entsprechen den Schritten unten.",
    pp_cal_event: "Das Ereignis",
    pp_cal_week: "Wo.",
    pp_watch_title: "Leicht zu übersehen",
    pp_xref_pre: "Nur ein Umzug? Sichere zuerst deine Kaution mit",
    pp_related: "Verwandte Tools",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "DOKUMENTE ZUM ZUSAMMENSTELLEN:",
    pp_copy_where: "wo",
    pp_copy_order: "REIHENFOLGE:",
    pp_copy_watch: "LEICHT ZU ÜBERSEHEN:",

    pp_example_situation: "Umzug in eine andere Stadt mit zwei Kindern und Jobstart im selben Monat.",
    pp_example_location: "Leipzig, Deutschland",
  },

  ja: {
    pp_title: "Paperwork Path",
    pp_tagline: "必要な書類と、片づける順番",

    pp_event_label: "どのライフイベントに対応していますか？",
    pp_ev_move: "引っ越し",
    pp_ev_baby: "赤ちゃん誕生",
    pp_ev_job: "新しい仕事",
    pp_ev_marriage: "結婚",
    pp_ev_divorce: "離婚",
    pp_ev_death: "大切な人との死別",
    pp_ev_buyhome: "住宅購入",
    pp_ev_retire: "退職",

    pp_location_label: "お住まいはどこですか？（任意 — 内容がより具体的になります）",
    pp_location_ph: "例：東京 · 大阪 · 福岡",

    pp_situation_label: "状況について特記事項はありますか？（任意）",
    pp_situation_ph: "例：子ども2人を連れて他県へ引っ越し、同時に転職もする",

    pp_build: "手続きリストを作成",
    pp_building: "リストを作成中…",
    pp_disclaimer: "一般的なガイドです — 要件は地域や勤務先によって異なります。お住まいの地域の規定をご確認ください。",
    pp_error: "リストを作成できませんでした。もう一度お試しください。",

    pp_recent: "最近",

    pp_checklist_title: "そろえる書類",
    pp_order_title: "タイムライン",
    pp_cal_note_rel: "週は{{label}}（第0週）を基準に数えます。マイナス = 前、プラス = 後。バーは各ステップの期間、番号は下のステップに対応します。",
    pp_cal_event: "イベント",
    pp_cal_week: "週",
    pp_watch_title: "見落としがち",
    pp_xref_pre: "引っ越しだけなら、まず敷金を守りましょう：",
    pp_related: "関連ツール",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "そろえる書類：",
    pp_copy_where: "入手先",
    pp_copy_order: "対応する順番：",
    pp_copy_watch: "見落としがち：",

    pp_example_situation: "子ども2人を連れて別の街へ引っ越し、同じ月に新しい仕事を始めます。",
    pp_example_location: "日本・横浜",
  },

  ko: {
    pp_title: "Paperwork Path",
    pp_tagline: "필요한 서류와 처리 순서",

    pp_event_label: "어떤 인생 이벤트를 준비 중인가요?",
    pp_ev_move: "이사",
    pp_ev_baby: "출산",
    pp_ev_job: "새 직장",
    pp_ev_marriage: "결혼",
    pp_ev_divorce: "이혼",
    pp_ev_death: "가까운 사람과의 사별",
    pp_ev_buyhome: "주택 구입",
    pp_ev_retire: "은퇴",

    pp_location_label: "어디에 계신가요? (선택 — 더 구체적인 안내를 받을 수 있어요)",
    pp_location_ph: "예: 서울 · 부산 · 인천",

    pp_situation_label: "특별한 상황이 있나요? (선택)",
    pp_situation_ph: "예: 아이 둘과 함께 다른 도시로 이사하면서 동시에 이직도 해요",

    pp_build: "내 체크리스트 만들기",
    pp_building: "체크리스트 만드는 중…",
    pp_disclaimer: "일반적인 안내입니다 — 요건은 지역과 고용주에 따라 다릅니다. 해당 지역의 세부 사항을 확인하세요.",
    pp_error: "체크리스트를 만들지 못했습니다. 다시 시도해 주세요.",

    pp_recent: "최근",

    pp_checklist_title: "준비할 서류",
    pp_order_title: "타임라인",
    pp_cal_note_rel: "주차는 {{label}}(0주차)를 기준으로 셉니다. 음수 = 이전, 양수 = 이후. 막대는 각 단계의 기간을, 번호는 아래 단계와 일치합니다.",
    pp_cal_event: "이벤트",
    pp_cal_week: "주",
    pp_watch_title: "놓치기 쉬운 것",
    pp_xref_pre: "이사만 하시나요? 먼저 보증금부터 지키세요:",
    pp_related: "관련 도구",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "준비할 서류:",
    pp_copy_where: "발급처",
    pp_copy_order: "처리 순서:",
    pp_copy_watch: "놓치기 쉬운 것:",

    pp_example_situation: "아이 둘과 함께 다른 도시로 이사하고 같은 달에 새 직장을 시작합니다.",
    pp_example_location: "대한민국 대전",
  },

  ru: {
    pp_title: "Paperwork Path",
    pp_tagline: "Нужные документы — и порядок, в котором их оформлять",

    pp_event_label: "Какое жизненное событие вы оформляете?",
    pp_ev_move: "Переезд",
    pp_ev_baby: "Рождение ребёнка",
    pp_ev_job: "Новая работа",
    pp_ev_marriage: "Свадьба",
    pp_ev_divorce: "Развод",
    pp_ev_death: "Утрата близкого",
    pp_ev_buyhome: "Покупка жилья",
    pp_ev_retire: "Выход на пенсию",

    pp_location_label: "Где вы находитесь? (необязательно — уточнит детали)",
    pp_location_ph: "напр. Санкт-Петербург, Россия · Алматы, Казахстан · Минск, Беларусь",

    pp_situation_label: "Есть особенности вашей ситуации? (необязательно)",
    pp_situation_ph: "напр. Переезжаю в другой город с двумя детьми и одновременно меняю работу",

    pp_build: "Составить мой план",
    pp_building: "Составляем ваш план…",
    pp_disclaimer: "Общие рекомендации — требования зависят от места и работодателя. Уточните детали для вашего региона.",
    pp_error: "Не удалось составить список. Попробуйте ещё раз.",

    pp_recent: "Недавние",

    pp_checklist_title: "Документы, которые нужно собрать",
    pp_order_title: "Ваш график",
    pp_cal_note_rel: "Недели отсчитываются от {{label}} (неделя 0). Минус = до, плюс = после. Полосы показывают окно каждого шага; номера соответствуют шагам ниже.",
    pp_cal_event: "Событие",
    pp_cal_week: "нед.",
    pp_watch_title: "Легко упустить",
    pp_xref_pre: "Просто переезжаете? Сначала защитите депозит с",
    pp_related: "Похожие инструменты",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "ДОКУМЕНТЫ, КОТОРЫЕ НУЖНО СОБРАТЬ:",
    pp_copy_where: "где",
    pp_copy_order: "ПОРЯДОК ДЕЙСТВИЙ:",
    pp_copy_watch: "ЛЕГКО УПУСТИТЬ:",

    pp_example_situation: "Переезжаю в другой город с двумя детьми и в том же месяце выхожу на новую работу.",
    pp_example_location: "Казань, Россия",
  },

  th: {
    pp_title: "Paperwork Path",
    pp_tagline: "เอกสารที่คุณต้องใช้ — และลำดับการจัดการ",

    pp_event_label: "คุณกำลังจัดการเหตุการณ์ชีวิตเรื่องใด?",
    pp_ev_move: "ย้ายบ้าน",
    pp_ev_baby: "ลูกน้อยเกิดใหม่",
    pp_ev_job: "งานใหม่",
    pp_ev_marriage: "แต่งงาน",
    pp_ev_divorce: "หย่าร้าง",
    pp_ev_death: "สูญเสียคนที่รัก",
    pp_ev_buyhome: "ซื้อบ้าน",
    pp_ev_retire: "เกษียณ",

    pp_location_label: "คุณอยู่ที่ไหน? (ไม่บังคับ — ช่วยให้คำแนะนำเจาะจงขึ้น)",
    pp_location_ph: "เช่น กรุงเทพฯ · เชียงใหม่ · ภูเก็ต",

    pp_situation_label: "มีรายละเอียดเฉพาะของสถานการณ์คุณไหม? (ไม่บังคับ)",
    pp_situation_ph: "เช่น ย้ายไปจังหวัดอื่นพร้อมลูกสองคน และเปลี่ยนงานพร้อมกัน",

    pp_build: "สร้างเส้นทางของฉัน",
    pp_building: "กำลังสร้างเส้นทางของคุณ…",
    pp_disclaimer: "คำแนะนำทั่วไป — ข้อกำหนดแตกต่างกันตามพื้นที่และนายจ้าง โปรดตรวจสอบรายละเอียดในเขตของคุณ",
    pp_error: "สร้างรายการไม่สำเร็จ โปรดลองอีกครั้ง",

    pp_recent: "ล่าสุด",

    pp_checklist_title: "เอกสารที่ต้องรวบรวม",
    pp_order_title: "ไทม์ไลน์ของคุณ",
    pp_cal_note_rel: "นับสัปดาห์จาก {{label}} (สัปดาห์ 0) ค่าลบ = ก่อน ค่าบวก = หลัง แถบแสดงช่วงเวลาของแต่ละขั้นตอน ตัวเลขตรงกับขั้นตอนด้านล่าง",
    pp_cal_event: "เหตุการณ์",
    pp_cal_week: "สป.",
    pp_watch_title: "พลาดได้ง่าย",
    pp_xref_pre: "แค่ย้ายบ้าน? ปกป้องเงินมัดจำของคุณก่อนด้วย",
    pp_related: "เครื่องมือที่เกี่ยวข้อง",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "เอกสารที่ต้องรวบรวม:",
    pp_copy_where: "แหล่งที่มา",
    pp_copy_order: "ลำดับการจัดการ:",
    pp_copy_watch: "พลาดได้ง่าย:",

    pp_example_situation: "ย้ายไปเมืองอื่นพร้อมลูกสองคน และเริ่มงานใหม่ในเดือนเดียวกัน",
    pp_example_location: "ขอนแก่น ประเทศไทย",
  },

  vi: {
    pp_title: "Paperwork Path",
    pp_tagline: "Giấy tờ bạn cần — và thứ tự xử lý",

    pp_event_label: "Bạn đang lo liệu sự kiện nào trong đời?",
    pp_ev_move: "Chuyển nhà",
    pp_ev_baby: "Em bé mới chào đời",
    pp_ev_job: "Công việc mới",
    pp_ev_marriage: "Kết hôn",
    pp_ev_divorce: "Ly hôn",
    pp_ev_death: "Mất người thân",
    pp_ev_buyhome: "Mua nhà",
    pp_ev_retire: "Nghỉ hưu",

    pp_location_label: "Bạn đang ở đâu? (không bắt buộc — giúp chi tiết chính xác hơn)",
    pp_location_ph: "vd: Hà Nội · TP.HCM · Đà Nẵng",

    pp_situation_label: "Có điều gì cụ thể về hoàn cảnh của bạn? (không bắt buộc)",
    pp_situation_ph: "vd: Chuyển đến thành phố khác cùng hai con và đổi việc cùng lúc",

    pp_build: "Tạo lộ trình của tôi",
    pp_building: "Đang tạo lộ trình của bạn…",
    pp_disclaimer: "Hướng dẫn chung — yêu cầu khác nhau theo nơi ở và nơi làm việc. Hãy xác nhận chi tiết cho khu vực của bạn.",
    pp_error: "Không tạo được danh sách. Vui lòng thử lại.",

    pp_recent: "Gần đây",

    pp_checklist_title: "Giấy tờ cần chuẩn bị",
    pp_order_title: "Dòng thời gian của bạn",
    pp_cal_note_rel: "Tuần được tính từ {{label}} (tuần 0). Âm = trước, dương = sau. Các thanh thể hiện khoảng thời gian của từng bước; số thứ tự khớp với các bước bên dưới.",
    pp_cal_event: "Sự kiện",
    pp_cal_week: "tuần",
    pp_watch_title: "Dễ bỏ sót",
    pp_xref_pre: "Chỉ chuyển nhà? Hãy bảo vệ tiền cọc trước với",
    pp_related: "Công cụ liên quan",
    pp_xref_deposit: "Renter's Deposit Saver",
    pp_xref_bill: "Bill Rescue",
    pp_xref_final: "Final Wish",

    pp_copy_header: "Paperwork Path",
    pp_copy_checklist: "GIẤY TỜ CẦN CHUẨN BỊ:",
    pp_copy_where: "nơi lấy",
    pp_copy_order: "THỨ TỰ XỬ LÝ:",
    pp_copy_watch: "DỄ BỎ SÓT:",

    pp_example_situation: "Chuyển đến thành phố khác cùng hai con và bắt đầu công việc mới trong cùng tháng.",
    pp_example_location: "Đà Nẵng, Việt Nam",
  },
};
