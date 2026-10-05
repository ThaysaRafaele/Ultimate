export const meta = {
  name: 'executar-issue',
  description: 'Executa uma issue de docs/issues/ (modelo de dados → implementação → revisão) com subagentes',
  whenToUse: 'Quando o usuário pedir para executar/implementar uma issue de docs/issues/. Args: { issueArquivo: "docs/issues/<epico>.md", issueNumero: N, base: "." (default; raiz do projeto relativa ao cwd) }',
  phases: [
    { title: 'Modelo de dados', detail: 'MER + drizzle-from-mermaid-erd: lib/schema.ts + migration gerada (não aplicada); pulada se a issue não toca no banco' },
    { title: 'Implementação', detail: 'Vitest (se faltar) → regra pura → repo → rota → tela → teste; lint/tsc/test/build' },
    { title: 'Revisão', detail: 'critérios da issue + convenções do CLAUDE.md; correção se reprovado' },
  ],
}

const issueArquivo = args?.issueArquivo
const issueNumero = args?.issueNumero
if (!issueArquivo || !issueNumero) {
  throw new Error('args obrigatórios: { issueArquivo, issueNumero }')
}

// Raiz do projeto relativa ao cwd. Default '.' = agente iniciado dentro da pasta do projeto.
const BASE = args?.base ?? '.'
const ISSUE = `issue ${issueNumero} de ${BASE}/${issueArquivo}`
const FONTES = `Fontes canônicas (nesta ordem de precedência):
1. ${BASE}/${issueArquivo}: bloco "Contexto/Decisões" da issue ${issueNumero} (fonte primária).
2. ${BASE}/CONTEXT.md: glossário e "A definir".
3. ${BASE}/docs/adr/: decisões. ${BASE}/docs/dominio/estados-*.mmd: máquinas de estado.
4. ${BASE}/docs/entities/MER.md: modelo de dados (se existir) e ${BASE}/lib/schema.ts.
5. Protótipo citado na issue (${BASE}/_prototype_extracted.html): DESATUALIZADO, só inspiração visual; NÃO copiar o código. Divergência protótipo × issue/ADR/código → issue/ADR/código vencem.
Convenções e preferências: ${BASE}/CLAUDE.md. PROIBIDO git commit/push. Não adicionar serviço ou dependência paga.`

phase('Modelo de dados')
const modelo = await agent(
  `Você executa a fase de MODELO DE DADOS da ${ISSUE}.
${FONTES}
1. Leia a issue. Se a task 1 ("Modelo de dados") diz "não se aplica" e a issue não exige tabela/coluna nova, NÃO altere nada e responda exatamente "SEM_MUDANCA_DE_MODELO" seguido de uma linha de justificativa.
2. Caso contrário, ANTES de editar, escreva o bloco "### Decisões de modelo" dentro da issue ${issueNumero} (decisão + fonte CONTEXT/ADR + mínimo 2 alternativas descartadas com motivo + o que acontece com as linhas já existentes no banco).
3. Atualize ${BASE}/docs/entities/MER.md (crie se não existir) no dialeto de ${BASE}/.claude/skills/drizzle-from-mermaid-erd/references/mermaid-erd-spec.md.
4. Siga RIGOROSAMENTE ${BASE}/.claude/skills/drizzle-from-mermaid-erd/SKILL.md para editar ${BASE}/lib/schema.ts e rodar "npm run db:generate". Leia o SQL gerado em ${BASE}/drizzle/ e confira que só contém o planejado.
5. PROIBIDO: "npm run db:migrate", "drizzle-kit push" ou qualquer SQL direto no banco. Se o drizzle-kit fizer pergunta interativa, ou se o SQL tiver DROP/RENAME/ALTER TYPE não planejado, PARE e retorne começando com "BLOQUEADO:" e a pergunta para o usuário.
6. Transição de estado nova citada na issue: atualize ${BASE}/docs/dominio/estados-<entidade>.mmd.
7. Rode "npx tsc --noEmit".
Retorne: tabelas/colunas alteradas, arquivo de migration gerado, resumo do SQL, resultado do tsc e o texto do bloco de decisões.`,
  { label: `modelo:issue-${issueNumero}`, phase: 'Modelo de dados' }
)

if (/^\s*BLOQUEADO:/m.test(modelo)) {
  return { modelo, implementacao: null, revisao: null, correcao: null }
}

phase('Implementação')
const impl = await agent(
  `Você executa a fase de IMPLEMENTAÇÃO da ${ISSUE}.
${FONTES}
Resultado da fase de modelo de dados:
${modelo}

Siga ${BASE}/CLAUDE.md. Execute as tasks da issue na ordem fixa, pulando as marcadas "não se aplica":
0. Vitest, se "vitest" não estiver em ${BASE}/package.json: siga ${BASE}/.claude/skills/decompor-epico/references/vitest-setup.md (esta é a única dependência npm autorizada sem pedido explícito).
2. Regra pura em lib/<x>-validation.ts ou lib/<x>-calc.ts: sem import de @/lib/db; retorna mensagem de erro em PT-BR ou null.
3. Repo em lib/<x>-repo.ts (Drizzle, padrão dos repos existentes).
4. Rota em app/api/<x>/route.ts: valida com a regra pura, erro como NextResponse.json({ error }, { status }), chama o repo.
5. Tela: app/<rota>/page.tsx (Server Component lendo via repo) + components/<X>.tsx ("use client", fetch na rota, router.refresh()). Item em lib/nav-items.ts se for área nova. Capriche na UI/UX: hierarquia visual clara, estados carregando/vazio/erro, feedback após salvar, confirmação em ação destrutiva, microcopy amigável em PT-BR, responsivo com max-md:, tokens visuais de app/globals.css.
6. Testes Vitest (lib/<x>.test.ts) dos pontos sensíveis citados na issue.
Leia arquivos similares existentes antes de criar novos. Não adicione outras dependências npm.
Ao final rode em ${BASE}: "npm run lint", "npx tsc --noEmit", "npm test", "npm run build". Corrija falhas.
Retorne: arquivos criados/alterados e o resultado de cada comando.`,
  { label: `impl:issue-${issueNumero}`, phase: 'Implementação' }
)

phase('Revisão')
const revisao = await agent(
  `Você REVISA a entrega da ${ISSUE}. Não corrija nada; só aponte.
${FONTES}
Modelo de dados:
${modelo}
Implementação:
${impl}

Verifique:
- cada critério de aceitação da issue está coberto (cite onde);
- se houve mudança de modelo: bloco "### Decisões de modelo" na issue; MER.md, lib/schema.ts e a migration em drizzle/ batem entre si; migration NÃO foi aplicada; linhas existentes tratadas como a issue diz;
- regra pura sem import de @/lib/db e com teste Vitest dos casos sensíveis; validação também no servidor (não só no componente);
- rota que muda estado corresponde a uma transição de docs/dominio/estados-*.mmd;
- termos do CONTEXT.md usados de forma consistente na UI e no código;
- convenções do CLAUDE.md (nomes, camadas, mensagens em PT-BR, nomes de atleta em maiúsculas onde se aplica);
- lint, tsc, test e build passaram (conforme o relatório de implementação);
- UI/UX: tela intuitiva e consistente com o resto do app; estados carregando/vazio/erro; feedback após salvar; confirmação em ação destrutiva; boa no celular (max-md:); textos claros em PT-BR;
- nenhuma dependência ou serviço pago adicionado; nenhum commit feito.
Retorne lista de achados no formato "arquivo:linha | severidade | problema | correção" ou "APROVADO" se nada bloqueante.`,
  { label: `revisao:issue-${issueNumero}`, phase: 'Revisão' }
)

let correcao = null
if (!/^\s*APROVADO/m.test(revisao)) {
  correcao = await agent(
    `Corrija os achados da revisão da ${ISSUE}:
${revisao}

Siga ${BASE}/CLAUDE.md e, se tocar no modelo, ${BASE}/.claude/skills/drizzle-from-mermaid-erd/SKILL.md (nunca aplicar migration). Re-rode "npm run lint", "npx tsc --noEmit", "npm test" e "npm run build". Retorne o que corrigiu e o resultado dos comandos.`,
    { label: `correcao:issue-${issueNumero}`, phase: 'Revisão' }
  )
}

const commits = await agent(
  `NÃO faça commit nem push. Rode "git status --short" em ${BASE} e, considerando a ${ISSUE}, proponha os grupos de arquivos que podem ser commitados juntos (ex.: modelo de dados + migration; regra pura + teste; rota + tela; docs) e, para cada grupo, uma mensagem de commit no padrão do repo (feat:/fix:/docs:/chore:, em português). Retorne só a lista: grupo, arquivos, mensagem.`,
  { label: `commits:issue-${issueNumero}`, phase: 'Revisão' }
)

return { modelo, implementacao: impl, revisao, correcao, commits }
