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

async function seedEonMapData() {
	console.log('🌱 Seeding EON Chemicals and MAP Active data...');

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

	// ==================== CLIENT 3: EON Chemicals Putra ====================
	const [existingEon] = await db.select().from(clients).where(eq(clients.name, 'EON Chemicals Putra'));
	let eonChemicals;
	if (existingEon) {
		eonChemicals = existingEon;
		console.log('  EON Chemicals Putra already exists, skipping client...');
	} else {
		console.log('  Creating EON Chemicals Putra...');
		[eonChemicals] = await db.insert(clients).values({
			name: 'EON Chemicals Putra',
			industry: 'Manufacturing',
			size: 'mid-market',
			region: 'Indonesia',
			primaryContact: 'Budiman Adi Wibawa',
			contactEmail: 'budiman.wibawa@eonchemical.com',
			contactPhone: '+628118400310',
			website: 'https://eonchemical.com',
			notes: `Industry: Chemicals/Manufacturing
Champion: Not identified yet
SRKK Engagement Team: Shawn Soh, Lai Yuen Seng
Lead Source: Partner/MSFT/Event - MSFT
Partner PIC: Fitria`,
			createdById: adminUser.id
		}).returning();
	}

	// EON Chemicals Opportunity
	const [existingEonOpp] = await db.select().from(opportunities).where(eq(opportunities.title, 'EON Chemicals - AI Sales Opportunity & Boiler Monitoring'));
	if (existingEonOpp) {
		console.log('  EON Chemicals opportunity already exists, skipping...');
	} else {
		const [eonOpp] = await db.insert(opportunities).values({
			title: 'EON Chemicals - AI Sales Opportunity & Boiler Monitoring',
			clientId: eonChemicals.id,
			stageId: getStageId('lead'),
			ownerId: adminUser.id,
			value: 0,
			probability: 10,
			expectedCloseDate: '2026-06-30',
			fabricWorkloads: ['Power BI', 'Data Factory', 'Data Science'],
			migrationSource: 'Greenfield',
			competitor: 'None',
			projectDuration: '3-6 months',
			leadSource: 'Partner/MSFT/Event',
			partnerPic: 'Fitria',
			authorityName: 'Budiman Adi Wibawa',
			authorityContact: '+628118400310',
			authorityEmail: 'budiman.wibawa@eonchemical.com',
			engagementTeam: 'Shawn Soh, Lai Yuen Seng',
			documentsFolder: 'EON Chemicals POV 3336836',
			immediateNextStep: 'Discuss PTPN Boiler\'s project taskforce opportunity',
			timeline: 'TBD',
			objectives: `1. AI for sales opportunity identification - use AI to identify sales opportunities from customer interactions
2. PTPN collaboration for Boilers data - potential project for boiler monitoring and predictive maintenance`,
			keyPainPoints: `1. Sales team consulting overload - Sales team spending too much time on routine consultations
2. Scattered product knowledge - Product information not centralized, hard for sales team to access
3. Mobile app enhancement for boiler monitoring - Need better mobile capabilities for field technicians`,
			initiatives: `1. AI-powered sales assistant for opportunity identification
2. Centralized product knowledge base
3. Boiler monitoring dashboard with predictive maintenance
4. Integration with PTPN systems for boiler data`,
			potentialRoadblocks: `1. POV status: Done (Aug 2025) - acceptable by IT but not impactful for Management
2. Need to demonstrate clear business value to management
3. PTPN collaboration complexity`,
			engagementSummary: `POV completed in August 2025. Results were acceptable from IT perspective but management did not see significant impact.
Current focus is on exploring the PTPN Boiler's project as a new opportunity that may have more visible business value.
Need to reposition the solution to address management concerns about ROI.`
		}).returning();

		// EON Chemicals Activities
		await db.insert(activities).values([
			{
				opportunityId: eonOpp.id,
				userId: adminUser.id,
				type: 'meeting',
				title: 'Initial discovery meeting',
				description: 'First meeting with EON Chemicals team to understand requirements',
				completedAt: '2025-07-15'
			},
			{
				opportunityId: eonOpp.id,
				userId: adminUser.id,
				type: 'demo',
				title: 'POV Execution',
				description: 'POV for AI sales opportunity identification',
				completedAt: '2025-08-20'
			},
			{
				opportunityId: eonOpp.id,
				userId: adminUser.id,
				type: 'note',
				title: 'POV Completed',
				description: 'POV done - acceptable by IT but not impactful for Management',
				completedAt: '2025-08-30'
			},
			{
				opportunityId: eonOpp.id,
				userId: adminUser.id,
				type: 'note',
				title: 'Next: PTPN Boiler Discussion',
				description: 'Discuss PTPN Boiler\'s project taskforce opportunity as new angle',
				scheduledAt: '2026-02-15',
				status: 'pending'
			}
		]);
	}

	// ==================== CLIENT 4: MAP Active ====================
	const [existingMap] = await db.select().from(clients).where(eq(clients.name, 'MAP Active (Mitra Adiperkasa)'));
	let mapActive;
	if (existingMap) {
		mapActive = existingMap;
		console.log('  MAP Active already exists, skipping client...');
	} else {
		console.log('  Creating MAP Active...');
		[mapActive] = await db.insert(clients).values({
			name: 'MAP Active (Mitra Adiperkasa)',
			industry: 'Retail',
			size: 'enterprise',
			region: 'Indonesia',
			primaryContact: 'Dwi Aji Mardiyanto',
			contactEmail: 'dwi.mardiyanto@map.co.id',
			contactPhone: '+62 857-8217-6850',
			website: 'https://map.co.id',
			notes: `Industry: Retail
Champion: Yosefin Donny Kurniawan (yosefin.kurniawan@map.co.id)
SRKK Engagement Team: Ardian, Gilbert, Azari, Jackson
Lead Source: Event
Partner PIC: Andra Jayanthi (MSFT)`,
			createdById: adminUser.id
		}).returning();
	}

	// MAP Active Opportunity
	const [existingMapOpp] = await db.select().from(opportunities).where(eq(opportunities.title, 'MAP Active - Fabric Enablement & Data Platform Migration'));
	if (existingMapOpp) {
		console.log('  MAP Active opportunity already exists, skipping...');
	} else {
		const [mapOpp] = await db.insert(opportunities).values({
			title: 'MAP Active - Fabric Enablement & Data Platform Migration',
			clientId: mapActive.id,
			stageId: getStageId('lead'),
			ownerId: adminUser.id,
			value: 100000,
			probability: 20,
			expectedCloseDate: '2026-04-30',
			fabricWorkloads: ['Lakehouse', 'Data Warehouse', 'Data Factory', 'Power BI', 'Notebooks'],
			capacityUnits: 64,
			estimatedLicenseCost: 60000,
			estimatedServicesCost: 40000,
			migrationSource: 'AWS Redshift',
			competitor: 'Databricks',
			projectDuration: '3-6 months',
			leadSource: 'Event',
			partnerPic: 'Andra Jayanthi (MSFT)',
			authorityName: 'Dwi Aji Mardiyanto',
			authorityContact: '+62 857-8217-6850',
			authorityEmail: 'dwi.mardiyanto@map.co.id',
			championName: 'Yosefin Donny Kurniawan',
			championContact: '+62 857-8217-6850',
			championEmail: 'yosefin.kurniawan@map.co.id',
			engagementTeam: 'Ardian, Gilbert, Azari, Jackson',
			documentsFolder: 'C2 – MAP - Microsoft Fabric Engagement.pdf',
			immediateNextStep: 'Databricks deck development',
			timeline: 'April',
			objectives: `1. Build Fabric knowledge for MAA Data analyst team
2. Enable data team to work with Microsoft Fabric effectively
3. Prepare for potential migration from current platform to Fabric`,
			keyPainPoints: `1. Migrating from SQL Server/SAP/AWS to Fabric - Complex multi-source migration
2. Macro-enabled files conversion - Need to convert Excel macros to Fabric-compatible solutions
3. Databricks competition - Internal stakeholders comparing with Databricks offering`,
			initiatives: `1. Enablement sessions every 2 weeks (10 topics planned)
2. Hands-on workshops with real MAA data
3. Migration planning and architecture review
4. POC on specific use cases to demonstrate Fabric capabilities vs Databricks
Current status: 12.5 hours remaining in enablement sessions`,
			potentialRoadblocks: `1. Databricks has strong internal advocates
2. AWS existing investment may be hard to move away from
3. Macro-enabled Excel files complexity
4. Multiple data sources (SQL Server, SAP, AWS) adds migration complexity`,
			engagementSummary: `Ongoing enablement program with bi-weekly sessions. Currently focusing on building Fabric knowledge within the MAA data analyst team.

Key activities:
- Regular enablement sessions (10 topics total, ongoing)
- Hands-on demonstrations with MAA data
- Comparison documentation vs Databricks

Current challenge: Need to develop compelling Databricks comparison deck to address internal competition.
Next milestone: Complete enablement sessions and move to POC phase.`
		}).returning();

		// MAP Active Activities
		await db.insert(activities).values([
			{
				opportunityId: mapOpp.id,
				userId: adminUser.id,
				type: 'meeting',
				title: 'Initial kickoff meeting',
				description: 'Kickoff meeting for Fabric enablement program',
				completedAt: '2025-11-01'
			},
			{
				opportunityId: mapOpp.id,
				userId: adminUser.id,
				type: 'demo',
				title: 'Enablement Session 1-3',
				description: 'First three enablement sessions completed covering Fabric fundamentals',
				completedAt: '2025-12-15'
			},
			{
				opportunityId: mapOpp.id,
				userId: adminUser.id,
				type: 'meeting',
				title: 'Enablement Session 4-6',
				description: 'Sessions on Lakehouse, Data Warehouse, and Data Factory',
				completedAt: '2026-01-15'
			},
			{
				opportunityId: mapOpp.id,
				userId: adminUser.id,
				type: 'note',
				title: 'Remaining: 12.5 hours enablement',
				description: '10 topics total, approximately 12.5 hours remaining in the program',
				status: 'in_progress'
			},
			{
				opportunityId: mapOpp.id,
				userId: adminUser.id,
				type: 'note',
				title: 'Next: Databricks deck development',
				description: 'Prepare comparison deck: Fabric vs Databricks for internal stakeholders',
				scheduledAt: '2026-02-10',
				status: 'pending',
				pic: 'Ardian'
			},
			{
				opportunityId: mapOpp.id,
				userId: adminUser.id,
				type: 'call',
				title: 'Bi-weekly enablement call',
				description: 'Continuing enablement sessions every 2 weeks',
				scheduledAt: '2026-02-15',
				status: 'pending'
			}
		]);
	}

	console.log('✅ EON Chemicals & MAP Active data seeding complete!');
	console.log('');
	console.log('Added:');
	console.log('  - 2 Clients (EON Chemicals Putra, MAP Active)');
	console.log('  - 2 Opportunities with all SRKK template fields');
	console.log('  - 10 Activities/Milestones');

	sqlite.close();
}

seedEonMapData().catch((err) => {
	console.error('❌ Seeding failed:', err);
	process.exit(1);
});
