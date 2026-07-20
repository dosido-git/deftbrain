// ContractDecoder — cd_* keys for all 13 languages. Self-contained data.
// Brand/tool names (Contract Decoder, Lease Trap Detector, Complaint Escalation
// Writer, Leverage Logic, ACME Corp) stay as-is across languages.
// cd_example_contract is a format-sample contract: same value across langs is fine.
export const contractDecoder = {
  en: {
    cd_your_situation: "What you told us",
    cd_chars_analyzed: "{{count}} characters analyzed",
    cd_title: "Contract Decoder",
    cd_tagline: "Paste any contract — know exactly what you're signing.",
    cd_type_label: "Contract type",
    cd_type_employment: "Employment",
    cd_type_freelance: "Freelance / NDA",
    cd_type_lease: "Lease / Rental",
    cd_type_saas: "SaaS / Terms",
    cd_type_service: "Service Agreement",
    cd_type_purchase: "Purchase / Sale",
    cd_type_partnership: "Partnership",
    cd_type_other: "Other",
    cd_focus_label: "Focus areas",
    cd_focus_hint: "(optional — select what matters most to you)",
    cd_focus_exit: "Exit / termination terms",
    cd_focus_liability: "Liability & indemnification",
    cd_focus_ip: "IP & ownership rights",
    cd_focus_autorenewal: "Auto-renewal & cancellation",
    cd_focus_payment: "Payment & refund terms",
    cd_focus_noncompete: "Non-compete / non-solicitation",
    cd_focus_privacy: "Data & privacy",
    cd_focus_dispute: "Dispute resolution",
    cd_text_label: "Contract text",
    cd_text_ph: "Paste the full contract text here — employment agreement, NDA, lease, terms of service, service agreement…",
    cd_text_short: "Paste more of the contract for a useful analysis.",
    cd_context_label: "Your situation",
    cd_context_hint: "(optional)",
    cd_context_ph: "e.g., 'I'm a freelancer, this is for a 3-month project' or 'First job offer, no leverage to negotiate'",
    cd_xref_lease_q: "Signing a lease?",
    cd_xref_lease_tail: "goes deeper on rental agreements.",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "Analyzing…",
    cd_decode: "Decode This Contract",
    cd_recent: "Recent analyses",
    cd_clear: "Clear",
    cd_high_risk_clauses: "high-risk clause",
    cd_high_risk_clauses_plural: "high-risk clauses",
    cd_new_contract: "New contract",
    cd_risk_high: "HIGH RISK",
    cd_risk_medium: "REVIEW CAREFULLY",
    cd_risk_low: "LOOKS REASONABLE",
    cd_risk_reviewed: "REVIEWED",
    cd_found_clause: "high-risk clause found",
    cd_found_clauses: "high-risk clauses found",
    cd_high_heading: "High-risk clauses",
    cd_medium_heading: "Watch these clauses",
    cd_low_heading: "Standard clauses",
    cd_missing_heading: "Missing protections",
    cd_before_heading: "Before you sign",
    cd_related: "Related tools",
    cd_contract_language: "Contract language",
    cd_why_matters: "Why it matters:",
    cd_ask_for: "Ask for:",
    cd_error: "Something went wrong. Please try again.",
    cd_copy_header: "CONTRACT DECODER ANALYSIS",
    cd_copy_overall: "Overall risk:",
    cd_copy_highrisk: "High-risk clauses:",
    cd_copy_clauses: "CLAUSES FLAGGED",
    cd_copy_negotiate: "Negotiate:",
    cd_copy_missing: "MISSING PROTECTIONS",
    cd_copy_before: "BEFORE YOU SIGN",
    cd_example_contract: `FREELANCE SERVICES AGREEMENT

This Agreement is entered into as of the date of signing between ACME Corp ("Client") and the undersigned designer ("Contractor").

1. SERVICES
Contractor agrees to provide graphic design services as directed by Client.

2. COMPENSATION
Client shall pay Contractor {{sym}}75/hour. Payment is due within 60 days of invoice. Client may dispute any invoice within 90 days of receipt. Contractor waives all right to payment if not claimed within 6 months of completion.

3. INTELLECTUAL PROPERTY
All work product, including preliminary designs, sketches, and concepts, shall be the sole and exclusive property of Client upon creation, regardless of payment status. Contractor hereby assigns all rights, title, and interest in any work product to Client. Contractor waives all moral rights. Client may use Contractor's name and portfolio samples in perpetuity for marketing purposes.

4. TERMINATION
Client may terminate this agreement at any time with or without cause, with zero notice. Upon termination, Contractor shall deliver all work in progress immediately. No compensation shall be due for work not yet invoiced at time of termination.

5. NON-COMPETE
Contractor agrees not to perform design services for any company in the technology sector for a period of 24 months following termination of this agreement.

6. CONFIDENTIALITY
Contractor shall keep all Client information confidential in perpetuity, including after termination, and shall not discuss the existence of this agreement with any third party.

7. DISPUTE RESOLUTION
Any disputes shall be resolved by binding arbitration in the Client's jurisdiction. Contractor waives all right to jury trial. Client may seek injunctive relief in any court without posting bond.

8. GOVERNING LAW
This agreement shall be governed by the laws of Delaware, regardless of Contractor's location.

9. ENTIRE AGREEMENT
This agreement supersedes all prior agreements. Client may modify this agreement at any time by posting updates to its website.`,
    cd_example_context: "I'm a freelance designer being asked to sign this before starting a project for a startup.",
  },
  es: {
    cd_your_situation: "Lo que nos contaste",
    cd_chars_analyzed: "{{count}} caracteres analizados",
    cd_title: "Contract Decoder",
    cd_tagline: "Pega cualquier contrato y sabe exactamente qué estás firmando.",
    cd_type_label: "Tipo de contrato",
    cd_type_employment: "Empleo",
    cd_type_freelance: "Freelance / NDA",
    cd_type_lease: "Arrendamiento / Alquiler",
    cd_type_saas: "SaaS / Términos",
    cd_type_service: "Acuerdo de servicios",
    cd_type_purchase: "Compra / Venta",
    cd_type_partnership: "Sociedad",
    cd_type_other: "Otro",
    cd_focus_label: "Áreas de enfoque",
    cd_focus_hint: "(opcional: selecciona lo que más te importa)",
    cd_focus_exit: "Condiciones de salida / rescisión",
    cd_focus_liability: "Responsabilidad e indemnización",
    cd_focus_ip: "Propiedad intelectual y derechos de propiedad",
    cd_focus_autorenewal: "Renovación automática y cancelación",
    cd_focus_payment: "Condiciones de pago y reembolso",
    cd_focus_noncompete: "No competencia / no captación",
    cd_focus_privacy: "Datos y privacidad",
    cd_focus_dispute: "Resolución de disputas",
    cd_text_label: "Texto del contrato",
    cd_text_ph: "Pega aquí el texto completo del contrato: contrato laboral, NDA, arrendamiento, términos de servicio, acuerdo de servicios…",
    cd_text_short: "Pega más del contrato para un análisis útil.",
    cd_context_label: "Tu situación",
    cd_context_hint: "(opcional)",
    cd_context_ph: "p. ej., 'Soy freelance, esto es para un proyecto de 3 meses' o 'Primera oferta de trabajo, sin margen para negociar'",
    cd_xref_lease_q: "¿Vas a firmar un alquiler?",
    cd_xref_lease_tail: "profundiza en los contratos de alquiler.",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "Analizando…",
    cd_decode: "Descifrar este contrato",
    cd_recent: "Análisis recientes",
    cd_clear: "Borrar",
    cd_high_risk_clauses: "cláusula de alto riesgo",
    cd_high_risk_clauses_plural: "cláusulas de alto riesgo",
    cd_new_contract: "Nuevo contrato",
    cd_risk_high: "ALTO RIESGO",
    cd_risk_medium: "REVISAR CON CUIDADO",
    cd_risk_low: "PARECE RAZONABLE",
    cd_risk_reviewed: "REVISADO",
    cd_found_clause: "cláusula de alto riesgo encontrada",
    cd_found_clauses: "cláusulas de alto riesgo encontradas",
    cd_high_heading: "Cláusulas de alto riesgo",
    cd_medium_heading: "Vigila estas cláusulas",
    cd_low_heading: "Cláusulas estándar",
    cd_missing_heading: "Protecciones ausentes",
    cd_before_heading: "Antes de firmar",
    cd_related: "Herramientas relacionadas",
    cd_contract_language: "Texto del contrato",
    cd_why_matters: "Por qué importa:",
    cd_ask_for: "Pide:",
    cd_error: "Algo salió mal. Inténtalo de nuevo.",
    cd_copy_header: "ANÁLISIS DE CONTRACT DECODER",
    cd_copy_overall: "Riesgo general:",
    cd_copy_highrisk: "Cláusulas de alto riesgo:",
    cd_copy_clauses: "CLÁUSULAS SEÑALADAS",
    cd_copy_negotiate: "Negociar:",
    cd_copy_missing: "PROTECCIONES AUSENTES",
    cd_copy_before: "ANTES DE FIRMAR",
    cd_example_contract: `CONTRATO DE SERVICIOS FREELANCE

Este Contrato se celebra en la fecha de su firma entre ACME Corp ("Cliente") y el diseñador abajo firmante ("Contratista").

1. SERVICIOS
El Contratista acepta prestar servicios de diseño gráfico según las indicaciones del Cliente.

2. COMPENSACIÓN
El Cliente pagará al Contratista {{sym}}75/hora. El pago vence dentro de los 60 días de la factura. El Cliente puede impugnar cualquier factura dentro de los 90 días de recibida. El Contratista renuncia a todo derecho de cobro si no lo reclama dentro de los 6 meses posteriores a la finalización.

3. PROPIEDAD INTELECTUAL
Todo el producto del trabajo, incluidos diseños preliminares, bocetos y conceptos, será propiedad única y exclusiva del Cliente desde su creación, sin importar el estado del pago. El Contratista cede al Cliente todos los derechos, títulos e intereses sobre cualquier producto del trabajo. El Contratista renuncia a todos los derechos morales. El Cliente puede usar el nombre del Contratista y muestras de su portafolio a perpetuidad con fines de marketing.

4. RESCISIÓN
El Cliente puede rescindir este contrato en cualquier momento, con o sin causa, sin previo aviso. Al rescindirse, el Contratista entregará de inmediato todo el trabajo en curso. No se adeudará compensación alguna por el trabajo aún no facturado al momento de la rescisión.

5. NO COMPETENCIA
El Contratista acepta no prestar servicios de diseño a ninguna empresa del sector tecnológico durante un período de 24 meses tras la rescisión de este contrato.

6. CONFIDENCIALIDAD
El Contratista mantendrá toda la información del Cliente confidencial a perpetuidad, incluso tras la rescisión, y no comentará la existencia de este contrato con terceros.

7. RESOLUCIÓN DE DISPUTAS
Cualquier disputa se resolverá mediante arbitraje vinculante en la jurisdicción del Cliente. El Contratista renuncia a todo derecho a un juicio con jurado. El Cliente puede solicitar medidas cautelares en cualquier tribunal sin prestar fianza.

8. LEY APLICABLE
Este contrato se regirá por las leyes de Delaware, sin importar la ubicación del Contratista.

9. ACUERDO COMPLETO
Este contrato sustituye todos los acuerdos previos. El Cliente puede modificar este contrato en cualquier momento publicando actualizaciones en su sitio web.`,
    cd_example_context: "Soy diseñador freelance y me piden firmar esto antes de empezar un proyecto para una startup.",
  },
  zh: {
    cd_your_situation: "你告诉我们的情况",
    cd_chars_analyzed: "已分析 {{count}} 个字符",
    cd_title: "Contract Decoder",
    cd_tagline: "粘贴任何合同——清楚知道你正在签什么。",
    cd_type_label: "合同类型",
    cd_type_employment: "雇佣",
    cd_type_freelance: "自由职业 / 保密协议",
    cd_type_lease: "租赁 / 出租",
    cd_type_saas: "SaaS / 条款",
    cd_type_service: "服务协议",
    cd_type_purchase: "购买 / 销售",
    cd_type_partnership: "合伙",
    cd_type_other: "其他",
    cd_focus_label: "重点关注",
    cd_focus_hint: "（可选——选择你最在意的方面）",
    cd_focus_exit: "退出 / 终止条款",
    cd_focus_liability: "责任与赔偿",
    cd_focus_ip: "知识产权与所有权",
    cd_focus_autorenewal: "自动续约与取消",
    cd_focus_payment: "付款与退款条款",
    cd_focus_noncompete: "竞业禁止 / 禁止招揽",
    cd_focus_privacy: "数据与隐私",
    cd_focus_dispute: "争议解决",
    cd_text_label: "合同文本",
    cd_text_ph: "在此粘贴完整合同文本——雇佣协议、保密协议、租约、服务条款、服务协议……",
    cd_text_short: "粘贴更多合同内容以获得有用的分析。",
    cd_context_label: "你的情况",
    cd_context_hint: "（可选）",
    cd_context_ph: "例如「我是自由职业者，这是一个 3 个月的项目」或「第一份工作邀约，没有谈判筹码」",
    cd_xref_lease_q: "要签租约？",
    cd_xref_lease_tail: "对租赁协议有更深入的解析。",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "分析中……",
    cd_decode: "解读这份合同",
    cd_recent: "最近的分析",
    cd_clear: "清除",
    cd_high_risk_clauses: "条高风险条款",
    cd_high_risk_clauses_plural: "条高风险条款",
    cd_new_contract: "新合同",
    cd_risk_high: "高风险",
    cd_risk_medium: "请仔细审查",
    cd_risk_low: "看起来合理",
    cd_risk_reviewed: "已审查",
    cd_found_clause: "条高风险条款",
    cd_found_clauses: "条高风险条款",
    cd_high_heading: "高风险条款",
    cd_medium_heading: "留意这些条款",
    cd_low_heading: "标准条款",
    cd_missing_heading: "缺失的保护",
    cd_before_heading: "签字之前",
    cd_related: "相关工具",
    cd_contract_language: "合同原文",
    cd_why_matters: "为何重要：",
    cd_ask_for: "可以要求：",
    cd_error: "出了点问题，请重试。",
    cd_copy_header: "CONTRACT DECODER 分析",
    cd_copy_overall: "总体风险：",
    cd_copy_highrisk: "高风险条款：",
    cd_copy_clauses: "标记的条款",
    cd_copy_negotiate: "可谈判：",
    cd_copy_missing: "缺失的保护",
    cd_copy_before: "签字之前",
    cd_example_contract: `自由职业服务协议

本协议自签署之日起由 ACME Corp（"客户"）与下方签字的设计师（"承包方"）订立。

1. 服务
承包方同意按客户的指示提供平面设计服务。

2. 报酬
客户应按 {{sym}}75/小时向承包方付款。款项应在开具发票后 60 天内支付。客户可在收到发票后 90 天内对任何发票提出异议。承包方若未在完工后 6 个月内主张付款，则放弃所有付款权利。

3. 知识产权
所有工作成果，包括初步设计、草图和概念，自创作之时起即为客户的唯一且独占财产，无论付款状态如何。承包方在此将任何工作成果的全部权利、所有权和权益转让给客户。承包方放弃所有精神权利。客户可永久使用承包方的姓名及作品集样本用于营销目的。

4. 终止
客户可在任何时候有理由或无理由地、无需提前通知地终止本协议。终止后，承包方应立即交付所有进行中的工作。终止时尚未开具发票的工作不应获得任何报酬。

5. 竞业禁止
承包方同意在本协议终止后的 24 个月内，不为任何科技行业的公司提供设计服务。

6. 保密
承包方应永久对客户的所有信息保密，包括终止之后，并不得向任何第三方谈及本协议的存在。

7. 争议解决
任何争议应在客户所在司法管辖区通过有约束力的仲裁解决。承包方放弃所有陪审团审判权利。客户可在任何法院寻求禁令救济而无需提供保证金。

8. 适用法律
本协议受特拉华州法律管辖，无论承包方位于何处。

9. 完整协议
本协议取代所有先前协议。客户可在任何时候通过在其网站发布更新来修改本协议。`,
    cd_example_context: "我是一名自由职业设计师，在为一家初创公司开始项目前被要求签署这份合同。",
  },
  hi: {
    cd_your_situation: "आपने हमें जो बताया",
    cd_chars_analyzed: "{{count}} वर्णों का विश्लेषण किया गया",
    cd_title: "Contract Decoder",
    cd_tagline: "कोई भी अनुबंध पेस्ट करें — ठीक-ठीक जानें कि आप क्या साइन कर रहे हैं।",
    cd_type_label: "अनुबंध का प्रकार",
    cd_type_employment: "रोज़गार",
    cd_type_freelance: "फ्रीलांस / NDA",
    cd_type_lease: "लीज़ / किराया",
    cd_type_saas: "SaaS / शर्तें",
    cd_type_service: "सेवा अनुबंध",
    cd_type_purchase: "खरीद / बिक्री",
    cd_type_partnership: "साझेदारी",
    cd_type_other: "अन्य",
    cd_focus_label: "ध्यान देने के क्षेत्र",
    cd_focus_hint: "(वैकल्पिक — जो आपके लिए सबसे ज़रूरी है उसे चुनें)",
    cd_focus_exit: "बाहर निकलने / समाप्ति की शर्तें",
    cd_focus_liability: "देयता और क्षतिपूर्ति",
    cd_focus_ip: "बौद्धिक संपदा और स्वामित्व अधिकार",
    cd_focus_autorenewal: "स्वतः नवीनीकरण और रद्दीकरण",
    cd_focus_payment: "भुगतान और रिफंड की शर्तें",
    cd_focus_noncompete: "गैर-प्रतिस्पर्धा / गैर-याचना",
    cd_focus_privacy: "डेटा और गोपनीयता",
    cd_focus_dispute: "विवाद समाधान",
    cd_text_label: "अनुबंध का पाठ",
    cd_text_ph: "पूरा अनुबंध पाठ यहाँ पेस्ट करें — रोज़गार अनुबंध, NDA, लीज़, सेवा की शर्तें, सेवा अनुबंध…",
    cd_text_short: "उपयोगी विश्लेषण के लिए अनुबंध का अधिक हिस्सा पेस्ट करें।",
    cd_context_label: "आपकी स्थिति",
    cd_context_hint: "(वैकल्पिक)",
    cd_context_ph: "जैसे, 'मैं फ्रीलांसर हूँ, यह 3 महीने के प्रोजेक्ट के लिए है' या 'पहली नौकरी का ऑफ़र, बातचीत की कोई गुंजाइश नहीं'",
    cd_xref_lease_q: "लीज़ साइन कर रहे हैं?",
    cd_xref_lease_tail: "किराये के अनुबंधों पर अधिक गहराई से बताता है।",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "विश्लेषण हो रहा है…",
    cd_decode: "इस अनुबंध को डिकोड करें",
    cd_recent: "हाल के विश्लेषण",
    cd_clear: "साफ़ करें",
    cd_high_risk_clauses: "उच्च-जोखिम धारा",
    cd_high_risk_clauses_plural: "उच्च-जोखिम धाराएँ",
    cd_new_contract: "नया अनुबंध",
    cd_risk_high: "उच्च जोखिम",
    cd_risk_medium: "ध्यान से समीक्षा करें",
    cd_risk_low: "उचित लगता है",
    cd_risk_reviewed: "समीक्षित",
    cd_found_clause: "उच्च-जोखिम धारा मिली",
    cd_found_clauses: "उच्च-जोखिम धाराएँ मिलीं",
    cd_high_heading: "उच्च-जोखिम धाराएँ",
    cd_medium_heading: "इन धाराओं पर नज़र रखें",
    cd_low_heading: "मानक धाराएँ",
    cd_missing_heading: "अनुपस्थित सुरक्षा",
    cd_before_heading: "साइन करने से पहले",
    cd_related: "संबंधित टूल",
    cd_contract_language: "अनुबंध की भाषा",
    cd_why_matters: "यह क्यों मायने रखता है:",
    cd_ask_for: "यह माँगें:",
    cd_error: "कुछ गलत हो गया। कृपया फिर से कोशिश करें।",
    cd_copy_header: "CONTRACT DECODER विश्लेषण",
    cd_copy_overall: "समग्र जोखिम:",
    cd_copy_highrisk: "उच्च-जोखिम धाराएँ:",
    cd_copy_clauses: "चिह्नित धाराएँ",
    cd_copy_negotiate: "बातचीत करें:",
    cd_copy_missing: "अनुपस्थित सुरक्षा",
    cd_copy_before: "साइन करने से पहले",
    cd_example_contract: `फ्रीलांस सेवा अनुबंध

यह अनुबंध हस्ताक्षर की तारीख से ACME Corp ("ग्राहक") और नीचे हस्ताक्षरकर्ता डिज़ाइनर ("ठेकेदार") के बीच किया जाता है।

1. सेवाएँ
ठेकेदार ग्राहक के निर्देशानुसार ग्राफ़िक डिज़ाइन सेवाएँ प्रदान करने के लिए सहमत है।

2. पारिश्रमिक
ग्राहक ठेकेदार को {{sym}}75/घंटा भुगतान करेगा। भुगतान चालान के 60 दिनों के भीतर देय है। ग्राहक किसी भी चालान पर प्राप्ति के 90 दिनों के भीतर विवाद कर सकता है। यदि पूरा होने के 6 महीनों के भीतर दावा न किया जाए, तो ठेकेदार भुगतान के सभी अधिकार त्याग देता है।

3. बौद्धिक संपदा
सभी कार्य उत्पाद, जिनमें प्रारंभिक डिज़ाइन, रेखाचित्र और अवधारणाएँ शामिल हैं, भुगतान की स्थिति की परवाह किए बिना, निर्माण के समय से ग्राहक की एकमात्र और अनन्य संपत्ति होंगे। ठेकेदार किसी भी कार्य उत्पाद के सभी अधिकार, स्वामित्व और हित ग्राहक को सौंपता है। ठेकेदार सभी नैतिक अधिकार त्यागता है। ग्राहक विपणन उद्देश्यों के लिए ठेकेदार के नाम और पोर्टफ़ोलियो नमूनों का स्थायी रूप से उपयोग कर सकता है।

4. समाप्ति
ग्राहक किसी भी समय, कारण सहित या बिना कारण, बिना किसी सूचना के इस अनुबंध को समाप्त कर सकता है। समाप्ति पर, ठेकेदार तुरंत सभी चालू कार्य सौंप देगा। समाप्ति के समय अभी तक चालान न किए गए कार्य के लिए कोई पारिश्रमिक देय नहीं होगा।

5. गैर-प्रतिस्पर्धा
ठेकेदार इस अनुबंध की समाप्ति के बाद 24 महीनों की अवधि तक प्रौद्योगिकी क्षेत्र की किसी भी कंपनी के लिए डिज़ाइन सेवाएँ न करने के लिए सहमत है।

6. गोपनीयता
ठेकेदार ग्राहक की सभी जानकारी को स्थायी रूप से, समाप्ति के बाद भी, गोपनीय रखेगा, और किसी तीसरे पक्ष के साथ इस अनुबंध के अस्तित्व पर चर्चा नहीं करेगा।

7. विवाद समाधान
किसी भी विवाद का समाधान ग्राहक के अधिकार-क्षेत्र में बाध्यकारी मध्यस्थता द्वारा किया जाएगा। ठेकेदार जूरी ट्रायल के सभी अधिकार त्यागता है। ग्राहक बिना ज़मानत जमा किए किसी भी अदालत में निषेधाज्ञा राहत माँग सकता है।

8. शासी कानून
यह अनुबंध ठेकेदार के स्थान की परवाह किए बिना, डेलावेयर के कानूनों द्वारा शासित होगा।

9. संपूर्ण अनुबंध
यह अनुबंध सभी पूर्व अनुबंधों का स्थान लेता है। ग्राहक किसी भी समय अपनी वेबसाइट पर अपडेट पोस्ट करके इस अनुबंध में संशोधन कर सकता है।`,
    cd_example_context: "मैं एक फ्रीलांस डिज़ाइनर हूँ और मुझसे एक स्टार्टअप के लिए प्रोजेक्ट शुरू करने से पहले इसे साइन करने को कहा जा रहा है।",
  },
  ar: {
    cd_your_situation: "ما أخبرتنا به",
    cd_chars_analyzed: "تم تحليل {{count}} حرفًا",
    cd_title: "Contract Decoder",
    cd_tagline: "الصق أي عقد — واعرف بالضبط ما الذي توقّع عليه.",
    cd_type_label: "نوع العقد",
    cd_type_employment: "توظيف",
    cd_type_freelance: "عمل حر / اتفاقية سرية",
    cd_type_lease: "إيجار / تأجير",
    cd_type_saas: "برمجيات كخدمة / شروط",
    cd_type_service: "اتفاقية خدمة",
    cd_type_purchase: "شراء / بيع",
    cd_type_partnership: "شراكة",
    cd_type_other: "أخرى",
    cd_focus_label: "مجالات التركيز",
    cd_focus_hint: "(اختياري — اختر ما يهمّك أكثر)",
    cd_focus_exit: "شروط الخروج / الإنهاء",
    cd_focus_liability: "المسؤولية والتعويض",
    cd_focus_ip: "الملكية الفكرية وحقوق الملكية",
    cd_focus_autorenewal: "التجديد التلقائي والإلغاء",
    cd_focus_payment: "شروط الدفع والاسترداد",
    cd_focus_noncompete: "عدم المنافسة / عدم الاستقطاب",
    cd_focus_privacy: "البيانات والخصوصية",
    cd_focus_dispute: "تسوية النزاعات",
    cd_text_label: "نص العقد",
    cd_text_ph: "الصق نص العقد الكامل هنا — عقد توظيف، اتفاقية سرية، إيجار، شروط الخدمة، اتفاقية خدمة…",
    cd_text_short: "الصق المزيد من العقد للحصول على تحليل مفيد.",
    cd_context_label: "وضعك",
    cd_context_hint: "(اختياري)",
    cd_context_ph: "مثلاً، 'أنا عامل حر، هذا لمشروع مدته 3 أشهر' أو 'أول عرض عمل، لا مجال للتفاوض'",
    cd_xref_lease_q: "تُوقّع عقد إيجار؟",
    cd_xref_lease_tail: "يتعمّق أكثر في عقود الإيجار.",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "جارٍ التحليل…",
    cd_decode: "فكّ شفرة هذا العقد",
    cd_recent: "التحليلات الأخيرة",
    cd_clear: "مسح",
    cd_high_risk_clauses: "بند عالي الخطورة",
    cd_high_risk_clauses_plural: "بنود عالية الخطورة",
    cd_new_contract: "عقد جديد",
    cd_risk_high: "خطورة عالية",
    cd_risk_medium: "راجِع بعناية",
    cd_risk_low: "يبدو معقولاً",
    cd_risk_reviewed: "تمت المراجعة",
    cd_found_clause: "بند عالي الخطورة تم العثور عليه",
    cd_found_clauses: "بنود عالية الخطورة تم العثور عليها",
    cd_high_heading: "بنود عالية الخطورة",
    cd_medium_heading: "راقب هذه البنود",
    cd_low_heading: "بنود قياسية",
    cd_missing_heading: "حمايات مفقودة",
    cd_before_heading: "قبل أن توقّع",
    cd_related: "أدوات ذات صلة",
    cd_contract_language: "نص العقد",
    cd_why_matters: "لماذا هذا مهم:",
    cd_ask_for: "اطلب:",
    cd_error: "حدث خطأ ما. يُرجى المحاولة مرة أخرى.",
    cd_copy_header: "تحليل CONTRACT DECODER",
    cd_copy_overall: "الخطورة الإجمالية:",
    cd_copy_highrisk: "البنود عالية الخطورة:",
    cd_copy_clauses: "البنود المُعلَّمة",
    cd_copy_negotiate: "تفاوَض:",
    cd_copy_missing: "حمايات مفقودة",
    cd_copy_before: "قبل أن توقّع",
    cd_example_contract: `اتفاقية خدمات عمل حر

تُبرَم هذه الاتفاقية اعتباراً من تاريخ التوقيع بين ACME Corp ("العميل") والمصمّم الموقّع أدناه ("المتعاقد").

1. الخدمات
يوافق المتعاقد على تقديم خدمات التصميم الجرافيكي وفق توجيهات العميل.

2. التعويض
يدفع العميل للمتعاقد {{sym}}75/ساعة. يُستحق الدفع خلال 60 يوماً من تاريخ الفاتورة. يجوز للعميل الاعتراض على أي فاتورة خلال 90 يوماً من استلامها. يتنازل المتعاقد عن كل حق في الدفع إذا لم يُطالَب به خلال 6 أشهر من الإنجاز.

3. الملكية الفكرية
يكون كل ناتج العمل، بما في ذلك التصاميم الأولية والرسومات والمفاهيم، ملكاً وحيداً وحصرياً للعميل منذ لحظة إنشائه، بغض النظر عن حالة الدفع. يتنازل المتعاقد بموجب هذا للعميل عن جميع الحقوق والملكية والمصالح في أي ناتج عمل. يتنازل المتعاقد عن جميع الحقوق المعنوية. يجوز للعميل استخدام اسم المتعاقد وعينات من أعماله بشكل دائم لأغراض التسويق.

4. الإنهاء
يجوز للعميل إنهاء هذه الاتفاقية في أي وقت بسبب أو بدون سبب، ودون أي إشعار. عند الإنهاء، يسلّم المتعاقد فوراً كل العمل قيد التنفيذ. لا يُستحق أي تعويض عن العمل الذي لم تُصدَر له فاتورة وقت الإنهاء.

5. عدم المنافسة
يوافق المتعاقد على عدم تقديم خدمات تصميم لأي شركة في قطاع التكنولوجيا لمدة 24 شهراً بعد إنهاء هذه الاتفاقية.

6. السرية
يحافظ المتعاقد على سرية جميع معلومات العميل بشكل دائم، بما في ذلك بعد الإنهاء، ولا يناقش وجود هذه الاتفاقية مع أي طرف ثالث.

7. تسوية النزاعات
تُحَلّ أي نزاعات بتحكيم ملزم في الولاية القضائية للعميل. يتنازل المتعاقد عن كل حق في المحاكمة أمام هيئة محلفين. يجوز للعميل طلب الإنصاف الزجري في أي محكمة دون تقديم كفالة.

8. القانون الحاكم
تخضع هذه الاتفاقية لقوانين ولاية ديلاوير، بغض النظر عن موقع المتعاقد.

9. الاتفاقية الكاملة
تَحلّ هذه الاتفاقية محلّ جميع الاتفاقيات السابقة. يجوز للعميل تعديل هذه الاتفاقية في أي وقت بنشر تحديثات على موقعه الإلكتروني.`,
    cd_example_context: "أنا مصمّم مستقل ويُطلب مني توقيع هذا قبل بدء مشروع لشركة ناشئة.",
  },
  pt: {
    cd_your_situation: "O que você nos contou",
    cd_chars_analyzed: "{{count}} caracteres analisados",
    cd_title: "Contract Decoder",
    cd_tagline: "Cole qualquer contrato — saiba exatamente o que está assinando.",
    cd_type_label: "Tipo de contrato",
    cd_type_employment: "Emprego",
    cd_type_freelance: "Freelance / NDA",
    cd_type_lease: "Locação / Aluguel",
    cd_type_saas: "SaaS / Termos",
    cd_type_service: "Contrato de serviços",
    cd_type_purchase: "Compra / Venda",
    cd_type_partnership: "Sociedade",
    cd_type_other: "Outro",
    cd_focus_label: "Áreas de foco",
    cd_focus_hint: "(opcional — selecione o que mais importa para você)",
    cd_focus_exit: "Condições de saída / rescisão",
    cd_focus_liability: "Responsabilidade e indenização",
    cd_focus_ip: "Propriedade intelectual e direitos de propriedade",
    cd_focus_autorenewal: "Renovação automática e cancelamento",
    cd_focus_payment: "Condições de pagamento e reembolso",
    cd_focus_noncompete: "Não concorrência / não aliciamento",
    cd_focus_privacy: "Dados e privacidade",
    cd_focus_dispute: "Resolução de disputas",
    cd_text_label: "Texto do contrato",
    cd_text_ph: "Cole aqui o texto completo do contrato — contrato de trabalho, NDA, locação, termos de serviço, contrato de serviços…",
    cd_text_short: "Cole mais do contrato para uma análise útil.",
    cd_context_label: "Sua situação",
    cd_context_hint: "(opcional)",
    cd_context_ph: "ex.: 'Sou freelancer, isto é para um projeto de 3 meses' ou 'Primeira oferta de emprego, sem margem para negociar'",
    cd_xref_lease_q: "Vai assinar um aluguel?",
    cd_xref_lease_tail: "aprofunda nos contratos de aluguel.",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "Analisando…",
    cd_decode: "Decodificar este contrato",
    cd_recent: "Análises recentes",
    cd_clear: "Limpar",
    cd_high_risk_clauses: "cláusula de alto risco",
    cd_high_risk_clauses_plural: "cláusulas de alto risco",
    cd_new_contract: "Novo contrato",
    cd_risk_high: "ALTO RISCO",
    cd_risk_medium: "REVISE COM ATENÇÃO",
    cd_risk_low: "PARECE RAZOÁVEL",
    cd_risk_reviewed: "REVISADO",
    cd_found_clause: "cláusula de alto risco encontrada",
    cd_found_clauses: "cláusulas de alto risco encontradas",
    cd_high_heading: "Cláusulas de alto risco",
    cd_medium_heading: "Fique de olho nestas cláusulas",
    cd_low_heading: "Cláusulas padrão",
    cd_missing_heading: "Proteções ausentes",
    cd_before_heading: "Antes de assinar",
    cd_related: "Ferramentas relacionadas",
    cd_contract_language: "Texto do contrato",
    cd_why_matters: "Por que importa:",
    cd_ask_for: "Peça:",
    cd_error: "Algo deu errado. Tente novamente.",
    cd_copy_header: "ANÁLISE DO CONTRACT DECODER",
    cd_copy_overall: "Risco geral:",
    cd_copy_highrisk: "Cláusulas de alto risco:",
    cd_copy_clauses: "CLÁUSULAS SINALIZADAS",
    cd_copy_negotiate: "Negociar:",
    cd_copy_missing: "PROTEÇÕES AUSENTES",
    cd_copy_before: "ANTES DE ASSINAR",
    cd_example_contract: `CONTRATO DE SERVIÇOS FREELANCE

Este Contrato é celebrado na data de sua assinatura entre a ACME Corp ("Cliente") e o designer abaixo assinado ("Contratado").

1. SERVIÇOS
O Contratado concorda em prestar serviços de design gráfico conforme orientação do Cliente.

2. REMUNERAÇÃO
O Cliente pagará ao Contratado {{sym}}75/hora. O pagamento vence em até 60 dias após a fatura. O Cliente pode contestar qualquer fatura em até 90 dias do recebimento. O Contratado renuncia a todo direito de pagamento se não reivindicado em até 6 meses após a conclusão.

3. PROPRIEDADE INTELECTUAL
Todo produto do trabalho, incluindo designs preliminares, esboços e conceitos, será propriedade única e exclusiva do Cliente desde a criação, independentemente do status de pagamento. O Contratado cede ao Cliente todos os direitos, títulos e interesses em qualquer produto do trabalho. O Contratado renuncia a todos os direitos morais. O Cliente pode usar o nome do Contratado e amostras de seu portfólio em perpetuidade para fins de marketing.

4. RESCISÃO
O Cliente pode rescindir este contrato a qualquer momento, com ou sem justa causa, sem aviso prévio. Após a rescisão, o Contratado deverá entregar imediatamente todo o trabalho em andamento. Nenhuma remuneração será devida por trabalho ainda não faturado no momento da rescisão.

5. NÃO CONCORRÊNCIA
O Contratado concorda em não prestar serviços de design a qualquer empresa do setor de tecnologia por um período de 24 meses após a rescisão deste contrato.

6. CONFIDENCIALIDADE
O Contratado manterá todas as informações do Cliente confidenciais em perpetuidade, inclusive após a rescisão, e não discutirá a existência deste contrato com terceiros.

7. RESOLUÇÃO DE DISPUTAS
Quaisquer disputas serão resolvidas por arbitragem vinculativa na jurisdição do Cliente. O Contratado renuncia a todo direito a julgamento por júri. O Cliente pode buscar medida cautelar em qualquer tribunal sem prestar caução.

8. LEI APLICÁVEL
Este contrato será regido pelas leis de Delaware, independentemente da localização do Contratado.

9. ACORDO INTEGRAL
Este contrato substitui todos os acordos anteriores. O Cliente pode alterar este contrato a qualquer momento publicando atualizações em seu site.`,
    cd_example_context: "Sou designer freelancer e estão me pedindo para assinar isto antes de iniciar um projeto para uma startup.",
  },
  fr: {
    cd_your_situation: "Ce que vous nous avez dit",
    cd_chars_analyzed: "{{count}} caractères analysés",
    cd_title: "Contract Decoder",
    cd_tagline: "Collez n'importe quel contrat — sachez exactement ce que vous signez.",
    cd_type_label: "Type de contrat",
    cd_type_employment: "Emploi",
    cd_type_freelance: "Freelance / NDA",
    cd_type_lease: "Bail / Location",
    cd_type_saas: "SaaS / Conditions",
    cd_type_service: "Contrat de service",
    cd_type_purchase: "Achat / Vente",
    cd_type_partnership: "Partenariat",
    cd_type_other: "Autre",
    cd_focus_label: "Domaines à examiner",
    cd_focus_hint: "(facultatif — sélectionnez ce qui compte le plus pour vous)",
    cd_focus_exit: "Conditions de sortie / résiliation",
    cd_focus_liability: "Responsabilité et indemnisation",
    cd_focus_ip: "Propriété intellectuelle et droits de propriété",
    cd_focus_autorenewal: "Reconduction automatique et annulation",
    cd_focus_payment: "Conditions de paiement et de remboursement",
    cd_focus_noncompete: "Non-concurrence / non-sollicitation",
    cd_focus_privacy: "Données et confidentialité",
    cd_focus_dispute: "Résolution des litiges",
    cd_text_label: "Texte du contrat",
    cd_text_ph: "Collez ici le texte complet du contrat — contrat de travail, NDA, bail, conditions de service, contrat de prestation…",
    cd_text_short: "Collez davantage du contrat pour une analyse utile.",
    cd_context_label: "Votre situation",
    cd_context_hint: "(facultatif)",
    cd_context_ph: "ex. : 'Je suis freelance, c'est pour un projet de 3 mois' ou 'Première offre d'emploi, aucune marge de négociation'",
    cd_xref_lease_q: "Vous signez un bail ?",
    cd_xref_lease_tail: "approfondit les contrats de location.",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "Analyse en cours…",
    cd_decode: "Décoder ce contrat",
    cd_recent: "Analyses récentes",
    cd_clear: "Effacer",
    cd_high_risk_clauses: "clause à haut risque",
    cd_high_risk_clauses_plural: "clauses à haut risque",
    cd_new_contract: "Nouveau contrat",
    cd_risk_high: "RISQUE ÉLEVÉ",
    cd_risk_medium: "À EXAMINER ATTENTIVEMENT",
    cd_risk_low: "SEMBLE RAISONNABLE",
    cd_risk_reviewed: "EXAMINÉ",
    cd_found_clause: "clause à haut risque trouvée",
    cd_found_clauses: "clauses à haut risque trouvées",
    cd_high_heading: "Clauses à haut risque",
    cd_medium_heading: "Surveillez ces clauses",
    cd_low_heading: "Clauses standard",
    cd_missing_heading: "Protections manquantes",
    cd_before_heading: "Avant de signer",
    cd_related: "Outils associés",
    cd_contract_language: "Texte du contrat",
    cd_why_matters: "Pourquoi c'est important :",
    cd_ask_for: "Demandez :",
    cd_error: "Une erreur s'est produite. Veuillez réessayer.",
    cd_copy_header: "ANALYSE CONTRACT DECODER",
    cd_copy_overall: "Risque global :",
    cd_copy_highrisk: "Clauses à haut risque :",
    cd_copy_clauses: "CLAUSES SIGNALÉES",
    cd_copy_negotiate: "Négocier :",
    cd_copy_missing: "PROTECTIONS MANQUANTES",
    cd_copy_before: "AVANT DE SIGNER",
    cd_example_contract: `CONTRAT DE PRESTATION DE SERVICES FREELANCE

Le présent Contrat est conclu à la date de sa signature entre ACME Corp (« Client ») et le designer soussigné (« Prestataire »).

1. SERVICES
Le Prestataire s'engage à fournir des services de conception graphique selon les directives du Client.

2. RÉMUNÉRATION
Le Client versera au Prestataire {{sym}}75/heure. Le paiement est dû dans les 60 jours suivant la facture. Le Client peut contester toute facture dans les 90 jours suivant sa réception. Le Prestataire renonce à tout droit au paiement s'il n'est pas réclamé dans les 6 mois suivant l'achèvement.

3. PROPRIÉTÉ INTELLECTUELLE
Tout produit du travail, y compris les conceptions préliminaires, croquis et concepts, sera la propriété unique et exclusive du Client dès sa création, quel que soit l'état du paiement. Le Prestataire cède par les présentes au Client tous les droits, titres et intérêts sur tout produit du travail. Le Prestataire renonce à tous ses droits moraux. Le Client peut utiliser le nom du Prestataire et des échantillons de son portfolio à perpétuité à des fins de marketing.

4. RÉSILIATION
Le Client peut résilier ce contrat à tout moment, avec ou sans motif, sans aucun préavis. À la résiliation, le Prestataire remettra immédiatement tous les travaux en cours. Aucune rémunération ne sera due pour les travaux non encore facturés au moment de la résiliation.

5. NON-CONCURRENCE
Le Prestataire s'engage à ne fournir aucun service de conception à toute entreprise du secteur technologique pendant une période de 24 mois suivant la résiliation de ce contrat.

6. CONFIDENTIALITÉ
Le Prestataire conservera la confidentialité de toutes les informations du Client à perpétuité, y compris après la résiliation, et ne discutera de l'existence de ce contrat avec aucun tiers.

7. RÉSOLUTION DES LITIGES
Tout litige sera résolu par arbitrage exécutoire dans la juridiction du Client. Le Prestataire renonce à tout droit à un procès devant jury. Le Client peut demander une mesure injonctive devant tout tribunal sans déposer de caution.

8. DROIT APPLICABLE
Ce contrat sera régi par les lois du Delaware, quel que soit le lieu où se trouve le Prestataire.

9. INTÉGRALITÉ DU CONTRAT
Ce contrat remplace tous les accords antérieurs. Le Client peut modifier ce contrat à tout moment en publiant des mises à jour sur son site web.`,
    cd_example_context: "Je suis designer freelance et on me demande de signer ceci avant de commencer un projet pour une startup.",
  },
  de: {
    cd_your_situation: "Was du uns erzählt hast",
    cd_chars_analyzed: "{{count}} Zeichen analysiert",
    cd_title: "Contract Decoder",
    cd_tagline: "Füge einen beliebigen Vertrag ein — und wisse genau, was du unterschreibst.",
    cd_type_label: "Vertragsart",
    cd_type_employment: "Arbeitsvertrag",
    cd_type_freelance: "Freelance / NDA",
    cd_type_lease: "Miete / Pacht",
    cd_type_saas: "SaaS / AGB",
    cd_type_service: "Dienstleistungsvertrag",
    cd_type_purchase: "Kauf / Verkauf",
    cd_type_partnership: "Partnerschaft",
    cd_type_other: "Sonstiges",
    cd_focus_label: "Schwerpunkte",
    cd_focus_hint: "(optional — wähle aus, was dir am wichtigsten ist)",
    cd_focus_exit: "Ausstiegs- / Kündigungsbedingungen",
    cd_focus_liability: "Haftung & Freistellung",
    cd_focus_ip: "Geistiges Eigentum & Eigentumsrechte",
    cd_focus_autorenewal: "Automatische Verlängerung & Kündigung",
    cd_focus_payment: "Zahlungs- & Rückerstattungsbedingungen",
    cd_focus_noncompete: "Wettbewerbsverbot / Abwerbeverbot",
    cd_focus_privacy: "Daten & Datenschutz",
    cd_focus_dispute: "Streitbeilegung",
    cd_text_label: "Vertragstext",
    cd_text_ph: "Füge hier den vollständigen Vertragstext ein — Arbeitsvertrag, NDA, Mietvertrag, Nutzungsbedingungen, Dienstleistungsvertrag…",
    cd_text_short: "Füge mehr vom Vertrag ein, um eine nützliche Analyse zu erhalten.",
    cd_context_label: "Deine Situation",
    cd_context_hint: "(optional)",
    cd_context_ph: "z. B. 'Ich bin Freelancer, das ist für ein 3-Monats-Projekt' oder 'Erstes Jobangebot, keine Verhandlungsmacht'",
    cd_xref_lease_q: "Unterschreibst du einen Mietvertrag?",
    cd_xref_lease_tail: "geht tiefer auf Mietverträge ein.",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "Wird analysiert…",
    cd_decode: "Diesen Vertrag entschlüsseln",
    cd_recent: "Letzte Analysen",
    cd_clear: "Löschen",
    cd_high_risk_clauses: "Hochrisiko-Klausel",
    cd_high_risk_clauses_plural: "Hochrisiko-Klauseln",
    cd_new_contract: "Neuer Vertrag",
    cd_risk_high: "HOHES RISIKO",
    cd_risk_medium: "SORGFÄLTIG PRÜFEN",
    cd_risk_low: "WIRKT ANGEMESSEN",
    cd_risk_reviewed: "GEPRÜFT",
    cd_found_clause: "Hochrisiko-Klausel gefunden",
    cd_found_clauses: "Hochrisiko-Klauseln gefunden",
    cd_high_heading: "Hochrisiko-Klauseln",
    cd_medium_heading: "Diese Klauseln im Auge behalten",
    cd_low_heading: "Standardklauseln",
    cd_missing_heading: "Fehlende Schutzklauseln",
    cd_before_heading: "Bevor du unterschreibst",
    cd_related: "Verwandte Tools",
    cd_contract_language: "Vertragstext",
    cd_why_matters: "Warum es wichtig ist:",
    cd_ask_for: "Fordere:",
    cd_error: "Etwas ist schiefgelaufen. Bitte erneut versuchen.",
    cd_copy_header: "CONTRACT DECODER ANALYSE",
    cd_copy_overall: "Gesamtrisiko:",
    cd_copy_highrisk: "Hochrisiko-Klauseln:",
    cd_copy_clauses: "MARKIERTE KLAUSELN",
    cd_copy_negotiate: "Verhandeln:",
    cd_copy_missing: "FEHLENDE SCHUTZKLAUSELN",
    cd_copy_before: "BEVOR DU UNTERSCHREIBST",
    cd_example_contract: `FREELANCE-DIENSTLEISTUNGSVERTRAG

Dieser Vertrag wird zum Datum der Unterzeichnung zwischen der ACME Corp („Auftraggeber") und dem unterzeichnenden Designer („Auftragnehmer") geschlossen.

1. LEISTUNGEN
Der Auftragnehmer verpflichtet sich, grafische Designleistungen nach Weisung des Auftraggebers zu erbringen.

2. VERGÜTUNG
Der Auftraggeber zahlt dem Auftragnehmer {{sym}}75/Stunde. Die Zahlung ist innerhalb von 60 Tagen nach Rechnungsstellung fällig. Der Auftraggeber kann jede Rechnung innerhalb von 90 Tagen nach Erhalt beanstanden. Der Auftragnehmer verzichtet auf jeden Zahlungsanspruch, wenn dieser nicht innerhalb von 6 Monaten nach Fertigstellung geltend gemacht wird.

3. GEISTIGES EIGENTUM
Sämtliche Arbeitsergebnisse, einschließlich vorläufiger Entwürfe, Skizzen und Konzepte, sind ab ihrer Erstellung das alleinige und ausschließliche Eigentum des Auftraggebers, unabhängig vom Zahlungsstatus. Der Auftragnehmer überträgt dem Auftraggeber hiermit alle Rechte, Titel und Interessen an jeglichen Arbeitsergebnissen. Der Auftragnehmer verzichtet auf alle Urheberpersönlichkeitsrechte. Der Auftraggeber darf den Namen des Auftragnehmers und Portfolio-Proben dauerhaft zu Marketingzwecken verwenden.

4. KÜNDIGUNG
Der Auftraggeber kann diesen Vertrag jederzeit mit oder ohne Grund und ohne Vorankündigung kündigen. Bei Kündigung liefert der Auftragnehmer alle laufenden Arbeiten unverzüglich ab. Für zum Zeitpunkt der Kündigung noch nicht in Rechnung gestellte Arbeiten wird keine Vergütung geschuldet.

5. WETTBEWERBSVERBOT
Der Auftragnehmer verpflichtet sich, für einen Zeitraum von 24 Monaten nach Kündigung dieses Vertrags keine Designleistungen für ein Unternehmen aus dem Technologiesektor zu erbringen.

6. VERTRAULICHKEIT
Der Auftragnehmer hält alle Informationen des Auftraggebers dauerhaft, auch nach Kündigung, vertraulich und bespricht das Bestehen dieses Vertrags mit keinem Dritten.

7. STREITBEILEGUNG
Streitigkeiten werden durch verbindliches Schiedsverfahren in der Gerichtsbarkeit des Auftraggebers beigelegt. Der Auftragnehmer verzichtet auf jedes Recht auf ein Schwurgerichtsverfahren. Der Auftraggeber kann vor jedem Gericht einstweiligen Rechtsschutz ohne Sicherheitsleistung beantragen.

8. ANWENDBARES RECHT
Dieser Vertrag unterliegt dem Recht des Bundesstaates Delaware, unabhängig vom Standort des Auftragnehmers.

9. GESAMTE VEREINBARUNG
Dieser Vertrag ersetzt alle früheren Vereinbarungen. Der Auftraggeber kann diesen Vertrag jederzeit durch Veröffentlichung von Aktualisierungen auf seiner Website ändern.`,
    cd_example_context: "Ich bin freiberuflicher Designer und soll dies unterschreiben, bevor ich ein Projekt für ein Start-up beginne.",
  },
  ja: {
    cd_your_situation: "あなたが教えてくれたこと",
    cd_chars_analyzed: "{{count}}文字を分析しました",
    cd_title: "Contract Decoder",
    cd_tagline: "どんな契約書でも貼り付けて — 何に署名するのか正確に把握。",
    cd_type_label: "契約の種類",
    cd_type_employment: "雇用",
    cd_type_freelance: "フリーランス / 秘密保持契約",
    cd_type_lease: "賃貸借",
    cd_type_saas: "SaaS / 利用規約",
    cd_type_service: "業務委託契約",
    cd_type_purchase: "売買",
    cd_type_partnership: "パートナーシップ",
    cd_type_other: "その他",
    cd_focus_label: "重点項目",
    cd_focus_hint: "（任意 — 最も気になる点を選択）",
    cd_focus_exit: "解約・終了条件",
    cd_focus_liability: "責任と補償",
    cd_focus_ip: "知的財産と所有権",
    cd_focus_autorenewal: "自動更新と解約",
    cd_focus_payment: "支払いと返金条件",
    cd_focus_noncompete: "競業避止 / 勧誘禁止",
    cd_focus_privacy: "データとプライバシー",
    cd_focus_dispute: "紛争解決",
    cd_text_label: "契約書の本文",
    cd_text_ph: "契約書の全文をここに貼り付けてください — 雇用契約、秘密保持契約、賃貸契約、利用規約、業務委託契約など…",
    cd_text_short: "有用な分析のために、契約書をもっと貼り付けてください。",
    cd_context_label: "あなたの状況",
    cd_context_hint: "（任意）",
    cd_context_ph: "例：「私はフリーランスで、これは3か月のプロジェクト用です」または「初めての内定で、交渉の余地がありません」",
    cd_xref_lease_q: "賃貸契約に署名しますか？",
    cd_xref_lease_tail: "は賃貸契約をより深く掘り下げます。",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "分析中…",
    cd_decode: "この契約を解読する",
    cd_recent: "最近の分析",
    cd_clear: "クリア",
    cd_high_risk_clauses: "件の高リスク条項",
    cd_high_risk_clauses_plural: "件の高リスク条項",
    cd_new_contract: "新しい契約",
    cd_risk_high: "高リスク",
    cd_risk_medium: "慎重に確認を",
    cd_risk_low: "妥当に見える",
    cd_risk_reviewed: "確認済み",
    cd_found_clause: "件の高リスク条項が見つかりました",
    cd_found_clauses: "件の高リスク条項が見つかりました",
    cd_high_heading: "高リスクの条項",
    cd_medium_heading: "注意すべき条項",
    cd_low_heading: "標準的な条項",
    cd_missing_heading: "欠けている保護",
    cd_before_heading: "署名する前に",
    cd_related: "関連ツール",
    cd_contract_language: "契約書の文言",
    cd_why_matters: "なぜ重要か：",
    cd_ask_for: "こう求めましょう：",
    cd_error: "問題が発生しました。もう一度お試しください。",
    cd_copy_header: "CONTRACT DECODER 分析",
    cd_copy_overall: "総合リスク：",
    cd_copy_highrisk: "高リスク条項：",
    cd_copy_clauses: "指摘された条項",
    cd_copy_negotiate: "交渉：",
    cd_copy_missing: "欠けている保護",
    cd_copy_before: "署名する前に",
    cd_example_contract: `フリーランス業務委託契約

本契約は、署名日をもって ACME Corp（「クライアント」）と下記署名のデザイナー（「受託者」）との間で締結される。

1. 業務
受託者は、クライアントの指示に従いグラフィックデザイン業務を提供することに同意する。

2. 報酬
クライアントは受託者に {{sym}}75/時 を支払う。支払いは請求書発行後60日以内に行うものとする。クライアントは受領後90日以内に任意の請求書について異議を申し立てることができる。受託者は、完了後6か月以内に請求しなかった場合、報酬を受ける一切の権利を放棄する。

3. 知的財産
予備的なデザイン、スケッチ、コンセプトを含むすべての成果物は、支払い状況にかかわらず、その作成時点でクライアントの唯一かつ独占的な財産となる。受託者は、いかなる成果物に関するすべての権利、権原および利益をここにクライアントへ譲渡する。受託者はすべての著作者人格権を放棄する。クライアントは、マーケティング目的で受託者の氏名およびポートフォリオの見本を永久に使用できる。

4. 解約
クライアントは、理由の有無にかかわらず、いかなる事前通知もなく、いつでも本契約を解約できる。解約時、受託者は進行中のすべての作業を直ちに引き渡す。解約時点で未請求の作業に対しては、いかなる報酬も支払われない。

5. 競業避止
受託者は、本契約の解約後24か月間、テクノロジー分野のいかなる企業に対してもデザイン業務を行わないことに同意する。

6. 秘密保持
受託者は、解約後を含め、クライアントのすべての情報を永久に秘密として保持し、本契約の存在についていかなる第三者とも話し合わないものとする。

7. 紛争解決
いかなる紛争も、クライアントの管轄区域における拘束力のある仲裁により解決される。受託者は陪審裁判を受けるすべての権利を放棄する。クライアントは、保証金を供託することなく、いかなる裁判所においても差止命令による救済を求めることができる。

8. 準拠法
本契約は、受託者の所在地にかかわらず、デラウェア州法に準拠する。

9. 完全合意
本契約は、従前のすべての合意に優先する。クライアントは、自社のウェブサイトに更新を掲載することにより、いつでも本契約を変更できる。`,
    cd_example_context: "私はフリーランスのデザイナーで、スタートアップのプロジェクトを始める前にこれに署名するよう求められています。",
  },
  ko: {
    cd_your_situation: "알려주신 내용",
    cd_chars_analyzed: "{{count}}자 분석됨",
    cd_title: "Contract Decoder",
    cd_tagline: "어떤 계약서든 붙여넣으세요 — 무엇에 서명하는지 정확히 알 수 있습니다.",
    cd_type_label: "계약 유형",
    cd_type_employment: "고용",
    cd_type_freelance: "프리랜서 / NDA",
    cd_type_lease: "임대 / 렌트",
    cd_type_saas: "SaaS / 약관",
    cd_type_service: "용역 계약",
    cd_type_purchase: "구매 / 판매",
    cd_type_partnership: "파트너십",
    cd_type_other: "기타",
    cd_focus_label: "중점 영역",
    cd_focus_hint: "(선택 — 가장 중요한 것을 선택하세요)",
    cd_focus_exit: "해지 / 종료 조건",
    cd_focus_liability: "책임 및 면책",
    cd_focus_ip: "지식재산 및 소유권",
    cd_focus_autorenewal: "자동 갱신 및 해지",
    cd_focus_payment: "결제 및 환불 조건",
    cd_focus_noncompete: "경업 금지 / 유인 금지",
    cd_focus_privacy: "데이터 및 개인정보",
    cd_focus_dispute: "분쟁 해결",
    cd_text_label: "계약서 본문",
    cd_text_ph: "전체 계약서 내용을 여기에 붙여넣으세요 — 고용 계약, NDA, 임대차, 서비스 약관, 용역 계약…",
    cd_text_short: "유용한 분석을 위해 계약서를 더 붙여넣으세요.",
    cd_context_label: "당신의 상황",
    cd_context_hint: "(선택)",
    cd_context_ph: "예: '저는 프리랜서이고, 이건 3개월짜리 프로젝트용입니다' 또는 '첫 입사 제안이라 협상할 여지가 없습니다'",
    cd_xref_lease_q: "임대차 계약에 서명하시나요?",
    cd_xref_lease_tail: "는 임대 계약을 더 깊이 다룹니다.",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "분석 중…",
    cd_decode: "이 계약 해독하기",
    cd_recent: "최근 분석",
    cd_clear: "지우기",
    cd_high_risk_clauses: "개 고위험 조항",
    cd_high_risk_clauses_plural: "개 고위험 조항",
    cd_new_contract: "새 계약",
    cd_risk_high: "고위험",
    cd_risk_medium: "신중히 검토하세요",
    cd_risk_low: "합리적으로 보입니다",
    cd_risk_reviewed: "검토됨",
    cd_found_clause: "개 고위험 조항 발견",
    cd_found_clauses: "개 고위험 조항 발견",
    cd_high_heading: "고위험 조항",
    cd_medium_heading: "이 조항들을 주의하세요",
    cd_low_heading: "표준 조항",
    cd_missing_heading: "빠진 보호 장치",
    cd_before_heading: "서명하기 전에",
    cd_related: "관련 도구",
    cd_contract_language: "계약 문구",
    cd_why_matters: "왜 중요한가:",
    cd_ask_for: "이렇게 요구하세요:",
    cd_error: "문제가 발생했습니다. 다시 시도해 주세요.",
    cd_copy_header: "CONTRACT DECODER 분석",
    cd_copy_overall: "전체 위험도:",
    cd_copy_highrisk: "고위험 조항:",
    cd_copy_clauses: "표시된 조항",
    cd_copy_negotiate: "협상:",
    cd_copy_missing: "빠진 보호 장치",
    cd_copy_before: "서명하기 전에",
    cd_example_contract: `프리랜스 용역 계약

본 계약은 서명일에 ACME Corp("고객")과 아래 서명한 디자이너("수급인") 사이에 체결된다.

1. 용역
수급인은 고객의 지시에 따라 그래픽 디자인 용역을 제공하는 데 동의한다.

2. 보수
고객은 수급인에게 {{sym}}75/시간 을 지급한다. 대금은 송장 발행 후 60일 이내에 지급되어야 한다. 고객은 수령 후 90일 이내에 모든 송장에 대해 이의를 제기할 수 있다. 수급인은 완료 후 6개월 이내에 청구하지 않으면 대금에 대한 모든 권리를 포기한다.

3. 지식재산
예비 디자인, 스케치, 콘셉트를 포함한 모든 작업 결과물은 대금 지급 여부와 관계없이 생성 시점부터 고객의 단독이자 독점적인 재산이 된다. 수급인은 모든 작업 결과물에 대한 일체의 권리, 권원, 이익을 이로써 고객에게 양도한다. 수급인은 모든 저작인격권을 포기한다. 고객은 마케팅 목적으로 수급인의 이름과 포트폴리오 샘플을 영구히 사용할 수 있다.

4. 해지
고객은 사유의 유무와 관계없이, 사전 통지 없이 언제든지 본 계약을 해지할 수 있다. 해지 시 수급인은 진행 중인 모든 작업을 즉시 인도한다. 해지 시점에 아직 청구되지 않은 작업에 대해서는 어떠한 보수도 지급되지 않는다.

5. 경업 금지
수급인은 본 계약 해지 후 24개월 동안 기술 분야의 어떤 회사를 위해서도 디자인 용역을 수행하지 않는 데 동의한다.

6. 비밀유지
수급인은 해지 이후를 포함하여 고객의 모든 정보를 영구히 비밀로 유지하며, 어떠한 제3자와도 본 계약의 존재에 대해 논의하지 않는다.

7. 분쟁 해결
모든 분쟁은 고객의 관할 구역에서 구속력 있는 중재로 해결된다. 수급인은 배심 재판을 받을 모든 권리를 포기한다. 고객은 담보 제공 없이 어떤 법원에서도 금지명령 구제를 청구할 수 있다.

8. 준거법
본 계약은 수급인의 소재지와 관계없이 델라웨어주 법률의 적용을 받는다.

9. 완전 합의
본 계약은 이전의 모든 합의를 대체한다. 고객은 자사 웹사이트에 업데이트를 게시함으로써 언제든지 본 계약을 변경할 수 있다.`,
    cd_example_context: "저는 프리랜스 디자이너이며 스타트업의 프로젝트를 시작하기 전에 이것에 서명하도록 요청받고 있습니다.",
  },
  ru: {
    cd_your_situation: "Что вы нам рассказали",
    cd_chars_analyzed: "Проанализировано символов: {{count}}",
    cd_title: "Contract Decoder",
    cd_tagline: "Вставьте любой договор — и точно узнайте, что подписываете.",
    cd_type_label: "Тип договора",
    cd_type_employment: "Трудовой",
    cd_type_freelance: "Фриланс / NDA",
    cd_type_lease: "Аренда / Найм",
    cd_type_saas: "SaaS / Условия",
    cd_type_service: "Договор оказания услуг",
    cd_type_purchase: "Купля-продажа",
    cd_type_partnership: "Партнёрство",
    cd_type_other: "Другое",
    cd_focus_label: "На что обратить внимание",
    cd_focus_hint: "(необязательно — выберите, что для вас важнее всего)",
    cd_focus_exit: "Условия выхода / расторжения",
    cd_focus_liability: "Ответственность и возмещение",
    cd_focus_ip: "Интеллектуальная собственность и права владения",
    cd_focus_autorenewal: "Автопродление и отмена",
    cd_focus_payment: "Условия оплаты и возврата",
    cd_focus_noncompete: "Неконкуренция / непереманивание",
    cd_focus_privacy: "Данные и конфиденциальность",
    cd_focus_dispute: "Разрешение споров",
    cd_text_label: "Текст договора",
    cd_text_ph: "Вставьте сюда полный текст договора — трудовой договор, NDA, договор аренды, условия обслуживания, договор оказания услуг…",
    cd_text_short: "Вставьте больше текста договора для полезного анализа.",
    cd_context_label: "Ваша ситуация",
    cd_context_hint: "(необязательно)",
    cd_context_ph: "напр.: 'Я фрилансер, это для проекта на 3 месяца' или 'Первое предложение о работе, нет рычагов для переговоров'",
    cd_xref_lease_q: "Подписываете договор аренды?",
    cd_xref_lease_tail: "глубже разбирает договоры аренды.",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "Анализируем…",
    cd_decode: "Расшифровать этот договор",
    cd_recent: "Недавние анализы",
    cd_clear: "Очистить",
    cd_high_risk_clauses: "пункт высокого риска",
    cd_high_risk_clauses_plural: "пунктов высокого риска",
    cd_new_contract: "Новый договор",
    cd_risk_high: "ВЫСОКИЙ РИСК",
    cd_risk_medium: "ВНИМАТЕЛЬНО ИЗУЧИТЕ",
    cd_risk_low: "ВЫГЛЯДИТ РАЗУМНО",
    cd_risk_reviewed: "ПРОВЕРЕНО",
    cd_found_clause: "пункт высокого риска найден",
    cd_found_clauses: "пунктов высокого риска найдено",
    cd_high_heading: "Пункты высокого риска",
    cd_medium_heading: "Следите за этими пунктами",
    cd_low_heading: "Стандартные пункты",
    cd_missing_heading: "Отсутствующие гарантии",
    cd_before_heading: "Прежде чем подписать",
    cd_related: "Связанные инструменты",
    cd_contract_language: "Формулировка договора",
    cd_why_matters: "Почему это важно:",
    cd_ask_for: "Попросите:",
    cd_error: "Что-то пошло не так. Пожалуйста, попробуйте снова.",
    cd_copy_header: "АНАЛИЗ CONTRACT DECODER",
    cd_copy_overall: "Общий риск:",
    cd_copy_highrisk: "Пункты высокого риска:",
    cd_copy_clauses: "ОТМЕЧЕННЫЕ ПУНКТЫ",
    cd_copy_negotiate: "Договориться:",
    cd_copy_missing: "ОТСУТСТВУЮЩИЕ ГАРАНТИИ",
    cd_copy_before: "ПРЕЖДЕ ЧЕМ ПОДПИСАТЬ",
    cd_example_contract: `ДОГОВОР ОКАЗАНИЯ УСЛУГ ФРИЛАНСЕРА

Настоящий Договор заключается на дату подписания между ACME Corp («Заказчик») и нижеподписавшимся дизайнером («Исполнитель»).

1. УСЛУГИ
Исполнитель обязуется оказывать услуги графического дизайна по указанию Заказчика.

2. ВОЗНАГРАЖДЕНИЕ
Заказчик уплачивает Исполнителю {{sym}}75/час. Оплата производится в течение 60 дней с даты счёта. Заказчик может оспорить любой счёт в течение 90 дней с момента его получения. Исполнитель отказывается от всех прав на оплату, если она не востребована в течение 6 месяцев после завершения.

3. ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ
Все результаты работы, включая предварительные эскизы, наброски и концепции, являются единоличной и исключительной собственностью Заказчика с момента их создания, независимо от статуса оплаты. Исполнитель настоящим передаёт Заказчику все права, титул и интересы в любых результатах работы. Исполнитель отказывается от всех личных неимущественных прав. Заказчик вправе бессрочно использовать имя Исполнителя и образцы его портфолио в маркетинговых целях.

4. РАСТОРЖЕНИЕ
Заказчик вправе расторгнуть настоящий договор в любое время, с указанием причины или без неё, без какого-либо уведомления. При расторжении Исполнитель немедленно передаёт все незавершённые работы. За работу, не выставленную к оплате на момент расторжения, вознаграждение не выплачивается.

5. НЕКОНКУРЕНЦИЯ
Исполнитель обязуется не оказывать дизайнерские услуги ни одной компании в технологическом секторе в течение 24 месяцев после расторжения настоящего договора.

6. КОНФИДЕНЦИАЛЬНОСТЬ
Исполнитель обязуется бессрочно сохранять конфиденциальность всей информации Заказчика, в том числе после расторжения, и не обсуждать факт существования настоящего договора с третьими лицами.

7. РАЗРЕШЕНИЕ СПОРОВ
Любые споры разрешаются обязательным арбитражем в юрисдикции Заказчика. Исполнитель отказывается от всех прав на суд присяжных. Заказчик вправе требовать судебного запрета в любом суде без внесения залога.

8. ПРИМЕНИМОЕ ПРАВО
Настоящий договор регулируется законами штата Делавэр, независимо от местонахождения Исполнителя.

9. ПОЛНОТА ДОГОВОРА
Настоящий договор заменяет все предыдущие соглашения. Заказчик вправе изменять настоящий договор в любое время, размещая обновления на своём веб-сайте.`,
    cd_example_context: "Я дизайнер-фрилансер, и меня просят подписать это перед началом проекта для стартапа.",
  },
  th: {
    cd_your_situation: "สิ่งที่คุณบอกเรา",
    cd_chars_analyzed: "วิเคราะห์แล้ว {{count}} อักขระ",
    cd_title: "Contract Decoder",
    cd_tagline: "วางสัญญาใด ๆ ก็ได้ — รู้ชัดเจนว่าคุณกำลังเซ็นอะไร",
    cd_type_label: "ประเภทสัญญา",
    cd_type_employment: "การจ้างงาน",
    cd_type_freelance: "ฟรีแลนซ์ / NDA",
    cd_type_lease: "เช่า / เช่าซื้อ",
    cd_type_saas: "SaaS / ข้อกำหนด",
    cd_type_service: "สัญญาบริการ",
    cd_type_purchase: "ซื้อ / ขาย",
    cd_type_partnership: "หุ้นส่วน",
    cd_type_other: "อื่น ๆ",
    cd_focus_label: "ประเด็นที่สนใจ",
    cd_focus_hint: "(ไม่บังคับ — เลือกสิ่งที่สำคัญที่สุดสำหรับคุณ)",
    cd_focus_exit: "เงื่อนไขการออก / การยุติสัญญา",
    cd_focus_liability: "ความรับผิดและการชดใช้",
    cd_focus_ip: "ทรัพย์สินทางปัญญาและสิทธิความเป็นเจ้าของ",
    cd_focus_autorenewal: "การต่ออายุอัตโนมัติและการยกเลิก",
    cd_focus_payment: "เงื่อนไขการชำระเงินและการคืนเงิน",
    cd_focus_noncompete: "ห้ามแข่งขัน / ห้ามชักชวน",
    cd_focus_privacy: "ข้อมูลและความเป็นส่วนตัว",
    cd_focus_dispute: "การระงับข้อพิพาท",
    cd_text_label: "ข้อความสัญญา",
    cd_text_ph: "วางข้อความสัญญาฉบับเต็มที่นี่ — สัญญาจ้างงาน, NDA, สัญญาเช่า, ข้อกำหนดการให้บริการ, สัญญาบริการ…",
    cd_text_short: "วางข้อความสัญญาเพิ่มเติมเพื่อการวิเคราะห์ที่เป็นประโยชน์",
    cd_context_label: "สถานการณ์ของคุณ",
    cd_context_hint: "(ไม่บังคับ)",
    cd_context_ph: "เช่น 'ฉันเป็นฟรีแลนซ์ นี่เป็นโปรเจกต์ 3 เดือน' หรือ 'ข้อเสนองานแรก ไม่มีอำนาจต่อรอง'",
    cd_xref_lease_q: "กำลังเซ็นสัญญาเช่า?",
    cd_xref_lease_tail: "เจาะลึกเรื่องสัญญาเช่ามากกว่า",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "กำลังวิเคราะห์…",
    cd_decode: "ถอดรหัสสัญญานี้",
    cd_recent: "การวิเคราะห์ล่าสุด",
    cd_clear: "ล้าง",
    cd_high_risk_clauses: "ข้อความเสี่ยงสูง",
    cd_high_risk_clauses_plural: "ข้อความเสี่ยงสูง",
    cd_new_contract: "สัญญาใหม่",
    cd_risk_high: "เสี่ยงสูง",
    cd_risk_medium: "ตรวจสอบอย่างรอบคอบ",
    cd_risk_low: "ดูสมเหตุสมผล",
    cd_risk_reviewed: "ตรวจสอบแล้ว",
    cd_found_clause: "พบข้อความเสี่ยงสูง",
    cd_found_clauses: "พบข้อความเสี่ยงสูง",
    cd_high_heading: "ข้อความเสี่ยงสูง",
    cd_medium_heading: "จับตาข้อความเหล่านี้",
    cd_low_heading: "ข้อความมาตรฐาน",
    cd_missing_heading: "การคุ้มครองที่ขาดหายไป",
    cd_before_heading: "ก่อนที่คุณจะเซ็น",
    cd_related: "เครื่องมือที่เกี่ยวข้อง",
    cd_contract_language: "ถ้อยคำในสัญญา",
    cd_why_matters: "ทำไมจึงสำคัญ:",
    cd_ask_for: "ขอสิ่งนี้:",
    cd_error: "เกิดข้อผิดพลาดบางอย่าง โปรดลองอีกครั้ง",
    cd_copy_header: "การวิเคราะห์ CONTRACT DECODER",
    cd_copy_overall: "ความเสี่ยงโดยรวม:",
    cd_copy_highrisk: "ข้อความเสี่ยงสูง:",
    cd_copy_clauses: "ข้อความที่ถูกทำเครื่องหมาย",
    cd_copy_negotiate: "ต่อรอง:",
    cd_copy_missing: "การคุ้มครองที่ขาดหายไป",
    cd_copy_before: "ก่อนที่คุณจะเซ็น",
    cd_example_contract: `สัญญาบริการฟรีแลนซ์

สัญญานี้ทำขึ้น ณ วันที่ลงนาม ระหว่าง ACME Corp ("ลูกค้า") และนักออกแบบผู้ลงนามด้านล่าง ("ผู้รับจ้าง")

1. บริการ
ผู้รับจ้างตกลงให้บริการออกแบบกราฟิกตามที่ลูกค้ากำหนด

2. ค่าตอบแทน
ลูกค้าจะจ่ายให้ผู้รับจ้าง {{sym}}75/ชั่วโมง การชำระเงินครบกำหนดภายใน 60 วันนับจากวันที่ออกใบแจ้งหนี้ ลูกค้าอาจโต้แย้งใบแจ้งหนี้ใด ๆ ได้ภายใน 90 วันนับจากวันที่ได้รับ ผู้รับจ้างสละสิทธิ์ในการรับเงินทั้งหมดหากไม่เรียกร้องภายใน 6 เดือนหลังเสร็จงาน

3. ทรัพย์สินทางปัญญา
ผลงานทั้งหมด รวมถึงแบบร่างเบื้องต้น ภาพสเก็ตช์ และแนวคิด จะเป็นทรัพย์สินแต่เพียงผู้เดียวและโดยเด็ดขาดของลูกค้านับแต่เวลาที่สร้างขึ้น ไม่ว่าสถานะการชำระเงินจะเป็นอย่างไร ผู้รับจ้างขอโอนสิทธิ กรรมสิทธิ์ และผลประโยชน์ทั้งหมดในผลงานใด ๆ ให้แก่ลูกค้า ผู้รับจ้างสละสิทธิทางศีลธรรมทั้งหมด ลูกค้าอาจใช้ชื่อของผู้รับจ้างและตัวอย่างผลงานได้ตลอดไปเพื่อวัตถุประสงค์ทางการตลาด

4. การยุติสัญญา
ลูกค้าอาจยุติสัญญานี้เมื่อใดก็ได้ ไม่ว่าจะมีเหตุผลหรือไม่ก็ตาม โดยไม่ต้องบอกกล่าวล่วงหน้า เมื่อยุติสัญญา ผู้รับจ้างต้องส่งมอบงานที่กำลังดำเนินอยู่ทั้งหมดทันที จะไม่มีการจ่ายค่าตอบแทนสำหรับงานที่ยังไม่ได้ออกใบแจ้งหนี้ ณ เวลาที่ยุติสัญญา

5. ห้ามแข่งขัน
ผู้รับจ้างตกลงที่จะไม่ให้บริการออกแบบแก่บริษัทใด ๆ ในภาคเทคโนโลยีเป็นระยะเวลา 24 เดือนหลังการยุติสัญญานี้

6. การรักษาความลับ
ผู้รับจ้างจะรักษาข้อมูลทั้งหมดของลูกค้าเป็นความลับตลอดไป รวมถึงหลังการยุติสัญญา และจะไม่หารือถึงการมีอยู่ของสัญญานี้กับบุคคลที่สามใด ๆ

7. การระงับข้อพิพาท
ข้อพิพาทใด ๆ จะได้รับการระงับโดยอนุญาโตตุลาการที่มีผลผูกพันในเขตอำนาจศาลของลูกค้า ผู้รับจ้างสละสิทธิในการพิจารณาคดีโดยคณะลูกขุนทั้งหมด ลูกค้าอาจขอคำสั่งคุ้มครองชั่วคราวในศาลใด ๆ ได้โดยไม่ต้องวางหลักประกัน

8. กฎหมายที่ใช้บังคับ
สัญญานี้อยู่ภายใต้กฎหมายของรัฐเดลาแวร์ ไม่ว่าผู้รับจ้างจะอยู่ที่ใด

9. ข้อตกลงทั้งหมด
สัญญานี้แทนที่ข้อตกลงก่อนหน้าทั้งหมด ลูกค้าอาจแก้ไขสัญญานี้เมื่อใดก็ได้โดยการโพสต์การอัปเดตบนเว็บไซต์ของตน`,
    cd_example_context: "ฉันเป็นนักออกแบบฟรีแลนซ์และถูกขอให้เซ็นสิ่งนี้ก่อนเริ่มโปรเจกต์ให้กับสตาร์ทอัป",
  },
  vi: {
    cd_your_situation: "Những gì bạn đã chia sẻ",
    cd_chars_analyzed: "Đã phân tích {{count}} ký tự",
    cd_title: "Contract Decoder",
    cd_tagline: "Dán bất kỳ hợp đồng nào — biết chính xác bạn đang ký gì.",
    cd_type_label: "Loại hợp đồng",
    cd_type_employment: "Lao động",
    cd_type_freelance: "Freelance / NDA",
    cd_type_lease: "Thuê / Cho thuê",
    cd_type_saas: "SaaS / Điều khoản",
    cd_type_service: "Hợp đồng dịch vụ",
    cd_type_purchase: "Mua / Bán",
    cd_type_partnership: "Hợp tác",
    cd_type_other: "Khác",
    cd_focus_label: "Lĩnh vực cần lưu ý",
    cd_focus_hint: "(tùy chọn — chọn điều quan trọng nhất với bạn)",
    cd_focus_exit: "Điều khoản chấm dứt / rút lui",
    cd_focus_liability: "Trách nhiệm & bồi thường",
    cd_focus_ip: "Sở hữu trí tuệ & quyền sở hữu",
    cd_focus_autorenewal: "Tự động gia hạn & hủy",
    cd_focus_payment: "Điều khoản thanh toán & hoàn tiền",
    cd_focus_noncompete: "Không cạnh tranh / không lôi kéo",
    cd_focus_privacy: "Dữ liệu & quyền riêng tư",
    cd_focus_dispute: "Giải quyết tranh chấp",
    cd_text_label: "Nội dung hợp đồng",
    cd_text_ph: "Dán toàn bộ nội dung hợp đồng vào đây — hợp đồng lao động, NDA, hợp đồng thuê, điều khoản dịch vụ, hợp đồng dịch vụ…",
    cd_text_short: "Dán thêm nội dung hợp đồng để có phân tích hữu ích.",
    cd_context_label: "Tình huống của bạn",
    cd_context_hint: "(tùy chọn)",
    cd_context_ph: "ví dụ: 'Tôi là freelancer, đây là dự án 3 tháng' hoặc 'Lời mời làm việc đầu tiên, không có lợi thế đàm phán'",
    cd_xref_lease_q: "Sắp ký hợp đồng thuê?",
    cd_xref_lease_tail: "đi sâu hơn về hợp đồng cho thuê.",
    cd_lease: "Lease Trap Detector",
    cd_complaint: "Complaint Escalation Writer",
    cd_leverage: "Leverage Logic",
    cd_analyzing: "Đang phân tích…",
    cd_decode: "Giải mã hợp đồng này",
    cd_recent: "Phân tích gần đây",
    cd_clear: "Xóa",
    cd_high_risk_clauses: "điều khoản rủi ro cao",
    cd_high_risk_clauses_plural: "điều khoản rủi ro cao",
    cd_new_contract: "Hợp đồng mới",
    cd_risk_high: "RỦI RO CAO",
    cd_risk_medium: "XEM XÉT KỸ",
    cd_risk_low: "TRÔNG HỢP LÝ",
    cd_risk_reviewed: "ĐÃ XEM XÉT",
    cd_found_clause: "điều khoản rủi ro cao được tìm thấy",
    cd_found_clauses: "điều khoản rủi ro cao được tìm thấy",
    cd_high_heading: "Điều khoản rủi ro cao",
    cd_medium_heading: "Lưu ý các điều khoản này",
    cd_low_heading: "Điều khoản tiêu chuẩn",
    cd_missing_heading: "Bảo vệ còn thiếu",
    cd_before_heading: "Trước khi bạn ký",
    cd_related: "Công cụ liên quan",
    cd_contract_language: "Ngôn ngữ hợp đồng",
    cd_why_matters: "Tại sao điều này quan trọng:",
    cd_ask_for: "Hãy yêu cầu:",
    cd_error: "Đã xảy ra lỗi. Vui lòng thử lại.",
    cd_copy_header: "PHÂN TÍCH CONTRACT DECODER",
    cd_copy_overall: "Rủi ro tổng thể:",
    cd_copy_highrisk: "Điều khoản rủi ro cao:",
    cd_copy_clauses: "CÁC ĐIỀU KHOẢN ĐƯỢC ĐÁNH DẤU",
    cd_copy_negotiate: "Đàm phán:",
    cd_copy_missing: "BẢO VỆ CÒN THIẾU",
    cd_copy_before: "TRƯỚC KHI BẠN KÝ",
    cd_example_contract: `HỢP ĐỒNG DỊCH VỤ FREELANCE

Hợp đồng này được lập vào ngày ký giữa ACME Corp ("Khách hàng") và nhà thiết kế ký tên dưới đây ("Nhà thầu").

1. DỊCH VỤ
Nhà thầu đồng ý cung cấp dịch vụ thiết kế đồ họa theo chỉ đạo của Khách hàng.

2. THÙ LAO
Khách hàng sẽ trả cho Nhà thầu {{sym}}75/giờ. Thanh toán đến hạn trong vòng 60 ngày kể từ ngày xuất hóa đơn. Khách hàng có thể khiếu nại bất kỳ hóa đơn nào trong vòng 90 ngày kể từ khi nhận. Nhà thầu từ bỏ mọi quyền được thanh toán nếu không yêu cầu trong vòng 6 tháng sau khi hoàn thành.

3. SỞ HỮU TRÍ TUỆ
Mọi sản phẩm công việc, bao gồm thiết kế sơ bộ, phác thảo và ý tưởng, sẽ là tài sản duy nhất và độc quyền của Khách hàng kể từ khi tạo ra, bất kể tình trạng thanh toán. Nhà thầu theo đây chuyển nhượng cho Khách hàng mọi quyền, quyền sở hữu và lợi ích đối với bất kỳ sản phẩm công việc nào. Nhà thầu từ bỏ mọi quyền nhân thân. Khách hàng có thể sử dụng tên Nhà thầu và mẫu hồ sơ năng lực vĩnh viễn cho mục đích tiếp thị.

4. CHẤM DỨT
Khách hàng có thể chấm dứt hợp đồng này bất cứ lúc nào, có hoặc không có lý do, mà không cần báo trước. Khi chấm dứt, Nhà thầu phải bàn giao ngay tất cả công việc đang thực hiện. Không có thù lao nào được trả cho công việc chưa xuất hóa đơn tại thời điểm chấm dứt.

5. KHÔNG CẠNH TRANH
Nhà thầu đồng ý không thực hiện dịch vụ thiết kế cho bất kỳ công ty nào trong lĩnh vực công nghệ trong thời gian 24 tháng sau khi chấm dứt hợp đồng này.

6. BẢO MẬT
Nhà thầu sẽ giữ bí mật mọi thông tin của Khách hàng vĩnh viễn, kể cả sau khi chấm dứt, và sẽ không thảo luận về sự tồn tại của hợp đồng này với bất kỳ bên thứ ba nào.

7. GIẢI QUYẾT TRANH CHẤP
Mọi tranh chấp sẽ được giải quyết bằng trọng tài có giá trị ràng buộc tại khu vực tài phán của Khách hàng. Nhà thầu từ bỏ mọi quyền xét xử bởi bồi thẩm đoàn. Khách hàng có thể yêu cầu biện pháp khẩn cấp tạm thời tại bất kỳ tòa án nào mà không cần đặt cọc.

8. LUẬT ÁP DỤNG
Hợp đồng này được điều chỉnh bởi luật của bang Delaware, bất kể địa điểm của Nhà thầu.

9. TOÀN BỘ THỎA THUẬN
Hợp đồng này thay thế mọi thỏa thuận trước đó. Khách hàng có thể sửa đổi hợp đồng này bất cứ lúc nào bằng cách đăng cập nhật lên trang web của mình.`,
    cd_example_context: "Tôi là nhà thiết kế freelance và được yêu cầu ký giấy này trước khi bắt đầu một dự án cho một startup.",
  },
};
