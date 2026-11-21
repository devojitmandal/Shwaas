export type CommunityProtocolId = 'rwa' | 'schools' | 'ward';

export interface ProtocolItem {
  title: string;
  desc: string;
  impact: string;
}

export interface CommunityProtocol {
  id: CommunityProtocolId;
  tabLabel: string;
  title: string;
  subtitle: string;
  items: ProtocolItem[];
}

export const COMMUNITY_PROTOCOLS: Record<CommunityProtocolId, CommunityProtocol> = {
  rwa: {
    id: 'rwa',
    tabLabel: '1. Residential Societies (RWAs)',
    title: 'Residential Societies & RWA Action Protocol',
    subtitle: 'Immediate operational guidelines for building management committees and apartment complexes.',
    items: [
      {
        title: 'Supply Electric Room Heaters to Night Security Guards',
        desc: 'Issue radiant or oil-filled electric heaters to all guard booths and night patrol staff. Strictly eliminate open drum fires, wood scrap burning, and dried leaf disposal fires.',
        impact: 'Eliminates localized ground-level toxic smoke spikes of +300 µg/m³ at society entry gates.',
      },
      {
        title: 'Enforce Wet-Mopping of Society Driveways & Common Areas',
        desc: 'Ban dry brooms and leaf blowers which aerosolize settled respirable toxic dust back into the air. Instruct housekeeping staff to use damp mops or water mist sweeping.',
        impact: 'Reduces re-suspended road and walkway PM10 dust by up to 60%.',
      },
      {
        title: 'Protect Outdoor Workers with Certified N95 Respirators',
        desc: 'Issue certified N95/FFP2 masks to society gardeners, sanitation workers, and security personnel during peak smog alerts.',
        impact: 'Lowers occupational particulate inhalation burden by ~75–85%.',
      },
      {
        title: 'Restrict Unnecessary Vehicle Idling Inside Society Gates',
        desc: 'Enforce strict 60-second engine cut-off rules for delivery vans, taxis, and resident vehicles waiting at drop-off zones.',
        impact: 'Reduces ground-level vehicle exhaust plumes in enclosed residential basements and lobbies.',
      },
      {
        title: 'Establish a Centralized "Clean-Air Room" in Club House',
        desc: 'Designate the society library, boardroom, or community room as an air-conditioned, HEPA-purified sanctuary for senior residents, asthmatics, and children during peak morning smog.',
        impact: 'Provides clean air refuge for vulnerable residents without private home air purifiers.',
      },
    ],
  },
  schools: {
    id: 'schools',
    tabLabel: '2. Schools & Daycares',
    title: 'School & Daycare Administrative Protocol',
    subtitle: 'Mitigation measures to protect respiratory health in growing children during severe smog.',
    items: [
      {
        title: 'Cancel Morning Outdoor Assemblies & Sports',
        desc: 'Move morning assemblies, physical training (PT), and sports into indoor auditoriums or postpone to afternoon (1:00 PM – 3:00 PM) when atmospheric dispersion is highest.',
        impact: 'Protects children from strenuous aerobic breathing during peak early morning thermal inversions.',
      },
      {
        title: 'Indoor Activity Alternatives',
        desc: 'Replace outdoor running games with yoga, table tennis, or indoor board games in rooms with closed windows.',
        impact: 'Keeps minute ventilation rate lower (~10 L/min vs >35 L/min during heavy running).',
      },
      {
        title: 'Parent Smog Notifications & Mask Guidance',
        desc: 'Send daily morning air quality alerts via parent portal, recommending snug-fitting N95 masks for school bus commuters.',
        impact: 'Empowers parents to equip children with verified high-filtration respirators.',
      },
      {
        title: 'Special Protections for Children with Asthma',
        desc: 'Ensure school infirmaries stock backup inhalers, nebulizers, and a running HEPA air purifier unit.',
        impact: 'Provides immediate clinical stabilization for students experiencing smog-induced wheezing.',
      },
    ],
  },
  ward: {
    id: 'ward',
    tabLabel: '3. Local Communities',
    title: 'Local Community & Neighborhood Ward Protocol',
    subtitle: 'Civic actions neighbors can coordinate across wards and municipal zones.',
    items: [
      {
        title: 'Community Reporting of Illegal Waste Burning Incidents',
        desc: 'Encourage residents to photograph and report open municipal garbage or leaf burning directly to the municipal emergency helpline (e.g., CPCB Sameer App / MCD 311).',
        impact: 'Accelerates civic enforcement against high-emission open combustion.',
      },
      {
        title: 'Organize Neighborhood Carpooling & Metro Feeder Shuttles',
        desc: 'Pool daily commutes to local metro stations using shared e-rickshaws or pooled rides rather than individual cold-start car trips.',
        impact: 'Reduces private vehicle trips during heavy congestion hours.',
      },
      {
        title: 'Support Clean Heating for Street Vendors & Daily Wage Workers',
        desc: 'Partner with local merchant associations to provide sheltered warming kiosks with electric heating for evening market vendors.',
        impact: 'Eliminates open street bonfire smog plumes in crowded shopping markets.',
      },
      {
        title: 'Public Smog Awareness & Dispelling Misconceptions',
        desc: 'Share verified science debunking myths (e.g. wet cloth masks or simple houseplants do not eliminate respirable fine PM2.5).',
        impact: 'Encourages evidence-based community self-defense.',
      },
    ],
  },
};

export function formatCommunityShareText(cityName: string, currentAqi: number): string {
  return (
    `Shwaas (श्वास) Community Clean Air Action Plan for ${cityName} (Current NAQI: ${currentAqi})\n\n` +
    `🏢 1. Residential Societies: Ban open waste burning, distribute electric room heaters to night security staff, and mandate wet-mopping.\n` +
    `🏫 2. Schools: Postpone outdoor morning sports to afternoon solar dispersion window; seal classroom windows.\n` +
    `🏘️ 3. Communities: Report illegal waste burning to municipal helpline and establish local metro-shuttle carpools.\n\n` +
    `Generated with Shwaas (श्वास) — हर सांस का हिसाब • shwaas.in`
  );
}
