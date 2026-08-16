// QuoteCheck — qc_* keys, fully localized (all 13 languages).
// {{sym}} is the user's locale currency symbol (interpolated at render time).
// Verdict keys (qc_verdict_*) are DISPLAY labels — the backend enum values
// (likely_fair | somewhat_high | overpriced | cant_tell) stay exact English.
export const quoteCheck = {
  en: {
    qc_example2_item: "2016 Ford Focus, 78,000 miles",
    qc_example2_wrong: "Went in for an MOT. It failed on a worn brake disc.",
    qc_example2_told: "They rang to say that while it was on the ramp they had also found the rear discs, both front tyres, a leaking shock absorber and a cracked coolant hose, and recommended doing all of it at once.",
    qc_example2_breakdown: "Itemised: front discs and pads, rear discs and pads, two tyres fitted and balanced, one rear shock absorber, coolant hose, four hours labour, MOT retest fee.",
    qc_example2_age: "9 years",
    qc_title: "Quote Check",
    qc_your_situation: "What you told us",
    qc_tagline: "Paste your repair quote — know if you're being overcharged",

    qc_type_label: "What kind of repair?",
    qc_type_appliance: "Appliance",
    qc_type_car: "Car / Vehicle",
    qc_type_other: "Other",

    qc_item_label: "What needs repair?",
    qc_item_ph: "e.g. Whirlpool refrigerator, about 6 years old",

    qc_wrong_label: "What's wrong?",
    qc_wrong_ph: "e.g. Not cooling, making a loud buzzing noise",

    qc_told_label: "What did the repair person tell you?",
    qc_told_hint: "their diagnosis — optional, but helps a lot",
    qc_told_ph: "e.g. They said the compressor is bad and needs replacing",

    qc_price_label: "What were you quoted?",

    qc_breakdown_label: "Itemized breakdown they gave you",
    qc_breakdown_hint: "optional",
    qc_breakdown_ph: "e.g. Compressor {{sym}}350, labor {{sym}}200, service call {{sym}}95",

    qc_upload_label: "Upload the actual quote",
    qc_upload_hint: "optional — photo or PDF, I'll read it directly",
    qc_upload_cta: "Click to upload a photo or PDF",
    qc_err_file_type: "Please upload a JPG, PNG, or PDF file.",
    qc_err_file_size: "File is too large — please keep it under 10MB.",
    qc_err_file_read: "Couldn't read that file. Please try again.",
    qc_kb: "KB",

    qc_second_label: "Got a second quote?",
    qc_second_hint: "optional — I'll compare them",

    qc_age_label: "How old is it?",
    qc_age_hint: "optional — helps with repair-vs-replace",
    qc_age_ph: "e.g. 6 years",

    qc_analyzing: "Checking...",
    qc_check_it: "Check This Quote",
    qc_error: "Something went wrong. Please try again.",
    qc_new_quote: "Start Over",
    qc_recent: "Recent checks",
    qc_clear: "Clear",

    qc_verdict_likely_fair: "LIKELY FAIR",
    qc_verdict_somewhat_high: "SOMEWHAT HIGH",
    qc_verdict_overpriced: "OVERPRICED",
    qc_verdict_cant_tell: "CAN'T TELL YET",

    qc_price_check_heading: "Price Reality Check",
    qc_typical_range: "Typical range",
    qc_where_falls: "Where this quote falls",
    qc_confidence: "Confidence",
    qc_confidence_high: "high",
    qc_confidence_medium: "medium",
    qc_confidence_low: "low",

    qc_red_flags_heading: "Red Flags",
    qc_red_flags_none: "No red flags found — this looks like a clean quote.",

    qc_itemization_heading: "Itemization Check",
    qc_itemized_good: "This quote is itemized clearly.",
    qc_itemized_missing: "What's missing:",

    qc_replace_heading: "Repair vs. Replace",

    qc_script_heading: "What to Say",

    qc_questions_heading: "Questions to Ask Before You Approve",

    qc_second_opinion_heading: "Second Opinion?",
    qc_second_opinion_yes: "Worth getting a second opinion",
    qc_second_opinion_no: "A second opinion probably isn't necessary",

    qc_related: "Related tools",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "Quote Check Results",
    qc_copy_verdict: "Verdict:",
    qc_copy_typical: "Typical range:",
    qc_copy_flags: "Red flags:",
    qc_copy_script: "What to say:",
    qc_copy_questions: "Questions to ask:",

    qc_disclaimer: "AI-generated estimate based on general market patterns — not a substitute for a real quote comparison, especially for vehicle repairs.",

    qc_example_item: "Whirlpool refrigerator, about 6 years old",
    qc_example_wrong: "Not cooling properly, freezer section is fine but the fridge side is warm",
    qc_example_told: "Technician said the compressor is failing and needs full replacement",
    qc_example_breakdown: "Compressor and labor, no itemized breakdown given",
    qc_example_age: "6 years",
  },
  es: {
    qc_example2_item: "Ford Focus de 2016, 125.000 km",
    qc_example2_wrong: "Fue a la ITV y suspendió por un disco de freno desgastado.",
    qc_example2_told: "Llamaron para decir que, ya que estaba en el elevador, también habían visto los discos traseros, los dos neumáticos delanteros, un amortiguador con fuga y un manguito de refrigerante agrietado, y recomendaban hacerlo todo de golpe.",
    qc_example2_breakdown: "Desglosado: discos y pastillas delanteros, discos y pastillas traseros, dos neumáticos montados y equilibrados, un amortiguador trasero, manguito de refrigerante, cuatro horas de mano de obra y tasa de reinspección.",
    qc_example2_age: "9 años",
    qc_title: "Quote Check",
    qc_your_situation: "Lo que nos contaste",
    qc_tagline: "Pega tu presupuesto de reparación — descubre si te están cobrando de más",

    qc_type_label: "¿Qué tipo de reparación?",
    qc_type_appliance: "Electrodoméstico",
    qc_type_car: "Coche / Vehículo",
    qc_type_other: "Otra",

    qc_item_label: "¿Qué necesita reparación?",
    qc_item_ph: "p. ej. Refrigerador Whirlpool, de unos 6 años",

    qc_wrong_label: "¿Qué le pasa?",
    qc_wrong_ph: "p. ej. No enfría y hace un zumbido fuerte",

    qc_told_label: "¿Qué te dijo el técnico?",
    qc_told_hint: "su diagnóstico — opcional, pero ayuda mucho",
    qc_told_ph: "p. ej. Dijo que el compresor está dañado y hay que cambiarlo",

    qc_price_label: "¿Cuánto te cotizaron?",

    qc_breakdown_label: "Desglose que te dieron",
    qc_breakdown_hint: "opcional",
    qc_breakdown_ph: "p. ej. Compresor {{sym}}350, mano de obra {{sym}}200, visita {{sym}}95",

    qc_upload_label: "Sube el presupuesto real",
    qc_upload_hint: "opcional — foto o PDF, lo leeré directamente",
    qc_upload_cta: "Haz clic para subir una foto o PDF",
    qc_err_file_type: "Sube un archivo JPG, PNG o PDF.",
    qc_err_file_size: "El archivo es demasiado grande — debe pesar menos de 10MB.",
    qc_err_file_read: "No se pudo leer el archivo. Inténtalo de nuevo.",
    qc_kb: "KB",

    qc_second_label: "¿Tienes un segundo presupuesto?",
    qc_second_hint: "opcional — los compararé",

    qc_age_label: "¿Cuántos años tiene?",
    qc_age_hint: "opcional — ayuda a decidir entre reparar o reemplazar",
    qc_age_ph: "p. ej. 6 años",

    qc_analyzing: "Analizando...",
    qc_check_it: "Revisar este presupuesto",
    qc_error: "Algo salió mal. Inténtalo de nuevo.",
    qc_new_quote: "Empezar de nuevo",
    qc_recent: "Revisiones recientes",
    qc_clear: "Borrar",

    qc_verdict_likely_fair: "PROBABLEMENTE JUSTO",
    qc_verdict_somewhat_high: "ALGO ELEVADO",
    qc_verdict_overpriced: "PRECIO EXCESIVO",
    qc_verdict_cant_tell: "AÚN NO SE SABE",

    qc_price_check_heading: "Chequeo del precio",
    qc_typical_range: "Rango típico",
    qc_where_falls: "Dónde cae este presupuesto",
    qc_confidence: "Confianza",
    qc_confidence_high: "alta",
    qc_confidence_medium: "media",
    qc_confidence_low: "baja",

    qc_red_flags_heading: "Señales de alerta",
    qc_red_flags_none: "Sin señales de alerta — parece un presupuesto limpio.",

    qc_itemization_heading: "Chequeo del desglose",
    qc_itemized_good: "Este presupuesto está desglosado con claridad.",
    qc_itemized_missing: "Lo que falta:",

    qc_replace_heading: "¿Reparar o reemplazar?",

    qc_script_heading: "Qué decir",

    qc_questions_heading: "Preguntas antes de aprobar",

    qc_second_opinion_heading: "¿Segunda opinión?",
    qc_second_opinion_yes: "Vale la pena pedir una segunda opinión",
    qc_second_opinion_no: "Probablemente no haga falta una segunda opinión",

    qc_related: "Herramientas relacionadas",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "Resultados de Quote Check",
    qc_copy_verdict: "Veredicto:",
    qc_copy_typical: "Rango típico:",
    qc_copy_flags: "Señales de alerta:",
    qc_copy_script: "Qué decir:",
    qc_copy_questions: "Preguntas para hacer:",

    qc_disclaimer: "Estimación generada por IA basada en patrones generales del mercado — no sustituye una comparación real de presupuestos, sobre todo en reparaciones de vehículos.",

    qc_example_item: "Refrigerador Whirlpool, de unos 6 años",
    qc_example_wrong: "No enfría bien; el congelador funciona pero la parte del refrigerador está tibia",
    qc_example_told: "El técnico dijo que el compresor está fallando y hay que reemplazarlo por completo",
    qc_example_breakdown: "Compresor y mano de obra, sin desglose detallado",
    qc_example_age: "6 años",
  },
  zh: {
    qc_example2_item: "2016 款福特福克斯，行驶约 12.5 万公里",
    qc_example2_wrong: "去做年检，因刹车盘磨损未通过。",
    qc_example2_told: "他们打电话说，车既然已经架起来了，还发现后刹车盘、两条前胎、一个渗油的减震器和一根开裂的冷却水管，建议一次性全做了。",
    qc_example2_breakdown: "有明细：前刹车盘和刹车片、后刹车盘和刹车片、两条轮胎（含安装动平衡）、一个后减震器、冷却水管、四小时工时、复检费。",
    qc_example2_age: "9 年",
    qc_title: "Quote Check",
    qc_your_situation: "你告诉我们的情况",
    qc_tagline: "贴上你的维修报价——看看有没有被多收钱",

    qc_type_label: "什么类型的维修?",
    qc_type_appliance: "家电",
    qc_type_car: "汽车",
    qc_type_other: "其他",

    qc_item_label: "要修什么?",
    qc_item_ph: "例如:惠而浦冰箱,用了大约 6 年",

    qc_wrong_label: "出了什么问题?",
    qc_wrong_ph: "例如:不制冷,还有很大的嗡嗡声",

    qc_told_label: "维修师傅怎么说?",
    qc_told_hint: "他们的诊断——选填,但很有帮助",
    qc_told_ph: "例如:他说压缩机坏了,需要更换",

    qc_price_label: "报价是多少?",

    qc_breakdown_label: "对方给的明细",
    qc_breakdown_hint: "选填",
    qc_breakdown_ph: "例如:压缩机 {{sym}}350,人工 {{sym}}200,上门费 {{sym}}95",

    qc_upload_label: "上传报价单原件",
    qc_upload_hint: "选填——照片或 PDF,我会直接读取",
    qc_upload_cta: "点击上传照片或 PDF",
    qc_err_file_type: "请上传 JPG、PNG 或 PDF 文件。",
    qc_err_file_size: "文件太大——请控制在 10MB 以内。",
    qc_err_file_read: "无法读取该文件,请重试。",
    qc_kb: "KB",

    qc_second_label: "有第二份报价吗?",
    qc_second_hint: "选填——我会进行比较",

    qc_age_label: "用了多久?",
    qc_age_hint: "选填——有助于判断修还是换",
    qc_age_ph: "例如:6 年",

    qc_analyzing: "检查中...",
    qc_check_it: "检查这份报价",
    qc_error: "出了点问题,请重试。",
    qc_new_quote: "重新开始",
    qc_recent: "最近的检查",
    qc_clear: "清除",

    qc_verdict_likely_fair: "价格基本合理",
    qc_verdict_somewhat_high: "价格偏高",
    qc_verdict_overpriced: "收费过高",
    qc_verdict_cant_tell: "暂时无法判断",

    qc_price_check_heading: "价格现实核查",
    qc_typical_range: "常见价格区间",
    qc_where_falls: "这份报价所处的位置",
    qc_confidence: "把握程度",
    qc_confidence_high: "高",
    qc_confidence_medium: "中",
    qc_confidence_low: "低",

    qc_red_flags_heading: "危险信号",
    qc_red_flags_none: "未发现危险信号——这份报价看起来没问题。",

    qc_itemization_heading: "明细核查",
    qc_itemized_good: "这份报价的明细清晰。",
    qc_itemized_missing: "缺少的内容:",

    qc_replace_heading: "修还是换",

    qc_script_heading: "可以这样说",

    qc_questions_heading: "同意维修前要问的问题",

    qc_second_opinion_heading: "要不要再问一家?",
    qc_second_opinion_yes: "值得再找一家问问",
    qc_second_opinion_no: "多半不需要再问第二家",

    qc_related: "相关工具",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "Quote Check 结果",
    qc_copy_verdict: "结论:",
    qc_copy_typical: "常见价格区间:",
    qc_copy_flags: "危险信号:",
    qc_copy_script: "可以这样说:",
    qc_copy_questions: "要问的问题:",

    qc_disclaimer: "由 AI 根据一般市场规律估算——不能替代真实的报价比较,汽车维修尤其如此。",

    qc_example_item: "惠而浦冰箱,用了大约 6 年",
    qc_example_wrong: "制冷不好,冷冻室正常,但冷藏室不凉",
    qc_example_told: "师傅说压缩机快坏了,需要整个更换",
    qc_example_breakdown: "压缩机加人工,没有给出明细",
    qc_example_age: "6 年",
  },
  hi: {
    qc_example2_item: "2016 फ़ोर्ड फ़ोकस, 1,25,000 किमी",
    qc_example2_wrong: "एमओटी के लिए ले गया था, घिसे हुए ब्रेक डिस्क की वजह से फेल हो गई।",
    qc_example2_told: "फ़ोन आया कि गाड़ी लिफ़्ट पर थी तो उन्होंने पिछले डिस्क, दोनों अगले टायर, एक लीक करता शॉक ऐब्जॉर्बर और एक चटका हुआ कूलेंट होज़ भी देख लिया — और एक ही बार में सब करवा लेने की सलाह दी।",
    qc_example2_breakdown: "आइटमवार: अगले डिस्क और पैड, पिछले डिस्क और पैड, दो टायर (फ़िटिंग और बैलेंसिंग सहित), एक पिछला शॉक ऐब्जॉर्बर, कूलेंट होज़, चार घंटे की लेबर, और दोबारा जाँच की फ़ीस।",
    qc_example2_age: "9 साल",
    qc_title: "Quote Check",
    qc_your_situation: "आपने हमें जो बताया",
    qc_tagline: "अपना रिपेयर कोटेशन डालें — जानें कहीं ज़्यादा पैसे तो नहीं लिए जा रहे",

    qc_type_label: "किस तरह की मरम्मत?",
    qc_type_appliance: "घरेलू उपकरण",
    qc_type_car: "कार / वाहन",
    qc_type_other: "अन्य",

    qc_item_label: "क्या ठीक करवाना है?",
    qc_item_ph: "जैसे: Whirlpool फ्रिज, करीब 6 साल पुराना",

    qc_wrong_label: "क्या खराबी है?",
    qc_wrong_ph: "जैसे: ठंडा नहीं कर रहा, तेज़ भिनभिनाने की आवाज़ आ रही है",

    qc_told_label: "टेक्नीशियन ने क्या बताया?",
    qc_told_hint: "उनका डायग्नोसिस — वैकल्पिक, पर बहुत मदद करता है",
    qc_told_ph: "जैसे: उन्होंने कहा कंप्रेसर खराब है और बदलना पड़ेगा",

    qc_price_label: "कितने का कोटेशन मिला?",

    qc_breakdown_label: "उन्होंने जो ब्रेकडाउन दिया",
    qc_breakdown_hint: "वैकल्पिक",
    qc_breakdown_ph: "जैसे: कंप्रेसर {{sym}}350, मज़दूरी {{sym}}200, विज़िट चार्ज {{sym}}95",

    qc_upload_label: "असली कोटेशन अपलोड करें",
    qc_upload_hint: "वैकल्पिक — फोटो या PDF, मैं सीधे पढ़ लूँगा",
    qc_upload_cta: "फोटो या PDF अपलोड करने के लिए क्लिक करें",
    qc_err_file_type: "कृपया JPG, PNG या PDF फ़ाइल अपलोड करें।",
    qc_err_file_size: "फ़ाइल बहुत बड़ी है — 10MB से कम रखें।",
    qc_err_file_read: "फ़ाइल पढ़ी नहीं जा सकी। दोबारा कोशिश करें।",
    qc_kb: "KB",

    qc_second_label: "दूसरा कोटेशन मिला है?",
    qc_second_hint: "वैकल्पिक — मैं दोनों की तुलना करूँगा",

    qc_age_label: "कितना पुराना है?",
    qc_age_hint: "वैकल्पिक — मरम्मत बनाम नया लेने के फ़ैसले में मदद करता है",
    qc_age_ph: "जैसे: 6 साल",

    qc_analyzing: "जाँच हो रही है...",
    qc_check_it: "यह कोटेशन जाँचें",
    qc_error: "कुछ गड़बड़ हो गई। दोबारा कोशिश करें।",
    qc_new_quote: "फिर से शुरू करें",
    qc_recent: "हाल की जाँचें",
    qc_clear: "हटाएँ",

    qc_verdict_likely_fair: "शायद वाजिब",
    qc_verdict_somewhat_high: "कुछ ज़्यादा",
    qc_verdict_overpriced: "बहुत महँगा",
    qc_verdict_cant_tell: "अभी कहना मुश्किल",

    qc_price_check_heading: "कीमत की असलियत",
    qc_typical_range: "सामान्य रेंज",
    qc_where_falls: "यह कोटेशन कहाँ बैठता है",
    qc_confidence: "भरोसा",
    qc_confidence_high: "ज़्यादा",
    qc_confidence_medium: "मध्यम",
    qc_confidence_low: "कम",

    qc_red_flags_heading: "चेतावनी के संकेत",
    qc_red_flags_none: "कोई चेतावनी संकेत नहीं मिला — यह कोटेशन साफ़-सुथरा लगता है।",

    qc_itemization_heading: "ब्रेकडाउन की जाँच",
    qc_itemized_good: "इस कोटेशन का ब्रेकडाउन साफ़ है।",
    qc_itemized_missing: "क्या कमी है:",

    qc_replace_heading: "मरम्मत करें या नया लें",

    qc_script_heading: "क्या कहें",

    qc_questions_heading: "मंज़ूरी देने से पहले पूछने लायक सवाल",

    qc_second_opinion_heading: "दूसरी राय?",
    qc_second_opinion_yes: "दूसरी राय लेना फ़ायदेमंद रहेगा",
    qc_second_opinion_no: "दूसरी राय की शायद ज़रूरत नहीं",

    qc_related: "मिलते-जुलते टूल",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "Quote Check नतीजे",
    qc_copy_verdict: "फ़ैसला:",
    qc_copy_typical: "सामान्य रेंज:",
    qc_copy_flags: "चेतावनी के संकेत:",
    qc_copy_script: "क्या कहें:",
    qc_copy_questions: "पूछने लायक सवाल:",

    qc_disclaimer: "यह AI का अनुमान है, जो बाज़ार के आम पैटर्न पर आधारित है — असली कोटेशन तुलना का विकल्प नहीं, खासकर वाहन मरम्मत में।",

    qc_example_item: "Whirlpool फ्रिज, करीब 6 साल पुराना",
    qc_example_wrong: "ठीक से ठंडा नहीं कर रहा, फ्रीज़र ठीक है पर फ्रिज वाला हिस्सा गर्म है",
    qc_example_told: "टेक्नीशियन ने कहा कंप्रेसर खराब हो रहा है और पूरा बदलना पड़ेगा",
    qc_example_breakdown: "कंप्रेसर और मज़दूरी, कोई ब्रेकडाउन नहीं दिया",
    qc_example_age: "6 साल",
  },
  ar: {
    qc_example2_item: "فورد فوكاس 2016، 125,000 كم",
    qc_example2_wrong: "ذهبت للفحص الدوري فرسبت بسبب قرص فرامل متآكل.",
    qc_example2_told: "اتصلوا ليقولوا إنهم، وبما أن السيارة على الرافعة، وجدوا أيضاً الأقراص الخلفية، والإطارين الأماميين، ومخمّد صدمات يسرّب، وخرطوم تبريد متشقق، ونصحوا بعمل ذلك كله دفعة واحدة.",
    qc_example2_breakdown: "مفصّلة: أقراص وفحمات أمامية، أقراص وفحمات خلفية، إطاران مع التركيب والموازنة، مخمّد صدمات خلفي واحد، خرطوم تبريد، أربع ساعات عمل، ورسوم إعادة الفحص.",
    qc_example2_age: "9 سنوات",
    qc_title: "Quote Check",
    qc_your_situation: "ما أخبرتنا به",
    qc_tagline: "الصق عرض سعر التصليح — واعرف إن كان المبلغ مبالغًا فيه",

    qc_type_label: "ما نوع التصليح؟",
    qc_type_appliance: "جهاز منزلي",
    qc_type_car: "سيارة / مركبة",
    qc_type_other: "آخر",

    qc_item_label: "ما الذي يحتاج إلى تصليح؟",
    qc_item_ph: "مثال: ثلاجة Whirlpool، عمرها نحو 6 سنوات",

    qc_wrong_label: "ما المشكلة؟",
    qc_wrong_ph: "مثال: لا تبرّد وتصدر صوت أزيز عاليًا",

    qc_told_label: "ماذا قال لك الفنّي؟",
    qc_told_hint: "تشخيصه — اختياري لكنه يساعد كثيرًا",
    qc_told_ph: "مثال: قال إن الضاغط تالف ويجب استبداله",

    qc_price_label: "كم كان عرض السعر؟",

    qc_breakdown_label: "التفصيل الذي أعطوك إياه",
    qc_breakdown_hint: "اختياري",
    qc_breakdown_ph: "مثال: الضاغط {{sym}}350، الأجرة {{sym}}200، رسوم الزيارة {{sym}}95",

    qc_upload_label: "ارفع عرض السعر الفعلي",
    qc_upload_hint: "اختياري — صورة أو PDF، وسأقرؤه مباشرة",
    qc_upload_cta: "انقر لرفع صورة أو ملف PDF",
    qc_err_file_type: "يرجى رفع ملف JPG أو PNG أو PDF.",
    qc_err_file_size: "الملف كبير جدًا — يجب أن يكون أقل من 10MB.",
    qc_err_file_read: "تعذّرت قراءة الملف. حاول مرة أخرى.",
    qc_kb: "KB",

    qc_second_label: "هل لديك عرض سعر ثانٍ؟",
    qc_second_hint: "اختياري — سأقارن بينهما",

    qc_age_label: "كم عمره؟",
    qc_age_hint: "اختياري — يساعد في قرار التصليح أو الاستبدال",
    qc_age_ph: "مثال: 6 سنوات",

    qc_analyzing: "جارٍ الفحص...",
    qc_check_it: "افحص هذا العرض",
    qc_error: "حدث خطأ ما. حاول مرة أخرى.",
    qc_new_quote: "البدء من جديد",
    qc_recent: "فحوصات حديثة",
    qc_clear: "مسح",

    qc_verdict_likely_fair: "غالبًا عادل",
    qc_verdict_somewhat_high: "مرتفع نوعًا ما",
    qc_verdict_overpriced: "مبالغ فيه",
    qc_verdict_cant_tell: "لا يمكن الجزم بعد",

    qc_price_check_heading: "فحص واقعية السعر",
    qc_typical_range: "النطاق المعتاد",
    qc_where_falls: "أين يقع هذا العرض",
    qc_confidence: "درجة الثقة",
    qc_confidence_high: "عالية",
    qc_confidence_medium: "متوسطة",
    qc_confidence_low: "منخفضة",

    qc_red_flags_heading: "إشارات تحذير",
    qc_red_flags_none: "لا توجد إشارات تحذير — يبدو عرضًا سليمًا.",

    qc_itemization_heading: "فحص التفصيل",
    qc_itemized_good: "هذا العرض مفصّل بوضوح.",
    qc_itemized_missing: "ما الناقص:",

    qc_replace_heading: "تصليح أم استبدال",

    qc_script_heading: "ماذا تقول",

    qc_questions_heading: "أسئلة اطرحها قبل الموافقة",

    qc_second_opinion_heading: "رأي ثانٍ؟",
    qc_second_opinion_yes: "يستحق أخذ رأي ثانٍ",
    qc_second_opinion_no: "الرأي الثاني غالبًا غير ضروري",

    qc_related: "أدوات ذات صلة",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "نتائج Quote Check",
    qc_copy_verdict: "الحكم:",
    qc_copy_typical: "النطاق المعتاد:",
    qc_copy_flags: "إشارات تحذير:",
    qc_copy_script: "ماذا تقول:",
    qc_copy_questions: "أسئلة تطرحها:",

    qc_disclaimer: "تقدير مولّد بالذكاء الاصطناعي بناءً على أنماط السوق العامة — ليس بديلًا عن مقارنة عروض حقيقية، خصوصًا في تصليح المركبات.",

    qc_example_item: "ثلاجة Whirlpool، عمرها نحو 6 سنوات",
    qc_example_wrong: "لا تبرّد جيدًا؛ الفريزر يعمل لكن قسم الثلاجة دافئ",
    qc_example_told: "قال الفنّي إن الضاغط بدأ يتعطل ويجب استبداله بالكامل",
    qc_example_breakdown: "الضاغط والأجرة، دون تفصيل للبنود",
    qc_example_age: "6 سنوات",
  },
  pt: {
    qc_example2_item: "Ford Focus de 2016, 125.000 km",
    qc_example2_wrong: "Foi à inspeção e chumbou por causa de um disco de travão gasto.",
    qc_example2_told: "Ligaram a dizer que, já que estava no elevador, também tinham encontrado os discos traseiros, os dois pneus da frente, um amortecedor a verter e um tubo de líquido de refrigeração rachado, e aconselhavam fazer tudo de uma vez.",
    qc_example2_breakdown: "Discriminado: discos e pastilhas à frente, discos e pastilhas atrás, dois pneus montados e equilibrados, um amortecedor traseiro, tubo de refrigeração, quatro horas de mão de obra e taxa de reinspeção.",
    qc_example2_age: "9 anos",
    qc_title: "Quote Check",
    qc_your_situation: "O que você nos contou",
    qc_tagline: "Cole seu orçamento de conserto — saiba se estão cobrando demais",

    qc_type_label: "Que tipo de conserto?",
    qc_type_appliance: "Eletrodoméstico",
    qc_type_car: "Carro / Veículo",
    qc_type_other: "Outro",

    qc_item_label: "O que precisa de conserto?",
    qc_item_ph: "ex.: Geladeira Whirlpool, com uns 6 anos",

    qc_wrong_label: "Qual é o problema?",
    qc_wrong_ph: "ex.: Não gela e faz um zumbido alto",

    qc_told_label: "O que o técnico disse?",
    qc_told_hint: "o diagnóstico dele — opcional, mas ajuda muito",
    qc_told_ph: "ex.: Disse que o compressor está com defeito e precisa ser trocado",

    qc_price_label: "Qual foi o orçamento?",

    qc_breakdown_label: "Detalhamento que te passaram",
    qc_breakdown_hint: "opcional",
    qc_breakdown_ph: "ex.: Compressor {{sym}}350, mão de obra {{sym}}200, visita {{sym}}95",

    qc_upload_label: "Envie o orçamento original",
    qc_upload_hint: "opcional — foto ou PDF, eu leio diretamente",
    qc_upload_cta: "Clique para enviar uma foto ou PDF",
    qc_err_file_type: "Envie um arquivo JPG, PNG ou PDF.",
    qc_err_file_size: "O arquivo é grande demais — mantenha abaixo de 10MB.",
    qc_err_file_read: "Não foi possível ler o arquivo. Tente de novo.",
    qc_kb: "KB",

    qc_second_label: "Tem um segundo orçamento?",
    qc_second_hint: "opcional — vou comparar os dois",

    qc_age_label: "Quantos anos tem?",
    qc_age_hint: "opcional — ajuda a decidir entre consertar ou trocar",
    qc_age_ph: "ex.: 6 anos",

    qc_analyzing: "Verificando...",
    qc_check_it: "Verificar este orçamento",
    qc_error: "Algo deu errado. Tente de novo.",
    qc_new_quote: "Recomeçar",
    qc_recent: "Verificações recentes",
    qc_clear: "Limpar",

    qc_verdict_likely_fair: "PROVAVELMENTE JUSTO",
    qc_verdict_somewhat_high: "UM POUCO ALTO",
    qc_verdict_overpriced: "CARO DEMAIS",
    qc_verdict_cant_tell: "AINDA NÃO DÁ PARA SABER",

    qc_price_check_heading: "Checagem de preço",
    qc_typical_range: "Faixa típica",
    qc_where_falls: "Onde este orçamento se encaixa",
    qc_confidence: "Confiança",
    qc_confidence_high: "alta",
    qc_confidence_medium: "média",
    qc_confidence_low: "baixa",

    qc_red_flags_heading: "Sinais de alerta",
    qc_red_flags_none: "Nenhum sinal de alerta — parece um orçamento limpo.",

    qc_itemization_heading: "Checagem do detalhamento",
    qc_itemized_good: "Este orçamento está bem detalhado.",
    qc_itemized_missing: "O que falta:",

    qc_replace_heading: "Consertar ou trocar",

    qc_script_heading: "O que dizer",

    qc_questions_heading: "Perguntas antes de aprovar",

    qc_second_opinion_heading: "Segunda opinião?",
    qc_second_opinion_yes: "Vale a pena buscar uma segunda opinião",
    qc_second_opinion_no: "Uma segunda opinião provavelmente não é necessária",

    qc_related: "Ferramentas relacionadas",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "Resultados do Quote Check",
    qc_copy_verdict: "Veredicto:",
    qc_copy_typical: "Faixa típica:",
    qc_copy_flags: "Sinais de alerta:",
    qc_copy_script: "O que dizer:",
    qc_copy_questions: "Perguntas a fazer:",

    qc_disclaimer: "Estimativa gerada por IA com base em padrões gerais de mercado — não substitui uma comparação real de orçamentos, principalmente em consertos de veículos.",

    qc_example_item: "Geladeira Whirlpool, com uns 6 anos",
    qc_example_wrong: "Não está gelando direito; o freezer funciona, mas a parte da geladeira fica morna",
    qc_example_told: "O técnico disse que o compressor está falhando e precisa de troca completa",
    qc_example_breakdown: "Compressor e mão de obra, sem detalhamento",
    qc_example_age: "6 anos",
  },
  fr: {
    qc_example2_item: "Ford Focus de 2016, 125 000 km",
    qc_example2_wrong: "Passé au contrôle technique : refusé pour un disque de frein usé.",
    qc_example2_told: "Ils ont appelé pour dire que, tant que la voiture était sur le pont, ils avaient aussi trouvé les disques arrière, les deux pneus avant, un amortisseur qui fuit et une durite de refroidissement fendue, et qu'ils conseillaient de tout faire d'un coup.",
    qc_example2_breakdown: "Détaillé : disques et plaquettes avant, disques et plaquettes arrière, deux pneus montés et équilibrés, un amortisseur arrière, durite de refroidissement, quatre heures de main-d'œuvre, frais de contre-visite.",
    qc_example2_age: "9 ans",
    qc_title: "Quote Check",
    qc_your_situation: "Ce que vous nous avez dit",
    qc_tagline: "Collez votre devis de réparation — sachez si on vous surfacture",

    qc_type_label: "Quel type de réparation ?",
    qc_type_appliance: "Électroménager",
    qc_type_car: "Voiture / Véhicule",
    qc_type_other: "Autre",

    qc_item_label: "Que faut-il réparer ?",
    qc_item_ph: "ex. Réfrigérateur Whirlpool, environ 6 ans",

    qc_wrong_label: "Quel est le problème ?",
    qc_wrong_ph: "ex. Ne refroidit plus, fait un fort bourdonnement",

    qc_told_label: "Que vous a dit le réparateur ?",
    qc_told_hint: "son diagnostic — facultatif, mais très utile",
    qc_told_ph: "ex. Il a dit que le compresseur est mort et doit être remplacé",

    qc_price_label: "Quel montant vous a-t-on annoncé ?",

    qc_breakdown_label: "Détail qu'on vous a fourni",
    qc_breakdown_hint: "facultatif",
    qc_breakdown_ph: "ex. Compresseur {{sym}}350, main-d'œuvre {{sym}}200, déplacement {{sym}}95",

    qc_upload_label: "Téléversez le devis original",
    qc_upload_hint: "facultatif — photo ou PDF, je le lirai directement",
    qc_upload_cta: "Cliquez pour téléverser une photo ou un PDF",
    qc_err_file_type: "Veuillez téléverser un fichier JPG, PNG ou PDF.",
    qc_err_file_size: "Fichier trop volumineux — restez sous 10MB.",
    qc_err_file_read: "Impossible de lire ce fichier. Réessayez.",
    qc_kb: "KB",

    qc_second_label: "Un second devis ?",
    qc_second_hint: "facultatif — je les comparerai",

    qc_age_label: "Quel âge a-t-il ?",
    qc_age_hint: "facultatif — utile pour choisir entre réparer et remplacer",
    qc_age_ph: "ex. 6 ans",

    qc_analyzing: "Vérification...",
    qc_check_it: "Vérifier ce devis",
    qc_error: "Une erreur est survenue. Réessayez.",
    qc_new_quote: "Recommencer",
    qc_recent: "Vérifications récentes",
    qc_clear: "Effacer",

    qc_verdict_likely_fair: "PROBABLEMENT CORRECT",
    qc_verdict_somewhat_high: "UN PEU ÉLEVÉ",
    qc_verdict_overpriced: "TROP CHER",
    qc_verdict_cant_tell: "IMPOSSIBLE À DIRE",

    qc_price_check_heading: "Vérification du prix",
    qc_typical_range: "Fourchette habituelle",
    qc_where_falls: "Où se situe ce devis",
    qc_confidence: "Confiance",
    qc_confidence_high: "élevée",
    qc_confidence_medium: "moyenne",
    qc_confidence_low: "faible",

    qc_red_flags_heading: "Signaux d'alerte",
    qc_red_flags_none: "Aucun signal d'alerte — ce devis semble sain.",

    qc_itemization_heading: "Vérification du détail",
    qc_itemized_good: "Ce devis est clairement détaillé.",
    qc_itemized_missing: "Ce qui manque :",

    qc_replace_heading: "Réparer ou remplacer",

    qc_script_heading: "Quoi dire",

    qc_questions_heading: "Questions à poser avant d'accepter",

    qc_second_opinion_heading: "Second avis ?",
    qc_second_opinion_yes: "Un second avis vaut la peine",
    qc_second_opinion_no: "Un second avis n'est probablement pas nécessaire",

    qc_related: "Outils associés",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "Résultats Quote Check",
    qc_copy_verdict: "Verdict :",
    qc_copy_typical: "Fourchette habituelle :",
    qc_copy_flags: "Signaux d'alerte :",
    qc_copy_script: "Quoi dire :",
    qc_copy_questions: "Questions à poser :",

    qc_disclaimer: "Estimation générée par IA à partir de tendances générales du marché — ne remplace pas une vraie comparaison de devis, surtout pour les réparations automobiles.",

    qc_example_item: "Réfrigérateur Whirlpool, environ 6 ans",
    qc_example_wrong: "Refroidit mal ; le congélateur fonctionne mais la partie réfrigérateur reste tiède",
    qc_example_told: "Le technicien a dit que le compresseur lâche et doit être entièrement remplacé",
    qc_example_breakdown: "Compresseur et main-d'œuvre, sans détail fourni",
    qc_example_age: "6 ans",
  },
  de: {
    qc_example2_item: "Ford Focus, Baujahr 2016, 125.000 km",
    qc_example2_wrong: "War zur HU und ist wegen einer verschlissenen Bremsscheibe durchgefallen.",
    qc_example2_told: "Sie riefen an: Da der Wagen ohnehin auf der Bühne stehe, hätten sie außerdem die hinteren Scheiben, beide Vorderreifen, einen undichten Stoßdämpfer und einen gerissenen Kühlerschlauch gefunden — und empfahlen, alles auf einmal zu machen.",
    qc_example2_breakdown: "Aufgeschlüsselt: Scheiben und Beläge vorn, Scheiben und Beläge hinten, zwei Reifen montiert und gewuchtet, ein Stoßdämpfer hinten, Kühlerschlauch, vier Stunden Arbeitszeit, Gebühr für die Nachprüfung.",
    qc_example2_age: "9 Jahre",
    qc_title: "Quote Check",
    qc_your_situation: "Was du uns erzählt hast",
    qc_tagline: "Füge deinen Reparatur-Kostenvoranschlag ein — erfahre, ob du zu viel zahlst",

    qc_type_label: "Was für eine Reparatur?",
    qc_type_appliance: "Haushaltsgerät",
    qc_type_car: "Auto / Fahrzeug",
    qc_type_other: "Sonstiges",

    qc_item_label: "Was muss repariert werden?",
    qc_item_ph: "z. B. Whirlpool-Kühlschrank, etwa 6 Jahre alt",

    qc_wrong_label: "Was ist kaputt?",
    qc_wrong_ph: "z. B. Kühlt nicht mehr, macht ein lautes Brummen",

    qc_told_label: "Was hat dir der Techniker gesagt?",
    qc_told_hint: "seine Diagnose — optional, hilft aber sehr",
    qc_told_ph: "z. B. Er sagte, der Kompressor sei defekt und müsse getauscht werden",

    qc_price_label: "Welcher Preis wurde dir genannt?",

    qc_breakdown_label: "Aufschlüsselung, die du bekommen hast",
    qc_breakdown_hint: "optional",
    qc_breakdown_ph: "z. B. Kompressor {{sym}}350, Arbeitszeit {{sym}}200, Anfahrt {{sym}}95",

    qc_upload_label: "Lade den echten Kostenvoranschlag hoch",
    qc_upload_hint: "optional — Foto oder PDF, ich lese ihn direkt",
    qc_upload_cta: "Klicke, um ein Foto oder PDF hochzuladen",
    qc_err_file_type: "Bitte lade eine JPG-, PNG- oder PDF-Datei hoch.",
    qc_err_file_size: "Datei zu groß — bitte unter 10MB bleiben.",
    qc_err_file_read: "Datei konnte nicht gelesen werden. Versuch es noch einmal.",
    qc_kb: "KB",

    qc_second_label: "Hast du einen zweiten Kostenvoranschlag?",
    qc_second_hint: "optional — ich vergleiche sie",

    qc_age_label: "Wie alt ist es?",
    qc_age_hint: "optional — hilft bei der Frage: reparieren oder ersetzen",
    qc_age_ph: "z. B. 6 Jahre",

    qc_analyzing: "Prüfe...",
    qc_check_it: "Diesen Kostenvoranschlag prüfen",
    qc_error: "Etwas ist schiefgelaufen. Versuch es noch einmal.",
    qc_new_quote: "Neu anfangen",
    qc_recent: "Letzte Prüfungen",
    qc_clear: "Leeren",

    qc_verdict_likely_fair: "WOHL FAIR",
    qc_verdict_somewhat_high: "ETWAS HOCH",
    qc_verdict_overpriced: "ÜBERTEUERT",
    qc_verdict_cant_tell: "NOCH UNKLAR",

    qc_price_check_heading: "Preis-Realitätscheck",
    qc_typical_range: "Übliche Spanne",
    qc_where_falls: "Wo dieser Kostenvoranschlag liegt",
    qc_confidence: "Sicherheit",
    qc_confidence_high: "hoch",
    qc_confidence_medium: "mittel",
    qc_confidence_low: "niedrig",

    qc_red_flags_heading: "Warnsignale",
    qc_red_flags_none: "Keine Warnsignale gefunden — sieht nach einem sauberen Angebot aus.",

    qc_itemization_heading: "Aufschlüsselungs-Check",
    qc_itemized_good: "Dieses Angebot ist klar aufgeschlüsselt.",
    qc_itemized_missing: "Was fehlt:",

    qc_replace_heading: "Reparieren oder ersetzen",

    qc_script_heading: "Was du sagen kannst",

    qc_questions_heading: "Fragen vor der Freigabe",

    qc_second_opinion_heading: "Zweitmeinung?",
    qc_second_opinion_yes: "Eine Zweitmeinung lohnt sich",
    qc_second_opinion_no: "Eine Zweitmeinung ist wohl nicht nötig",

    qc_related: "Verwandte Tools",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "Quote-Check-Ergebnisse",
    qc_copy_verdict: "Urteil:",
    qc_copy_typical: "Übliche Spanne:",
    qc_copy_flags: "Warnsignale:",
    qc_copy_script: "Was du sagen kannst:",
    qc_copy_questions: "Fragen zum Stellen:",

    qc_disclaimer: "KI-Schätzung auf Basis allgemeiner Marktmuster — kein Ersatz für einen echten Angebotsvergleich, besonders bei Fahrzeugreparaturen.",

    qc_example_item: "Whirlpool-Kühlschrank, etwa 6 Jahre alt",
    qc_example_wrong: "Kühlt nicht richtig; das Gefrierfach funktioniert, aber der Kühlteil ist warm",
    qc_example_told: "Der Techniker sagte, der Kompressor sei am Ausfallen und müsse komplett getauscht werden",
    qc_example_breakdown: "Kompressor und Arbeitszeit, keine Aufschlüsselung angegeben",
    qc_example_age: "6 Jahre",
  },
  ja: {
    qc_example2_item: "2016年式フォード・フォーカス、走行12.5万km",
    qc_example2_wrong: "車検に出したら、ブレーキディスクの摩耗で不合格になりました。",
    qc_example2_told: "電話があり、リフトに上げたついでに、リアのディスク、前輪タイヤ二本、オイル漏れのショックアブソーバー、ひび割れた冷却ホースも見つかったので、まとめてやってしまうことを勧められました。",
    qc_example2_breakdown: "内訳あり：フロントのディスクとパッド、リアのディスクとパッド、タイヤ二本（装着・バランス込み）、リアショックアブソーバー一本、冷却ホース、工賃四時間、再検査手数料。",
    qc_example2_age: "9年",
    qc_title: "Quote Check",
    qc_your_situation: "あなたが教えてくれたこと",
    qc_tagline: "修理の見積もりを貼り付けて — ぼったくられていないか確認",

    qc_type_label: "どんな修理ですか?",
    qc_type_appliance: "家電",
    qc_type_car: "車・自動車",
    qc_type_other: "その他",

    qc_item_label: "何を修理しますか?",
    qc_item_ph: "例:Whirlpool の冷蔵庫、使用6年ほど",

    qc_wrong_label: "どんな不具合ですか?",
    qc_wrong_ph: "例:冷えない、大きなブーンという音がする",

    qc_told_label: "修理業者は何と言っていましたか?",
    qc_told_hint: "業者の診断 — 任意ですが、あると助かります",
    qc_told_ph: "例:コンプレッサーが故障していて交換が必要と言われた",

    qc_price_label: "見積もり金額は?",

    qc_breakdown_label: "提示された内訳",
    qc_breakdown_hint: "任意",
    qc_breakdown_ph: "例:コンプレッサー {{sym}}350、作業費 {{sym}}200、出張費 {{sym}}95",

    qc_upload_label: "実際の見積書をアップロード",
    qc_upload_hint: "任意 — 写真か PDF を直接読み取ります",
    qc_upload_cta: "クリックして写真か PDF をアップロード",
    qc_err_file_type: "JPG、PNG、PDF のいずれかをアップロードしてください。",
    qc_err_file_size: "ファイルが大きすぎます — 10MB 未満にしてください。",
    qc_err_file_read: "ファイルを読み込めませんでした。もう一度お試しください。",
    qc_kb: "KB",

    qc_second_label: "相見積もりはありますか?",
    qc_second_hint: "任意 — 比較します",

    qc_age_label: "使用年数は?",
    qc_age_hint: "任意 — 修理か買い替えかの判断に役立ちます",
    qc_age_ph: "例:6年",

    qc_analyzing: "チェック中...",
    qc_check_it: "この見積もりをチェック",
    qc_error: "問題が発生しました。もう一度お試しください。",
    qc_new_quote: "最初からやり直す",
    qc_recent: "最近のチェック",
    qc_clear: "クリア",

    qc_verdict_likely_fair: "おおむね適正",
    qc_verdict_somewhat_high: "やや高め",
    qc_verdict_overpriced: "高すぎる",
    qc_verdict_cant_tell: "まだ判断できない",

    qc_price_check_heading: "価格の現実チェック",
    qc_typical_range: "相場の目安",
    qc_where_falls: "この見積もりの位置づけ",
    qc_confidence: "確度",
    qc_confidence_high: "高",
    qc_confidence_medium: "中",
    qc_confidence_low: "低",

    qc_red_flags_heading: "危険サイン",
    qc_red_flags_none: "危険サインは見つかりませんでした — 問題のない見積もりのようです。",

    qc_itemization_heading: "内訳チェック",
    qc_itemized_good: "この見積もりは内訳が明確です。",
    qc_itemized_missing: "不足している情報:",

    qc_replace_heading: "修理か買い替えか",

    qc_script_heading: "こう伝えましょう",

    qc_questions_heading: "承諾する前に聞くべき質問",

    qc_second_opinion_heading: "相見積もりを取るべき?",
    qc_second_opinion_yes: "相見積もりを取る価値があります",
    qc_second_opinion_no: "相見積もりはおそらく不要です",

    qc_related: "関連ツール",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "Quote Check の結果",
    qc_copy_verdict: "判定:",
    qc_copy_typical: "相場の目安:",
    qc_copy_flags: "危険サイン:",
    qc_copy_script: "こう伝える:",
    qc_copy_questions: "聞くべき質問:",

    qc_disclaimer: "一般的な市場傾向に基づく AI の推定です — 実際の見積もり比較の代わりにはなりません。特に自動車修理では注意してください。",

    qc_example_item: "Whirlpool の冷蔵庫、使用6年ほど",
    qc_example_wrong: "冷えが悪い。冷凍室は正常だが冷蔵室がぬるい",
    qc_example_told: "技術者からコンプレッサーが故障しかけていて全交換が必要と言われた",
    qc_example_breakdown: "コンプレッサーと作業費のみで、内訳の提示なし",
    qc_example_age: "6年",
  },
  ko: {
    qc_example2_item: "2016년식 포드 포커스, 12만 5천 km",
    qc_example2_wrong: "정기검사를 받았는데 브레이크 디스크 마모로 불합격했습니다.",
    qc_example2_told: "전화가 와서, 리프트에 올린 김에 뒤쪽 디스크와 앞 타이어 두 개, 오일이 새는 쇼크업소버, 갈라진 냉각 호스도 발견했다며 한 번에 다 하는 걸 권했습니다.",
    qc_example2_breakdown: "항목별 내역: 앞 디스크와 패드, 뒤 디스크와 패드, 타이어 두 개(장착 및 밸런스 포함), 뒤 쇼크업소버 한 개, 냉각 호스, 공임 4시간, 재검사 수수료.",
    qc_example2_age: "9년",
    qc_title: "Quote Check",
    qc_your_situation: "알려주신 내용",
    qc_tagline: "수리 견적을 붙여넣으세요 — 바가지인지 확인해 드립니다",

    qc_type_label: "어떤 수리인가요?",
    qc_type_appliance: "가전제품",
    qc_type_car: "자동차",
    qc_type_other: "기타",

    qc_item_label: "무엇을 수리하나요?",
    qc_item_ph: "예: Whirlpool 냉장고, 약 6년 사용",

    qc_wrong_label: "어떤 문제가 있나요?",
    qc_wrong_ph: "예: 냉각이 안 되고 큰 웅웅거리는 소리가 남",

    qc_told_label: "수리 기사가 뭐라고 했나요?",
    qc_told_hint: "기사의 진단 — 선택 사항이지만 큰 도움이 됩니다",
    qc_told_ph: "예: 컴프레서가 고장 나서 교체해야 한다고 했어요",

    qc_price_label: "견적 금액은 얼마였나요?",

    qc_breakdown_label: "받은 견적 내역",
    qc_breakdown_hint: "선택 사항",
    qc_breakdown_ph: "예: 컴프레서 {{sym}}350, 인건비 {{sym}}200, 출장비 {{sym}}95",

    qc_upload_label: "실제 견적서 업로드",
    qc_upload_hint: "선택 사항 — 사진이나 PDF를 직접 읽어 드립니다",
    qc_upload_cta: "클릭해서 사진이나 PDF 업로드",
    qc_err_file_type: "JPG, PNG 또는 PDF 파일을 업로드해 주세요.",
    qc_err_file_size: "파일이 너무 큽니다 — 10MB 이하로 유지해 주세요.",
    qc_err_file_read: "파일을 읽을 수 없습니다. 다시 시도해 주세요.",
    qc_kb: "KB",

    qc_second_label: "두 번째 견적이 있나요?",
    qc_second_hint: "선택 사항 — 비교해 드립니다",

    qc_age_label: "얼마나 오래됐나요?",
    qc_age_hint: "선택 사항 — 수리할지 교체할지 판단에 도움이 됩니다",
    qc_age_ph: "예: 6년",

    qc_analyzing: "확인 중...",
    qc_check_it: "이 견적 확인하기",
    qc_error: "문제가 발생했습니다. 다시 시도해 주세요.",
    qc_new_quote: "다시 시작",
    qc_recent: "최근 확인 내역",
    qc_clear: "지우기",

    qc_verdict_likely_fair: "대체로 적정",
    qc_verdict_somewhat_high: "다소 높음",
    qc_verdict_overpriced: "과도한 요금",
    qc_verdict_cant_tell: "아직 판단 불가",

    qc_price_check_heading: "가격 현실 점검",
    qc_typical_range: "일반적인 범위",
    qc_where_falls: "이 견적의 위치",
    qc_confidence: "확신도",
    qc_confidence_high: "높음",
    qc_confidence_medium: "중간",
    qc_confidence_low: "낮음",

    qc_red_flags_heading: "위험 신호",
    qc_red_flags_none: "위험 신호가 없습니다 — 깔끔한 견적으로 보입니다.",

    qc_itemization_heading: "내역 점검",
    qc_itemized_good: "이 견적은 내역이 명확합니다.",
    qc_itemized_missing: "빠진 내용:",

    qc_replace_heading: "수리 vs 교체",

    qc_script_heading: "이렇게 말해 보세요",

    qc_questions_heading: "승인 전에 물어볼 질문",

    qc_second_opinion_heading: "다른 곳에도 물어볼까요?",
    qc_second_opinion_yes: "다른 업체의 의견을 들어볼 가치가 있습니다",
    qc_second_opinion_no: "다른 의견은 아마 필요 없을 것 같습니다",

    qc_related: "관련 도구",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "Quote Check 결과",
    qc_copy_verdict: "판정:",
    qc_copy_typical: "일반적인 범위:",
    qc_copy_flags: "위험 신호:",
    qc_copy_script: "이렇게 말하기:",
    qc_copy_questions: "물어볼 질문:",

    qc_disclaimer: "일반적인 시장 패턴에 기반한 AI 추정입니다 — 실제 견적 비교를 대체할 수 없으며, 특히 자동차 수리는 더욱 그렇습니다.",

    qc_example_item: "Whirlpool 냉장고, 약 6년 사용",
    qc_example_wrong: "냉각이 잘 안 됨. 냉동실은 정상이지만 냉장실이 미지근함",
    qc_example_told: "기사가 컴프레서가 고장 나고 있어 전체 교체가 필요하다고 함",
    qc_example_breakdown: "컴프레서와 인건비, 상세 내역 없음",
    qc_example_age: "6년",
  },
  ru: {
    qc_example2_item: "Ford Focus 2016 года, 125 000 км",
    qc_example2_wrong: "Пригнал на техосмотр — не прошёл из-за изношенного тормозного диска.",
    qc_example2_told: "Позвонили и сказали, что раз машина всё равно на подъёмнике, они нашли ещё задние диски, обе передние шины, подтекающий амортизатор и треснувший патрубок — и советуют сделать всё сразу.",
    qc_example2_breakdown: "С разбивкой: передние диски и колодки, задние диски и колодки, две шины с установкой и балансировкой, один задний амортизатор, патрубок, четыре часа работ, плата за повторный техосмотр.",
    qc_example2_age: "9 лет",
    qc_title: "Quote Check",
    qc_your_situation: "Что вы нам рассказали",
    qc_tagline: "Вставьте смету на ремонт — узнайте, не переплачиваете ли вы",

    qc_type_label: "Какой ремонт?",
    qc_type_appliance: "Бытовая техника",
    qc_type_car: "Автомобиль",
    qc_type_other: "Другое",

    qc_item_label: "Что нужно починить?",
    qc_item_ph: "напр. Холодильник Whirlpool, около 6 лет",

    qc_wrong_label: "Что случилось?",
    qc_wrong_ph: "напр. Не холодит, громко гудит",

    qc_told_label: "Что сказал мастер?",
    qc_told_hint: "его диагноз — необязательно, но очень помогает",
    qc_told_ph: "напр. Сказал, что компрессор неисправен и его нужно заменить",

    qc_price_label: "Сколько вам насчитали?",

    qc_breakdown_label: "Детализация, которую вам дали",
    qc_breakdown_hint: "необязательно",
    qc_breakdown_ph: "напр. Компрессор {{sym}}350, работа {{sym}}200, выезд {{sym}}95",

    qc_upload_label: "Загрузите саму смету",
    qc_upload_hint: "необязательно — фото или PDF, я прочту напрямую",
    qc_upload_cta: "Нажмите, чтобы загрузить фото или PDF",
    qc_err_file_type: "Загрузите файл JPG, PNG или PDF.",
    qc_err_file_size: "Файл слишком большой — не более 10MB.",
    qc_err_file_read: "Не удалось прочитать файл. Попробуйте ещё раз.",
    qc_kb: "KB",

    qc_second_label: "Есть вторая смета?",
    qc_second_hint: "необязательно — я их сравню",

    qc_age_label: "Сколько ему лет?",
    qc_age_hint: "необязательно — помогает решить: чинить или менять",
    qc_age_ph: "напр. 6 лет",

    qc_analyzing: "Проверяю...",
    qc_check_it: "Проверить эту смету",
    qc_error: "Что-то пошло не так. Попробуйте ещё раз.",
    qc_new_quote: "Начать заново",
    qc_recent: "Недавние проверки",
    qc_clear: "Очистить",

    qc_verdict_likely_fair: "СКОРЕЕ ЧЕСТНАЯ ЦЕНА",
    qc_verdict_somewhat_high: "НЕМНОГО ЗАВЫШЕНО",
    qc_verdict_overpriced: "СИЛЬНО ЗАВЫШЕНО",
    qc_verdict_cant_tell: "ПОКА НЕЯСНО",

    qc_price_check_heading: "Проверка цены",
    qc_typical_range: "Типичный диапазон",
    qc_where_falls: "Где находится эта смета",
    qc_confidence: "Уверенность",
    qc_confidence_high: "высокая",
    qc_confidence_medium: "средняя",
    qc_confidence_low: "низкая",

    qc_red_flags_heading: "Тревожные признаки",
    qc_red_flags_none: "Тревожных признаков нет — смета выглядит честной.",

    qc_itemization_heading: "Проверка детализации",
    qc_itemized_good: "Смета детализирована понятно.",
    qc_itemized_missing: "Чего не хватает:",

    qc_replace_heading: "Чинить или менять",

    qc_script_heading: "Что сказать",

    qc_questions_heading: "Вопросы перед согласием",

    qc_second_opinion_heading: "Второе мнение?",
    qc_second_opinion_yes: "Стоит получить второе мнение",
    qc_second_opinion_no: "Второе мнение, скорее всего, не нужно",

    qc_related: "Похожие инструменты",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "Результаты Quote Check",
    qc_copy_verdict: "Вердикт:",
    qc_copy_typical: "Типичный диапазон:",
    qc_copy_flags: "Тревожные признаки:",
    qc_copy_script: "Что сказать:",
    qc_copy_questions: "Вопросы:",

    qc_disclaimer: "Оценка сгенерирована ИИ на основе общих рыночных закономерностей — не заменяет реальное сравнение смет, особенно при ремонте автомобилей.",

    qc_example_item: "Холодильник Whirlpool, около 6 лет",
    qc_example_wrong: "Плохо холодит: морозилка работает, а холодильное отделение тёплое",
    qc_example_told: "Мастер сказал, что компрессор выходит из строя и нужна полная замена",
    qc_example_breakdown: "Компрессор и работа, без детализации",
    qc_example_age: "6 лет",
  },
  th: {
    qc_example2_item: "ฟอร์ด โฟกัส ปี 2016 วิ่ง 125,000 กม.",
    qc_example2_wrong: "เอาไปตรวจสภาพรถ ไม่ผ่านเพราะจานเบรกสึก",
    qc_example2_told: "เขาโทรมาบอกว่าในเมื่อรถอยู่บนลิฟต์แล้ว เขาเจอจานเบรกหลัง ยางหน้าสองเส้น โช้กที่มีน้ำมันรั่ว และท่อหม้อน้ำที่ร้าวด้วย และแนะนำให้ทำทั้งหมดในคราวเดียว",
    qc_example2_breakdown: "แจกแจงรายการ: จานและผ้าเบรกหน้า จานและผ้าเบรกหลัง ยางสองเส้นพร้อมใส่และถ่วงล้อ โช้กหลังหนึ่งตัว ท่อหม้อน้ำ ค่าแรงสี่ชั่วโมง และค่าตรวจสภาพซ้ำ",
    qc_example2_age: "9 ปี",
    qc_title: "Quote Check",
    qc_your_situation: "สิ่งที่คุณบอกเรา",
    qc_tagline: "วางใบเสนอราคาซ่อมของคุณ — เช็กว่าโดนคิดแพงเกินไปหรือไม่",

    qc_type_label: "ซ่อมประเภทไหน?",
    qc_type_appliance: "เครื่องใช้ไฟฟ้า",
    qc_type_car: "รถยนต์",
    qc_type_other: "อื่น ๆ",

    qc_item_label: "จะซ่อมอะไร?",
    qc_item_ph: "เช่น ตู้เย็น Whirlpool อายุประมาณ 6 ปี",

    qc_wrong_label: "มีปัญหาอะไร?",
    qc_wrong_ph: "เช่น ไม่เย็น มีเสียงหึ่งดัง",

    qc_told_label: "ช่างบอกอะไรคุณบ้าง?",
    qc_told_hint: "คำวินิจฉัยของช่าง — ไม่บังคับ แต่ช่วยได้มาก",
    qc_told_ph: "เช่น ช่างบอกว่าคอมเพรสเซอร์เสีย ต้องเปลี่ยน",

    qc_price_label: "ได้ราคาเสนอมาเท่าไหร่?",

    qc_breakdown_label: "รายละเอียดที่เขาแจกแจงให้",
    qc_breakdown_hint: "ไม่บังคับ",
    qc_breakdown_ph: "เช่น คอมเพรสเซอร์ {{sym}}350 ค่าแรง {{sym}}200 ค่าเดินทาง {{sym}}95",

    qc_upload_label: "อัปโหลดใบเสนอราคาตัวจริง",
    qc_upload_hint: "ไม่บังคับ — รูปถ่ายหรือ PDF เดี๋ยวอ่านให้เอง",
    qc_upload_cta: "คลิกเพื่ออัปโหลดรูปหรือ PDF",
    qc_err_file_type: "กรุณาอัปโหลดไฟล์ JPG, PNG หรือ PDF",
    qc_err_file_size: "ไฟล์ใหญ่เกินไป — ต้องไม่เกิน 10MB",
    qc_err_file_read: "อ่านไฟล์ไม่ได้ กรุณาลองใหม่",
    qc_kb: "KB",

    qc_second_label: "มีใบเสนอราคาที่สองไหม?",
    qc_second_hint: "ไม่บังคับ — เดี๋ยวเปรียบเทียบให้",

    qc_age_label: "ใช้มานานแค่ไหน?",
    qc_age_hint: "ไม่บังคับ — ช่วยตัดสินว่าซ่อมหรือซื้อใหม่ดี",
    qc_age_ph: "เช่น 6 ปี",

    qc_analyzing: "กำลังตรวจสอบ...",
    qc_check_it: "ตรวจสอบใบเสนอราคานี้",
    qc_error: "เกิดข้อผิดพลาด กรุณาลองใหม่",
    qc_new_quote: "เริ่มใหม่",
    qc_recent: "การตรวจสอบล่าสุด",
    qc_clear: "ล้าง",

    qc_verdict_likely_fair: "น่าจะสมเหตุสมผล",
    qc_verdict_somewhat_high: "ค่อนข้างแพง",
    qc_verdict_overpriced: "แพงเกินไป",
    qc_verdict_cant_tell: "ยังบอกไม่ได้",

    qc_price_check_heading: "เช็กราคาตามจริง",
    qc_typical_range: "ช่วงราคาทั่วไป",
    qc_where_falls: "ใบเสนอราคานี้อยู่ตรงไหน",
    qc_confidence: "ความมั่นใจ",
    qc_confidence_high: "สูง",
    qc_confidence_medium: "ปานกลาง",
    qc_confidence_low: "ต่ำ",

    qc_red_flags_heading: "สัญญาณเตือน",
    qc_red_flags_none: "ไม่พบสัญญาณเตือน — ใบเสนอราคานี้ดูโอเค",

    qc_itemization_heading: "เช็กรายละเอียดราคา",
    qc_itemized_good: "ใบเสนอราคานี้แจกแจงรายการชัดเจน",
    qc_itemized_missing: "สิ่งที่ขาดไป:",

    qc_replace_heading: "ซ่อมหรือซื้อใหม่",

    qc_script_heading: "พูดแบบนี้ได้เลย",

    qc_questions_heading: "คำถามที่ควรถามก่อนตกลง",

    qc_second_opinion_heading: "ถามเจ้าอื่นดีไหม?",
    qc_second_opinion_yes: "คุ้มที่จะถามความเห็นเจ้าอื่น",
    qc_second_opinion_no: "อาจไม่จำเป็นต้องถามเจ้าอื่น",

    qc_related: "เครื่องมือที่เกี่ยวข้อง",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "ผลการตรวจของ Quote Check",
    qc_copy_verdict: "ผลตัดสิน:",
    qc_copy_typical: "ช่วงราคาทั่วไป:",
    qc_copy_flags: "สัญญาณเตือน:",
    qc_copy_script: "พูดแบบนี้:",
    qc_copy_questions: "คำถามที่ควรถาม:",

    qc_disclaimer: "การประเมินโดย AI จากแนวโน้มตลาดทั่วไป — ไม่สามารถแทนการเปรียบเทียบราคาจริงได้ โดยเฉพาะงานซ่อมรถยนต์",

    qc_example_item: "ตู้เย็น Whirlpool อายุประมาณ 6 ปี",
    qc_example_wrong: "ไม่ค่อยเย็น ช่องแช่แข็งปกติ แต่ช่องแช่เย็นอุ่น",
    qc_example_told: "ช่างบอกว่าคอมเพรสเซอร์กำลังจะเสีย ต้องเปลี่ยนทั้งชุด",
    qc_example_breakdown: "คอมเพรสเซอร์กับค่าแรง ไม่มีรายละเอียดแจกแจง",
    qc_example_age: "6 ปี",
  },
  vi: {
    qc_example2_item: "Ford Focus 2016, 125.000 km",
    qc_example2_wrong: "Đem đi đăng kiểm thì trượt vì đĩa phanh mòn.",
    qc_example2_told: "Họ gọi báo rằng nhân lúc xe đang trên cầu nâng, họ còn thấy đĩa sau, hai lốp trước, một phuộc bị rỉ dầu và một ống nước làm mát bị nứt, và khuyên nên làm hết một lượt.",
    qc_example2_breakdown: "Có bóc tách: đĩa và má phanh trước, đĩa và má phanh sau, hai lốp gồm lắp và cân bằng, một phuộc sau, ống nước làm mát, bốn giờ công, phí đăng kiểm lại.",
    qc_example2_age: "9 năm",
    qc_title: "Quote Check",
    qc_your_situation: "Những gì bạn đã chia sẻ",
    qc_tagline: "Dán báo giá sửa chữa của bạn — xem có bị tính giá quá cao không",

    qc_type_label: "Sửa loại gì?",
    qc_type_appliance: "Đồ gia dụng",
    qc_type_car: "Ô tô / Xe",
    qc_type_other: "Khác",

    qc_item_label: "Cần sửa gì?",
    qc_item_ph: "vd: Tủ lạnh Whirlpool, khoảng 6 năm tuổi",

    qc_wrong_label: "Bị hỏng gì?",
    qc_wrong_ph: "vd: Không lạnh, kêu ù ù rất to",

    qc_told_label: "Thợ sửa nói gì với bạn?",
    qc_told_hint: "chẩn đoán của thợ — không bắt buộc, nhưng rất hữu ích",
    qc_told_ph: "vd: Thợ nói máy nén hỏng và cần thay",

    qc_price_label: "Báo giá bao nhiêu?",

    qc_breakdown_label: "Bảng kê chi tiết họ đưa",
    qc_breakdown_hint: "không bắt buộc",
    qc_breakdown_ph: "vd: Máy nén {{sym}}350, tiền công {{sym}}200, phí kiểm tra {{sym}}95",

    qc_upload_label: "Tải lên báo giá thực tế",
    qc_upload_hint: "không bắt buộc — ảnh hoặc PDF, tôi sẽ đọc trực tiếp",
    qc_upload_cta: "Nhấp để tải lên ảnh hoặc PDF",
    qc_err_file_type: "Vui lòng tải lên tệp JPG, PNG hoặc PDF.",
    qc_err_file_size: "Tệp quá lớn — vui lòng giữ dưới 10MB.",
    qc_err_file_read: "Không đọc được tệp. Vui lòng thử lại.",
    qc_kb: "KB",

    qc_second_label: "Có báo giá thứ hai không?",
    qc_second_hint: "không bắt buộc — tôi sẽ so sánh",

    qc_age_label: "Đã dùng bao lâu?",
    qc_age_hint: "không bắt buộc — giúp cân nhắc sửa hay thay mới",
    qc_age_ph: "vd: 6 năm",

    qc_analyzing: "Đang kiểm tra...",
    qc_check_it: "Kiểm tra báo giá này",
    qc_error: "Đã có lỗi xảy ra. Vui lòng thử lại.",
    qc_new_quote: "Bắt đầu lại",
    qc_recent: "Các lần kiểm tra gần đây",
    qc_clear: "Xóa",

    qc_verdict_likely_fair: "CÓ VẺ HỢP LÝ",
    qc_verdict_somewhat_high: "HƠI CAO",
    qc_verdict_overpriced: "QUÁ ĐẮT",
    qc_verdict_cant_tell: "CHƯA THỂ KẾT LUẬN",

    qc_price_check_heading: "Đối chiếu giá thực tế",
    qc_typical_range: "Khoảng giá thường gặp",
    qc_where_falls: "Báo giá này nằm ở đâu",
    qc_confidence: "Độ tin cậy",
    qc_confidence_high: "cao",
    qc_confidence_medium: "trung bình",
    qc_confidence_low: "thấp",

    qc_red_flags_heading: "Dấu hiệu đáng ngờ",
    qc_red_flags_none: "Không thấy dấu hiệu đáng ngờ — báo giá này có vẻ ổn.",

    qc_itemization_heading: "Kiểm tra bảng kê",
    qc_itemized_good: "Báo giá này được kê chi tiết rõ ràng.",
    qc_itemized_missing: "Còn thiếu:",

    qc_replace_heading: "Sửa hay thay mới",

    qc_script_heading: "Nên nói gì",

    qc_questions_heading: "Câu hỏi cần hỏi trước khi đồng ý",

    qc_second_opinion_heading: "Hỏi thêm nơi khác?",
    qc_second_opinion_yes: "Nên hỏi thêm ý kiến nơi khác",
    qc_second_opinion_no: "Có lẽ không cần hỏi thêm nơi khác",

    qc_related: "Công cụ liên quan",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "Kết quả Quote Check",
    qc_copy_verdict: "Kết luận:",
    qc_copy_typical: "Khoảng giá thường gặp:",
    qc_copy_flags: "Dấu hiệu đáng ngờ:",
    qc_copy_script: "Nên nói:",
    qc_copy_questions: "Câu hỏi cần hỏi:",

    qc_disclaimer: "Ước tính do AI tạo dựa trên xu hướng thị trường chung — không thay thế việc so sánh báo giá thực tế, nhất là với sửa chữa ô tô.",

    qc_example_item: "Tủ lạnh Whirlpool, khoảng 6 năm tuổi",
    qc_example_wrong: "Làm lạnh kém; ngăn đá vẫn ổn nhưng ngăn mát bị ấm",
    qc_example_told: "Thợ nói máy nén sắp hỏng và cần thay toàn bộ",
    qc_example_breakdown: "Máy nén và tiền công, không có bảng kê chi tiết",
    qc_example_age: "6 năm",
  },
};
