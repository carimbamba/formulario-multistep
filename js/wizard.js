

const Wizard = (() => {

  // ─── Configuração ──────────────────────────────────────────
  const TOTAL_STEPS    = 4;
  const STEP_DURATION  = 420; // ms — deve coincidir com --step-duration no CSS

  /**
   * Regras de validação especiais por etapa.
   * Grupos de radio/checkbox não possuem data-validate,
   * por isso são listados aqui explicitamente.
   *
   * Estrutura de cada entrada:
   *  { type: 'radio'|'checkbox', name: string, errId: string }
   */
  const STEP_GROUP_RULES = {
    3: [
      { type: 'radio',    name: 'interesse', errId: 'interesse-error' },
      { type: 'checkbox', name: 'notif',     errId: 'notif-error'     },
    ],
    4: [
      { type: 'radio', name: 'origem', errId: 'origem-error' },
    ],
  };

  // ─── Estado interno ─────────────────────────────────────────
  let currentStep = 1;

  // ─── Referências DOM ────────────────────────────────────────
  const progressFill = document.getElementById('progress-fill');
  const stepLabel    = document.getElementById('current-step-label');
  const progressBar  = document.querySelector('[role="progressbar"]');
  const dots         = document.querySelectorAll('.step-dot');
  const successEl    = document.getElementById('success-screen');
  const summaryEl    = document.getElementById('summary-list');

  // ─── Progresso ──────────────────────────────────────────────

  /**
   * updateProgress
   * Sincroniza a barra de progresso, o rótulo numérico e os dots
   * com o valor atual de `currentStep`.
   */
  function updateProgress() {
    const percentage = (currentStep / TOTAL_STEPS) * 100;

    progressFill.style.width     = `${percentage}%`;
    stepLabel.textContent        = currentStep;
    progressBar.setAttribute('aria-valuenow', currentStep);

    dots.forEach((dot, index) => {
      const stepNumber = index + 1;
      dot.classList.toggle('active', stepNumber === currentStep);
      dot.classList.toggle('done',   stepNumber < currentStep);
    });
  }

  // ─── Transição entre etapas ─────────────────────────────────

  /**
   * getStepElement
   * Atalho para buscar o elemento de uma etapa pelo número.
   *
   * @param {number} step
   * @returns {HTMLElement}
   */
  function getStepElement(step) {
    return document.getElementById(`step-${step}`);
  }

  /**
   * goToStep
   * Realiza a transição animada entre duas etapas.
   * A direção da animação muda dependendo se o usuário avança ou volta.
   *
   * @param {number}  target - número da etapa destino
   * @param {boolean} isBack - true quando o usuário clica em "Voltar"
   */
  function goToStep(target, isBack = false) {
    if (target === currentStep) return;

    const leavingEl  = getStepElement(currentStep);
    const enteringEl = getStepElement(target);

    if (!leavingEl || !enteringEl) {
      console.error(`[Wizard] Etapa inválida: ${target}`);
      return;
    }

    // Classe de saída depende da direção
    const leaveClass = isBack ? 'leaving-back'  : 'leaving';
    const enterClass = isBack ? 'entering-back'  : '';

    // Etapa atual: inicia animação de saída
    leavingEl.removeAttribute('hidden');
    leavingEl.classList.add(leaveClass);

    setTimeout(() => {
      // Remove etapa que está saindo
      leavingEl.classList.remove('active', 'leaving', 'leaving-back');
      leavingEl.setAttribute('hidden', '');

      // Ativa a nova etapa
      enteringEl.removeAttribute('hidden');
      if (enterClass) enteringEl.classList.add(enterClass);
      enteringEl.classList.add('active');

      // Limpa a classe de entrada após a animação
      if (enterClass) {
        setTimeout(() => enteringEl.classList.remove(enterClass), STEP_DURATION + 50);
      }
    }, STEP_DURATION);

    currentStep = target;
    updateProgress();
  }

  // ─── Validação por etapa ─────────────────────────────────────

  /**
   * validateStep
   * Valida todos os campos da etapa informada.
   * Retorna false e foca no primeiro campo inválido encontrado.
   *
   * @param {number} step
   * @returns {boolean}
   */
  function validateStep(step) {
    const stepEl = getStepElement(step);
    let   isValid = true;

    // Valida campos com data-validate
    const fields = stepEl.querySelectorAll('[data-validate]');
    fields.forEach((field) => {
      if (!Validators.validateElement(field)) isValid = false;
    });

    // Valida grupos especiais (radio / checkbox) desta etapa
    const groupRules = STEP_GROUP_RULES[step] || [];
    groupRules.forEach(({ type, name, errId }) => {
      const ok = type === 'radio'
        ? Validators.validateRadioGroup(name, errId)
        : Validators.validateCheckboxGroup(name, errId);
      if (!ok) isValid = false;
    });

    // Foca no primeiro campo inválido para acessibilidade
    if (!isValid) {
      const firstInvalid = stepEl.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
    }

    return isValid;
  }

  // ─── Coleta de dados para o resumo ──────────────────────────

  /**
   * collectFormData
   * Lê os valores preenchidos e retorna um array de objetos
   * { label, value } para exibir no resumo final.
   *
   * @returns {{ label: string, value: string }[]}
   */
  function collectFormData() {
    const notificacoes = [...document.querySelectorAll('input[name="notif"]:checked')]
      .map((el) => el.value)
      .join(', ') || '—';

    return [
      {
        label: 'Nome',
        value: `${document.getElementById('nome').value} ${document.getElementById('sobrenome').value}`.trim(),
      },
      {
        label: 'E-mail',
        value: document.getElementById('email').value,
      },
      {
        label: 'Telefone',
        value: document.getElementById('telefone').value,
      },
      {
        label: 'Cidade / UF',
        value: `${document.getElementById('cidade').value} — ${document.getElementById('estado').value}`,
      },
      {
        label: 'Interesse',
        value: document.querySelector('input[name="interesse"]:checked')?.value || '—',
      },
      {
        label: 'Notificações',
        value: notificacoes,
      },
      {
        label: 'Nível',
        value: document.getElementById('nivel').value || '—',
      },
      {
        label: 'Origem',
        value: document.querySelector('input[name="origem"]:checked')?.value || '—',
      },
    ];
  }

  /**
   * renderSummary
   * Gera e insere os itens do resumo na tela de sucesso.
   */
  function renderSummary() {
    const data = collectFormData();

    summaryEl.innerHTML = data
      .map(({ label, value }) => `
        <div class="summary-item">
          <dt>${label}</dt>
          <dd>${value}</dd>
        </div>
      `)
      .join('');
  }

  // ─── Tela de sucesso ────────────────────────────────────────

  /**
   * showSuccess
   * Oculta todas as etapas, preenche o resumo e exibe
   * a tela de confirmação.
   */
  function showSuccess() {
    // Oculta todas as etapas
    document.querySelectorAll('.step').forEach((stepEl) => {
      stepEl.classList.remove('active');
      stepEl.setAttribute('hidden', '');
    });

    // Barra de progresso em 100%
    progressFill.style.width = '100%';
    dots.forEach((dot) => {
      dot.classList.remove('active');
      dot.classList.add('done');
    });

    renderSummary();

    // Exibe tela e transfere o foco para acessibilidade
    successEl.classList.add('visible');
    successEl.focus();
  }

  // ─── Listeners de navegação ──────────────────────────────────

  /**
   * bindNavigation
   * Registra os eventos de clique nos botões "Próximo", "Voltar"
   * e "Enviar" presentes no HTML.
   */
  function bindNavigation() {
    // Botões "Próximo"
    document.querySelectorAll('[data-next]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = parseInt(btn.dataset.next, 10);
        if (validateStep(currentStep)) {
          goToStep(target, false);
        }
      });
    });

    // Botões "Voltar"
    document.querySelectorAll('[data-prev]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = parseInt(btn.dataset.prev, 10);
        goToStep(target, true);
      });
    });

    // Botão "Enviar"
    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
          showSuccess();
        }
      });
    }
  }

  // ─── Listeners de validação em tempo real ────────────────────

  /**
   * bindFieldValidation
   * Para campos com data-validate, valida no `blur` (ao sair) e
   * limpa o erro enquanto o usuário corrige no `input`.
   */
  function bindFieldValidation() {
    document.querySelectorAll('[data-validate]').forEach((field) => {
      field.addEventListener('blur', () => {
        Validators.validateElement(field);
      });

      field.addEventListener('input', () => {
        // Revalida em tempo real apenas se o campo já estava inválido
        if (field.classList.contains('invalid')) {
          Validators.validateElement(field);
        }
      });
    });
  }

  // ─── API pública ─────────────────────────────────────────────

  /**
   * init
   * Inicializa o wizard: registra todos os eventos e
   * define o estado inicial do progresso.
   */
  function init() {
    bindNavigation();
    bindFieldValidation();
    updateProgress();
  }

  return { init };

})();