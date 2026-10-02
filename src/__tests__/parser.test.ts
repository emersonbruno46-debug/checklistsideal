import { parseDocumentStructure } from '../lib/parser';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Sanity Test Failed: ${message}`);
  }
}

export function runParserUnitTests() {
  // Test 1: "Anote o resultado." -> ZERO scenarios
  const res1 = parseDocumentStructure('Anote o resultado.');
  assert(res1.sections[0].scenarios.length === 0, '"Anote o resultado." should produce 0 scenarios');

  // Test 2: "Observação: ______" -> ZERO scenarios
  const res2 = parseDocumentStructure('Observação: ______');
  assert(res2.sections[0].scenarios.length === 0, '"Observação: ______" should produce 0 scenarios');

  // Test 3: "FUNCIONOU" -> ZERO scenarios
  const res3 = parseDocumentStructure('FUNCIONOU\nNÃO FUNCIONOU\nFUNCIONOU COM PROBLEMA');
  assert(res3.sections[0].scenarios.length === 0, '"FUNCIONOU" should produce 0 scenarios');

  // Test 4: "Tela: ______ Navegador: ______ Print/vídeo: ______" -> ZERO scenarios
  const res4 = parseDocumentStructure('Tela: ______\nNavegador: ______\nPrint/vídeo: ______');
  assert(res4.sections[0].scenarios.length === 0, 'Metadata/Context fields should produce 0 scenarios');

  // Test 5: Compound scenario
  const res5 = parseDocumentStructure(`
  Escolha produto.
  Escolha tamanho.
  Adicione ao carrinho.
  Verifique se o total aumenta.
  `);
  const scen5 = res5.sections[0].scenarios[0];
  assert(Boolean(scen5) && scen5.steps.length === 3 && scen5.assertions.length === 1, 'Compound scenario step/assertion count mismatch');

  // Test 6: Step + Assertion
  const res6 = parseDocumentStructure(`
  Atualize a página.
  Pedido continua salvo.
  `);
  const scen6 = res6.sections[0].scenarios[0];
  assert(Boolean(scen6) && scen6.steps.length === 1 && scen6.assertions.length === 1, 'Step + Assertion count mismatch');

  return true;
}

runParserUnitTests();
