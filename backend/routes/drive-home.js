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
    limitLive: 'Drive Home is not a live traffic, weather, or road-condition service.',
    limitReported: 'This assessment uses only the conditions you reported.',
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
    limitLive: 'Drive Home no es un servicio en vivo de tráfico, clima o estado de las carreteras.',
    limitReported: 'Esta evaluación usa únicamente las condiciones que reportaste.',
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
    limitLive: 'Drive Home n’est pas un service en direct de trafic, météo ou état des routes.',
    limitReported: 'Cette évaluation utilise uniquement les conditions que vous avez signalées.',
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
    limitLive: 'Drive Home ist kein Live-Dienst für Verkehr, Wetter oder Straßenzustand.',
    limitReported: 'Diese Einschätzung verwendet nur die von dir gemeldeten Bedingungen.',
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
    limitLive: 'Drive Home não é um serviço em tempo real de trânsito, clima ou condições da via.',
    limitReported: 'Esta avaliação usa apenas as condições que você informou.',
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
    limitLive: 'Drive Home ليس خدمة مباشرة لحركة المرور أو الطقس أو حالة الطرق.',
    limitReported: 'يعتمد هذا التقييم فقط على الظروف التي أبلغت عنها.',
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
    limitLive: 'Drive Home 不是实时交通、天气或道路状况服务。',
    limitReported: '此评估仅使用你报告的情况。',
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
    limitLive: 'Drive Home はリアルタイムの交通・天気・道路状況サービスではありません。',
    limitReported: 'この評価は、あなたが報告した状況だけを使っています。',
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
    limitLive: 'Drive Home은 실시간 교통, 날씨 또는 도로 상태 서비스가 아닙니다.',
    limitReported: '이 평가는 사용자가 보고한 조건만 사용합니다.',
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
    limitLive: 'Drive Home не является сервисом реального времени для трафика, погоды или состояния дорог.',
    limitReported: 'Эта оценка использует только те условия, о которых вы сообщили.',
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
    limitLive: 'Drive Home लाइव ट्रैफिक, मौसम या सड़क की स्थिति की सेवा नहीं है।',
    limitReported: 'यह आकलन केवल आपके बताए हुए हालात पर आधारित है।',
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
    limitLive: 'Drive Home ไม่ใช่บริการข้อมูลการจราจร สภาพอากาศ หรือสภาพถนนแบบเรียลไทม์',
    limitReported: 'การประเมินนี้ใช้เฉพาะสภาพการณ์ที่คุณแจ้งไว้เท่านั้น',
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
    limitLive: 'Drive Home không phải là dịch vụ giao thông, thời tiết hay tình trạng đường theo thời gian thực.',
    limitReported: 'Đánh giá này chỉ dựa trên các điều kiện bạn đã cung cấp.',
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
    factors_harder: cleanList(raw?.factors_harder, 6),
    factors_in_favor: cleanList(raw?.factors_in_favor, 5),
    before_you_decide: blank(raw?.before_you_decide) ? null : compactString(raw.before_you_decide, 500),
    safer_options: cleanList(raw?.safer_options, 6),
    prep_checklist: cleanList(raw?.prep_checklist, 7),
    watch_for: cleanList(raw?.watch_for, 6),
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
5. Telling the driver to use a phone, timer or this tool while the vehicle is moving.`;
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
        limits: [
          t(userLanguage, 'limitLive'),
          t(userLanguage, 'limitReported'),
        ],
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
  "main_concern": "Single most important concern in one sentence, or null",
  "factors_harder": ["Only factors actually supplied by the user — at most 5, one short line each"],
  "factors_in_favor": ["Only genuinely favorable supplied facts; do not invent any — at most 4, one short line each"],
  "before_you_decide": "One concrete decision boundary or missing fact in one or two sentences, or null. Do not open by restating the field name — the reader can already see the heading",
  "safer_options": ["Practical alternatives when recommendation is pause or do_not_drive — at most 5, one short line each"],
  "prep_checklist": ["Short pre-departure actions when recommendation is go — at most 6, one short line each"],
  "watch_for": ["General signs/conditions that should make the driver stop or reassess, phrased without pretending they are currently present — at most 5, one short line each"],
  "limits": [
    "Drive Home is not a live traffic, weather, or road-condition service.",
    "This assessment uses only the conditions the user reported."
  ]
}

The value of "recommendation" is an identifier, not prose. Return it as exactly one of the English strings go, pause or do_not_drive whatever language the rest of the response is written in. Everything else in the JSON is prose and is written in the reader's language.

For recommendation 'go':
- safer_options should normally be [].
- prep_checklist may contain 3-6 simple before-departure actions.
For 'pause' or 'do_not_drive':
- do not give instructions for proceeding with the drive.
- prep_checklist should be [].
- safer_options should be practical and non-dramatic.

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
      if (clean.recommendation !== 'go') clean.prep_checklist = [];
      else clean.safer_options = [];
      clean.limits = [t(userLanguage, 'limitLive'), t(userLanguage, 'limitReported')];
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
  ],
  require: [
    'a_decision_the_driver_can_act_on',
    'grounded_in_what_was_reported',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
