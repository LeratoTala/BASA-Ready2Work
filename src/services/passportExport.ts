import { jsPDF } from 'jspdf';
import { CandidateProfile, SkillClaim } from '../domain/types';

export function generateLinkedInSummary(candidate: CandidateProfile, claims: SkillClaim[]): string {
  const skillsBlock = claims
    .map((c) => {
      const assessmentTag =
        c.verificationStatus === 'Task-assessed'
          ? ' [Task-assessed]'
          : c.verificationStatus === 'Peer-endorsed'
          ? ' [Peer-endorsed]'
          : ` [${c.verificationStatus}]`;
      return `• ${c.skillName}${assessmentTag}\n  Evidence: ${c.evidenceTitle} - ${c.evidenceDescription}`;
    })
    .join('\n\n');

  return `BASA: Ready2Work Skills and Evidence Summary
👤 ${candidate.fullName} | ${candidate.headline}
📍 Location: ${candidate.locationArea} (South Africa)
⏱️ Availability: ${candidate.availability.replace('_', ' ').toUpperCase()}

I'm sharing my recorded skills and evidence for entry-level work:

Skills and evidence:
${skillsBlock || 'No skill claims recorded yet.'}

#SkillsFirst #Ready2Work #SouthAfrica #YouthEmployment #VocationalSkills #POPIA`;
}

export function generatePassportPdf(candidate: CandidateProfile, claims: SkillClaim[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Header Banner (Dark Slate)
  doc.setFillColor(24, 24, 27); // #18181b
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent Gold Line
  doc.setFillColor(217, 119, 6); // #d97706
  doc.rect(0, 38, pageWidth, 2.5, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('BASA: Ready2Work', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(245, 158, 11); // Amber
  doc.text('SKILLS AND EVIDENCE SUMMARY · SOUTH AFRICA', 14, 22);

  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text('Skills → Evidence → Work · Section 3.3 Honest Verification Framework', 14, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Issued: ${new Date().toLocaleDateString('en-ZA')}`, pageWidth - 14, 22, { align: 'right' });

  // Candidate Overview Section
  let currentY = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27);
  doc.text(candidate.fullName, 14, currentY);

  currentY += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(candidate.headline, 14, currentY);

  currentY += 6;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Location Area: ${candidate.locationArea}  |  Availability: ${candidate.availability.replace('_', ' ').toUpperCase()}`,
    14,
    currentY
  );

  currentY += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, currentY, pageWidth - 14, currentY);

  // Experience Summary Box
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('Candidate Profile Summary', 14, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const summaryLines = doc.splitTextToSize(
    candidate.experienceSummary ||
      'No experience summary provided.',
    pageWidth - 28
  );
  doc.text(summaryLines, 14, currentY);
  currentY += summaryLines.length * 5 + 6;

  // Evidence Section Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('Demonstrated Skills & Evidence Trail (Section 3.3)', 14, currentY);

  currentY += 6;

  // Iterate Claims and print structured cards
  claims.forEach((claim, index) => {
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    // Card background
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'FD');

    // Skill Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${index + 1}. ${claim.skillName}`, 18, currentY + 6);

    // Verification Badge Tag
    doc.setFontSize(8);
    let badgeColor = [71, 85, 105]; // Slate for self-reported
    if (claim.verificationStatus === 'Task-assessed') badgeColor = [4, 120, 87]; // Emerald
    if (claim.verificationStatus === 'Peer-endorsed') badgeColor = [180, 83, 9]; // Amber
    if (claim.verificationStatus === 'Mentor-reviewed') badgeColor = [29, 78, 216]; // Blue

    doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`[ ${claim.verificationStatus.toUpperCase()} ]`, pageWidth - 20, currentY + 6, {
      align: 'right',
    });

    // Evidence Title & Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Evidence: ${claim.evidenceTitle}`, 18, currentY + 12);

    const descLines = doc.splitTextToSize(claim.evidenceDescription, pageWidth - 36);
    doc.text(descLines.slice(0, 2), 18, currentY + 17);

    // Footnote of card
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const evidenceRecord = claim.assessmentId
      ? `Assessment record: ${claim.assessmentId}`
      : claim.peerEndorserName
      ? `Peer listed: ${claim.peerEndorserName}`
      : 'Candidate-entered evidence';
    doc.text(evidenceRecord, 18, currentY + 24);

    currentY += 32;
  });

  // Security & POPIA Compliance Footer Box
  const footerY = 260;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, footerY, pageWidth - 28, 24, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('BASA SKILLS AND EVIDENCE SUMMARY', 18, footerY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'This credential reflects honest verification standards (Self-reported, Peer-endorsed, Task-assessed, Mentor-reviewed).',
    18,
    footerY + 11
  );
  doc.text(
    'Contact details are not included. Never pay to get a job; report upfront fee requests.',
    18,
    footerY + 15
  );
  doc.text('Verification labels describe recorded evidence and do not guarantee work outcomes.', 18, footerY + 19);

  // Save the PDF
  const filename = `BASA_Skills_Evidence_${candidate.fullName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
