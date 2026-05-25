import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Organizations
  const ethiopiaMoH = await prisma.organization.upsert({
    where: { id: 'ethiopia-moh-org-id' },
    update: {},
    create: {
      id: 'ethiopia-moh-org-id',
      name: 'Ethiopia Ministry of Health',
      countryCode: 'ETH',
      region: 'East Africa',
      organizationType: 'national',
      isActive: true,
    },
  });

  const whoGlobal = await prisma.organization.upsert({
    where: { id: 'who-global-org-id' },
    update: {},
    create: {
      id: 'who-global-org-id',
      name: 'World Health Organization (Global)',
      countryCode: 'WHO',
      region: 'Global',
      organizationType: 'partner',
      isActive: true,
    },
  });

  console.log('Organizations seeded.');

  // 2. Seed Users
  const passwordHash = await bcrypt.hash('SecurePass@2026', 12);

  await prisma.user.upsert({
    where: { email: 'superadmin@chpmi.org' },
    update: {},
    create: {
      email: 'superadmin@chpmi.org',
      passwordHash,
      fullName: 'Global Administrator',
      role: 'super_admin',
      organizationId: whoGlobal.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'assessor@chpmi.org' },
    update: {},
    create: {
      email: 'assessor@chpmi.org',
      passwordHash,
      fullName: 'Ethiopia Assessor',
      role: 'assessor',
      organizationId: ethiopiaMoH.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'reviewer@chpmi.org' },
    update: {},
    create: {
      email: 'reviewer@chpmi.org',
      passwordHash,
      fullName: 'Ethiopia Reviewer',
      role: 'reviewer',
      organizationId: ethiopiaMoH.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@chpmi.org' },
    update: {},
    create: {
      email: 'viewer@chpmi.org',
      passwordHash,
      fullName: 'Ethiopia Viewer',
      role: 'viewer',
      organizationId: ethiopiaMoH.id,
      isActive: true,
    },
  });

  console.log('Users seeded.');

  // 3. Seed Maturity Bands
  const bands = [
    { label: 'Non-Existent', minScore: 0.00, maxScore: 0.00, systemAttributes: 'No meaningful structures or policies; requires foundational investment', displayOrder: 1 },
    { label: 'Nascent', minScore: 0.01, maxScore: 20.00, systemAttributes: 'Minimal structures; activities ad hoc, informal, or exploratory', displayOrder: 2 },
    { label: 'Emerging', minScore: 20.01, maxScore: 40.00, systemAttributes: 'Fragmented, project-based systems; focus on coordination and alignment', displayOrder: 3 },
    { label: 'Developing', minScore: 40.01, maxScore: 60.00, systemAttributes: 'Foundational systems in place but inconsistent; emphasis on integration', displayOrder: 4 },
    { label: 'Established', minScore: 60.01, maxScore: 80.00, systemAttributes: 'Systems functional, standardized, embedded in national frameworks', displayOrder: 5 },
    { label: 'Matured', minScore: 80.01, maxScore: 100.00, systemAttributes: 'Fully institutionalized, sustainable, equity-driven, adaptive', displayOrder: 6 },
  ];

  for (const b of bands) {
    await prisma.maturityBand.upsert({
      where: { label: b.label },
      update: {
        minScore: b.minScore,
        maxScore: b.maxScore,
        systemAttributes: b.systemAttributes,
        displayOrder: b.displayOrder,
      },
      create: {
        label: b.label,
        minScore: b.minScore,
        maxScore: b.maxScore,
        systemAttributes: b.systemAttributes,
        displayOrder: b.displayOrder,
      },
    });
  }

  console.log('Maturity Bands seeded.');

  // 4. Seed Domains, Components, Criteria, and Level Descriptors
  const domainsData = [
    {
      code: 'LG',
      name: 'Leadership and Governance',
      displayOrder: 1,
      description: 'Leadership and Governance structures, policies, and regulatory systems.',
      components: [
        {
          code: 'C01',
          name: 'Policy and Legal Recognition of CHWs with a Defined Scope of Practice',
          displayOrder: 1,
          referenceText: 'Reference narrative for Policy and Legal Recognition',
          criteria: [
            { code: 'C01.1', name: 'Legal & Policy Frameworks', displayOrder: 1 },
            { code: 'C01.2', name: 'Dynamic and Evolving CHW Roles', displayOrder: 2 },
            { code: 'C01.3', name: 'Institutionalization & Integration of CHWs into Governance and Health Systems', displayOrder: 3 },
          ],
        },
        {
          code: 'C02',
          name: 'Multisectoral Coordination',
          displayOrder: 2,
          referenceText: 'Reference narrative for Multisectoral Coordination',
          criteria: [
            { code: 'C02.1', name: 'Coordination Structures Mandate', displayOrder: 4 },
            { code: 'C02.2', name: 'Coordination Process Functionality', displayOrder: 5 },
            { code: 'C02.3', name: 'Integration & Sustainability', displayOrder: 6 },
          ],
        },
        {
          code: 'C03',
          name: 'Community Health Units (CHUs)',
          displayOrder: 3,
          referenceText: 'Reference narrative for Community Health Units',
          criteria: [
            { code: 'C03.1', name: 'CHU Existence & Functionality', displayOrder: 7 },
            { code: 'C03.2', name: 'PHC Integration & Service Delivery', displayOrder: 8 },
            { code: 'C03.3', name: 'Community Engagement & Sustainability', displayOrder: 9 },
          ],
        },
        {
          code: 'C04',
          name: 'Monitoring and Evaluation',
          displayOrder: 4,
          referenceText: 'Reference narrative for Monitoring and Evaluation',
          criteria: [
            { code: 'C04.1', name: 'M&E Framework & System Integration', displayOrder: 10 },
            { code: 'C04.2', name: 'Data Collection, Quality & Reporting', displayOrder: 11 },
            { code: 'C04.3', name: 'Data Use, Feedback & Accountability', displayOrder: 12 },
          ],
        },
      ],
    },
    {
      code: 'FIN',
      name: 'Financing',
      displayOrder: 2,
      description: 'Financing models, budgets, financial planning, and costed strategy.',
      components: [
        {
          code: 'C05',
          name: 'Financing',
          displayOrder: 5,
          referenceText: 'Reference narrative for Financing',
          criteria: [
            { code: 'C05.1', name: 'Budget Allocation & Funding Sources', displayOrder: 13 },
            { code: 'C05.2', name: 'Financial Planning & Costed Strategy', displayOrder: 14 },
            { code: 'C05.3', name: 'Resource Coordination & Accountability', displayOrder: 15 },
          ],
        },
      ],
    },
    {
      code: 'WF',
      name: 'Workforce',
      displayOrder: 3,
      description: 'Training, certification, career progression, and compensation of CHWs.',
      components: [
        {
          code: 'C06',
          name: 'CHWs Training and Certification',
          displayOrder: 6,
          referenceText: 'Reference narrative for CHWs Training and Certification',
          criteria: [
            { code: 'C06.1', name: 'Training Framework & Quality', displayOrder: 16 },
            { code: 'C06.2', name: 'Certification & Institutional Capacity', displayOrder: 17 },
            { code: 'C06.3', name: 'Continuous & Refresher Training', displayOrder: 18 },
          ],
        },
        {
          code: 'C07',
          name: 'CHWs Career Pathways',
          displayOrder: 7,
          referenceText: 'Reference narrative for CHWs Career Pathways',
          criteria: [
            { code: 'C07.1', name: 'Career Pathway Framework & Support', displayOrder: 19 },
            { code: 'C07.2', name: 'Promotion & Recognition Mechanisms', displayOrder: 20 },
            { code: 'C07.3', name: 'Educational & Professional Linkages', displayOrder: 21 },
          ],
        },
        {
          code: 'C08',
          name: 'CHWs Payment',
          displayOrder: 8,
          referenceText: 'Reference narrative for CHWs Payment',
          criteria: [
            { code: 'C08.1', name: 'Compensation Policy & Equity', displayOrder: 22 },
            { code: 'C08.2', name: 'Payroll, Employment & Benefits', displayOrder: 23 },
            { code: 'C08.3', name: 'Payment Regularity & Sustainability', displayOrder: 24 },
          ],
        },
      ],
    },
    {
      code: 'SUP',
      name: 'Supplies',
      displayOrder: 4,
      description: 'Supply chains, logistics, and digital commodity tracking.',
      components: [
        {
          code: 'C09',
          name: 'Supply and Logistics',
          displayOrder: 9,
          referenceText: 'Reference narrative for Supply and Logistics',
          criteria: [
            { code: 'C09.1', name: 'Supply Chain System & Integration', displayOrder: 25 },
            { code: 'C09.2', name: 'Availability, Standardization & Equity', displayOrder: 26 },
            { code: 'C09.3', name: 'Digital Tracking & Responsiveness', displayOrder: 27 },
          ],
        },
      ],
    },
    {
      code: 'OUT',
      name: 'Outcomes',
      displayOrder: 5,
      description: 'Program service coverage, quality, equity, and accountability outcomes.',
      components: [
        {
          code: 'C10',
          name: 'Outcomes (Coverage, Equity, Quality & Accountability)',
          displayOrder: 10,
          referenceText: 'Reference narrative for Outcomes',
          criteria: [
            { code: 'C10.1', name: 'Service Coverage & Equity', displayOrder: 28 },
            { code: 'C10.2', name: 'Quality Assurance & Integration', displayOrder: 29 },
            { code: 'C10.3', name: 'Financial Risk Protection', displayOrder: 30 },
          ],
        },
      ],
    },
  ];

  // Helper labels for criteria levels
  const levelLabels = ['Non-Existent', 'Emerging', 'Developing', 'Established', 'Matured'];

  for (const d of domainsData) {
    const domain = await prisma.domain.upsert({
      where: { code: d.code },
      update: { name: d.name, displayOrder: d.displayOrder, description: d.description },
      create: { code: d.code, name: d.name, displayOrder: d.displayOrder, description: d.description },
    });

    for (const c of d.components) {
      const component = await prisma.component.upsert({
        where: { code: c.code },
        update: { name: c.name, displayOrder: c.displayOrder, referenceText: c.referenceText, domainId: domain.id },
        create: { code: c.code, name: c.name, displayOrder: c.displayOrder, referenceText: c.referenceText, domainId: domain.id },
      });

      for (const cr of c.criteria) {
        const criterion = await prisma.criterion.upsert({
          where: { code: cr.code },
          update: { name: cr.name, displayOrder: cr.displayOrder, componentId: component.id },
          create: { code: cr.code, name: cr.name, displayOrder: cr.displayOrder, componentId: component.id },
        });

        // Seed levels 0-4 for this criterion
        for (let l = 0; l <= 4; l++) {
          const label = levelLabels[l];
          let desc = '';
          switch (l) {
            case 0:
              desc = `No policies, structures, or operational oversight are in place for ${cr.name}.`;
              break;
            case 1:
              desc = `Initial framework or guidelines for ${cr.name} are being drafted. Work is highly fragmented, ad-hoc, and largely reliant on external NGO/partner support.`;
              break;
            case 2:
              desc = `Systems and structures for ${cr.name} are active but limited in geographic scope or consistency, with partial integration into the broader health system.`;
              break;
            case 3:
              desc = `Standardized, national processes for ${cr.name} are established and fully functional in the majority of health facilities or regions.`;
              break;
            case 4:
              desc = `Systems for ${cr.name} are fully institutionalized, sustainably financed, equity-driven, and subject to continuous quality improvement and review.`;
              break;
          }

          await prisma.criterionLevel.upsert({
            where: {
              criteriaId_level: {
                criteriaId: criterion.id,
                level: l,
              },
            },
            update: { label, description: desc },
            create: {
              criteriaId: criterion.id,
              level: l,
              label,
              description: desc,
            },
          });
        }
      }
    }
  }

  console.log('Domains, Components, Criteria, and Level Descriptors seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
