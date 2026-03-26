

const Masks = (() => {

  // ─── Funções de transformação ──────────────────────────────

  /**
   * phone
   * Formata um número de telefone brasileiro com DDD.
   * Suporta celular (9 dígitos) e fixo (8 dígitos).
   *
   * Exemplos:
   *   "85999990000" → "(85) 99999-0000"
   *   "8533330000"  → "(85) 3333-0000"
   *
   * @param {string} rawValue - valor bruto do campo
   * @returns {string}
   */
  function phone(rawValue) {
    const digits = rawValue.replace(/\D/g, '').substring(0, 11);
    const len    = digits.length;

    if (len === 0) return '';
    if (len <= 2)  return `(${digits}`;
    if (len <= 6)  return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

    // Celular: 11 dígitos — (XX) XXXXX-XXXX
    if (len > 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    // Fixo: 10 dígitos — (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  /**
   * cep
   * Formata CEP brasileiro no padrão 00000-000.
   *
   * Exemplo:
   *   "60000000" → "60000-000"
   *
   * @param {string} rawValue
   * @returns {string}
   */
  function cep(rawValue) {
    const digits = rawValue.replace(/\D/g, '').substring(0, 8);
    return digits.length > 5
      ? `${digits.slice(0, 5)}-${digits.slice(5)}`
      : digits;
  }

  // ─── Mapa de máscaras disponíveis ─────────────────────────
  /**
   * Associa o valor do atributo `data-mask` à função de transformação.
   */
  const maskFunctions = { phone, cep };

  // ─── API pública ───────────────────────────────────────────

  /**
   * bindMasks
   * Percorre todos os elementos que possuem `data-mask` no DOM e
   * registra um listener de `input` que aplica a máscara em tempo real.
   *
   * Deve ser chamada uma única vez, após o DOM estar pronto.
   */
  function bindMasks() {
    const maskedFields = document.querySelectorAll('[data-mask]');

    maskedFields.forEach((field) => {
      const maskName = field.dataset.mask;
      const maskFn   = maskFunctions[maskName];

      if (typeof maskFn !== 'function') {
        console.warn(`[Masks] Máscara desconhecida: "${maskName}"`);
        return;
      }

      field.addEventListener('input', () => {
        field.value = maskFn(field.value);
      });
    });
  }

  return { bindMasks };

})();