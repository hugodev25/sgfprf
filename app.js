// ================= FIREBASE (Import CDN - veja index.html) =================
// Importando o Firebase (estilo moderno para Web/CDN)
// Nota: As importações reais estão em index.html dentro de <script type="module">
// import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
// import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Configuração do Firebase
// const firebaseConfig = {
//   apiKey: "AIzaSyDDINkRqSPPrawykih6YiSFleT-0UJKLJk",
//   authDomain: "sgf-prf.firebaseapp.com",
//   projectId: "sgf-prf",
//   storageBucket: "sgf-prf.firebasestorage.app",
//   messagingSenderId: "621177378155",
//   appId: "1:621177378155:web:ba5cb5a5a5f5b60119e82e",
//   measurementId: "G-E69301KQYZ"
// };

// Inicializa o Firebase e o Banco de Dados
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// As funções window.db, window.addDoc, window.collection, window.getDocs
// já estão disponibilizadas globalmente via index.html

// ================= CONSTANTES =================
const AUTH_KEYS = {
    usuarios: "prf_usuarios",
    sessao: "prf_sessao",
    ultimaAtividade: "prf_ultima_atividade"
};

// ================= PERMISSÕES =================
function podeEditar() {
    return sessaoAtual && sessaoAtual.cargo === 'admin';
}

const TEMPO_TIMEOUT = 15 * 60 * 1000; // 15 minutos de inatividade
const TEMPO_AVISO = 60 * 1000; // Avisar 1 minuto antes
let timeoutInterval = null;
let ultimoAviso = false;

// ================= BANCO DE DADOS =================
var db = {
    usuarios: [],
    marcas: [],
    modelos: [],
    cores: [],
    motoristas: [],
    veiculos: [],
    missoes: [],
    servicos: [],
    lotacoes: [],
    servicosVeiculo: [],
    atividades: []
};

// ================= ESTADOS DE EDIÇÃO =================
let estadoEdicao = {
    veiculoEmEdicao: null,  // índice do veículo em edição
    motoristaEmEdicao: null // índice do motorista em edição
};

// ================= MENU MOBILE =================
function toggleMenuMobile() {
    console.log("🍔 Clicou no hambúrguer");
    
    const sidebar = document.querySelector('nav.sidebar');
    const overlay = document.getElementById('mobileOverlay');
    const btnHamburguer = document.getElementById('btnHamburguer');
    
    if (!sidebar || !overlay || !btnHamburguer) {
        console.error("❌ Elementos não encontrados:", {
            sidebar: !!sidebar,
            overlay: !!overlay,
            btnHamburguer: !!btnHamburguer
        });
        return;
    }
    
    console.log("📱 Estado antes:", {
        menuAbierto: sidebar.classList.contains('mobile-open')
    });
    
    const isOpen = sidebar.classList.contains('mobile-open');
    
    if (isOpen) {
        // Fechar menu
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('visible');
        btnHamburguer.innerHTML = '<i class="fas fa-bars"></i>';
        console.log("✅ Menu fechado");
    } else {
        // Abrir menu
        sidebar.classList.add('mobile-open');
        overlay.classList.add('visible');
        btnHamburguer.innerHTML = '<i class="fas fa-times"></i>';
        console.log("✅ Menu aberto");
    }
}

function fecharMenuMobile() {
    console.log("📱 Fechando menu (clicou no overlay)");
    
    const sidebar = document.querySelector('nav.sidebar');
    const overlay = document.getElementById('mobileOverlay');
    const btnHamburguer = document.getElementById('btnHamburguer');
    
    if (sidebar && overlay && btnHamburguer) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('visible');
        btnHamburguer.innerHTML = '<i class="fas fa-bars"></i>';
    }
}

// Fechar menu ao clicar em um item de navegação
document.addEventListener('DOMContentLoaded', function() {
    console.log("🔄 Inicializando listeners do menu mobile");
    
    const navItems = document.querySelectorAll('nav.sidebar .nav-item');
    console.log(`Encontrados ${navItems.length} itens de navegação`);
    
    navItems.forEach((item, idx) => {
        item.addEventListener('click', function() {
            console.log(`Clicou no item ${idx}`);
            
            const sidebar = document.querySelector('nav.sidebar');
            const overlay = document.getElementById('mobileOverlay');
            const btnHamburguer = document.getElementById('btnHamburguer');
            
            if (window.innerWidth <= 768 && sidebar && overlay && btnHamburguer) {
                console.log("📱 Fechando menu em mobile");
                sidebar.classList.remove('mobile-open');
                overlay.classList.remove('visible');
                btnHamburguer.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });
    
    console.log("✅ Menu mobile inicializado");
});

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
let sessaoAtual = JSON.parse(localStorage.getItem(AUTH_KEYS.sessao)) || null;

// ================= RESETAR USUÁRIOS =================
function resetarUsuarios() {
    if (!confirm("Deseja resetar os usuários para os padrões?\n\nIsto restaurará:\n- admin / 123456\n- operador / 123456\n- teste / 123456")) return;
    
    criarUsuariosPadrao();
    salvarDb();
    alert("Usuários restaurados com sucesso!\n\nCredenciais disponíveis:\n- usuario: admin | senha: 123456\n- usuario: operador | senha: 123456\n- usuario: teste | senha: 123456");
}
function criarUsuariosPadrao() {
    db.usuarios = [
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
            cargo: "visualizador",
            ativo: true,
            dataCadastro: new Date().toISOString()
        }
    ];
}

function inicializarUsuarios() {
    if (!Array.isArray(db.usuarios) || db.usuarios.length === 0) {
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
    
    const usuarioAtual = db.usuarios.find(u => u.id === sessaoAtual.id);
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

// ================= SISTEMA DE LOG DE ATIVIDADES =================

function registrarAtividade(acao, detalhes = '', entidade = '', entidadeId = '') {
    if (!sessaoAtual) return;

    const atividade = {
        id: Date.now() + Math.random(),
        usuario: sessaoAtual.usuario,
        nomeUsuario: sessaoAtual.nome,
        cargo: sessaoAtual.cargo,
        acao: acao,
        detalhes: detalhes,
        entidade: entidade,
        entidadeId: entidadeId,
        dataHora: new Date().toISOString(),
        timestamp: Date.now()
    };

    db.atividades.push(atividade);

    // Manter apenas as últimas 1000 atividades para não sobrecarregar
    if (db.atividades.length > 1000) {
        db.atividades = db.atividades.slice(-1000);
    }

    salvar();
}

// ================= FUNÇÕES DE ATIVIDADES =================

function carregarAtividades() {
    const filtroData = document.getElementById("filtroDataAtividades").value;
    const filtroUsuario = document.getElementById("filtroUsuarioAtividades").value;
    const listaAtividades = document.getElementById("listaAtividades");

    if (!listaAtividades) return;

    let atividadesFiltradas = [...db.atividades];

    // Filtrar por data
    if (filtroData) {
        const dataFiltro = new Date(filtroData);
        const dataFiltroStr = dataFiltro.toISOString().split('T')[0];
        atividadesFiltradas = atividadesFiltradas.filter(atividade => {
            const dataAtividade = new Date(atividade.dataHora).toISOString().split('T')[0];
            return dataAtividade === dataFiltroStr;
        });
    }

    // Filtrar por usuário
    if (filtroUsuario) {
        atividadesFiltradas = atividadesFiltradas.filter(atividade => atividade.usuario === filtroUsuario);
    }

    // Ordenar por data (mais recentes primeiro)
    atividadesFiltradas.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

    if (atividadesFiltradas.length === 0) {
        listaAtividades.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle"></i> Nenhuma atividade encontrada com os filtros selecionados.</div>';
        return;
    }

    let html = '<div class="table-responsive"><table class="table table-striped table-sm"><thead><tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Detalhes</th></tr></thead><tbody>';

    atividadesFiltradas.forEach(atividade => {
        const dataHora = new Date(atividade.dataHora);
        const dataHoraFormatada = `${dataHora.toLocaleDateString('pt-BR')} ${dataHora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;

        let badgeClass = 'bg-secondary';
        if (atividade.acao.includes('Criado') || atividade.acao.includes('Cadastrado')) badgeClass = 'bg-success';
        else if (atividade.acao.includes('Editado') || atividade.acao.includes('Alterado')) badgeClass = 'bg-warning';
        else if (atividade.acao.includes('Excluído') || atividade.acao.includes('Removido')) badgeClass = 'bg-danger';
        else if (atividade.acao.includes('Login') || atividade.acao.includes('Logout')) badgeClass = 'bg-info';

        html += `<tr>
            <td>${dataHoraFormatada}</td>
            <td><strong>${atividade.nomeUsuario}</strong><br><small class="text-muted">${atividade.cargo}</small></td>
            <td><span class="badge ${badgeClass}">${atividade.acao}</span></td>
            <td>${atividade.detalhes || '-'}</td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    listaAtividades.innerHTML = html;
}

function filtrarAtividadesPorData() {
    carregarAtividades();
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
        if (!Array.isArray(db.usuarios) || db.usuarios.length === 0) {
            errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> Dados de usuários não carregados do banco. Verifique o console.";
            errorDiv.classList.add("show");
            btnLogin.disabled = false;
            return;
        }

        const usuarioEncontrado = db.usuarios.find(
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

            // Registrar atividade de login
            setTimeout(() => {
                registrarAtividade('Login', `Usuário fez login no sistema`, 'sistema', 'login');
            }, 1000);

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

    // Registrar atividade de logout antes de limpar a sessão
    if (sessaoAtual) {
        registrarAtividade('Logout', `Usuário fez logout do sistema`, 'sistema', 'logout');
    }

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

    // Mostrar/esconder seção de administrador baseada nas permissões
    const adminSection = document.getElementById("adminSection");
    if (adminSection) {
        adminSection.style.display = podeEditar() ? "block" : "none";
    }

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

// ================= MODAL DATA/HORA DEVOLUÇÃO =================
let callbackDataHora = null;

function obterDataHoraDevolucao(dataAtual = null, callback) {
    callbackDataHora = callback;
    const modal = document.getElementById("modalDataHoraDevolucao");
    const dataInput = document.getElementById("dataDevolucao");
    const horaInput = document.getElementById("horaDevolucao");
    
    if (dataAtual) {
        const dataStr = dataAtual.split('T')[0];
        const horaStr = dataAtual.split('T')[1] ? dataAtual.split('T')[1].substring(0,5) : '';
        dataInput.value = dataStr;
        horaInput.value = horaStr;
    } else {
        // Set current date/time
        const now = new Date();
        dataInput.value = now.toISOString().split('T')[0];
        horaInput.value = now.toTimeString().substring(0,5);
    }
    
    modal.classList.add("active");
}

function confirmarDataHoraDevolucao(event) {
    event.preventDefault();
    const data = document.getElementById("dataDevolucao").value;
    const hora = document.getElementById("horaDevolucao").value;
    
    if (!data || !hora) {
        document.getElementById("errorDataHoraMessage").textContent = "Preencha data e hora.";
        return;
    }
    
    const dataObj = new Date(`${data}T${hora}:00`);
    const iso = dataObj.toISOString();
    
    fecharModalDataHoraDevolucao();
    
    if (callbackDataHora) {
        callbackDataHora(iso);
        callbackDataHora = null;
    }
}

function fecharModalDataHoraDevolucao() {
    document.getElementById("modalDataHoraDevolucao").classList.remove("active");
    document.getElementById("errorDataHoraMessage").textContent = "";
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

    if (db.usuarios.some(u => u.usuario === usuario)) {
        errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> Este usuário já existe!";
        errorDiv.classList.add("show");
        return;
    }

    if (db.usuarios.some(u => u.email === email)) {
        errorDiv.innerHTML = "<i class='fas fa-exclamation-circle'></i> Este email já está cadastrado!";
        errorDiv.classList.add("show");
        return;
    }

    // Criar novo usuário
    const novoUsuario = {
        id: Math.max(...db.usuarios.map(u => u.id), 0) + 1,
        nome: nome,
        usuario: usuario,
        senha: criptografarSenha(senha),
        email: email,
        cargo: cargo,
        ativo: true,
        dataCadastro: new Date().toISOString()
    };

    db.usuarios.push(novoUsuario);
    salvarDb();

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
    const usuarioEncontrado = db.usuarios.find(
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
    const usuarioRecuperacao = db.usuarios.find(u => u.email === emailRecuperacao);
    if (usuarioRecuperacao) {
        usuarioRecuperacao.senha = criptografarSenha(novaSenha);
        salvarDb();

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
        renderAgendamentos();
        renderMissoes();
    } else if (pagina === 'servicos') {
        renderServicosManuencaoAtivos();
    } else if (pagina === 'relatorios') {
        atualizarDashboard();
    } else if (pagina === 'atividades') {
        carregarAtividades();
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

async function inicializarApp() {
    // Aguardar o Firebase estar pronto
    await esperarFirebase();
    
    await carregarDadosFirestore();
    inicializarUsuarios();
    
    // Diagnóstico automático
    console.log("🔄 Inicializando aplicação...");
    diagnosticarBancoDados();
    
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

// ================= ESPERAR FIREBASE =================
async function esperarFirebase(maxTentativas = 50) {
    let tentativas = 0;
    while (typeof window.db === 'undefined' && tentativas < maxTentativas) {
        console.log(`Aguardando Firestore inicializar... (tentativa ${tentativas + 1}/${maxTentativas})`);
        await new Promise(resolve => setTimeout(resolve, 100));
        tentativas++;
    }
    
    if (typeof window.db === 'undefined') {
        console.error("❌ Firestore não foi inicializado a tempo!");
        alert("❌ ERRO: Firestore não conseguiu inicializar. Por favor, recarregue a página.");
        throw new Error("Firestore não inicializado");
    }
    
    console.log("✅ Firestore pronto!");
}

// ================= VERIFICAÇÃO DE LOCALSTORAGE =================
function verificarLocalStorageDisponivel() {
    try {
        const teste = '__test__';
        localStorage.setItem(teste, teste);
        localStorage.removeItem(teste);
        return true;
    } catch (e) {
        return false;
    }
}

function calcularDiasAtraso(dataDevolucao, dataDevolutiva = null) {
    if (!dataDevolucao) return 0;

    // Se a missão já foi devolvida, calcular atraso baseado na data real de devolução
    const dataComparacao = dataDevolutiva || new Date().toISOString().split('T')[0];

    const partes = dataDevolucao.split('-');
    if (partes.length !== 3) return 0;

    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);

    const dataDevolucaoObj = new Date(ano, mes, dia);
    dataDevolucaoObj.setHours(0, 0, 0, 0);

    const partesComparacao = dataComparacao.split('T')[0].split('-');
    const dataComparacaoObj = new Date(
        parseInt(partesComparacao[0], 10),
        parseInt(partesComparacao[1], 10) - 1,
        parseInt(partesComparacao[2], 10)
    );
    dataComparacaoObj.setHours(0, 0, 0, 0);

    const diferenca = Math.floor((dataComparacaoObj - dataDevolucaoObj) / (1000 * 60 * 60 * 24));
    return diferenca > 0 ? diferenca : 0;
}

function calcularDiasAntecipacao(dataDevolucao, dataDevolutiva) {
    if (!dataDevolucao || !dataDevolutiva) return 0;

    const partesDevolucao = dataDevolucao.split('-');
    const partesDevolutiva = dataDevolutiva.split('T')[0].split('-');

    if (partesDevolucao.length !== 3 || partesDevolutiva.length !== 3) return 0;

    const dataDevolucaoObj = new Date(
        parseInt(partesDevolucao[0], 10),
        parseInt(partesDevolucao[1], 10) - 1,
        parseInt(partesDevolucao[2], 10)
    );
    dataDevolucaoObj.setHours(0, 0, 0, 0);

    const dataDevolutivaObj = new Date(
        parseInt(partesDevolutiva[0], 10),
        parseInt(partesDevolutiva[1], 10) - 1,
        parseInt(partesDevolutiva[2], 10)
    );
    dataDevolutivaObj.setHours(0, 0, 0, 0);

    const diferenca = Math.floor((dataDevolucaoObj - dataDevolutivaObj) / (1000 * 60 * 60 * 24));
    return diferenca > 0 ? diferenca : 0;
}

function parseDataISO(dataStr) {
    if (!dataStr) return null;
    const partes = dataStr.split('-');
    if (partes.length !== 3) return null;

    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);
    const data = new Date(ano, mes, dia);
    data.setHours(0, 0, 0, 0);
    return data;
}

function formatarData(dataStr) {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function periodoSobreposto(inicioA, fimA, inicioB, fimB) {
    if (!inicioA || !fimA || !inicioB || !fimB) return false;
    return inicioA <= fimB && inicioB <= fimA;
}

function veiculoDisponivelNoPeriodo(placa, dataEntregaStr, dataDevolucaoStr) {
    const dataEntrega = parseDataISO(dataEntregaStr);
    const dataDevolucao = parseDataISO(dataDevolucaoStr);
    if (!dataEntrega || !dataDevolucao || dataEntrega > dataDevolucao) return false;

    return !db.missoes.some(missao => {
        if (missao.ativo === false || missao.dataDevolutiva || missao.agendada) return false;
        if (!missao.veiculo || missao.veiculo.placa !== placa) return false;

        const inicioExistente = parseDataISO(missao.dataEntrega);
        const fimExistente = parseDataISO(missao.dataDevolucao);
        if (!inicioExistente || !fimExistente) return false;

        return periodoSobreposto(inicioExistente, fimExistente, dataEntrega, dataDevolucao);
    });
}

function getStatusMissao(missao) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataEntrega = parseDataISO(missao.dataEntrega);
    const dataDevolucao = parseDataISO(missao.dataDevolucao);
    const dataDevolutiva = parseDataISO(missao.dataDevolutiva);

    if (dataDevolutiva) {
        // Verificar se foi entregue antecipadamente
        if (dataDevolucao && dataDevolutiva < dataDevolucao) {
            const diasAntecipacao = calcularDiasAntecipacao(missao.dataDevolucao, missao.dataDevolutiva);
            return {
                status: 'Entregue antecipada',
                label: `ENTREGUE ANTECIPADA por ${diasAntecipacao} dia(s)`,
                badgeClass: 'bg-primary',
                color: '#007bff',
                diasAtraso: -diasAntecipacao // negativo para indicar antecipação
            };
        } else {
            return {
                status: 'Concluído',
                label: 'Concluído',
                badgeClass: 'bg-success',
                color: '#28a745',
                diasAtraso: calcularDiasAtraso(missao.dataDevolucao, missao.dataDevolutiva)
            };
        }
    }

    if (dataEntrega && hoje < dataEntrega) {
        return {
            status: 'Agendada',
            label: 'Agendada',
            badgeClass: 'bg-info',
            color: '#0b3d91',
            diasAtraso: 0
        };
    }

    if (dataDevolucao) {
        const diasAtraso = calcularDiasAtraso(missao.dataDevolucao, missao.dataDevolutiva);
        if (diasAtraso > 0) {
            return {
                status: 'Atrasado',
                label: `ATRASADO por ${diasAtraso} dia(s)`,
                badgeClass: 'bg-danger',
                color: '#dc3545',
                diasAtraso
            };
        }
    }

    return {
        status: 'Em Uso',
        label: 'Em Uso',
        badgeClass: 'bg-warning',
        color: '#ffc107',
        diasAtraso: 0
    };
}

function atualizarStatusMissoesAgendadas() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    db.missoes.forEach(missao => {
        if (missao.ativo === false || missao.dataDevolutiva) return;
        const dataEntrega = parseDataISO(missao.dataEntrega);
        if (!dataEntrega) return;

        if (hoje >= dataEntrega) {
            const veiculo = db.veiculos.find(v => v.placa === missao.veiculo.placa);
            if (veiculo && veiculo.status === 'disponivel') {
                veiculo.status = 'em uso';
            }
        }
    });
}

if (!verificarLocalStorageDisponivel()) {
    console.error("❌ ERRO CRÍTICO: localStorage não está disponível!");
    console.error("Isso pode ocorrer se:");
    console.error("- O navegador está em modo privado/incógnito");
    console.error("- O localStorage foi desabilitado nas configurações");
    console.error("- O arquivo está sendo aberto localmente (file://) sem servidor");
    alert("❌ ERRO: localStorage não está disponível.\n\nVerifique se:\n- Você não está em modo privado\n- O armazenamento está habilitado\n- O site está sendo acessado via HTTP/HTTPS (não file://)");
}

// ================= BANCO DE DADOS =================
// ATENÇÃO: o sistema armazena os dados principais no Firestore.
// O localStorage é usado apenas para sessão e preferências de navegador.
const DB_KEYS = {
    usuarios: "prf_usuarios",
    marcas: "prf_marcas",
    modelos: "prf_modelos",
    cores: "prf_cores",
    motoristas: "prf_motoristas",
    veiculos: "prf_veiculos",
    missoes: "prf_missoes",
    lotacoes: "prf_lotacoes",
    servicos: "prf_servicos",
    servicosVeiculo: "prf_servicos_veiculo"
};

const FIRESTORE_STATE_COLLECTION = "appState";
const FIRESTORE_STATE_DOC = "default";

// Função para carregar dados de forma segura do localStorage
function carregarDadosLocalstorage() {
    const dados = {};
    
    Object.keys(DB_KEYS).forEach(key => {
        try {
            const valor = localStorage.getItem(DB_KEYS[key]);
            dados[key] = valor ? JSON.parse(valor) : [];
            
            // Validar se é um array
            if (!Array.isArray(dados[key])) {
                console.warn(`⚠️ ${DB_KEYS[key]} não é um array. Resetando...`);
                dados[key] = [];
            }
        } catch (error) {
            console.error(`❌ Erro ao carregar ${DB_KEYS[key]}:`, error);
            dados[key] = [];
        }
    });
    
    return dados;
}

async function carregarDadosFirestore() {
    if (typeof window.db === 'undefined') {
        console.warn("⚠️ Firestore ainda não foi inicializado. Usando localStorage como fallback.");
        Object.assign(db, carregarDadosLocalstorage());
        return;
    }

    try {
        const stateRef = doc(window.db, FIRESTORE_STATE_COLLECTION, FIRESTORE_STATE_DOC);
        const snapshot = await getDoc(stateRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            db.usuarios = Array.isArray(data.usuarios) ? data.usuarios : [];
            db.marcas = Array.isArray(data.marcas) ? data.marcas : [];
            db.modelos = Array.isArray(data.modelos) ? data.modelos : [];
            db.cores = Array.isArray(data.cores) ? data.cores : [];
            db.motoristas = Array.isArray(data.motoristas) ? data.motoristas : [];
            db.veiculos = Array.isArray(data.veiculos) ? data.veiculos : [];
            db.missoes = Array.isArray(data.missoes) ? data.missoes : [];
            db.servicos = Array.isArray(data.servicos) ? data.servicos : [];
            db.servicosVeiculo = Array.isArray(data.servicosVeiculo) ? data.servicosVeiculo : [];
            db.lotacoes = Array.isArray(data.lotacoes) ? data.lotacoes : [];

            console.log("✅ Dados carregados do Firestore");
            
            // Garantir que existem usuários
            if (!Array.isArray(db.usuarios) || db.usuarios.length === 0) {
                console.log("⚠️ Nenhum usuário encontrado. Criando usuários padrão...");
                criarUsuariosPadrao();
                await salvarFirestore();
            }
        } else {
            console.log("ℹ️ Documento do Firestore não existe. Criando base de dados no Firestore.");
            criarUsuariosPadrao();
            await salvarFirestore();
        }
    } catch (error) {
        console.error("❌ Erro ao carregar dados do Firestore:", error);
        console.warn("⚠️ Usando localStorage como fallback.");
        Object.assign(db, carregarDadosLocalstorage());
        
        // Garantir que existem usuários no fallback também
        if (!Array.isArray(db.usuarios) || db.usuarios.length === 0) {
            criarUsuariosPadrao();
        }
    }
}

async function salvarFirestore() {
    if (typeof window.db === 'undefined') {
        console.warn("Firestore ainda não foi inicializado.");
        return false;
    }

    try {
        const stateRef = doc(window.db, FIRESTORE_STATE_COLLECTION, FIRESTORE_STATE_DOC);
        await setDoc(stateRef, {
            usuarios: db.usuarios,
            marcas: db.marcas,
            modelos: db.modelos,
            cores: db.cores,
            motoristas: db.motoristas,
            veiculos: db.veiculos,
            missoes: db.missoes,
            servicos: db.servicos,
            lotacoes: db.lotacoes,
            servicosVeiculo: db.servicosVeiculo
        }, { merge: true });

        console.log("✅ Dados salvos com sucesso no Firestore");
        return true;
    } catch (error) {
        console.error("❌ Erro ao salvar dados no Firestore:", error);
        alert("⚠️ Erro ao salvar dados no Firestore! Verifique o console.");
        return false;
    }
}

function salvarDb() {
    salvarFirestore().then(success => {
        if (success) {
            renderizar();
        }
    });
}

// Função de diagnóstico
function diagnosticarBancoDados() {
    console.log("=== DIAGNÓSTICO DO BANCO DE DADOS ===");
    console.log("localStorage disponível:", typeof localStorage !== 'undefined');
    console.log("Tamanho do localStorage:", Object.keys(localStorage).length, "itens");
    
    Object.keys(DB_KEYS).forEach(key => {
        const chave = DB_KEYS[key];
        const valor = localStorage.getItem(chave);
        console.log(`${chave}:`, valor ? `${valor.length} caracteres` : 'VAZIO');
    });
    
    console.log("Dados carregados em memoria:", db);
    console.log("======================================");
}

// ================= RELATÓRIO COMPLETO DO SISTEMA =================

function gerarRelatorioCompletoSistema() {
    if (typeof window.db === 'undefined') {
        alert("Sistema ainda inicializando. Aguarde alguns segundos e tente novamente.");
        return;
    }

    // Criar container temporário para o relatório
    const tempDiv = document.createElement('div');
    tempDiv.id = 'relatorioCompletoSistema';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    let html = `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center; color: #002244; border-bottom: 2px solid #ffcc00; padding-bottom: 10px;">
            <i class="fas fa-file-alt"></i> RELATÓRIO COMPLETO DO SISTEMA SGF-PRF
        </h1>
        <p style="text-align: center; font-size: 14px; color: #666;">
            Gerado em: ${new Date().toLocaleString('pt-BR')}
        </p>`;

    // 1. ESTATÍSTICAS GERAIS
    html += `<h2 style="color: #002244; margin-top: 30px; border-left: 4px solid #ffcc00; padding-left: 10px;">
        <i class="fas fa-chart-bar"></i> ESTATÍSTICAS GERAIS
    </h2>`;

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

    html += `<div style="display: flex; gap: 20px; margin: 20px 0;">
        <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f8f9fa;">
            <h4 style="color: #002244; margin: 0 0 10px 0;"><i class="fas fa-car"></i> Veículos (${totalVeiculos})</h4>
            <p><strong>Disponíveis:</strong> <span style="color: #28a745;">${veiculosDisponiveis}</span></p>
            <p><strong>Em Uso:</strong> <span style="color: #ffc107;">${veiculosEmUso}</span></p>
            <p><strong>Em Manutenção:</strong> <span style="color: #dc3545;">${veiculosManutencao}</span></p>
        </div>
        <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f8f9fa;">
            <h4 style="color: #002244; margin: 0 0 10px 0;"><i class="fas fa-users"></i> Motoristas (${totalMotoristas})</h4>
            <p><strong>Missões Ativas:</strong> <span style="color: #17a2b8;">${missoesAtivas}</span></p>
            <p><strong>Missões Concluídas:</strong> <span style="color: #28a745;">${missoesConcluidas}</span></p>
        </div>
        <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f8f9fa;">
            <h4 style="color: #002244; margin: 0 0 10px 0;"><i class="fas fa-tools"></i> Serviços (${servicosTotais})</h4>
            <p><strong>Concluídos:</strong> <span style="color: #28a745;">${servicosConcluidos}</span></p>
            <p><strong>Pendentes:</strong> <span style="color: #ffc107;">${servicosPendentes}</span></p>
        </div>
    </div>`;

    // 2. LISTA DE VEÍCULOS
    html += `<h2 style="color: #002244; margin-top: 30px; border-left: 4px solid #ffcc00; padding-left: 10px;">
        <i class="fas fa-car"></i> VEÍCULOS CADASTRADOS
    </h2>`;

    html += `<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
        <thead>
            <tr style="background: #002244; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Placa</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Modelo</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Status</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Hodômetro</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Próxima Troca Óleo</th>
            </tr>
        </thead>
        <tbody>`;

    db.veiculos.forEach(veiculo => {
        const infoOleo = calcularProximaTrocaOleo(veiculo);
        const statusBadge = getBadgeClass(veiculo.status);
        const statusLabel = getStatusLabel(veiculo.status);

        html += `<tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${veiculo.placa}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${veiculo.marca} ${veiculo.modelo}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${statusLabel}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${veiculo.hodometro || 0} km</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${infoOleo.mensagem}</td>
        </tr>`;
    });

    html += `</tbody></table>`;

    // 3. LISTA DE MOTORISTAS
    html += `<h2 style="color: #002244; margin-top: 30px; border-left: 4px solid #ffcc00; padding-left: 10px;">
        <i class="fas fa-users"></i> MOTORISTAS CADASTRADOS
    </h2>`;

    html += `<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
        <thead>
            <tr style="background: #002244; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nome</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Cargo</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Matrícula</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Telefone</th>
            </tr>
        </thead>
        <tbody>`;

    db.motoristas.forEach(motorista => {
        html += `<tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${motorista.nome}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${motorista.cargo || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${motorista.matricula}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${motorista.telefone || '-'}</td>
        </tr>`;
    });

    html += `</tbody></table>`;

    // 4. MISSÕES ATIVAS
    html += `<h2 style="color: #002244; margin-top: 30px; border-left: 4px solid #ffcc00; padding-left: 10px;">
        <i class="fas fa-route"></i> MISSÕES ATIVAS
    </h2>`;

    const missoesAtivasLista = db.missoes.filter(m => !m.dataDevolutiva);
    if (missoesAtivasLista.length === 0) {
        html += `<p style="font-style: italic; color: #666;">Nenhuma missão ativa no momento.</p>`;
    } else {
        html += `<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
            <thead>
                <tr style="background: #002244; color: white;">
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Veículo</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Motorista</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Data Saída</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Status</th>
                </tr>
            </thead>
            <tbody>`;

        missoesAtivasLista.forEach(missao => {
            const statusInfo = getStatusMissao(missao);
            html += `<tr>
                <td style="border: 1px solid #ddd; padding: 8px;"><strong>${missao.veiculo.placa}</strong></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${missao.motorista ? missao.motorista.nome : 'Sem motorista'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${formatarData(missao.dataInicio)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${statusInfo.label}</td>
            </tr>`;
        });

        html += `</tbody></table>`;
    }

    // 5. SERVIÇOS PENDENTES
    html += `<h2 style="color: #002244; margin-top: 30px; border-left: 4px solid #ffcc00; padding-left: 10px;">
        <i class="fas fa-tools"></i> SERVIÇOS PENDENTES
    </h2>`;

    const servicosPendentesLista = db.servicosVeiculo.filter(s => s.status === 'pendente');
    if (servicosPendentesLista.length === 0) {
        html += `<p style="font-style: italic; color: #666;">Nenhum serviço pendente.</p>`;
    } else {
        html += `<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
            <thead>
                <tr style="background: #002244; color: white;">
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Placa</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tipo</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descrição</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Data</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Dias em Aberto</th>
                </tr>
            </thead>
            <tbody>`;

        servicosPendentesLista.forEach(servico => {
            const dataServico = new Date(servico.data);
            const hoje = new Date();
            const diasAberto = Math.floor((hoje - dataServico) / (1000 * 60 * 60 * 24));

            html += `<tr>
                <td style="border: 1px solid #ddd; padding: 8px;"><strong>${servico.placa}</strong></td>
                <td style="border: 1px solid #ddd; padding: 8px;">${servico.tipo}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${servico.descricao || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${dataServico.toLocaleDateString('pt-BR')}</td>
                <td style="border: 1px solid #ddd; padding: 8px; color: #dc3545;"><strong>${diasAberto} dias</strong></td>
            </tr>`;
        });

        html += `</tbody></table>`;
    }

    html += `<div style="margin-top: 50px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
        <p>Sistema de Gestão de Frotas - PRF | Relatório gerado automaticamente</p>
        <p>Data e hora: ${new Date().toLocaleString('pt-BR')}</p>
    </div>`;

    html += `</div>`;

    tempDiv.innerHTML = html;

    // Configurações do PDF
    const opt = {
        margin: 0.5,
        filename: `relatorio-completo-sistema-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // Gerar PDF
    html2pdf().set(opt).from(tempDiv).save().then(() => {
        console.log('PDF completo do sistema gerado com sucesso!');
        // Remover o container temporário
        document.body.removeChild(tempDiv);
    }).catch(err => {
        console.error('Erro ao gerar PDF completo:', err);
        alert('Erro ao gerar PDF completo do sistema. Tente novamente.');
        document.body.removeChild(tempDiv);
    });
}

// Função para forçar salvamento
function forcarSalvarDados() {
    console.log("🔄 Forçando salvamento de dados...");

    if (salvar()) {
        // Registrar atividade de backup
        registrarAtividade('Backup', 'Forçou salvamento de todos os dados do sistema', 'sistema', 'backup');

        const msg = document.getElementById("mensagemDiagnostico");
        msg.innerHTML = '<div class="alert alert-success" style="margin-bottom: 0;"><i class="fas fa-check-circle"></i> ✅ Todos os dados foram salvos com sucesso!</div>';
        msg.style.display = "block";

        // Gerar PDF com todas as informações do sistema
        setTimeout(() => {
            gerarRelatorioCompletoSistema();
            msg.style.display = "none";
        }, 1000);
    } else {
        const msg = document.getElementById("mensagemDiagnostico");
        msg.innerHTML = '<div class="alert alert-danger" style="margin-bottom: 0;"><i class="fas fa-exclamation-circle"></i> ❌ Erro ao salvar dados. Verifique o console (F12).</div>';
        msg.style.display = "block";
    }
}

// Função para verificar e reparar dados
function verificarERepararDados() {
    console.log("🔍 Verificando integridade dos dados...");
    
    let problemas = [];
    let reparos = 0;
    
    // Verificar cada tipo de dado
    Object.keys(db).forEach(key => {
        if (!Array.isArray(db[key])) {
            problemas.push(`${key} não é um array`);
            db[key] = [];
            reparos++;
        }
    });
    
    // Verificar viaturas duplicadas por placa
    const placasVistas = new Set();
    db.veiculos.forEach((v, idx) => {
        if (placasVistas.has(v.placa)) {
            problemas.push(`Viatura duplicada: placa ${v.placa}`);
        } else {
            placasVistas.add(v.placa);
        }
    });
    
    // Verificar motoristas
    db.motoristas.forEach((m, idx) => {
        if (!m.nome || !m.matricula) {
            problemas.push(`Motorista ${idx} sem dados obrigatórios`);
        }
    });
    
    if (reparos > 0) {
        salvar();
        console.log(`✅ ${reparos} problemas foram reparados`);
    }
    
    const msg = document.getElementById("mensagemDiagnostico");
    let html = '<div class="alert alert-info" style="margin-bottom: 0;">';
    
    if (problemas.length === 0) {
        html += '<i class="fas fa-check-circle"></i> ✅ <strong>Dados íntegros!</strong> Nenhum problema encontrado.';
    } else {
        html += '<i class="fas fa-exclamation-circle"></i> <strong>Problemas encontrados:</strong><ul style="margin-top: 10px; margin-bottom: 0;">';
        problemas.forEach(p => {
            html += `<li>${p}</li>`;
        });
        html += '</ul>';
    }
    
    if (reparos > 0) {
        html += `<br><strong style="color: #28a745;">→ ${reparos} reparos realizados!</strong>`;
    }
    
    html += '</div>';
    msg.innerHTML = html;
    msg.style.display = "block";
    
    console.log("Problemas encontrados:", problemas.length);
    console.log(problemas);
}

// Função para limpar todos os dados
function limparTodosDados() {
    // Verificar se usuário é administrador
    if (!podeEditar()) {
        alert("❌ Acesso negado!\n\nApenas usuários administradores podem executar esta ação.");
        return;
    }

    // Pedir usuário e senha para confirmação adicional
    const usuario = prompt("🔐 Confirmação de Segurança\n\nDigite seu usuário:");
    if (!usuario) return;

    const senha = prompt("🔐 Confirmação de Segurança\n\nDigite sua senha:");
    if (!senha) return;

    // Verificar credenciais
    const usuarioValido = db.usuarios.find(u => u.usuario === usuario && u.senha === senha);
    if (!usuarioValido) {
        alert("❌ Credenciais inválidas!\n\nUsuário ou senha incorretos.");
        return;
    }

    if (usuarioValido.cargo !== 'admin') {
        alert("❌ Acesso negado!\n\nApenas administradores podem executar esta ação.");
        return;
    }

    const confirmacao = confirm(
        "⚠️ ATENÇÃO! Isto vai deletar TODOS os dados:\n" +
        "- Viaturas\n" +
        "- Motoristas\n" +
        "- Missões\n" +
        "- Serviços\n\n" +
        "Isto NÃO pode ser desfeito!\n\n" +
        "Tem certeza?"
    );
    
    if (!confirmacao) return;
    
    const confirmacao2 = confirm(
        "⚠️ ÚLTIMA CONFIRMAÇÃO!\n\n" +
        "Tem CERTEZA ABSOLUTA que deseja apagar TODOS os dados?"
    );
    
    if (!confirmacao2) return;
    
    // Limpar dados
    db.marcas = [];
    db.modelos = [];
    db.cores = [];
    db.lotacoes = [];
    db.motoristas = [];
    db.veiculos = [];
    db.missoes = [];
    db.servicos = [];
    db.servicosVeiculo = [];
    
    // Registrar atividade de limpeza de dados
    registrarAtividade('Limpeza Total', 'Apagou todos os dados do sistema (admin)', 'sistema', 'limpeza');
    
    // Salvar
    if (salvar()) {
        const msg = document.getElementById("mensagemDiagnostico");
        msg.innerHTML = '<div class="alert alert-success" style="margin-bottom: 0;"><i class="fas fa-check-circle"></i> ✅ Todos os dados foram apagados com sucesso! A página será recarregada...</div>';
        msg.style.display = "block";
        
        setTimeout(() => {
            location.reload();
        }, 2000);
    }
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

function cadastrarLotacao() {
    const input = document.getElementById("inputLotacao");
    if (!input) return;

    const valor = input.value.trim();
    if (!valor) return alert("Digite a lotação!");

    db.lotacoes.push(valor);
    input.value = "";

    salvarDb();
    renderAuxiliares();
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
    const lotacao = document.getElementById("lotacaoMotorista")?.value.trim();
    const matricula = document.getElementById("matriculaMotorista")?.value.trim();
    const tel = document.getElementById("telefoneMotorista")?.value.trim();

    if (!nome || !matricula) return alert("Nome e Matricula são obrigatórios!");

    db.motoristas.push({ nome, lotacao, matricula, telefone: tel });

    limparCamposMotorista();
    salvarDb();
}

function limparCamposMotorista() {
    ["nomeMotorista", "lotacaoMotorista", "matriculaMotorista", "telefoneMotorista"]
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
}

// ================= CADASTRO DE VEÍCULOS =================
async function cadastrarVeiculo() {
    const selMarca = document.getElementById("selMarca");
    const selModelo = document.getElementById("selModelo");
    const selCor = document.getElementById("selCor");
    const placaInput = document.getElementById("placaViatura");
    const hodometroInput = document.getElementById("hodometroViatura");

    if (!selMarca || !selModelo || !placaInput) return;

    const marca = selMarca.value;
    const modelo = selModelo.value;
    const cor = selCor ? selCor.value : null;
    const placa = placaInput.value.toUpperCase().trim();
    const hodometro = hodometroInput ? parseInt(hodometroInput.value) || 0 : 0;

    if (!placa || !marca || !modelo) return alert("Preencha todos os dados!");

    const veiculo = {
        marca,
        modelo,
        cor,
        placa,
        hodometro: hodometro,
        status: 'disponivel'
    };

    db.veiculos.push(veiculo);

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

    if (!veiculoDisponivelNoPeriodo(veiculo.placa, dataEntrega.value, dataDevolucao.value)) {
        return alert("Veículo já está reservado no período selecionado. Escolha outra data ou veículo.");
    }

    const entregaData = parseDataISO(dataEntrega.value);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const agendada = entregaData && hoje < entregaData;

    if (!agendada) {
        veiculo.status = 'em uso';
    }

    db.missoes.push({
        id: Date.now(),
        veiculo,
        motorista,
        dataInicio: dataEntrega.value,
        dataEntrega: dataEntrega.value,
        dataDevolucao: dataDevolucao.value,
        dataDevolutiva: null,
        ativo: true,
        agendada: agendada
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
function renderizar(lista = null) {
    if (Array.isArray(lista)) {
        db.veiculos = lista;
    }

    atualizarStatusMissoesAgendadas();
    preencherSelect("selMarca", db.marcas);
    preencherSelect("selModelo", db.modelos);
    preencherSelect("selCor", db.cores);
    preencherSelect("despachoMotorista", db.motoristas.map((m, i) => ({ value: i, text: m.nome })));
    
    // Preencher filtros de pesquisa
    preencherSelect("filtroModelo", db.modelos, true); // true para adicionar "Todos os Modelos"
    preencherSelect("filtroCor", db.cores, true); // true para adicionar "Todas as Cores"

    filtrarViaturas(); // Atualizado para usar filtros múltiplos
    renderMotoristas();
    preencherSelect("lotacaoMotorista", db.lotacoes);
    renderAuxiliares();
    renderSelectViaturas();
    renderAgendamentos();
    renderMissoes();
    renderServicosManuencao();
    renderServicosManuencaoAtivos();
    atualizarDashboard();
    inicializarRelatorios();
}

async function salvarVeiculo(veiculo) {
    // Usando window.db disponibilizado pelo index.html
    try {
        await addDoc(collection(window.db, "veiculos"), {
            placa: veiculo.placa,
            modelo: veiculo.modelo,
            marca: veiculo.marca,
            cor: veiculo.cor,
            hodometro: veiculo.hodometro,
            status: veiculo.status,
            dataCadastro: new Date().toISOString()
        });
        console.log("✅ Viatura salva no Firestore com sucesso!");
    } catch (e) {
        console.error("❌ Erro ao salvar viatura no Firestore: ", e);
        alert("Erro ao salvar viatura: " + e.message);
    }
}

// Função de exemplo: para cadastrar viatura diretamente via Firestore
async function salvarViaturaExemplo(placa, modelo, status) {
    try {
        const docRef = await addDoc(collection(window.db, "viaturas"), {
            placa: placa,
            modelo: modelo,
            status: status,
            dataCadastro: new Date()
        });
        console.log("Viatura cadastrada com sucesso! ID:", docRef.id);
        alert("Viatura cadastrada com sucesso!");
    } catch (e) {
        console.error("Erro ao salvar: ", e);
        alert("Erro: " + e.message);
    }
}

async function carregarVeiculos() {
    const snapshot = await getDocs(collection(window.db, "veiculos"));
    const lista = [];

    snapshot.forEach(doc => {
        lista.push({
            id: doc.id,
            ...doc.data()
        });
    });

    return lista;
}

async function iniciar() {
    const lista = await carregarVeiculos();
    renderizar(lista);
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

    lista.innerHTML = viaturas.map((v, filteredIndex) => {
        const infoOleo = calcularProximaTrocaOleo(v);
        const emEdicao = estadoEdicao.veiculoEmEdicao === v.placa;
        
        return `
        <div class="card" style="margin-bottom:10px;">
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <strong>Placa:</strong>
                        <input type="text" id="placa${v.placa.replace(/[^a-zA-Z0-9]/g, '')}" value="${v.placa}" 
                               class="form-control" style="display: inline-block; width: 120px; margin: 0 5px;" 
                               placeholder="Placa" ${!emEdicao ? 'disabled' : ''}>
                        ${emEdicao ? `
                            <button onclick="salvarPlacaVeiculo('${v.placa}')" class="btn btn-sm btn-outline-success" title="Salvar placa">
                                <i class="fas fa-check"></i> Salvar
                            </button>
                            <button onclick="cancelarEdicaoVeiculo('${v.placa}')" class="btn btn-sm btn-outline-secondary" title="Cancelar">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        ` : podeEditar() ? `
                            <button onclick="iniciarEdicaoVeiculo('${v.placa}')" class="btn btn-sm btn-outline-primary" title="Editar placa">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        ` : ''}
                    </div>
                    </div>
                    <button onclick="abrirInfoServicos('${v.placa}')" class="btn btn-sm" style="background: #0b3d91; color: white; border: none; padding: 5px 10px; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;" title="Informações e Serviços">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
                
                <div>
                    <strong>Modelo:</strong> ${v.marca} ${v.modelo}<br>
                    <strong>Cor:</strong> ${emEdicao ? `
                        <select id="cor${v.placa.replace(/[^a-zA-Z0-9]/g, '')}" class="form-control" style="display: inline-block; width: 150px; margin: 0 5px;">
                            <option value="">Selecione...</option>
                        </select>
                        <button onclick="salvarCorVeiculo('${v.placa}')" class="btn btn-sm btn-outline-success" style="margin-left: 5px;">
                            <i class="fas fa-check"></i> Salvar
                        </button>
                    ` : `${v.cor || '-'}`}<br>
                </div>
                <div style="margin-top: 10px; margin-bottom: 10px;">
                    <strong>Hodômetro:</strong> 
                    <input type="number" id="hodometro${v.placa.replace(/[^a-zA-Z0-9]/g, '')}" value="${v.hodometro || 0}" style="width: 100px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;" ${!emEdicao ? 'disabled' : ''} /> km
                    ${emEdicao ? `
                        <button onclick="salvarHodometroVeiculo('${v.placa}')" class="btn btn-sm btn-outline-success" style="margin-left: 5px;">
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
                    <select id="statusSelect${v.placa.replace(/[^a-zA-Z0-9]/g, '')}" class="form-control mb-2" style="width: auto; display: inline-block;">
                        <option value="disponivel" ${v.status === 'disponivel' ? 'selected' : ''}>Disponível</option>
                        <option value="em uso" ${v.status === 'em uso' ? 'selected' : ''}>Em Uso</option>
                        <option value="em manutencao" ${v.status === 'em manutencao' ? 'selected' : ''}>Em Manutenção</option>
                    </select>
                    <button onclick="alterarStatus('${v.placa}', document.getElementById('statusSelect${v.placa.replace(/[^a-zA-Z0-9]/g, '')}').value)" class="btn btn-sm btn-outline-primary me-1">
                        Alterar Status
                    </button>
                    ${v.status === 'em uso' ? `<button onclick="desvincularViatura('${v.placa}')" class="btn btn-sm btn-outline-danger me-1">
                        Desvincular
                    </button>` : ''}
                    <button onclick="excluirVeiculo('${v.placa}')" class="btn btn-sm btn-outline-danger">
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
                    <label><strong>Lotação:</strong></label>
                    <select id="lotacaoMotorista${i}" class="form-control" style="margin-bottom: 5px;" ${!emEdicao ? 'disabled' : ''}>
                        <option value="">Selecione</option>
                        ${db.lotacoes.map(l => `<option value="${l}" ${ (m.lotacao || m.cargo || '') === l ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <label><strong>matricula:</strong></label>
                    <input type="text" id="matriculaMotorista${i}" value="${m.matricula || ''}" 
                           class="form-control" style="margin-bottom: 5px;" placeholder="Matrícula" ${!emEdicao ? 'disabled' : ''}>
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
                    ` : podeEditar() ? `
                        <button onclick="iniciarEdicaoMotorista(${i})" class="btn btn-sm btn-outline-primary me-2">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    ` : ''}
                    ${podeEditar() ? `<button onclick="excluirMotorista(${i})" class="btn btn-sm btn-outline-danger">
                        <i class="fas fa-trash"></i> Excluir
                    </button>` : ''}
                </div>
            </div>
        </div>
    `}).join("");
}

function renderSelectViaturas() {
    const sel = document.getElementById("despachoViatura");
    if (!sel) return;

    sel.innerHTML = '<option value="">Selecione...</option>' +
        db.veiculos.map((v, i) => `<option value="${i}">${v.placa} - ${v.modelo} (${getStatusLabel(v.status)})</option>`).join("");
}

// ================= RENDER AUXILIARES =================
function renderAuxiliares() {
    renderLista("listaMarcas", db.marcas, "marca");
    renderLista("listaModelos", db.modelos, "modelo");
    renderLista("listaCores", db.cores, "cor");
    renderLista("listaLotacoes", db.lotacoes, "lotacao");
    preencherSelect("lotacaoMotorista", db.lotacoes);
}

function renderLista(id, lista, tipo) {
    const el = document.getElementById(id);
    if (!el) return;

    el.innerHTML = lista.map((item, i) => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <input type="text" id="input${tipo}${i}" value="${item}" 
                   class="form-control" style="width: 200px; margin-right: 10px;" placeholder="${tipo}" ${podeEditar() ? '' : 'disabled'}>
            <div>
                ${podeEditar() ? `<button onclick="salvarAuxiliar('${tipo}', ${i})" class="btn btn-sm btn-outline-success me-1">
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="excluirAuxiliar('${tipo}', ${i})" class="btn btn-sm btn-outline-danger">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </div>
        </div>
    `).join("");
}

// ================= RENDER MISSÕES =================
function renderMissoes() {
    const lista = document.getElementById("listaMissoes");
    if (!lista) return;

    // Filtrar apenas missões ativas (não agendadas)
    const missoesAtivas = db.missoes.filter(m => m.ativo !== false && getStatusMissao(m).status !== 'Agendada');

    lista.innerHTML = missoesAtivas.map((m, idx) => {
        const statusInfo = getStatusMissao(m);
        const statusLabel = statusInfo.status === 'Atrasado'
            ? `<span style="color: red; font-weight: bold; margin-left: 10px;"><i class="fas fa-exclamation-triangle"></i> ${statusInfo.label}</span>`
            : statusInfo.status === 'Entregue antecipada'
            ? `<span style="color: #007bff; font-weight: bold; margin-left: 10px;"><i class="fas fa-clock"></i> ${statusInfo.label}</span>`
            : `<span style="color: ${statusInfo.color}; font-weight: bold; margin-left: 10px;">${statusInfo.label}</span>`;

        // Encontrar índice real na array db.missoes
        const realIdx = db.missoes.indexOf(m);
        const cardBorder = statusInfo.status === 'Atrasado' ? '#dc3545' : statusInfo.status === 'Entregue antecipada' ? '#007bff' : '#ddd';

        return `
        <div class="card mb-2" style="border: 1px solid ${cardBorder};">
            <div class="card-body">
                <strong>Missão #${m.id}</strong><br>
                Viatura: ${m.veiculo.placa} - ${m.veiculo.modelo}<br>
                Motorista: ${m.motorista.nome}<br>
                Data Entrega: ${formatarData(m.dataEntrega)} | Data Devolução: ${formatarData(m.dataDevolucao)} ${statusLabel}<br>
                <div class="mt-2">
                    <button onclick="devolverMissao(${realIdx})" class="btn btn-sm btn-outline-success">
                        <i class="fas fa-check"></i> Devolver
                    </button>
                    ${podeEditar() ? `<button onclick="excluirMissao(${realIdx})" class="btn btn-sm btn-outline-danger">
                        <i class="fas fa-trash"></i> Excluir
                    </button>` : ''}
                </div>
            </div>
        </div>
    `}).join("");
    
    if (missoesAtivas.length === 0) {
        lista.innerHTML = '<p style="color: #999;"><em>Nenhuma missão ativa</em></p>';
    }
}

function renderAgendamentos() {
    const lista = document.getElementById("listaAgendamentos");
    if (!lista) return;

    const agendamentos = db.missoes.filter(m => m.ativo !== false && getStatusMissao(m).status === 'Agendada');

    lista.innerHTML = agendamentos.map((m, idx) => {
        const realIdx = db.missoes.indexOf(m);

        return `
        <div class="card mb-2" style="border: 1px solid #0b3d91;">
            <div class="card-body">
                <strong>Missão #${m.id}</strong><br>
                Viatura: ${m.veiculo.placa} - ${m.veiculo.modelo}<br>
                Motorista: ${m.motorista.nome}<br>
                Data de Início: ${formatarData(m.dataEntrega)}<br>
                Data de Devolução: ${formatarData(m.dataDevolucao)}<br>
                <span style="color: #0b3d91; font-weight: bold; margin-top: 10px; display: inline-block;">Agendada</span>
                <div class="mt-2">
                    <button onclick="excluirMissao(${realIdx})" class="btn btn-sm btn-outline-danger">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `}).join("");

    if (agendamentos.length === 0) {
        lista.innerHTML = '<p style="color: #999;"><em>Nenhum agendamento</em></p>';
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
    
    const viaturasEmUso = db.missoes.filter(m => m.ativo !== false && getStatusMissao(m).status !== 'Agendada');
    
    let html = `<h5>Viaturas em Uso</h5>`;
    if (viaturasEmUso.length === 0) {
        html += '<p>Nenhuma viatura em uso</p>';
    } else {
        html += '<table class="table table-striped"><thead><tr><th>Placa</th><th>Veículo</th><th>Motorista</th><th>Status Entrega</th><th>Próxima Troca de Óleo</th></tr></thead><tbody>';
        
        viaturasEmUso.forEach(missao => {
            const statusInfo = getStatusMissao(missao);
            const statusEntrega = statusInfo.status === 'Atrasado'
                ? `<span style="color: red;"><i class="fas fa-exclamation-triangle"></i> ${statusInfo.label}</span>`
                : `<span style="color: ${statusInfo.color};">${statusInfo.label}</span>`;
            
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

function abrirInfoServicos(placa) {
    const veiculo = db.veiculos.find(v => v.placa === placa);
    if (!veiculo) return;
    
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
            html += `<tr><td>${s.data}</td><td>${s.tipo}</td><td>${s.hodometroNaData} km</td><td>${s.descricao || '-'}</td><td>${statusBadge}</td><td>${podeEditar() ? `<button onclick="excluirServico('${placa}', ${i})" class="btn btn-sm btn-outline-danger">Excluir</button>` : ''}</td></tr>`;
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
        ${podeEditar() ? `<button onclick="adicionarServico('${placa}')" class="btn btn-sm btn-success">Adicionar Serviço</button>` : ''}
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
    if (!podeEditar()) return;
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
    if (!podeEditar()) return;
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
    const diasAtraso = calcularDiasAtraso(missao.dataDevolucao, missao.dataDevolutiva);
    
    db.missoes[index].ativo = false;
    
    obterDataHoraDevolucao(null, (dataHora) => {
        db.missoes[index].dataDevolutiva = dataHora;
        db.veiculos.forEach(v => {
            if (v.placa === db.missoes[index].veiculo.placa) {
                v.status = 'disponivel';
            }
        });
        
        salvarDb();
        renderizar();
        
        // Mostrar mensagem de sucesso com aviso de atraso se aplicável
        if (diasAtraso > 0) {
            alert(`⚠️ Viatura devolvida com sucesso!\n\n🕐 ATENÇÃO: Devolução ATRASADA por ${diasAtraso} dia(s)\nData programada: ${missao.dataDevolucao}\nData de devolução: ${formatarData(dataHora.split('T')[0])} ${dataHora.split('T')[1].substring(0,5)}`);
        } else {
            alert("✅ Viatura devolvida com sucesso!");
        }
    });
}

function excluirMissao(index) {
    if (!podeEditar()) return;
    if (!confirm("Tem certeza que deseja excluir esta missão?")) return;
    db.missoes.splice(index, 1);
    salvarDb();
    renderizar();
}

function excluirMissaoRelatorio(index) {
    if (!podeEditar()) return;
    if (!confirm("Tem certeza que deseja excluir esta missão? Esta ação não pode ser desfeita.")) return;
    
    db.missoes.splice(index, 1);
    salvarDb();
    
    // Recarregar o relatório atual
    const dataInicioEl = document.getElementById("filtroDataInicioUso");
    const dataFimEl = document.getElementById("filtroDataFimUso");
    
    if (dataInicioEl && dataFimEl && dataInicioEl.value && dataFimEl.value) {
        gerarRelatorioUso();
    }
    
    alert("Missão excluída com sucesso!");
}

function editarDataHoraDevolucao(index) {
    if (!podeEditar()) return;
    const missao = db.missoes[index];
    if (!missao.dataDevolutiva) return;
    
    obterDataHoraDevolucao(missao.dataDevolutiva, (novaDataHora) => {
        db.missoes[index].dataDevolutiva = novaDataHora;
        salvarDb();
        renderizar();
        alert("Data e hora de devolução atualizadas!");
    });
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
    
    // Verificar os limites: 1 ano (365 dias) ou 10.000 km
    const diasRestantes = 365 - diasDesdeUltima;
    const kmRestantes = 10000 - kmDesdeUltima;
    
    let status = 'OK';
    let mensagem = '';
    
    if (diasDesdeUltima >= 365 || kmDesdeUltima >= 10000) {
        status = 'VENCIDO';
        mensagem = `TROCA DE ÓLEO VENCIDA!`;
    } else if (diasRestantes <= 30 || kmRestantes <= 1000) {
        status = 'ALERTA';
        mensagem = `ALERTA: Próxima troca em ${Math.min(diasRestantes, 99)} dias ou ${kmRestantes} km`;
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

async function alterarStatus(index, novoStatus) {
    // Como o index pode estar incorreto devido à filtragem, vamos encontrar o veículo correto
    const veiculo = db.veiculos.find(v => v.placa === index);
    if (!veiculo) {
        alert("Erro: Viatura não encontrada.");
        return;
    }

    if (novoStatus === 'em uso' && veiculo.status !== 'em uso') {
        if (!confirm("Alterar para 'Em Uso' criará uma missão sem motorista. Use a seção de Despacho para missões normais. Continuar?")) {
            return;
        }
    }

    try {
        veiculo.status = novoStatus;
        salvarDb();
        renderizar();
        console.log("✅ Status da viatura atualizado com sucesso!");
    } catch (e) {
        console.error("❌ Erro ao atualizar status da viatura:", e);
        alert("Erro ao atualizar status: " + e.message);
    }
}

async function desvincularViatura(index) {
    if (!confirm("Deseja desvincular esta viatura do motorista?")) return;

    // Como o index pode estar incorreto devido à filtragem, vamos encontrar o veículo correto
    const veiculo = db.veiculos.find(v => v.placa === index);
    if (!veiculo) {
        alert("Erro: Viatura não encontrada.");
        return;
    }

    try {
        veiculo.status = 'disponivel';
        db.missoes = db.missoes.filter(m => m.veiculo.placa !== veiculo.placa);
        salvarDb();
        renderizar();
        console.log("✅ Viatura desvinculada com sucesso!");
    } catch (e) {
        console.error("❌ Erro ao desvincular viatura:", e);
        alert("Erro ao desvincular: " + e.message);
    }
}

async function excluirVeiculo(index) {
    if (!confirm("Tem certeza que deseja excluir esta viatura?")) return;

    // Como o index pode estar incorreto devido à filtragem, vamos encontrar o veículo correto
    const veiculoIndex = db.veiculos.findIndex(v => v.placa === index);
    if (veiculoIndex === -1) {
        alert("Erro: Viatura não encontrada.");
        return;
    }

    try {
        db.veiculos.splice(veiculoIndex, 1);
        salvarDb();
        renderizar();
        console.log("✅ Viatura excluída com sucesso!");
    } catch (e) {
        console.error("❌ Erro ao excluir viatura:", e);
        alert("Erro ao excluir: " + e.message);
    }
}

function salvarPlacaVeiculo(placaAtual) {
    const placaLimpa = placaAtual.replace(/[^a-zA-Z0-9]/g, '');
    const input = document.getElementById(`placa${placaLimpa}`);
    if (!input) return;

    const novaPlaca = input.value.toUpperCase().trim();
    if (!novaPlaca) {
        alert("A placa não pode estar vazia!");
        return;
    }

    // Encontrar o veículo pela placa atual
    const veiculoIndex = db.veiculos.findIndex(v => v.placa === placaAtual);
    if (veiculoIndex === -1) {
        alert("Veículo não encontrado!");
        return;
    }

    // Verificar se placa já existe
    if (db.veiculos.some(v => v.placa === novaPlaca && v.placa !== placaAtual)) {
        alert("Essa placa já existe!");
        return;
    }

    db.veiculos[veiculoIndex].placa = novaPlaca;
    estadoEdicao.veiculoEmEdicao = null;
    salvarDb();
    renderizar();
    alert("Placa atualizada com sucesso!");
}

function salvarHodometroVeiculo(placa) {
    const placaLimpa = placa.replace(/[^a-zA-Z0-9]/g, '');
    const input = document.getElementById(`hodometro${placaLimpa}`);
    if (!input) return;

    const novoKm = parseInt(input.value);
    if (isNaN(novoKm) || novoKm < 0) {
        alert("Quilometragem inválida!");
        return;
    }

    const veiculo = db.veiculos.find(v => v.placa === placa);
    if (!veiculo) {
        alert("Veículo não encontrado!");
        return;
    }

    veiculo.hodometro = novoKm;
    estadoEdicao.veiculoEmEdicao = null;
    salvarDb();
    renderizar();
    alert("Quilometragem atualizada com sucesso!");
}

function iniciarEdicaoVeiculo(placa) {
    if (!podeEditar()) return;
    estadoEdicao.veiculoEmEdicao = placa;
    // Popular o select de cor com as cores disponíveis
    setTimeout(() => {
        const selectCor = document.getElementById(`cor${placa}`);
        if (selectCor) {
            preencherSelect(`cor${placa}`, db.cores);
            // Definir o valor atual da cor
            const veiculo = db.veiculos.find(v => v.placa === placa);
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

function salvarCorVeiculo(placa) {
    const placaLimpa = placa.replace(/[^a-zA-Z0-9]/g, '');
    const selectCor = document.getElementById(`cor${placaLimpa}`);
    if (!selectCor) return;

    const novaCor = selectCor.value.trim();
    if (!novaCor) return alert("Selecione uma cor!");

    const veiculo = db.veiculos.find(v => v.placa === placa);
    if (!veiculo) {
        alert("Veículo não encontrado!");
        return;
    }

    veiculo.cor = novaCor;
    estadoEdicao.veiculoEmEdicao = null;
    salvarDb();
    filtrarViaturas();
    alert("Cor atualizada com sucesso!");
}

// ================= FUNÇÕES DE EDIÇÃO DE MOTORISTAS =================
function iniciarEdicaoMotorista(index) {
    if (!podeEditar()) return;
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
    const lotacaoInput = document.getElementById(`lotacaoMotorista${index}`);
    const matriculaInput = document.getElementById(`matriculaMotorista${index}`);
    const telefoneInput = document.getElementById(`telefoneMotorista${index}`);

    if (!nomeInput || !lotacaoInput || !matriculaInput || !telefoneInput) return;

    const novoNome = nomeInput.value.trim();
    const novoLotacao = lotacaoInput.value.trim();
    const novaMatricula = matriculaInput.value.trim();
    const novoTel = telefoneInput.value.trim();

    if (!novoNome || !novaMatricula) {
        alert("Nome e Matricula são obrigatórios!");
        return;
    }

    db.motoristas[index] = {
        nome: novoNome,
        lotacao: novoLotacao || null,
        matricula: novaMatricula,
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

    const novoLotacao = prompt("Nova lotação:", m.lotacao || m.cargo || "");
    const novaMatricula = prompt("Nova Matricula:", m.matricula || "");
    if (novaMatricula === null) return;

    const novoTel = prompt("Novo telefone:", m.telefone || "");

    db.motoristas[index] = {
        nome: novoNome.trim(),
        lotacao: novoLotacao ? novoLotacao.trim() : null,
        matricula: novaMatricula.trim(),
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
    if (!podeEditar()) return;
    // Mapear tipo singular para plural
    const tipoPlural = tipo === 'cor' ? 'cores' : tipo === 'lotacao' ? 'lotacoes' : tipo + 's';
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
    const tipoPlural = tipo === 'cor' ? 'cores' : tipo === 'lotacao' ? 'lotacoes' : tipo + 's';
    const item = db[tipoPlural][index];
    if (!item) return;

    const novoValor = prompt(`Novo ${tipo}:`, item);
    if (novoValor === null || !novoValor.trim()) return;

    db[tipoPlural][index] = novoValor.trim();
    salvarDb();
}

function excluirAuxiliar(tipo, index) {
    if (!podeEditar()) return;
    // Mapear tipo singular para plural
    const tipoPlural = tipo === 'cor' ? 'cores' : tipo === 'lotacao' ? 'lotacoes' : tipo + 's';
    if (!confirm(`Tem certeza que deseja excluir este ${tipo}?`)) return;

    db[tipoPlural].splice(index, 1);
    salvarDb();
}

function gerarRelatorioUso() {
    if (typeof window.db === 'undefined') {
        alert("Sistema ainda inicializando. Aguarde alguns segundos e tente novamente.");
        return;
    }

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
        html += '<table class="table table-striped table-hover"><thead><tr style="background: linear-gradient(135deg, rgba(11, 61, 145, 0.1) 0%, rgba(255, 204, 0, 0.05) 100%);"><th style="color: #0d3d91; font-weight: 700;">Veículo</th><th style="color: #0d3d91; font-weight: 700;">Motorista</th><th style="color: #0d3d91; font-weight: 700;">Data de Pega</th><th style="color: #0d3d91; font-weight: 700;">Data/Hora de Devolução</th><th style="color: #0d3d91; font-weight: 700;">Status</th><th style="color: #0d3d91; font-weight: 700;">Observações</th><th style="color: #0d3d91; font-weight: 700;">Ações</th></tr></thead><tbody>';
        
        missoesFiltradas.forEach((missao, idx) => {
            // Encontrar índice real
            const realIdx = db.missoes.indexOf(missao);
            // Formatar data de pega
            const dataPega = formatarData(missao.dataInicio);
            
            // Formatar data de devolução (pode ser dataDevolucao ou dataDevolutiva)
            const dataDevolucaoStr = missao.dataDevolucao || missao.dataDevolutiva;
            let dataDevolucao = 'Não devolvida';
            if (dataDevolucaoStr) {
                if (dataDevolucaoStr.includes('T')) {
                    // Tem hora
                    const dataObj = new Date(dataDevolucaoStr);
                    dataDevolucao = `${dataObj.toLocaleDateString('pt-BR')} ${dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
                } else {
                    dataDevolucao = formatarData(dataDevolucaoStr);
                }
            }
            
            // Usar a função getStatusMissao para determinar o status correto
            const statusInfo = getStatusMissao(missao);
            let statusAtraso = statusInfo.label;
            let classeAtraso = '';
            
            if (statusInfo.status === 'Atrasado') {
                classeAtraso = 'style="background-color: #ffe0e0; border-left: 4px solid #dc3545;"';
            } else if (statusInfo.status === 'Entregue antecipada') {
                classeAtraso = 'style="background-color: #e3f2fd; border-left: 4px solid #007bff;"';
            } else if (statusInfo.status === 'Em Uso') {
                classeAtraso = 'style="background-color: #fff3cd; border-left: 4px solid #ffc107;"';
            }
            
            const nomeMotorista = missao.motorista ? missao.motorista.nome : 'Sem motorista';
            const descricaoVeiculo = `${missao.veiculo.placa} (${missao.veiculo.marca} ${missao.veiculo.modelo})`;
            
            html += `<tr ${classeAtraso}><td><strong>${descricaoVeiculo}</strong></td><td>${nomeMotorista}</td><td>${dataPega}</td><td>${dataDevolucao}</td><td><span class="badge ${statusInfo.badgeClass}">${statusAtraso}</span></td><td>${statusAtraso}</td><td>${podeEditar() ? `<button onclick="editarDataHoraDevolucao(${realIdx})" class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i> Editar</button> <button onclick="excluirMissaoRelatorio(${realIdx})" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i> Excluir</button>` : ''}</td></tr>`;
        });
        html += '</tbody></table>';
        
        // Adicionar botão de exportar PDF
        html += '<div class="mt-3 text-end">';
        html += '<button onclick="exportarRelatorioPDF(\'relatorioUso\', \'relatorio-uso-veiculos.pdf\')" class="btn btn-danger">';
        html += '<i class="fas fa-file-pdf"></i> Exportar PDF';
        html += '</button>';
        html += '</div>';
    }

    // Se o relatório já está sendo exibido, apenas feche-o
    if (relatorioDiv.style.display === "block") {
        relatorioDiv.style.display = "none";
        return;
    }

    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// ================= NOVAS FUNÇÕES DE RELATÓRIOS =================

// Relatório de Status dos Veículos
function gerarRelatorioStatusVeiculos() {
    if (typeof window.db === 'undefined') {
        alert("Sistema ainda inicializando. Aguarde alguns segundos e tente novamente.");
        return;
    }

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
    
    // Adicionar botão de exportar PDF
    html += '<div class="mt-3 text-end">';
    html += '<button onclick="exportarRelatorioPDF(\'relatorioStatusVeiculos\', \'relatorio-status-veiculos.pdf\')" class="btn btn-danger">';
    html += '<i class="fas fa-file-pdf"></i> Exportar PDF';
    html += '</button>';
    html += '</div>';
    
    // Se o relatório já está sendo exibido, apenas feche-o
    if (relatorioDiv.style.display === "block") {
        relatorioDiv.style.display = "none";
        return;
    }

    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Relatório de Próximas Trocas de Óleo
function gerarRelatorioTrocaOleo() {
    if (typeof window.db === 'undefined') {
        alert("Sistema ainda inicializando. Aguarde alguns segundos e tente novamente.");
        return;
    }

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
    
    // Adicionar botão de exportar PDF
    html += '<div class="mt-3 text-end">';
    html += '<button onclick="exportarRelatorioPDF(\'relatorioTrocaOleo\', \'relatorio-troca-oleo.pdf\')" class="btn btn-danger">';
    html += '<i class="fas fa-file-pdf"></i> Exportar PDF';
    html += '</button>';
    html += '</div>';
    
    // Se o relatório já está sendo exibido, apenas feche-o
    if (relatorioDiv.style.display === "block") {
        relatorioDiv.style.display = "none";
        return;
    }

    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Relatório de Motoristas
function gerarRelatorioMotoristas() {
    if (typeof window.db === 'undefined') {
        alert("Sistema ainda inicializando. Aguarde alguns segundos e tente novamente.");
        return;
    }

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
    html += '<thead><tr><th>Motorista</th><th>Veículo</th><th>Data Início</th><th>Data/Hora Devolução</th><th>Status</th><th>Ações</th></tr></thead><tbody>';

    const missoesFiltradas = db.missoes.filter(missao => {
        if (!missao.dataInicio) return false;

        const dataMissao = parseDataISO(missao.dataInicio);
        if (!dataMissao) return false;

        const dataIni = parseDataISO(dataInicio);
        const dataFin = parseDataISO(dataFim);
        if (!dataIni || !dataFin) return false;

        const dentroPeriodo = dataMissao >= dataIni && dataMissao <= dataFin;
        const motoristaMatch = !motoristaFiltro || missao.motorista.nome === motoristaFiltro;

        return dentroPeriodo && motoristaMatch;
    });

    missoesFiltradas.forEach(missao => {
        const realIdx = db.missoes.indexOf(missao);
        const statusInfo = getStatusMissao(missao);
        const status = statusInfo.status;

        let dataDevolucaoDisplay = formatarData(missao.dataDevolucao);
        if (missao.dataDevolutiva && missao.dataDevolutiva.includes('T')) {
            const dataObj = new Date(missao.dataDevolutiva);
            dataDevolucaoDisplay = `${dataObj.toLocaleDateString('pt-BR')} ${dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
        }

        html += `<tr>
            <td>${missao.motorista.nome}</td>
            <td>${missao.veiculo.placa}</td>
            <td>${formatarData(missao.dataInicio)}</td>
            <td>${dataDevolucaoDisplay}</td>
            <td><span class="badge ${statusInfo.badgeClass}">${statusInfo.label}</span></td>
            <td>${podeEditar() ? `<button onclick="excluirMissaoRelatorio(${realIdx})" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i> Excluir</button>` : ''}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    
    // Adicionar botão de exportar PDF
    html += '<div class="mt-3 text-end">';
    html += '<button onclick="exportarRelatorioPDF(\'relatorioMotoristas\', \'relatorio-motoristas.pdf\')" class="btn btn-danger">';
    html += '<i class="fas fa-file-pdf"></i> Exportar PDF';
    html += '</button>';
    html += '</div>';
    
    // Se o relatório já está sendo exibido, apenas feche-o
    if (relatorioDiv.style.display === "block") {
        relatorioDiv.style.display = "none";
        return;
    }

    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Relatório de Lista de Motoristas
function gerarRelatorioListaMotoristas() {
    if (typeof window.db === 'undefined') {
        alert("Sistema ainda inicializando. Aguarde alguns segundos e tente novamente.");
        return;
    }

    const relatorioDiv = document.getElementById("relatorioListaMotoristas");
    if (!relatorioDiv) return;

    let html = '<h6>Lista Completa de Motoristas</h6>';
    html += '<table class="table table-striped table-sm">';
    html += '<thead><tr><th>Nome</th><th></th><th>CNH</th><th>Telefone</th><th>Missões Ativas</th></tr></thead><tbody>';

    db.motoristas.forEach(motorista => {
        const missoesAtivas = db.missoes.filter(m => m.motorista.nome === motorista.nome && !m.dataDevolutiva).length;

        html += `<tr>
            <td><strong>${motorista.nome}</strong></td>
            <td>${motorista.cargo || '-'}</td>
            <td>${motorista.matricula}</td>
            <td>${motorista.telefone || '-'}</td>
            <td><span class="badge bg-info">${missoesAtivas}</span></td>
        </tr>`;
    });

    html += '</tbody></table>';
    
    // Adicionar botão de exportar PDF
    html += '<div class="mt-3 text-end">';
    html += '<button onclick="exportarRelatorioPDF(\'relatorioListaMotoristas\', \'relatorio-lista-motoristas.pdf\')" class="btn btn-danger">';
    html += '<i class="fas fa-file-pdf"></i> Exportar PDF';
    html += '</button>';
    html += '</div>';
    
    // Se o relatório já está sendo exibido, apenas feche-o
    if (relatorioDiv.style.display === "block") {
        relatorioDiv.style.display = "none";
        return;
    }

    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Relatório de Serviços
function gerarRelatorioServicos() {
    if (typeof window.db === 'undefined') {
        alert("Sistema ainda inicializando. Aguarde alguns segundos e tente novamente.");
        return;
    }

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
    
    // Adicionar botão de exportar PDF
    html += '<div class="mt-3 text-end">';
    html += '<button onclick="exportarRelatorioPDF(\'relatorioServicos\', \'relatorio-servicos.pdf\')" class="btn btn-danger">';
    html += '<i class="fas fa-file-pdf"></i> Exportar PDF';
    html += '</button>';
    html += '</div>';
    
    // Se o relatório já está sendo exibido, apenas feche-o
    if (relatorioDiv.style.display === "block") {
        relatorioDiv.style.display = "none";
        return;
    }

    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Relatório de Serviços Pendentes
function gerarRelatorioServicosPendentes() {
    if (typeof window.db === 'undefined') {
        alert("Sistema ainda inicializando. Aguarde alguns segundos e tente novamente.");
        return;
    }

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
    
    // Adicionar botão de exportar PDF
    html += '<div class="mt-3 text-end">';
    html += '<button onclick="exportarRelatorioPDF(\'relatorioServicosPendentes\', \'relatorio-servicos-pendentes.pdf\')" class="btn btn-danger">';
    html += '<i class="fas fa-file-pdf"></i> Exportar PDF';
    html += '</button>';
    html += '</div>';
    
    // Se o relatório já está sendo exibido, apenas feche-o
    if (relatorioDiv.style.display === "block") {
        relatorioDiv.style.display = "none";
        return;
    }

    relatorioDiv.innerHTML = html;
    relatorioDiv.style.display = "block";
}

// Relatório de Estatísticas Gerais
function gerarRelatorioEstatisticas() {
    if (typeof window.db === 'undefined') {
        alert("Sistema ainda inicializando. Aguarde alguns segundos e tente novamente.");
        return;
    }

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
    
    // Adicionar botão de exportar PDF
    html += '<div class="mt-3 text-end">';
    html += '<button onclick="exportarRelatorioPDF(\'relatorioEstatisticas\', \'relatorio-estatisticas.pdf\')" class="btn btn-danger">';
    html += '<i class="fas fa-file-pdf"></i> Exportar PDF';
    html += '</button>';
    html += '</div>';
    
    // Se o relatório já está sendo exibido, apenas feche-o
    if (relatorioDiv.style.display === "block") {
        relatorioDiv.style.display = "none";
        return;
    }

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

// ================= FUNÇÃO DE EXPORTAR PDF =================

function toggleRelatorio(relatorioDiv) {
    if (relatorioDiv.style.display === "block") {
        relatorioDiv.style.display = "none";
    } else {
        relatorioDiv.style.display = "block";
    }
}

function exportarRelatorioPDF(elementId, nomeArquivo) {
    const element = document.getElementById(elementId);
    if (!element) {
        alert("Erro: Elemento do relatório não encontrado!");
        return;
    }

    // Configurações do PDF
    const opt = {
        margin: 1,
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    // Gerar PDF
    html2pdf().set(opt).from(element).save().then(() => {
        console.log('PDF gerado com sucesso!');
    }).catch(err => {
        console.error('Erro ao gerar PDF:', err);
        alert('Erro ao gerar PDF. Tente novamente.');
    });
}

// Inicializar select de motoristas no relatório
function inicializarRelatorios() {
    const selectMotorista = document.getElementById("filtroMotorista");
    if (selectMotorista) {
        selectMotorista.innerHTML = '<option value="">Todos os motoristas</option>' +
            db.motoristas.map(m => `<option value="${m.nome}">${m.nome}</option>`).join("");
    }

    // Inicializar filtro de usuários para atividades
    const selectUsuarioAtividades = document.getElementById("filtroUsuarioAtividades");
    if (selectUsuarioAtividades) {
        const usuariosUnicos = [...new Set(db.atividades.map(a => a.usuario))];
        selectUsuarioAtividades.innerHTML = '<option value="">Todos os usuários</option>' +
            usuariosUnicos.map(u => {
                const atividade = db.atividades.find(a => a.usuario === u);
                return `<option value="${u}">${atividade ? atividade.nomeUsuario : u}</option>`;
            }).join("");
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    await inicializarApp();
    inicializarRelatorios();
});
