import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Project, TestRun, ChecklistScenario, ScenarioResult, ChecklistSection } from '@/types/database';

export function copyProblemsToClipboard(
  project: Project,
  scenarios: ChecklistScenario[],
  scenarioResults: Record<string, ScenarioResult>
): string {
  const problems = scenarios.filter((scen) => {
    const res = scenarioResults[scen.id] || scenarioResults[`${scen.checklist_template_id}_${scen.id}`];
    return res && (res.result === 'no' || res.result === 'caveat');
  });

  if (problems.length === 0) {
    const cleanMsg = `PROJETO: ${project.name}\n${project.website_url ? `URL: ${project.website_url}\n` : ''}\nNenhum problema encontrado nesta auditoria! Todos os cenários foram aprovados.`;
    navigator.clipboard.writeText(cleanMsg);
    return cleanMsg;
  }

  let text = `PROJETO: ${project.name}\n`;
  if (project.website_url) {
    text += `URL: ${project.website_url}\n`;
  }
  text += `DATA DA AUDITORIA: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
  text += `--- PROBLEMAS E RESSALVAS ENCONTRADOS (${problems.length} CENÁRIOS) ---\n\n`;

  problems.forEach((scen, index) => {
    const res = scenarioResults[scen.id] || scenarioResults[`${scen.checklist_template_id}_${scen.id}`];
    const statusText = res.result === 'no' ? 'NÃO FUNCIONA' : 'COM RESSALVA';
    const severityText = res.severity
      ? res.severity === 'critical' ? 'Crítica' : res.severity === 'high' ? 'Alta' : res.severity === 'medium' ? 'Média' : 'Baixa'
      : 'Não especificada';

    text += `${index + 1}. CENÁRIO: ${scen.title.toUpperCase()}\n`;
    if (scen.section_title) text += `Seção: ${scen.section_title}\n`;
    text += `Status: ${statusText}\n`;
    if (res.result === 'no') {
      text += `Gravidade: ${severityText}\n`;
    }

    if (scen.steps && scen.steps.length > 0) {
      text += `Passos executados:\n`;
      scen.steps.forEach((st) => {
        text += `  ${st.order}. ${st.text}\n`;
      });
    }

    if (scen.assertions && scen.assertions.length > 0) {
      text += `Validações:\n`;
      scen.assertions.forEach((as) => {
        const astStatus = res.assertion_results?.[as.id] || 'pending';
        const symbol = astStatus === 'passed' ? '✓' : astStatus === 'failed' ? '✕' : '⚠';
        text += `  [${symbol}] ${as.text}\n`;
      });
    }

    text += `Observação: ${res.note || 'Sem observações adicionais.'}\n\n`;
  });

  navigator.clipboard.writeText(text);
  return text;
}

export function exportToCSV(
  project: Project,
  run: TestRun,
  scenarios: ChecklistScenario[],
  sections: ChecklistSection[],
  scenarioResults: Record<string, ScenarioResult>
) {
  const rows = [
    ['Projeto', project.name],
    ['URL', project.website_url || 'N/A'],
    ['Testador', run.tester_name],
    ['Data', new Date(run.started_at).toLocaleDateString('pt-BR')],
    [''],
    ['Seção', 'Cenário de Teste', 'Passos', 'Validações (Assertions)', 'Resultado Geral', 'Gravidade', 'Observações'],
  ];

  scenarios.forEach((scen) => {
    const res = scenarioResults[scen.id] || scenarioResults[`${run.id}_${scen.id}`];
    const secTitle = scen.section_title || 'Geral';
    const resultStr = !res || res.result === 'unanswered' ? 'Pendente' : res.result === 'yes' ? 'Aprovado' : res.result === 'no' ? 'Não Funciona' : 'Com Ressalva';
    const sev = res?.severity || 'N/A';
    const note = res?.note ? res.note.replace(/\n/g, ' ') : '';

    const stepsStr = scen.steps ? scen.steps.map((s) => `${s.order}. ${s.text}`).join(' | ') : '';
    const assertionsStr = scen.assertions ? scen.assertions.map((a) => a.text).join(' | ') : '';

    rows.push([
      secTitle,
      `"${scen.title.replace(/"/g, '""')}"`,
      `"${stepsStr.replace(/"/g, '""')}"`,
      `"${assertionsStr.replace(/"/g, '""')}"`,
      resultStr,
      sev,
      `"${note.replace(/"/g, '""')}"`,
    ]);
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
  scenarios: ChecklistScenario[],
  scenarioResults: Record<string, ScenarioResult>
) {
  const exportData = {
    project,
    test_run: run,
    scenarios: scenarios.map((scen) => ({
      ...scen,
      result: scenarioResults[scen.id] || { result: 'unanswered' },
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
