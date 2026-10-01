export const LANG_META = {
  it: { label: "IT", speech: "it-IT", locale: "it-IT", dir: "ltr" },
  en: { label: "EN", speech: "en-US", locale: "en-GB", dir: "ltr" },
  ar: { label: "عربي", speech: "ar-SA", locale: "ar", dir: "rtl" },
}

const dict = {
  app_name: { it: "UNHCR Assist", en: "UNHCR Assist", ar: "مساعدة المفوضية" },
  your_request: { it: "La tua richiesta", en: "Your request", ar: "طلبك" },
  listen: { it: "Ascolta", en: "Listen", ar: "استمع" },
  stop: { it: "Ferma", en: "Stop", ar: "إيقاف" },
  status_pending_title: { it: "La tua richiesta è in verifica", en: "Your request is being checked", ar: "طلبك قيد المراجعة" },
  status_pending_body: {
    it: "Un operatore UNHCR sta controllando la proposta del sistema. Nessuna decisione viene presa solo da un computer.",
    en: "A UNHCR staff member is checking the system's proposal. No decision is made by a computer alone.",
    ar: "يقوم موظف من المفوضية بمراجعة اقتراح النظام. لا يتم اتخاذ أي قرار بواسطة الحاسوب وحده.",
  },
  status_approved_title: { it: "Aiuto approvato", en: "Assistance approved", ar: "تمت الموافقة على المساعدة" },
  status_approved_body: {
    it: "Un operatore ha verificato e confermato la tua richiesta.",
    en: "A staff member has checked and confirmed your request.",
    ar: "قام أحد الموظفين بمراجعة طلبك وتأكيده.",
  },
  status_rejected_title: { it: "Non approvata in questo ciclo", en: "Not approved this cycle", ar: "لم تتم الموافقة في هذه الدورة" },
  status_rejected_body: {
    it: "Un operatore ha esaminato la tua richiesta. Puoi chiedere una nuova revisione se qualcosa non è corretto.",
    en: "A staff member reviewed your request. You can ask for a new review if something is not right.",
    ar: "قام أحد الموظفين بمراجعة طلبك. يمكنك طلب مراجعة جديدة إذا كان هناك خطأ.",
  },
  status_escalated_title: { it: "In verifica speciale", en: "Under special review", ar: "قيد مراجعة خاصة" },
  status_escalated_body: {
    it: "Il tuo caso è stato affidato a un responsabile della protezione. Ti contatteremo presto.",
    en: "Your case has been passed to a protection officer. We will contact you soon.",
    ar: "تمت إحالة حالتك إلى مسؤول الحماية. سنتواصل معك قريبًا.",
  },
  amount: { it: "Importo", en: "Amount", ar: "المبلغ" },
  why_title: { it: "Perché questa decisione", en: "Why this decision", ar: "لما座 هذا القرار" },
  why_body: {
    it: "Queste sono le informazioni che hanno pesato di più.",
    en: "These are the details that mattered most.",
    ar: "هذه هي المعلومات الأكثر تأثيرًا.",
  },
  steps_title: { it: "A che punto sei", en: "Where you are", ar: "أين وصلت" },
  step_registered: { it: "Richiesta registrata", en: "Request registered", ar: "تم تسجيل الطلب" },
  step_ai: { it: "Valutazione automatica", en: "Automatic assessment", ar: "التقييم الآلي" },
  step_human: { it: "Verifica di un operatore", en: "Staff review", ar: "مراجعة الموظف" },
  step_payout: { it: "Ritiro dell'aiuto", en: "Collect assistance", ar: "استلام المساعدة" },
  step_not_paid: { it: "Nessuna erogazione", en: "No payment", ar: "لا يوجد صرف" },
  voucher_title: { it: "Il tuo codice di ritiro", en: "Your collection code", ar: "رمز الاستلام الخاص بك" },
  voucher_where: { it: "Dove", en: "Where", ar: "أين" },
  voucher_when: { it: "Quando", en: "When", ar: "متى" },
  voucher_bring: {
    it: "Porta con te la tessera di registrazione UNHCR.",
    en: "Bring your UNHCR registration card.",
    ar: "أحضر بطاقة التسجيل الخاصة بالمفوضية.",
  },
  copy: { it: "Copia", en: "Copy", ar: "نسخ" },
  copied: { it: "Copiato", en: "Copied", ar: "تم النسخ" },
  appeal_cta: { it: "Non sei d'accordo? Chiedi una revisione", en: "Disagree? Ask for a review", ar: "غير موافق؟ اطلب مراجعة" },
  appeal_title: { it: "Chiedi una nuova revisione", en: "Ask for a new review", ar: "اطلب مراجعة جديدة" },
  appeal_intro: {
    it: "Hai il diritto di chiedere che una persona riesamini la decisione. Non perderai il tuo posto in coda.",
    en: "You have the right to ask a person to look at the decision again. You will not lose your place.",
    ar: "لديك الحق في أن يطلب من شخص إعادة النظر في القرار. لن تفقد مكانك.",
  },
  appeal_reason: { it: "Cosa non è corretto?", en: "What is not right?", ar: "ما الذي ليس صحيحًا؟" },
  appeal_r_family: { it: "Il numero di persone nel nucleo è cambiato", en: "My household size has changed", ar: "تغيّر عدد أفراد أسرتي" },
  appeal_r_health: { it: "C'è un problema di salute non registrato", en: "A health problem is not recorded", ar: "هناك مشكلة صحية غير مسجّلة" },
  appeal_r_income: { it: "Le informazioni sul reddito sono sbagliate", en: "The income information is wrong", ar: "معلومات الدخل غير صحيحة" },
  appeal_r_other: { it: "Altro", en: "Other", ar: "أخرى" },
  appeal_message: { it: "Vuoi aggiungere qualcosa? (facoltativo)", en: "Anything to add? (optional)", ar: "هل تريد إضافة شيء؟ (اختياري)" },
  appeal_send: { it: "Invia richiesta", en: "Send request", ar: "إرسال الطلب" },
  appeal_cancel: { it: "Annulla", en: "Cancel", ar: "إلغاء" },
  appeal_sent_title: { it: "Richiesta di revisione inviata", en: "Review request sent", ar: "تم إرسال طلب المراجعة" },
  appeal_sent_body: {
    it: "Un operatore riesaminerà il tuo caso con priorità.",
    en: "A staff member will review your case with priority.",
    ar: "سيقوم أحد الموظفين بمراجعة حالتك بأولوية.",
  },
  human_note: {
    it: "Il sistema aiuta gli operatori a decidere, ma la decisione finale è sempre di una persona.",
    en: "The system helps staff decide, but the final decision is always made by a person.",
    ar: "يساعد النظام الموظفين على اتخاذ القرار، لكن القرار النهائي دائمًا يتخذه شخص.",
  },
  help_title: { it: "Hai bisogno di aiuto?", en: "Need help?", ar: "هل تحتاج إلى مساعدة؟" },
  help_body: {
    it: "Help desk nel campo, lun–ven 08:00–16:00. Il servizio è gratuito.",
    en: "Help desk in the camp, Mon–Fri 08:00–16:00. The service is free.",
    ar: "مكتب المساعدة في المخيم، من الاثنين إلى الجمعة 08:00–16:00. الخدمة مجانية.",
  },
}

export function t(key, lang = "it") {
  return dict[key]?.[lang] ?? dict[key]?.["it"] ?? key
}
