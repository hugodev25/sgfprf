# SGF PRF - Sistema de Gestão de Frotas

## 🚀 Funcionalidades Implementadas

### ✅ 1. Autenticação Segura
- **Login/Logout** com validação
- **Criptografia SHA256** de senhas
- **Sessão persistente** (localStorage)
- **"Lembrar-me"** para usuários frequentes

### ✅ 2. Recuperação de Senha
- Modal dedicado com fluxo em 2 etapas
- **Verificação por email**
- Código de recuperação aleatório
- Redefinição segura de senha
- Validação de dados

### ✅ 3. Timeout de Sessão Automático
- **15 minutos** de inatividade (ajustável)
- **Aviso com 1 minuto** de antecedência
- **Monitoramento**:
  - Movimentos do mouse
  - Digitação
  - Cliques na página
- **Opções**: Prolongar sessão ou fazer logout

### ✅ 4. Sistema de Permissões por Cargo
Três níveis de acesso:

#### 👨‍💼 **Admin** (Acesso Total)
- Visualizar Dashboard
- Gerenciar Veículos
- Gerenciar Motoristas
- Gerenciar Missões
- Gerenciar Relatórios
- Gerenciar Usuários
- Editar Sistema

#### 👤 **Operador** (Gerenciamento)
- Visualizar Dashboard
- Gerenciar Veículos
- Gerenciar Motoristas
- Gerenciar Missões
- Visualizar Relatórios (somente leitura)

#### 👁️ **Visualizador** (Apenas Leitura)
- Visualizar Dashboard
- Visualizar Veículos
- Visualizar Motoristas
- Visualizar Missões
- Visualizar Relatórios

### ✅ 5. Sistema de Cadastro Avançado
- **Campos obrigatórios**: Nome, Usuário, Email, Senha
- **Validações**:
  - Email válido e não duplicado
  - Usuário único
  - Senhas coincidem
  - Mínimo 6 caracteres
- **Seleção de cargo** durante cadastro
- **Data de cadastro** registrada

---

## 🔐 Credenciais de Teste

### Admin
```
Usuário: admin
Senha: 123456
```

### Operador
```
Usuário: operador
Senha: 123456
```

---

## 📱 Como Usar

### 1️⃣ **Primeiro Acesso**
1. Abra `index.html` no navegador
2. Você verá a **tela de login**
3. Use as credenciais acima ou crie uma nova conta

### 2️⃣ **Criar Conta**
1. Clique em "Criar conta"
2. Preencha todos os campos
3. Selecione um cargo (permissões)
4. Clique em "Cadastrar"
5. Faça login com a nova conta

### 3️⃣ **Recuperar Senha**
1. Clique em "Esqueci minha senha"
2. Digite seu email ou usuário
3. Receberá um código (simulado no alert)
4. Digite o código e crie uma nova senha
5. Faça login com a nova senha

### 4️⃣ **Durante a Sessão**
- Qualquer atividade (mouse, teclado, clique) **reseta o timer**
- Com **1 minuto** de inatividade, um aviso aparece
- Clique **"Permanecer Logado"** para continuar
- Seu cargo aparece no cabeçalho do dashboard

---

## ⚙️ Configurações

### Tempo de Timeout
Edite em `app.js`:

```javascript
const TEMPO_TIMEOUT = 15 * 60 * 1000; // 15 minutos
const TEMPO_AVISO = 60 * 1000;        // Avisar 1 minuto antes
```

### Adicionar Novos Cargos
Edite `PERMISSOES` em `app.js`:

```javascript
const PERMISSOES = {
    novo_cargo: [
        "permissao1",
        "permissao2"
    ]
};
```

---

## 🔧 Módulo de Serviços e Manutenção

### Nova Funcionalidade ✨
Sistema completo para rastreamento de manutenção e serviços de viaturas.

### 📋 Acesso
- Menu: **"Serviços"** (abaixo de "Motoristas")
- Ícone: 🔧
- Requer permissão: `gerenciar_veiculos`
- Disponível para: **Admin** e **Operador**

### 🎯 Abas Disponíveis

#### Tab 1: **Serviços em Andamento** ⚙️
Mostra todas as viaturas atualmente em manutenção:
- **Coluna Esquerda**: Serviços pendentes (borda vermelha)
- **Coluna Direita**: Serviços concluídos (borda verde)
- **Formulário**: Adicionar novos serviços
  - Data do serviço
  - Tipo (Troca de Óleo, Manutenção, Reparo, Inspeção, Diagnóstico, Outro)
  - Quilometragem
  - Descrição/Observações
- **Botão**: "Manutenção Concluída" (aparece quando todos os serviços foram concluídos)

#### Tab 2: **Histórico de Serviços** 📊
Mostra viaturas que já passaram por manutenção:
- **Tabela**: Lista de todos os serviços concluídos
- **Filtros**:
  - 📅 Data Inicial / Data Final
  - 🚗 Placa da Viatura (ex: ABC-1234)
  - 🔍 Botões: Filtrar / Limpar
- **Agrupamento**: Serviços organizados por placa de viatura
- **Detalhes**: Data, Tipo (com badge colorida), Km, Descrição

### 🎨 Tipo de Serviço e Cores
| Tipo | Badge | Cor |
|------|-------|-----|
| 🛢️ Troca de Óleo | `bg-warning` | Amarelo |
| 🔧 Reparo | `bg-danger` | Vermelho |
| ⚙️ Manutenção | `bg-info` | Azul-claro |
| 🔍 Inspeção | `bg-primary` | Azul |
| 📋 Diagnóstico | `bg-secondary` | Cinza |
| 📌 Outro | `bg-secondary` | Cinza |

### 🔄 Fluxo de Trabalho

1. **Viatura vai para manutenção**
   - Altere status da viatura para "Em Manutenção"
   - Ela aparecerá em "Serviços em Andamento"

2. **Agregar serviços**
   - Preencha o formulário com detalhes do serviço
   - Clique em "Adicionar"
   - Serviço aparece na coluna esquerda (pendente)

3. **Marcar como concluído**
   - Clique em "Marcar Concluído" em cada serviço
   - Serviço move para coluna direita (concluído)

4. **Encerrar manutenção**
   - Quando todos os serviços estão concluídos, o botão "Manutenção Concluída" aparece
   - Clique para voltar viatura ao status "Disponível"
   - Serviços são transferidos para "Histórico"

### 📊 Consultar Histórico

1. Vá até "Serviços" > "Histórico de Serviços"
2. Configure filtros (opcional):
   - Período: Data inicial e final
   - Veículo: Placa específica
3. Clique em "Filtrar"
4. Visualize tabela com histórico de serviços

### 💾 Dados Armazenados

Cada serviço registra:
```json
{
  "placa": "ABC-1234",
  "data": "2026-03-25",
  "tipo": "Troca de Óleo",
  "descricao": "Óleo sintético 0W-40",
  "hodometroNaData": 45000,
  "status": "concluido"
}
```

---

## 🛡️ Segurança

- ✅ Senhas criptografadas com SHA256
- ✅ Sessão armazenada localmente
- ✅ Logout automático por inatividade
- ✅ Validação de permissões em tempo real
- ✅ Proteção contra acesso sem autenticação

---

## 📂 Estrutura de Arquivos

```
Viaturas-prf/
├── index.html      (HTML + CSS)
├── app.js          (JavaScript completo)
└── README.md       (Este arquivo)
```

---

## 💡 Dicas

1. **Menu desabilitado** = Você não tem permissão (cargo insuficiente)
2. **Sessão expirada?** = Muito tempo sem atividade, clique "Permanecer Logado"
3. **Criar admin?** = Crie conta e altere o cargo em localStorage
4. **Resetar tudo?** = Limpe localStorage (DevTools → Application → Storage)

---

## 📞 Suporte

Qualquer dúvida sobre as funcionalidades, verifique o `app.js` ou o console do navegador (F12) para mensagens de debug.

---

**Versão:** 1.0  
**Última atualização:** 24 de Março de 2026
