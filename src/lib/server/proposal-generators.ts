import { Document, Packer, Paragraph, Table, TableCell, TableRow, HeadingLevel, AlignmentType, BorderStyle, convertInchesToTwip, TextRun, PageBreak, WidthType } from 'docx';
import PptxGenJS from 'pptxgenjs';

export interface ProposalData {
  title: string;
  clientName?: string;
  clientIndustry?: string;
  ownerName?: string;
  ownerEmail?: string;
  description?: string;
  objectives?: string;
  keyPainPoints?: string;
  initiatives?: string;
  fabricWorkloads?: string[];
  migrationSource?: string;
  estimatedLicenseCost?: number;
  estimatedServicesCost?: number;
  value?: number;
  projectDuration?: string;
  timeline?: string;
  engagementTeam?: string;
  immediateNextStep?: string;
  expectedCloseDate?: string;
  generatedDate: string;
}

function fmt(v?: number) {
  if (!v) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

// ==================== WORD DOCUMENT (.docx) ====================

export async function generateProposalDocx(data: ProposalData): Promise<Buffer> {
  const sections = [
    // Title Page
    new Paragraph({
      text: 'Microsoft Fabric',
      style: 'Heading1',
      spacing: { line: 480 },
    }),
    new Paragraph({
      text: 'Solution Proposal',
      style: 'Heading1',
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: data.title,
      style: 'Heading2',
      spacing: { after: 400 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          cells: [
            new TableCell({
              children: [
                new Paragraph({
                  text: 'Prepared For',
                  bold: true,
                  spacing: { after: 100 },
                }),
                new Paragraph(data.clientName || 'Client'),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: 'Prepared By',
                  bold: true,
                  spacing: { after: 100 },
                }),
                new Paragraph(data.ownerName || 'Sales Team'),
              ],
            }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({
              children: [
                new Paragraph({
                  text: 'Industry',
                  bold: true,
                  spacing: { after: 100 },
                }),
                new Paragraph(data.clientIndustry || 'Not specified'),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: 'Date',
                  bold: true,
                  spacing: { after: 100 },
                }),
                new Paragraph(data.generatedDate),
              ],
            }),
          ],
        }),
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: '#4F46E5' },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: '#4F46E5' },
        left: { style: BorderStyle.SINGLE, size: 6, color: '#4F46E5' },
        right: { style: BorderStyle.SINGLE, size: 6, color: '#4F46E5' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '#E5E7EB' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '#E5E7EB' },
      },
    }),
    new PageBreak(),

    // Executive Summary
    new Paragraph({
      text: 'Executive Summary',
      style: 'Heading1',
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: data.description || 'Proposed solution to address client needs and drive business value.',
      spacing: { after: 300 },
    }),
    ...(data.objectives
      ? [
          new Paragraph({
            text: data.objectives,
            spacing: { after: 300 },
          }),
        ]
      : []),

    // Pain Points
    new Paragraph({
      text: 'Challenges & Objectives',
      style: 'Heading1',
      spacing: { after: 200 },
    }),
    ...(data.keyPainPoints
      ? [
          new Paragraph({
            text: 'Current Challenges:',
            bold: true,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: data.keyPainPoints,
            spacing: { after: 200 },
          }),
        ]
      : []),
    ...(data.initiatives
      ? [
          new Paragraph({
            text: 'Strategic Initiatives:',
            bold: true,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: data.initiatives,
            spacing: { after: 300 },
          }),
        ]
      : []),

    // Solution
    new Paragraph({
      text: 'Proposed Microsoft Fabric Solution',
      style: 'Heading1',
      spacing: { after: 200 },
    }),
    ...(data.fabricWorkloads && data.fabricWorkloads.length > 0
      ? [
          new Paragraph({
            text: 'Solution Components:',
            bold: true,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: data.fabricWorkloads.join(', '),
            spacing: { after: 200 },
          }),
        ]
      : []),
    ...(data.migrationSource && data.migrationSource !== 'Greenfield'
      ? [
          new Paragraph({
            text: `Migration from: ${data.migrationSource}`,
            spacing: { after: 200 },
          }),
        ]
      : []),

    // Investment
    new Paragraph({
      text: 'Investment Summary',
      style: 'Heading1',
      spacing: { after: 200 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          cells: [
            new TableCell({
              children: [new Paragraph({ text: 'License Cost', bold: true })],
            }),
            new TableCell({
              children: [new Paragraph({ text: 'Services Cost', bold: true })],
            }),
            new TableCell({
              children: [new Paragraph({ text: 'Total Investment', bold: true })],
            }),
          ],
        }),
        new TableRow({
          cells: [
            new TableCell({
              children: [new Paragraph(fmt(data.estimatedLicenseCost))],
            }),
            new TableCell({
              children: [new Paragraph(fmt(data.estimatedServicesCost))],
            }),
            new TableCell({
              children: [new Paragraph(fmt(data.value))],
              shading: { fill: 'E0E7FF' },
            }),
          ],
        }),
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: '#D1D5DB' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: '#D1D5DB' },
        left: { style: BorderStyle.SINGLE, size: 1, color: '#D1D5DB' },
        right: { style: BorderStyle.SINGLE, size: 1, color: '#D1D5DB' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '#E5E7EB' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '#E5E7EB' },
      },
    }),
    new Paragraph({ text: '', spacing: { after: 300 } }),

    // Timeline
    new Paragraph({
      text: 'Implementation Timeline',
      style: 'Heading1',
      spacing: { after: 200 },
    }),
    ...(data.projectDuration
      ? [
          new Paragraph({
            text: `Estimated Duration: ${data.projectDuration}`,
            spacing: { after: 100 },
          }),
        ]
      : []),
    ...(data.timeline
      ? [
          new Paragraph({
            text: data.timeline,
            spacing: { after: 300 },
          }),
        ]
      : []),

    // Next Steps
    new Paragraph({
      text: 'Team & Next Steps',
      style: 'Heading1',
      spacing: { after: 200 },
    }),
    ...(data.engagementTeam
      ? [
          new Paragraph({
            text: `Engagement Team: ${data.engagementTeam}`,
            spacing: { after: 100 },
          }),
        ]
      : []),
    ...(data.immediateNextStep
      ? [
          new Paragraph({
            text: `Next Step: ${data.immediateNextStep}`,
            spacing: { after: 100 },
          }),
        ]
      : []),
    ...(data.expectedCloseDate
      ? [
          new Paragraph({
            text: `Expected Close: ${new Date(data.expectedCloseDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
            spacing: { after: 300 },
          }),
        ]
      : []),

    // Footer
    new Paragraph({
      text: `Prepared on ${data.generatedDate}`,
      alignment: AlignmentType.CENTER,
      italics: true,
      color: '6B7280',
    }),
  ];

  const doc = new Document({
    sections: [
      {
        children: sections,
        properties: {
          page: {
            margins: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

// ==================== POWERPOINT (.pptx) ====================

export async function generateProposalPptx(data: ProposalData): Promise<Buffer> {
  const prs = new PptxGenJS();
  prs.defineLayout({ name: 'LAYOUT1', width: 10, height: 7.5 });

  const slide1 = prs.addSlide();
  slide1.background = { color: '4F46E5' };
  slide1.addText('Microsoft Fabric', {
    x: 0.5,
    y: 1,
    w: 9,
    h: 1,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
  });
  slide1.addText('Solution Proposal', {
    x: 0.5,
    y: 2,
    w: 9,
    h: 0.8,
    fontSize: 32,
    color: 'E0E7FF',
  });
  slide1.addText(data.title, {
    x: 0.5,
    y: 3.2,
    w: 9,
    h: 1.5,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
    align: 'left',
  });
  slide1.addText(
    `${data.generatedDate}${data.ownerName ? ` • ${data.ownerName}` : ''}`,
    {
      x: 0.5,
      y: 6.5,
      w: 9,
      h: 0.5,
      fontSize: 14,
      color: 'D1D5DB',
    }
  );

  // Slide 2: Client & Overview
  const slide2 = prs.addSlide();
  slide2.addText('Client & Overview', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: '1F2937',
  });
  const cells2 = [
    ['Client', data.clientName || 'TBD'],
    ['Industry', data.clientIndustry || 'Not specified'],
    ['Owner', data.ownerName || 'Sales Team'],
    ['Contact', data.ownerEmail || 'TBD'],
  ];
  slide2.addTable(cells2, {
    x: 0.5,
    y: 1.3,
    w: 9,
    h: 4,
    colW: [2, 7],
    border: { pt: 1, color: 'D1D5DB' },
    fill: { color: 'F3F4F6' },
  });

  // Slide 3: Pain Points & Objectives
  if (data.keyPainPoints || data.objectives) {
    const slide3 = prs.addSlide();
    slide3.addText('Challenges & Objectives', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 32,
      bold: true,
      color: '1F2937',
    });
    let yPos = 1.3;
    if (data.keyPainPoints) {
      slide3.addText('Current Challenges:', {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: 'DC2626',
      });
      yPos += 0.5;
      slide3.addText(data.keyPainPoints, {
        x: 0.7,
        y: yPos,
        w: 8.6,
        h: 1.5,
        fontSize: 12,
        color: '374151',
        align: 'left',
      });
      yPos += 2;
    }
    if (data.objectives) {
      slide3.addText('Business Objectives:', {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: '2563EB',
      });
      yPos += 0.5;
      slide3.addText(data.objectives, {
        x: 0.7,
        y: yPos,
        w: 8.6,
        h: 1.5,
        fontSize: 12,
        color: '374151',
        align: 'left',
      });
    }
  }

  // Slide 4: Solution
  const slide4 = prs.addSlide();
  slide4.addText('Proposed Solution', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: '1F2937',
  });
  const workloads = data.fabricWorkloads || [];
  const cols = 3;
  let idx = 0;
  for (let row = 0; row < Math.ceil(workloads.length / cols); row++) {
    for (let col = 0; col < cols && idx < workloads.length; col++) {
      slide4.addShape(prs.ShapeType.roundRect, {
        x: 0.5 + col * 3,
        y: 1.4 + row * 1.2,
        w: 2.8,
        h: 0.9,
        fill: { color: '4F46E5' },
        line: { color: '4F46E5' },
      });
      slide4.addText(workloads[idx++], {
        x: 0.5 + col * 3,
        y: 1.4 + row * 1.2,
        w: 2.8,
        h: 0.9,
        fontSize: 12,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        valign: 'middle',
      });
    }
  }
  let contentY = 1.4 + Math.ceil(workloads.length / cols) * 1.2 + 0.3;
  if (data.migrationSource && data.migrationSource !== 'Greenfield') {
    slide4.addText(`Migration from: ${data.migrationSource}`, {
      x: 0.5,
      y: contentY,
      w: 9,
      h: 0.5,
      fontSize: 12,
      color: '374151',
    });
  }

  // Slide 5: Investment
  const slide5 = prs.addSlide();
  slide5.addText('Investment Summary', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: '1F2937',
  });
  const investmentTable = [
    ['License Cost', fmt(data.estimatedLicenseCost), 'bg-blue'],
    ['Services Cost', fmt(data.estimatedServicesCost), 'bg-purple'],
    ['Total Investment', fmt(data.value), 'bg-indigo'],
  ];
  const colors = ['E0E7FF', 'F3E8FF', '4F46E5'];
  let tY = 1.4;
  investmentTable.forEach((row, i) => {
    slide5.addShape(prs.ShapeType.rect, {
      x: 0.5,
      y: tY,
      w: 9,
      h: 0.8,
      fill: { color: colors[i] },
      line: { color: 'D1D5DB' },
    });
    slide5.addText(row[0], {
      x: 0.7,
      y: tY,
      w: 4,
      h: 0.8,
      fontSize: 14,
      bold: true,
      color: i === 2 ? 'FFFFFF' : '1F2937',
      valign: 'middle',
    });
    slide5.addText(row[1], {
      x: 5.2,
      y: tY,
      w: 3.8,
      h: 0.8,
      fontSize: 16,
      bold: true,
      color: i === 2 ? 'FFFFFF' : '1F2937',
      align: 'right',
      valign: 'middle',
    });
    tY += 0.9;
  });

  // Slide 6: Timeline & Next Steps
  const slide6 = prs.addSlide();
  slide6.addText('Timeline & Next Steps', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: '1F2937',
  });
  let detailY = 1.4;
  if (data.projectDuration) {
    slide6.addText('Duration:', {
      x: 0.5,
      y: detailY,
      w: 2,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: '374151',
    });
    slide6.addText(data.projectDuration, {
      x: 2.7,
      y: detailY,
      w: 6.8,
      h: 0.4,
      fontSize: 12,
      color: '4F46E5',
    });
    detailY += 0.6;
  }
  if (data.immediateNextStep) {
    slide6.addText('Next Step:', {
      x: 0.5,
      y: detailY,
      w: 2,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: '374151',
    });
    slide6.addText(data.immediateNextStep, {
      x: 2.7,
      y: detailY,
      w: 6.8,
      h: 1.2,
      fontSize: 11,
      color: '374151',
    });
    detailY += 1.5;
  }
  if (data.expectedCloseDate) {
    slide6.addText('Expected Close:', {
      x: 0.5,
      y: detailY,
      w: 2,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: '374151',
    });
    const closeDate = new Date(data.expectedCloseDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    slide6.addText(closeDate, {
      x: 2.7,
      y: detailY,
      w: 6.8,
      h: 0.4,
      fontSize: 12,
      color: '22C55E',
    });
  }

  const pptxBuffer = await prs.write({ outputType: 'arraybuffer' });
  return Buffer.from(pptxBuffer as ArrayBuffer);
}
