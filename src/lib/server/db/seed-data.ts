import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { clients, opportunities, activities, users, stages } from './schema';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..', '..');
const DATABASE_URL = process.env.DATABASE_URL || join(projectRoot, 'data', 'sqlite.db');

const sqlite = new Database(DATABASE_URL);
const db = drizzle(sqlite);

async function seedData() {
	console.log('🌱 Seeding opportunity data...');

	// Get the admin user ID
	const [adminUser] = await db.select().from(users).where(eq(users.email, 'admin@example.com'));
	if (!adminUser) {
		console.error('Admin user not found. Run db:seed first.');
		process.exit(1);
	}

	// Get stages
	const allStages = await db.select().from(stages);
	const getStageId = (name: string) => {
		const stage = allStages.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
		return stage?.id || 1;
	};

	// ==================== CLIENT 1: Star Energy Geothermal ====================
	const [existingStarEnergy] = await db.select().from(clients).where(eq(clients.name, 'Star Energy Geothermal'));
	let starEnergy;
	if (existingStarEnergy) {
		starEnergy = existingStarEnergy;
		console.log('  Star Energy Geothermal already exists, skipping client...');
	} else {
		console.log('  Creating Star Energy Geothermal...');
		[starEnergy] = await db.insert(clients).values({
			name: 'Star Energy Geothermal',
			industry: 'Energy',
			size: 'enterprise',
			region: 'Indonesia',
			primaryContact: 'Rufus (CTO)',
			contactEmail: 'wahi@starenergy.co.id',
			contactPhone: '+62 21 5306711',
			notes: `Champion: Suratno Wahidin, B. Luthfi
Key Liaison: wahi@starenergy.co.id; BadruzL@starenergy.co.id
SRKK Engagement Team: Shawn Soh, Lai Yuen Seng
Lead Source: Partner/MSFT/Event - MSFT
Partner PIC: Fitria`,
			createdById: adminUser.id
		}).returning();
	}

	// Star Energy Opportunity
	const [existingStarEnergyOpp] = await db.select().from(opportunities).where(eq(opportunities.title, 'Star Energy - Microsoft Fabric Data Platform POC'));
	if (existingStarEnergyOpp) {
		console.log('  Star Energy opportunity already exists, skipping...');
	} else {
		const [starEnergyOpp] = await db.insert(opportunities).values({
			title: 'Star Energy - Microsoft Fabric Data Platform POC',
			description: `Project Background:
- Key Pain Points: The company required AI solution to get a better insight for their data in their system.
- Objectives: To implement AI initiative for the company using Microsoft Fabric
- Initiatives/Solutions:
  * Update SEG's MEA to add Copilot SKU for M365 and Copilot Studio
  * Running Fabric POC to test out Copilot's capability for future development before adding Fabric SKU into their MEA

Engagement Summary:
- POC started at 28 Nov. 2025 – 21 Jan. 2026
- POV Proposal, POV Report, POV Knowledge Transfer completed

Next steps: Sign off document – need to convince SEG (Atur) related to POC Scope

Potential roadblocks:
- Technical expectation to deploy to Production Site
- Lack of knowledge of Msft Fabric
- Management expectation to AI solution`,
			clientId: starEnergy.id,
			stageId: getStageId('negotiation'),
			ownerId: adminUser.id,
			value: 50000,
			probability: 80,
			expectedCloseDate: '2026-02-28',
			fabricWorkloads: ['Lakehouse', 'Power BI', 'Data Factory', 'Notebooks'],
			estimatedServicesCost: 50000,
			migrationSource: 'Greenfield',
			competitor: 'None',
			projectDuration: '1-3 months',
			leadSource: 'Partner/MSFT/Event',
			partnerPic: 'Fitria',
			authorityName: 'Atur (Management)',
			authorityContact: '+62 21 5306711',
			authorityEmail: 'atur@starenergy.co.id',
			championName: 'Suratno Wahidin, B. Luthfi',
			championContact: '+62 21 5306711',
			championEmail: 'wahi@starenergy.co.id',
			engagementTeam: 'Shawn Soh, Lai Yuen Seng',
			immediateNextStep: 'Sign off document – need to convince SEG (Atur) related to POC Scope',
			timeline: 'Feb 2026'
		}).returning();

		// Star Energy Activities
		await db.insert(activities).values([
			{
				opportunityId: starEnergyOpp.id,
				userId: adminUser.id,
				type: 'meeting',
				title: 'Discovery meeting',
				description: 'Initial discovery meeting with Star Energy team',
				completedAt: '2025-11-07'
			},
			{
				opportunityId: starEnergyOpp.id,
				userId: adminUser.id,
				type: 'proposal',
				title: 'POC Proposal submitted',
				description: 'POC Proposal document submitted and approved',
				completedAt: '2025-11-28'
			},
			{
				opportunityId: starEnergyOpp.id,
				userId: adminUser.id,
				type: 'demo',
				title: 'POC Execution',
				description: 'POC started - running from 28 Nov 2025 to 21 Jan 2026',
				completedAt: '2025-11-28'
			},
			{
				opportunityId: starEnergyOpp.id,
				userId: adminUser.id,
				type: 'note',
				title: 'POV Report approval',
				description: 'POV Report approved by client',
				completedAt: '2026-01-23'
			},
			{
				opportunityId: starEnergyOpp.id,
				userId: adminUser.id,
				type: 'meeting',
				title: 'Knowledge Transfer session',
				description: 'KT document delivered - SEG-KT-final.pdf',
				completedAt: '2026-01-23'
			},
			{
				opportunityId: starEnergyOpp.id,
				userId: adminUser.id,
				type: 'note',
				title: 'Next step: Tech Sharing Session',
				description: 'Wednesday, 28 Jan 2026 - Tech Sharing Session and chance for discovery',
				scheduledAt: '2026-01-28'
			}
		]);
	}

	// ==================== CLIENT 2: Bank Permata ====================
	const [existingBankPermata] = await db.select().from(clients).where(eq(clients.name, 'Bank Permata'));
	let bankPermata;
	if (existingBankPermata) {
		bankPermata = existingBankPermata;
		console.log('  Bank Permata already exists, skipping client...');
	} else {
		console.log('  Creating Bank Permata...');
		[bankPermata] = await db.insert(clients).values({
			name: 'Bank Permata',
			industry: 'Financial Services',
			size: 'enterprise',
			region: 'Indonesia',
			primaryContact: 'Tri Priadhi Ashari',
			contactEmail: 'tri.ashari@permatabank.co.id',
			contactPhone: '+62 812-1000-069',
			notes: `Champion: Muhammad Iqbal Pratama
Key Liaison: muhammad.ipratama@permatabank.co.id, +62 815-1401-1292
SRKK Engagement Team: Ardian, Jackson, Gilbert, Azari
Lead Source: Event
Partner PIC: Andra Jayanthi (MSFT)`,
			createdById: adminUser.id
		}).returning();
	}

	// Bank Permata Opportunity
	const [existingBankPermataOpp] = await db.select().from(opportunities).where(eq(opportunities.title, 'Bank Permata - Multi Cloud Data Platform (Fabric POV)'));
	if (existingBankPermataOpp) {
		console.log('  Bank Permata opportunity already exists, skipping...');
	} else {
		const [bankPermataOpp] = await db.insert(opportunities).values({
			title: 'Bank Permata - Multi Cloud Data Platform (Fabric POV)',
			description: `Project Background:
- Key Pain Points:
  * Requirement for analytic platform since on premise big data platform (Cloudera) has reach peak capacity
  * SAS ML platform outdated and needs to be replaced for future ready challenges in Banking use cases
- Objectives: Explore multi cloud solution for data analytic requirements (Data Engineering, BI, ML)
- Initiatives/Solutions: Running POC to test out Fabric Performance

Additional Information:
- Budget: targeted at $150k/year included subscription & services
- Data size way too big, Azure calculator recommendation was at F2048, but Permata's team request at F64 & F128 (split processing cluster)
- Competitors: AWS, GCP

Engagement Summary:
- Permata Bank decided to go for multi cloud solution, they will combine the solution for DE, ML, BI which suit for them
- POV Done, Result was acceptable (completed Dec 2025)

Timeline:
- Jan: Decision to go for Multi Cloud Solution (C level)
- Jan: IT Infra, Security, Data analyst start puzzling for proper combination
- Mar-Jun: Project bidding – Proposals – Negotiation – Winner announcement
- Jul-Dec: Project delivery

Next steps: Follow up regularly with Tri or Iqbal for upcoming information`,
			clientId: bankPermata.id,
			stageId: getStageId('proposal'),
			ownerId: adminUser.id,
			value: 330000,
			probability: 60,
			expectedCloseDate: '2026-06-30',
			fabricWorkloads: ['Lakehouse', 'Data Warehouse', 'Power BI', 'Data Science', 'Data Factory'],
			estimatedLicenseCost: 240000,
			estimatedServicesCost: 90000,
			capacityUnits: 128,
			migrationSource: 'Databricks',
			competitor: 'AWS (Redshift/Glue)',
			projectDuration: '6-12 months',
			leadSource: 'Event',
			partnerPic: 'Andra Jayanthi (MSFT)',
			authorityName: 'Tri Priadhi Ashari',
			authorityContact: '+62 812-1000-069',
			authorityEmail: 'tri.ashari@permatabank.co.id',
			championName: 'Muhammad Iqbal Pratama',
			championContact: '+62 815-1401-1292',
			championEmail: 'muhammad.ipratama@permatabank.co.id',
			engagementTeam: 'Ardian, Jackson, Gilbert, Azari',
			immediateNextStep: 'Follow up regularly with Tri or Iqbal for upcoming information',
			timeline: 'Mar-Jun: Bidding, Jul-Dec: Delivery'
		}).returning();

		// Bank Permata Activities
		await db.insert(activities).values([
			{
				opportunityId: bankPermataOpp.id,
				userId: adminUser.id,
				type: 'note',
				title: 'NDA sent to SEG',
				description: 'NDA Template sent - awaiting signed NDA from SEG',
				completedAt: '2025-11-06'
			},
			{
				opportunityId: bankPermataOpp.id,
				userId: adminUser.id,
				type: 'proposal',
				title: 'POC Proposal approval',
				description: 'Signed POC proposal received',
				completedAt: '2025-11-28'
			},
			{
				opportunityId: bankPermataOpp.id,
				userId: adminUser.id,
				type: 'demo',
				title: 'POC Report approval',
				description: 'POC completed and report approved',
				completedAt: '2026-01-23'
			},
			{
				opportunityId: bankPermataOpp.id,
				userId: adminUser.id,
				type: 'meeting',
				title: 'Knowledge transfer session',
				description: 'KT session completed',
				completedAt: '2026-01-23'
			},
			{
				opportunityId: bankPermataOpp.id,
				userId: adminUser.id,
				type: 'note',
				title: 'DTI Invoicing pending',
				description: 'Pending payment from MSFT - Due Feb 2026',
				scheduledAt: '2026-02-28'
			},
			{
				opportunityId: bankPermataOpp.id,
				userId: adminUser.id,
				type: 'call',
				title: 'Regular follow-up calls',
				description: 'Biweekly call scheduled with Pak Tri / Iqbal',
				scheduledAt: '2026-02-15'
			}
		]);
	}

	console.log('✅ Data seeding complete!');
	console.log('');
	console.log('Added:');
	console.log('  - 2 Clients (Star Energy Geothermal, Bank Permata)');
	console.log('  - 2 Opportunities with detailed information');
	console.log('  - 12 Activities/Milestones');

	sqlite.close();
}

seedData().catch((err) => {
	console.error('❌ Seeding failed:', err);
	process.exit(1);
});
