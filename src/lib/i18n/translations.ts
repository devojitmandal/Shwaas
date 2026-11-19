export type SupportedLanguage = 'en' | 'hi' | 'kn';

export interface TranslationDictionary {
  tagline: string;
  myHousehold: string;
  communityMode: string;
  heroSubtitle: string;
  searchCityPlaceholder: string;
  detectLocation: string;
  relativeScore: string;
  dailyBudgetLedger: string;
  budgetDescription: string;
  perPersonBudgets: string;
  whatIfToggles: string;
  photoAuditTitle: string;
  photoAuditSubtitle: string;
  todaysPlanTitle: string;
  readAloud: string;
  stopReadAloud: string;
  speaking: string;
  speechNotSupported: string;
  hoursOutdoors: string;
  refreshPlan: string;
  shareWhatsApp: string;
  withinReference: string;
  moderateElevation: string;
  severeBurden: string;
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    tagline: 'Every Breath Accounted For',
    myHousehold: 'My Household',
    communityMode: 'Community Mode',
    heroSubtitle: 'A deterministic GenAI assistant helping families and communities navigate severe winter smog with personal breath budgets, room air modeling, and quantified exposure reductions.',
    searchCityPlaceholder: 'Search Indian city or town...',
    detectLocation: 'Detect Live Location',
    relativeScore: 'Relative Exposure-Management Score',
    dailyBudgetLedger: 'Daily Breath Budget Ledger',
    budgetDescription: 'Calibrated against the WHO 24-hr guideline benchmark (100 relative points = reference intake of 24 hours at 15 µg/m³).',
    perPersonBudgets: 'Per-Person Household Breath Budgets',
    whatIfToggles: 'Live What-If Mitigation Toggles (Updates All Members)',
    photoAuditTitle: 'Visual Infiltration & Source Inspection',
    photoAuditSubtitle: 'Upload or capture a photo of your window frame or room. Gemini Vision identifies gaps and cooking emissions, which our mass-balance model translates into ranked fixes scored in Breath Budget points.',
    todaysPlanTitle: "Today's Personalized Smog Plan",
    readAloud: 'Read Aloud',
    stopReadAloud: 'Stop Reading',
    speaking: 'Speaking...',
    speechNotSupported: 'Speech synthesis is not supported on this browser.',
    hoursOutdoors: 'Daily Outdoor Hours',
    refreshPlan: 'Regenerate Plan',
    shareWhatsApp: 'Share WhatsApp Card',
    withinReference: 'Within Reference Range',
    moderateElevation: 'Moderate Elevation',
    severeBurden: 'Severe Particle Burden',
  },
  hi: {
    tagline: 'हर सांस का हिसाब',
    myHousehold: 'मेरा परिवार',
    communityMode: 'सामुदायिक मोड',
    heroSubtitle: 'गंभीर सर्दियों के स्मॉग से परिवारों और सोसायटियों की सुरक्षा के लिए व्यक्तिगत ब्रेथ बजट, इनडोर रूम मॉडलिंग और वैज्ञानिक कार्ययोजना।',
    searchCityPlaceholder: 'शहर या कस्बा खोजें...',
    detectLocation: 'वर्तमान स्थान खोजें',
    relativeScore: 'सापेक्ष प्रदूषण नियंत्रण स्कोर',
    dailyBudgetLedger: 'दैनिक ब्रेथ बजट खाता',
    budgetDescription: 'WHO 24-घंटे के दिशानिर्देश (100 अंक = 15 µg/m³ पर 24 घंटे की सामान्य सांस) के आधार पर गणना।',
    perPersonBudgets: 'परिवार के प्रत्येक सदस्य का अलग ब्रेथ बजट',
    whatIfToggles: 'लाइव सिमुलेशन टॉगल (सभी सदस्यों का बजट अपडेट होगा)',
    photoAuditTitle: 'कमरे और खिड़कियों का AI फोटो ऑडिट',
    photoAuditSubtitle: 'खिड़की के फ्रेम या कमरे की फोटो अपलोड करें। जेमिनी विजन दरारों और धुएं के स्रोतों की पहचान कर ब्रेथ बजट अंकों में सुधार सुझाता है।',
    todaysPlanTitle: 'आज की व्यक्तिगत स्मॉग कार्ययोजना',
    readAloud: 'बोलकर सुनाएं',
    stopReadAloud: 'रोकें',
    speaking: 'सुना रहा है...',
    speechNotSupported: 'इस ब्राउज़र में स्पीच की सुविधा उपलब्ध नहीं है।',
    hoursOutdoors: 'घर से बाहर का समय',
    refreshPlan: 'योजना पुनः बनाएं',
    shareWhatsApp: 'व्हाट्सएप कार्ड शेयर करें',
    withinReference: 'सुरक्षित सीमा में',
    moderateElevation: 'मध्यम प्रदूषण भार',
    severeBurden: 'गंभीर स्मॉग जोखिम',
  },
  kn: {
    tagline: 'ಪ್ರತಿ ಉಸಿರಿನ ಲೆಕ್ಕ',
    myHousehold: 'ನನ್ನ ಕುಟುಂಬ',
    communityMode: 'ಸಮುದಾಯ ಮೋಡ್',
    heroSubtitle: 'ಚಳಿಗಾಲದ ತೀವ್ರ ಹೊಗೆಯಿಂದ ಕುಟುಂಬಗಳನ್ನು ರಕ್ಷಿಸಲು ವೈಯಕ್ತಿಕ ಉಸಿರಾಟದ ಬಜೆಟ್ ಮತ್ತು ಕೋಣೆಯ ಮಾದರಿಯನ್ನು ಒದಗಿಸುವ AI ಸಹಾಯಕ.',
    searchCityPlaceholder: 'ನಗರ ಅಥವಾ ಊರನ್ನು ಹುಡುಕಿ...',
    detectLocation: 'ಲೈವ್ ಸ್ಥಳವನ್ನು ಗುರುತಿಸಿ',
    relativeScore: 'ಮಾಲಿನ್ಯ ನಿಯಂತ್ರಣ ಸೂಚ್ಯಂಕ',
    dailyBudgetLedger: 'ದೈನಂದಿನ ಉಸಿರಾಟದ ಬಜೆಟ್ ಲೆಕ್ಕ',
    budgetDescription: 'WHO 24-ಗಂಟೆಗಳ ಮಾರ್ಗಸೂಚಿಗೆ ಅನುಗುಣವಾಗಿ ಲೆಕ್ಕಾಚಾರ (100 ಅಂಕಗಳು = 15 µg/m³ ನಲ್ಲಿ 24 ಗಂಟೆಗಳ ಪ್ರಮಾಣ).',
    perPersonBudgets: 'ಕುಟುಂಬದ ಪ್ರತಿಯೊಬ್ಬ ಸದಸ್ಯರ ಪ್ರತ್ಯೇಕ ಬಜೆಟ್',
    whatIfToggles: 'ಲೈವ್ ಸಿಮ್ಯುಲೇಶನ್ ಟಾಗಲ್‌ಗಳು (ಎಲ್ಲಾ ಸದಸ್ಯರ ಬಜೆಟ್ ನವೀಕರಿಸುತ್ತದೆ)',
    photoAuditTitle: 'ಕೋಣೆ ಮತ್ತು ಕಿಟಕಿಗಳ AI ಫೋಟೋ ಆಡಿಟ್',
    photoAuditSubtitle: 'ಕಿಟಕಿ ಅಥವಾ ಕೋಣೆಯ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ಜೆಮಿನಿ ವಿಷನ್ ಕಿಟಕಿ ಸಂದುಗಳನ್ನು ಗುರುತಿಸಿ ಉಸಿರಾಟದ ಬಜೆಟ್ ಅಂಕಗಳಲ್ಲಿ ಪರಿಹಾರಗಳನ್ನು ಸೂಚಿಸುತ್ತದೆ.',
    todaysPlanTitle: 'ಇಂದಿನ ವೈಯಕ್ತಿಕ ಹೊಗೆ ನಿರ್ವಹಣಾ ಯೋಜನೆ',
    readAloud: 'ಓದಿ ಕೇಳಿಸಿ',
    stopReadAloud: 'ನಿಲ್ಲಿಸಿ',
    speaking: 'ಓದುತ್ತಿದೆ...',
    speechNotSupported: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ವಾಕ್ ಸೌಲಭ್ಯ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ.',
    hoursOutdoors: 'ಹೊರಾಂಗಣ ಸಮಯ',
    refreshPlan: 'ಯೋಜನೆಯನ್ನು ಮರುಸೃಷ್ಟಿಸಿ',
    shareWhatsApp: 'ವಾಟ್ಸಾಪ್ ಕಾರ್ಡ್ ಹಂಚಿಕೊಳ್ಳಿ',
    withinReference: 'ಉಲ್ಲೇಖಿತ ಮಿತಿಯಲ್ಲಿದೆ',
    moderateElevation: 'ಮಧ್ಯಮ ಮಾಲಿನ್ಯ ಭಾದೆ',
    severeBurden: 'ತೀವ್ರ ಮಾಲಿನ್ಯ ಹೊರೆ',
  },
};
