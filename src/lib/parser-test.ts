import { parseDocumentStructure } from './parser';

export function runParserSanityTests(): boolean {
  console.log('Running QA Document Parser Engine Sanity Checks...');

  // Test 1: "Anote o resultado." -> ZERO scenarios
  const res1 = parseDocumentStructure('Anote o resultado.');
  if (res1.sections[0].scenarios.length !== 0) {
    console.error('Test 1 Failed: "Anote o resultado." created scenarios!');
    return false;
  }

  // Test 2: "Observação: ______" -> ZERO scenarios
  const res2 = parseDocumentStructure('Observação: ______');
  if (res2.sections[0].scenarios.length !== 0) {
    console.error('Test 2 Failed: "Observação: ______" created scenarios!');
    return false;
  }

  // Test 3: "FUNCIONOU" -> ZERO scenarios
  const res3 = parseDocumentStructure('FUNCIONOU\nNÃO FUNCIONOU\nFUNCIONOU COM PROBLEMA');
  if (res3.sections[0].scenarios.length !== 0) {
    console.error('Test 3 Failed: "FUNCIONOU" created scenarios!');
    return false;
  }

  // Test 4: "Tela: ______ Navegador: ______ Print/vídeo: ______" -> ZERO scenarios
  const res4 = parseDocumentStructure('Tela: ______\nNavegador: ______\nPrint/vídeo: ______');
  if (res4.sections[0].scenarios.length !== 0) {
    console.error('Test 4 Failed: Context fields created scenarios!');
    return false;
  }

  // Test 5: Compound scenario
  const res5 = parseDocumentStructure(`
  Escolha produto.
  Escolha tamanho.
  Adicione ao carrinho.
  Verifique se o total aumenta.
  `);
  const scen5 = res5.sections[0].scenarios[0];
  if (!scen5 || scen5.steps.length !== 3 || scen5.assertions.length !== 1) {
    console.error('Test 5 Failed: Compound scenario mismatch!', scen5);
    return false;
  }

  // Test 6: Step + Assertion
  const res6 = parseDocumentStructure(`
  Atualize a página.
  Pedido continua salvo.
  `);
  const scen6 = res6.sections[0].scenarios[0];
  if (!scen6 || scen6.steps.length !== 1 || scen6.assertions.length !== 1) {
    console.error('Test 6 Failed: Step + Assertion mismatch!', scen6);
    return false;
  }

  console.log('All QA Document Parser Engine Sanity Checks Passed Successfully! ✓');
  return true;
}

// Execute tests
runParserSanityTests();
