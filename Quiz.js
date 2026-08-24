/* ==========================================================================
   TERMODINÂMICA — NO COTIDIANO E NO MEIO AMBIENTE
   script.js — navegação, termômetro de progresso, simulação de partículas
   e quiz interativo.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ */
  /* MENU MOBILE                                                        */
  /* ------------------------------------------------------------------ */
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  menuToggle.addEventListener('click', () => {
    const aberto = navMenu.classList.toggle('aberto');
    menuToggle.setAttribute('aria-expanded', aberto ? 'true' : 'false');
  });
  navMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      navMenu.classList.remove('aberto');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ------------------------------------------------------------------ */
  /* TERMÔMETRO DE PROGRESSO + NAVEGAÇÃO ATIVA                          */
  /* ------------------------------------------------------------------ */
  const SECOES = [
    { id: 'inicio',     rotulo: 'Início' },
    { id: 'intro',      rotulo: 'O que é' },
    { id: 'conceitos',  rotulo: 'Conceitos' },
    { id: 'leis',       rotulo: 'Leis' },
    { id: 'aplicacoes', rotulo: 'Aplicações' },
    { id: 'solar',      rotulo: 'Energia Solar' },
    { id: 'ambiente',   rotulo: 'Meio Ambiente' },
    { id: 'quiz',       rotulo: 'Quiz' },
  ];

  const marcasContainer = document.getElementById('termometroMarcas');
  SECOES.forEach(secao => {
    const marca = document.createElement('button');
    marca.className = 'termometro-marca';
    marca.type = 'button';
    marca.title = secao.rotulo;
    marca.dataset.secao = secao.id;
    marca.setAttribute('aria-label', 'Ir para ' + secao.rotulo);
    marca.addEventListener('click', () => {
      document.getElementById(secao.id).scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth' });
    });
    marcasContainer.appendChild(marca);
  });

  const termometroFill = document.getElementById('termometroFill');
  const progressoMobile = document.getElementById('progressoMobile');
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const marcasEls = Array.from(document.querySelectorAll('.termometro-marca'));
  const secoesEls = SECOES.map(s => document.getElementById(s.id));

  let ticking = false;

  function atualizarRolagem() {
    const scrollY = window.scrollY;
    const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;
    const percentual = alturaTotal > 0 ? Math.min(100, Math.max(0, (scrollY / alturaTotal) * 100)) : 0;

    termometroFill.style.height = (100 - percentual) + '%';
    progressoMobile.style.width = percentual + '%';

    // determina a seção ativa (a última cujo topo já passou da linha de referência)
    const linhaReferencia = 140;
    let ativa = secoesEls[0];
    for (const el of secoesEls) {
      if (el.getBoundingClientRect().top - linhaReferencia <= 0) {
        ativa = el;
      }
    }
    const ativaId = ativa ? ativa.id : SECOES[0].id;

    navLinks.forEach(link => {
      link.classList.toggle('ativo', link.getAttribute('href') === '#' + ativaId);
    });
    marcasEls.forEach(marca => {
      marca.classList.toggle('ativa', marca.dataset.secao === ativaId);
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(atualizarRolagem);
      ticking = true;
    }
  }, { passive: true });

  atualizarRolagem();

  /* ------------------------------------------------------------------ */
  /* REVELAÇÃO SUAVE AO ROLAR                                           */
  /* ------------------------------------------------------------------ */
  const alvosRevelacao = document.querySelectorAll(
    '.card-conceito, .card-aplicacao, .lei, .comparativo-item, .callout, .estufa-diagrama'
  );
  alvosRevelacao.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window && !reduzirMovimento) {
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visivel');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15 });
    alvosRevelacao.forEach(el => observador.observe(el));
  } else {
    alvosRevelacao.forEach(el => el.classList.add('visivel'));
  }

  /* ------------------------------------------------------------------ */
  /* SIMULAÇÃO DE PARTÍCULAS (temperatura = agitação molecular)         */
  /* ------------------------------------------------------------------ */
  const canvas = document.getElementById('canvasParticulas');
  const ctx = canvas.getContext('2d');
  const slider = document.getElementById('sliderTemp');
  const tempValor = document.getElementById('tempValor');
  const tempDesc = document.getElementById('tempDesc');

  const LARGURA = canvas.width;
  const ALTURA = canvas.height;
  const N_PARTICULAS = 42;
  const RAIO_PARTICULA = 3.4;

  let temperatura = parseInt(slider.value, 10);

  const particulas = Array.from({ length: N_PARTICULAS }, () => {
    const angulo = Math.random() * Math.PI * 2;
    return {
      x: RAIO_PARTICULA + Math.random() * (LARGURA - 2 * RAIO_PARTICULA),
      y: RAIO_PARTICULA + Math.random() * (ALTURA - 2 * RAIO_PARTICULA),
      vx: Math.cos(angulo),
      vy: Math.sin(angulo),
    };
  });

  function fatorVelocidade(t) {
    return 0.35 + ((t - 100) / 900) * 3.6;
  }

  function corPorTemperatura(t) {
    const norm = (t - 100) / 900; // 0 a 1
    const frio = [59, 130, 196];
    const medio = [227, 168, 43];
    const quente = [214, 72, 47];
    let cor;
    if (norm < 0.5) {
      const p = norm / 0.5;
      cor = frio.map((c, i) => Math.round(c + (medio[i] - c) * p));
    } else {
      const p = (norm - 0.5) / 0.5;
      cor = medio.map((c, i) => Math.round(c + (quente[i] - c) * p));
    }
    return 'rgb(' + cor.join(',') + ')';
  }

  function descricaoTemperatura(t) {
    if (t < 250) return 'sistema frio';
    if (t <= 650) return 'sistema moderado';
    return 'sistema muito quente';
  }

  function atualizarLeitura() {
    tempValor.textContent = temperatura + ' K';
    tempDesc.textContent = descricaoTemperatura(temperatura);
  }

  function desenharQuadro() {
    const cor = corPorTemperatura(temperatura);
    const velocidade = fatorVelocidade(temperatura);

    ctx.fillStyle = 'rgba(14, 46, 36, 0.32)';
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    particulas.forEach(p => {
      if (!reduzirMovimento) {
        p.x += p.vx * velocidade;
        p.y += p.vy * velocidade;
        if (p.x <= RAIO_PARTICULA || p.x >= LARGURA - RAIO_PARTICULA) p.vx *= -1;
        if (p.y <= RAIO_PARTICULA || p.y >= ALTURA - RAIO_PARTICULA) p.vy *= -1;
        p.x = Math.min(Math.max(p.x, RAIO_PARTICULA), LARGURA - RAIO_PARTICULA);
        p.y = Math.min(Math.max(p.y, RAIO_PARTICULA), ALTURA - RAIO_PARTICULA);
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, RAIO_PARTICULA, 0, Math.PI * 2);
      ctx.fillStyle = cor;
      ctx.fill();
    });
  }

  function loopAnimacao() {
    desenharQuadro();
    requestAnimationFrame(loopAnimacao);
  }

  slider.addEventListener('input', () => {
    temperatura = parseInt(slider.value, 10);
    atualizarLeitura();
    if (reduzirMovimento) desenharQuadro();
  });

  atualizarLeitura();
  ctx.fillStyle = 'rgba(14, 46, 36, 1)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  desenharQuadro();
  if (!reduzirMovimento) {
    requestAnimationFrame(loopAnimacao);
  }

  /* ------------------------------------------------------------------ */
  /* QUIZ                                                                */
  /* ------------------------------------------------------------------ */
  const PERGUNTAS = [
    {
      id: 'p1',
      texto: 'Qual afirmação descreve corretamente a diferença entre calor e temperatura?',
      opcoes: [
        'Calor e temperatura são a mesma grandeza, só medidas em unidades diferentes.',
        'Calor é energia em trânsito entre corpos com temperaturas diferentes; temperatura mede a agitação das partículas.',
        'Temperatura é energia em trânsito; calor mede a agitação das partículas.',
        'Um corpo "contém" calor da mesma forma que contém massa.'
      ],
      correta: 1,
      explicacao: 'Um corpo tem energia interna e temperatura; "calor" só existe enquanto há transferência de energia entre corpos em desequilíbrio térmico.'
    },
    {
      id: 'p2',
      texto: 'Um gás recebe 500 J de calor e realiza 200 J de trabalho sobre a vizinhança. Pela 1ª lei (ΔU = Q − W), qual é a variação de energia interna?',
      opcoes: ['700 J', '300 J', '−300 J', '100 J'],
      correta: 1,
      explicacao: 'ΔU = Q − W = 500 J − 200 J = 300 J. A energia interna aumenta 300 J.'
    },
    {
      id: 'p3',
      texto: 'Por que nenhuma máquina térmica real pode ter 100% de eficiência?',
      opcoes: [
        'Porque os materiais atuais ainda não são resistentes o suficiente.',
        'Porque a 2ª lei exige que parte do calor seja sempre rejeitada para uma fonte fria.',
        'Porque a 1ª lei proíbe qualquer conversão de calor em trabalho.',
        'Isso é um mito: máquinas ideais já atingem 100% em laboratório.'
      ],
      correta: 1,
      explicacao: 'A 2ª lei estabelece que uma máquina térmica precisa rejeitar parte do calor para uma fonte fria — por isso a eficiência máxima teórica (Carnot) é sempre menor que 100%.'
    },
    {
      id: 'p4',
      texto: 'O que a Lei Zero da Termodinâmica torna possível, na prática?',
      opcoes: [
        'Calcular o trabalho realizado por um gás.',
        'Prever a eficiência máxima de um motor.',
        'Usar termômetros de forma consistente, comparando temperaturas sem colocar os corpos em contato direto.',
        'Explicar por que o zero absoluto é inatingível.'
      ],
      correta: 2,
      explicacao: 'Como o equilíbrio térmico é transitivo, o termômetro pode servir de "intermediário": ele equilibra com um corpo, depois com outro, e isso basta para comparar as temperaturas dos dois.'
    },
    {
      id: 'p5',
      texto: 'O funcionamento de uma geladeira depende de:',
      opcoes: [
        'Deixar o calor fluir espontaneamente do interior frio para o exterior quente.',
        'Realizar trabalho para forçar a transferência de calor do interior (frio) para o exterior (quente).',
        'Eliminar completamente a energia interna do ar dentro dela.',
        'Um processo que viola a 1ª lei da termodinâmica.'
      ],
      correta: 1,
      explicacao: 'Calor não flui sozinho do frio para o quente. A geladeira usa trabalho elétrico (compressor) para forçar esse fluxo no sentido contrário ao espontâneo.'
    },
    {
      id: 'p6',
      texto: 'Por que a panela de pressão cozinha os alimentos mais rápido?',
      opcoes: [
        'Porque reduz a pressão interna, fazendo a água ferver a uma temperatura menor.',
        'Porque aumenta a pressão interna, elevando o ponto de ebulição da água e permitindo temperaturas de cozimento mais altas.',
        'Porque isola completamente o sistema, impedindo qualquer troca de calor.',
        'Porque aumenta o volume disponível para o vapor se expandir livremente.'
      ],
      correta: 1,
      explicacao: 'Com a pressão mais alta, a água só entra em ebulição em uma temperatura maior que 100 °C — o alimento cozinha em contato com água (e vapor) mais quentes.'
    },
    {
      id: 'p7',
      texto: 'Qual a principal diferença entre um painel fotovoltaico e um coletor solar térmico?',
      opcoes: [
        'Não há diferença real, são só nomes distintos para o mesmo equipamento.',
        'O fotovoltaico converte luz diretamente em eletricidade; o coletor térmico aquece um fluido absorvendo radiação solar.',
        'O coletor térmico gera eletricidade; o fotovoltaico só aquece água.',
        'O fotovoltaico funciona apenas à noite.'
      ],
      correta: 1,
      explicacao: 'Fotovoltaico = luz vira eletricidade (efeito fotovoltaico, num semicondutor). Coletor térmico = radiação solar vira energia interna de um fluido, sem conversão elétrica no meio.'
    },
    {
      id: 'p8',
      texto: 'Do ponto de vista termodinâmico, por que nenhum painel solar comercial converte 100% da luz recebida em eletricidade?',
      opcoes: [
        'Porque toda a luz solar tem, obrigatoriamente, que ser refletida de volta ao espaço.',
        'Porque parte da energia é sempre dissipada como calor — nenhuma conversão de energia entre fontes de temperaturas diferentes é perfeita.',
        'Porque os painéis são projetados para operar só a 50% da capacidade.',
        'Porque a energia solar não é uma forma de energia utilizável.'
      ],
      correta: 1,
      explicacao: 'Além de limites tecnológicos, há um limite termodinâmico de fundo: como em toda conversão entre uma fonte quente (o Sol) e um receptor mais frio (o painel), parte da energia se perde como calor.'
    },
    {
      id: 'p9',
      texto: 'Sobre o efeito estufa, é correto afirmar que:',
      opcoes: [
        'É um fenômeno artificial, causado inteiramente pela atividade humana.',
        'É um processo natural essencial à vida na Terra, mas a intensificação por gases de origem humana está causando aquecimento global.',
        'Não tem relação nenhuma com a temperatura média do planeta.',
        'Só ocorre em planetas sem atmosfera.'
      ],
      correta: 1,
      explicacao: 'Sem efeito estufa natural, a Terra seria muito mais fria (perto de −18 °C em média). O problema atual é o excesso de gases retendo energia além do equilíbrio natural.'
    },
    {
      id: 'p10',
      texto: 'De acordo com a 2ª lei da termodinâmica, toda conversão de energia:',
      opcoes: [
        'É perfeitamente reversível, sem qualquer perda.',
        'Aumenta a entropia total do universo e gera perdas na forma de calor disperso — por isso a eficiência é sempre limitada.',
        'Só pode acontecer se a temperatura do sistema cair a 0 K.',
        'Cria energia nova a partir do nada, desde que a fonte seja renovável.'
      ],
      correta: 1,
      explicacao: 'É por isso que "eficiência energética" tem um teto físico: cada conversão dispersa uma parte da energia como calor de baixa temperatura, aumentando a entropia total.'
    },
  ];

  const quizContainer = document.getElementById('quizContainer');
  const quizForm = document.getElementById('quizForm');
  const quizResultado = document.getElementById('quizResultado');
  const btnCorrigir = document.getElementById('btnCorrigir');
  const btnRefazer = document.getElementById('btnRefazer');

  function renderizarQuiz() {
    quizContainer.innerHTML = '';
    quizResultado.hidden = true;
    btnCorrigir.hidden = false;
    btnRefazer.hidden = true;

    PERGUNTAS.forEach((pergunta, indice) => {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'quiz-pergunta';
      fieldset.dataset.id = pergunta.id;

      const legend = document.createElement('legend');
      legend.innerHTML = '<span class="quiz-numero">' + String(indice + 1).padStart(2, '0') + '</span>' + pergunta.texto;
      fieldset.appendChild(legend);

      const opcoesWrap = document.createElement('div');
      opcoesWrap.className = 'quiz-opcoes';

      pergunta.opcoes.forEach((opcao, i) => {
        const label = document.createElement('label');
        label.className = 'quiz-opcao';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = pergunta.id;
        input.value = String(i);

        const span = document.createElement('span');
        span.textContent = opcao;

        label.appendChild(input);
        label.appendChild(span);
        opcoesWrap.appendChild(label);
      });

      fieldset.appendChild(opcoesWrap);

      const explicacao = document.createElement('div');
      explicacao.className = 'quiz-explicacao';
      fieldset.appendChild(explicacao);

      quizContainer.appendChild(fieldset);
    });
  }

  quizContainer.addEventListener('change', (e) => {
    if (e.target.type !== 'radio') return;
    const fieldset = e.target.closest('.quiz-pergunta');
    fieldset.querySelectorAll('.quiz-opcao').forEach(op => op.classList.remove('selecionada'));
    e.target.closest('.quiz-opcao').classList.add('selecionada');
  });

  quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let acertos = 0;
    let respondidas = 0;

    PERGUNTAS.forEach(pergunta => {
      const fieldset = quizContainer.querySelector('fieldset[data-id="' + pergunta.id + '"]');
      const marcada = fieldset.querySelector('input[name="' + pergunta.id + '"]:checked');
      const opcoesEls = fieldset.querySelectorAll('.quiz-opcao');

      fieldset.classList.add('corrigida');
      opcoesEls[pergunta.correta].classList.add('opcao-correta');

      let acertou = false;
      if (marcada) {
        respondidas++;
        const valorMarcado = parseInt(marcada.value, 10);
        acertou = valorMarcado === pergunta.correta;
        if (acertou) acertos++;
        else opcoesEls[valorMarcado].classList.add('opcao-errada-marcada');
      }

      fieldset.querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true);

      const explicacaoEl = fieldset.querySelector('.quiz-explicacao');
      const veredito = !marcada
        ? '<span class="quiz-veredito errado">Não respondida.</span> '
        : acertou
          ? '<span class="quiz-veredito certo">Correto!</span> '
          : '<span class="quiz-veredito errado">Não foi dessa vez.</span> ';
      explicacaoEl.innerHTML = veredito + pergunta.explicacao;
    });

    let mensagem;
    if (acertos === PERGUNTAS.length) {
      mensagem = 'Domínio completo dos conceitos. Você poderia estar dando essa aula.';
    } else if (acertos >= 8) {
      mensagem = 'Muito sólido — faltou afinar só um ou dois detalhes.';
    } else if (acertos >= 5) {
      mensagem = 'Base razoável. Vale revisar as seções dos temas que você errou.';
    } else {
      mensagem = 'Ainda dá para melhorar bastante — releia as seções acima com calma antes de tentar de novo.';
    }
    if (respondidas < PERGUNTAS.length) {
      mensagem += ' (' + (PERGUNTAS.length - respondidas) + ' pergunta(s) ficaram sem resposta.)';
    }

    quizResultado.innerHTML =
      '<span class="quiz-resultado-nota">' + acertos + ' / ' + PERGUNTAS.length + '</span>' +
      '<p class="quiz-resultado-msg">' + mensagem + '</p>';
    quizResultado.hidden = false;
    btnCorrigir.hidden = true;
    btnRefazer.hidden = false;
    quizResultado.scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth', block: 'center' });
  });

  btnRefazer.addEventListener('click', () => {
    renderizarQuiz();
    document.getElementById('quiz').scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth' });
  });

  renderizarQuiz();

});