import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  Header, Footer, PageNumber, NumberFormat, UnderlineType,
} from 'docx';

// ─────────────────────────────────────────────────────────────
// COLOR HELPERS
// ─────────────────────────────────────────────────────────────
const C = {
  blue: rgb(0.102, 0.337, 0.859),    // #1a56db
  darkGray: rgb(0.216, 0.255, 0.318), // #374151
  lightGray: rgb(0.953, 0.957, 0.965),// #f3f4f6
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
  medGray: rgb(0.6, 0.6, 0.6),
  red: rgb(0.8, 0.1, 0.1),
};

// ─────────────────────────────────────────────────────────────
// PDF HELPERS
// ─────────────────────────────────────────────────────────────
function wrapText(text, font, fontSize, maxWidth) {
  const words = String(text).split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrappedText(page, text, { x, y, maxWidth, fontSize, font, color, lineHeight, maxY }) {
  const lines = wrapText(text, font, fontSize, maxWidth);
  let curY = y;
  for (const line of lines) {
    if (maxY !== undefined && curY < maxY) break;
    page.drawText(line, { x, y: curY, size: fontSize, font, color });
    curY -= lineHeight || fontSize + 4;
  }
  return curY;
}

function addPageWithHeader(pdfDoc, boldFont, regularFont, projectName, pageNum) {
  const page = pdfDoc.addPage([612, 792]);
  // Header bar
  page.drawRectangle({ x: 0, y: 762, width: 612, height: 30, color: C.blue });
  page.drawText(`Confidential | ${projectName} TAD`, {
    x: 20, y: 771, size: 9, font: regularFont, color: C.white,
  });
  page.drawText(`Page ${pageNum}`, {
    x: 572 - regularFont.widthOfTextAtSize(`Page ${pageNum}`, 9), y: 771,
    size: 9, font: regularFont, color: C.white,
  });
  // Footer
  page.drawLine({ start: { x: 40, y: 35 }, end: { x: 572, y: 35 }, thickness: 0.5, color: C.medGray });
  page.drawText('CONFIDENTIAL — For authorized recipients only', {
    x: 40, y: 20, size: 8, font: regularFont, color: C.medGray,
  });
  return { page, y: 740 };
}

// ─────────────────────────────────────────────────────────────
// PDF GENERATION
// ─────────────────────────────────────────────────────────────
export async function generatePDF(tad) {
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const MARGIN = 50;
  const PAGE_W = 612;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const MIN_Y = 55;

  // ── COVER PAGE ───────────────────────────────────────────
  const cover = pdfDoc.addPage([PAGE_W, 792]);

  // Background gradient simulation
  cover.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 792, color: rgb(0.055, 0.118, 0.286) });
  cover.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 300, color: rgb(0.039, 0.082, 0.196) });

  // Logo placeholder
  cover.drawRectangle({ x: MARGIN, y: 692, width: 80, height: 60, color: C.blue });
  cover.drawText('GHL', { x: MARGIN + 22, y: 714, size: 22, font: boldFont, color: C.white });

  // Company name
  cover.drawText('GO HIGH LEVEL', { x: MARGIN + 90, y: 730, size: 11, font: boldFont, color: rgb(0.6, 0.8, 1) });
  cover.drawText('Technical Solutions', { x: MARGIN + 90, y: 715, size: 9, font: regularFont, color: C.medGray });

  // Divider
  cover.drawLine({ start: { x: MARGIN, y: 680 }, end: { x: PAGE_W - MARGIN, y: 680 }, thickness: 1, color: C.blue });

  // Document title
  cover.drawText('TECHNICAL APPROACH', { x: MARGIN, y: 620, size: 32, font: boldFont, color: C.white });
  cover.drawText('DOCUMENT', { x: MARGIN, y: 578, size: 32, font: boldFont, color: rgb(0.4, 0.7, 1) });

  // Client info box
  cover.drawRectangle({ x: MARGIN, y: 450, width: CONTENT_W, height: 100, color: rgb(0.1, 0.2, 0.4) });
  cover.drawRectangle({ x: MARGIN, y: 547, width: 4, height: 103, color: C.blue });

  cover.drawText('Prepared for:', { x: MARGIN + 15, y: 528, size: 10, font: italicFont, color: C.medGray });
  const cnLines = wrapText(tad.clientName || 'Client', boldFont, 18, CONTENT_W - 30);
  cover.drawText(cnLines[0] || tad.clientName, { x: MARGIN + 15, y: 508, size: 18, font: boldFont, color: C.white });

  cover.drawText('Project:', { x: MARGIN + 15, y: 485, size: 10, font: italicFont, color: C.medGray });
  const pnLines = wrapText(tad.projectName || 'GHL Implementation', boldFont, 13, CONTENT_W - 30);
  cover.drawText(pnLines[0] || tad.projectName, { x: MARGIN + 15, y: 465, size: 13, font: boldFont, color: rgb(0.6, 0.8, 1) });

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  cover.drawText(`Date: ${dateStr}`, { x: MARGIN + 15, y: 445, size: 9, font: regularFont, color: C.medGray });

  // CONFIDENTIAL watermark
  cover.drawText('CONFIDENTIAL', {
    x: 120, y: 250, size: 60, font: boldFont,
    color: rgb(1, 1, 1, 0.06), rotate: degrees(-30),
  });

  // Version
  cover.drawText('Version 1.0', { x: MARGIN, y: 60, size: 9, font: regularFont, color: C.medGray });
  cover.drawText('Generated by TAD Generator', { x: PAGE_W - MARGIN - 140, y: 60, size: 9, font: regularFont, color: C.medGray });

  // ── PAGE COUNTER ────────────────────────────────────────
  let pageNum = 1;

  const addSection = (lines, startY, { page, y: curY }) => {
    // Returns updated {page, y}
    return { page, y: curY };
  };

  // Helper to ensure enough space, otherwise add new page
  const ensureSpace = (state, needed) => {
    if (state.y - needed < MIN_Y) {
      pageNum++;
      const next = addPageWithHeader(pdfDoc, boldFont, regularFont, tad.projectName || 'TAD', pageNum);
      return next;
    }
    return state;
  };

  const drawHeading1 = (state, text) => {
    let s = ensureSpace(state, 50);
    s.page.drawRectangle({ x: MARGIN - 5, y: s.y - 6, width: CONTENT_W + 10, height: 26, color: C.blue });
    s.page.drawText(text, { x: MARGIN, y: s.y + 2, size: 13, font: boldFont, color: C.white });
    s.y -= 36;
    return s;
  };

  const drawHeading2 = (state, text) => {
    let s = ensureSpace(state, 40);
    s.page.drawText(text, { x: MARGIN, y: s.y, size: 11, font: boldFont, color: C.blue });
    s.page.drawLine({ start: { x: MARGIN, y: s.y - 3 }, end: { x: MARGIN + CONTENT_W, y: s.y - 3 }, thickness: 0.5, color: C.blue });
    s.y -= 22;
    return s;
  };

  const drawBody = (state, text) => {
    if (!text) return state;
    let s = ensureSpace(state, 20);
    const lines = wrapText(String(text), regularFont, 10, CONTENT_W);
    for (const line of lines) {
      s = ensureSpace(s, 16);
      s.page.drawText(line, { x: MARGIN, y: s.y, size: 10, font: regularFont, color: C.darkGray });
      s.y -= 16;
    }
    s.y -= 6;
    return s;
  };

  const drawBullet = (state, text, indent = 0) => {
    if (!text) return state;
    let s = ensureSpace(state, 16);
    const bx = MARGIN + 10 + indent;
    s.page.drawCircle({ x: bx, y: s.y + 4, size: 2.5, color: C.blue });
    const lines = wrapText(String(text), regularFont, 10, CONTENT_W - 20 - indent);
    s.page.drawText(lines[0] || '', { x: bx + 10, y: s.y, size: 10, font: regularFont, color: C.darkGray });
    s.y -= 16;
    for (let i = 1; i < lines.length; i++) {
      s = ensureSpace(s, 16);
      s.page.drawText(lines[i], { x: bx + 10, y: s.y, size: 10, font: regularFont, color: C.darkGray });
      s.y -= 16;
    }
    return s;
  };

  const gap = (state, px = 10) => ({ ...state, y: state.y - px });

  // ── TABLE OF CONTENTS ────────────────────────────────────
  pageNum++;
  let state = addPageWithHeader(pdfDoc, boldFont, regularFont, tad.projectName || 'TAD', pageNum);
  state.page.drawText('TABLE OF CONTENTS', { x: MARGIN, y: state.y, size: 16, font: boldFont, color: C.blue });
  state.y -= 30;

  const tocItems = [
    '1. Executive Summary', '2. Project Objectives', '3. Current Challenges',
    '4. Proposed Solution', '5. Technical Architecture', '6. Implementation Plan',
    '7. Integrations', '8. Automations', '9. Data Management',
    '10. Security & Compliance', '11. Testing & QA', '12. Training & Support',
    '13. Timeline', '14. Investment Summary', '15. Risks & Mitigations',
    '16. Success Metrics', '17. Next Steps',
  ];
  for (const item of tocItems) {
    state = ensureSpace(state, 20);
    state.page.drawText(item, { x: MARGIN + 10, y: state.y, size: 10, font: regularFont, color: C.darkGray });
    state.y -= 20;
  }

  // ── SECTIONS ─────────────────────────────────────────────
  // 1. Executive Summary
  pageNum++;
  state = addPageWithHeader(pdfDoc, boldFont, regularFont, tad.projectName || 'TAD', pageNum);
  state = drawHeading1(state, '1. Executive Summary');
  state = drawBody(state, tad.executiveSummary);

  // 2. Project Objectives
  state = gap(state, 8);
  state = drawHeading1(state, '2. Project Objectives');
  for (const obj of (tad.projectObjectives || [])) state = drawBullet(state, obj);

  // 3. Current Challenges
  state = gap(state, 8);
  state = drawHeading1(state, '3. Current Challenges');
  for (const ch of (tad.currentChallenges || [])) state = drawBullet(state, ch);

  // 4. Proposed Solution
  state = gap(state, 8);
  state = drawHeading1(state, '4. Proposed Solution');
  state = drawBody(state, tad.proposedSolution?.overview);
  state = drawHeading2(state, 'Key Features');
  for (const f of (tad.proposedSolution?.keyFeatures || [])) state = drawBullet(state, f);
  state = drawHeading2(state, 'GHL Modules Used');
  for (const m of (tad.proposedSolution?.ghlModulesUsed || [])) state = drawBullet(state, m);

  // 5. Technical Architecture
  state = gap(state, 8);
  state = drawHeading1(state, '5. Technical Architecture');
  state = drawBody(state, tad.technicalArchitecture?.overview);
  for (const comp of (tad.technicalArchitecture?.components || [])) {
    state = drawHeading2(state, comp.name);
    state = drawBody(state, comp.description);
    state = drawBody(state, `Implementation: ${comp.implementation}`);
  }

  // 6. Implementation Plan
  state = gap(state, 8);
  state = drawHeading1(state, '6. Implementation Plan');
  for (const ph of (tad.implementationPlan?.phases || [])) {
    state = drawHeading2(state, `Phase ${ph.phase}: ${ph.name} (${ph.duration})`);
    state = drawBody(state, 'Tasks:');
    for (const t of (ph.tasks || [])) state = drawBullet(state, t);
    state = drawBody(state, 'Deliverables:');
    for (const d of (ph.deliverables || [])) state = drawBullet(state, d, 10);
    state = gap(state, 6);
  }

  // 7. Integrations
  state = gap(state, 8);
  state = drawHeading1(state, '7. Integrations');
  for (const intg of (tad.integrations || [])) {
    state = drawHeading2(state, intg.name);
    state = drawBody(state, `Purpose: ${intg.purpose}`);
    state = drawBody(state, `Method: ${intg.method}`);
  }

  // 8. Automations
  state = gap(state, 8);
  state = drawHeading1(state, '8. Automations');
  for (const auto of (tad.automations || [])) {
    state = drawHeading2(state, auto.name);
    state = drawBody(state, `Trigger: ${auto.trigger}`);
    state = drawBody(state, 'Actions:');
    for (const a of (auto.actions || [])) state = drawBullet(state, a);
    state = drawBody(state, `Outcome: ${auto.outcome}`);
  }

  // 9. Data Management
  state = gap(state, 8);
  state = drawHeading1(state, '9. Data Management');
  state = drawBody(state, tad.dataManagement?.strategy);
  state = drawHeading2(state, 'Data Points');
  for (const dp of (tad.dataManagement?.dataPoints || [])) state = drawBullet(state, dp);

  // 10. Security & Compliance
  state = gap(state, 8);
  state = drawHeading1(state, '10. Security & Compliance');
  for (const sc of (tad.securityCompliance || [])) state = drawBullet(state, sc);

  // 11. Testing & QA
  state = gap(state, 8);
  state = drawHeading1(state, '11. Testing & QA');
  state = drawBody(state, tad.testingQA?.approach);
  state = drawHeading2(state, 'Test Cases');
  for (const tc of (tad.testingQA?.testCases || [])) state = drawBullet(state, tc);

  // 12. Training & Support
  state = gap(state, 8);
  state = drawHeading1(state, '12. Training & Support');
  state = drawBody(state, tad.trainingSupport?.plan);
  state = drawHeading2(state, 'Resources');
  for (const r of (tad.trainingSupport?.resources || [])) state = drawBullet(state, r);

  // 13. Timeline
  state = gap(state, 8);
  state = drawHeading1(state, '13. Timeline');
  state = drawBody(state, tad.timeline);

  // 14. Investment Summary
  state = gap(state, 8);
  state = drawHeading1(state, '14. Investment Summary');
  state = drawBody(state, `Setup Fee: ${tad.investmentSummary?.setupFee}`);
  state = drawBody(state, `Monthly Retainer: ${tad.investmentSummary?.monthlyRetainer}`);
  state = drawBody(state, `Notes: ${tad.investmentSummary?.notes}`);

  // 15. Risks & Mitigations
  state = gap(state, 8);
  state = drawHeading1(state, '15. Risks & Mitigations');
  for (const rm of (tad.risksMitigations || [])) {
    state = drawHeading2(state, `Risk: ${rm.risk}`);
    state = drawBody(state, `Mitigation: ${rm.mitigation}`);
  }

  // 16. Success Metrics
  state = gap(state, 8);
  state = drawHeading1(state, '16. Success Metrics');
  for (const sm of (tad.successMetrics || [])) state = drawBullet(state, sm);

  // 17. Next Steps
  state = gap(state, 8);
  state = drawHeading1(state, '17. Next Steps');
  for (const ns of (tad.nextSteps || [])) state = drawBullet(state, ns);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ─────────────────────────────────────────────────────────────
// DOCX GENERATION
// ─────────────────────────────────────────────────────────────
function docxHeading1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 150 },
    shading: { type: ShadingType.SOLID, color: '1a56db', fill: '1a56db' },
    style: 'heading1Blue',
  });
}

function docxHeading2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
  });
}

function docxBody(text) {
  return new Paragraph({
    children: [new TextRun({ text: String(text || ''), size: 22, color: '374151' })],
    spacing: { after: 100 },
  });
}

function docxBullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text: String(text || ''), size: 22 })],
    bullet: { level },
    spacing: { after: 80 },
  });
}

function docxLabel(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22, color: '1a56db' }),
      new TextRun({ text: String(value || ''), size: 22 }),
    ],
    spacing: { after: 100 },
  });
}

function docxTableForPhases(phases) {
  const headerRow = new TableRow({
    children: ['Phase', 'Name', 'Duration', 'Deliverables'].map(h =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: 'FFFFFF' })] })],
        shading: { type: ShadingType.SOLID, color: '1a56db', fill: '1a56db' },
        width: { size: 2500, type: WidthType.DXA },
      })
    ),
  });
  const dataRows = (phases || []).map(ph =>
    new TableRow({
      children: [
        new TableCell({ children: [docxBody(`${ph.phase}`)], width: { size: 800, type: WidthType.DXA } }),
        new TableCell({ children: [docxBody(ph.name)], width: { size: 3000, type: WidthType.DXA } }),
        new TableCell({ children: [docxBody(ph.duration)], width: { size: 2000, type: WidthType.DXA } }),
        new TableCell({
          children: (ph.deliverables || []).map(d => docxBullet(d)),
          width: { size: 4200, type: WidthType.DXA },
        }),
      ],
    })
  );
  return new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } });
}

function docxTableForKeyValue(rows, headers) {
  const headerRow = new TableRow({
    children: headers.map(h =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: 'FFFFFF' })] })],
        shading: { type: ShadingType.SOLID, color: '1a56db', fill: '1a56db' },
        width: { size: Math.floor(10000 / headers.length), type: WidthType.DXA },
      })
    ),
  });
  const dataRows = rows.map(row =>
    new TableRow({
      children: row.map(cell =>
        new TableCell({
          children: [docxBody(cell)],
          width: { size: Math.floor(10000 / headers.length), type: WidthType.DXA },
        })
      ),
    })
  );
  return new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } });
}

export async function generateDOCX(tad) {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'heading1Blue',
          name: 'Heading 1 Blue',
          basedOn: 'Heading1',
          run: { color: 'FFFFFF', bold: true, size: 26 },
          paragraph: { spacing: { before: 300, after: 150 } },
        },
      ],
    },
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `Confidential | ${tad.projectName} TAD`, size: 18, color: '6B7280' }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Page ', size: 18, color: '6B7280' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '6B7280' }),
                  new TextRun({ text: ' of ', size: 18, color: '6B7280' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '6B7280' }),
                  new TextRun({ text: '   |   CONFIDENTIAL', size: 18, color: '6B7280' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          // ── COVER PAGE ──
          new Paragraph({
            children: [new TextRun({ text: 'TECHNICAL APPROACH DOCUMENT', bold: true, size: 52, color: '1a56db' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 800, after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: tad.clientName || 'Client', bold: true, size: 36, color: '374151' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: tad.projectName || 'GHL Implementation', size: 28, color: '6B7280' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: dateStr, size: 22, color: '9CA3AF' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'CONFIDENTIAL', bold: true, size: 22, color: 'EF4444' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 1200 },
          }),

          // ── TABLE OF CONTENTS ──
          new Paragraph({ children: [new TextRun({ text: 'TABLE OF CONTENTS', bold: true, size: 32, color: '1a56db' })], spacing: { before: 400, after: 300 } }),
          ...[
            '1. Executive Summary', '2. Project Objectives', '3. Current Challenges',
            '4. Proposed Solution', '5. Technical Architecture', '6. Implementation Plan',
            '7. Integrations', '8. Automations', '9. Data Management',
            '10. Security & Compliance', '11. Testing & QA', '12. Training & Support',
            '13. Timeline', '14. Investment Summary', '15. Risks & Mitigations',
            '16. Success Metrics', '17. Next Steps',
          ].map(item => new Paragraph({ children: [new TextRun({ text: item, size: 22 })], spacing: { after: 100 } })),

          // ── SECTION 1: Executive Summary ──
          docxHeading1('1. Executive Summary'),
          docxBody(tad.executiveSummary),

          // ── SECTION 2: Project Objectives ──
          docxHeading1('2. Project Objectives'),
          ...(tad.projectObjectives || []).map(o => docxBullet(o)),

          // ── SECTION 3: Current Challenges ──
          docxHeading1('3. Current Challenges'),
          ...(tad.currentChallenges || []).map(c => docxBullet(c)),

          // ── SECTION 4: Proposed Solution ──
          docxHeading1('4. Proposed Solution'),
          docxBody(tad.proposedSolution?.overview),
          docxHeading2('Key Features'),
          ...(tad.proposedSolution?.keyFeatures || []).map(f => docxBullet(f)),
          docxHeading2('GHL Modules Used'),
          ...(tad.proposedSolution?.ghlModulesUsed || []).map(m => docxBullet(m)),

          // ── SECTION 5: Technical Architecture ──
          docxHeading1('5. Technical Architecture'),
          docxBody(tad.technicalArchitecture?.overview),
          ...(tad.technicalArchitecture?.components || []).flatMap(c => [
            docxHeading2(c.name),
            docxBody(c.description),
            docxLabel('Implementation', c.implementation),
          ]),

          // ── SECTION 6: Implementation Plan ──
          docxHeading1('6. Implementation Plan'),
          docxTableForPhases(tad.implementationPlan?.phases),
          new Paragraph({ text: '', spacing: { after: 200 } }),

          // ── SECTION 7: Integrations ──
          docxHeading1('7. Integrations'),
          docxTableForKeyValue(
            (tad.integrations || []).map(i => [i.name, i.purpose, i.method]),
            ['Integration', 'Purpose', 'Method']
          ),
          new Paragraph({ text: '', spacing: { after: 200 } }),

          // ── SECTION 8: Automations ──
          docxHeading1('8. Automations'),
          ...(tad.automations || []).flatMap(a => [
            docxHeading2(a.name),
            docxLabel('Trigger', a.trigger),
            new Paragraph({ children: [new TextRun({ text: 'Actions:', bold: true, size: 22 })], spacing: { after: 80 } }),
            ...(a.actions || []).map(ac => docxBullet(ac)),
            docxLabel('Outcome', a.outcome),
          ]),

          // ── SECTION 9: Data Management ──
          docxHeading1('9. Data Management'),
          docxBody(tad.dataManagement?.strategy),
          docxHeading2('Data Points'),
          ...(tad.dataManagement?.dataPoints || []).map(dp => docxBullet(dp)),

          // ── SECTION 10: Security & Compliance ──
          docxHeading1('10. Security & Compliance'),
          ...(tad.securityCompliance || []).map(sc => docxBullet(sc)),

          // ── SECTION 11: Testing & QA ──
          docxHeading1('11. Testing & QA'),
          docxBody(tad.testingQA?.approach),
          docxHeading2('Test Cases'),
          ...(tad.testingQA?.testCases || []).map(tc => docxBullet(tc)),

          // ── SECTION 12: Training & Support ──
          docxHeading1('12. Training & Support'),
          docxBody(tad.trainingSupport?.plan),
          docxHeading2('Resources'),
          ...(tad.trainingSupport?.resources || []).map(r => docxBullet(r)),

          // ── SECTION 13: Timeline ──
          docxHeading1('13. Timeline'),
          docxBody(tad.timeline),

          // ── SECTION 14: Investment Summary ──
          docxHeading1('14. Investment Summary'),
          docxLabel('Setup Fee', tad.investmentSummary?.setupFee),
          docxLabel('Monthly Retainer', tad.investmentSummary?.monthlyRetainer),
          docxLabel('Notes', tad.investmentSummary?.notes),

          // ── SECTION 15: Risks & Mitigations ──
          docxHeading1('15. Risks & Mitigations'),
          docxTableForKeyValue(
            (tad.risksMitigations || []).map(rm => [rm.risk, rm.mitigation]),
            ['Risk', 'Mitigation']
          ),
          new Paragraph({ text: '', spacing: { after: 200 } }),

          // ── SECTION 16: Success Metrics ──
          docxHeading1('16. Success Metrics'),
          ...(tad.successMetrics || []).map(sm => docxBullet(sm)),

          // ── SECTION 17: Next Steps ──
          docxHeading1('17. Next Steps'),
          ...(tad.nextSteps || []).map(ns => docxBullet(ns)),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
