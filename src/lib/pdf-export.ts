import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Project, TestRun, ChecklistItem, TestAnswer, ChecklistCategory } from '@/types/database';

interface ExportData {
  project: Project;
  run: TestRun;
  items: ChecklistItem[];
  categories: ChecklistCategory[];
  answers: Record<string, TestAnswer>;
  onlyProblems?: boolean;
}

export function copyProblemsToClipboard(
  project: Project,
  items: ChecklistItem[],
  answers: Record<string, TestAnswer>
): string {
  const problems = items.filter((item) => {
    const ans = answers[item.id];
    return ans && (ans.result === 'no' || ans.result === 'caveat');
  });

  if (problems.length === 0) {
    const cleanMsg = `PROJETO: ${project.name}\n${project.website_url ? `URL: ${project.website_url}\n` : ''}\nNenhum problema encontrado neste checklist! Todos os testes foram aprovados.`;
    navigator.clipboard.writeText(cleanMsg);
    return cleanMsg;
  }

  let text = `PROJETO: ${project.name}\n`;
  if (project.website_url) {
    text += `URL: ${project.website_url}\n`;
  }
  text += `DATA DA AUDITORIA: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
  text += `--- PROBLEMAS ENCONTRADOS (${problems.length}) ---\n\n`;

  problems.forEach((item, index) => {
    const ans = answers[item.id];
    const statusText = ans.result === 'no' ? 'Não funciona' : 'Com ressalva';
    const severityText = ans.severity
      ? ans.severity === 'critical' ? 'Crítica' : ans.severity === 'high' ? 'Alta' : ans.severity === 'medium' ? 'Média' : 'Baixa'
      : 'Não especificada';

    text += `${index + 1}. ${item.question.toUpperCase()}\n`;
    text += `Status: ${statusText}\n`;
    if (ans.result === 'no') {
      text += `Gravidade: ${severityText}\n`;
    }
    text += `Observação: ${ans.note || 'Sem observações adicionais.'}\n\n`;
  });

  navigator.clipboard.writeText(text);
  return text;
}

export function exportToCSV(
  project: Project,
  run: TestRun,
  items: ChecklistItem[],
  categories: ChecklistCategory[],
  answers: Record<string, TestAnswer>
) {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const rows = [
    ['Projeto', project.name],
    ['URL', project.website_url || 'N/A'],
    ['Testador', run.tester_name],
    ['Data', new Date(run.started_at).toLocaleDateString('pt-BR')],
    [''],
    ['Categoria', 'Pergunta / Teste', 'Resultado', 'Gravidade', 'Observações / Ressalvas'],
  ];

  items.forEach((item) => {
    const ans = answers[item.id];
    const catName = (item.category_id && catMap.get(item.category_id)) || item.category_name || 'Geral';
    const res = !ans || ans.result === 'unanswered' ? 'Pendente' : ans.result === 'yes' ? 'Aprovado' : ans.result === 'no' ? 'Não Funciona' : 'Com Ressalva';
    const sev = ans?.severity ? ans.severity : 'N/A';
    const note = ans?.note ? ans.note.replace(/\n/g, ' ') : '';

    rows.push([catName, `"${item.question.replace(/"/g, '""')}"`, res, sev, `"${note.replace(/"/g, '""')}"`]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `relatorio_${project.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(
  project: Project,
  run: TestRun,
  items: ChecklistItem[],
  answers: Record<string, TestAnswer>
) {
  const exportData = {
    project,
    test_run: run,
    items: items.map((item) => ({
      ...item,
      answer: answers[item.id] || { result: 'unanswered' },
    })),
    exported_at: new Date().toISOString(),
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `auditoria_${project.name.toLowerCase().replace(/\s+/g, '_')}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Generate PDF report from element or programmatic PDF construction
 */
export async function generatePDFReport(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    let imgY = 0;

    const pageHeight = (imgHeight * pdfWidth) / canvas.width;
    let heightLeft = pageHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, (imgHeight * pdfWidth) / canvas.width);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, (imgHeight * pdfWidth) / canvas.width);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${filename}.pdf`);
  } catch (e) {
    console.error('PDF export fallback to browser print', e);
    window.print();
  }
}
