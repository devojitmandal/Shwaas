import { z } from 'zod';
import { ExposureResult } from '../exposure/engine';
import { HouseholdProfile } from '../validation/profileSchema';
import { OutdoorWindow } from '../api/openMeteo';

export const routineItemSchema = z.object({
  title: z.string(),
  action: z.string(),
  estimatedExposureReduction: z.string(),
  timeOfDay: z.string(),
  rationale: z.string(),
});

export const indoorHackSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  estimatedExposureReduction: z.string(),
  mythCheck: z.string(),
});

export const sensitiveGuidanceSchema = z.object({
  alertLevel: z.string(),
  advice: z.string(),
  vulnerableGroupsCovered: z.array(z.string()),
});

export const planResponseSchema = z.object({
  headline: z.string(),
  executiveSummary: z.string(),
  dailyBriefing: z.string().optional(),
  recommendedActivitySchedule: z.array(z.string()).optional(),
  lowEmissionRoutine: z.array(routineItemSchema),
  indoorAirHacks: z.array(indoorHackSchema),
  sensitiveGroupGuidance: sensitiveGuidanceSchema,
  communityAction: z.string(),
  disclaimer: z.string(),
  dataProvenanceNote: z.string().optional(),
});

export type PlanResponse = z.infer<typeof planResponseSchema>;

export interface GenerateFallbackParams {
  cityName: string;
  profile: HouseholdProfile;
  exposure: ExposureResult;
  bestWindow: OutdoorWindow;
  worstWindow: OutdoorWindow;
  noSafeWindowAvailable?: boolean;
  alertHeadline?: string;
  language?: 'en' | 'hi' | 'kn';
}

/**
 * Deterministic rule-based fallback plan generator.
 * Operates offline or whenever the Gemini API is unreachable or rate-limited.
 */
export function generateFallbackPlan(params: GenerateFallbackParams): PlanResponse {
  const { cityName, profile, exposure, bestWindow, worstWindow, noSafeWindowAvailable, language = 'en' } = params;
  const isHighSmog = exposure.baselineDose > 150 || exposure.naqiCategory === 'Very Poor' || exposure.naqiCategory === 'Severe';
  const hasKids = profile.numKids > 0;
  const hasElderly = profile.numElderly > 0;

  const sensitiveGroups: string[] = [];
  if (hasKids) sensitiveGroups.push(language === 'hi' ? `${profile.numKids} बच्चे` : language === 'kn' ? `${profile.numKids} ಮಕ್ಕಳು` : `${profile.numKids} Child(ren)`);
  if (hasElderly) sensitiveGroups.push(language === 'hi' ? `${profile.numElderly} वरिष्ठ नागरिक` : language === 'kn' ? `${profile.numElderly} ಹಿರಿಯ ನಾಗರಿಕರು` : `${profile.numElderly} Senior Citizen(s)`);
  if (sensitiveGroups.length === 0) sensitiveGroups.push(language === 'hi' ? 'सामान्य नागरिक' : language === 'kn' ? 'ಸಾಮಾನ್ಯ ಜನರು' : 'General Population');

  if (language === 'hi') {
    return {
      headline: `${cityName} के लिए स्मॉग सुरक्षा कार्ययोजना`,
      executiveSummary: `${exposure.naqiCategory} श्रेणी की हवा में आपके परिवार के लिए सुरक्षा योजना (अनुमानित सांस भार: ~${exposure.totalInhaledMassUg} µg PM2.5/दिन)। दोपहर के समय, खिड़की सीलिंग और N95 मास्क पर ध्यान दें।`,
      dailyBriefing: `वर्तमान वायु गुणवत्ता ${exposure.naqiCategory} है। बिना बचाव के दैनिक सांस भार ${exposure.totalInhaledMassUg} µg/दिन है। सुझाई गई आदतों से लगभग ${exposure.avoidedInhaledMassUg} µg (${exposure.potentialReductionPercent}% कमी) प्रदूषण से बचा जा सकता है।`,
      recommendedActivitySchedule: [
        `06:00 AM – 09:30 AM: सुबह का स्मॉग पीक। खिड़कियां बंद रखें। सुबह की दौड़ और आउटडोर खेल रद्द करें।`,
        `01:00 PM – 03:00 PM: सबसे साफ समय (~${bestWindow.averageAqi} AQI)। आवश्यक कार्य और 15 मिनट का वेंटिलेशन इसी समय करें।`,
        `07:00 PM – 11:00 PM: शाम का ट्रैफिक स्मॉग। बेडरूम में HEPA प्यूरीफायर चलाएं।`,
      ],
      lowEmissionRoutine: [
        {
          title: 'यात्रा और बाहरी कार्यों का समय बदलें',
          action: noSafeWindowAvailable
            ? `आज कोई भी सुरक्षित समय नहीं है। घर से बाहर निकलना टालें। अनिवार्य हो तो ${bestWindow.startTime.substring(11, 16)} से ${bestWindow.endTime.substring(11, 16)} के बीच ही जाएं।`
            : `बाहरी कार्य दोपहर ${bestWindow.startTime.substring(11, 16)} से ${bestWindow.endTime.substring(11, 16)} (न्यूनतम AQI ~${bestWindow.averageAqi}) में करें। सुबह-शाम बाहर न जाएं।`,
          estimatedExposureReduction: `प्रदूषण इनहेलेशन में ~${Math.round(exposure.potentialReductionPercent * 0.45)}% की कमी`,
          timeOfDay: 'दोपहर का समय',
          rationale: 'दोपहर में धूप से हवा ऊपर उठती है और सतह पर प्रदूषण कम होता है।',
        },
        {
          title: 'सफर में N95 मास्क और खिड़कियां बंद',
          action: profile.commuteType === 'two_wheeler' || profile.commuteType === 'walk'
            ? 'प्रमाणित N95 मास्क पहनें। संभव हो तो मेट्रो रेल का उपयोग करें।'
            : 'गाड़ी के शीशे बंद रखें और एसी को रीसर्क्युलेशन मोड पर सेट करें।',
          estimatedExposureReduction: profile.maskType !== 'n95_kn95' ? '~75–85% प्रदूषण में कमी' : '~80–90% सुरक्षा बनी रहेगी',
          timeOfDay: 'सफर के दौरान',
          rationale: 'सड़क पर वाहनों के धुएं से निकलने वाले महीन कण कपड़े के मास्क से नहीं रुकते।',
        },
        {
          title: 'कचरा जलाने पर पूर्ण रोक और रसोई में एग्जॉस्ट',
          action: 'पत्तियां या प्लास्टिक बिल्कुल न जलाएं। खाना बनाते समय किचन एग्जॉस्ट अवश्य चलाएं।',
          estimatedExposureReduction: '+40 से +70 µg/m³ तक इनडोर प्रदूषण की रोकथाम',
          timeOfDay: 'रसोई / शाम',
          rationale: 'सर्दियों में रसोई का धुआं कमरे में तेजी से जमा होता है।',
        },
      ],
      indoorAirHacks: [
        {
          title: 'क्लीन-रूम सुरक्षित कमरा दृष्टिकोण',
          instructions: 'मुख्य बेडरूम को क्लीन-रूम बनाएं। दरवाजे के नीचे गीला कपड़ा या ड्राफ्ट स्टॉपर लगाएं।',
          estimatedExposureReduction: 'कमरे में स्मॉग प्रवेश में ~30–45% कमी',
          mythCheck: 'भ्रम: इनडोर पौधे स्मॉग पूरी तरह साफ करते हैं। सच: पौधे ऑक्सीजन देते हैं पर PM2.5 कणों को हटाने के लिए फिल्टर जरूरी है।',
        },
        {
          title: profile.hasPurifier ? 'प्यूरीफायर की सही स्थिति' : 'किफायती DIY बॉक्स-फैन फिल्टर',
          instructions: profile.hasPurifier
            ? 'प्यूरीफायर को फर्श से 1-2 फीट ऊपर दीवार से दूर रखें और मध्यम गति पर लगातार चलाएं।'
            : 'टेबल फैन या बॉक्स फैन पर MERV 13 या HEPA फिल्टर डक्ट टेप से चिपकाएं।',
          estimatedExposureReduction: 'इनडोर PM2.5 में ~70–75% तक कमी',
          mythCheck: 'भ्रम: कमरे में गीला तौलिया रखने से स्मॉग रुकता है। सच: गीले तौलिये से केवल नमी बढ़ती है, PM2.5 कण नहीं रुकते।',
        },
        {
          title: 'दोपहर का 15 मिनट वेंटिलेशन',
          instructions: noSafeWindowAvailable
            ? 'खिड़कियां दिनभर बंद रखें। कार्बन डाइऑक्साइड बढ़ने पर ही 5 मिनट खोलें।'
            : `दोपहर ${bestWindow.startTime.substring(11, 16)} से ${bestWindow.endTime.substring(11, 16)} के बीच केवल 15-20 मिनट खिड़कियां खोलें।`,
          estimatedExposureReduction: 'इनडोर हवा की ताजगी बनाए रखता है',
          mythCheck: 'भ्रम: सुबह खिड़की खोलना अच्छा है। सच: सर्दियों की सुबह में जमीन के पास सबसे ज्यादा जहरीला धुआं होता है।',
        },
      ],
      sensitiveGroupGuidance: {
        alertLevel: isHighSmog ? 'अति-सावधानी प्रोटोकॉल' : 'मानक स्मॉग सावधानियां',
        advice: isHighSmog
          ? 'बच्चे और बुजुर्ग बंद सुरक्षित कमरे में रहें। बाहर खेलने पर पूरी रोक लगाएं।'
          : 'दोपहर में हल्की गतिविधियां की जा सकती हैं। व्यस्त सड़कों पर मास्क अवश्य पहनें।',
        vulnerableGroupsCovered: sensitiveGroups,
      },
      communityAction: 'सोसायटी और आरडब्ल्यूए से कहें कि रात के सुरक्षा गार्डों को हीटर दें ताकि लकड़ी या कचरा न जलाना पड़े।',
      disclaimer: 'श्वास निर्णय सहायता मॉडल प्रदान करता है, यह चिकित्सीय सलाह नहीं है। व्यक्तिगत लक्षणों के लिए डॉक्टर से संपर्क करें।',
      dataProvenanceNote: 'ओपन-मेटियो वायुमंडलीय डेटा और ईपीए सांस समीकरणों पर आधारित।',
    };
  }

  if (language === 'kn') {
    return {
      headline: `${cityName} ನಗರಕ್ಕೆ ವೈಯಕ್ತಿಕ ಹೊಗೆ ರಕ್ಷಣಾ ಯೋಜನೆ`,
      executiveSummary: `${exposure.naqiCategory} ಮಟ್ಟದ ವಾಯುಮಾಲಿನ್ಯದಲ್ಲಿ ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ರಕ್ಷಣಾ ಯೋಜನೆ (ದೈನಂದಿನ ಅಂದಾಜು ಉಸಿರಾಟದ ಮಾಲಿನ್ಯ: ~${exposure.totalInhaledMassUg} µg PM2.5/ದಿನ). ಮಧ್ಯಾಹ್ನದ ಶುದ್ಧ ಗಾಳಿಯ ಕಿಟಕಿ ಮತ್ತು N95 ಮಾಸ್ಕ್ ಬಳಸಿ.`,
      dailyBriefing: `ಪ್ರಸ್ತುತ ವಾಯು ಗುಣಮಟ್ಟ ${exposure.naqiCategory} ಆಗಿದೆ. ಮುನ್ನೆಚ್ಚರಿಕೆ ಇಲ್ಲದಿದ್ದರೆ ದೈನಂದಿನ ಮಾಲಿನ್ಯ ಹೊರೆ ${exposure.totalInhaledMassUg} µg/ದಿನ. ಈ ಯೋಜನೆಯಿಂದ ~${exposure.avoidedInhaledMassUg} µg (~${exposure.potentialReductionPercent}% ಇಳಿಕೆ) ಮಾಲಿನ್ಯ ತಪ್ಪಿಸಬಹುದು.`,
      recommendedActivitySchedule: [
        `06:00 AM – 09:30 AM: ಬೆಳಗಿನ ತೀವ್ರ ಮಾಲಿನ್ಯ. ಕಿಟಕಿಗಳನ್ನು ಮುಚ್ಚಿರಿ. ಬೆಳಗಿನ ವಾಕಿಂಗ್ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳನ್ನು ರದ್ದುಗೊಳಿಸಿ.`,
        `01:00 PM – 03:00 PM: ಅತಿ ಶುದ್ಧ ಅವಧಿ (~${bestWindow.averageAqi} AQI). ಅಗತ್ಯ ಕೆಲಸಗಳನ್ನು ಈ ಸಮಯದಲ್ಲಿ ಮುಗಿಸಿ.`,
        `07:00 PM – 11:00 PM: ಸಂಜೆಯ ಟ್ರಾಫಿಕ್ ಹೊಗೆ. ಮಲಗುವ ಕೋಣೆಯಲ್ಲಿ ಏರ್ ಪ್ಯೂರಿಫೈಯರ್ ಚಲಾಯಿಸಿ.`,
      ],
      lowEmissionRoutine: [
        {
          title: 'ಹೊರಾಂಗಣ ಕೆಲಸಗಳ ಸಮಯ ಬದಲಿಸಿ',
          action: noSafeWindowAvailable
            ? `ಇಂದು ಯಾವುದೇ ಸುರಕ್ಷಿತ ಸಮಯವಿಲ್ಲ. ಹೊರಗೆ ಹೋಗುವುದನ್ನು ತಪ್ಪಿಸಿ. ಅನಿವಾರ್ಯವಾದರೆ ${bestWindow.startTime.substring(11, 16)} ರಿಂದ ${bestWindow.endTime.substring(11, 16)} ನಡುವೆ ಮಾತ್ರ ತೆರಳಿ.`
            : `ಹೊರಗಿನ ಕೆಲಸಗಳನ್ನು ಮಧ್ಯಾಹ್ನ ${bestWindow.startTime.substring(11, 16)} ರಿಂದ ${bestWindow.endTime.substring(11, 16)} ಅವಧಿಯಲ್ಲಿ ಮುಗಿಸಿ.`,
          estimatedExposureReduction: `ಮಾಲಿನ್ಯ ಸೇವನೆಯಲ್ಲಿ ~${Math.round(exposure.potentialReductionPercent * 0.45)}% ಇಳಿಕೆ`,
          timeOfDay: 'ಮಧ್ಯಾಹ್ನದ ಸಮಯ',
          rationale: 'ಮಧ್ಯಾಹ್ನದ ಬಿಸಿಲಿನಲ್ಲಿ ಮಾಲಿನ್ಯದ ಸಾಂದ್ರತೆ ಕಡಿಮೆಯಾಗಿರುತ್ತದೆ.',
        },
        {
          title: 'ಪ್ರಯಾಣದಲ್ಲಿ N95 ಮಾಸ್ಕ್ ಧರಿಸಿ',
          action: profile.commuteType === 'two_wheeler' || profile.commuteType === 'walk'
            ? 'ಪ್ರಮಾಣೀಕೃತ N95 ಮಾಸ್ಕ್ ಧರಿಸಿ. ಸಾಧ್ಯವಾದರೆ ಮೆಟ್ರೋ ರೈಲು ಬಳಸಿ.'
            : 'ಕಾರಿನ ಕಿಟಕಿಗಳನ್ನು ಮುಚ್ಚಿ ಮತ್ತು ಎಸಿ ರಿಸರ್ಕ್ಯುಲೇಶನ್ ಮೋಡ್ ಆನ್ ಮಾಡಿ.',
          estimatedExposureReduction: profile.maskType !== 'n95_kn95' ? '~75–85% ಮಾಲಿನ್ಯ ಕಡಿತ' : '~80–90% ರಕ್ಷಣೆ ಲಭ್ಯ',
          timeOfDay: 'ಪ್ರಯಾಣದ ಸಮಯ',
          rationale: 'ರಸ್ತೆಯ ವಾಹನಗಳ ಸೂಕ್ಷ್ಮ ಹೊಗೆ ಬಟ್ಟೆಯ ಮಾಸ್ಕ್ ಮೂಲಕ ಒಳನುಗ್ಗುತ್ತದೆ.',
        },
        {
          title: 'ಕಸ ಸುಡುವುದನ್ನು ನಿಲ್ಲಿಸಿ ಮತ್ತು ಅಡುಗೆಮನೆ ಎಕ್ಸಾಸ್ಟ್ ಬಳಸಿ',
          action: 'ಪ್ಲಾಸ್ಟಿಕ್ ಅಥವಾ ಎಲೆಗಳನ್ನು ಸುಡಬೇಡಿ. ಅಡುಗೆ ಮಾಡುವಾಗ ಎಕ್ಸಾಸ್ಟ್ ಫ್ಯಾನ್ ಚಲಾಯಿಸಿ.',
          estimatedExposureReduction: '+40 ರಿಂದ +70 µg/m³ ಒಳಾಂಗಣ ಮಾಲಿನ್ಯ ತಡೆ',
          timeOfDay: 'ಅಡುಗೆ / ಸಂಜೆ',
          rationale: 'ಚಳಿಗಾಲದಲ್ಲಿ ಅಡುಗೆಯ ಹೊಗೆ ಮನೆಯೊಳಗೆ ವೇಗವಾಗಿ ಸಂಗ್ರಹವಾಗುತ್ತದೆ.',
        },
      ],
      indoorAirHacks: [
        {
          title: 'ಕ್ಲೀನ್-ರೂಮ್ ಸುರಕ್ಷಿತ ಕೊಠಡಿ ತಂತ್ರ',
          instructions: 'ಮುಖ್ಯ ಮಲಗುವ ಕೋಣೆಯನ್ನು ಸುರಕ್ಷಿತ ವಲಯವನ್ನಾಗಿ ಮಾಡಿ. ಬಾಗಿಲ ಕೆಳಗೆ ಬಟ್ಟೆ ಇರಿಸಿ ಹೊಗೆ ಬಾರದಂತೆ ತಡೆಯಿರಿ.',
          estimatedExposureReduction: 'ಕೋಣೆಗೆ ಮಾಲಿನ್ಯ ನುಗ್ಗುವುದರಲ್ಲಿ ~30–45% ಇಳಿಕೆ',
          mythCheck: 'ತಪ್ಪು ಕಲ್ಪನೆ: ಒಳಾಂಗಣ ಗಿಡಗಳು ಮಾಲಿನ್ಯವನ್ನು ಶುದ್ಧೀಕರಿಸುತ್ತವೆ. ಸತ್ಯ: ಗಿಡಗಳು ಆಮ್ಲಜನಕ ನೀಡುತ್ತವೆ ಆದರೆ PM2.5 ಧೂಳನ್ನು ತೆಗೆಯಲು ಫಿಲ್ಟರ್ ಅಗತ್ಯ.',
        },
        {
          title: profile.hasPurifier ? 'ಪ್ಯೂರಿಫೈಯರ್ ಸರಿಯಾದ ಬಳಕೆ' : 'ಮನೆಯಲ್ಲೇ ತಯಾರಿಸುವ ಬಾಕ್ಸ್-ಫ್ಯಾನ್ ಫಿಲ್ಟರ್',
          instructions: profile.hasPurifier
            ? 'ಪ್ಯೂರಿಫೈಯರ್ ಅನ್ನು ನೆಲದಿಂದ 1-2 ಅಡಿ ಎತ್ತರದಲ್ಲಿರಿಸಿ ನಿರಂತರವಾಗಿ ಚಲಾಯಿಸಿ.'
            : 'ಫ್ಯಾನ್‌ಗೆ MERV 13 ಅಥವಾ HEPA ಫಿಲ್ಟರ್ ಅಂಟಿಸಿ ಸ್ವಚ್ಛ ಗಾಳಿ ಪಡೆಯಿರಿ.',
          estimatedExposureReduction: 'ಕೋಣೆಯ PM2.5 ಮಾಲಿನ್ಯದಲ್ಲಿ ~70–75% ಇಳಿಕೆ',
          mythCheck: 'ತಪ್ಪು ಕಲ್ಪನೆ: ಒದ್ದೆ ಟವಲ್ ಹೊಗೆಯನ್ನು ಹಿಡಿದಿಟ್ಟುಕೊಳ್ಳುತ್ತದೆ. ಸತ್ಯ: ಒದ್ದೆ ಟವಲ್ ಕೇವಲ ತೇವಾಂಶ ನೀಡುತ್ತದೆ, ಸೂಕ್ಷ್ಮ ಧೂಳನ್ನು ಹಿಡಿಯುವುದಿಲ್ಲ.',
        },
        {
          title: 'ಮಧ್ಯಾಹ್ನದ 15 ನಿಮಿಷಗಳ ಕಿಟಕಿ ತೆರೆಯುವಿಕೆ',
          instructions: noSafeWindowAvailable
            ? 'ದಿನವಿಡೀ ಕಿಟಕಿ ಮುಚ್ಚಿರಿ. ಉಸಿರುಗಟ್ಟಿದಾಗ ಮಾತ್ರ 5 ನಿಮಿಷ ತೆರೆಯಿರಿ.'
            : `ಮಧ್ಯಾಹ್ನ ${bestWindow.startTime.substring(11, 16)} ರಿಂದ ${bestWindow.endTime.substring(11, 16)} ಅವಧಿಯಲ್ಲಿ ಮಾತ್ರ 15-20 ನಿಮಿಷ ಕಿಟಕಿ ತೆರೆಯಿರಿ.`,
          estimatedExposureReduction: 'ಒಳಾಂಗಣ ಗಾಳಿಯನ್ನು ತಾಜಾವಾಗಿಡುತ್ತದೆ',
          mythCheck: 'ತಪ್ಪು ಕಲ್ಪನೆ: ಬೆಳಿಗ್ಗೆ ಕಿಟಕಿ ತೆರೆಯುವುದು ಒಳ್ಳೆಯದು. ಸತ್ಯ: ಚಳಿಗಾಲದ ಬೆಳಿಗ್ಗೆ ನೆಲಮಟ್ಟದಲ್ಲಿ ಅತಿ ಹೆಚ್ಚು ವಿಷಕಾರಿ ಹೊಗೆ ಇರುತ್ತದೆ.',
        },
      ],
      sensitiveGroupGuidance: {
        alertLevel: isHighSmog ? 'ಹೆಚ್ಚಿನ ಜಾಗರೂಕತೆ ಪ್ರೋಟೋಕಾಲ್' : 'ಸಾಮಾನ್ಯ ಮುನ್ನೆಚ್ಚರಿಕೆ',
        advice: isHighSmog
          ? 'ಮಕ್ಕಳು ಮತ್ತು ವೃದ್ಧರು ಮನೆಯೊಳಗೆ ಇರಬೇಕು. ಹೊರಾಂಗಣ ಆಟಗಳನ್ನು ನಿಲ್ಲಿಸಿ.'
          : 'ಮಧ್ಯಾಹ್ನದ ಸಮಯದಲ್ಲಿ ಸಾಮಾನ್ಯ ಚಟುವಟಿಕೆಗಳನ್ನು ಮಾಡಬಹುದು. ರಸ್ತೆಯಲ್ಲಿ ಮಾಸ್ಕ್ ಧರಿಸಿ.',
        vulnerableGroupsCovered: sensitiveGroups,
      },
      communityAction: 'ರಾತ್ರಿ ಕಾವಲುಗಾರರಿಗೆ ಹೀಟರ್ ಒದಗಿಸುವಂತೆ ಅಪಾರ್ಟ್‌ಮೆಂಟ್ ಸಮಿತಿಗೆ ತಿಳಿಸಿ, ಇದರಿಂದ ಅವರು ಕಸ ಅಥವಾ ಕಟ್ಟಿಗೆ ಸುಡುವುದು ತಪ್ಪುತ್ತದೆ.',
      disclaimer: 'ಶ್ವಾಸ ಕೇವಲ ನಿರ್ಧಾರ ಬೆಂಬಲ ನೀಡುತ್ತದೆ, ಇದು ವೈದ್ಯಕೀಯ ಸಲಹೆಯಲ್ಲ. ಆರೋಗ್ಯ ಸಮಸ್ಯೆಗಳಿಗೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
      dataProvenanceNote: 'ಓಪನ್-ಮೆಟಿಯೋ ವಾತಾವರಣ ದತ್ತಾಂಶ ಮತ್ತು ಇಪಿಎ ಸೂತ್ರಗಳ ಆಧಾರಿತ.',
    };
  }

  const lowEmissionRoutine = [
    {
      title: 'Reschedule Commute & Outdoor Tasks',
      action: noSafeWindowAvailable
        ? `No safe window exists today (all hours >200 AQI). Minimize outdoor travel; if mandatory, step out between ${bestWindow.startTime.substring(11, 16)} and ${bestWindow.endTime.substring(11, 16)}.`
        : `Shift outdoor errands to ${bestWindow.startTime.substring(11, 16)} – ${bestWindow.endTime.substring(11, 16)} (lowest AQI ~${bestWindow.averageAqi}). Strictly avoid ${worstWindow.startTime.substring(11, 16)} – ${worstWindow.endTime.substring(11, 16)}.`,
      estimatedExposureReduction: `Reduces estimated inhaled outdoor particle intake by ~${Math.round(exposure.potentialReductionPercent * 0.45)}%`,
      timeOfDay: 'Midday solar convective mixing',
      rationale: 'Thermal inversions trap ground-level vehicular exhaust in early morning and night; solar heating creates convective vertical mixing.',
    },
    {
      title: 'Commute Mode & Barrier Protection',
      action: profile.commuteType === 'two_wheeler' || profile.commuteType === 'walk'
        ? 'Wear a certified, snug-fitting N95/FFP2 respirator. If possible, transition trips to metro transit with closed air filtration.'
        : 'Keep vehicle windows rolled up and cabin ventilation locked to "Recirculation Mode" with AC filter.',
      estimatedExposureReduction: profile.maskType !== 'n95_kn95' ? 'Cuts outdoor inhaled particulate intake by ~75–85%' : 'Maintains ~80–90% real-world barrier filtration',
      timeOfDay: 'Commute hours',
      rationale: 'Roadway vehicle tailpipes produce concentrated ultrafine PM2.5 that penetrate ordinary cloth and surgical coverings.',
    },
    {
      title: 'Zero Waste Burning & Clean Kitchen Exhaust',
      action: 'Strictly prohibit burning leaves, plastic, or domestic waste. Run kitchen exhaust chimney during all cooking and use tight pot lids.',
      estimatedExposureReduction: 'Prevents localized indoor PM2.5 spikes of +40 to +70 µg/m³',
      timeOfDay: 'Cooking / Evening',
      rationale: 'Solid fuel combustion and unvented kitchen smoke accumulate rapidly inside winter residences.',
    },
  ];

  const indoorAirHacks = [
    {
      title: 'The Clean-Room Sanctuary Approach',
      instructions: 'Designate the primary bedroom as a sealed clean zone. Keep doors and windows weatherstripped with damp cloth draft-stoppers at door bottoms.',
      estimatedExposureReduction: 'Lowers room particle infiltration rate by ~30–45%',
      mythCheck: 'Myth: Indoor plants substantially purify winter PM2.5 smog. Fact: Houseplants oxygenate but do not remove fine suspended aerosols; mechanical filtration is required.',
    },
    {
      title: profile.hasPurifier ? 'Optimize Purifier Placement' : 'Affordable DIY Box-Fan Filter (Corsi-Rosenthal Method)',
      instructions: profile.hasPurifier
        ? 'Elevate your air purifier 1–2 feet above the floor and place it away from walls, running continuously on medium/high speed.'
        : 'Secure a 20×20 inch MERV 13 (or HEPA equivalent) furnace filter to the intake face of an ordinary box fan using duct tape.',
      estimatedExposureReduction: 'Cuts indoor airborne PM2.5 concentrations by ~70–75%',
      mythCheck: 'Myth: Placing wet towels around the room traps smog. Fact: Wet towels increase humidity without capturing microscopic PM2.5 particles.',
    },
    {
      title: 'Strategic Afternoon Air Flush',
      instructions: noSafeWindowAvailable
        ? 'Keep windows sealed throughout the day. Only crack windows for 5 minutes if indoor CO2 becomes stale, then reseal immediately.'
        : `Open windows for only 15–20 minutes between ${bestWindow.startTime.substring(11, 16)} and ${bestWindow.endTime.substring(11, 16)} when outdoor AQI is lowest, then reseal.`,
      estimatedExposureReduction: 'Flushes indoor CO2 without letting heavy nocturnal smog settle indoors',
      mythCheck: 'Myth: Leaving windows cracked all morning provides fresh air. Fact: Morning winter air contains peak ground-level pollutants.',
    },
  ];

  return {
    headline: `Actionable Smog Resilience Protocol for ${cityName}`,
    executiveSummary: `Targeted defense for your household under current ${exposure.naqiCategory} air quality (Estimated Inhaled Intake: ~${exposure.totalInhaledMassUg} µg PM2.5/day). Focus on afternoon errand windows, tight window sealing, and certified respiratory protection.`,
    dailyBriefing: `Ambient air quality is currently ${exposure.naqiCategory}. Estimated unmitigated inhaled PM2.5 burden is ${exposure.totalInhaledMassUg} µg/day. Implementing the recommended routine can avoid an estimated ${exposure.avoidedInhaledMassUg} µg of particulate intake (~${exposure.potentialReductionPercent}% reduction).`,
    recommendedActivitySchedule: [
      `06:00 AM – 09:30 AM: Peak smog trap. Keep doors/windows sealed. Cancel morning jogging and outdoor school sports.`,
      `01:00 PM – 03:00 PM: Cleanest available window (~${bestWindow.averageAqi} AQI). Conduct mandatory grocery runs and brief 15-min air flush.`,
      `07:00 PM – 11:00 PM: Evening traffic smog trap. Run bedroom HEPA air purifier in closed clean room.`,
    ],
    lowEmissionRoutine,
    indoorAirHacks,
    sensitiveGroupGuidance: {
      alertLevel: isHighSmog ? 'High Vigilance Protocol' : 'Standard Smog Precautions',
      advice: isHighSmog
        ? 'Vulnerable members (children and elderly) should remain indoors in sealed clean rooms. Halt all outdoor strenuous play.'
        : 'Moderate activities permitted during afternoon hours. Wear protective masks near busy roadway corridors.',
      vulnerableGroupsCovered: sensitiveGroups,
    },
    communityAction:
      'Urge your Resident Welfare Association (RWA) or society committee to provide electric room heaters to night security guards to eliminate open wood/garbage burning fires.',
    disclaimer:
      'Shwaas provides decision-support exposure models; this is not medical advice. Consult healthcare providers for personal respiratory symptoms.',
    dataProvenanceNote:
      'Modeled via Open-Meteo atmospheric chemistry estimates and deterministic EPA inhalation rate equations.',
  };
}
