# 🧪 Guia de Teste - Módulo de Serviços

## Pré-requisitos
✅ Sistema estar rodando em `index.html`
✅ Estar logado com permissão "gerenciar_veiculos" (Admin ou Operador)
✅ Ter algumas viaturas cadastradas

---

## ✅ Teste 1: Acessar Menu de Serviços

1. **Localizar o menu**
   - Procure pelo item "🔧 Serviços" no menu lateral
   - Deve estar entre "🏍️ Motoristas" e "📦 Missões"

2. **Clicar no menu**
   - Clique em "Serviços"
   - Esperar carregamento da página

3. **Verificar estrutura**
   - ✅ Deve aparecer um card com título "Gestão de Serviços e Manutenção"
   - ✅ Deve haver 2 abas: "Serviços em Andamento" e "Histórico de Serviços"
   - ✅ Primeira aba deve estar ativa (destacada em azul)

---

## ✅ Teste 2: Serviços em Andamento (Tab 1)

### 2.1 Preparar uma viatura
1. Vá para menu "🚗 Veículos"
2. Selecione uma viatura
3. Mude o status para **"Em Manutenção"**
4. Salve as alterações
5. Volte para menu "Serviços"

### 2.2 Verificar exibição
- ✅ A viatura escolhida deve aparecer em "Serviços em Andamento"
- ✅ Deve mostrar: Placa, Marca, Modelo
- ✅ Deve exibir 2 colunas:
  - Esquerda: "Pendentes" (0 serviços inicialmente)
  - Direita: "Concluídos" (0 serviços)

### 2.3 Testar formulário de adição
1. Na seção "Adicionar Novo Serviço", preencha:
   - **Data do Serviço**: Selecione uma data (ex: hoje ou ontem)
   - **Tipo de Serviço**: Selecione "🛢️ Troca de Óleo"
   - **Quilometragem**: 45000 (ou qualquer valor)
   - **Descrição**: "Óleo sintético 0W-40"

2. Clique em "Adicionar"

3. ✅ Verificações:
   - Serviço deve aparecer na coluna "Pendentes" (esquerda)
   - Deve ter borda vermelha
   - Deve mostrar: Tipo, Data, Km, Descrição
   - Deve ter botão "Marcar Concluído"

### 2.4 Testar conclusão de serviço
1. Clique em "✓ Marcar Concluído" do serviço pendente
2. ✅ Verificações:
   - Serviço deve sair da coluna esquerda
   - Serviço deve aparecer na coluna direita "Concluídos"
   - Deve ter borda verde

### 2.5 Testar conclusão de manutenção
1. Quando todos os serviços se forem concluído:
   - ✅ Botão "Manutenção Concluída - Voltar para Disponível" deve aparecer
   - Position: abaixo do formulário

2. Clique no botão "Manutenção Concluída"
3. ✅ Verificações:
   - Viatura deve sair da lista de "Serviços em Andamento"
   - Status da viatura deve voltar para "Disponível"
   - Serviços devem ser transferidos para histórico

---

## ✅ Teste 3: Filtros - Histórico de Serviços (Tab 2)

### 3.1 Acessar aba
1. Clique em "📜 Histórico de Serviços"
2. ✅ Deve aparecer:
   - Seção de filtros (com bordinha amarela-esquerda)
   - Campos: Data Inicial, Data Final, Placa
   - Botões: "Filtrar" e "Limpar"
   - Histórico de serviços abaixo

### 3.2 Verificar histórico
1. Se foram concluído serviços na Tab 1:
   - ✅ Deve aparecer viatura com serviços concluídos
   - ✅ Em formato de tabela com colunas: Data, Tipo, Km, Detalhes
   - ✅ Tipo deve ter badge com cor apropriada

### 3.3 Testar filtro por data
1. Preencha "Data Inicial" com uma data anterior
2. Preencha "Data Final" com uma data futura
3. Clique em "Filtrar"
4. ✅ Verificações:
   - Resultados devem ser atualizados
   - Apenas serviços nesse período aparecem

### 3.4 Testar filtro por placa
1. Preencha "Placa da Viatura" com a placa testada (ex: ABC-1234)
2. Clique em "Filtrar"
3. ✅ Verificações:
   - Apenas serviços dessa placa aparecem
   - Funciona com maiúsculas e minúsculas

### 3.5 Testar botão "Limpar"
1. Com filtros preenchidos, clique "Limpar"
2. ✅ Verificações:
   - Campos ficam vazios
   - Todos os serviços voltam a aparecer

---

## ✅ Teste 4: Múltiplas Viaturas

### 4.1 Mudar outra viatura para manutenção
1. Vá para "Veículos" e escolha outra viatura
2. Mude status para "Em Manutenção"
3. Volte para "Serviços"

### 4.2 Adicionar serviços diferentes
1. Em "Serviços em Andamento", agora devem aparecer 2 viaturas
2. Para a segunda viatura, adicione um serviço tipo "🔧 Reparo"
3. Adicione outro tipo "🔍 Inspeção"
4. ✅ Cada tipo deve ter badge colorida diferente

---

## ⚠️ Possíveis Problemas & Soluções

| Problema | Causa | Solução |
|----------|-------|---------|
| Tabs não alternarem | Bootstrap JS não carregou | Abrir console (F12) e verificar erros |
| Dados sumirem após refresh | Erro no localStorage | Verificar console para erros de armazenamento |
| Formulário não adiciona | ID incorreto | Verificar console para erro JavaScript |
| Filtro não funciona | Problema na comparação de data | Verificar formato de data (YYYY-MM-DD) |
| Botão "Manutenção Concluída" não aparece | Lógica de contagem errada | Garantir que todos os serviços estão "concluido" |

---

## 🎓 Resumo do Fluxo Completo

```
1. Veículo → Em Manutenção
   ↓
2. Menu Serviços → Serviços em Andamento
   ↓
3. Adicionar Serviço → Aparece em Pendentes
   ↓
4. Marcar Concluído → Move para Concluídos
   ↓
5. Manutenção Concluída → Voltar para Disponível
   ↓
6. Menu Serviços → Histórico
   ↓
7. Visualizar com Filtros
```

---

## ✅ Checklist Final

- [ ] Menu "Serviços" acessível
- [ ] Tabs Bootstrap funcionando (mudança de abas)
- [ ] Viatura em manutenção aparece em "Serviços em Andamento"
- [ ] Adicionar serviço funciona
- [ ] Marcar concluído funciona
- [ ] Botão "Manutenção Concluída" aparece quando devido
- [ ] Voltar para "Disponível" funciona
- [ ] Histórico exibe serviços concluídos
- [ ] Filtro por data funciona
- [ ] Filtro por placa funciona
- [ ] Botão "Limpar" reinicia filtros
- [ ] Dados persistem após refresh (localStorage)
- [ ] Múltiplas viaturas funcionam
- [ ] Badges coloridas aparecem corretamente

---

**Última atualização**: Março 2026
**Versão**: 1.0 - Sistema de Serviços
