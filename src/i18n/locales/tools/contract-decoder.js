// ContractDecoder — cd_* keys for all 13 languages. Self-contained data.
// Brand/tool names (Contract Decoder, Lease Trap Detector, Complaint Escalation
// Writer, Leverage Logic, ACME Corp) stay as-is across languages.
// cd_example_contract is a format-sample contract: same value across langs is fine.
export const contractDecoder = {
  en: {
    cd_uploaded_file: "Uploaded file",
    cd_wait_body: "A long agreement can take two minutes or more. Leave this open — it will appear here when it's done.",
    cd_wait_title: "Reading the contract",
    cd_upload: "Upload a file",
    cd_upload_hint: "PDF or text · or paste below",
    cd_remove_file: "Remove",
    cd_err_too_large: "That file is over 10 MB — paste the text instead.",
    cd_err_read: "Couldn't read that file. Try pasting the text.",
    cd_tagline2: "Understand what you're agreeing to before you sign.",
    cd_juris_label: "Where does this contract apply?",
    cd_optional: "(optional)",
    cd_juris_ph: "Country and state/province, if known",
    cd_juris_hint: "Use the contract's governing location if it states one.",
    cd_situation: "Your situation",
    cd_situation_ph: "e.g., 'I'm a freelancer signing a 3-month project' or 'This is my first lease'",
    cd_reviewed: "📝 Contract reviewed",
    cd_overview: "Plain-English overview",
    cd_terms: "Important terms",
    cd_clarify: "Things to clarify",
    cd_ask: "Ask:",
    cd_before_sign: "Before you sign",
    cd_contract_language: "Contract language",
    cd_practical_effect: "Practical effect:",
    cd_question_consider: "Question to consider:",
    cd_negotiate_this: "If you want to negotiate this",
    cd_example2_context: "We use this scheduling software across the whole company. Renewal invoice arrived and it is 40% higher than last year. I am trying to work out whether we are locked in.",
    cd_example3_context: "Signing a one-year lease on an apartment next week. Landlord sent the lease as a PDF and wants it back by Friday.",
    cd_example4_context: "Got a written offer for a new job and I have three days to sign. There's a non-compete clause I don't fully understand.",
    cd_example5_context: "A startup wants me to sign this before they'll discuss a potential contract role with me.",
    cd_example3_contract: "RESIDENTIAL LEASE AGREEMENT (EXTRACT)\n\n4. SECURITY DEPOSIT\n4.1 Tenant shall pay a security deposit equal to two (2) months' rent, refundable within forty-five (45) days of move-out less deductions for damage beyond normal wear and tear, as determined solely by Landlord.\n\n7. MAINTENANCE\n7.2 Tenant is responsible for all repairs under $150 per occurrence. Landlord is responsible for structural repairs only.\n\n9. EARLY TERMINATION\n9.1 Tenant may not terminate this Agreement prior to the end of the Term. Any early departure forfeits the full Security Deposit and obligates Tenant for rent through the earlier of (a) the end of the Term, or (b) a new tenant taking occupancy, with Landlord under no obligation to actively seek a replacement tenant.\n\n12. ENTRY\n12.1 Landlord may enter the premises with twenty-four (24) hours notice for any purpose, or without notice in case of emergency as determined by Landlord.\n\n15. FEES\n15.3 Rent not received by the 3rd of the month incurs a late fee of $75 plus $10 per additional day.",
    cd_example4_contract: "OFFER LETTER (EXTRACT)\n\n4. RESTRICTIVE COVENANTS\n4.1 For a period of eighteen (18) months following termination of employment for any reason, Employee shall not, directly or indirectly, provide services to any business that competes with the Company anywhere in the United States.\n4.2 Employee assigns to the Company all inventions, works, and ideas conceived during employment, whether or not related to Company business, whether created on Company time or personal time.\n4.3 During employment and for twelve (12) months thereafter, Employee shall not solicit any Company employee or contractor to leave the Company.\n\n6. AT-WILL EMPLOYMENT\n6.1 Employment is at-will and may be terminated by either party at any time, with or without cause, with or without notice.\n\n8. ARBITRATION\n8.1 Any dispute arising from this offer or Employee's employment shall be resolved exclusively through binding arbitration; Employee waives the right to a jury trial and to participate in any class action.",
    cd_example5_contract: "MUTUAL NON-DISCLOSURE AGREEMENT (EXTRACT)\n\n2. CONFIDENTIAL INFORMATION\n2.1 \"Confidential Information\" includes any information disclosed by either party, whether marked confidential or not, including business plans, financials, and the fact that discussions are taking place.\n\n5. TERM\n5.1 This Agreement remains in effect for three (3) years from the Effective Date. Obligations of confidentiality survive termination indefinitely for any information that constitutes a trade secret.\n\n6. NO OBLIGATION\n6.1 Nothing in this Agreement obligates either party to disclose any information, enter into any further agreement, or proceed with any transaction.\n\n8. REMEDIES\n8.1 The parties agree that a breach of this Agreement would cause irreparable harm for which monetary damages would be inadequate, and the non-breaching party shall be entitled to injunctive relief without the necessity of posting a bond.\n\n9. NO LICENSE\n9.1 No license or other right is granted under this Agreement, by implication or otherwise, to any Confidential Information disclosed.",
    cd_example2_contract: "MASTER SUBSCRIPTION AGREEMENT (EXTRACT)\n\n3. TERM AND RENEWAL\n3.1 The Initial Term is twelve (12) months from the Effective Date.\n3.2 This Agreement shall automatically renew for successive twelve (12) month periods unless either party gives written notice of non-renewal not less than ninety (90) days prior to the end of the then-current term.\n3.3 Fees for each renewal term shall be as set out in the Provider's then-current price list. The Provider may increase fees on renewal without limitation.\n\n5. FEES\n5.2 All fees are non-refundable and payable annually in advance. No credit is given for unused Subscriptions or partial months.\n5.4 Subscriptions may be added during a term at the then-current rate, co-terminating with the current term. Subscriptions may not be reduced during a term.\n\n8. SUSPENSION\n8.1 The Provider may suspend access where any invoice remains unpaid for thirty (30) days, and shall not be liable for any loss arising from such suspension.\n\n11. DATA ON TERMINATION\n11.2 The Provider will make Customer Data available for export for thirty (30) days following termination, after which it may be deleted. Export is provided in the Provider's standard format. Assistance with migration is chargeable at the Provider's professional services rates.\n\n14. GENERAL\n14.3 The Provider may amend these terms on thirty (30) days' notice. Continued use of the Service after the effective date of any amendment constitutes acceptance.",
    cd_your_situation: "What you told us",
    cd_chars_analyzed: "{{count}} characters analyzed",
    cd_title: "Contract Decoder",
    cd_tagline: "Paste any contract — know exactly what you're signing",
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
    cd_uploaded_file: "Archivo subido",
    cd_wait_body: "Un contrato largo puede tardar dos minutos o más. Deja esto abierto: aparecerá aquí cuando termine.",
    cd_wait_title: "Leyendo el contrato",
    cd_upload: "Subir un archivo",
    cd_upload_hint: "PDF o texto · o pega abajo",
    cd_remove_file: "Quitar",
    cd_err_too_large: "Ese archivo supera los 10 MB: pega el texto.",
    cd_err_read: "No se pudo leer el archivo. Prueba a pegar el texto.",
    cd_tagline2: "Entiende lo que estás aceptando antes de firmar.",
    cd_juris_label: "¿Dónde se aplica este contrato?",
    cd_optional: "(opcional)",
    cd_juris_ph: "País y comunidad o provincia, si lo sabes",
    cd_juris_hint: "Usa la jurisdicción que indique el contrato, si la indica.",
    cd_situation: "Tu situación",
    cd_situation_ph: "p. ej., 'soy autónomo y firmo un proyecto de 3 meses' o 'es mi primer alquiler'",
    cd_reviewed: "📝 Contrato revisado",
    cd_overview: "Resumen en lenguaje claro",
    cd_terms: "Cláusulas importantes",
    cd_clarify: "Cosas que aclarar",
    cd_ask: "Pregunta:",
    cd_before_sign: "Antes de firmar",
    cd_contract_language: "Texto del contrato",
    cd_practical_effect: "Efecto práctico:",
    cd_question_consider: "Pregunta a considerar:",
    cd_negotiate_this: "Si quieres negociarlo",
    cd_example2_context: "Usamos este software de horarios en toda la empresa. Ha llegado la factura de renovación y es un 40% más alta que el año pasado. Intento averiguar si estamos atados.",
    cd_example3_context: "Voy a firmar un contrato de alquiler de un año la semana que viene. El casero me envió el contrato en PDF y lo quiere de vuelta el viernes.",
    cd_example4_context: "Recibí una oferta de trabajo por escrito y tengo tres días para firmar. Hay una cláusula de no competencia que no entiendo del todo.",
    cd_example5_context: "Una startup quiere que firme esto antes de siquiera hablar conmigo de un posible puesto por contrato.",
    cd_example3_contract: "CONTRATO DE ARRENDAMIENTO RESIDENCIAL (EXTRACTO)\n\n4. DEPÓSITO DE GARANTÍA\n4.1 El Inquilino pagará un depósito de garantía equivalente a dos (2) meses de renta, reembolsable en un plazo de cuarenta y cinco (45) días tras la mudanza, menos deducciones por daños superiores al desgaste normal, determinadas exclusivamente por el Propietario.\n\n7. MANTENIMIENTO\n7.2 El Inquilino es responsable de todas las reparaciones inferiores a 150 por incidencia. El Propietario solo es responsable de reparaciones estructurales.\n\n9. TERMINACIÓN ANTICIPADA\n9.1 El Inquilino no podrá dar por terminado este Contrato antes de la finalización del Plazo. Cualquier salida anticipada implicará la pérdida total del Depósito de Garantía y obligará al Inquilino a pagar la renta hasta que ocurra lo primero entre (i) el fin del Plazo, o (ii) la ocupación por un nuevo inquilino, sin que el Propietario tenga obligación alguna de buscar activamente un reemplazo.\n\n12. ACCESO\n12.1 El Propietario podrá acceder a la vivienda con veinticuatro (24) horas de aviso para cualquier propósito, o sin aviso en caso de emergencia según determine el Propietario.\n\n15. RECARGOS\n15.3 La renta no recibida antes del día 3 del mes generará un recargo de 75 más 10 por cada día adicional.",
    cd_example4_contract: "CARTA DE OFERTA (EXTRACTO)\n\n4. PACTOS RESTRICTIVOS\n4.1 Durante un periodo de dieciocho (18) meses tras la finalización del empleo por cualquier motivo, el Empleado no prestará, directa ni indirectamente, servicios a ningún negocio que compita con la Empresa en cualquier parte de Estados Unidos.\n4.2 El Empleado cede a la Empresa todas las invenciones, obras e ideas concebidas durante el empleo, estén o no relacionadas con la actividad de la Empresa, y se hayan creado en horario laboral o personal.\n4.3 Durante el empleo y durante doce (12) meses después, el Empleado no captará a ningún empleado o contratista de la Empresa para que la abandone.\n\n6. EMPLEO A VOLUNTAD\n6.1 El empleo es a voluntad y puede ser terminado por cualquiera de las partes en cualquier momento, con o sin causa, con o sin previo aviso.\n\n8. ARBITRAJE\n8.1 Cualquier disputa derivada de esta oferta o del empleo del Empleado se resolverá exclusivamente mediante arbitraje vinculante; el Empleado renuncia al derecho a juicio con jurado y a participar en cualquier acción colectiva.",
    cd_example5_contract: "ACUERDO MUTUO DE CONFIDENCIALIDAD (EXTRACTO)\n\n2. INFORMACIÓN CONFIDENCIAL\n2.1 «Información Confidencial» incluye cualquier información revelada por cualquiera de las partes, esté o no marcada como confidencial, incluyendo planes de negocio, datos financieros y el propio hecho de que se están manteniendo conversaciones.\n\n5. VIGENCIA\n5.1 Este Acuerdo permanece vigente durante tres (3) años desde la Fecha de Entrada en Vigor. Las obligaciones de confidencialidad sobreviven indefinidamente respecto de cualquier información que constituya un secreto comercial.\n\n6. SIN OBLIGACIÓN\n6.1 Nada en este Acuerdo obliga a ninguna de las partes a revelar información alguna, celebrar ningún acuerdo posterior, ni continuar con transacción alguna.\n\n8. RECURSOS\n8.1 Las partes acuerdan que un incumplimiento de este Acuerdo causaría un daño irreparable para el cual los daños monetarios serían insuficientes, y la parte no incumplidora tendrá derecho a medidas cautelares sin necesidad de constituir fianza.\n\n9. SIN LICENCIA\n9.1 Este Acuerdo no otorga, ni por implicación ni de otro modo, ninguna licencia u otro derecho sobre la Información Confidencial revelada.",
    cd_example2_contract: "CONTRATO MARCO DE SUSCRIPCIÓN (EXTRACTO)\n\n3. DURACIÓN Y RENOVACIÓN\n3.1 El Plazo Inicial es de doce (12) meses desde la Fecha de Entrada en Vigor.\n3.2 Este Contrato se renovará automáticamente por periodos sucesivos de doce (12) meses salvo que cualquiera de las partes comunique por escrito su voluntad de no renovar con al menos noventa (90) días de antelación a la finalización del periodo en curso.\n3.3 Las tarifas de cada renovación serán las de la lista de precios vigente del Proveedor. El Proveedor podrá incrementar las tarifas en la renovación sin limitación alguna.\n\n5. TARIFAS\n5.2 Todas las tarifas son no reembolsables y se abonan anualmente por adelantado. No se abonará crédito alguno por Suscripciones no utilizadas ni por meses parciales.\n5.4 Podrán añadirse Suscripciones durante el plazo a la tarifa vigente, con vencimiento coincidente con el plazo en curso. No podrán reducirse Suscripciones durante el plazo.\n\n8. SUSPENSIÓN\n8.1 El Proveedor podrá suspender el acceso cuando cualquier factura permanezca impagada durante treinta (30) días, sin responder de ninguna pérdida derivada de dicha suspensión.\n\n11. DATOS EN CASO DE RESOLUCIÓN\n11.2 El Proveedor pondrá los Datos del Cliente a disposición para su exportación durante treinta (30) días tras la resolución, transcurridos los cuales podrán ser eliminados. La exportación se facilita en el formato estándar del Proveedor. La asistencia en la migración se factura según las tarifas de servicios profesionales del Proveedor.\n\n14. GENERAL\n14.3 El Proveedor podrá modificar estas condiciones con un preaviso de treinta (30) días. El uso continuado del Servicio tras la fecha de efecto de cualquier modificación constituye su aceptación.",
    cd_your_situation: "Lo que nos contaste",
    cd_chars_analyzed: "{{count}} caracteres analizados",
    cd_title: "Contract Decoder",
    cd_tagline: "Pega cualquier contrato y sabe exactamente qué estás firmando.",
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
    cd_uploaded_file: "已上传的文件",
    cd_wait_body: "长合同可能要两分钟以上。别关这个页面，好了就会显示在这里。",
    cd_wait_title: "正在读合同",
    cd_upload: "上传文件",
    cd_upload_hint: "PDF 或纯文本 · 也可以粘贴在下面",
    cd_remove_file: "移除",
    cd_err_too_large: "文件超过 10 MB，请改为粘贴文字。",
    cd_err_read: "读不了这个文件，试试直接粘贴文字。",
    cd_tagline2: "签字之前，先弄清你答应了什么。",
    cd_juris_label: "这份合同适用于哪里？",
    cd_optional: "（选填）",
    cd_juris_ph: "国家和省/州，如果知道的话",
    cd_juris_hint: "如果合同写明了管辖地，就用它。",
    cd_situation: "你的情况",
    cd_situation_ph: "例如：我是自由职业者，要签一个三个月的项目；或者这是我第一次租房",
    cd_reviewed: "📝 已审阅合同",
    cd_overview: "大白话总览",
    cd_terms: "重要条款",
    cd_clarify: "需要问清楚的地方",
    cd_ask: "可以这样问：",
    cd_before_sign: "签字之前",
    cd_contract_language: "合同原文",
    cd_practical_effect: "实际影响：",
    cd_question_consider: "值得问的问题：",
    cd_negotiate_this: "如果你想谈这一条",
    cd_example2_context: "整个公司都在用这套排班软件。续费账单来了，比去年高了 40%。我想弄清楚我们是不是被锁死了。",
    cd_example3_context: "下周要签一份为期一年的租房合同。房东把合同发成PDF，要求周五之前签好寄回。",
    cd_example4_context: "拿到了一份书面的工作offer，有三天时间签字。里面有一条竞业限制条款我没完全看懂。",
    cd_example5_context: "一家创业公司要我先签这个，才愿意跟我谈可能的合同工职位。",
    cd_example3_contract: "住宅租赁协议（节选）\n\n4. 押金\n4.1 承租人应支付相当于两（2）个月租金的押金，在搬离后四十五（45）天内退还，超出正常磨损范围的损坏部分将由出租人自行认定并从中扣除。\n\n7. 维修\n7.2 每次金额低于150的维修由承租人负责。出租人仅负责结构性维修。\n\n9. 提前终止\n9.1 承租人不得在租期届满前终止本协议。任何提前搬离将导致押金全部被没收，并且承租人须继续承担租金，直至（a）租期结束，或（b）新租客入住，以较早者为准；出租人无义务主动寻找接替租客。\n\n12. 进入房屋\n12.1 出租人可提前二十四（24）小时通知后因任何目的进入房屋，或在出租人自行认定为紧急情况时无需通知即可进入。\n\n15. 费用\n15.3 未在当月3日前收到的租金将产生75的滞纳金，之后每多一天再加收10。",
    cd_example4_contract: "录用信（节选）\n\n4. 限制性约定\n4.1 无论因何种原因离职，员工在离职后十八（18）个月内不得在美国任何地方直接或间接为与公司存在竞争关系的企业提供服务。\n4.2 员工将在职期间构思的一切发明、作品和创意转让给公司，无论其是否与公司业务相关，也无论是在工作时间还是个人时间内产生。\n4.3 在职期间及离职后十二（12）个月内，员工不得招揽公司员工或承包商离开公司。\n\n6. 自由雇佣\n6.1 本雇佣关系为自由雇佣，任何一方均可随时终止，无论是否有理由、是否事先通知。\n\n8. 仲裁\n8.1 因本录用信或员工雇佣关系产生的任何争议均应且仅应通过具有约束力的仲裁解决；员工放弃陪审团审判的权利及参与任何集体诉讼的权利。",
    cd_example5_contract: "相互保密协议（节选）\n\n2. 保密信息\n2.1 「保密信息」包括任何一方披露的任何信息，无论是否标注为保密，包括商业计划、财务数据以及双方正在进行洽谈这一事实本身。\n\n5. 期限\n5.1 本协议自生效日起持续有效三（3）年。对于构成商业秘密的任何信息，保密义务在协议终止后无限期存续。\n\n6. 无义务\n6.1 本协议不要求任何一方披露任何信息、订立任何进一步协议或推进任何交易。\n\n8. 救济\n8.1 双方同意，违反本协议将造成金钱赔偿无法弥补的不可挽回的损害，守约方有权在无需提供保证金的情况下获得禁令救济。\n\n9. 不授予许可\n9.1 本协议不以默示或其他任何方式，就所披露的任何保密信息授予任何许可或其他权利。",
    cd_example2_contract: "主服务订阅协议（节选）\n\n3. 期限与续约\n3.1 初始期限自生效日起十二（12）个月。\n3.2 除非任一方在当前期限届满前不少于九十（90）日以书面形式发出不续约通知，本协议将自动按连续的十二（12）个月为期续约。\n3.3 各续约期的费用以服务方当时有效的价目表为准。服务方可在续约时不受限制地上调费用。\n\n5. 费用\n5.2 所有费用不予退还，按年预付。对未使用的订阅席位或不足月部分不予折抵。\n5.4 期限内可按当时费率增购订阅席位，其到期日与当前期限一致。期限内不得减少订阅席位。\n\n8. 暂停服务\n8.1 任何发票逾期三十（30）日未付的，服务方可暂停访问权限，且对因该暂停产生的任何损失不承担责任。\n\n11. 终止后的数据\n11.2 协议终止后三十（30）日内，服务方将提供客户数据导出，逾期可予删除。导出采用服务方的标准格式。迁移协助按服务方专业服务费率另行收费。\n\n14. 一般条款\n14.3 服务方可提前三十（30）日通知修改本条款。修改生效之日后继续使用本服务即视为接受。",
    cd_your_situation: "你告诉我们的情况",
    cd_chars_analyzed: "已分析 {{count}} 个字符",
    cd_title: "Contract Decoder",
    cd_tagline: "粘贴任何合同——清楚知道你正在签什么。",
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
    cd_uploaded_file: "अपलोड की गई फ़ाइल",
    cd_wait_body: "लंबे अनुबंध में दो मिनट या उससे ज़्यादा लग सकते हैं। यह पेज खुला रहने दें — तैयार होते ही यहीं दिखेगा।",
    cd_wait_title: "अनुबंध पढ़ा जा रहा है",
    cd_upload: "फ़ाइल अपलोड करें",
    cd_upload_hint: "PDF या टेक्स्ट · या नीचे पेस्ट करें",
    cd_remove_file: "हटाएँ",
    cd_err_too_large: "यह फ़ाइल 10 MB से बड़ी है — इसके बजाय टेक्स्ट पेस्ट करें।",
    cd_err_read: "यह फ़ाइल पढ़ी नहीं जा सकी। टेक्स्ट पेस्ट करके देखें।",
    cd_tagline2: "हस्ताक्षर से पहले समझें कि आप किस बात पर सहमत हो रहे हैं।",
    cd_juris_label: "यह अनुबंध कहाँ लागू होता है?",
    cd_optional: "(वैकल्पिक)",
    cd_juris_ph: "देश और राज्य/प्रांत, अगर पता हो",
    cd_juris_hint: "अगर अनुबंध में क्षेत्राधिकार लिखा है, वही इस्तेमाल करें।",
    cd_situation: "आपकी स्थिति",
    cd_situation_ph: "जैसे: 'मैं फ्रीलांसर हूँ और 3 महीने का प्रोजेक्ट साइन कर रहा हूँ' या 'यह मेरा पहला किराया अनुबंध है'",
    cd_reviewed: "📝 अनुबंध की समीक्षा हुई",
    cd_overview: "सरल भाषा में सार",
    cd_terms: "महत्वपूर्ण शर्तें",
    cd_clarify: "जो स्पष्ट करना है",
    cd_ask: "पूछें:",
    cd_before_sign: "हस्ताक्षर से पहले",
    cd_contract_language: "अनुबंध की भाषा",
    cd_practical_effect: "व्यावहारिक असर:",
    cd_question_consider: "सोचने लायक सवाल:",
    cd_negotiate_this: "अगर आप इस पर बातचीत करना चाहें",
    cd_example2_context: "पूरी कंपनी में यही शेड्यूलिंग सॉफ़्टवेयर इस्तेमाल होता है। रिन्यूअल का बिल आया है और पिछले साल से 40% ज़्यादा है। समझना चाहता हूँ कि हम फँसे हुए हैं या नहीं।",
    cd_example3_context: "अगले हफ़्ते एक साल के लिए फ़्लैट का लीज़ साइन करना है। मकान मालिक ने PDF में लीज़ भेजी है और शुक्रवार तक वापस चाहता है।",
    cd_example4_context: "नई नौकरी का लिखित ऑफ़र मिला है और साइन करने के लिए तीन दिन हैं। इसमें एक नॉन-कंपीट क्लॉज़ है जो मुझे पूरी तरह समझ नहीं आ रहा।",
    cd_example5_context: "एक स्टार्टअप चाहता है कि मुमकिन कॉन्ट्रैक्ट रोल पर बात करने से पहले मैं यह साइन करूँ।",
    cd_example3_contract: "आवासीय लीज़ अनुबंध (अंश)\n\n4. सुरक्षा जमा राशि\n4.1 किरायेदार दो (2) माह के किराए के बराबर सुरक्षा जमा राशि देगा, जो मकान खाली करने के पैंतालीस (45) दिनों के भीतर वापस की जाएगी, सामान्य टूट-फूट से अधिक नुकसान की कटौती के बाद, जिसका निर्धारण केवल मकान मालिक करेगा।\n\n7. रखरखाव\n7.2 प्रत्येक घटना पर 150 से कम की सभी मरम्मत किरायेदार की ज़िम्मेदारी है। मकान मालिक केवल संरचनात्मक मरम्मत के लिए उत्तरदायी है।\n\n9. समय-पूर्व समाप्ति\n9.1 किरायेदार अवधि समाप्त होने से पहले यह अनुबंध समाप्त नहीं कर सकता। किसी भी समय-पूर्व प्रस्थान पर पूरी सुरक्षा जमा राशि ज़ब्त होगी और किरायेदार तब तक किराया देने के लिए बाध्य रहेगा जब तक (a) अवधि समाप्त न हो जाए, या (b) कोई नया किरायेदार न आ जाए, इनमें से जो पहले हो; मकान मालिक की नया किरायेदार सक्रिय रूप से ढूँढने की कोई बाध्यता नहीं होगी।\n\n12. प्रवेश\n12.1 मकान मालिक किसी भी उद्देश्य से चौबीस (24) घंटे की सूचना देकर परिसर में प्रवेश कर सकता है, या आपातकालीन स्थिति में, जिसका निर्धारण मकान मालिक स्वयं करेगा, बिना सूचना के प्रवेश कर सकता है।\n\n15. शुल्क\n15.3 महीने की 3 तारीख तक न मिला किराया 75 का विलंब शुल्क और उसके बाद प्रत्येक अतिरिक्त दिन के लिए 10 अतिरिक्त उत्पन्न करेगा।",
    cd_example4_contract: "ऑफ़र लेटर (अंश)\n\n4. प्रतिबंधात्मक अनुबंध\n4.1 किसी भी कारण से रोज़गार समाप्त होने के बाद अठारह (18) माह की अवधि तक, कर्मचारी संयुक्त राज्य अमेरिका में कहीं भी कंपनी से प्रतिस्पर्धा करने वाले किसी भी व्यवसाय को प्रत्यक्ष या अप्रत्यक्ष रूप से सेवाएँ नहीं देगा।\n4.2 कर्मचारी रोज़गार के दौरान परिकल्पित सभी आविष्कार, कृतियाँ और विचार कंपनी को हस्तांतरित करता है, चाहे वे कंपनी के व्यवसाय से संबंधित हों या न हों, चाहे वे कंपनी के समय में बने हों या व्यक्तिगत समय में।\n4.3 रोज़गार के दौरान और उसके बाद बारह (12) माह तक, कर्मचारी किसी भी कंपनी कर्मचारी या ठेकेदार को कंपनी छोड़ने के लिए प्रेरित नहीं करेगा।\n\n6. इच्छानुसार रोज़गार\n6.1 रोज़गार इच्छानुसार है और किसी भी पक्ष द्वारा किसी भी समय, कारण सहित या बिना कारण, सूचना सहित या बिना सूचना के समाप्त किया जा सकता है।\n\n8. मध्यस्थता\n8.1 इस ऑफ़र या कर्मचारी के रोज़गार से उत्पन्न किसी भी विवाद का समाधान केवल बाध्यकारी मध्यस्थता के माध्यम से किया जाएगा; कर्मचारी जूरी ट्रायल के अधिकार और किसी भी सामूहिक कार्रवाई में भाग लेने के अधिकार को त्यागता है।",
    cd_example5_contract: "पारस्परिक गोपनीयता अनुबंध (अंश)\n\n2. गोपनीय जानकारी\n2.1 \"गोपनीय जानकारी\" में किसी भी पक्ष द्वारा प्रकट की गई कोई भी जानकारी शामिल है, चाहे वह गोपनीय के रूप में चिह्नित हो या न हो, जिसमें व्यावसायिक योजनाएँ, वित्तीय जानकारी, और यह तथ्य कि चर्चा हो रही है, शामिल है।\n\n5. अवधि\n5.1 यह अनुबंध प्रभावी तिथि से तीन (3) वर्षों तक प्रभावी रहेगा। किसी भी जानकारी के लिए जो व्यापार रहस्य की श्रेणी में आती है, गोपनीयता के दायित्व समाप्ति के बाद अनिश्चितकाल तक बने रहेंगे।\n\n6. कोई बाध्यता नहीं\n6.1 इस अनुबंध में कुछ भी किसी भी पक्ष को कोई जानकारी प्रकट करने, कोई आगे का अनुबंध करने, या किसी लेनदेन के साथ आगे बढ़ने के लिए बाध्य नहीं करता।\n\n8. उपचार\n8.1 पक्ष सहमत हैं कि इस अनुबंध का उल्लंघन ऐसी अपूरणीय क्षति का कारण बनेगा जिसके लिए मौद्रिक हर्जाना अपर्याप्त होगा, और गैर-उल्लंघनकारी पक्ष बिना कोई बॉन्ड जमा किए निषेधाज्ञा राहत का हकदार होगा।\n\n9. कोई लाइसेंस नहीं\n9.1 यह अनुबंध प्रकट की गई किसी भी गोपनीय जानकारी पर, चाहे निहितार्थ से या अन्यथा, कोई लाइसेंस या अन्य अधिकार प्रदान नहीं करता।",
    cd_example2_contract: "मास्टर सब्सक्रिप्शन एग्रीमेंट (अंश)\n\n3. अवधि और नवीनीकरण\n3.1 प्रारंभिक अवधि प्रभावी तिथि से बारह (12) माह है।\n3.2 यह अनुबंध क्रमशः बारह (12) माह की अवधियों के लिए स्वतः नवीनीकृत होगा, बशर्ते कोई पक्ष तत्कालीन अवधि की समाप्ति से कम से कम नब्बे (90) दिन पूर्व लिखित रूप में नवीनीकरण न करने की सूचना न दे।\n3.3 प्रत्येक नवीनीकरण अवधि का शुल्क प्रदाता की तत्कालीन मूल्य-सूची के अनुसार होगा। प्रदाता नवीनीकरण पर शुल्क बिना किसी सीमा के बढ़ा सकता है।\n\n5. शुल्क\n5.2 समस्त शुल्क अप्रतिदेय हैं और वार्षिक रूप से अग्रिम देय हैं। अप्रयुक्त सब्सक्रिप्शन या आंशिक माह के लिए कोई क्रेडिट नहीं दिया जाएगा।\n5.4 अवधि के दौरान तत्कालीन दर पर सब्सक्रिप्शन जोड़े जा सकते हैं, जिनकी समाप्ति वर्तमान अवधि के साथ होगी। अवधि के दौरान सब्सक्रिप्शन घटाए नहीं जा सकते।\n\n8. निलंबन\n8.1 कोई चालान तीस (30) दिनों तक अदत्त रहने पर प्रदाता पहुँच निलंबित कर सकता है और ऐसे निलंबन से उत्पन्न किसी हानि के लिए उत्तरदायी नहीं होगा।\n\n11. समाप्ति पर डेटा\n11.2 समाप्ति के पश्चात तीस (30) दिनों तक प्रदाता ग्राहक डेटा निर्यात हेतु उपलब्ध कराएगा, तत्पश्चात उसे हटाया जा सकता है। निर्यात प्रदाता के मानक प्रारूप में दिया जाएगा। माइग्रेशन में सहायता प्रदाता की व्यावसायिक सेवा दरों पर शुल्क-योग्य है।\n\n14. सामान्य\n14.3 प्रदाता तीस (30) दिनों की सूचना पर इन शर्तों में संशोधन कर सकता है। किसी संशोधन की प्रभावी तिथि के बाद सेवा का निरंतर उपयोग स्वीकृति माना जाएगा।",
    cd_your_situation: "आपने हमें जो बताया",
    cd_chars_analyzed: "{{count}} वर्णों का विश्लेषण किया गया",
    cd_title: "Contract Decoder",
    cd_tagline: "कोई भी अनुबंध पेस्ट करें — ठीक-ठीक जानें कि आप क्या साइन कर रहे हैं।",
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
    cd_uploaded_file: "ملف مرفوع",
    cd_wait_body: "العقد الطويل قد يستغرق دقيقتين أو أكثر. اترك الصفحة مفتوحة — ستظهر النتيجة هنا عند اكتمالها.",
    cd_wait_title: "جارٍ قراءة العقد",
    cd_upload: "ارفع ملفاً",
    cd_upload_hint: "PDF أو نص · أو الصقه بالأسفل",
    cd_remove_file: "إزالة",
    cd_err_too_large: "حجم الملف يتجاوز 10 ميغابايت — الصق النص بدلاً من ذلك.",
    cd_err_read: "تعذّرت قراءة الملف. جرّب لصق النص.",
    cd_tagline2: "افهم ما توافق عليه قبل أن توقّع.",
    cd_juris_label: "أين يسري هذا العقد؟",
    cd_optional: "(اختياري)",
    cd_juris_ph: "الدولة والولاية أو المحافظة، إن عُرفت",
    cd_juris_hint: "استخدم الجهة القضائية التي ينص عليها العقد إن ذكرها.",
    cd_situation: "وضعك",
    cd_situation_ph: "مثلاً: أعمل لحسابي وأوقّع مشروعاً لثلاثة أشهر، أو هذا أول عقد إيجار لي",
    cd_reviewed: "📝 تمت مراجعة العقد",
    cd_overview: "ملخص بلغة واضحة",
    cd_terms: "بنود مهمة",
    cd_clarify: "أمور تحتاج توضيحاً",
    cd_ask: "اسأل:",
    cd_before_sign: "قبل التوقيع",
    cd_contract_language: "نص العقد",
    cd_practical_effect: "الأثر العملي:",
    cd_question_consider: "سؤال يستحق الطرح:",
    cd_negotiate_this: "إذا أردت التفاوض على هذا البند",
    cd_example2_context: "نستخدم برنامج الجدولة هذا في الشركة كلها. وصلت فاتورة التجديد وهي أعلى بنسبة 40% عن العام الماضي. أحاول معرفة ما إذا كنا مقيّدين.",
    cd_example3_context: "سأوقّع عقد إيجار لمدة سنة الأسبوع المقبل. أرسل المالك العقد كملف PDF ويريده معاداً بحلول الجمعة.",
    cd_example4_context: "حصلت على عرض عمل كتابي وأمامي ثلاثة أيام للتوقيع. فيه بند عدم منافسة لا أفهمه تماماً.",
    cd_example5_context: "شركة ناشئة تريد مني توقيع هذا قبل أن توافق حتى على مناقشة دور تعاقدي محتمل معي.",
    cd_example3_contract: "اتفاقية إيجار سكني (مقتطف)\n\n4. مبلغ التأمين\n4.1 يدفع المستأجر مبلغ تأمين يعادل شهرين (2) من الإيجار، يُرد خلال خمسة وأربعين (45) يوماً من إخلاء الوحدة بعد خصم أي أضرار تتجاوز الاستهلاك الطبيعي، وفق تقدير المالك وحده.\n\n7. الصيانة\n7.2 يتحمّل المستأجر جميع الإصلاحات التي تقل تكلفتها عن 150 لكل واقعة. ويتحمّل المالك الإصلاحات الإنشائية فقط.\n\n9. الإنهاء المبكر\n9.1 لا يجوز للمستأجر إنهاء هذه الاتفاقية قبل نهاية المدة. وأي مغادرة مبكرة تُفقد المستأجر كامل مبلغ التأمين وتُلزمه بدفع الإيجار حتى وقوع الأسبق من: (أ) نهاية المدة، أو (ب) شغل مستأجر جديد للوحدة، دون أي التزام على المالك بالبحث الفعلي عن مستأجر بديل.\n\n12. الدخول إلى الوحدة\n12.1 يجوز للمالك دخول الوحدة بإشعار مدته أربع وعشرون (24) ساعة لأي غرض، أو دون إشعار في حالات الطوارئ التي يقدّرها المالك.\n\n15. الرسوم\n15.3 يترتب على الإيجار غير المستلم بحلول اليوم الثالث من الشهر رسم تأخير قدره 75 بالإضافة إلى 10 عن كل يوم إضافي.",
    cd_example4_contract: "خطاب عرض العمل (مقتطف)\n\n4. القيود التعاقدية\n4.1 لمدة ثمانية عشر (18) شهراً بعد انتهاء العمل لأي سبب، لا يجوز للموظف أن يقدّم، بشكل مباشر أو غير مباشر، خدمات لأي جهة تنافس الشركة في أي مكان داخل الولايات المتحدة.\n4.2 يتنازل الموظف للشركة عن جميع الاختراعات والأعمال والأفكار المتصوَّرة أثناء فترة العمل، سواء كانت متعلقة بنشاط الشركة أم لا، وسواء نشأت خلال وقت العمل أو الوقت الشخصي.\n4.3 خلال فترة العمل ولمدة اثني عشر (12) شهراً بعدها، لا يجوز للموظف استمالة أي موظف أو متعاقد مع الشركة لمغادرتها.\n\n6. العمل حسب الإرادة\n6.1 العمل قائم على الإرادة الحرة ويجوز لأي من الطرفين إنهاؤه في أي وقت، بسبب أو دون سبب، بإشعار أو دونه.\n\n8. التحكيم\n8.1 يُسوَّى أي نزاع ينشأ عن هذا العرض أو عن عمل الموظف حصراً من خلال التحكيم الملزم؛ ويتنازل الموظف عن الحق في محاكمة أمام هيئة محلفين وعن الحق في المشاركة في أي دعوى جماعية.",
    cd_example5_contract: "اتفاقية عدم إفشاء متبادلة (مقتطف)\n\n2. المعلومات السرية\n2.1 تشمل «المعلومات السرية» أي معلومات يفصح عنها أي من الطرفين، سواء وُسمت بأنها سرية أم لا، بما في ذلك خطط العمل والبيانات المالية وحتى واقع أن مناقشات تجري بين الطرفين.\n\n5. المدة\n5.1 تظل هذه الاتفاقية سارية لمدة ثلاث (3) سنوات من تاريخ السريان. وتستمر التزامات السرية إلى أجل غير مسمى بعد الإنهاء بالنسبة لأي معلومات تشكّل سراً تجارياً.\n\n6. عدم وجود التزام\n6.1 لا يُلزم أي شيء في هذه الاتفاقية أياً من الطرفين بالإفصاح عن أي معلومات، أو الدخول في أي اتفاقية أخرى، أو المضي في أي معاملة.\n\n8. سبل الانتصاف\n8.1 يتفق الطرفان على أن أي إخلال بهذه الاتفاقية سيسبب ضرراً لا يمكن تداركه ولا تكفيه التعويضات المالية، ويحق للطرف غير المخل الحصول على أمر قضائي زجري دون الحاجة إلى تقديم ضمان.\n\n9. عدم منح ترخيص\n9.1 لا تمنح هذه الاتفاقية، ضمناً أو غير ذلك، أي ترخيص أو حق آخر بشأن أي معلومات سرية تم الإفصاح عنها.",
    cd_example2_contract: "اتفاقية الاشتراك الرئيسية (مقتطف)\n\n3. المدة والتجديد\n3.1 المدة الأولية اثنا عشر (12) شهراً من تاريخ السريان.\n3.2 تتجدد هذه الاتفاقية تلقائياً لمدد متعاقبة قوامها اثنا عشر (12) شهراً، ما لم يوجه أي من الطرفين إشعاراً خطياً بعدم التجديد قبل نهاية المدة الجارية بما لا يقل عن تسعين (90) يوماً.\n3.3 تُحدَّد رسوم كل مدة تجديد وفقاً لقائمة أسعار المزوّد السارية حينئذ. وللمزوّد أن يزيد الرسوم عند التجديد دون قيد.\n\n5. الرسوم\n5.2 جميع الرسوم غير قابلة للاسترداد وتُدفع سنوياً مقدماً. ولا يُمنح أي رصيد عن اشتراكات غير مستخدمة أو أشهر جزئية.\n5.4 يجوز إضافة اشتراكات خلال المدة بالسعر الساري حينئذ، وتنتهي مع المدة الجارية. ولا يجوز تخفيض عدد الاشتراكات خلال المدة.\n\n8. التعليق\n8.1 للمزوّد تعليق الوصول إذا بقيت أي فاتورة غير مسددة لمدة ثلاثين (30) يوماً، ولا يُسأل عن أي خسارة تنشأ عن ذلك التعليق.\n\n11. البيانات عند الإنهاء\n11.2 يتيح المزوّد بيانات العميل للتصدير لمدة ثلاثين (30) يوماً بعد الإنهاء، وبعدها يجوز حذفها. ويتم التصدير بصيغة المزوّد القياسية. أما المساعدة في الترحيل فتُحتسب وفق أسعار الخدمات المهنية لدى المزوّد.\n\n14. أحكام عامة\n14.3 للمزوّد تعديل هذه الشروط بإشعار مدته ثلاثون (30) يوماً. ويُعد استمرار استخدام الخدمة بعد تاريخ سريان أي تعديل قبولاً به.",
    cd_your_situation: "ما أخبرتنا به",
    cd_chars_analyzed: "تم تحليل {{count}} حرفًا",
    cd_title: "Contract Decoder",
    cd_tagline: "الصق أي عقد — واعرف بالضبط ما الذي توقّع عليه.",
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
    cd_uploaded_file: "Arquivo carregado",
    cd_wait_body: "Um contrato longo pode demorar dois minutos ou mais. Deixa isto aberto — aparece aqui quando estiver pronto.",
    cd_wait_title: "A ler o contrato",
    cd_upload: "Carregar um arquivo",
    cd_upload_hint: "PDF ou texto · ou cola abaixo",
    cd_remove_file: "Remover",
    cd_err_too_large: "Esse arquivo tem mais de 10 MB — cole o texto.",
    cd_err_read: "Não foi possível ler o arquivo. Tente colar o texto.",
    cd_tagline2: "Entenda o que você está aceitando antes de assinar.",
    cd_juris_label: "Onde se aplica este contrato?",
    cd_optional: "(opcional)",
    cd_juris_ph: "País e estado/província, se souberes",
    cd_juris_hint: "Usa a jurisdição que o contrato indicar, se indicar alguma.",
    cd_situation: "A tua situação",
    cd_situation_ph: "ex.: 'sou freelancer a assinar um projeto de 3 meses' ou 'é o meu primeiro arrendamento'",
    cd_reviewed: "📝 Contrato analisado",
    cd_overview: "Resumo em linguagem simples",
    cd_terms: "Cláusulas importantes",
    cd_clarify: "Coisas a esclarecer",
    cd_ask: "Pergunta:",
    cd_before_sign: "Antes de assinar",
    cd_contract_language: "Texto do contrato",
    cd_practical_effect: "Efeito prático:",
    cd_question_consider: "Pergunta a considerar:",
    cd_negotiate_this: "Se quiseres negociar isto",
    cd_example2_context: "Usamos este software de agendamento em toda a empresa. Chegou a fatura de renovação e está 40% acima do ano passado. Estou tentando entender se estamos presos.",
    cd_example3_context: "Vou assinar um contrato de aluguel de um ano na semana que vem. O proprietário mandou o contrato em PDF e quer de volta até sexta.",
    cd_example4_context: "Recebi uma proposta de emprego por escrito e tenho três dias para assinar. Tem uma cláusula de não concorrência que não entendo totalmente.",
    cd_example5_context: "Uma startup quer que eu assine isto antes mesmo de discutir uma possível vaga como contratado.",
    cd_example3_contract: "CONTRATO DE ARRENDAMENTO RESIDENCIAL (EXTRATO)\n\n4. CAUÇÃO\n4.1 O Locatário pagará uma caução equivalente a dois (2) meses de aluguel, reembolsável em até quarenta e cinco (45) dias após a desocupação, deduzidos danos além do desgaste normal, conforme determinado exclusivamente pelo Locador.\n\n7. MANUTENÇÃO\n7.2 O Locatário é responsável por todos os reparos abaixo de 150 por ocorrência. O Locador só é responsável por reparos estruturais.\n\n9. RESCISÃO ANTECIPADA\n9.1 O Locatário não poderá rescindir este Contrato antes do fim do Prazo. Qualquer saída antecipada implica a perda total da Caução e obriga o Locatário a pagar o aluguel até o que ocorrer primeiro entre (i) o fim do Prazo, ou (ii) a ocupação por um novo locatário, sem qualquer obrigação do Locador de buscar ativamente um substituto.\n\n12. ACESSO\n12.1 O Locador poderá acessar o imóvel com aviso prévio de vinte e quatro (24) horas para qualquer finalidade, ou sem aviso em caso de emergência, conforme determinado pelo Locador.\n\n15. TAXAS\n15.3 O aluguel não recebido até o dia 3 do mês gera multa de atraso de 75 mais 10 por dia adicional.",
    cd_example4_contract: "CARTA DE OFERTA (EXTRATO)\n\n4. CLÁUSULAS RESTRITIVAS\n4.1 Por um período de dezoito (18) meses após o término do vínculo por qualquer motivo, o Empregado não prestará, direta ou indiretamente, serviços a nenhum negócio que concorra com a Empresa em qualquer lugar dos Estados Unidos.\n4.2 O Empregado cede à Empresa todas as invenções, obras e ideias concebidas durante o vínculo, relacionadas ou não à atividade da Empresa, criadas em horário de trabalho ou pessoal.\n4.3 Durante o vínculo e por doze (12) meses depois, o Empregado não aliciará nenhum funcionário ou prestador da Empresa para deixá-la.\n\n6. VÍNCULO A TÍTULO PRECÁRIO\n6.1 O vínculo é a título precário e pode ser encerrado por qualquer das partes a qualquer momento, com ou sem motivo, com ou sem aviso prévio.\n\n8. ARBITRAGEM\n8.1 Qualquer disputa decorrente desta oferta ou do vínculo do Empregado será resolvida exclusivamente por arbitragem vinculante; o Empregado renuncia ao direito a julgamento por júri e a participar de qualquer ação coletiva.",
    cd_example5_contract: "ACORDO MÚTUO DE CONFIDENCIALIDADE (EXTRATO)\n\n2. INFORMAÇÕES CONFIDENCIAIS\n2.1 \"Informações Confidenciais\" incluem qualquer informação divulgada por qualquer das partes, marcada como confidencial ou não, incluindo planos de negócio, dados financeiros e o próprio fato de que as conversas estão ocorrendo.\n\n5. VIGÊNCIA\n5.1 Este Acordo permanece em vigor por três (3) anos a partir da Data de Vigência. As obrigações de confidencialidade sobrevivem indefinidamente para qualquer informação que constitua segredo comercial.\n\n6. AUSÊNCIA DE OBRIGAÇÃO\n6.1 Nada neste Acordo obriga qualquer das partes a divulgar qualquer informação, celebrar qualquer acordo adicional ou prosseguir com qualquer transação.\n\n8. RECURSOS\n8.1 As partes concordam que uma violação deste Acordo causaria dano irreparável para o qual indenizações monetárias seriam insuficientes, e a parte não infratora terá direito a medida cautelar sem necessidade de caução.\n\n9. AUSÊNCIA DE LICENÇA\n9.1 Nada neste Acordo concede, por implicação ou de outra forma, qualquer licença ou outro direito sobre as Informações Confidenciais divulgadas.",
    cd_example2_contract: "CONTRATO-QUADRO DE SUBSCRIÇÃO (EXCERTO)\n\n3. PRAZO E RENOVAÇÃO\n3.1 O Prazo Inicial é de doze (12) meses a contar da Data de Produção de Efeitos.\n3.2 O presente Contrato renova-se automaticamente por períodos sucessivos de doze (12) meses, salvo se qualquer das partes comunicar por escrito a não renovação com, pelo menos, noventa (90) dias de antecedência relativamente ao termo do prazo em curso.\n3.3 As taxas de cada renovação serão as constantes da tabela de preços do Fornecedor então em vigor. O Fornecedor pode aumentar as taxas na renovação sem qualquer limite.\n\n5. TAXAS\n5.2 Todas as taxas são não reembolsáveis e pagas anualmente e antecipadamente. Não é concedido crédito por Subscrições não utilizadas nem por meses parciais.\n5.4 Podem ser acrescentadas Subscrições durante o prazo à taxa então em vigor, terminando em simultâneo com o prazo em curso. Não é possível reduzir Subscrições durante o prazo.\n\n8. SUSPENSÃO\n8.1 O Fornecedor pode suspender o acesso caso alguma fatura permaneça por liquidar durante trinta (30) dias, não respondendo por qualquer prejuízo decorrente dessa suspensão.\n\n11. DADOS EM CASO DE CESSAÇÃO\n11.2 O Fornecedor disponibiliza os Dados do Cliente para exportação durante trinta (30) dias após a cessação, findos os quais podem ser eliminados. A exportação é feita no formato-padrão do Fornecedor. O apoio à migração é faturado às tarifas de serviços profissionais do Fornecedor.\n\n14. DISPOSIÇÕES GERAIS\n14.3 O Fornecedor pode alterar estas condições mediante aviso de trinta (30) dias. A continuação da utilização do Serviço após a data de produção de efeitos de qualquer alteração constitui aceitação.",
    cd_your_situation: "O que você nos contou",
    cd_chars_analyzed: "{{count}} caracteres analisados",
    cd_title: "Contract Decoder",
    cd_tagline: "Cole qualquer contrato — saiba exatamente o que está assinando.",
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
    cd_uploaded_file: "Fichier importé",
    cd_wait_body: "Un contrat long peut prendre deux minutes ou plus. Laissez cette page ouverte : le résultat s'affichera ici.",
    cd_wait_title: "Lecture du contrat",
    cd_upload: "Importer un fichier",
    cd_upload_hint: "PDF ou texte · ou collez ci-dessous",
    cd_remove_file: "Retirer",
    cd_err_too_large: "Ce fichier dépasse 10 Mo — collez plutôt le texte.",
    cd_err_read: "Impossible de lire ce fichier. Essayez de coller le texte.",
    cd_tagline2: "Comprenez ce que vous acceptez avant de signer.",
    cd_juris_label: "Où ce contrat s'applique-t-il ?",
    cd_optional: "(facultatif)",
    cd_juris_ph: "Pays et région ou province, si vous le savez",
    cd_juris_hint: "Utilisez le droit applicable indiqué par le contrat, s'il en indique un.",
    cd_situation: "Votre situation",
    cd_situation_ph: "ex. : « je suis freelance et je signe un projet de 3 mois » ou « c'est mon premier bail »",
    cd_reviewed: "📝 Contrat examiné",
    cd_overview: "Résumé en langage clair",
    cd_terms: "Clauses importantes",
    cd_clarify: "Points à clarifier",
    cd_ask: "Demandez :",
    cd_before_sign: "Avant de signer",
    cd_contract_language: "Texte du contrat",
    cd_practical_effect: "Effet concret :",
    cd_question_consider: "Question à poser :",
    cd_negotiate_this: "Si vous voulez négocier ce point",
    cd_example2_context: "Nous utilisons ce logiciel de planification dans toute l'entreprise. La facture de renouvellement est arrivée, 40 % plus élevée que l'an dernier. J'essaie de savoir si nous sommes engagés.",
    cd_example3_context: "Je signe un bail d'un an la semaine prochaine. Le propriétaire a envoyé le bail en PDF et le veut signé d'ici vendredi.",
    cd_example4_context: "J'ai reçu une offre d'emploi écrite et j'ai trois jours pour signer. Il y a une clause de non-concurrence que je ne comprends pas totalement.",
    cd_example5_context: "Une start-up veut que je signe ceci avant même de discuter d'un éventuel poste en contrat avec moi.",
    cd_example3_contract: "CONTRAT DE BAIL D'HABITATION (EXTRAIT)\n\n4. DÉPÔT DE GARANTIE\n4.1 Le Locataire versera un dépôt de garantie équivalent à deux (2) mois de loyer, remboursable dans les quarante-cinq (45) jours suivant le départ, déduction faite des dommages excédant l'usure normale, tels que déterminés uniquement par le Bailleur.\n\n7. ENTRETIEN\n7.2 Le Locataire est responsable de toutes les réparations inférieures à 150 par incident. Le Bailleur n'est responsable que des réparations structurelles.\n\n9. RÉSILIATION ANTICIPÉE\n9.1 Le Locataire ne peut résilier ce Contrat avant la fin de la Durée. Tout départ anticipé entraîne la perte totale du Dépôt de Garantie et oblige le Locataire à payer le loyer jusqu'à la première des deux échéances suivantes : (a) la fin de la Durée, ou (b) l'occupation par un nouveau locataire, le Bailleur n'ayant aucune obligation de rechercher activement un remplaçant.\n\n12. ACCÈS\n12.1 Le Bailleur peut accéder au logement moyennant un préavis de vingt-quatre (24) heures pour quelque motif que ce soit, ou sans préavis en cas d'urgence telle que déterminée par le Bailleur.\n\n15. FRAIS\n15.3 Tout loyer non reçu avant le 3 du mois entraîne des frais de retard de 75 plus 10 par jour supplémentaire.",
    cd_example4_contract: "LETTRE D'OFFRE (EXTRAIT)\n\n4. ENGAGEMENTS RESTRICTIFS\n4.1 Pendant une période de dix-huit (18) mois suivant la fin de l'emploi pour quelque motif que ce soit, l'Employé ne fournira, directement ou indirectement, aucun service à une entreprise concurrente de la Société où que ce soit aux États-Unis.\n4.2 L'Employé cède à la Société toutes les inventions, œuvres et idées conçues pendant l'emploi, qu'elles soient ou non liées à l'activité de la Société, qu'elles aient été créées pendant le temps de travail ou le temps personnel.\n4.3 Pendant l'emploi et pendant douze (12) mois après, l'Employé ne sollicitera aucun employé ou prestataire de la Société pour qu'il quitte celle-ci.\n\n6. EMPLOI À VOLONTÉ\n6.1 L'emploi est à volonté et peut être résilié par l'une ou l'autre partie à tout moment, avec ou sans motif, avec ou sans préavis.\n\n8. ARBITRAGE\n8.1 Tout litige découlant de cette offre ou de l'emploi de l'Employé sera résolu exclusivement par arbitrage contraignant ; l'Employé renonce au droit à un procès devant jury et à participer à toute action collective.",
    cd_example5_contract: "ACCORD DE CONFIDENTIALITÉ MUTUEL (EXTRAIT)\n\n2. INFORMATIONS CONFIDENTIELLES\n2.1 Les « Informations Confidentielles » comprennent toute information divulguée par l'une ou l'autre partie, qu'elle soit ou non marquée comme confidentielle, y compris les plans d'affaires, les données financières et le fait même que des discussions sont en cours.\n\n5. DURÉE\n5.1 Le présent Accord reste en vigueur pendant trois (3) ans à compter de la Date d'Effet. Les obligations de confidentialité survivent indéfiniment après la résiliation pour toute information constituant un secret commercial.\n\n6. ABSENCE D'OBLIGATION\n6.1 Rien dans le présent Accord n'oblige l'une ou l'autre partie à divulguer une quelconque information, à conclure un accord ultérieur, ou à poursuivre une quelconque transaction.\n\n8. RECOURS\n8.1 Les parties conviennent qu'une violation du présent Accord causerait un préjudice irréparable pour lequel des dommages-intérêts seraient insuffisants, et la partie non défaillante aura droit à une mesure injonctive sans avoir à constituer de caution.\n\n9. ABSENCE DE LICENCE\n9.1 Rien dans le présent Accord n'accorde, implicitement ou autrement, de licence ou autre droit sur les Informations Confidentielles divulguées.",
    cd_example2_contract: "CONTRAT-CADRE D'ABONNEMENT (EXTRAIT)\n\n3. DURÉE ET RECONDUCTION\n3.1 La Durée Initiale est de douze (12) mois à compter de la Date d'Effet.\n3.2 Le présent Contrat est reconduit automatiquement par périodes successives de douze (12) mois, sauf si l'une des parties notifie par écrit son intention de ne pas reconduire au moins quatre-vingt-dix (90) jours avant la fin de la période en cours.\n3.3 Les tarifs de chaque reconduction sont ceux du tarif alors en vigueur du Prestataire. Le Prestataire peut augmenter les tarifs lors de la reconduction sans limitation.\n\n5. TARIFS\n5.2 Tous les tarifs sont non remboursables et payables annuellement d'avance. Aucun avoir n'est accordé pour les Abonnements non utilisés ni pour les mois entamés.\n5.4 Des Abonnements peuvent être ajoutés en cours de période au tarif alors en vigueur, avec échéance alignée sur la période en cours. Les Abonnements ne peuvent pas être réduits en cours de période.\n\n8. SUSPENSION\n8.1 Le Prestataire peut suspendre l'accès si une facture demeure impayée pendant trente (30) jours, sans être responsable des pertes résultant de cette suspension.\n\n11. DONNÉES EN CAS DE RÉSILIATION\n11.2 Le Prestataire met les Données Client à disposition pour export pendant trente (30) jours après la résiliation, après quoi elles peuvent être supprimées. L'export est fourni au format standard du Prestataire. L'assistance à la migration est facturée aux tarifs de services professionnels du Prestataire.\n\n14. GÉNÉRALITÉS\n14.3 Le Prestataire peut modifier les présentes conditions moyennant un préavis de trente (30) jours. La poursuite de l'utilisation du Service après la date d'effet d'une modification vaut acceptation.",
    cd_your_situation: "Ce que vous nous avez dit",
    cd_chars_analyzed: "{{count}} caractères analysés",
    cd_title: "Contract Decoder",
    cd_tagline: "Collez n'importe quel contrat — sachez exactement ce que vous signez.",
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
    cd_uploaded_file: "Hochgeladene Datei",
    cd_wait_body: "Ein langer Vertrag kann zwei Minuten oder länger dauern. Lass die Seite offen — das Ergebnis erscheint hier.",
    cd_wait_title: "Der Vertrag wird gelesen",
    cd_upload: "Datei hochladen",
    cd_upload_hint: "PDF oder Text · oder unten einfügen",
    cd_remove_file: "Entfernen",
    cd_err_too_large: "Die Datei ist größer als 10 MB — füge stattdessen den Text ein.",
    cd_err_read: "Datei konnte nicht gelesen werden. Versuch es mit eingefügtem Text.",
    cd_tagline2: "Versteh, worauf du dich einlässt, bevor du unterschreibst.",
    cd_juris_label: "Wo gilt dieser Vertrag?",
    cd_optional: "(optional)",
    cd_juris_ph: "Land und Bundesland bzw. Kanton, falls bekannt",
    cd_juris_hint: "Nimm den im Vertrag genannten Gerichtsstand, falls einer genannt ist.",
    cd_situation: "Deine Situation",
    cd_situation_ph: "z. B.: 'ich bin freiberuflich und unterschreibe ein Projekt über 3 Monate' oder 'das ist mein erster Mietvertrag'",
    cd_reviewed: "📝 Vertrag geprüft",
    cd_overview: "Überblick in einfacher Sprache",
    cd_terms: "Wichtige Klauseln",
    cd_clarify: "Was zu klären ist",
    cd_ask: "Frag:",
    cd_before_sign: "Vor dem Unterschreiben",
    cd_contract_language: "Vertragstext",
    cd_practical_effect: "Praktische Folge:",
    cd_question_consider: "Frage, die sich lohnt:",
    cd_negotiate_this: "Wenn du darüber verhandeln willst",
    cd_example2_context: "Wir setzen diese Planungssoftware firmenweit ein. Die Verlängerungsrechnung ist da und liegt 40 % über dem Vorjahr. Ich versuche herauszufinden, ob wir gebunden sind.",
    cd_example3_context: "Ich unterschreibe nächste Woche einen Einjahresmietvertrag. Der Vermieter hat den Vertrag als PDF geschickt und will ihn bis Freitag zurück.",
    cd_example4_context: "Ich habe ein schriftliches Jobangebot bekommen und drei Tage Zeit zu unterschreiben. Es gibt eine Wettbewerbsverbotsklausel, die ich nicht ganz verstehe.",
    cd_example5_context: "Ein Start-up will, dass ich das unterschreibe, bevor sie überhaupt über eine mögliche Vertragsrolle mit mir sprechen.",
    cd_example3_contract: "WOHNRAUMMIETVERTRAG (AUSZUG)\n\n4. KAUTION\n4.1 Der Mieter zahlt eine Kaution in Höhe von zwei (2) Monatsmieten, rückzahlbar innerhalb von fünfundvierzig (45) Tagen nach Auszug, abzüglich Abzügen für Schäden, die über die normale Abnutzung hinausgehen, wie vom Vermieter allein festgestellt.\n\n7. INSTANDHALTUNG\n7.2 Der Mieter ist für alle Reparaturen unter 150 pro Vorfall verantwortlich. Der Vermieter ist nur für strukturelle Reparaturen verantwortlich.\n\n9. VORZEITIGE KÜNDIGUNG\n9.1 Der Mieter kann diesen Vertrag nicht vor Ende der Laufzeit kündigen. Ein vorzeitiger Auszug führt zum vollständigen Verfall der Kaution und verpflichtet den Mieter zur Mietzahlung bis zum früheren der folgenden Ereignisse: (a) Ende der Laufzeit oder (b) Einzug eines neuen Mieters, wobei der Vermieter nicht verpflichtet ist, aktiv nach einem Ersatzmieter zu suchen.\n\n12. ZUTRITT\n12.1 Der Vermieter darf die Wohnung mit vierundzwanzig (24) Stunden Vorankündigung zu jedem Zweck betreten, oder ohne Ankündigung im Notfall, wie vom Vermieter festgestellt.\n\n15. GEBÜHREN\n15.3 Nicht bis zum 3. des Monats eingegangene Miete löst eine Verzugsgebühr von 75 zuzüglich 10 pro weiterem Tag aus.",
    cd_example4_contract: "ANGEBOTSSCHREIBEN (AUSZUG)\n\n4. WETTBEWERBSVERBOTE\n4.1 Für einen Zeitraum von achtzehn (18) Monaten nach Beendigung des Arbeitsverhältnisses aus welchem Grund auch immer darf der Arbeitnehmer weder direkt noch indirekt Dienstleistungen für ein mit dem Unternehmen konkurrierendes Unternehmen an irgendeinem Ort in den Vereinigten Staaten erbringen.\n4.2 Der Arbeitnehmer überträgt dem Unternehmen alle während des Arbeitsverhältnisses entwickelten Erfindungen, Werke und Ideen, unabhängig davon, ob sie mit der Geschäftstätigkeit des Unternehmens zusammenhängen oder in der Arbeitszeit oder privat entstanden sind.\n4.3 Während des Arbeitsverhältnisses und zwölf (12) Monate danach darf der Arbeitnehmer keinen Mitarbeiter oder Auftragnehmer des Unternehmens abwerben.\n\n6. FREIES ARBEITSVERHÄLTNIS\n6.1 Das Arbeitsverhältnis ist frei kündbar und kann von beiden Parteien jederzeit, mit oder ohne Grund, mit oder ohne Vorankündigung beendet werden.\n\n8. SCHIEDSVERFAHREN\n8.1 Jede Streitigkeit aus diesem Angebot oder dem Arbeitsverhältnis des Arbeitnehmers wird ausschließlich durch bindendes Schiedsverfahren beigelegt; der Arbeitnehmer verzichtet auf das Recht auf ein Geschworenenverfahren und auf die Teilnahme an einer Sammelklage.",
    cd_example5_contract: "GEGENSEITIGE GEHEIMHALTUNGSVEREINBARUNG (AUSZUG)\n\n2. VERTRAULICHE INFORMATIONEN\n2.1 „Vertrauliche Informationen“ umfassen alle von einer der Parteien offengelegten Informationen, unabhängig davon, ob sie als vertraulich gekennzeichnet sind, einschließlich Geschäftspläne, Finanzdaten und die bloße Tatsache, dass Gespräche stattfinden.\n\n5. LAUFZEIT\n5.1 Diese Vereinbarung bleibt drei (3) Jahre ab dem Wirksamkeitsdatum in Kraft. Die Geheimhaltungspflichten bestehen nach Beendigung zeitlich unbegrenzt für alle Informationen fort, die ein Geschäftsgeheimnis darstellen.\n\n6. KEINE VERPFLICHTUNG\n6.1 Nichts in dieser Vereinbarung verpflichtet eine der Parteien, Informationen offenzulegen, eine weitere Vereinbarung einzugehen oder eine Transaktion fortzusetzen.\n\n8. RECHTSBEHELFE\n8.1 Die Parteien sind sich einig, dass ein Verstoß gegen diese Vereinbarung einen nicht wiedergutzumachenden Schaden verursachen würde, für den Schadensersatz in Geld unzureichend wäre, und die nicht verletzende Partei Anspruch auf einstweiligen Rechtsschutz hat, ohne eine Sicherheitsleistung erbringen zu müssen.\n\n9. KEINE LIZENZ\n9.1 Diese Vereinbarung gewährt weder ausdrücklich noch stillschweigend eine Lizenz oder ein sonstiges Recht an den offengelegten vertraulichen Informationen.",
    cd_example2_contract: "RAHMENVERTRAG ÜBER ABONNEMENTS (AUSZUG)\n\n3. LAUFZEIT UND VERLÄNGERUNG\n3.1 Die Erstlaufzeit beträgt zwölf (12) Monate ab dem Wirksamkeitsdatum.\n3.2 Dieser Vertrag verlängert sich automatisch um jeweils zwölf (12) Monate, sofern nicht eine Partei spätestens neunzig (90) Tage vor Ablauf der jeweils laufenden Laufzeit schriftlich der Verlängerung widerspricht.\n3.3 Die Entgelte für jede Verlängerungslaufzeit richten sich nach der dann gültigen Preisliste des Anbieters. Der Anbieter kann die Entgelte zur Verlängerung ohne Begrenzung erhöhen.\n\n5. ENTGELTE\n5.2 Sämtliche Entgelte sind nicht erstattungsfähig und jährlich im Voraus zahlbar. Für ungenutzte Lizenzen oder angebrochene Monate wird keine Gutschrift erteilt.\n5.4 Während der Laufzeit können Lizenzen zum dann gültigen Satz hinzugebucht werden; sie enden zusammen mit der laufenden Laufzeit. Eine Reduzierung während der Laufzeit ist ausgeschlossen.\n\n8. SPERRUNG\n8.1 Der Anbieter kann den Zugang sperren, wenn eine Rechnung dreißig (30) Tage unbeglichen bleibt, und haftet nicht für Schäden aus einer solchen Sperrung.\n\n11. DATEN BEI VERTRAGSENDE\n11.2 Der Anbieter stellt die Kundendaten nach Vertragsende dreißig (30) Tage lang zum Export bereit; danach dürfen sie gelöscht werden. Der Export erfolgt im Standardformat des Anbieters. Unterstützung bei der Migration wird zu den Sätzen für professionelle Dienstleistungen berechnet.\n\n14. ALLGEMEINES\n14.3 Der Anbieter kann diese Bedingungen mit einer Frist von dreißig (30) Tagen ändern. Die fortgesetzte Nutzung des Dienstes nach Wirksamwerden einer Änderung gilt als Zustimmung.",
    cd_your_situation: "Was du uns erzählt hast",
    cd_chars_analyzed: "{{count}} Zeichen analysiert",
    cd_title: "Contract Decoder",
    cd_tagline: "Füge einen beliebigen Vertrag ein — und wisse genau, was du unterschreibst.",
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
    cd_uploaded_file: "アップロードしたファイル",
    cd_wait_body: "長い契約書では2分以上かかることがあります。このページは開いたままに——できあがるとここに表示されます。",
    cd_wait_title: "契約書を読んでいます",
    cd_upload: "ファイルをアップロード",
    cd_upload_hint: "PDF またはテキスト · 下に貼り付けても構いません",
    cd_remove_file: "削除",
    cd_err_too_large: "ファイルが 10 MB を超えています。テキストを貼り付けてください。",
    cd_err_read: "ファイルを読み取れませんでした。テキストを貼り付けてみてください。",
    cd_tagline2: "署名する前に、何に同意するのかを理解しましょう。",
    cd_juris_label: "この契約はどこで適用されますか？",
    cd_optional: "（任意）",
    cd_juris_ph: "国と州・県（わかる範囲で）",
    cd_juris_hint: "契約書に準拠地の記載があれば、それを使ってください。",
    cd_situation: "状況",
    cd_situation_ph: "例：フリーランスで3か月のプロジェクトに署名する／初めての賃貸契約です",
    cd_reviewed: "📝 契約書を確認しました",
    cd_overview: "平易な言葉での概要",
    cd_terms: "重要な条項",
    cd_clarify: "確認しておきたいこと",
    cd_ask: "こう聞く：",
    cd_before_sign: "署名する前に",
    cd_contract_language: "契約書の文言",
    cd_practical_effect: "実際の影響：",
    cd_question_consider: "検討したい質問：",
    cd_negotiate_this: "この条項を交渉したい場合",
    cd_example2_context: "この勤務シフト管理ソフトを全社で使っています。更新の請求書が届き、昨年より40%高くなっていました。契約に縛られているのかを確かめたいです。",
    cd_example3_context: "来週、1年間のアパート賃貸契約にサインする予定です。大家がPDFで契約書を送ってきて、金曜までに返送してほしいとのことです。",
    cd_example4_context: "新しい仕事の書面オファーをもらい、サインまで3日あります。よく理解できていない競業避止条項があります。",
    cd_example5_context: "スタートアップが、契約社員としての話をする前にこれにサインしてほしいと言っています。",
    cd_example3_contract: "住宅賃貸借契約書（抜粋）\n\n第4条 敷金\n4.1 賃借人は家賃2（2）か月分に相当する敷金を支払うものとし、退去後四十五（45）日以内に、通常損耗を超える損傷分を賃貸人の判断のみにより差し引いた上で返還する。\n\n第7条 維持管理\n7.2 一件あたり150未満の修繕については賃借人が負担する。賃貸人は構造上の修繕についてのみ責任を負う。\n\n第9条 中途解約\n9.1 賃借人は契約期間満了前に本契約を解約することはできない。中途で退去した場合、敷金の全額を没収するとともに、（a）契約期間の終了、または（b）新たな賃借人の入居のいずれか早い時点まで家賃を支払う義務を負うものとし、賃貸人は代わりの賃借人を積極的に探す義務を負わない。\n\n第12条 立入り\n12.1 賃貸人は、いかなる目的であっても二十四（24）時間前の通知により、または賃貸人が緊急事態と判断した場合には通知なく、物件に立ち入ることができる。\n\n第15条 諸費用\n15.3 当月3日までに受領されない家賃には、延滞料75、以降1日ごとに10を加算する。",
    cd_example4_contract: "オファーレター（抜粋）\n\n第4条 制限条項\n4.1 理由の如何を問わず雇用終了後十八（18）か月間、従業員は米国内のいかなる場所であれ、直接または間接を問わず、当社と競合する事業にサービスを提供してはならない。\n4.2 従業員は、雇用期間中に着想したすべての発明、著作物およびアイデアを、当社の事業に関連するか否か、また就業時間中か個人の時間中に生まれたかを問わず、当社に譲渡する。\n4.3 雇用期間中および終了後十二（12）か月間、従業員は当社の従業員または契約社員に対し、退職を勧誘してはならない。\n\n第6条 任意雇用\n6.1 雇用は任意雇用であり、理由の有無、通知の有無にかかわらず、いずれの当事者もいつでも終了させることができる。\n\n第8条 仲裁\n8.1 本オファーまたは従業員の雇用から生じるいかなる紛争も、拘束力のある仲裁によってのみ解決されるものとする。従業員は陪審裁判を受ける権利および集団訴訟に参加する権利を放棄する。",
    cd_example5_contract: "相互秘密保持契約書（抜粋）\n\n第2条 秘密情報\n2.1 「秘密情報」とは、秘密の表示の有無を問わず、いずれかの当事者が開示するあらゆる情報を含み、事業計画、財務情報、および協議自体が行われているという事実を含む。\n\n第5条 有効期間\n5.1 本契約は発効日から三（3）年間有効とする。営業秘密に該当する情報については、契約終了後も秘密保持義務が無期限に存続する。\n\n第6条 義務の不存在\n6.1 本契約のいかなる規定も、いずれの当事者に対しても、情報の開示、さらなる契約の締結、または取引の推進を義務付けるものではない。\n\n第8条 救済\n8.1 両当事者は、本契約の違反が金銭的損害賠償では不十分な回復不能の損害をもたらすことに同意し、違反していない当事者は保証金の提供を要することなく差止め救済を受ける権利を有する。\n\n第9条 ライセンスの不許諾\n9.1 本契約は、開示された秘密情報について、黙示であるか否かを問わず、いかなるライセンスその他の権利も許諾するものではない。",
    cd_example2_contract: "サブスクリプション基本契約（抜粋）\n\n第3条 契約期間および更新\n3.1 当初期間は、発効日から十二（12）か月とする。\n3.2 いずれかの当事者が現行期間の満了の九十（90）日前までに書面で更新しない旨を通知しない限り、本契約は十二（12）か月ごとに自動的に更新されるものとする。\n3.3 各更新期間の料金は、その時点で有効な提供者の価格表による。提供者は、更新時に制限なく料金を引き上げることができる。\n\n第5条 料金\n5.2 料金はいずれも返金不可であり、年額前払とする。未使用のライセンスまたは月途中の期間について、いかなる返戻も行わない。\n5.4 期間中は、その時点の料率でライセンスを追加できるものとし、その満了日は現行期間と同一とする。期間中のライセンス数の減少は認めない。\n\n第8条 利用停止\n8.1 提供者は、請求書が三十（30）日間未払いのまま残る場合、アクセスを停止することができ、当該停止に起因する損害について責任を負わない。\n\n第11条 終了時のデータ\n11.2 提供者は、契約終了後三十（30）日間、顧客データをエクスポート可能な状態で提供し、その後は削除できるものとする。エクスポートは提供者の標準形式による。移行支援は提供者のプロフェッショナルサービス料金にて有償とする。\n\n第14条 一般条項\n14.3 提供者は、三十（30）日前の通知により本条件を変更できる。変更の発効日以降も本サービスの利用を継続した場合、これを承諾したものとみなす。",
    cd_your_situation: "教えてくれたこと",
    cd_chars_analyzed: "{{count}}文字を分析しました",
    cd_title: "Contract Decoder",
    cd_tagline: "どんな契約書でも貼り付けて — 何に署名するのか正確に把握。",
    cd_text_label: "契約書の本文",
    cd_text_ph: "契約書の全文をここに貼り付けてください — 雇用契約、秘密保持契約、賃貸契約、利用規約、業務委託契約など…",
    cd_text_short: "有用な分析のために、契約書をもっと貼り付けてください。",
    cd_context_label: "状況",
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
    cd_uploaded_file: "올린 파일",
    cd_wait_body: "긴 계약서는 2분 이상 걸릴 수 있습니다. 이 화면을 열어 두세요 — 끝나면 여기에 표시됩니다.",
    cd_wait_title: "계약서를 읽는 중",
    cd_upload: "파일 올리기",
    cd_upload_hint: "PDF 또는 텍스트 · 아래에 붙여넣어도 됩니다",
    cd_remove_file: "제거",
    cd_err_too_large: "파일이 10MB를 넘습니다. 텍스트를 붙여넣어 주세요.",
    cd_err_read: "파일을 읽지 못했습니다. 텍스트를 붙여넣어 보세요.",
    cd_tagline2: "서명하기 전에 무엇에 동의하는지 알아두세요.",
    cd_juris_label: "이 계약은 어디에 적용되나요?",
    cd_optional: "(선택)",
    cd_juris_ph: "국가와 주/도, 아는 경우",
    cd_juris_hint: "계약서에 준거지가 적혀 있다면 그걸 쓰세요.",
    cd_situation: "당신의 상황",
    cd_situation_ph: "예: 프리랜서로 3개월 프로젝트에 서명합니다 / 첫 임대차 계약입니다",
    cd_reviewed: "📝 계약서 검토 완료",
    cd_overview: "쉬운 말로 정리",
    cd_terms: "중요 조항",
    cd_clarify: "확인이 필요한 부분",
    cd_ask: "이렇게 물어보세요:",
    cd_before_sign: "서명하기 전에",
    cd_contract_language: "계약서 문구",
    cd_practical_effect: "실제 영향:",
    cd_question_consider: "생각해볼 질문:",
    cd_negotiate_this: "이 조항을 협상하고 싶다면",
    cd_example2_context: "회사 전체가 이 일정 관리 소프트웨어를 씁니다. 갱신 청구서가 왔는데 작년보다 40% 높습니다. 저희가 묶여 있는 건지 확인하려 합니다.",
    cd_example3_context: "다음 주에 1년짜리 아파트 임대차 계약서에 서명할 예정입니다. 집주인이 PDF로 계약서를 보냈고 금요일까지 회신을 원합니다.",
    cd_example4_context: "새 직장의 서면 오퍼를 받았고 서명까지 3일이 있습니다. 완전히 이해되지 않는 경업금지 조항이 있습니다.",
    cd_example5_context: "한 스타트업이 계약직 역할을 논의하기도 전에 이것부터 서명하라고 합니다.",
    cd_example3_contract: "주거 임대차 계약서(발췌)\n\n제4조 보증금\n4.1 임차인은 임대료 2(2)개월분에 해당하는 보증금을 지급하며, 퇴거 후 사십오(45)일 이내에 통상적인 마모를 초과하는 손상 공제분을 뺀 나머지를 반환한다. 손상 여부는 임대인이 단독으로 판단한다.\n\n제7조 유지보수\n7.2 건당 150 미만의 모든 수리는 임차인이 부담한다. 임대인은 구조적 수리에 대해서만 책임을 진다.\n\n제9조 중도 해지\n9.1 임차인은 계약 기간이 끝나기 전에 이 계약을 해지할 수 없다. 중도 퇴거 시 보증금 전액을 몰수하며, (a) 계약 기간 종료 또는 (b) 새 임차인의 입주 중 먼저 도래하는 시점까지 임차인은 임대료를 지급할 의무를 지며, 임대인은 대체 임차인을 적극적으로 구할 의무가 없다.\n\n제12조 출입\n12.1 임대인은 어떤 목적으로든 이십사(24)시간 전 통지 후 임대 공간에 출입할 수 있으며, 임대인이 판단한 긴급 상황에서는 통지 없이 출입할 수 있다.\n\n제15조 수수료\n15.3 매월 3일까지 지급되지 않은 임대료에는 연체료 75와 이후 1일당 10이 추가된다.",
    cd_example4_contract: "오퍼레터(발췌)\n\n제4조 제한 조항\n4.1 사유를 불문하고 고용 종료 후 십팔(18)개월 동안, 직원은 미국 내 어느 곳에서든 회사와 경쟁하는 사업체에 직접 또는 간접적으로 서비스를 제공해서는 안 된다.\n4.2 직원은 재직 중 구상한 모든 발명, 저작물 및 아이디어를 회사 업무와 관련이 있든 없든, 근무 시간 중이든 개인 시간 중이든 회사에 양도한다.\n4.3 재직 중 및 종료 후 십이(12)개월 동안, 직원은 회사 직원이나 계약자를 회사에서 떠나도록 권유해서는 안 된다.\n\n제6조 임의 고용\n6.1 고용은 임의 고용이며, 사유의 유무 및 사전 통지 여부와 관계없이 어느 당사자든 언제든지 종료할 수 있다.\n\n제8조 중재\n8.1 이 오퍼 또는 직원의 고용에서 발생하는 모든 분쟁은 오로지 구속력 있는 중재를 통해서만 해결한다. 직원은 배심 재판을 받을 권리와 집단소송에 참여할 권리를 포기한다.",
    cd_example5_contract: "상호 비밀유지계약서(발췌)\n\n제2조 기밀정보\n2.1 \"기밀정보\"란 기밀 표시 여부와 관계없이 어느 당사자가 공개한 모든 정보를 포함하며, 사업 계획, 재무 정보, 그리고 논의가 진행되고 있다는 사실 자체를 포함한다.\n\n제5조 기간\n5.1 본 계약은 발효일로부터 삼(3)년간 유효하다. 영업비밀에 해당하는 정보에 대한 비밀유지 의무는 계약 종료 후에도 무기한 존속한다.\n\n제6조 의무 없음\n6.1 본 계약의 어떠한 내용도 당사자에게 정보를 공개하거나, 추가 계약을 체결하거나, 거래를 진행할 의무를 부과하지 않는다.\n\n제8조 구제수단\n8.1 당사자들은 본 계약 위반이 금전적 손해배상으로는 충분하지 않은 회복 불가능한 손해를 초래한다는 데 동의하며, 위반하지 않은 당사자는 보증금 제공 없이 금지명령 구제를 받을 권리가 있다.\n\n제9조 라이선스 부재\n9.1 본 계약은 공개된 기밀정보에 대해 묵시적으로든 그 밖의 방식으로든 어떠한 라이선스나 기타 권리도 부여하지 않는다.",
    cd_example2_contract: "기본 구독 계약서(발췌)\n\n3. 기간 및 갱신\n3.1 최초 기간은 효력발생일로부터 십이(12)개월로 한다.\n3.2 어느 일방이 현재 기간 종료일로부터 최소 구십(90)일 전까지 서면으로 갱신하지 아니한다는 통지를 하지 않는 한, 본 계약은 십이(12)개월 단위로 자동 갱신된다.\n3.3 각 갱신 기간의 요금은 그 시점에 유효한 공급자의 가격표에 따른다. 공급자는 갱신 시 제한 없이 요금을 인상할 수 있다.\n\n5. 요금\n5.2 모든 요금은 환불되지 아니하며 연 단위 선불로 지급한다. 미사용 라이선스 또는 잔여 월분에 대하여는 어떠한 크레딧도 제공하지 아니한다.\n5.4 기간 중에는 그 시점의 요율로 라이선스를 추가할 수 있으며, 그 만료일은 현재 기간과 동일하다. 기간 중 라이선스 수의 감축은 허용되지 아니한다.\n\n8. 이용정지\n8.1 공급자는 어떠한 청구서가 삼십(30)일간 미납 상태로 남는 경우 접근을 정지할 수 있으며, 그로 인해 발생하는 손해에 대하여 책임을 지지 아니한다.\n\n11. 계약 종료 시 데이터\n11.2 공급자는 계약 종료 후 삼십(30)일간 고객 데이터를 내보낼 수 있도록 제공하며, 그 이후에는 삭제할 수 있다. 내보내기는 공급자의 표준 형식으로 제공된다. 이관 지원은 공급자의 전문 서비스 요율에 따라 유상으로 한다.\n\n14. 일반\n14.3 공급자는 삼십(30)일 전 통지로 본 약관을 변경할 수 있다. 변경 효력 발생일 이후에도 서비스를 계속 이용하는 것은 이에 대한 승낙으로 본다.",
    cd_your_situation: "알려주신 내용",
    cd_chars_analyzed: "{{count}}자 분석됨",
    cd_title: "Contract Decoder",
    cd_tagline: "어떤 계약서든 붙여넣으세요 — 무엇에 서명하는지 정확히 알 수 있습니다.",
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
    cd_uploaded_file: "Загруженный файл",
    cd_wait_body: "Длинный договор может занять две минуты и больше. Не закрывайте страницу — результат появится здесь.",
    cd_wait_title: "Читаем договор",
    cd_upload: "Загрузить файл",
    cd_upload_hint: "PDF или текст · либо вставьте ниже",
    cd_remove_file: "Убрать",
    cd_err_too_large: "Файл больше 10 МБ — вставьте текст.",
    cd_err_read: "Не удалось прочитать файл. Попробуйте вставить текст.",
    cd_tagline2: "Поймите, с чем соглашаетесь, прежде чем подписать.",
    cd_juris_label: "Где действует этот договор?",
    cd_optional: "(необязательно)",
    cd_juris_ph: "Страна и регион, если известно",
    cd_juris_hint: "Если в договоре указана подсудность, используйте её.",
    cd_situation: "Ваша ситуация",
    cd_situation_ph: "напр.: «я фрилансер и подписываю проект на 3 месяца» или «это мой первый договор аренды»",
    cd_reviewed: "📝 Договор разобран",
    cd_overview: "Обзор простыми словами",
    cd_terms: "Важные условия",
    cd_clarify: "Что стоит уточнить",
    cd_ask: "Спросите:",
    cd_before_sign: "Перед подписанием",
    cd_contract_language: "Текст договора",
    cd_practical_effect: "Практическое последствие:",
    cd_question_consider: "Вопрос, который стоит задать:",
    cd_negotiate_this: "Если хотите это обсудить",
    cd_example2_context: "Мы используем это ПО для планирования по всей компании. Пришёл счёт на продление — на 40% выше прошлогоднего. Пытаюсь понять, связаны ли мы обязательствами.",
    cd_example3_context: "На следующей неделе подписываю годовой договор аренды квартиры. Арендодатель прислал договор в PDF и хочет получить обратно к пятнице.",
    cd_example4_context: "Получил письменное предложение о работе, на подписание три дня. Там есть пункт о неконкуренции, который я не до конца понимаю.",
    cd_example5_context: "Стартап хочет, чтобы я подписал это, прежде чем вообще обсуждать со мной возможную работу по контракту.",
    cd_example3_contract: "ДОГОВОР НАЙМА ЖИЛОГО ПОМЕЩЕНИЯ (ВЫДЕРЖКА)\n\n4. ОБЕСПЕЧИТЕЛЬНЫЙ ПЛАТЁЖ\n4.1 Наниматель уплачивает обеспечительный платёж в размере арендной платы за два (2) месяца, подлежащий возврату в течение сорока пяти (45) дней после выезда за вычетом ущерба сверх нормального износа, определяемого исключительно Наймодателем.\n\n7. ТЕХНИЧЕСКОЕ ОБСЛУЖИВАНИЕ\n7.2 Наниматель несёт ответственность за все ремонты стоимостью менее 150 за случай. Наймодатель отвечает только за конструктивные ремонты.\n\n9. ДОСРОЧНОЕ РАСТОРЖЕНИЕ\n9.1 Наниматель не вправе расторгнуть настоящий Договор до истечения Срока. Любой досрочный выезд влечёт полную утрату обеспечительного платежа и обязывает Нанимателя вносить арендную плату до наступления более раннего из событий: (a) окончания Срока или (b) заселения нового нанимателя, при этом Наймодатель не обязан активно искать замену.\n\n12. ДОСТУП\n12.1 Наймодатель вправе входить в помещение с уведомлением за двадцать четыре (24) часа для любых целей, либо без уведомления в случае чрезвычайной ситуации по усмотрению Наймодателя.\n\n15. СБОРЫ\n15.3 Если арендная плата не получена к 3-му числу месяца, взимается штраф за просрочку в размере 75 плюс 10 за каждый дополнительный день.",
    cd_example4_contract: "ПРЕДЛОЖЕНИЕ О РАБОТЕ (ВЫДЕРЖКА)\n\n4. ОГРАНИЧИТЕЛЬНЫЕ ОБЯЗАТЕЛЬСТВА\n4.1 В течение восемнадцати (18) месяцев после прекращения трудовых отношений по любой причине Работник не вправе прямо или косвенно оказывать услуги какой-либо компании, конкурирующей с Компанией, где бы то ни было на территории США.\n4.2 Работник передаёт Компании все изобретения, произведения и идеи, задуманные во время работы, независимо от того, связаны ли они с деятельностью Компании и созданы ли в рабочее или личное время.\n4.3 Во время работы и в течение двенадцати (12) месяцев после неё Работник не вправе переманивать сотрудников или подрядчиков Компании.\n\n6. РАБОТА ПО СОБСТВЕННОМУ УСМОТРЕНИЮ СТОРОН\n6.1 Трудовые отношения могут быть прекращены любой из сторон в любое время, с указанием причины или без неё, с уведомлением или без уведомления.\n\n8. АРБИТРАЖ\n8.1 Любой спор, возникающий из настоящего предложения или трудовых отношений Работника, разрешается исключительно посредством обязательного арбитража; Работник отказывается от права на суд присяжных и от участия в коллективных исках.",
    cd_example5_contract: "ВЗАИМНОЕ СОГЛАШЕНИЕ О НЕРАЗГЛАШЕНИИ (ВЫДЕРЖКА)\n\n2. КОНФИДЕНЦИАЛЬНАЯ ИНФОРМАЦИЯ\n2.1 «Конфиденциальная информация» включает любую информацию, раскрытую любой из сторон, независимо от наличия пометки о конфиденциальности, включая бизнес-планы, финансовые данные и сам факт ведения переговоров.\n\n5. СРОК ДЕЙСТВИЯ\n5.1 Настоящее Соглашение действует в течение трёх (3) лет с даты вступления в силу. Обязательства о конфиденциальности сохраняются бессрочно после прекращения действия в отношении любой информации, составляющей коммерческую тайну.\n\n6. ОТСУТСТВИЕ ОБЯЗАТЕЛЬСТВ\n6.1 Ничто в настоящем Соглашении не обязывает какую-либо из сторон раскрывать какую-либо информацию, заключать какое-либо дальнейшее соглашение или продолжать какую-либо сделку.\n\n8. СРЕДСТВА ПРАВОВОЙ ЗАЩИТЫ\n8.1 Стороны соглашаются, что нарушение настоящего Соглашения причинит непоправимый вред, для возмещения которого денежная компенсация будет недостаточной, и не нарушившая сторона будет вправе получить судебный запрет без необходимости внесения залога.\n\n9. ОТСУТСТВИЕ ЛИЦЕНЗИИ\n9.1 Настоящее Соглашение не предоставляет, ни подразумеваемо, ни иным образом, никакой лицензии или иного права на раскрытую конфиденциальную информацию.",
    cd_example2_contract: "РАМОЧНЫЙ ДОГОВОР ПОДПИСКИ (ВЫДЕРЖКА)\n\n3. СРОК И ПРОДЛЕНИЕ\n3.1 Первоначальный срок составляет двенадцать (12) месяцев с даты вступления в силу.\n3.2 Настоящий Договор автоматически продлевается на последовательные периоды по двенадцать (12) месяцев, если ни одна из сторон не направит письменное уведомление об отказе от продления не менее чем за девяносто (90) дней до окончания текущего срока.\n3.3 Стоимость каждого периода продления определяется действующим на тот момент прайс-листом Поставщика. Поставщик вправе повышать стоимость при продлении без ограничений.\n\n5. ПЛАТЕЖИ\n5.2 Все платежи не подлежат возврату и вносятся ежегодно авансом. Зачёт за неиспользованные подписки или неполные месяцы не производится.\n5.4 В течение срока подписки могут быть добавлены по действующему тарифу с окончанием, совпадающим с текущим сроком. Сокращение количества подписок в течение срока не допускается.\n\n8. ПРИОСТАНОВЛЕНИЕ\n8.1 Поставщик вправе приостановить доступ, если какой-либо счёт остаётся неоплаченным в течение тридцати (30) дней, и не несёт ответственности за убытки, вызванные таким приостановлением.\n\n11. ДАННЫЕ ПРИ ПРЕКРАЩЕНИИ\n11.2 Поставщик предоставляет возможность выгрузки данных Клиента в течение тридцати (30) дней после прекращения договора, после чего они могут быть удалены. Выгрузка предоставляется в стандартном формате Поставщика. Помощь в миграции оплачивается по тарифам профессиональных услуг Поставщика.\n\n14. ОБЩИЕ ПОЛОЖЕНИЯ\n14.3 Поставщик вправе изменять настоящие условия с уведомлением за тридцать (30) дней. Продолжение использования Сервиса после даты вступления изменений в силу означает согласие с ними.",
    cd_your_situation: "Что вы нам рассказали",
    cd_chars_analyzed: "Проанализировано символов: {{count}}",
    cd_title: "Contract Decoder",
    cd_tagline: "Вставьте любой договор — и точно узнайте, что подписываете.",
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
    cd_uploaded_file: "ไฟล์ที่อัปโหลด",
    cd_wait_body: "สัญญายาวอาจใช้เวลาสองนาทีขึ้นไป เปิดหน้านี้ทิ้งไว้ — เสร็จแล้วจะขึ้นตรงนี้",
    cd_wait_title: "กำลังอ่านสัญญา",
    cd_upload: "อัปโหลดไฟล์",
    cd_upload_hint: "PDF หรือไฟล์ข้อความ · หรือวางด้านล่าง",
    cd_remove_file: "เอาออก",
    cd_err_too_large: "ไฟล์เกิน 10 MB — วางข้อความแทน",
    cd_err_read: "อ่านไฟล์นี้ไม่ได้ ลองวางข้อความดู",
    cd_tagline2: "เข้าใจสิ่งที่คุณกำลังตกลงก่อนเซ็น",
    cd_juris_label: "สัญญานี้ใช้บังคับที่ไหน?",
    cd_optional: "(ไม่บังคับ)",
    cd_juris_ph: "ประเทศและรัฐ/จังหวัด ถ้าทราบ",
    cd_juris_hint: "ถ้าสัญญาระบุเขตอำนาจไว้ ให้ใช้ตามนั้น",
    cd_situation: "สถานการณ์ของคุณ",
    cd_situation_ph: "เช่น ผมเป็นฟรีแลนซ์กำลังเซ็นโปรเจกต์ 3 เดือน หรือ นี่เป็นสัญญาเช่าฉบับแรกของฉัน",
    cd_reviewed: "📝 ตรวจสัญญาแล้ว",
    cd_overview: "สรุปแบบภาษาชาวบ้าน",
    cd_terms: "ข้อสำคัญ",
    cd_clarify: "เรื่องที่ควรถามให้ชัด",
    cd_ask: "ลองถามว่า:",
    cd_before_sign: "ก่อนเซ็น",
    cd_contract_language: "ข้อความในสัญญา",
    cd_practical_effect: "ผลที่เกิดขึ้นจริง:",
    cd_question_consider: "คำถามที่น่าถาม:",
    cd_negotiate_this: "ถ้าคุณอยากต่อรองข้อนี้",
    cd_example2_context: "เราใช้ซอฟต์แวร์จัดตารางงานตัวนี้ทั้งบริษัท ใบแจ้งหนี้ต่ออายุมาแล้วและสูงกว่าปีที่แล้ว 40% ผมพยายามหาว่าเราติดสัญญาอยู่หรือเปล่า",
    cd_example3_context: "สัปดาห์หน้าจะเซ็นสัญญาเช่าอพาร์ตเมนต์หนึ่งปี เจ้าของบ้านส่งสัญญามาเป็น PDF และอยากได้คืนภายในวันศุกร์",
    cd_example4_context: "ได้ข้อเสนองานใหม่เป็นลายลักษณ์อักษร มีเวลาเซ็นสามวัน มีข้อห้ามแข่งขันทางธุรกิจที่ผมยังไม่เข้าใจทั้งหมด",
    cd_example5_context: "สตาร์ทอัพแห่งหนึ่งอยากให้ผมเซ็นเอกสารนี้ก่อนที่จะยอมคุยเรื่องตำแหน่งสัญญาจ้างที่เป็นไปได้กับผมด้วยซ้ำ",
    cd_example3_contract: "สัญญาเช่าที่พักอาศัย (บางส่วน)\n\n4. เงินประกัน\n4.1 ผู้เช่าจะชำระเงินประกันเท่ากับค่าเช่าสอง (2) เดือน ซึ่งจะคืนให้ภายในสี่สิบห้า (45) วันหลังย้ายออก หักด้วยความเสียหายที่เกินกว่าการเสื่อมสภาพตามปกติ ตามดุลยพินิจของผู้ให้เช่าแต่เพียงผู้เดียว\n\n7. การซ่อมบำรุง\n7.2 ผู้เช่ารับผิดชอบค่าซ่อมแซมทุกครั้งที่ต่ำกว่า 150 ผู้ให้เช่ารับผิดชอบเฉพาะการซ่อมแซมโครงสร้างเท่านั้น\n\n9. การเลิกสัญญาก่อนกำหนด\n9.1 ผู้เช่าไม่มีสิทธิ์เลิกสัญญานี้ก่อนสิ้นสุดระยะเวลาเช่า การย้ายออกก่อนกำหนดจะทำให้เงินประกันทั้งหมดถูกริบ และผู้เช่ายังต้องชำระค่าเช่าจนกว่าจะถึง (ก) วันสิ้นสุดระยะเวลาเช่า หรือ (ข) มีผู้เช่ารายใหม่เข้าอยู่ แล้วแต่ว่าอย่างใดจะถึงก่อน โดยผู้ให้เช่าไม่มีหน้าที่ต้องหาผู้เช่าทดแทนอย่างจริงจัง\n\n12. การเข้าพื้นที่\n12.1 ผู้ให้เช่าสามารถเข้าพื้นที่ได้โดยแจ้งล่วงหน้ายี่สิบสี่ (24) ชั่วโมงไม่ว่าด้วยวัตถุประสงค์ใด หรือเข้าโดยไม่แจ้งล่วงหน้าในกรณีฉุกเฉินตามดุลยพินิจของผู้ให้เช่า\n\n15. ค่าธรรมเนียม\n15.3 ค่าเช่าที่ไม่ได้รับภายในวันที่ 3 ของเดือนจะมีค่าปรับล่าช้า 75 บวกอีก 10 ต่อวันที่เพิ่มขึ้น",
    cd_example4_contract: "จดหมายข้อเสนองาน (บางส่วน)\n\n4. ข้อผูกพันจำกัดสิทธิ์\n4.1 เป็นเวลาสิบแปด (18) เดือนหลังสิ้นสุดการจ้างงานไม่ว่าด้วยเหตุใด พนักงานจะไม่ให้บริการไม่ว่าทางตรงหรือทางอ้อมแก่ธุรกิจใดที่แข่งขันกับบริษัท ณ ที่ใดก็ตามในสหรัฐอเมริกา\n4.2 พนักงานโอนสิ่งประดิษฐ์ ผลงาน และแนวคิดทั้งหมดที่คิดขึ้นระหว่างการจ้างงานให้แก่บริษัท ไม่ว่าจะเกี่ยวข้องกับธุรกิจของบริษัทหรือไม่ และไม่ว่าจะสร้างขึ้นในเวลางานหรือเวลาส่วนตัว\n4.3 ระหว่างการจ้างงานและอีกสิบสอง (12) เดือนหลังจากนั้น พนักงานจะไม่ชักชวนพนักงานหรือผู้รับจ้างของบริษัทให้ลาออก\n\n6. การจ้างงานตามความสมัครใจ\n6.1 การจ้างงานเป็นไปตามความสมัครใจและฝ่ายใดฝ่ายหนึ่งสามารถยกเลิกได้ทุกเมื่อ ไม่ว่าจะมีเหตุผลหรือไม่ และไม่ว่าจะแจ้งล่วงหน้าหรือไม่\n\n8. อนุญาโตตุลาการ\n8.1 ข้อพิพาทใด ๆ ที่เกิดจากข้อเสนอนี้หรือการจ้างงานของพนักงานจะได้รับการแก้ไขผ่านอนุญาโตตุลาการที่มีผลผูกพันเท่านั้น พนักงานสละสิทธิ์การพิจารณาคดีโดยคณะลูกขุนและสิทธิ์เข้าร่วมคดีกลุ่ม",
    cd_example5_contract: "ข้อตกลงรักษาความลับร่วมกัน (บางส่วน)\n\n2. ข้อมูลลับ\n2.1 \"ข้อมูลลับ\" หมายรวมถึงข้อมูลใด ๆ ที่ฝ่ายใดฝ่ายหนึ่งเปิดเผย ไม่ว่าจะมีการระบุว่าเป็นความลับหรือไม่ รวมถึงแผนธุรกิจ ข้อมูลการเงิน และแม้แต่ข้อเท็จจริงที่ว่ากำลังมีการหารือกันอยู่\n\n5. ระยะเวลา\n5.1 ข้อตกลงนี้มีผลบังคับใช้เป็นเวลาสาม (3) ปีนับจากวันที่มีผล ภาระผูกพันด้านการรักษาความลับจะยังคงมีผลต่อไปอย่างไม่มีกำหนดเวลาสำหรับข้อมูลใดที่ถือเป็นความลับทางการค้า\n\n6. ไม่มีข้อผูกพัน\n6.1 ไม่มีข้อความใดในข้อตกลงนี้ที่ผูกมัดให้ฝ่ายใดต้องเปิดเผยข้อมูลใด ทำข้อตกลงเพิ่มเติมใด หรือดำเนินธุรกรรมใดต่อไป\n\n8. การเยียวยา\n8.1 ทั้งสองฝ่ายตกลงว่าการละเมิดข้อตกลงนี้จะก่อให้เกิดความเสียหายที่ไม่อาจแก้ไขได้ ซึ่งค่าเสียหายเป็นตัวเงินไม่เพียงพอ และฝ่ายที่ไม่ได้ละเมิดมีสิทธิ์ขอคำสั่งห้ามชั่วคราวโดยไม่ต้องวางหลักประกัน\n\n9. ไม่มีการอนุญาตให้ใช้สิทธิ์\n9.1 ข้อตกลงนี้ไม่ได้ให้สิทธิ์อนุญาตใช้งานหรือสิทธิ์อื่นใด ไม่ว่าโดยนัยหรือโดยประการอื่น ต่อข้อมูลลับใด ๆ ที่ถูกเปิดเผย",
    cd_example2_contract: "สัญญาหลักการสมัครใช้บริการ (บางส่วน)\n\n3. ระยะเวลาและการต่ออายุ\n3.1 ระยะเวลาเริ่มต้นคือสิบสอง (12) เดือนนับแต่วันที่มีผลบังคับ\n3.2 สัญญานี้จะต่ออายุโดยอัตโนมัติเป็นคราวละสิบสอง (12) เดือน เว้นแต่ฝ่ายใดฝ่ายหนึ่งจะบอกกล่าวเป็นหนังสือว่าไม่ประสงค์ต่ออายุไม่น้อยกว่าเก้าสิบ (90) วันก่อนสิ้นสุดระยะเวลาปัจจุบัน\n3.3 ค่าบริการสำหรับแต่ละรอบต่ออายุให้เป็นไปตามรายการราคาที่ผู้ให้บริการใช้อยู่ในขณะนั้น ผู้ให้บริการอาจปรับขึ้นค่าบริการเมื่อต่ออายุได้โดยไม่มีข้อจำกัด\n\n5. ค่าบริการ\n5.2 ค่าบริการทั้งหมดไม่สามารถขอคืนได้ และชำระเป็นรายปีล่วงหน้า ไม่มีการให้เครดิตสำหรับสิทธิ์ที่ไม่ได้ใช้หรือเศษของเดือน\n5.4 สามารถเพิ่มจำนวนสิทธิ์ระหว่างรอบสัญญาได้ในอัตราที่ใช้อยู่ขณะนั้น โดยสิ้นสุดพร้อมรอบปัจจุบัน แต่ไม่สามารถลดจำนวนสิทธิ์ระหว่างรอบสัญญาได้\n\n8. การระงับบริการ\n8.1 ผู้ให้บริการอาจระงับการเข้าถึงเมื่อมีใบแจ้งหนี้ค้างชำระเกินสามสิบ (30) วัน และไม่ต้องรับผิดต่อความเสียหายใด ๆ อันเกิดจากการระงับดังกล่าว\n\n11. ข้อมูลเมื่อสิ้นสุดสัญญา\n11.2 ผู้ให้บริการจะเปิดให้ส่งออกข้อมูลของลูกค้าเป็นเวลาสามสิบ (30) วันหลังสิ้นสุดสัญญา หลังจากนั้นอาจลบข้อมูลได้ การส่งออกจะอยู่ในรูปแบบมาตรฐานของผู้ให้บริการ ส่วนการช่วยเหลือในการย้ายระบบจะคิดค่าบริการตามอัตราบริการวิชาชีพของผู้ให้บริการ\n\n14. ทั่วไป\n14.3 ผู้ให้บริการอาจแก้ไขข้อกำหนดเหล่านี้โดยบอกกล่าวล่วงหน้าสามสิบ (30) วัน การใช้บริการต่อไปหลังวันที่การแก้ไขมีผลถือเป็นการยอมรับ",
    cd_your_situation: "สิ่งที่คุณบอกเรา",
    cd_chars_analyzed: "วิเคราะห์แล้ว {{count}} อักขระ",
    cd_title: "Contract Decoder",
    cd_tagline: "วางสัญญาใด ๆ ก็ได้ — รู้ชัดเจนว่าคุณกำลังเซ็นอะไร",
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
    cd_uploaded_file: "Tệp đã tải lên",
    cd_wait_body: "Hợp đồng dài có thể mất hai phút hoặc hơn. Cứ để trang này mở — xong sẽ hiện ở đây.",
    cd_wait_title: "Đang đọc hợp đồng",
    cd_upload: "Tải lên một tệp",
    cd_upload_hint: "PDF hoặc văn bản · hoặc dán bên dưới",
    cd_remove_file: "Bỏ",
    cd_err_too_large: "Tệp lớn hơn 10 MB — hãy dán văn bản.",
    cd_err_read: "Không đọc được tệp này. Thử dán văn bản xem sao.",
    cd_tagline2: "Hiểu rõ bạn đang đồng ý điều gì trước khi ký.",
    cd_juris_label: "Hợp đồng này áp dụng ở đâu?",
    cd_optional: "(không bắt buộc)",
    cd_juris_ph: "Quốc gia và tỉnh/bang, nếu biết",
    cd_juris_hint: "Nếu hợp đồng có ghi nơi áp dụng luật, hãy dùng nơi đó.",
    cd_situation: "Tình huống của bạn",
    cd_situation_ph: "vd: tôi là freelancer sắp ký dự án 3 tháng, hoặc đây là hợp đồng thuê nhà đầu tiên của tôi",
    cd_reviewed: "📝 Đã xem hợp đồng",
    cd_overview: "Tóm tắt bằng lời dễ hiểu",
    cd_terms: "Các điều khoản quan trọng",
    cd_clarify: "Những điều cần làm rõ",
    cd_ask: "Hãy hỏi:",
    cd_before_sign: "Trước khi ký",
    cd_contract_language: "Nguyên văn hợp đồng",
    cd_practical_effect: "Ảnh hưởng thực tế:",
    cd_question_consider: "Câu hỏi đáng đặt ra:",
    cd_negotiate_this: "Nếu bạn muốn thương lượng điều này",
    cd_example2_context: "Cả công ty chúng tôi dùng phần mềm xếp lịch này. Hóa đơn gia hạn vừa đến và cao hơn năm ngoái 40%. Tôi đang cố xem liệu chúng tôi có bị ràng buộc không.",
    cd_example3_context: "Tuần sau tôi sẽ ký hợp đồng thuê nhà một năm. Chủ nhà gửi hợp đồng dạng PDF và muốn nhận lại trước thứ Sáu.",
    cd_example4_context: "Tôi nhận được thư mời làm việc bằng văn bản và có ba ngày để ký. Có một điều khoản không cạnh tranh mà tôi chưa hiểu hết.",
    cd_example5_context: "Một startup muốn tôi ký cái này trước khi họ chịu bàn về một vị trí hợp đồng có thể có với tôi.",
    cd_example3_contract: "HỢP ĐỒNG THUÊ NHÀ Ở (TRÍCH)\n\n4. TIỀN ĐẶT CỌC\n4.1 Bên thuê sẽ trả tiền đặt cọc bằng hai (2) tháng tiền thuê, được hoàn lại trong vòng bốn mươi lăm (45) ngày sau khi dọn ra, trừ đi các khoản khấu trừ cho hư hỏng vượt quá hao mòn thông thường, do Bên cho thuê tự quyết định.\n\n7. BẢO TRÌ\n7.2 Bên thuê chịu trách nhiệm cho mọi sửa chữa dưới 150 mỗi lần. Bên cho thuê chỉ chịu trách nhiệm cho các sửa chữa kết cấu.\n\n9. CHẤM DỨT SỚM\n9.1 Bên thuê không được chấm dứt Hợp đồng này trước khi hết Thời hạn. Bất kỳ việc rời đi sớm nào sẽ khiến mất toàn bộ Tiền đặt cọc và buộc Bên thuê phải trả tiền thuê cho đến thời điểm sớm hơn giữa (a) kết thúc Thời hạn, hoặc (b) có người thuê mới vào ở, mà Bên cho thuê không có nghĩa vụ phải chủ động tìm người thay thế.\n\n12. QUYỀN RA VÀO\n12.1 Bên cho thuê có thể vào nhà với thông báo trước hai mươi bốn (24) giờ vì bất kỳ mục đích nào, hoặc không cần thông báo trong trường hợp khẩn cấp theo quyết định của Bên cho thuê.\n\n15. PHÍ\n15.3 Tiền thuê không nhận được trước ngày 3 hằng tháng sẽ phát sinh phí trễ hạn 75 cộng thêm 10 cho mỗi ngày tiếp theo.",
    cd_example4_contract: "THƯ MỜI LÀM VIỆC (TRÍCH)\n\n4. CÁC CAM KẾT HẠN CHẾ\n4.1 Trong thời hạn mười tám (18) tháng sau khi chấm dứt việc làm vì bất kỳ lý do gì, Nhân viên sẽ không, trực tiếp hoặc gián tiếp, cung cấp dịch vụ cho bất kỳ doanh nghiệp nào cạnh tranh với Công ty ở bất kỳ đâu tại Hoa Kỳ.\n4.2 Nhân viên chuyển giao cho Công ty mọi phát minh, tác phẩm và ý tưởng được hình thành trong thời gian làm việc, dù có liên quan đến hoạt động của Công ty hay không, dù được tạo ra trong giờ làm việc hay thời gian cá nhân.\n4.3 Trong thời gian làm việc và mười hai (12) tháng sau đó, Nhân viên sẽ không lôi kéo bất kỳ nhân viên hoặc nhà thầu nào của Công ty rời đi.\n\n6. LÀM VIỆC TỰ DO\n6.1 Việc làm là tự do và có thể bị chấm dứt bởi một trong hai bên vào bất kỳ lúc nào, có hoặc không có lý do, có hoặc không có thông báo trước.\n\n8. TRỌNG TÀI\n8.1 Mọi tranh chấp phát sinh từ thư mời này hoặc việc làm của Nhân viên sẽ được giải quyết duy nhất thông qua trọng tài ràng buộc; Nhân viên từ bỏ quyền được xét xử bởi bồi thẩm đoàn và quyền tham gia bất kỳ vụ kiện tập thể nào.",
    cd_example5_contract: "THỎA THUẬN BẢO MẬT SONG PHƯƠNG (TRÍCH)\n\n2. THÔNG TIN BẢO MẬT\n2.1 \"Thông tin Bảo mật\" bao gồm bất kỳ thông tin nào do một trong hai bên tiết lộ, dù có được đánh dấu là bảo mật hay không, bao gồm kế hoạch kinh doanh, thông tin tài chính, và cả việc các cuộc thảo luận đang diễn ra.\n\n5. THỜI HẠN\n5.1 Thỏa thuận này có hiệu lực trong ba (3) năm kể từ Ngày Hiệu lực. Nghĩa vụ bảo mật tiếp tục vô thời hạn sau khi chấm dứt đối với bất kỳ thông tin nào cấu thành bí mật kinh doanh.\n\n6. KHÔNG CÓ NGHĨA VỤ\n6.1 Không có điều khoản nào trong Thỏa thuận này buộc bất kỳ bên nào phải tiết lộ thông tin, ký kết thỏa thuận tiếp theo, hoặc tiến hành bất kỳ giao dịch nào.\n\n8. BIỆN PHÁP KHẮC PHỤC\n8.1 Các bên đồng ý rằng việc vi phạm Thỏa thuận này sẽ gây ra thiệt hại không thể khắc phục mà bồi thường bằng tiền sẽ không đủ, và bên không vi phạm sẽ có quyền yêu cầu biện pháp khẩn cấp tạm thời mà không cần đặt cọc bảo đảm.\n\n9. KHÔNG CẤP PHÉP\n9.1 Thỏa thuận này không cấp, dù ngụ ý hay cách khác, bất kỳ giấy phép hay quyền nào khác đối với Thông tin Bảo mật đã được tiết lộ.",
    cd_example2_contract: "HỢP ĐỒNG THUÊ BAO KHUNG (TRÍCH)\n\n3. THỜI HẠN VÀ GIA HẠN\n3.1 Thời hạn Ban đầu là mười hai (12) tháng kể từ Ngày Hiệu lực.\n3.2 Hợp đồng này tự động gia hạn theo từng kỳ mười hai (12) tháng liên tiếp, trừ khi một bên gửi thông báo bằng văn bản về việc không gia hạn ít nhất chín mươi (90) ngày trước khi kết thúc kỳ hạn hiện tại.\n3.3 Phí cho mỗi kỳ gia hạn theo bảng giá đang áp dụng của Nhà cung cấp tại thời điểm đó. Nhà cung cấp có quyền tăng phí khi gia hạn mà không bị giới hạn.\n\n5. PHÍ\n5.2 Mọi khoản phí đều không hoàn lại và được thanh toán trước theo năm. Không hoàn tín dụng cho các thuê bao không sử dụng hoặc tháng lẻ.\n5.4 Có thể bổ sung thuê bao trong kỳ hạn theo mức giá hiện hành, kết thúc cùng thời điểm với kỳ hạn hiện tại. Không được giảm số lượng thuê bao trong kỳ hạn.\n\n8. TẠM NGỪNG\n8.1 Nhà cung cấp có thể tạm ngừng quyền truy cập khi bất kỳ hóa đơn nào chưa thanh toán quá ba mươi (30) ngày, và không chịu trách nhiệm cho bất kỳ tổn thất nào phát sinh từ việc tạm ngừng đó.\n\n11. DỮ LIỆU KHI CHẤM DỨT\n11.2 Nhà cung cấp sẽ cho phép xuất Dữ liệu Khách hàng trong ba mươi (30) ngày sau khi chấm dứt, sau đó dữ liệu có thể bị xóa. Việc xuất được cung cấp theo định dạng chuẩn của Nhà cung cấp. Hỗ trợ chuyển đổi hệ thống được tính phí theo mức phí dịch vụ chuyên môn của Nhà cung cấp.\n\n14. ĐIỀU KHOẢN CHUNG\n14.3 Nhà cung cấp có thể sửa đổi các điều khoản này với thông báo trước ba mươi (30) ngày. Việc tiếp tục sử dụng Dịch vụ sau ngày sửa đổi có hiệu lực được coi là chấp nhận.",
    cd_your_situation: "Những gì bạn đã chia sẻ",
    cd_chars_analyzed: "Đã phân tích {{count}} ký tự",
    cd_title: "Contract Decoder",
    cd_tagline: "Dán bất kỳ hợp đồng nào — biết chính xác bạn đang ký gì.",
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
