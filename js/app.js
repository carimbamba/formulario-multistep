
/**
 * bootstrap
 * Função de inicialização executada quando o DOM estiver pronto.
 * Separa o "ponto de entrada" dos módulos individuais,
 * facilitando testes e futuras substituições.
 */
function bootstrap() {
  Masks.bindMasks();
  Wizard.init();
}

// Garante que o DOM esteja completamente carregado antes de inicializar.
// Como os scripts são carregados ao final do <body>, o evento já pode ter
// disparado; o check abaixo cobre ambos os casos.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}