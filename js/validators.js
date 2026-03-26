
const Validators = (() => {

  // ─── Funções de regra ──────────────────────────────────────
  /**
   * Coleção de regras de validação puras.
   * Cada entrada: (value: string, args: string[]) => string | null
   */
  const rules = {

    /**
     * required
     * Rejeita valores vazios ou compostos apenas por espaços.
     */
    required(value) {
      return value.trim() === ''
        ? 'Campo obrigatório.'
        : null;
    },

    /**
     * email
     * Valida o formato básico de endereço de e-mail.
     */
    email(value) {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !pattern.test(value.trim())
        ? 'Informe um e-mail válido.'
        : null;
    },

    /**
     * minlength:N
     * Rejeita valores com menos de N caracteres (sem espaços nas bordas).
     *
     * @param {string}   value
     * @param {string[]} args  - args[0] é N (como string)
     */
    minlength(value, args) {
      const min = Number(args[0]);
      return value.trim().length < min
        ? `Mínimo de ${min} caracteres.`
        : null;
    },

    /**
     * phone
     * Valida telefone brasileiro com DDD.
     * Aceita celular (11 dígitos) e fixo (10 dígitos).
     */
    phone(value) {
      const digits = value.replace(/\D/g, '');
      return digits.length < 10
        ? 'Informe um telefone válido com DDD.'
        : null;
    },

    /**
     * cep
     * Valida o formato de CEP brasileiro: 00000-000.
     */
    cep(value) {
      return !/^\d{5}-\d{3}$/.test(value)
        ? 'Informe um CEP no formato 00000-000.'
        : null;
    },
  };

  // ─── API pública ───────────────────────────────────────────

  /**
   * validate
   * Executa uma cadeia de regras declaradas em `ruleString`.
   * Interrompe e retorna o primeiro erro encontrado.
   *
   * @param {string} value       - valor atual do campo
   * @param {string} ruleString  - ex: "required|minlength:2"
   * @returns {string|null}      - mensagem de erro ou null (válido)
   */
  function validate(value, ruleString) {
    if (!ruleString) return null;

    const ruleList = ruleString.split('|').filter(Boolean);

    for (const rule of ruleList) {
      const [name, ...args] = rule.split(':');

      if (typeof rules[name] !== 'function') {
        console.warn(`[Validators] Regra desconhecida: "${name}"`);
        continue;
      }

      const error = rules[name](value, args);
      if (error) return error;
    }

    return null;
  }

  /**
   * validateElement
   * Valida um elemento do DOM que possua `data-validate` e
   * atualiza as classes CSS e a mensagem de erro associada.
   *
   * @param {HTMLElement} element
   * @returns {boolean} true = válido
   */
  function validateElement(element) {
    const ruleString = element.dataset.validate || '';
    const errorEl    = element.parentElement.querySelector('.field-error');
    const message    = validate(element.value, ruleString);

    if (message) {
      element.classList.add('invalid');
      element.classList.remove('valid');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('visible');
      }
      return false;
    }

    element.classList.remove('invalid');
    if (element.value.trim()) element.classList.add('valid');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
    return true;
  }

  /**
   * validateRadioGroup
   * Verifica se ao menos uma opção de um grupo radio está marcada.
   *
   * @param {string} name  - atributo name do grupo
   * @param {string} errId - id do elemento <span class="field-error">
   * @returns {boolean}
   */
  function validateRadioGroup(name, errId) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    const errorEl = document.getElementById(errId);

    if (!checked) {
      if (errorEl) {
        errorEl.textContent = 'Selecione uma opção.';
        errorEl.classList.add('visible');
      }
      return false;
    }

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
    return true;
  }

  /**
   * validateCheckboxGroup
   * Verifica se ao menos uma opção de um grupo checkbox está marcada.
   *
   * @param {string} name  - atributo name do grupo
   * @param {string} errId - id do elemento <span class="field-error">
   * @returns {boolean}
   */
  function validateCheckboxGroup(name, errId) {
    const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
    const errorEl = document.getElementById(errId);

    if (checked.length === 0) {
      if (errorEl) {
        errorEl.textContent = 'Marque ao menos uma opção.';
        errorEl.classList.add('visible');
      }
      return false;
    }

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
    return true;
  }

  return {
    validate,
    validateElement,
    validateRadioGroup,
    validateCheckboxGroup,
  };

})();