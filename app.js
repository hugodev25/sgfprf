// ================= CONSTANTES =================
const AUTH_KEYS = {
    usuarios: "prf_usuarios",
    sessao: "prf_sessao",
    ultimaAtividade: "prf_ultima_atividade"
};

const TEMPO_TIMEOUT = 15 * 60 * 1000; // 15 minutos de inatividade
const TEMPO_AVISO = 60 * 1000; // Avisar 1 minuto antes
let timeoutInterval = null;
let ultimoAviso = false;

// ================= ESTADOS DE EDIÇÃO =================
let estadoEdicao = {
    veiculoEmEdicao: null,  // índice do veículo em edição
    motoristaEmEdicao: null // índice do motorista em edição
};

// ================= CRIPTOGRAFIA =================
function criptografarSenha(senha) {
    if (typeof CryptoJS === 'undefined') {
        console.error('CryptoJS não está carregado!');
        return senha;
    }
    return CryptoJS.SHA256(senha + "prf_salt_2024").toString();
}

function compararSenhas(senhaDigitada, senhaCriptografada) {
    return criptografarSenha(senhaDigitada) === senhaCriptografada;
}

// ================= USUÁRIOS E AUTENTICAÇÃO =================
let usuarios = null;
let sessaoAtual = JSON.parse(localStorage.getItem(AUTH_KEYS.sessao)) || null;

// ================= RESETAR USUÁRIOS =================
function resetarUsuarios() {
    if (!confirm("Deseja resetar os usuários para os padrões?\n\nIsto restaurará:\n- admin / 123456\n- operador / 123456\n- teste / 123456")) return;
    
    criarUsuariosPadrao();
    alert("Usuários restaurados com sucesso!\n\nCredenciais disponíveis:\n- usuario: admin | senha: 123456\n- usuario: operador | senha: 123456\n- usuario: teste | senha: 123456");
}
function criarUsuariosPadrao() {
    usuarios = [
        {
            id: 1,
            nome: "Admin",
            usuario: "admin",
            senha: criptografarSenha("123456"),
            email: "admin@prf.gov.br",
            cargo: "admin",
            ativo: true,
            dataCadastro: new Date().toISOString()
        },
        {
            id: 2,
            nome: "Operador",
            usuario: "operador",
            senha: criptografarSenha("123456"),
            email: "operador@prf.gov.br",
            cargo: "operador",
            ativo: true,
            dataCadastro: new Date().toISOString()
        },
        {
            id: 3,
            nome: "Teste",
            usuario: "teste",
            senha: criptografarSenha("123456"),
            email: "teste@prf.gov.br",
            cargo: "operador",
            ativo: true,
            dataCadastro: new Date().toISOString()
        }
    ];
    localStorage.setItem(AUTH_KEYS.usuarios, JSON.stringify(usuarios));
}

function inicializarUsuarios() {
    usuarios = JSON.parse(localStorage.getItem(AUTH_KEYS.usuarios));
    
    if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
        criarUsuariosPadrao();
    }
}

// ================= PERMISSÕES POR CARGO =================
const PERMISSOES = {
    admin: [
        "visualizar_dashboard",
        "visualizar_veiculos",
        "gerenciar_veiculos",
        "visualizar_motoristas",
        "gerenciar_motoristas",
        "visualizar_missoes",
        "gerenciar_missoes",
        "visualizar_relatorios",
        "gerenciar_relatorios",
        "gerenciar_usuarios",
        "editar_sistema"
    ],
    operador: [
        "visualizar_dashboard",
        "visualizar_veiculos",
        "gerenciar_veiculos",
        "visualizar_motoristas",
        "gerenciar_motoristas",
        "visualizar_missoes",
        "gerenciar_missoes",
        "visualizar_relatorios"
    ],
    visualizador: [
        "visualizar_dashboard",
        "visualizar_veiculos",
        "visualizar_motoristas",
        "visualizar_missoes",
        "visualizar_relatorios"
    ]
};

// ================= VERIFICAR PERMISSÃO =================
function temPermissao(permissao) {
    if (!sessaoAtual) return false;
    
    const usuarioAtual = usuarios.find(u => u.id === sessaoAtual.id);
    if (!usuarioAtual) return false;
    
    const perms = PERMISSOES[usuarioAtual.cargo] || [];
    return perms.includes(permissao);
}

// ================= MONITORAR ATIVIDADE =================
function monitorarAtividade() {
    if (!sessaoAtual) return;

    document.addEventListener("mousemove", () => {
        localStorage.setItem(AUTH_KEYS.ultimaAtividade, Date.now().toString());
    });

    document.addEventListener("keypress", () => {
        localStorage.setItem(AUTH_KEYS.ultimaAtividade, Date.now().toString());
    });

    document.addEventListener("click", () => {
        localStorage.setItem(AUTH_KEYS.ultimaAtividade, Date.now().toString());
    });

    // Verificar timeout a cada 30 segundos
    setInterval(verificarTimeout, 30000);
}

// ================= VERIFICAR TIMEOUT =================
function verificarTimeout() {
    if (!sessaoAtual) return;

    const ultimaAtividade = parseInt(localStorage.getItem(AUTH_KEYS.ultimaAtividade)) || Date.now();
    const tempoInativo = Date.now() - ultimaAtividade;

    if (tempoInativo > TEMPO_TIMEOUT) {
        // Sessão expirou
        mostrarModalTimeout(true);
        permitirProlongarSessao = false;
    } else if (tempoInativo > TEMPO_TIMEOUT - TEMPO_AVISO && !ultimoAviso) {
        // Avisar que a sessão vai expirar
        mostrarModalTimeout(false);
        ultimoAviso = true;
    }
}

// ================= MODAL TIMEOUT =================
let permitirProlongarSessao = true;

function mostrarModalTimeout(expirou) {
    const modal = document.getElementById("modalTimeout");
    const tempoRestanteEl = document.getElementById("tempoRestante");

    if (expirou) {
        modal.querySelector("h3").textContent = "Sessão Expirada";
        modal.querySelector("p").textContent = "Sua sessão expirou por inatividade.";

        if (tempoRestanteEl.parentElement.style.display !== "none") {
            tempoRestanteEl.parentElement.style.display = "none";
        }

        const btnProlongar = document.querySelector("[onclick='prolongarSessao()']");
        if (btnProlongar) btnProlongar.style.display = "none";

        permitirProlongarSessao = false;
    } else {
        modal.querySelector("h3").textContent = "Sessão Próxima de Expirar";
        modal.querySelector("p").textContent = "Sua sessão expirou por inatividade. Clique em 'Permanecer Logado' para continuar.";
        tempoRestanteEl.parentElement.style.display = "block";

        // Contar tempo restante
        let tempoRestante = 60;
        const intervalo = setInterval(() => {
            tempoRestante--;
            tempoRestanteEl.textContent = tempoRestante;

            if (tempoRestante <= 0) {
                clearInterval(intervalo);
                mostrarModalTimeout(true);
            }
        }, 1000);
    }

    modal.classList.add("active");

    if (!tempoRestanteEl.parentElement.style.display) {
        tempoRestanteEl.parentElement.style.display = "block";
    }
}

// ================= PROLONGAR SESSÃO =================
function prolongarSessao() {
    if (!permitirProlongarSessao) {
        alert("Sua sessão expirou. Faça login novamente.");
        fazerLogout();
        return;
    }

    localStorage.setItem(AUTH_KEYS.ultimaAtividade, Date.now().toString());
    document.getElementById("modalTimeout").classList.remove("active");
    ultimoAviso = false;
}

// ================= LOGIN =================
function fazerLogin(event) {
    event.preventDefault();

    const usuario = document.getElementById("loginUser").value;
    const senha = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe").checked;
    const errorDiv = document.getElementById("errorMessage");
    const btnLogin = document.getElementById("btnLogin");

    errorDiv.classList.remove("show");
    btnLogin.disabled = true;

    setTimeout(() => {
        const usuarioEncontrado = usuarios.find(
            u => u.usuario === usuario && compararSenhas(senha, u.senha) && u.ativo
        );

        if (usuarioEncontrado) {
            // Login bem-sucedido
            sessaoAtual = {
                id: usuarioEncontrado.id,
                nome: usuarioEncontrado.nome,
                usuario: usuarioEncontrado.usuario,
                cargo: usuarioEncontrado.cargo,
                email: usuarioEncontrado.email,
                dataLogin: new Date().toISOString()
            };

            localStorage.setItem(AUTH_KEYS.sessao, JSON.stringify(sessaoAtual));
            localStorage.setItem(AUTH_KEYS.ultimaAtividade, Date.now().toString());

            if (rememberMe) {
                localStorage.setItem("prf_remember_usuario", usuario);
            } else {
                localStorage.removeItem("prf_remember_usuario");
            }

            mostrarDashboard();
            monitorarAtividade();
            btnLogin.disabled = false;
        } else {
            errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> Usuário ou senha incorretos!";
            errorDiv.classList.add("show");
            btnLogin.disabled = false;
        }
    }, 500);
}

// ================= LOGOUT =================
function fazerLogout() {
    if (sessaoAtual && !confirm("Tem certeza que deseja sair?")) return false;

    sessaoAtual = null;
    localStorage.removeItem(AUTH_KEYS.sessao);
    localStorage.removeItem(AUTH_KEYS.ultimaAtividade);
    mostrarLogin();
    document.getElementById("loginForm").reset();
    document.getElementById("modalTimeout").classList.remove("active");
}

// ================= MOSTRAR/OCULTAR TELAS =================
function toggleSidebar() {
    const sidebar = document.querySelector('nav.sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('collapsed');
}

function toggleMobileSidebar() {
    document.body.classList.toggle('sidebar-open');
}

function mostrarDashboard() {
    document.getElementById("loginContainer").classList.add("hidden");
    document.getElementById("dashboard").classList.add("active");
    document.getElementById("nomeUsuario").textContent = sessaoAtual.nome;
    document.getElementById("cargoUsuario").textContent = `(${sessaoAtual.cargo.toUpperCase()})`;
    renderizar();
}

function mostrarLogin() {
    document.getElementById("loginContainer").classList.remove("hidden");
    document.getElementById("dashboard").classList.remove("active");
}

// ================= MODAL CADASTRO =================
function abrirModalCadastro() {
    document.getElementById("modalCadastro").classList.add("active");
}

function fecharModalCadastro() {
    document.getElementById("modalCadastro").classList.remove("active");
    document.getElementById("cadastroForm").reset();
    document.getElementById("errorCadastroMessage").classList.remove("show");
    document.getElementById("successMessage").classList.remove("show");
}

// ================= CRIAR CONTA =================
function criarConta(event) {
    event.preventDefault();

    const nome = document.getElementById("nomeCompleto").value;
    const usuario = document.getElementById("usuarioCadastro").value;
    const email = document.getElementById("emailCadastro").value;
    const senha = document.getElementById("senhaCadastro").value;
    const senhaConfirm = document.getElementById("senhaConfirm").value;
    const cargo = document.getElementById("cargoSelect").value;

    const errorDiv = document.getElementById("errorCadastroMessage");
    const successDiv = document.getElementById("successMessage");

    errorDiv.classList.remove("show");
    successDiv.classList.remove("show");

    // Validações
    if (senha !== senhaConfirm) {
        errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> As senhas não correspondem!";
        errorDiv.classList.add("show");
        return;
    }

    if (senha.length < 6) {
        errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> A senha deve ter no mínimo 6 caracteres!";
        errorDiv.classList.add("show");
        return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
        errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> Email inválido!";
        errorDiv.classList.add("show");
        return;
    }

    if (usuarios.some(u => u.usuario === usuario)) {
        errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> Este usuário já existe!";
        errorDiv.classList.add("show");
        return;
    }

    if (usuarios.some(u => u.email === email)) {
        errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> Este email já está cadastrado!";
        errorDiv.classList.add("show");
        return;
    }

    // Criar novo usuário
    const novoUsuario = {
        id: Math.max(...usuarios.map(u => u.id), 0) + 1,
        nome: nome,
        usuario: usuario,
        senha: criptografarSenha(senha),
        email: email,
        cargo: cargo,
        ativo: true,
        dataCadastro: new Date().toISOString()
    };

    usuarios.push(novoUsuario);
    localStorage.setItem(AUTH_KEYS.usuarios, JSON.stringify(usuarios));

    successDiv.innerHTML = "<i class='fas fa-check-circle'></i> Conta criada com sucesso! Faça login agora.";
    successDiv.classList.add("show");

    setTimeout(() => {
        fecharModalCadastro();
        document.getElementById("loginUser").value = usuario;
        document.getElementById("loginPassword").focus();
    }, 2000);
}

// ================= RECUPERAR SENHA =================
let codigoRecuperacaoGerado = null;
let emailRecuperacao = null;

function abrirModalRecuperarSenha(event) {
    event.preventDefault();
    document.getElementById("modalRecuperarSenha").classList.add("active");
    document.getElementById("formularioCodigoRecuperacao").style.display = "none";
    document.getElementById("recuperarForm").style.display = "block";
    document.getElementById("errorRecuperarMessage").classList.remove("show");
    document.getElementById("successRecuperarMessage").classList.remove("show");
}

function fecharModalRecuperarSenha() {
    document.getElementById("modalRecuperarSenha").classList.remove("active");
    document.getElementById("recuperarForm").reset();
    codigoRecuperacaoGerado = null;
    emailRecuperacao = null;
}

function enviarCodigoRecuperacao(event) {
    event.preventDefault();

    const input = document.getElementById("emailRecuperar").value;
    const errorDiv = document.getElementById("errorRecuperarMessage");
    const successDiv = document.getElementById("successRecuperarMessage");

    errorDiv.classList.remove("show");
    successDiv.classList.remove("show");

    // Procurar usuário por email ou usuário
    const usuarioEncontrado = usuarios.find(
        u => u.email === input || u.usuario === input
    );

    if (!usuarioEncontrado) {
        errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> Usuário ou email não encontrado!";
        errorDiv.classList.add("show");
        return;
    }

    // Gerar código de recuperação
    codigoRecuperacaoGerado = Math.random().toString(36).substring(2, 8).toUpperCase();
    emailRecuperacao = usuarioEncontrado.email;

    // Simular envio de email
    console.log(`Código de recuperação para ${usuarioEncontrado.email}: ${codigoRecuperacaoGerado}`);
    alert(`✉️ Código de recuperação enviado para ${usuarioEncontrado.email}\n\n(Simulado) Código: ${codigoRecuperacaoGerado}`);

    successDiv.innerHTML = "<i class='fas fa-check-circle'></i> Código enviado! Verifique seu email.";
    successDiv.classList.add("show");

    // Mostrar formulário de código
    setTimeout(() => {
        document.getElementById("recuperarForm").style.display = "none";
        document.getElementById("formularioCodigoRecuperacao").style.display = "block";
    }, 1000);
}

function validarCodigoRecuperacao(event) {
    event.preventDefault();

    const codigo = document.getElementById("codigoRecuperacao").value;
    const novaSenha = document.getElementById("novaSenha").value;
    const confirmaSenha = document.getElementById("confirmaNovaSenha").value;
    const errorDiv = document.getElementById("errorRecuperarMessage");
    const successDiv = document.getElementById("successRecuperarMessage");

    errorDiv.classList.remove("show");
    successDiv.classList.remove("show");

    if (codigo !== codigoRecuperacaoGerado) {
        errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> Código inválido!";
        errorDiv.classList.add("show");
        return;
    }

    if (novaSenha !== confirmaSenha) {
        errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> As senhas não correspondem!";
        errorDiv.classList.add("show");
        return;
    }

    if (novaSenha.length < 6) {
        errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> A senha deve ter no mínimo 6 caracteres!";
        errorDiv.classList.add("show");
        return;
    }

    // Atualizar senha do usuário
    const usuarioRecuperacao = usuarios.find(u => u.email === emailRecuperacao);
    if (usuarioRecuperacao) {
        usuarioRecuperacao.senha = criptografarSenha(novaSenha);
        localStorage.setItem(AUTH_KEYS.usuarios, JSON.stringify(usuarios));

        successDiv.innerHTML = "<i class='fas fa-check-circle'></i> Senha alterada com sucesso! Faça login.";
        successDiv.classList.add("show");

        setTimeout(() => {
            fecharModalRecuperarSenha();
        }, 2000);
    }
}

// ================= INICIALIZAÇÃO =================
function abrirPagina(pagina) {
    if (!sessaoAtual) {
        alert('É necessário efetuar o login para acessar o sistema.');
        mostrarLogin();
        return;
    }

    // Verificar permissão
    const permissaoMapa = {
        'home': 'visualizar_dashboard',
        'veiculos': 'visualizar_veiculos',
        'motoristas': 'visualizar_motoristas',
        'servicos': 'gerenciar_veiculos',
        'missoes': 'gerenciar_veiculos',
        'relatorios': 'visualizar_relatorios',
        'configuracoes': 'editar_sistema'
    };

    if (permissaoMapa[pagina] && !temPermissao(permissaoMapa[pagina])) {
        alert("Você não tem permissão para acessar esta seção!");
        return;
    }

    // Ocultar todas as páginas
    document.querySelectorAll(".content > div").forEach(div => {
        div.style.display = "none";
    });

    // Remover classe active de todos os nav-items
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    // Mostrar página selecionada
    const pagElement = document.getElementById("pagina-" + pagina);
    if (pagElement) {
        pagElement.style.display = "block";
    }

    // Corrige toque em mobile: fecha menu lateral ao navegar
    if (document.body.classList.contains('sidebar-open')) {
        document.body.classList.remove('sidebar-open');
    }

    // Carregar dados específicos da página
    if (pagina === 'missoes') {
        renderSelectViaturas();
        preencherSelect("despachoMotorista", db.motoristas.map((m, i) => ({ value: i, text: m.nome })));
        renderMissoes();
    } else if (pagina === 'servicos') {
        renderServicosManuencaoAtivos();
    } else if (pagina === 'relatorios') {
        atualizarDashboard();
    }

    // Adicionar classe active ao nav-item clicado
    if (event && event.target) {
        event.target.closest(".nav-item").classList.add("active");
    }
}

// ================= CONTROLAR VISIBILIDADE DO MENU =================
function atualizarVisibilidadeMenu() {
    const navItems = {
        'home': 'visualizar_dashboard',
        'veiculos': 'visualizar_veiculos',
        'motoristas': 'visualizar_motoristas',
        'servicos': 'gerenciar_veiculos',
        'missoes': 'gerenciar_veiculos',
        'relatorios': 'visualizar_relatorios',
        'configuracoes': 'editar_sistema'
    };

    // Encontrar todos os nav-items e atualizar baseado no onclick
    document.querySelectorAll(".nav-item").forEach(item => {
        const onclickAttr = item.getAttribute("onclick");
        const match = onclickAttr && onclickAttr.match(/abrirPagina\('(\w+)'\)/);
        
        if (match) {
            const pagina = match[1];
            const permissao = navItems[pagina];
            
            if (permissao && !temPermissao(permissao)) {
                item.classList.add("disabled");
                item.style.pointerEvents = "none";
                item.setAttribute("title", "Sem permissão");
            } else {
                item.classList.remove("disabled");
                item.style.pointerEvents = "auto";
                item.removeAttribute("title");
            }
        }
    });
}

function inicializarApp() {
    inicializarUsuarios();
    
    if (sessaoAtual) {
        mostrarDashboard();
        atualizarVisibilidadeMenu();
        monitorarAtividade();
    } else {
        mostrarLogin();

        // Restaurar usuário se "lembrar-me" estava ativado
        const usuarioSalvo = localStorage.getItem("prf_remember_usuario");
        if (usuarioSalvo) {
            document.getElementById("loginUser").value = usuarioSalvo;
            document.getElementById("rememberMe").checked = true;
        }
    }
}

// ================= BANCO DE DADOS =================
const DB_KEYS = {
    marcas: "prf_marcas",
    modelos: "prf_modelos",
    cores: "prf_cores",
    motoristas: "prf_motoristas",
    veiculos: "prf_veiculos",
    missoes: "prf_missoes",
    servicos: "prf_servicos",
    servicosVeiculo: "prf_servicos_veiculo"
};

let db = {
    marcas: JSON.parse(localStorage.getItem(DB_KEYS.marcas)) || [],
    modelos: JSON.parse(localStorage.getItem(DB_KEYS.modelos)) || [],
    cores: JSON.parse(localStorage.getItem(DB_KEYS.cores)) || [],
    motoristas: JSON.parse(localStorage.getItem(DB_KEYS.motoristas)) || [],
    veiculos: JSON.parse(localStorage.getItem(DB_KEYS.veiculos)) || [],
    missoes: JSON.parse(localStorage.getItem(DB_KEYS.missoes)) || [],
    servicos: JSON.parse(localStorage.getItem(DB_KEYS.servicos)) || [],
    servicosVeiculo: JSON.parse(localStorage.getItem(DB_KEYS.servicosVeiculo)) || []
};

function salvar() {
    Object.keys(DB_KEYS).forEach(key => {
        localStorage.setItem(DB_KEYS[key], JSON.stringify(db[key]));
    });
}

function salvarDb() {
    salvar();
    renderizar();
}

// ================= RENDERIZAÇÃO =================

// ================= CADASTROS =================
function cadastrarMarca() {
    const input = document.getElementById("inputMarca");
    if (!input) return;

    const valor = input.value.trim();
    if (!valor) return alert("Digite a marca!");

    db.marcas.push(valor);
    input.value = "";

    salvarDb();
}

function cadastrarModelo() {
    const input = document.getElementById("inputModelo");
    if (!input) return;

    const valor = input.value.trim();
    if (!valor) return alert("Digite o modelo!");

    db.modelos.push(valor);
    input.value = "";

    salvarDb();
}

function cadastrarCor() {
    const input = document.getElementById("inputCor");
    if (!input) return;

    const valor = input.value.trim();
    if (!valor) return alert("Digite a cor!");

    db.cores.push(valor);
    input.value = "";

    salvarDb();
}

function cadastrarMotorista() {
    const nome = document.getElementById("nomeMotorista")?.value.trim();
    const cargo = document.getElementById("cargoMotorista")?.value.trim();
    const matricula = document.getElementById("matriculaMotorista")?.value.trim();
    const tel = document.getElementById("telefoneMotorista")?.value.trim();

    if (!nome || !cnh) return alert("Nome e CNH são obrigatórios!");

    db.motoristas.push({ nome, cargo, matricula, telefone: tel });

    limparCamposMotorista();
    salvarDb();
}

function limparCamposMotorista() {
    ["nomeMotorista", "cargoMotorista", "matriculaMotorista", "telefoneMotorista"]
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
}

// ================= CADASTRO DE VEÍCULOS =================
function cadastrarVeiculo() {
    const selMarca = document.getElementById("selMarca");
    const selModelo = document.getElementById("selModelo");
    const selCor = document.getElementById("selCor");
    const placaInput = document.getElementById("placaViatura");
    const hodometroInput = document.getElementById("hodometroViatura");

    if (!selMarca || !selModelo || !placaInput) return;

    const marca = db.marcas[selMarca.value];
    const modelo = db.modelos[selModelo.value];
    const cor = selCor ? db.cores[selCor.value] : null;
    const placa = placaInput.value.toUpperCase().trim();
    const hodometro = hodometroInput ? parseInt(hodometroInput.value) || 0 : 0;

    if (!placa || !marca || !modelo) return alert("Preencha todos os dados!");

    db.veiculos.push({
        marca,
        modelo,
        cor,
        placa,
        hodometro: hodometro,
        status: 'disponivel'
    });

    placaInput.value = "";
    if (hodometroInput) hodometroInput.value = "";
    salvarDb();
}

// ================= VÍNCULO DE MISSÕES =================
function vincularMissao() {
    const vtr = document.getElementById("despachoViatura");
    const mot = document.getElementById("despachoMotorista");
    const dataEntrega = document.getElementById("dataEntregaMissao");
    const dataDevolucao = document.getElementById("dataDevolucaoMissao");

    if (!vtr || !mot) return;

    const vIdx = vtr.value;
    const mIdx = mot.value;

    if (vIdx === "" || mIdx === "") return alert("Selecione veículo e motorista!");

    if (!dataEntrega || !dataEntrega.value) return alert("Informe a data de entrega!");
    if (!dataDevolucao || !dataDevolucao.value) return alert("Informe a data de devolução!");

    const veiculo = db.veiculos[vIdx];
    const motorista = db.motoristas[mIdx];

    if (!veiculo || !motorista) return alert("Veículo ou motorista inválido!");

    veiculo.status = 'em uso';

    const agora = new Date();
    const dataInicioISO = agora.toISOString().split('T')[0];

    db.missoes.push({
        id: Date.now(),
        veiculo,
        motorista,
        dataInicio: dataInicioISO,
        dataEntrega: dataEntrega.value,
        dataDevolucao: dataDevolucao.value,
        dataDevolutiva: null,
        ativo: true
    });

    // Limpar campos
    dataEntrega.value = "";
    dataDevolucao.value = "";
    vtr.value = "";
    mot.value = "";
    
    salvarDb();
    renderizar();
    alert("Missão vinculada com sucesso!");
}

// ================= RENDERIZAÇÃO =================
function renderizar() {
    preencherSelect("selMarca", db.marcas);
    preencherSelect("selModelo", db.modelos);
    preencherSelect("selCor", db.cores);
    preencherSelect("despachoMotorista", db.motoristas.map((m, i) => ({ value: i, text: m.nome })));
    
    // Preencher filtros de pesquisa
    preencherSelect("filtroModelo", db.modelos, true); // true para adicionar "Todos os Modelos"
    preencherSelect("filtroCor", db.cores, true); // true para adicionar "Todas as Cores"

    filtrarViaturas(); // Atualizado para usar filtros múltiplos
    renderMotoristas();
    renderSelectViaturas();
    renderAuxiliares();
    renderMissoes();
    renderServicosManuencao();
    renderServicosManuencaoAtivos();
    atualizarDashboard();
    inicializarRelatorios();
}

// ================= SELECTS =================
function preencherSelect(id, lista, adicionarTodos = false) {
    const el = document.getElementById(id);
    if (!el) return;

    let opcaoInicial = '<option value="">Selecione...</option>';
    if (adicionarTodos) {
        opcaoInicial = '<option value="">Todos</option>';
    }

    el.innerHTML = opcaoInicial +
        lista.map((item, i) => {
            if (typeof item === 'object' && item.value !== undefined && item.text !== undefined) {
                return `<option value="${item.value}">${item.text}</option>`;
            } else {
                return `<option value="${item}">${item}</option>`;
            }
        }).join("");
}

// ================= LISTAGENS =================
function renderVeiculos(filtros = {}) {
    const lista = document.getElementById("listaVeiculos");
    if (!lista) return;

    // Se filtros for uma string (compatibilidade), converte para objeto
    if (typeof filtros === 'string') {
        filtros = { status: filtros };
    }

    let viaturas = db.veiculos.map((v, i) => ({ ...v, index: i }));

    // Aplicar filtros
    if (filtros.status && filtros.status !== 'todos') {
        viaturas = viaturas.filter(v => v.status === filtros.status);
    }

    if (filtros.modelo) {
        viaturas = viaturas.filter(v => v.modelo === filtros.modelo);
    }

    if (filtros.cor) {
        viaturas = viaturas.filter(v => v.cor === filtros.cor);
    }

    if (filtros.placa) {
        viaturas = viaturas.filter(v => v.placa?.toLowerCase().includes(filtros.placa));
    }

    lista.innerHTML = viaturas.map(v => {
        const infoOleo = calcularProximaTrocaOleo(v);
        const emEdicao = estadoEdicao.veiculoEmEdicao === v.index;
        
        return `
        <div class="card" style="margin-bottom:10px;">
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <strong>Placa:</strong>
                        <input type="text" id="placa${v.index}" value="${v.placa}" 
                               class="form-control" style="display: inline-block; width: 120px; margin: 0 5px;" 
                               placeholder="Placa" ${!emEdicao ? 'disabled' : ''}>
                        ${emEdicao ? `
                            <button onclick="salvarPlacaVeiculo(${v.index})" class="btn btn-sm btn-outline-success" title="Salvar placa">
                                <i class="fas fa-check"></i> Salvar
                            </button>
                            <button onclick="cancelarEdicaoVeiculo(${v.index})" class="btn btn-sm btn-outline-secondary" title="Cancelar">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        ` : `
                            <button onclick="iniciarEdicaoVeiculo(${v.index})" class="btn btn-sm btn-outline-primary" title="Editar placa">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        `}
                    </div>
                    <button onclick="abrirInfoServicos(${v.index})" class="btn btn-sm" style="background: #0b3d91; color: white; border: none; padding: 5px 10px; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;" title="Informações e Serviços">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
                
                <div>
                    <strong>Modelo:</strong> ${v.marca} ${v.modelo}<br>
                    <strong>Cor:</strong> ${emEdicao ? `
                        <select id="cor${v.index}" class="form-control" style="display: inline-block; width: 150px; margin: 0 5px;">
                            <option value="">Selecione...</option>
                        </select>
                        <button onclick="salvarCorVeiculo(${v.index})" class="btn btn-sm btn-outline-success" style="margin-left: 5px;">
                            <i class="fas fa-check"></i> Salvar
                        </button>
                    ` : `${v.cor || '-'}`}<br>
                </div>
                <div style="margin-top: 10px; margin-bottom: 10px;">
                    <strong>Hodômetro:</strong> 
                    <input type="number" id="hodometro${v.index}" value="${v.hodometro || 0}" style="width: 100px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;" ${!emEdicao ? 'disabled' : ''} /> km
                    ${emEdicao ? `
                        <button onclick="salvarHodometroVeiculo(${v.index})" class="btn btn-sm btn-outline-success" style="margin-left: 5px;">
                            <i class="fas fa-check"></i> Salvar
                        </button>
                    ` : ''}
                </div>
                <div>${getOleoAlertaHTML(v)}</div>
                <div style="margin-top: 10px;">
                    <span class="badge ${getBadgeClass(v.status)}">
                        ${getStatusLabel(v.status)}
                    </span>
                </div>
                <div class="mt-2">
                    <select id="statusSelect${v.index}" class="form-control mb-2" style="width: auto; display: inline-block;">
                        <option value="disponivel" ${v.status === 'disponivel' ? 'selected' : ''}>Disponível</option>
                        <option value="em uso" ${v.status === 'em uso' ? 'selected' : ''}>Em Uso</option>
                        <option value="em manutencao" ${v.status === 'em manutencao' ? 'selected' : ''}>Em Manutenção</option>
                    </select>
                    <button onclick="alterarStatus(${v.index}, document.getElementById('statusSelect${v.index}').value)" class="btn btn-sm btn-outline-primary me-1">
                        Alterar Status
                    </button>
                    ${v.status === 'em uso' ? `<button onclick="desvincularViatura(${v.index})" class="btn btn-sm btn-outline-danger me-1">
                        Desvincular
                    </button>` : ''}
                    <button onclick="excluirVeiculo(${v.index})" class="btn btn-sm btn-outline-danger">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `}).join("");
}

function filtrarViaturas() {
    const filtros = {
        status: document.getElementById("filtroStatus")?.value || 'todos',
        modelo: document.getElementById("filtroModelo")?.value || '',
        cor: document.getElementById("filtroCor")?.value || '',
        placa: document.getElementById("filtroPlaca")?.value?.toLowerCase().trim() || ''
    };
    renderVeiculos(filtros);
}

function limparFiltros() {
    document.getElementById("filtroStatus").value = 'todos';
    document.getElementById("filtroModelo").value = '';
    document.getElementById("filtroCor").value = '';
    document.getElementById("filtroPlaca").value = '';
    filtrarViaturas();
}

function renderMotoristas() {
    const lista = document.getElementById("listaMotoristas");
    if (!lista) return;

    lista.innerHTML = db.motoristas.map((m, i) => {
        const emEdicao = estadoEdicao.motoristaEmEdicao === i;
        return `
        <div class="card" style="margin-bottom:10px;">
            <div class="card-body">
                <div style="margin-bottom: 10px;">
                    <label><strong>Nome:</strong></label>
                    <input type="text" id="nomeMotorista${i}" value="${m.nome}" 
                           class="form-control" style="margin-bottom: 5px;" placeholder="Nome" ${!emEdicao ? 'disabled' : ''}>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <label><strong>Cargo:</strong></label>
                    <input type="text" id="cargoMotorista${i}" value="${m.cargo || ''}" 
                           class="form-control" style="margin-bottom: 5px;" placeholder="Cargo" ${!emEdicao ? 'disabled' : ''}>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <label><strong>CNH:</strong></label>
                    <input type="text" id="cnhMotorista${i}" value="${m.cnh}" 
                           class="form-control" style="margin-bottom: 5px;" placeholder="CNH" ${!emEdicao ? 'disabled' : ''}>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <label><strong>Telefone:</strong></label>
                    <input type="text" id="telefoneMotorista${i}" value="${m.telefone || ''}" 
                           class="form-control" style="margin-bottom: 5px;" placeholder="Telefone" ${!emEdicao ? 'disabled' : ''}>
                </div>
                
                <div class="mt-2">
                    ${emEdicao ? `
                        <button onclick="salvarMotorista(${i})" class="btn btn-sm btn-outline-success me-2">
                            <i class="fas fa-check"></i> Salvar
                        </button>
                        <button onclick="cancelarEdicaoMotorista(${i})" class="btn btn-sm btn-outline-secondary me-2">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    ` : `
                        <button onclick="iniciarEdicaoMotorista(${i})" class="btn btn-sm btn-outline-primary me-2">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    `}
                    <button onclick="excluirMotorista(${i})" class="btn btn-sm btn-outline-danger">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `}).join("");
}

function renderSelectViaturas() {
    const sel = document.getElementById("despachoViatura");
    if (!sel) return;

    const disponiveis = db.veiculos
        .map((v, i) => ({ ...v, idx: i }))
        .filter(v => v.status === 'disponivel');

    sel.innerHTML = '<option value="">Selecione...</option>' +
        disponiveis.map(v => `<option value="${v.idx}">${v.placa} - ${v.modelo}</option>`).join("");
}

// ================= RENDER AUXILIARES =================
function renderAuxiliares() {
    renderLista("listaMarcas", db.marcas, "marca");
    renderLista("listaModelos", db.modelos, "modelo");
    renderLista("listaCores", db.cores, "cor");
}

function renderLista(id, lista, tipo) {
    const el = document.getElementById(id);
    if (!el) return;

    el.innerHTML = lista.map((item, i) => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <input type="text" id="input${tipo}${i}" value="${item}" 
                   class="form-control" style="width: 200px; margin-right: 10px;" placeholder="${tipo}">
            <div>
                <button onclick="salvarAuxiliar('${tipo}', ${i})" class="btn btn-sm btn-outline-success me-1">
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="excluirAuxiliar('${tipo}', ${i})" class="btn btn-sm btn-outline-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join("");
}

// ================= RENDER MISSÕES =================
function renderMissoes() {
    const lista = document.getElementById("listaMissoes");
    if (!lista) return;

    // Filtrar apenas missões ativas
    const missoesAtivas = db.missoes.filter(m => m.ativo !== false);

    lista.innerHTML = missoesAtivas.map((m, idx) => {
        // Parsear data corretamente evitando problemas de timezone
        const [ano, mes, dia] = m.dataDevolucao.split('-');
        const dataDevolucaoObj = new Date(ano, mes - 1, dia);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        dataDevolucaoObj.setHours(0, 0, 0, 0);
        
        const diasAtraso = Math.floor((hoje - dataDevolucaoObj) / (1000 * 60 * 60 * 24));
        const statusAtraso = diasAtraso > 0 ? `<span style="color: red; font-weight: bold; margin-left: 10px;"><i class="fas fa-exclamation-triangle"></i> ATRASADO por ${diasAtraso} dia(s)</span>` : '';

        // Encontrar índice real na array db.missoes
        const realIdx = db.missoes.indexOf(m);

        return `
        <div class="card mb-2" style="border: 1px solid ${diasAtraso > 0 ? '#dc3545' : '#ddd'};">
            <div class="card-body">
                <strong>Missão #${m.id}</strong><br>
                Viatura: ${m.veiculo.placa} - ${m.veiculo.modelo}<br>
                Motorista: ${m.motorista.nome}<br>
                Data Entrega: ${m.dataEntrega} | Data Devolução: ${m.dataDevolucao} ${statusAtraso}<br>
                <div class="mt-2">
                    <button onclick="devolverMissao(${realIdx})" class="btn btn-sm btn-outline-success">
                        <i class="fas fa-check"></i> Devolver
                    </button>
                    <button onclick="excluirMissao(${realIdx})" class="btn btn-sm btn-outline-danger">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `}).join("");
    
    if (missoesAtivas.length === 0) {
        lista.innerHTML = '<p style="color: #999;"><em>Nenhuma missão ativa</em></p>';
    }
}

// ================= DASHBOARD =================
function atualizarDashboard() {
    const total = db.veiculos.length;
    const disp = db.veiculos.filter(v => v.status === 'disponivel').length;
    const uso = db.veiculos.filter(v => v.status === 'em uso').length;
    const manut = db.veiculos.filter(v => v.status === 'em manutencao').length;

    const t = document.getElementById("countTotal");
    const d = document.getElementById("countDisp");
    const u = document.getElementById("countUso");
    const m = document.getElementById("countManut");

    if (t) t.innerText = total;
    if (d) d.innerText = disp;
    if (u) u.innerText = uso;
    if (m) m.innerText = manut;
}

// Tornar dashboard interativo
function mostrarViaturasEmUso() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = 'display: flex; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); align-items: center; justify-content: center;';
    
    const viaturasEmUso = db.missoes.filter(m => m.ativo !== false);
    
    let html = `<h5>Viaturas em Uso</h5>`;
    if (viaturasEmUso.length === 0) {
        html += '<p>Nenhuma viatura em uso</p>';
    } else {
        html += '<table class="table table-striped"><thead><tr><th>Placa</th><th>Veículo</th><th>Motorista</th><th>Status Entrega</th><th>Próxima Troca de Óleo</th></tr></thead><tbody>';
        
        viaturasEmUso.forEach(missao => {
            const dataDevolucaoObj = new Date(missao.dataDevolucao);
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            dataDevolucaoObj.setHours(0, 0, 0, 0);
            
            const diasAtraso = Math.floor((hoje - dataDevolucaoObj) / (1000 * 60 * 60 * 24));
            const statusEntrega = diasAtraso > 0 ? `<span style="color: red;"><i class="fas fa-exclamation-triangle"></i> ATRASADO ${diasAtraso}d</span>` : '<span style="color: green;">No Prazo</span>';
            
            const infOleo = calcularProximaTrocaOleo(missao.veiculo);
            
            html += `<tr>
                <td><strong>${missao.veiculo.placa}</strong></td>
                <td>${missao.veiculo.marca} ${missao.veiculo.modelo}</td>
                <td>${missao.motorista.nome}</td>
                <td>${statusEntrega}</td>
                <td>${infOleo.status === 'VENCIDO' ? '<span style="color: red; font-weight: bold;">VENCIDO!</span>' : infOleo.mensagem}</td>
            </tr>`;
        });
        
        html += '</tbody></table>';
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 30px; border-radius: 10px; width: 90%; max-width: 900px; max-height: 80vh; overflow-y: auto;">
            ${html}
            <button onclick="this.closest('.modal').remove()" class="btn btn-secondary" style="margin-top: 20px;">Fechar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// ================= EDITAR E EXCLUIR =================
function getBadgeClass(status) {
    switch (status) {
        case 'disponivel': return 'bg-success';
        case 'em uso': return 'bg-warning';
        case 'em manutencao': return 'bg-secondary';
        default: return 'bg-light';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'disponivel': return 'Disponível';
        case 'em uso': return 'Em Uso';
        case 'em manutencao': return 'Em Manutenção';
        default: return status;
    }
}

function editarHodometro(index) {
    const input = document.getElementById(`hodometro${index}`);
    if (!input) return;
    
    const novoValor = parseInt(input.value) || 0;
    db.veiculos[index].hodometro = novoValor;
    salvarDb();
}

function abrirInfoServicos(index) {
    const veiculo = db.veiculos[index];
    if (!veiculo) return;
    
    const placa = veiculo.placa;
    const servicosVeiculo = db.servicosVeiculo.filter(s => s.placa === placa);
    
    const ultimaTrocaOleo = servicosVeiculo
        .filter(s => s.tipo === 'Troca de Óleo')
        .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
    
    let html = `<h5>Informações da Viatura ${placa}</h5>`;
    html += `<p><strong>Marca:</strong> ${veiculo.marca}</p>`;
    html += `<p><strong>Modelo:</strong> ${veiculo.modelo}</p>`;
    html += `<p><strong>Hodômetro:</strong> ${veiculo.hodometro || 0} km</p>`;
    
    if (ultimaTrocaOleo) {
        html += `<p><strong>Última Troca de Óleo:</strong> ${ultimaTrocaOleo.data} em ${ultimaTrocaOleo.hodometroNaData} km</p>`;
    } else {
        html += `<p><strong>Última Troca de Óleo:</strong> Sem registros</p>`;
    }
    
    const infoOleo = calcularProximaTrocaOleo(veiculo);
    let corOleo = '#28a745';
    if (infoOleo.status === 'VENCIDO') corOleo = '#dc3545';
    else if (infoOleo.status === 'ALERTA') corOleo = '#ffc107';
    
    html += `<p style="color: ${corOleo}; font-weight: bold;"><i class="fas fa-oil-can"></i> ${infoOleo.mensagem}</p>`;
    
    html += `<hr>`;
    html += `<h6>Histórico de Serviços</h6>`;
    
    if (servicosVeiculo.length === 0) {
        html += `<p><em>Nenhum serviço registrado</em></p>`;
    } else {
        html += `<table class="table table-sm"><thead><tr><th>Data</th><th>Tipo</th><th>Hodômetro</th><th>Descrição</th><th>Status</th><th>Ação</th></tr></thead><tbody>`;
        servicosVeiculo.forEach((s, i) => {
            const statusBadge = s.status === 'pendente' ? '<span class="badge bg-warning">Pendente</span>' : '<span class="badge bg-success">Concluído</span>';
            html += `<tr><td>${s.data}</td><td>${s.tipo}</td><td>${s.hodometroNaData} km</td><td>${s.descricao || '-'}</td><td>${statusBadge}</td><td><button onclick="excluirServico('${placa}', ${i})" class="btn btn-sm btn-outline-danger">Excluir</button></td></tr>`;
        });
        html += `</tbody></table>`;
    }
    
    html += `<hr>`;
    html += `<div class="mb-3">
        <label>Novo Serviço:</label>
        <input type="date" id="dataServico" class="form-control mb-2" />
        <select id="tipoServico" class="form-control mb-2">
            <option value="">Selecione o tipo</option>
            <option value="Troca de Óleo">Troca de Óleo</option>
            <option value="Manutenção">Manutenção</option>
            <option value="Reparo">Reparo</option>
            <option value="Inspeção">Inspeção</option>
            <option value="Outro">Outro</option>
        </select>
        <input type="text" id="descricaoServico" placeholder="Descrição (opcional)" class="form-control mb-2" />
        <button onclick="adicionarServico('${placa}')" class="btn btn-sm btn-success">Adicionar Serviço</button>
    </div>`;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = 'display: flex; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 30px; border-radius: 10px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
            ${html}
            <button onclick="this.closest('.modal').remove()" class="btn btn-secondary" style="margin-top: 20px;">Fechar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function adicionarServico(placa) {
    const data = document.getElementById('dataServico').value;
    const tipo = document.getElementById('tipoServico').value;
    const descricao = document.getElementById('descricaoServico').value;
    
    if (!data || !tipo) return alert('Informe data e tipo de serviço!');
    
    const veiculo = db.veiculos.find(v => v.placa === placa);
    
    db.servicosVeiculo.push({
        placa: placa,
        data: data,
        tipo: tipo,
        descricao: descricao,
        hodometroNaData: veiculo ? veiculo.hodometro : 0,
        status: 'pendente'
    });
    
    salvarDb();
    abrirInfoServicos(db.veiculos.findIndex(v => v.placa === placa));
}

function excluirServico(placa, index) {
    if (!confirm('Tem certeza?')) return;
    const servicosVeiculo = db.servicosVeiculo.filter(s => s.placa === placa);
    const servicoGlobal = db.servicosVeiculo.findIndex(s => s.placa === placa && 
        db.servicosVeiculo.filter(x => x.placa === placa).indexOf(s) === index);
    
    if (servicoGlobal !== -1) {
        db.servicosVeiculo.splice(servicoGlobal, 1);
        salvarDb();
    }
}

// ================= GERENCIAR SERVIÇOS DE MANUTENÇÃO =================
function renderServicosManuencao() {
    const lista = document.getElementById("listaServicosManuencao");
    if (!lista) return;
    
    // Viaturas em manutenção
    const viaturasManuencao = db.veiculos.filter(v => v.status === 'em manutencao');
    
    if (viaturasManuencao.length === 0) {
        lista.innerHTML = '<p style="color: #999;"><em>Nenhuma viatura em manutenção</em></p>';
        return;
    }
    
    lista.innerHTML = viaturasManuencao.map(v => {
        const servicosVeiculo = db.servicosVeiculo.filter(s => s.placa === v.placa);
        const servicosPendentes = servicosVeiculo.filter(s => s.status === 'pendente');
        const servicosConcluidos = servicosVeiculo.filter(s => s.status === 'concluido');
        
        return `
            <div class="card mb-3">
                <div class="card-header" style="background: #f5f5f5; display: flex; justify-content: space-between; align-items: center;">
                    <strong>${v.placa}</strong> - ${v.marca} ${v.modelo}
                    <span class="badge bg-warning">Em Manutenção</span>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <h6>Serviços Pendentes (${servicosPendentes.length})</h6>
                        ${servicosPendentes.length === 0 ? '<p><em>Sem serviços pendentes</em></p>' : 
                            servicosPendentes.map((s, idx) => `
                                <div style="border-left: 3px solid #dc3545; padding-left: 10px; margin-bottom: 10px;">
                                    <strong>${s.tipo}</strong> - ${s.data}<br>
                                    <small>${s.descricao || 'Sem descrição'}</small><br>
                                    <button onclick="mudarStatusServico('${v.placa}', ${db.servicosVeiculo.indexOf(s)}, 'concluido')" class="btn btn-sm btn-success mt-1">
                                        <i class="fas fa-check"></i> Marcar como Concluído
                                    </button>
                                </div>
                            `).join('')
                        }
                    </div>
                    
                    <div class="mb-3">
                        <h6>Serviços Concluídos (${servicosConcluidos.length})</h6>
                        ${servicosConcluidos.length === 0 ? '<p><em>Nenhum serviço concluído</em></p>' : 
                            servicosConcluidos.map(s => `
                                <div style="border-left: 3px solid #28a745; padding-left: 10px; margin-bottom: 10px;">
                                    <strong>${s.tipo}</strong> - ${s.data}<br>
                                    <small>${s.descricao || 'Sem descrição'}</small>
                                </div>
                            `).join('')
                        }
                    </div>
                    
                    ${servicosPendentes.length === 0 ? `
                        <button onclick="concluirManuencao('${v.placa}')" class="btn btn-sm btn-success w-100">
                            <i class="fas fa-check-double"></i> Manutenção Concluída - Voltar para Disponível
                        </button>
                    ` : ''}
                    
                    <div class="mt-3">
                        <h6>Adicionar Novo Serviço</h6>
                        <div class="row">
                            <div class="col-md-6">
                                <label>Data do Serviço:</label>
                                <input type="date" id="dataServicoManut${db.veiculos.indexOf(v)}" class="form-control mb-2" />
                            </div>
                            <div class="col-md-6">
                                <label>Tipo de Serviço:</label>
                                <select id="tipoServicoManut${db.veiculos.indexOf(v)}" class="form-control mb-2" onchange="alternarCamposOleo(${db.veiculos.indexOf(v)})">
                                    <option value="">Selecione o tipo</option>
                                    <option value="Troca de Óleo">Troca de Óleo</option>
                                    <option value="Manutenção">Manutenção</option>
                                    <option value="Reparo">Reparo</option>
                                    <option value="Inspeção">Inspeção</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                        </div>
                        
                        <div id="camposOleo${db.veiculos.indexOf(v)}" style="display: none; background: #f9f9f9; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                            <label><strong>Dados da Troca de Óleo:</strong></label>
                            <div class="row">
                                <div class="col-md-6">
                                    <label>Hodômetro (km):</label>
                                    <input type="number" id="kmOleo${db.veiculos.indexOf(v)}" class="form-control mb-2" placeholder="Ex: 45000" />
                                </div>
                                <div class="col-md-6">
                                    <label>Próxima Troca Prevista:</label>
                                    <div id="alertaOleo${db.veiculos.indexOf(v)}" style="padding: 8px; background: #e8f4f8; border-left: 3px solid #0b3d91; margin-top: 5px; font-size: 12px;">
                                        Preencha o hodômetro para ver o alerta
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <input type="text" id="descServicoManut${db.veiculos.indexOf(v)}" placeholder="Descrição (opcional)" class="form-control mb-2" />
                        <button onclick="adicionarServicoManuencao('${v.placa}', ${db.veiculos.indexOf(v)})" class="btn btn-sm btn-primary w-100">
                            <i class="fas fa-plus"></i> Adicionar Serviço
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function adicionarServicoManuencao(placa, veilIdx) {
    const data = document.getElementById(`dataServicoManut${veilIdx}`)?.value;
    const tipo = document.getElementById(`tipoServicoManut${veilIdx}`)?.value;
    const descricao = document.getElementById(`descServicoManut${veilIdx}`)?.value;
    
    if (!data || !tipo) return alert('Informe data e tipo de serviço!');
    
    const veiculo = db.veiculos.find(v => v.placa === placa);
    let hodometroNaData = veiculo ? veiculo.hodometro : 0;
    
    // Se for Troca de Óleo, exigir hodômetro
    if (tipo === 'Troca de Óleo') {
        const km = document.getElementById(`kmOleo${veilIdx}`)?.value;
        if (!km) return alert('Para Troca de Óleo, informe o hodômetro!');
        
        hodometroNaData = parseInt(km);
        if (isNaN(hodometroNaData) || hodometroNaData < 0) {
            return alert('Hodômetro inválido!');
        }
    }
    
    db.servicosVeiculo.push({
        placa: placa,
        data: data,
        tipo: tipo,
        descricao: descricao,
        hodometroNaData: hodometroNaData,
        status: 'pendente'
    });
    
    // Atualizar hodômetro do veículo se for troca de óleo
    if (tipo === 'Troca de Óleo' && veiculo) {
        veiculo.hodometro = hodometroNaData;
    }
    
    // Limpar campos
    document.getElementById(`dataServicoManut${veilIdx}`).value = "";
    document.getElementById(`tipoServicoManut${veilIdx}`).value = "";
    document.getElementById(`descServicoManut${veilIdx}`).value = "";
    const kmInput = document.getElementById(`kmOleo${veilIdx}`);
    if (kmInput) kmInput.value = "";
    
    salvarDb();
}

function alternarCamposOleo(index) {
    const tipo = document.getElementById(`tipoServicoManut${index}`)?.value;
    const camposOleo = document.getElementById(`camposOleo${index}`);
    const alertaOleo = document.getElementById(`alertaOleo${index}`);
    const kmInput = document.getElementById(`kmOleo${index}`);
    
    if (!camposOleo) return;
    
    if (tipo === 'Troca de Óleo') {
        camposOleo.style.display = 'block';
        
        // Adicionar listener ao campo de km para atualizar alerta
        if (kmInput) {
            kmInput.addEventListener('input', function() {
                atualizarAlertaOleo(index);
            });
            atualizarAlertaOleo(index);
        }
    } else {
        camposOleo.style.display = 'none';
    }
}

function atualizarAlertaOleo(index) {
    const kmInput = document.getElementById(`kmOleo${index}`);
    const alertaOleo = document.getElementById(`alertaOleo${index}`);
    
    if (!kmInput || !alertaOleo) return;
    
    const kmAtual = parseInt(kmInput.value);
    if (isNaN(kmAtual)) {
        alertaOleo.innerHTML = '<strong><i class="fas fa-info-circle"></i> Informe o hodômetro para calcular a próxima troca</strong>';
        return;
    }
    
    // Calcular próxima troca: 1 ano ou 10.000 km (o que chegar primeiro)
    const proximaTrocaKm = kmAtual + 10000;
    const hoje = new Date();
    const proximaTrocaData = new Date(hoje.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    const dataFormatada = proximaTrocaData.toLocaleDateString('pt-BR');
    
    alertaOleo.innerHTML = `
        <strong><i class="fas fa-calendar"></i> Próxima Troca Prevista:</strong><br>
        📍 Até ${proximaTrocaKm.toLocaleString('pt-BR')} km<br>
        📅 Até ${dataFormatada}
    `;
    alertaOleo.style.background = '#e8f4f8';
}

function mudarStatusServico(placa, servicoIdx, novoStatus) {
    if (servicoIdx >= 0 && servicoIdx < db.servicosVeiculo.length) {
        db.servicosVeiculo[servicoIdx].status = novoStatus;
        salvarDb();
        renderizar();
    }
}

function concluirManuencao(placa) {
    if (!confirm('Tem certeza que deseja marcar a manutenção como concluída?')) return;
    
    const veiculo = db.veiculos.find(v => v.placa === placa);
    if (veiculo) {
        veiculo.status = 'disponivel';
        salvarDb();
        renderizar();
    }
}

// ================= RENDER SERVIÇOS EM ANDAMENTO (MENU SERVIÇOS) =================
function renderServicosManuencaoAtivos() {
    const lista = document.getElementById("listaServicosManuencaoAtivos");
    if (!lista) return;
    
    // Viaturas em manutenção
    const viaturasManuencao = db.veiculos.filter(v => v.status === 'em manutencao');
    
    if (viaturasManuencao.length === 0) {
        lista.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle"></i> Nenhuma viatura em manutenção no momento</div>';
        return;
    }
    
    lista.innerHTML = viaturasManuencao.map(v => {
        const servicosVeiculo = db.servicosVeiculo.filter(s => s.placa === v.placa);
        const servicosPendentes = servicosVeiculo.filter(s => s.status === 'pendente');
        const servicosConcluidos = servicosVeiculo.filter(s => s.status === 'concluido');
        
        return `
            <div class="card mb-4">
                <div class="card-header" style="background: linear-gradient(135deg, #0d3d91 0%, #ff6600 100%); color: white;">
                    <strong><i class="fas fa-car"></i> ${v.placa}</strong> - ${v.marca} ${v.modelo}
                    <span class="badge bg-warning ms-2" style="color: #000;">Em Manutenção</span>
                    <span class="badge bg-secondary ms-1">Hodômetro: ${v.hodometro || 0} km</span>
                </div>
                <div class="card-body">
                    <div class="servicos-columns">
                        <!-- Coluna de Pendentes -->
                        <div class="coluna-pendentes">
                            <h5><i class="fas fa-hourglass-half"></i> Pendentes (${servicosPendentes.length})</h5>
                            ${servicosPendentes.length === 0 ? 
                                '<div class="alert alert-success mb-0"><i class="fas fa-check-circle"></i> Todos concluídos!</div>' : 
                                servicosPendentes.map((s, idx) => {
                                    const isOleo = s.tipo === 'Troca de Óleo';
                                    return `
                                    <div class="servico-item card-servico-pendente">
                                        <strong>${s.tipo}</strong>
                                        <small><i class="fas fa-calendar"></i> ${s.data}</small>
                                        <small><i class="fas fa-tachometer-alt"></i> ${s.hodometroNaData} km</small>
                                        ${s.descricao ? `<small><i class="fas fa-sticky-note"></i> ${s.descricao}</small>` : ''}
                                        ${isOleo ? `
                                        <div class="mt-2">
                                            <label class="form-label"><small><strong>Atualizar Quilometragem:</strong></small></label>
                                            <input type="number" id="kmAtualizado_${db.servicosVeiculo.indexOf(s)}" class="form-control form-control-sm mb-2" value="${v.hodometro || 0}" min="0" />
                                        </div>
                                        ` : ''}
                                        <button onclick="concluirServico('${v.placa}', ${db.servicosVeiculo.indexOf(s)}, '${s.tipo}')" class="btn btn-sm btn-success w-100 mt-2">
                                            <i class="fas fa-check"></i> Marcar Concluído
                                        </button>
                                    </div>
                                `}).join('')
                            }
                        </div>
                        
                        <!-- Coluna de Concluídos -->
                        <div class="coluna-concluidos">
                            <h5><i class="fas fa-check-circle"></i> Concluídos (${servicosConcluidos.length})</h5>
                            ${servicosConcluidos.length === 0 ? 
                                '<p class="text-muted mb-0"><em>Nenhum serviço concluído ainda</em></p>' : 
                                servicosConcluidos.map(s => `
                                    <div class="servico-item card-servico-concluido">
                                        <strong>${s.tipo}</strong>
                                        <small><i class="fas fa-calendar"></i> ${s.data}</small>
                                        <small><i class="fas fa-tachometer-alt"></i> ${s.hodometroNaData} km</small>
                                        ${s.descricao ? `<small><i class="fas fa-sticky-note"></i> ${s.descricao}</small>` : ''}
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-top">
                        <div class="card card-header mb-3" style="color: white; background: linear-gradient(135deg, #0d3d91 0%, #0d3d91 100%);">
                            <h6><i class="fas fa-plus-circle"></i> Adicionar Novo Serviço</h6>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <label for="dataServicoAtivo${db.veiculos.indexOf(v)}" class="form-label">Data do Serviço</label>
                                <input type="date" id="dataServicoAtivo${db.veiculos.indexOf(v)}" class="form-control" />
                            </div>
                            <div class="col-md-3">
                                <label for="tipoServicoAtivo${db.veiculos.indexOf(v)}" class="form-label">Tipo de Serviço</label>
                                <select id="tipoServicoAtivo${db.veiculos.indexOf(v)}" class="form-select">
                                    <option value="">Selecione um tipo...</option>
                                    <option value="Troca de Óleo">🛢️ Troca de Óleo</option>
                                    <option value="Manutenção">⚙️ Manutenção</option>
                                    <option value="Reparo">🔧 Reparo</option>
                                    <option value="Inspeção">🔍 Inspeção</option>
                                    <option value="Diagnóstico">📋 Diagnóstico</option>
                                    <option value="Outro">📌 Outro</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="kmServicoAtivo${db.veiculos.indexOf(v)}" class="form-label">Quilometragem</label>
                                <input type="number" id="kmServicoAtivo${db.veiculos.indexOf(v)}" class="form-control" value="${v.hodometro || 0}" min="0" />
                            </div>
                            <div class="col-md-3">
                                <label>&nbsp;</label>
                                <button onclick="adicionarServicoAtivo('${v.placa}', ${db.veiculos.indexOf(v)})" class="btn btn-filtrar w-100">
                                    <i class="fas fa-plus"></i> Adicionar
                                </button>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-12">
                                <label for="descServicoAtivo${db.veiculos.indexOf(v)}" class="form-label">Descrição / Observações (opcional)</label>
                                <textarea id="descServicoAtivo${db.veiculos.indexOf(v)}" class="form-control" rows="2" placeholder="Ex: Trocar filtro de ar, verificar sistema de ar..."></textarea>
                            </div>
                        </div>
                    </div>

                    ${servicosPendentes.length === 0 ? `
                        <div class="mt-4">
                            <button onclick="concluirManuencao('${v.placa}')" class="btn btn-success w-100" style="font-size: 15px; padding: 12px; font-weight: 600;">
                                <i class="fas fa-check-double"></i> Manutenção Concluída - Voltar para Disponível
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function adicionarServicoAtivo(placa, veilIdx) {
    const data = document.getElementById(`dataServicoAtivo${veilIdx}`)?.value;
    const tipo = document.getElementById(`tipoServicoAtivo${veilIdx}`)?.value;
    const km = parseInt(document.getElementById(`kmServicoAtivo${veilIdx}`)?.value) || 0;
    const descricao = document.getElementById(`descServicoAtivo${veilIdx}`)?.value;
    
    if (!data || !tipo) return alert('Informe data e tipo de serviço!');
    
    db.servicosVeiculo.push({
        placa: placa,
        data: data,
        tipo: tipo,
        descricao: descricao,
        hodometroNaData: km,
        status: 'pendente'
    });
    
    // Limpar campos
    document.getElementById(`dataServicoAtivo${veilIdx}`).value = "";
    document.getElementById(`tipoServicoAtivo${veilIdx}`).value = "";
    document.getElementById(`descServicoAtivo${veilIdx}`).value = "";
    
    salvarDb();
    renderizar();
}

function concluirServico(placa, servicoIdx, tipoServico = '') {
    // Se for Troca de Óleo, exigir atualização de quilometragem
    if (tipoServico === 'Troca de Óleo') {
        const kmAtualizadoEl = document.getElementById(`kmAtualizado_${servicoIdx}`);
        if (!kmAtualizadoEl || kmAtualizadoEl.value === '') {
            return alert('Para finalizar a Troca de Óleo, atualize a quilometragem do veículo!');
        }
        
        const novoKm = parseInt(kmAtualizadoEl.value);
        if (isNaN(novoKm) || novoKm < 0) {
            return alert('Quilometragem inválida! Informe um valor válido.');
        }
        
        // Atualizar quilometragem do veículo
        const veiculo = db.veiculos.find(v => v.placa === placa);
        if (veiculo) {
            veiculo.hodometro = novoKm;
        }
    }
    
    if (servicoIdx >= 0 && servicoIdx < db.servicosVeiculo.length) {
        db.servicosVeiculo[servicoIdx].status = 'concluido';
        salvarDb();
        renderizar();
    }
}

// ================= RENDER HISTÓRICO DE SERVIÇOS =================
function renderHistoricoServicos(filtroData = null, filtroPlaca = null) {
    const lista = document.getElementById("listaHistoricoServicos");
    if (!lista) return;
    
    // Viaturas que NÃO estão em manutenção (já passaram por serviço)
    const viaturasConcluidas = db.veiculos.filter(v => v.status !== 'em manutencao');
    
    let servicosFiltrados = [];
    
    viaturasConcluidas.forEach(v => {
        const servicos = db.servicosVeiculo.filter(s => s.placa === v.placa && s.status === 'concluido');
        servicosFiltrados = servicosFiltrados.concat(servicos.map(s => ({ ...s, veiculo: v })));
    });
    
    // Aplicar filtros se existirem
    if (filtroData && filtroData.dataInicio && filtroData.dataFinal) {
        const dataInicio = new Date(filtroData.dataInicio);
        const dataFinal = new Date(filtroData.dataFinal);
        servicosFiltrados = servicosFiltrados.filter(s => {
            const dataSer = new Date(s.data);
            return dataSer >= dataInicio && dataSer <= dataFinal;
        });
    }
    
    if (filtroPlaca) {
        servicosFiltrados = servicosFiltrados.filter(s => 
            s.placa.toUpperCase().includes(filtroPlaca.toUpperCase())
        );
    }
    
    if (servicosFiltrados.length === 0) {
        lista.innerHTML = '<div class="alert alert-sm mb-0"><i class="fas fa-search"></i> Nenhum serviço encontrado com os critérios especificados. Tente alterar os filtros.</div>';
        return;
    }
    
    // Agrupar por placa para melhor visualização
    const agrupado = {};
    servicosFiltrados.forEach(s => {
        if (!agrupado[s.placa]) {
            agrupado[s.placa] = [];
        }
        agrupado[s.placa].push(s);
    });
    
    lista.innerHTML = Object.keys(agrupado).map(placa => {
        const veiculo = agrupado[placa][0].veiculo;
        const servicos = agrupado[placa].sort((a, b) => new Date(b.data) - new Date(a.data));
        const totalServicos = servicos.length;
        
        return `
            <div class="card mb-4">
                <div class="card-header" style="background: linear-gradient(135deg, #0d3d91 0%, #0d3d91 100%); color: white;">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong><i class="fas fa-car"></i> ${placa}</strong> - ${veiculo.marca} ${veiculo.modelo}
                        </div>
                        <div>
                            <span class="badge bg-success"><i class="fas fa-check-circle"></i> Disponível</span>
                            <span class="badge bg-secondary ms-2">${totalServicos} Serviço${totalServicos !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr style="background: linear-gradient(135deg, rgba(11, 61, 145, 0.1) 0%, rgba(255, 204, 0, 0.05) 100%);">
                                    <th style="color: var(--prf-azul); font-weight: 700;"><i class="fas fa-calendar"></i> Data</th>
                                    <th style="color: var(--prf-azul); font-weight: 700;"><i class="fas fa-tools"></i> Tipo de Serviço</th>
                                    <th style="color: var(--prf-azul); font-weight: 700;"><i class="fas fa-tachometer-alt"></i> Km</th>
                                    <th style="color: var(--prf-azul); font-weight: 700;"><i class="fas fa-sticky-note"></i> Detalhes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${servicos.map((s, idx) => {
                                    let badgeClass = 'bg-secondary';
                                    let badgeIcon = '📌';
                                    if (s.tipo === 'Troca de Óleo') {
                                        badgeClass = 'bg-warning';
                                        badgeIcon = '🛢️';
                                    } else if (s.tipo === 'Reparo') {
                                        badgeClass = 'bg-danger';
                                        badgeIcon = '🔧';
                                    } else if (s.tipo === 'Manutenção') {
                                        badgeClass = 'bg-info';
                                        badgeIcon = '⚙️';
                                    } else if (s.tipo === 'Inspeção') {
                                        badgeClass = 'bg-primary';
                                        badgeIcon = '🔍';
                                    }
                                    
                                    return `
                                        <tr style="border-left: 4px solid var(--prf-amarelo);">
                                            <td><strong>${s.data}</strong></td>
                                            <td><span class="badge ${badgeClass}">${badgeIcon} ${s.tipo}</span></td>
                                            <td><strong>${s.hodometroNaData}</strong> km</td>
                                            <td><small>${s.descricao || '<em style="color: #999;">Sem observações</em>'}</small></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filtrarHistoricoServicos() {
    const dataInicio = document.getElementById("filtroDataInicio").value;
    const dataFinal = document.getElementById("filtroDataFinal").value;
    const placa = document.getElementById("filtroPlacaHistorico").value.trim();
    
    const filtro = {
        dataInicio: dataInicio,
        dataFinal: dataFinal
    };
    
    renderHistoricoServicos(filtro, placa || null);
}

function devolverMissao(index) {
    if (!confirm("Confirmar devolução da viatura?")) return;
    
    const missao = db.missoes[index];
    const hoje = new Date();
    
    // Parsear data corretamente evitando problemas de timezone
    const [ano, mes, dia] = missao.dataDevolucao.split('-');
    const dataDevolucaoObj = new Date(ano, mes - 1, dia);
    
    // Ajustar para comparação sem horas
    hoje.setHours(0, 0, 0, 0);
    dataDevolucaoObj.setHours(0, 0, 0, 0);
    
    // Calcular dias de atraso
    const diasAtraso = Math.floor((hoje - dataDevolucaoObj) / (1000 * 60 * 60 * 24));
    
    db.missoes[index].ativo = false;
    db.missoes[index].dataDevolutiva = new Date().toISOString().split('T')[0];
    db.veiculos.forEach(v => {
        if (v.placa === db.missoes[index].veiculo.placa) {
            v.status = 'disponivel';
        }
    });
    
    salvarDb();
    renderizar();
    
    // Mostrar mensagem de sucesso com aviso de atraso se aplicável
    if (diasAtraso > 0) {
        alert(`⚠️ Viatura devolvida com sucesso!\n\n🕐 ATENÇÃO: Devolução ATRASADA por ${diasAtraso} dia(s)\nData programada: ${missao.dataDevolucao}\nData de devolução: ${db.missoes[index].dataDevolutiva}`);
    } else {
        alert("✅ Viatura devolvida com sucesso!");
    }
}

function excluirMissao(index) {
    if (!confirm("Tem certeza que deseja excluir esta missão?")) return;
    db.missoes.splice(index, 1);
    salvarDb();
    renderizar();
}

// ================= FUNÇÕES DE ÓLEO =================
function calcularProximaTrocaOleo(veiculo) {
    // Encontrar última troca de óleo
    const ultimaTroca = db.servicosVeiculo
        .filter(s => s.placa === veiculo.placa && s.tipo === 'Troca de Óleo')
        .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
    
    if (!ultimaTroca) {
        return { dias: -1, km: -1, status: 'URGENTE: Nunca foi feita' };
    }
    
    const dataUltima = new Date(ultimaTroca.data);
    const agora = new Date();
    const diasDesdeUltima = Math.floor((agora - dataUltima) / (1000 * 60 * 60 * 24));
    const kmDesdeUltima = (veiculo.hodometro - ultimaTroca.hodometroNaData) || 0;
    
    // Verificar os limites: 1 ano (365 dias) ou 1.000 km
    const diasRestantes = 365 - diasDesdeUltima;
    const kmRestantes = 1000 - kmDesdeUltima;
    
    let status = 'OK';
    let mensagem = '';
    
    if (diasDesdeUltima >= 365 || kmDesdeUltima >= 1000) {
        status = 'VENCIDO';
        mensagem = `TROCA DE ÓLEO VENCIDA!`;
    } else if (diasRestantes <= 30 || kmRestantes <= 1000) {
        status = 'ALERTA';
        mensagem = `Próxima troca em ${Math.min(diasRestantes, 99)} dias ou ${Math.min(kmRestantes, 1000)} km`;
    } else {
        mensagem = `Próxima troca em ${diasRestantes} dias ou ${kmRestantes} km`;
    }
    
    return { dias: diasRestantes, km: kmRestantes, status, mensagem };
}

function getOleoAlertaHTML(veiculo) {
    const info = calcularProximaTrocaOleo(veiculo);
    let cor = '#28a745'; // Verde
    
    if (info.status === 'VENCIDO') {
        cor = '#dc3545'; // Vermelho
    } else if (info.status === 'ALERTA') {
        cor = '#ffc107'; // Amarelo
    }
    
    return `<span style="color: ${cor}; font-weight: bold;"><i class="fas fa-oil-can"></i> ${info.mensagem}</span>`;
}

function alterarStatus(index, novoStatus) {
    if (novoStatus === 'em uso' && db.veiculos[index].status !== 'em uso') {
        if (!confirm("Alterar para 'Em Uso' criará uma missão sem motorista. Use a seção de Despacho para missões normais. Continuar?")) {
            return;
        }
    }
    db.veiculos[index].status = novoStatus;
    salvarDb();
}

function desvincularViatura(index) {
    if (!confirm("Deseja desvincular esta viatura do motorista?")) return;

    db.veiculos[index].status = 'disponivel';
    db.missoes = db.missoes.filter(m => m.veiculo.placa !== db.veiculos[index].placa);
    salvarDb();
}

function excluirVeiculo(index) {
    if (!confirm("Tem certeza que deseja excluir esta viatura?")) return;

    db.veiculos.splice(index, 1);
    salvarDb();
}

function salvarPlacaVeiculo(index) {
    const input = document.getElementById(`placa${index}`);
    if (!input) return;

    const novaPlaca = input.value.toUpperCase().trim();
    if (!novaPlaca) {
        alert("A placa não pode estar vazia!");
        return;
    }

    // Verificar se placa já existe
    if (db.veiculos.some((v, i) => i !== index && v.placa === novaPlaca)) {
        alert("Essa placa já existe!");
        return;
    }

    db.veiculos[index].placa = novaPlaca;
    estadoEdicao.veiculoEmEdicao = null;
    salvarDb();
    renderizar();
    alert("Placa atualizada com sucesso!");
}

function salvarHodometroVeiculo(index) {
    const input = document.getElementById(`hodometro${index}`);
    if (!input) return;

    const novoKm = parseInt(input.value);
    if (isNaN(novoKm) || novoKm < 0) {
        alert("Quilometragem inválida!");
        return;
    }

    db.veiculos[index].hodometro = novoKm;
    estadoEdicao.veiculoEmEdicao = null;
    salvarDb();
    renderizar();
    alert("Quilometragem atualizada com sucesso!");
}

function iniciarEdicaoVeiculo(index) {
    estadoEdicao.veiculoEmEdicao = index;
    // Popular o select de cor com as cores disponíveis
    setTimeout(() => {
        const selectCor = document.getElementById(`cor${index}`);
        if (selectCor) {
            preencherSelect(`cor${index}`, db.cores);
            // Definir o valor atual da cor
            const veiculo = db.veiculos[index];
            if (veiculo && veiculo.cor) {
                selectCor.value = veiculo.cor;
            }
        }
    }, 100); // Pequeno delay para garantir que o elemento foi criado
    filtrarViaturas();
}

function cancelarEdicaoVeiculo(index) {
    estadoEdicao.veiculoEmEdicao = null;
    filtrarViaturas();
}

function salvarCorVeiculo(index) {
    const selectCor = document.getElementById(`cor${index}`);
    if (!selectCor) return;

    const novaCor = selectCor.value.trim();
    if (!novaCor) return alert("Selecione uma cor!");

    db.veiculos[index].cor = novaCor;
    estadoEdicao.veiculoEmEdicao = null;
    salvarDb();
    filtrarViaturas();
    alert("Cor atualizada com sucesso!");
}

// ================= FUNÇÕES DE EDIÇÃO DE MOTORISTAS =================
function iniciarEdicaoMotorista(index) {
    estadoEdicao.motoristaEmEdicao = index;
    renderMotoristas();
}

function cancelarEdicaoMotorista(index) {
    estadoEdicao.motoristaEmEdicao = null;
    renderMotoristas();
}

function editarVeiculo(index) {
    const v = db.veiculos[index];
    if (!v) return;

    const novaPlaca = prompt("Nova placa:", v.placa);
    if (novaPlaca === null) return;

    db.veiculos[index].placa = novaPlaca.toUpperCase().trim();
    salvarDb();
}

function salvarMotorista(index) {
    const nomeInput = document.getElementById(`nomeMotorista${index}`);
    const cargoInput = document.getElementById(`cargoMotorista${index}`);
    const cnhInput = document.getElementById(`cnhMotorista${index}`);
    const telefoneInput = document.getElementById(`telefoneMotorista${index}`);

    if (!nomeInput || !cargoInput || !cnhInput || !telefoneInput) return;

    const novoNome = nomeInput.value.trim();
    const novoCargo = cargoInput.value.trim();
    const novaCnh = cnhInput.value.trim();
    const novoTel = telefoneInput.value.trim();

    if (!novoNome || !novaCnh) {
        alert("Nome e CNH são obrigatórios!");
        return;
    }

    db.motoristas[index] = {
        nome: novoNome,
        cargo: novoCargo || null,
        cnh: novaCnh,
        telefone: novoTel || null
    };

    estadoEdicao.motoristaEmEdicao = null;
    salvarDb();
    renderizar();
    alert("Motorista atualizado com sucesso!");
}

function editarMotorista(index) {
    const m = db.motoristas[index];
    if (!m) return;

    const novoNome = prompt("Novo nome:", m.nome);
    if (novoNome === null) return;

    const novoCargo = prompt("Novo cargo:", m.cargo || "");
    const novaCnh = prompt("Nova CNH:", m.cnh);
    if (novaCnh === null) return;

    const novoTel = prompt("Novo telefone:", m.telefone || "");

    db.motoristas[index] = {
        nome: novoNome.trim(),
        cargo: novoCargo ? novoCargo.trim() : null,
        cnh: novaCnh.trim(),
        telefone: novoTel ? novoTel.trim() : null
    };

    salvarDb();
}

function excluirMotorista(index) {
    if (!confirm("Tem certeza que deseja excluir este motorista?")) return;

    db.motoristas.splice(index, 1);
    salvarDb();
}

function salvarAuxiliar(tipo, index) {
    // Mapear tipo singular para plural
    const tipoPlural = tipo === 'cor' ? 'cores' : tipo + 's';
    const input = document.getElementById(`input${tipo}${index}`);
    if (!input) return;

    const novoValor = input.value.trim();
    if (!novoValor) {
        alert(`${tipo} não pode estar vazio!`);
        return;
    }

    db[tipoPlural][index] = novoValor;
    salvarDb();
    renderAuxiliares();
    alert(`${tipo} atualizado com sucesso!`);
}

function editarAuxiliar(tipo, index) {
    // Mapear tipo singular para plural
    const tipoPlural = tipo === 'cor' ? 'cores' : tipo + 's';
    const item = db[tipoPlural][index];
    if (!item) return;

    const novoValor = prompt(`Novo ${tipo}:`, item);
    if (novoValor === null || !novoValor.trim()) return;

    db[tipoPlural][index] = novoValor.trim();
    salvarDb();
}

function excluirAuxiliar(tipo, index) {
    // Mapear tipo singular para plural
    const tipoPlural = tipo === 'cor' ? 'cores' : tipo + 's';
    if (!confirm(`Tem certeza que deseja excluir este ${tipo}?`)) return;

    db[tipoPlural].splice(index, 1);
    salvarDb();
}

function gerarRelatorioUso() {
    const dataInicioEl = document.getElementById("filtroDataInicioUso");
    const dataFimEl = document.getElementById("filtroDataFimUso");
    const placaEl = document.getElementById("filtroPlacaUso");
    const relatorioDiv = document.getElementById("relatorioUso");

    if (!dataInicioEl || !dataFimEl || !placaEl || !relatorioDiv) return;

    const dataInicio = dataInicioEl.value;
    const dataFim = dataFimEl.value;
    const placaFiltro = placaEl.value.trim().toUpperCase();

    if (!dataInicio || !dataFim) return alert("Informe data inicial e data final!");
    if (new Date(dataInicio) > new Date(dataFim)) return alert("Data inicial não pode ser maior que data final!");

    const missoesFiltradas = db.missoes.filter(missao => {
        // Normalizar dataInicio - pode estar em formato ISO YYYY-MM-DD ou locale string
        let dataMissao = null;

        if (missao.dataInicio && typeof missao.dataInicio === 'string') {
            // Se for ISO (formato YYYY-MM-DD), usar diretamente
            if (missao.dataInicio.match(/^\d{4}-\d{2}-\d{2}$/)) {
                dataMissao = new Date(missao.dataInicio);
            } else {
                // Se for locale string, tentar fazer parse
                dataMissao = new Date(missao.dataInicio);
            }
        } else {
            return false;
        }

        if (isNaN(dataMissao.getTime())) return false;

        const dataFormatada = dataMissao.toISOString().split('T')[0];
        const dentroDoPeríodo = dataFormatada >= dataInicio && dataFormatada <= dataFim;

        if (!dentroDoPeríodo) return false;

        if (placaFiltro) {
            return missao.veiculo && missao.veiculo.placa.toUpperCase() === placaFiltro;
        }

        return true;
    });

    let html = `<h5>Relatório de Uso de ${dataInicio} até ${dataFim}`;
    if (placaFiltro) html += ` (Placa: ${placaFiltro})`;
    html += '</h5>';

    if (missoesFiltradas.length === 0) {
        html += '<p>Nenhuma missão encontrada com os filtros selecionados.</p>';
    } else {
        html += '<table class="table table-striped table-hover"><thead><tr style="background: linear-gradient(135deg, rgba(11, 61, 145, 0.1) 0%, rgba(255, 204, 0, 0.05) 100%);"><th style="color: #0d3d91; font-weight: 700;">Veículo</th><th style="color: #0d3d91; font-weight: 700;">Motorista</th><th style="color: #0d3d91; font-weight: 700;">Data de Pega</th><th style="color: #0d3d91; font-weight: 700;">Data de Devolução</th><th style="color: #0d3d91; font-weight: 700;">Status</th><th style="color: #0d3d91; font-weight: 700;">Observações</th></tr></thead><tbody>';
        
        missoesFiltradas.forEach(missao => {
            // Formatar data de pega
            const dataPegaObj = new Date(missao.dataInicio);
            const dataPega = dataPegaObj.toLocaleDateString('pt-BR');
            const horaPega = dataPegaObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
            
            // Formatar data de devolução (pode ser dataDevolucao ou dataDevolutiva)
            const dataDevObj = missao.dataDevolucao ? new Date(missao.dataDevolucao) : (missao.dataDevolutiva ? new Date(missao.dataDevolutiva) : null);
            const dataDevolucao = dataDevObj ? dataDevObj.toLocaleDateString('pt-BR') : 'Não devolvida';
            const horaDevolucao = dataDevObj ? dataDevObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '';
            
            // Verificar se foi entregue com atraso
            let statusAtraso = '';
            let classeAtraso = '';
            
            if ((missao.dataDevolucao || missao.dataDevolutiva) && missao.dataEntrega) {
                const dataDev = new Date(missao.dataDevolucao || missao.dataDevolutiva);
                const dataEnt = new Date(missao.dataEntrega);
                dataDev.setHours(0, 0, 0, 0);
                dataEnt.setHours(0, 0, 0, 0);
                
                if (dataDev > dataEnt) {
                    statusAtraso = 'Entregue em atraso';
                    classeAtraso = 'style="background-color: #ffe0e0; border-left: 4px solid #dc3545;"';
                } else {
                    statusAtraso = 'Entregue no prazo';
                }
            } else if (!missao.dataDevolucao && !missao.dataDevolutiva) {
                statusAtraso = 'Em uso / Não devolvida';
                classeAtraso = 'style="background-color: #fff3cd; border-left: 4px solid #ffc107;"';
            }
            
            const nomeMotorista = missao.motorista ? missao.motorista.nome : 'Sem motorista';
            const descricaoVeiculo = `${missao.veiculo.placa} (${missao.veiculo.marca} ${missao.veiculo.modelo})`;
            
            html += `<tr ${classeAtraso}><td><strong>${descricaoVeiculo}</strong></td><td>${nomeMotorista}</td><td>${dataPega} ${horaPega}</td><td>${dataDevolucao} ${horaDevolucao}</td><td><span class="badge ${statusAtraso.includes('atraso') ? 'bg-danger' : statusAtraso.includes('não') ? 'bg-warning' : 'bg-success'}">${statusAtraso}</span></td><td>${statusAtraso}</td></tr>`;
        });
        html += '</tbody></table>';
    }

    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// ================= NOVAS FUNÇÕES DE RELATÓRIOS =================

// Relatório de Status dos Veículos
function gerarRelatorioStatusVeiculos() {
    const relatorioDiv = document.getElementById("relatorioStatusVeiculos");
    if (!relatorioDiv) return;

    let html = '<h6>Status Atual dos Veículos</h6>';
    html += '<table class="table table-striped table-sm">';
    html += '<thead><tr><th>Placa</th><th>Modelo</th><th>Status</th><th>Hodômetro</th><th>Próxima Troca de Óleo</th></tr></thead><tbody>';

    db.veiculos.forEach(veiculo => {
        const infoOleo = calcularProximaTrocaOleo(veiculo);
        const statusBadge = getBadgeClass(veiculo.status);
        const statusLabel = getStatusLabel(veiculo.status);

        html += `<tr>
            <td><strong>${veiculo.placa}</strong></td>
            <td>${veiculo.marca} ${veiculo.modelo}</td>
            <td><span class="badge ${statusBadge}">${statusLabel}</span></td>
            <td>${veiculo.hodometro || 0} km</td>
            <td>${infoOleo.mensagem}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Relatório de Próximas Trocas de Óleo
function gerarRelatorioTrocaOleo() {
    const relatorioDiv = document.getElementById("relatorioTrocaOleo");
    if (!relatorioDiv) return;

    let html = '<h6>Próximas Trocas de Óleo</h6>';
    html += '<table class="table table-striped table-sm">';
    html += '<thead><tr><th>Placa</th><th>Modelo</th><th>Status</th><th>Última Troca</th><th>Próxima Troca</th></tr></thead><tbody>';

    db.veiculos.forEach(veiculo => {
        const infoOleo = calcularProximaTrocaOleo(veiculo);

        if (infoOleo.status !== 'URGENTE: Nunca foi feita') {
            const ultimaTroca = db.servicosVeiculo
                .filter(s => s.placa === veiculo.placa && s.tipo === 'Troca de Óleo')
                .sort((a, b) => new Date(b.data) - new Date(a.data))[0];

            const dataUltima = ultimaTroca ? new Date(ultimaTroca.data).toLocaleDateString('pt-BR') : 'Nunca';
            const proximaData = new Date();
            proximaData.setDate(proximaData.getDate() + infoOleo.dias);

            html += `<tr>
                <td><strong>${veiculo.placa}</strong></td>
                <td>${veiculo.marca} ${veiculo.modelo}</td>
                <td><span class="badge ${infoOleo.status === 'VENCIDO' ? 'bg-danger' : infoOleo.status === 'ALERTA' ? 'bg-warning' : 'bg-success'}">${infoOleo.status}</span></td>
                <td>${dataUltima}</td>
                <td>${proximaData.toLocaleDateString('pt-BR')}</td>
            </tr>`;
        }
    });

    html += '</tbody></table>';
    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Relatório de Motoristas
function gerarRelatorioMotoristas() {
    const dataInicioEl = document.getElementById("filtroDataInicioMotorista");
    const dataFimEl = document.getElementById("filtroDataFimMotorista");
    const motoristaEl = document.getElementById("filtroMotorista");
    const relatorioDiv = document.getElementById("relatorioMotoristas");

    if (!dataInicioEl || !dataFimEl || !motoristaEl || !relatorioDiv) return;

    const dataInicio = dataInicioEl.value;
    const dataFim = dataFimEl.value;
    const motoristaFiltro = motoristaEl.value;

    if (!dataInicio || !dataFim) return alert("Informe data inicial e data final!");

    let html = '<h6>Atividades dos Motoristas</h6>';
    html += '<table class="table table-striped table-sm">';
    html += '<thead><tr><th>Motorista</th><th>Veículo</th><th>Data Início</th><th>Data Devolução</th><th>Status</th></tr></thead><tbody>';

    const missoesFiltradas = db.missoes.filter(missao => {
        if (!missao.dataInicio) return false;

        let dataMissao = null;
        if (missao.dataInicio.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dataMissao = new Date(missao.dataInicio);
        } else {
            dataMissao = new Date(missao.dataInicio);
        }

        const dentroPeriodo = dataMissao >= new Date(dataInicio) && dataMissao <= new Date(dataFim);
        const motoristaMatch = !motoristaFiltro || missao.motorista.nome === motoristaFiltro;

        return dentroPeriodo && motoristaMatch;
    });

    missoesFiltradas.forEach(missao => {
        const dataDevolucaoObj = new Date(missao.dataDevolucao);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        dataDevolucaoObj.setHours(0, 0, 0, 0);

        const diasAtraso = Math.floor((hoje - dataDevolucaoObj) / (1000 * 60 * 60 * 24));
        const status = diasAtraso > 0 ? 'Atrasado' : missao.dataDevolutiva ? 'Concluído' : 'Em andamento';

        html += `<tr>
            <td>${missao.motorista.nome}</td>
            <td>${missao.veiculo.placa}</td>
            <td>${new Date(missao.dataInicio).toLocaleDateString('pt-BR')}</td>
            <td>${new Date(missao.dataDevolucao).toLocaleDateString('pt-BR')}</td>
            <td><span class="badge ${status === 'Atrasado' ? 'bg-danger' : status === 'Concluído' ? 'bg-success' : 'bg-warning'}">${status}</span></td>
        </tr>`;
    });

    html += '</tbody></table>';
    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Relatório de Lista de Motoristas
function gerarRelatorioListaMotoristas() {
    const relatorioDiv = document.getElementById("relatorioListaMotoristas");
    if (!relatorioDiv) return;

    let html = '<h6>Lista Completa de Motoristas</h6>';
    html += '<table class="table table-striped table-sm">';
    html += '<thead><tr><th>Nome</th><th>Cargo</th><th>CNH</th><th>Telefone</th><th>Missões Ativas</th></tr></thead><tbody>';

    db.motoristas.forEach(motorista => {
        const missoesAtivas = db.missoes.filter(m => m.motorista.nome === motorista.nome && !m.dataDevolutiva).length;

        html += `<tr>
            <td><strong>${motorista.nome}</strong></td>
            <td>${motorista.cargo || '-'}</td>
            <td>${motorista.cnh}</td>
            <td>${motorista.telefone || '-'}</td>
            <td><span class="badge bg-info">${missoesAtivas}</span></td>
        </tr>`;
    });

    html += '</tbody></table>';
    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Relatório de Serviços
function gerarRelatorioServicos() {
    const dataInicioEl = document.getElementById("filtroDataInicioServicos");
    const dataFimEl = document.getElementById("filtroDataFimServicos");
    const placaEl = document.getElementById("filtroPlacaServicos");
    const tipoEl = document.getElementById("filtroTipoServico");
    const relatorioDiv = document.getElementById("relatorioServicos");

    if (!dataInicioEl || !dataFimEl || !placaEl || !tipoEl || !relatorioDiv) return;

    const dataInicio = dataInicioEl.value;
    const dataFim = dataFimEl.value;
    const placaFiltro = placaEl.value.trim().toUpperCase();
    const tipoFiltro = tipoEl.value;

    if (!dataInicio || !dataFim) return alert("Informe data inicial e data final!");

    let html = '<h6>Histórico de Serviços</h6>';
    html += '<table class="table table-striped table-sm">';
    html += '<thead><tr><th>Data</th><th>Placa</th><th>Tipo</th><th>Descrição</th><th>Hodômetro</th><th>Status</th></tr></thead><tbody>';

    const servicosFiltrados = db.servicosVeiculo.filter(servico => {
        const dataServico = new Date(servico.data);
        const dentroPeriodo = dataServico >= new Date(dataInicio) && dataServico <= new Date(dataFim);
        const placaMatch = !placaFiltro || servico.placa.toUpperCase().includes(placaFiltro);
        const tipoMatch = !tipoFiltro || servico.tipo === tipoFiltro;

        return dentroPeriodo && placaMatch && tipoMatch;
    });

    servicosFiltrados.forEach(servico => {
        const statusBadge = servico.status === 'concluido' ? 'bg-success' : 'bg-warning';

        html += `<tr>
            <td>${new Date(servico.data).toLocaleDateString('pt-BR')}</td>
            <td><strong>${servico.placa}</strong></td>
            <td>${servico.tipo}</td>
            <td>${servico.descricao || '-'}</td>
            <td>${servico.hodometroNaData || 0} km</td>
            <td><span class="badge ${statusBadge}">${servico.status === 'concluido' ? 'Concluído' : 'Pendente'}</span></td>
        </tr>`;
    });

    html += '</tbody></table>';
    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Relatório de Serviços Pendentes
function gerarRelatorioServicosPendentes() {
    const relatorioDiv = document.getElementById("relatorioServicosPendentes");
    if (!relatorioDiv) return;

    let html = '<h6>Serviços Pendentes</h6>';
    html += '<table class="table table-striped table-sm">';
    html += '<thead><tr><th>Placa</th><th>Data</th><th>Tipo</th><th>Descrição</th><th>Dias em Aberto</th></tr></thead><tbody>';

    const servicosPendentes = db.servicosVeiculo.filter(s => s.status === 'pendente');

    servicosPendentes.forEach(servico => {
        const dataServico = new Date(servico.data);
        const hoje = new Date();
        const diasAberto = Math.floor((hoje - dataServico) / (1000 * 60 * 60 * 24));

        html += `<tr>
            <td><strong>${servico.placa}</strong></td>
            <td>${dataServico.toLocaleDateString('pt-BR')}</td>
            <td>${servico.tipo}</td>
            <td>${servico.descricao || '-'}</td>
            <td><span class="badge bg-danger">${diasAberto} dias</span></td>
        </tr>`;
    });

    html += '</tbody></table>';
    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Relatório de Estatísticas Gerais
function gerarRelatorioEstatisticas() {
    const relatorioDiv = document.getElementById("relatorioEstatisticas");
    if (!relatorioDiv) return;

    const totalVeiculos = db.veiculos.length;
    const veiculosDisponiveis = db.veiculos.filter(v => v.status === 'disponivel').length;
    const veiculosEmUso = db.veiculos.filter(v => v.status === 'em uso').length;
    const veiculosManutencao = db.veiculos.filter(v => v.status === 'em manutencao').length;

    const totalMotoristas = db.motoristas.length;
    const missoesAtivas = db.missoes.filter(m => !m.dataDevolutiva).length;
    const missoesConcluidas = db.missoes.filter(m => m.dataDevolutiva).length;

    const servicosTotais = db.servicosVeiculo.length;
    const servicosConcluidos = db.servicosVeiculo.filter(s => s.status === 'concluido').length;
    const servicosPendentes = db.servicosVeiculo.filter(s => s.status === 'pendente').length;

    let html = '<h6>Estatísticas Gerais do Sistema</h6>';
    html += '<div class="row">';

    // Estatísticas de Veículos
    html += '<div class="col-md-4">';
    html += '<div class="card mb-3">';
    html += '<div class="card-header"><h6><i class="fas fa-car"></i> Veículos</h6></div>';
    html += '<div class="card-body">';
    html += `<p><strong>Total:</strong> ${totalVeiculos}</p>`;
    html += `<p><strong>Disponíveis:</strong> <span class="badge bg-success">${veiculosDisponiveis}</span></p>`;
    html += `<p><strong>Em Uso:</strong> <span class="badge bg-warning">${veiculosEmUso}</span></p>`;
    html += `<p><strong>Em Manutenção:</strong> <span class="badge bg-danger">${veiculosManutencao}</span></p>`;
    html += '</div></div></div>';

    // Estatísticas de Motoristas
    html += '<div class="col-md-4">';
    html += '<div class="card mb-3">';
    html += '<div class="card-header"><h6><i class="fas fa-users"></i> Motoristas</h6></div>';
    html += '<div class="card-body">';
    html += `<p><strong>Total:</strong> ${totalMotoristas}</p>`;
    html += `<p><strong>Missões Ativas:</strong> <span class="badge bg-info">${missoesAtivas}</span></p>`;
    html += `<p><strong>Missões Concluídas:</strong> <span class="badge bg-success">${missoesConcluidas}</span></p>`;
    html += '</div></div></div>';

    // Estatísticas de Serviços
    html += '<div class="col-md-4">';
    html += '<div class="card mb-3">';
    html += '<div class="card-header"><h6><i class="fas fa-tools"></i> Serviços</h6></div>';
    html += '<div class="card-body">';
    html += `<p><strong>Total:</strong> ${servicosTotais}</p>`;
    html += `<p><strong>Concluídos:</strong> <span class="badge bg-success">${servicosConcluidos}</span></p>`;
    html += `<p><strong>Pendentes:</strong> <span class="badge bg-warning">${servicosPendentes}</span></p>`;
    html += '</div></div></div>';

    html += '</div>';
    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Função de Exportar Dados
function exportarDados() {
    const exportDiv = document.getElementById("exportStatus");
    if (!exportDiv) return;

    const dadosExport = {
        veiculos: db.veiculos,
        motoristas: db.motoristas,
        missoes: db.missoes,
        servicosVeiculo: db.servicosVeiculo,
        marcas: db.marcas,
        modelos: db.modelos,
        cores: db.cores,
        dataExport: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dadosExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-prf-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    exportDiv.innerHTML = '<div class="alert alert-success">Dados exportados com sucesso!</div>';
    exportDiv.style.display = "block";
}

// Inicializar select de motoristas no relatório
function inicializarRelatorios() {
    const selectMotorista = document.getElementById("filtroMotorista");
    if (selectMotorista) {
        selectMotorista.innerHTML = '<option value="">Todos os motoristas</option>' +
            db.motoristas.map(m => `<option value="${m.nome}">${m.nome}</option>`).join("");
    }
}

document.addEventListener('DOMContentLoaded', function() {
    inicializarApp();
    inicializarRelatorios();
});
