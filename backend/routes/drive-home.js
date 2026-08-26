const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const NO_QUOTE_RULE =
  'Never place a double-quote (") character inside any JSON string value. Use single quotes or rewrite the phrase, or the JSON breaks.';

const TIME_LABELS = {
  daytime: 'daytime',
  evening: 'evening',
  late_night: 'late night',
  early_morning: 'early morning',
};

const CONDITION_LABELS = {
  clear: 'clear conditions',
  rain: 'rain',
  snow_ice: 'snow or ice',
  fog: 'fog',
  high_wind: 'high wind',
  heavy_traffic: 'heavy traffic',
  construction: 'construction',
};

const ROAD_LABELS = {
  highway: 'highway',
  city: 'city streets',
  rural: 'rural or back roads',
  mixed: 'mixed roads',
};

const DRIVER_LABELS = {
  fine: 'fine',
  a_little_tired: 'a little tired',
  very_tired: 'very tired',
  anxious: 'anxious',
  not_great: 'not great',
};

// Deterministic strings the model never writes: validation errors, the
// severe-fatigue response, the sanitiser's fallback headlines, and the two
// limitation lines. The thirteen keys are the catalog's thirteen languages —
// the supplied dictionary shipped it/nl (which the product does not offer) and
// omitted th/vi (which it does), so Thai and Vietnamese fell back to English.
const UI_STRINGS = {
  en: {
    unsupportedAction: 'Unsupported Drive Home action.',
    invalidMinutes: 'Enter the approximate drive time in minutes.',
    selectTime: 'Select the time of day.',
    selectRoad: 'Select the road type.',
    selectState: 'Tell us how you are feeling right now.',
    failed: 'Drive assessment failed. Please try again.',
    veryTiredHeadline: 'Do not start this drive while you are very tired.',
    veryTiredSummary: 'The most important fact you gave us is your current fatigue. Delay the drive or use another way to get home rather than trying to manage severe tiredness behind the wheel.',
    veryTiredConcern: 'You reported being very tired.',
    reassessRested: 'Reassess only after you are genuinely rested enough that staying awake and focused is no longer a concern.',
    optionRest: 'Wait and rest before you reconsider the drive.',
    optionStay: 'Stay where you are if that is workable.',
    optionDriver: 'Ask a rested person to drive.',
    optionAlternate: 'Take a taxi, a ride service, public transport, or another available option.',
    limits: 'Drive Home doesn\'t have live traffic, weather, or road-condition data. This assessment uses only what you reported. If conditions change, reassess before leaving.',
    headlineGo: 'The drive looks manageable from what you told us.',
    headlinePause: 'Pause before you leave.',
    headlineNo: 'Do not start this drive right now.',
  },
  es: {
    unsupportedAction: 'Acción de Drive Home no compatible.',
    invalidMinutes: 'Ingresa la duración aproximada del trayecto en minutos.',
    selectTime: 'Selecciona la hora del día.',
    selectRoad: 'Selecciona el tipo de carretera.',
    selectState: 'Indica cómo te sientes en este momento.',
    failed: 'No se pudo evaluar el trayecto. Inténtalo de nuevo.',
    veryTiredHeadline: 'No empieces este trayecto si estás muy cansado.',
    veryTiredSummary: 'El dato más importante que diste es tu cansancio actual. Retrasa el trayecto o usa otra forma de llegar a casa en lugar de intentar conducir con mucho sueño.',
    veryTiredConcern: 'Indicaste que estás muy cansado.',
    reassessRested: 'Vuelve a evaluarlo solo cuando estés realmente descansado y mantenerte despierto y concentrado ya no sea una preocupación.',
    optionRest: 'Espera y descansa antes de reconsiderar el trayecto.',
    optionStay: 'Quédate donde estás si es posible.',
    optionDriver: 'Pide a una persona descansada que conduzca.',
    optionAlternate: 'Usa taxi, transporte por aplicación, transporte público u otra alternativa disponible.',
    limits: 'Drive Home no dispone de datos en vivo de tráfico, clima ni estado de las carreteras. Esta evaluación usa únicamente lo que reportaste. Si las condiciones cambian, vuelve a evaluarlo antes de salir.',
    headlineGo: 'El trayecto parece manejable con lo que nos contaste.',
    headlinePause: 'Detente un momento antes de salir.',
    headlineNo: 'No empieces este trayecto ahora mismo.',
  },
  fr: {
    unsupportedAction: 'Action Drive Home non prise en charge.',
    invalidMinutes: 'Indiquez la durée approximative du trajet en minutes.',
    selectTime: 'Sélectionnez le moment de la journée.',
    selectRoad: 'Sélectionnez le type de route.',
    selectState: 'Indiquez comment vous vous sentez maintenant.',
    failed: 'Échec de l’évaluation du trajet. Veuillez réessayer.',
    veryTiredHeadline: 'Ne prenez pas la route si vous êtes très fatigué.',
    veryTiredSummary: 'Le fait le plus important que vous avez indiqué est votre fatigue actuelle. Reportez le trajet ou utilisez un autre moyen de rentrer plutôt que de conduire avec une forte somnolence.',
    veryTiredConcern: 'Vous avez indiqué être très fatigué.',
    reassessRested: 'Réévaluez seulement lorsque vous êtes réellement reposé et que rester éveillé et concentré n’est plus une préoccupation.',
    optionRest: 'Attendez et reposez-vous avant de reconsidérer le trajet.',
    optionStay: 'Restez sur place si c’est possible.',
    optionDriver: 'Demandez à une personne reposée de conduire.',
    optionAlternate: 'Utilisez un taxi, un VTC, les transports en commun ou une autre solution disponible.',
    limits: 'Drive Home ne dispose d\'aucune donnée en direct sur le trafic, la météo ou l\'état des routes. Cette évaluation utilise uniquement ce que vous avez indiqué. Si les conditions changent, réévaluez avant de partir.',
    headlineGo: 'Le trajet paraît gérable au vu de ce que vous avez indiqué.',
    headlinePause: 'Faites une pause avant de partir.',
    headlineNo: 'Ne prenez pas la route maintenant.',
  },
  de: {
    unsupportedAction: 'Nicht unterstützte Drive-Home-Aktion.',
    invalidMinutes: 'Gib die ungefähre Fahrzeit in Minuten ein.',
    selectTime: 'Wähle die Tageszeit aus.',
    selectRoad: 'Wähle den Straßentyp aus.',
    selectState: 'Gib an, wie du dich gerade fühlst.',
    failed: 'Die Fahrt konnte nicht bewertet werden. Bitte versuche es erneut.',
    veryTiredHeadline: 'Fahre jetzt nicht los, wenn du sehr müde bist.',
    veryTiredSummary: 'Die wichtigste Information ist deine aktuelle Müdigkeit. Verschiebe die Fahrt oder nutze eine andere Möglichkeit, nach Hause zu kommen, statt mit starker Müdigkeit zu fahren.',
    veryTiredConcern: 'Du hast angegeben, sehr müde zu sein.',
    reassessRested: 'Bewerte die Fahrt erst neu, wenn du wirklich ausgeruht bist und Wachbleiben und Konzentration kein Problem mehr sind.',
    optionRest: 'Warte und ruhe dich aus, bevor du die Fahrt neu bewertest.',
    optionStay: 'Bleib dort, wenn das praktikabel ist.',
    optionDriver: 'Bitte eine ausgeruhte Person zu fahren.',
    optionAlternate: 'Nutze Taxi, Fahrdienst, öffentliche Verkehrsmittel oder eine andere verfügbare Alternative.',
    limits: 'Drive Home hat keine Live-Daten zu Verkehr, Wetter oder Straßenzustand. Diese Einschätzung verwendet nur das, was du angegeben hast. Wenn sich die Bedingungen ändern, bewerte die Fahrt vor der Abfahrt neu.',
    headlineGo: 'Nach deinen Angaben wirkt die Fahrt machbar.',
    headlinePause: 'Halte kurz inne, bevor du losfährst.',
    headlineNo: 'Fahre jetzt nicht los.',
  },
  pt: {
    unsupportedAction: 'Ação do Drive Home não suportada.',
    invalidMinutes: 'Informe a duração aproximada da viagem em minutos.',
    selectTime: 'Selecione o período do dia.',
    selectRoad: 'Selecione o tipo de via.',
    selectState: 'Diga como você está se sentindo agora.',
    failed: 'Não foi possível avaliar a viagem. Tente novamente.',
    veryTiredHeadline: 'Não comece esta viagem se estiver muito cansado.',
    veryTiredSummary: 'O fato mais importante que você informou é o cansaço atual. Adie a viagem ou use outra forma de chegar em casa em vez de dirigir com muita sonolência.',
    veryTiredConcern: 'Você informou que está muito cansado.',
    reassessRested: 'Reavalie apenas quando estiver realmente descansado e manter-se acordado e concentrado não for mais uma preocupação.',
    optionRest: 'Espere e descanse antes de reconsiderar a viagem.',
    optionStay: 'Fique onde está, se isso for viável.',
    optionDriver: 'Peça para uma pessoa descansada dirigir.',
    optionAlternate: 'Use táxi, aplicativo de transporte, transporte público ou outra alternativa disponível.',
    limits: 'O Drive Home não tem dados em tempo real de trânsito, clima ou condições da via. Esta avaliação usa apenas o que você informou. Se as condições mudarem, reavalie antes de sair.',
    headlineGo: 'Pelo que você contou, a viagem parece administrável.',
    headlinePause: 'Faça uma pausa antes de sair.',
    headlineNo: 'Não comece esta viagem agora.',
  },
  ar: {
    unsupportedAction: 'إجراء Drive Home غير مدعوم.',
    invalidMinutes: 'أدخل المدة التقريبية للقيادة بالدقائق.',
    selectTime: 'اختر وقت اليوم.',
    selectRoad: 'اختر نوع الطريق.',
    selectState: 'أخبرنا كيف تشعر الآن.',
    failed: 'تعذر تقييم الرحلة. حاول مرة أخرى.',
    veryTiredHeadline: 'لا تبدأ هذه الرحلة وأنت شديد التعب.',
    veryTiredSummary: 'أهم معلومة ذكرتها هي شدة تعبك الآن. أجّل الرحلة أو استخدم وسيلة أخرى للوصول إلى المنزل بدل القيادة مع نعاس شديد.',
    veryTiredConcern: 'ذكرت أنك شديد التعب.',
    reassessRested: 'أعد التقييم فقط بعد أن تكون مرتاحًا فعلًا ولم يعد البقاء مستيقظًا ومركزًا مصدر قلق.',
    optionRest: 'انتظر وخذ قسطًا من الراحة قبل إعادة التفكير في الرحلة.',
    optionStay: 'ابقَ حيث أنت إذا كان ذلك عمليًا.',
    optionDriver: 'اطلب من شخص مرتاح أن يقود.',
    optionAlternate: 'استخدم سيارة أجرة أو خدمة نقل أو المواصلات العامة أو بديلًا متاحًا آخر.',
    limits: 'لا تتوفر لدى Drive Home بيانات مباشرة عن حركة المرور أو الطقس أو حالة الطرق. يعتمد هذا التقييم فقط على ما ذكرته أنت. وإذا تغيرت الظروف، فأعد التقييم قبل المغادرة.',
    headlineGo: 'بناءً على ما ذكرته، تبدو الرحلة ممكنة.',
    headlinePause: 'توقف قليلًا قبل أن تنطلق.',
    headlineNo: 'لا تبدأ هذه الرحلة الآن.',
  },
  zh: {
    unsupportedAction: '不支持的 Drive Home 操作。',
    invalidMinutes: '请输入大约的驾驶时长（分钟）。',
    selectTime: '请选择一天中的时间。',
    selectRoad: '请选择道路类型。',
    selectState: '请告诉我们你现在的感觉。',
    failed: '无法评估这次驾驶。请重试。',
    veryTiredHeadline: '如果你现在非常疲劳，请不要开始驾驶。',
    veryTiredSummary: '你提供的最重要信息是当前的严重疲劳。请推迟驾驶或改用其他方式回家，而不是在强烈困倦时驾驶。',
    veryTiredConcern: '你表示自己非常疲劳。',
    reassessRested: '只有在你真正休息好、保持清醒和专注不再是问题时，才重新评估是否驾驶。',
    optionRest: '先等待并休息，再重新考虑是否驾驶。',
    optionStay: '如果可行，留在原地。',
    optionDriver: '请一位休息充分的人来驾驶。',
    optionAlternate: '使用出租车、网约车、公共交通或其他可用方式。',
    limits: 'Drive Home 没有实时的交通、天气或道路状况数据。此评估仅使用你报告的情况。如果情况有变，出发前请重新评估。',
    headlineGo: '就你所说的情况来看，这趟车是可以应付的。',
    headlinePause: '出发前先停下来想一想。',
    headlineNo: '现在不要开始这趟驾驶。',
  },
  ja: {
    unsupportedAction: 'Drive Home でサポートされていない操作です。',
    invalidMinutes: 'おおよその運転時間を分で入力してください。',
    selectTime: '時間帯を選択してください。',
    selectRoad: '道路の種類を選択してください。',
    selectState: '今の体調を教えてください。',
    failed: '運転の評価に失敗しました。もう一度お試しください。',
    veryTiredHeadline: 'とても疲れている状態では運転を始めないでください。',
    veryTiredSummary: '最も重要なのは、今とても疲れていると申告したことです。強い眠気を抱えたまま運転せず、出発を遅らせるか別の帰宅手段を使ってください。',
    veryTiredConcern: 'とても疲れていると申告しています。',
    reassessRested: '十分に休み、眠気や集中力の低下が問題でなくなってから再評価してください。',
    optionRest: '休憩してから運転を再検討してください。',
    optionStay: '可能ならその場所にとどまってください。',
    optionDriver: '十分に休んだ人に運転を頼んでください。',
    optionAlternate: 'タクシー、配車サービス、公共交通機関など別の手段を使ってください。',
    limits: 'Drive Home はリアルタイムの交通・天気・道路状況のデータを持っていません。この評価は、あなたが報告した内容だけを使っています。状況が変わったら、出発前にもう一度確認してください。',
    headlineGo: 'お聞きした範囲では、無理のない運転になりそうです。',
    headlinePause: '出発する前に、少し立ち止まってください。',
    headlineNo: '今は運転を始めないでください。',
  },
  ko: {
    unsupportedAction: '지원되지 않는 Drive Home 작업입니다.',
    invalidMinutes: '대략적인 운전 시간을 분 단위로 입력하세요.',
    selectTime: '시간대를 선택하세요.',
    selectRoad: '도로 유형을 선택하세요.',
    selectState: '지금 상태가 어떤지 알려주세요.',
    failed: '운전 평가에 실패했습니다. 다시 시도하세요.',
    veryTiredHeadline: '매우 피곤한 상태라면 지금 운전을 시작하지 마세요.',
    veryTiredSummary: '가장 중요한 정보는 현재 매우 피곤하다고 한 점입니다. 심한 졸음 상태에서 운전하지 말고 출발을 미루거나 다른 방법으로 귀가하세요.',
    veryTiredConcern: '매우 피곤하다고 보고했습니다.',
    reassessRested: '충분히 쉬어서 깨어 있고 집중하는 데 문제가 없을 때만 다시 판단하세요.',
    optionRest: '잠시 기다리고 쉬었다가 운전을 다시 판단하세요.',
    optionStay: '가능하다면 현재 있는 곳에 머무르세요.',
    optionDriver: '충분히 쉰 사람에게 운전을 부탁하세요.',
    optionAlternate: '택시, 차량 호출 서비스, 대중교통 또는 다른 가능한 수단을 이용하세요.',
    limits: 'Drive Home에는 실시간 교통, 날씨, 도로 상태 데이터가 없습니다. 이 평가는 사용자가 알려준 내용만 사용합니다. 상황이 달라지면 출발 전에 다시 판단하세요.',
    headlineGo: '말씀하신 내용으로 보면 감당할 만한 운전입니다.',
    headlinePause: '출발하기 전에 잠시 멈추세요.',
    headlineNo: '지금은 운전을 시작하지 마세요.',
  },
  ru: {
    unsupportedAction: 'Неподдерживаемое действие Drive Home.',
    invalidMinutes: 'Укажите примерную продолжительность поездки в минутах.',
    selectTime: 'Выберите время суток.',
    selectRoad: 'Выберите тип дороги.',
    selectState: 'Укажите, как вы себя чувствуете сейчас.',
    failed: 'Не удалось оценить поездку. Попробуйте еще раз.',
    veryTiredHeadline: 'Не начинайте поездку, если вы очень устали.',
    veryTiredSummary: 'Самый важный факт — вы сообщили о сильной усталости. Отложите поездку или выберите другой способ добраться домой вместо вождения при сильной сонливости.',
    veryTiredConcern: 'Вы сообщили, что очень устали.',
    reassessRested: 'Возвращайтесь к решению только после того, как действительно отдохнете и бодрствование и концентрация перестанут быть проблемой.',
    optionRest: 'Подождите и отдохните, прежде чем снова рассматривать поездку.',
    optionStay: 'Останьтесь там, где вы находитесь, если это возможно.',
    optionDriver: 'Попросите отдохнувшего человека сесть за руль.',
    optionAlternate: 'Используйте такси, сервис поездок, общественный транспорт или другой доступный вариант.',
    limits: 'У Drive Home нет данных о трафике, погоде или состоянии дорог в реальном времени. Эта оценка использует только то, что вы сообщили. Если условия изменятся, оцените заново перед выездом.',
    headlineGo: 'Судя по тому, что вы описали, поездка выглядит посильной.',
    headlinePause: 'Остановитесь на минуту перед выездом.',
    headlineNo: 'Не начинайте эту поездку сейчас.',
  },
  hi: {
    unsupportedAction: 'Drive Home की यह कार्रवाई समर्थित नहीं है।',
    invalidMinutes: 'ड्राइव का अनुमानित समय मिनटों में दर्ज करें।',
    selectTime: 'दिन का समय चुनें।',
    selectRoad: 'सड़क का प्रकार चुनें।',
    selectState: 'बताएं कि आप अभी कैसा महसूस कर रहे हैं।',
    failed: 'ड्राइव का आकलन नहीं हो सका। कृपया फिर कोशिश करें।',
    veryTiredHeadline: 'अगर आप बहुत थके हुए हैं तो अभी ड्राइव शुरू न करें।',
    veryTiredSummary: 'आपने जो सबसे महत्वपूर्ण बात बताई है वह आपकी मौजूदा बहुत अधिक थकान है। तेज उनींदेपन में ड्राइव करने के बजाय यात्रा टालें या घर जाने का दूसरा तरीका चुनें।',
    veryTiredConcern: 'आपने बताया कि आप बहुत थके हुए हैं।',
    reassessRested: 'दोबारा तभी आकलन करें जब आप सचमुच आराम कर चुके हों और जागे तथा केंद्रित रहने की चिंता न हो।',
    optionRest: 'रुकें और आराम करें, फिर ड्राइव पर दोबारा विचार करें।',
    optionStay: 'अगर संभव हो तो वहीं रुकें।',
    optionDriver: 'किसी आराम कर चुके व्यक्ति से ड्राइव करने को कहें।',
    optionAlternate: 'टैक्सी, राइडशेयर, सार्वजनिक परिवहन या कोई दूसरा उपलब्ध विकल्प लें।',
    limits: 'Drive Home के पास ट्रैफिक, मौसम या सड़क की स्थिति का लाइव डेटा नहीं है। यह आकलन केवल आपके बताए हुए हालात पर आधारित है। हालात बदलें तो निकलने से पहले दोबारा आकलन करें।',
    headlineGo: 'आपने जो बताया, उसके हिसाब से यह ड्राइव संभालने लायक लगती है।',
    headlinePause: 'निकलने से पहले एक पल रुकें।',
    headlineNo: 'अभी यह ड्राइव शुरू न करें।',
  },
  th: {
    unsupportedAction: 'Drive Home ไม่รองรับการทำงานนี้',
    invalidMinutes: 'กรอกระยะเวลาขับรถโดยประมาณเป็นนาที',
    selectTime: 'เลือกช่วงเวลาของวัน',
    selectRoad: 'เลือกประเภทถนน',
    selectState: 'บอกเราว่าตอนนี้คุณรู้สึกอย่างไร',
    failed: 'ประเมินการขับรถไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    veryTiredHeadline: 'อย่าเริ่มขับรถเที่ยวนี้ขณะที่คุณเหนื่อยมาก',
    veryTiredSummary: 'ข้อมูลสำคัญที่สุดที่คุณให้คือความเหนื่อยล้าในตอนนี้ เลื่อนการเดินทางออกไปหรือใช้วิธีอื่นกลับบ้าน แทนที่จะฝืนขับรถขณะง่วงมาก',
    veryTiredConcern: 'คุณระบุว่าคุณเหนื่อยมาก',
    reassessRested: 'ประเมินใหม่อีกครั้งเมื่อคุณได้พักผ่อนเพียงพอจริง ๆ และการตื่นตัวกับสมาธิไม่ใช่ปัญหาอีกต่อไป',
    optionRest: 'รอและพักผ่อนก่อน แล้วค่อยพิจารณาการขับรถอีกครั้ง',
    optionStay: 'อยู่ที่เดิมก่อน ถ้าทำได้',
    optionDriver: 'ขอให้คนที่พักผ่อนเพียงพอเป็นคนขับ',
    optionAlternate: 'ใช้แท็กซี่ บริการเรียกรถ ขนส่งสาธารณะ หรือทางเลือกอื่นที่มี',
    limits: 'Drive Home ไม่มีข้อมูลการจราจร สภาพอากาศ หรือสภาพถนนแบบเรียลไทม์ การประเมินนี้ใช้เฉพาะสิ่งที่คุณแจ้งไว้เท่านั้น หากสถานการณ์เปลี่ยน ให้ประเมินใหม่ก่อนออกเดินทาง',
    headlineGo: 'จากสิ่งที่คุณบอกมา การขับรถเที่ยวนี้ดูรับมือไหว',
    headlinePause: 'หยุดคิดสักครู่ก่อนออกเดินทาง',
    headlineNo: 'อย่าเพิ่งเริ่มขับรถตอนนี้',
  },
  vi: {
    unsupportedAction: 'Thao tác Drive Home không được hỗ trợ.',
    invalidMinutes: 'Nhập thời gian lái xe ước tính theo phút.',
    selectTime: 'Chọn thời điểm trong ngày.',
    selectRoad: 'Chọn loại đường.',
    selectState: 'Cho chúng tôi biết bạn đang cảm thấy thế nào.',
    failed: 'Không đánh giá được chuyến đi. Vui lòng thử lại.',
    veryTiredHeadline: 'Đừng bắt đầu chuyến đi này khi bạn đang rất mệt.',
    veryTiredSummary: 'Điều quan trọng nhất bạn cho biết là tình trạng mệt mỏi hiện tại. Hãy hoãn chuyến đi hoặc chọn cách khác để về nhà thay vì cố lái xe khi buồn ngủ nặng.',
    veryTiredConcern: 'Bạn cho biết mình đang rất mệt.',
    reassessRested: 'Chỉ đánh giá lại khi bạn đã thực sự nghỉ ngơi đủ và việc giữ tỉnh táo, tập trung không còn là vấn đề.',
    optionRest: 'Chờ và nghỉ ngơi trước khi cân nhắc lại chuyến đi.',
    optionStay: 'Ở lại nơi bạn đang đứng nếu điều đó khả thi.',
    optionDriver: 'Nhờ một người đã nghỉ ngơi đầy đủ lái xe.',
    optionAlternate: 'Đi taxi, dịch vụ gọi xe, phương tiện công cộng hoặc lựa chọn khác đang có.',
    limits: 'Drive Home không có dữ liệu giao thông, thời tiết hay tình trạng đường theo thời gian thực. Đánh giá này chỉ dựa trên những gì bạn cung cấp. Nếu điều kiện thay đổi, hãy cân nhắc lại trước khi khởi hành.',
    headlineGo: 'Theo những gì bạn mô tả, chuyến đi này có vẻ trong khả năng.',
    headlinePause: 'Dừng lại một chút trước khi khởi hành.',
    headlineNo: 'Đừng bắt đầu chuyến đi này lúc này.',
  },
};

function normalizeLanguage(userLanguage) {
  const raw = String(userLanguage || 'en').toLowerCase().trim();
  const base = raw.split(/[-_]/)[0];
  return UI_STRINGS[raw] ? raw : (UI_STRINGS[base] ? base : 'en');
}

function t(userLanguage, key) {
  const lang = normalizeLanguage(userLanguage);
  return UI_STRINGS[lang]?.[key] || UI_STRINGS.en[key] || key;
}

function compactString(value, max = 800) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

// The model returns the literal string 'null' or 'None' often enough that a
// truthiness check alone renders a card reading "Main concern: None".
const BLANK = new Set(['null', 'none', 'n/a', 'na', '-', '—', 'undefined', 'nothing']);
function blank(value) {
  return !value || BLANK.has(String(value).trim().toLowerCase());
}

function compactList(value, allowed) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(v => allowed.includes(v)))];
}

function cleanList(value, maxItems = 6) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const v of value) {
    if (typeof v !== 'string' || !v.trim() || blank(v)) continue;
    const trimmed = v.trim();
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;   // one live run came back with a factor printed twice
    seen.add(key);
    out.push(trimmed);
    if (out.length === maxItems) break;
  }
  return out;
}

function sanitizeResult(raw, userLanguage) {
  const allowed = ['go', 'pause', 'do_not_drive'];
  const recommendation = allowed.includes(raw?.recommendation) ? raw.recommendation : 'pause';

  return {
    recommendation,
    headline: compactString(raw?.headline, 180) || t(
      userLanguage,
      recommendation === 'go' ? 'headlineGo' : recommendation === 'do_not_drive' ? 'headlineNo' : 'headlinePause'
    ),
    summary: compactString(raw?.summary, 700),
    main_concern: blank(raw?.main_concern) ? null : compactString(raw.main_concern, 260),
    factors_harder: cleanList(raw?.factors_harder, 5),
    factors_in_favor: cleanList(raw?.factors_in_favor, 4),
    before_you_decide: blank(raw?.before_you_decide) ? null : compactString(raw.before_you_decide, 500),
    safer_options: cleanList(raw?.safer_options, 4),
    prep_checklist: cleanList(raw?.prep_checklist, 3),
    watch_for: cleanList(raw?.watch_for, 2),
    limits: cleanList(raw?.limits, 4),
  };
}

const PROMISE = `Drive Home helps someone decide whether to start a drive right now, using only what they reported about the drive and their own condition. If starting looks reasonable it gives proportionate preparation. It does not certify a drive as safe, and it has no live data of any kind.`;

function suppliedFrom(body, minutes, cleanConditions) {
  return `WHAT THE DRIVER SUPPLIED, IN FULL — nothing else about this drive is known:
Approximate drive time: ${minutes} minutes
Time of day: ${TIME_LABELS[body.time_of_day]}
Conditions they reported: ${cleanConditions.length ? cleanConditions.map(x => CONDITION_LABELS[x]).join(', ') : 'NONE selected'}
Road type: ${ROAD_LABELS[body.road_type]}
How they say they feel: ${DRIVER_LABELS[body.driver_state]}
Starting point they typed: ${compactString(body.from, 180) || 'NOTHING'}
Destination they typed: ${compactString(body.to, 180) || 'NOTHING'}
What is making them hesitate: ${compactString(body.concern, 1200) || 'NOTHING — they raised no specific concern.'}

The place names are free text. They establish NO route, distance, road, weather, traffic, surface, neighbourhood or condition. Nothing about the vehicle, the driver's sleep, health, passengers, fuel, tyres or phone was supplied.

WHAT FAILS:
1. Any claim about the actual route, traffic, weather, closures or road surface — there is no live data and the place names are not data.
2. A numeric risk score, percentage, probability, or a statement that the drive is safe.
3. A fact about the driver, their vehicle or their surroundings that they did not supply.
4. Advice for pushing through fatigue or impairment, or steps for proceeding under a pause or do-not-drive call.
5. Telling the driver to use a phone, timer or this tool while the vehicle is moving.
6. A reported condition restated as something stronger or more specific than it was: rain described as low visibility or bad weather; heavy traffic described as a commute or rush hour; two reported facts joined into a claim about what is causing the third.
7. A person or a place nobody mentioned — a colleague still at the office, someone at home who could collect them, a housemate, a cafe, a spare bed. Offering "a rested person, if one is available" is fine; asserting one exists is not.
8. A named recovery interval, or a remedy offered as evidence of fitness to drive: "wait 20-30 minutes", "wait inside for 10-15 minutes and reassess", "after something to eat you will feel sharper", "a coffee and you will be fine". Nothing establishes how long this person needs. CHECK safer_options AND prep_checklist FOR THIS, not only before_you_decide — the interval usually appears as the first safer option. "Wait somewhere safe and reassess before starting" is the correct form of the same advice.
9. Generic driving advice that would read identically on any other drive — check your mirrors, watch for erratic drivers, top up the fuel, allow extra following distance — unless the supplied facts make it specifically relevant here. One item tied to this situation beats three that are true of every journey.
10. An entry in factors_in_favor that does not make the DRIVING easier or safer — an observation about the driver's judgement, a compliment on their self-awareness, a silver lining. That section is allowed to be empty and usually should be on a pause.
11. An inferred purpose, arrival time or amount of slack: that the trip is a visit, that they can afford to wait, that arriving late is or is not a problem. A destination is not a purpose.`;
}

// V2: the tool's primary job is the pre-drive decision.
// Arrival/check-in behavior is intentionally frontend/local; this route does not
// pretend to monitor the drive, send messages, or retrieve live traffic/weather.
router.post('/drive-home', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      action,
      from,
      to,
      drive_minutes,
      time_of_day,
      conditions,
      road_type,
      driver_state,
      concern,
      userLanguage,
      userLocale,
      userCurrency,
      userRegion,
    } = req.body || {};

    if (action && action !== 'assess') {
      return res.status(400).json({ error: t(userLanguage, 'unsupportedAction') });
    }

    const minutes = Number(drive_minutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
      return res.status(400).json({ error: t(userLanguage, 'invalidMinutes') });
    }

    if (!TIME_LABELS[time_of_day]) {
      return res.status(400).json({ error: t(userLanguage, 'selectTime') });
    }

    if (!ROAD_LABELS[road_type]) {
      return res.status(400).json({ error: t(userLanguage, 'selectRoad') });
    }

    if (!DRIVER_LABELS[driver_state]) {
      return res.status(400).json({ error: t(userLanguage, 'selectState') });
    }

    const cleanConditions = compactList(
      conditions,
      Object.keys(CONDITION_LABELS)
    );

    const start = compactString(from, 180);
    const destination = compactString(to, 180);
    const hesitation = compactString(concern, 1200);

    // The interface explicitly offers "Very tired." Treat that statement as a
    // decision boundary rather than asking the model to rationalize around it.
    //
    // factors_harder stays empty here on purpose. Echoing the form back
    // ("45 minute drive", "Time: late night") added nothing to a do-not-drive
    // call, and the labels are English constants — in the twelve other
    // languages they arrived as English inside otherwise translated text.
    if (driver_state === 'very_tired') {
      return res.json({
        recommendation: 'do_not_drive',
        headline: t(userLanguage, 'veryTiredHeadline'),
        summary: t(userLanguage, 'veryTiredSummary'),
        main_concern: t(userLanguage, 'veryTiredConcern'),
        factors_harder: [],
        factors_in_favor: [],
        before_you_decide: t(userLanguage, 'reassessRested'),
        safer_options: [
          t(userLanguage, 'optionRest'),
          t(userLanguage, 'optionStay'),
          t(userLanguage, 'optionDriver'),
          t(userLanguage, 'optionAlternate'),
        ],
        prep_checklist: [],
        watch_for: [],
        limits: [t(userLanguage, 'limits')],
      });
    }

    const contextLines = [
      `Approximate drive time: ${minutes} minutes`,
      `Time: ${TIME_LABELS[time_of_day]}`,
      `Reported conditions: ${cleanConditions.length
        ? cleanConditions.map(x => CONDITION_LABELS[x]).join(', ')
        : 'none selected'}`,
      `Road type: ${ROAD_LABELS[road_type]}`,
      `Driver says they feel: ${DRIVER_LABELS[driver_state]}`,
      start ? `From: ${start}` : '',
      destination ? `To: ${destination}` : '',
      hesitation ? `Anything making them hesitate: ${hesitation}` : '',
    ].filter(Boolean).join('\n');

    const system = `You are Drive Home, a pre-drive decision helper.

Your job is NOT to certify that a drive is safe. Your job is to help someone decide whether to start a drive based only on what they explicitly report, then give proportionate preparation if proceeding appears reasonable.

NON-NEGOTIABLE BOUNDARIES:
- You have NO live traffic, weather, construction, road-closure, crime, map, routing, or vehicle data.
- From/To text is context only. Never claim to know the actual route, highway, distance, traffic, weather, road surface, neighborhood, elevation, or current conditions from those place names.
- Never invent facts about the driver's health, sleep, vehicle, tires, fuel, phone battery, companions, route, weather, or surroundings.
- Never output a numeric risk score, safety percentage, color-coded risk rating, probability of a crash, or claim that the user is 'safe to drive'.
- Never diagnose fatigue, anxiety, impairment, illness, or another medical condition.
- If the user reports severe sleepiness, nodding off, trouble keeping their eyes open, intoxication, or another clear inability to drive attentively, recommend not starting the drive and offer alternatives.
- If the user reports anxiety without impairment, do not treat anxiety itself as proof that they should or should not drive. Address the concrete concern they supplied.
- Do not give advice for how to push through dangerous fatigue or impairment.
- Do not tell the user to interact with a phone, timer, location sharing, or this tool while the vehicle is moving.
- A 'go' recommendation means only: nothing in the supplied facts currently gives you a clear reason to recommend waiting or not driving. Phrase it accordingly.
- If one concrete missing fact could materially change the call, use recommendation 'pause' and state that fact in before_you_decide rather than inventing it.
- Keep the result concise enough to read before departure.

GROUNDING THIS TOOL LEARNED THE HARD WAY:
- Never infer why they are travelling, when they must arrive, or how much slack they have. A destination is not a purpose: 'my parents' place' does not establish a visit, people who could drive, or anywhere to stay.
- factors_in_favor is for facts about the DRIVING. An observation about the driver's judgement is not one — 'you noticed the fatigue before starting' and 'the anxiety is tracking a concrete uncertainty' are remarks about their reasoning, not things that make the road safer.
- safer_options are written as things the driver could do, never as questions back to them. 'Do you have access to a rested, experienced winter driver?' is a question; 'if available, have a rested, experienced winter driver make the drive instead' is an option.
- Each safer_option is a different KIND of action — resolve the unknown, wait and reassess, hand the drive to someone else, travel another way, do not make the trip.
- before_you_decide is the most useful field in this response when one concrete, checkable fact would settle it. Where an official source exists for that fact — a road-conditions line or website, a transport authority, a closure or chain-law notice — say to check it and say what a closure, a restriction or an advisory they are not equipped for would mean for the decision. Name the KIND of source; never a specific phone number, URL or agency you cannot verify.

DECISION STANDARD:
1. Put the driver's present condition first.
2. Then consider drive duration, time of day, user-reported weather/traffic/road conditions, and road type.
3. Separate reported facts from ordinary general driving considerations.
4. Use 'do_not_drive' when the supplied facts give a clear reason not to start now.
5. Use 'pause' when a concrete uncertainty needs resolving or a short wait/reassessment is the prudent call.
6. Use 'go' only when proceeding appears reasonable from the supplied facts, while still avoiding any guarantee of safety.

OUTPUT:
Return ONLY valid JSON with exactly this shape:
{
  "recommendation": "go" | "pause" | "do_not_drive",
  "headline": "Direct plain-language call, no safety guarantee — one sentence",
  "summary": "1-3 concise sentences grounded only in supplied facts",
  "main_concern": "Specific concern grounded in supplied facts, or null",
  "factors_harder": ["0-5 grounded factors, one short line each"],
  "factors_in_favor": ["0-4 genuinely favorable supplied facts, one short line each"],
  "before_you_decide": "One concrete decision boundary, or null. Do not open by restating the field name — the reader can already see the heading",
  "safer_options": ["0-4 grounded alternatives, one short line each"],
  "prep_checklist": ["0-3 specific pre-departure actions"],
  "watch_for": ["0-2 situation-specific things to watch for; empty unless recommendation is go"],
  "limits": ["the server overwrites this — do not spend effort on it"]
}

The value of "recommendation" is an identifier, not prose. Return it as exactly one of the English strings go, pause or do_not_drive whatever language the rest of the response is written in. Everything else in the JSON is prose and is written in the reader's language.

OUTPUT DISCIPLINE:

- Do not fill a section just because it exists.
- If a section has nothing specific and useful to add from the supplied facts, return an empty array or null.
- Prefer 1 strong item over 3 generic items.
- Do not repeat the same advice in different wording across sections.
- Do not add generic driving advice unless it is directly relevant to the user's reported situation.
- Do not invent route characteristics, schedule flexibility, available people, vehicle status, fuel level, weather effects, or other circumstances not explicitly supplied.
- Do not convert a reported fact into a stronger claim. For example:
  - 'rain' does not become 'low visibility'
  - 'evening + heavy traffic' does not become 'evening commute'
  - 'snow or ice selected' does not become 'snow or ice on the route'
- If offering an alternative that depends on something unknown, make it explicitly conditional:
  - 'If available, ask a rested person to drive'
  - not 'Ask your colleague to drive'
- Do not prescribe a specific waiting period, food, drink, rest interval, or recovery method unless the user supplied a reason that makes that specific action appropriate.

STATE-SPECIFIC OUTPUT RULES:

If recommendation = 'go':
- main_concern must be null unless there is a real, specific concern.
- factors_harder may be [].
- factors_in_favor should contain only concrete supplied facts.
- prep_checklist may be empty; maximum 3 items.
- watch_for may be empty; maximum 2 items.
- Do not include generic items such as fuel checks, erratic drivers, routine vehicle checks, or broad defensive-driving advice unless directly relevant.
- Keep GO outputs shorter than PAUSE or DO_NOT_DRIVE outputs.

If recommendation = 'pause':
- prep_checklist must be [].
- watch_for must be [].
- factors_in_favor should usually be [] unless a supplied fact genuinely reduces the concern.
- before_you_decide should identify the one concrete fact, condition, or reassessment that could change the call.
- safer_options should be conditional and grounded; maximum 4 items.

If recommendation = 'do_not_drive':
- prep_checklist must be [].
- watch_for must be [].
- do not give advice for how to proceed with the drive anyway.
- safer_options should focus on delaying, staying put, using another driver, or another transport option, only as conditional possibilities.

Before returning JSON, check every list item against every other section. Remove any item that repeats the same idea, merely rephrases another item, or adds generic filler.

${NO_QUOTE_RULE}`;

    const prompt = `Assess this proposed drive using ONLY the information below.

${contextLines}

Do not infer any route-specific fact from the place names.
Return only the requested JSON.`;

    const raw = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3400,
      system: withLanguage(system, userLanguage) +
        withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'drive-home-v2' });

    const finalise = draft => {
      const clean = sanitizeResult(draft, userLanguage);
      if (clean.recommendation !== 'go') {
        // Both of these are advice for a drive that has just been told not to
        // start. watch_for is the worse of the two: "signs to stop" under a
        // do-not-start call reads as terms on which to go anyway.
        clean.prep_checklist = [];
        clean.watch_for = [];
      } else {
        clean.safer_options = [];
      }
      clean.limits = [t(userLanguage, 'limits')];
      return clean;
    };

    const result = finalise(raw);

    const fields = [];
    const walk = (val, path) => {
      if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
      else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
    };
    // limits are ours, not the model's — nothing to check and nothing to repair.
    walk({ ...result, limits: undefined }, '');

    await runOutputGuard(result, {
      label: 'drive-home-v2',
      fields,
      supplied: suppliedFrom(req.body, minutes, cleanConditions),
      promise: PROMISE,
      guard: router.outputGuard,
      userLanguage,
      locale: withLocaleContext(userLocale, userCurrency, userRegion),
    });

    return res.json(finalise(result));
  } catch (err) {
    console.error('[drive-home] Error:', err?.message || err);
    return res.status(500).json({ error: t(req.body?.userLanguage, 'failed') });
  }
});

router.outputStandard = 'v2';
// drive-home-v2. Reviewed 2026-08-25. The old version searched the web and
// spoke about the route; this one knows nothing but what the driver typed, and
// the guard exists to keep it that way.
router.outputGuard = {
  prohibit: [
    'route_fact_from_place_names',       // "the I-90 stretch", "that road floods"
    'live_condition_claim',              // current traffic, weather, closures
    'numeric_risk_score',                // score, percentage, probability
    'safety_certification',              // "you'll be fine", "this drive is safe"
    'medical_or_impairment_diagnosis',
    'invented_driver_or_vehicle_fact',   // tires, fuel, sleep, passengers, phone
    'push_through_impairment_advice',
    'in_motion_device_instruction',      // use the phone/timer while driving
    'proceed_anyway_steps_under_a_hold', // prep steps beneath pause/do_not_drive
    'supplied_fact_upgraded',            // rain → "low-visibility"; evening + traffic → "commute"
    'invented_person_or_circumstance',   // a colleague, someone at home, a cafe to wait in
    'invented_recovery_interval',        // "wait 20-30 minutes"; coffee as proof of alertness
    'favorable_factor_that_is_not_one',  // an observation or a compliment listed under "what helps"
    'inferred_purpose_or_schedule',      // why they are going, when they must arrive, what slack they have
    'option_written_as_a_question',      // "Do you have access to…?" instead of an option they can take
    'generic_advice_not_tied_to_this',   // "check your mirrors", fuel checks, defensive-driving filler
  ],
  require: [
    'a_decision_the_driver_can_act_on',
    'grounded_in_what_was_reported',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
