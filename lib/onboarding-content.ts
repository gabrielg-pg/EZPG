export type OnboardingTab = "brasil" | "global"

export type OnboardingSeedMessage = {
  position: number
  title: string
  body: string
  isInternal: boolean
}

// Conteúdo padrão dos scripts de onboarding.
// Usado apenas para popular o banco na primeira vez (seed).
// Após isso, o texto vive no banco e pode ser editado pela interface.
//
// Formatação: uma linha em branco separa blocos/parágrafos (para respiro ao
// colar no WhatsApp); linhas consecutivas (listas, credenciais) ficam juntas.

export const ONBOARDING_BRASIL: OnboardingSeedMessage[] = [
  {
    position: 1,
    title: "MENSAGEM 1 — BOAS-VINDAS E CADASTRO",
    isInternal: false,
    body: `Olá, [Nome]! Seja bem-vindo(a) à Pro Growth Global.
Meu nome é Luiz Gabriel e serei o responsável pelo seu onboarding daqui pra frente.

Para darmos início, preciso de algumas informações para o seu cadastro:

Nome completo
CPF
Endereço completo
Cidade e Estado
Data de nascimento

Essas informações serão utilizadas exclusivamente para a criação das contas da sua operação.`,
  },
  {
    position: 2,
    title: "MENSAGEM 2 — NOME DA MARCA",
    isInternal: false,
    body: `Muito obrigado, [Nome]. Tudo registrado. ✅

Agora, sobre a sua marca, você já tem algum nome em mente ou prefere que eu traga opções para você analisar?`,
  },
  {
    position: 3,
    title: "MENSAGEM 2B — SE QUISER OPÇÕES",
    isInternal: false,
    body: `Perfeito.

Estou realizando uma pesquisa agora e em breve trago 10 nomes criativos e únicos para você avaliar com calma.`,
  },
  {
    position: 4,
    title: "MENSAGEM 3 — ENTREGA DOS NOMES",
    isInternal: false,
    body: `[Nome], segue o documento com as 10 opções de nome para a sua marca.

Analise com calma e me diz qual faz mais sentido para o que você quer construir. Se quiser comentar sobre algum, estou aqui.`,
  },
  {
    position: 5,
    title: "MENSAGEM 4A — CONFIRMAÇÃO DO NOME",
    isInternal: false,
    body: `Ótima escolha.

[Nome Escolhido] transmite exatamente o posicionamento que vamos construir juntos. Vamos seguir com ele.`,
  },
  {
    position: 6,
    title: "MENSAGEM 5 — CRIAÇÃO DO E-MAIL",
    isInternal: false,
    body: `Próximo passo: criar um e-mail no Gmail para a sua marca.

Siga esse formato:
📧 [nomedamarca]@gmail.com

Caso já esteja em uso, tente uma dessas variações:
[nomedamarca]2026@gmail.com
[nomedamarca]store@gmail.com
[nomedamarca]oficial@gmail.com

Esse e-mail será o centro da sua operação, todas as contas serão vinculadas a ele.

Após criar, me envia o e-mail e a senha para eu registrar e seguirmos.`,
  },
  {
    position: 7,
    title: "MENSAGEM 6 — CONFIRMAÇÃO E CRIAÇÃO DAS CONTAS",
    isInternal: false,
    body: `Perfeito, [Nome]. ✅

Vou iniciar agora a criação de todas as contas da sua operação. Em breve retorno com as confirmações.`,
  },
  {
    position: 8,
    title: "[INTERNO — Gabriel cria as contas nessa ordem:]",
    isInternal: true,
    body: `Shopify → DSers → AliExpress → Yampi → Hostinger → Appmax → Instagram

Shopify sempre pelo link de afiliado: https://shopify.pxf.io/0ZkJWJ`,
  },
  {
    position: 9,
    title: "MENSAGEM 7 — ATIVAÇÃO DA SHOPIFY",
    isInternal: false,
    body: `[Nome], as contas foram criadas.

Agora preciso que acesse a sua Shopify pelo link abaixo e faça o login:
🔗 https://www.shopify.com/br/store-login
👤 Login: [inserir]
🔒 Senha: [inserir]

Dentro da conta, assine o Plano Basic por $1 USD com o seu cartão de crédito internacional.

Qualquer dificuldade, me chama aqui.`,
  },
  {
    position: 10,
    title: "MENSAGEM 8 — DOMÍNIO",
    isInternal: false,
    body: `Tudo certo com a Shopify. ✅

Agora vamos garantir o domínio da sua marca.
🌐 Domínio: [inserir]
💳 Valor: R$39,99 / pagamento único anual

Segue o código PIX abaixo. Assim que realizar o pagamento, me confirma aqui.`,
  },
  {
    position: 11,
    title: "MENSAGEM 9 — VALIDAÇÃO APPMAX",
    isInternal: false,
    body: `Pagamento confirmado. ✅

Último passo técnico: validar a sua conta no gateway de pagamento, é por lá que você vai receber o dinheiro das vendas.

Acesse com as credenciais abaixo:
🔗 https://login.appmax.com.br/auth/login
👤 Login: [inserir]
🔒 Senha: [inserir]

Ao entrar, um código de verificação será enviado para o seu e-mail, deixe-o aberto para confirmar. Em seguida, aparecerá um QR Code para finalizar a validação pelo celular.

É um processo padrão de segurança, igual ao de qualquer instituição financeira.

Qualquer dúvida, estou aqui.`,
  },
  {
    position: 12,
    title: "MENSAGEM 10 — WHATSAPP DA LOJA",
    isInternal: false,
    body: `[Nome], para finalizarmos as configurações, você tem um número de WhatsApp para a sua loja?

Esse será o contato exibido para os seus clientes. Caso ainda não tenha um número exclusivo, podemos usar o seu pessoal temporariamente.`,
  },
  {
    position: 13,
    title: "MENSAGEM 11 — ENCERRAMENTO DO ONBOARDING",
    isInternal: false,
    body: `Perfeito, [Nome]. ✅

Tudo configurado. A partir de agora o nosso time assume e inicia a criação da sua identidade visual.

Em breve você receberá a logotipo aqui para avaliação.

Qualquer dúvida que surgir, estou à disposição. 💜`,
  },
  {
    position: 14,
    title: "[INTERNO — PÓS ONBOARDING:]",
    isInternal: true,
    body: `1. Criar pasta no Drive de Branding conforme plano contratado
2. Criar pipeline na Zona de Execução com todas as informações, marcar Luis e Alisson
3. Criar painel do cliente no PG Dash`,
  },
  {
    position: 15,
    title: "MENSAGEM 12 — ENTREGA DA IDENTIDADE VISUAL",
    isInternal: false,
    body: `[Nome], a sua identidade visual está pronta.

Criamos algo que acreditamos refletir com precisão o posicionamento do seu negócio.
🔗 [link da loja]

Acesse, avalie com calma e nos informe se está tudo conforme esperado ou se há algo que queira ajustar.`,
  },
  {
    position: 16,
    title: "MENSAGEM 13 — INSTAGRAM",
    isInternal: false,
    body: `[Nome], agora vamos configurar o Instagram da sua loja.

Crie uma conta com o nome da marca e me envie o login e a senha para realizarmos as configurações.`,
  },
  {
    position: 17,
    title: "MENSAGEM 14 — ENTREGA FINAL E ACESSO AO PG DASH",
    isInternal: false,
    body: `[Nome], a sua operação está estruturada e pronta. 🎉

O seu PG Dash já está ativo — é a sua central de operação, onde você acompanha vendas, lucro e acessa todos os dados da sua loja em um só lugar.

Antes de entrar, assista ao tutorial abaixo. Vai tornar tudo muito mais claro:
📹 https://www.loom.com/share/4a224b0849fd4c659b99acbff5022e40

🔐 Acesso:
🌐 www.pgdash.com.br
👤 Login: [inserir]
🔒 Senha: [inserir]

Qualquer dúvida, estamos aqui. 💜`,
  },
  {
    position: 18,
    title: "[INTERNO — MENSAGEM DE GRUPO APÓS LOJA FINALIZADA, ENTREGUE E APROVADA:]",
    isInternal: true,
    body: `Olá [nome] 🎉

A sua operação está estruturada e o seu PG Dash já está ativo!

O PG Dash é a sua central de operação, onde gere tudo o que acontece na sua loja, desde vendas e lucro e até mesmo, logins e senhas da sua operação para fácil acesso.

📹 Tutorial de acesso: https://www.loom.com/share/4a224b0849fd4c659b99acbff5022e40

🔐 Dados de acesso:
Site: www.pgdash.com.br
Login: contatoteresbrasil@gmail.com
Senha: #Teste76

Assiste ao tutorial antes de entrar, vai tornar tudo muito mais claro! 😊

Qualquer dúvida estou aqui. 💜`,
  },
]

export const ONBOARDING_GLOBAL: OnboardingSeedMessage[] = [
  {
    position: 1,
    title: "MENSAGEM 1 — BOAS-VINDAS E CADASTRO",
    isInternal: false,
    body: `Olá, [Nome]! Seja bem-vindo(a) à Pro Growth Global.
Meu nome é Luiz Gabriel e serei o responsável pelo seu onboarding daqui pra frente.

Para darmos início, preciso de algumas informações para o seu cadastro:

Nome completo
CPF
Endereço completo
Cidade e Estado
Data de nascimento
Número do passaporte (se tiver)

Essas informações serão utilizadas exclusivamente para a criação das contas da sua operação.`,
  },
  {
    position: 2,
    title: "MENSAGEM 2 — NOME DA MARCA",
    isInternal: false,
    body: `Muito obrigado, [Nome]. Tudo registrado. ✅

Agora, sobre a sua marca, você já tem algum nome em mente ou prefere que eu traga opções para você analisar?`,
  },
  {
    position: 3,
    title: "MENSAGEM 2B — SE QUISER OPÇÕES",
    isInternal: false,
    body: `Perfeito.

Estou realizando uma pesquisa agora e em breve trago 10 nomes criativos e únicos para você avaliar com calma.`,
  },
  {
    position: 4,
    title: "MENSAGEM 3 — ENTREGA DOS NOMES",
    isInternal: false,
    body: `[Nome], segue o documento com as 10 opções de nome para a sua marca.

Analise com calma e me diz qual faz mais sentido para o que você quer construir. Se quiser comentar sobre algum, estou aqui.`,
  },
  {
    position: 5,
    title: "MENSAGEM 4A — CONFIRMAÇÃO DO NOME",
    isInternal: false,
    body: `Ótima escolha.

[Nome Escolhido] transmite exatamente o posicionamento que vamos construir juntos. Vamos seguir com ele.`,
  },
  {
    position: 6,
    title: "MENSAGEM 5 — CRIAÇÃO DO E-MAIL",
    isInternal: false,
    body: `Próximo passo: criar um e-mail no Gmail para a sua marca.

Siga esse formato:
📧 [nomedamarca]@gmail.com

Caso já esteja em uso, tente uma dessas variações:
[nomedamarca]2026@gmail.com
[nomedamarca]store@gmail.com
[nomedamarca]oficial@gmail.com

Esse e-mail será o centro da sua operação, todas as contas serão vinculadas a ele.

Após criar, me envia o e-mail e a senha para eu registrar e seguirmos.`,
  },
  {
    position: 7,
    title: "MENSAGEM 6 — CONFIRMAÇÃO E CRIAÇÃO DAS CONTAS",
    isInternal: false,
    body: `Perfeito, [Nome]. ✅

Vou iniciar agora a criação de todas as contas da sua operação. Em breve retorno com as confirmações.`,
  },
  {
    position: 8,
    title: "[INTERNO — Gabriel cria/ativa as contas nessa ordem:]",
    isInternal: true,
    body: `Shopify → Instagram → Ativar Shopify Payments

Shopify sempre pelo link de afiliado: https://shopify.pxf.io/0ZkJWJ`,
  },
  {
    position: 9,
    title: "MENSAGEM 7 — ATIVAÇÃO DA SHOPIFY",
    isInternal: false,
    body: `[Nome], as contas foram criadas.

Agora preciso que acesse a sua Shopify pelo link abaixo e faça o login:
🔗 https://www.shopify.com/br/store-login
👤 Login: [inserir]
🔒 Senha: [inserir]

Dentro da conta, assine o Plano Basic por $1 USD com o seu cartão de crédito.

Qualquer dificuldade, me chama aqui.`,
  },
  {
    position: 10,
    title: "MENSAGEM 8 — DOMÍNIO",
    isInternal: false,
    body: `Tudo certo com a Shopify. ✅

Agora vamos garantir o domínio da sua marca.
🌐 Domínio: [inserir]
💳 Valor: R$49,99 / pagamento único anual

Segue o código PIX abaixo. Assim que realizar o pagamento, me confirma aqui.`,
  },
  {
    position: 11,
    title: "MENSAGEM 8.1 — E-MAIL PROFISSIONAL",
    isInternal: false,
    body: `Perfeito. ✅

Agora vamos contratar o e-mail profissional da sua loja.
📧 E-mail: [inserir]
💳 Valor (12 meses): [inserir]

Segue o código PIX abaixo. Assim que realizar o pagamento, me confirma aqui.`,
  },
  {
    position: 12,
    title: "MENSAGEM 9 — INSTAGRAM",
    isInternal: false,
    body: `Pagamentos confirmados. ✅

Agora vamos configurar as redes sociais da sua loja.

Crie uma conta no Instagram com o nome da sua marca, pode usar o mesmo e-mail do Gmail que criamos anteriormente.

Após criar, me envia o login e a senha para realizarmos as configurações.`,
  },
  {
    position: 13,
    title: "MENSAGEM 10 — BUSINESS MANAGER",
    isInternal: false,
    body: `Perfeito. ✅

Próximo passo: precisarei do login e senha do seu Facebook para acessar o Business Manager e configurar o portfólio de anúncios da sua loja.

Assim que entrar, já deixarei salvo em nosso sistema interno para nosso time estar configurando toda a business manager.

Me envia as credenciais aqui para seguirmos.`,
  },
  {
    position: 14,
    title: "MENSAGEM 11 — DOCUMENTOS SHOPIFY PAYMENTS E FINALIZAÇÃO DE ONBOARDING",
    isInternal: false,
    body: `Tudo configurado. ✅

Agora preciso que você envie dois documentos para ativarmos o Shopify Payments da sua loja:

1. Foto nítida do passaporte: todas as informações visíveis.
2. Comprovante de residência: conta de energia, água ou internet, com nome e endereço claramente visíveis.

Esses documentos são exigidos pela Shopify para liberar o gateway de pagamento internacional.

Assim que receber, o nosso time assume e inicia a criação da sua identidade visual. Em breve você receberá a logotipo aqui para avaliação. 💜`,
  },
  {
    position: 15,
    title: "MENSAGEM 12 — ENTREGA DA IDENTIDADE VISUAL",
    isInternal: false,
    body: `[Nome], a sua identidade visual está pronta.

Criamos algo que acreditamos refletir com precisão o posicionamento do seu negócio.
🔗 [link da loja]

Acesse, avalie com calma e nos informe se está tudo conforme esperado ou se há algo que queira ajustar.`,
  },
  {
    position: 16,
    title: "MENSAGEM 13 — ENTREGA FINAL E ACESSO AO PG DASH",
    isInternal: false,
    body: `[Nome], a sua operação está estruturada e pronta. 🎉

O seu PG Dash já está ativo, é a sua central de operação, onde você acompanha vendas, lucro e acessa todos os dados da sua loja em um só lugar.

Antes de entrar, assista ao tutorial abaixo. Vai tornar tudo muito mais claro:
📹 https://www.loom.com/share/4a224b0849fd4c659b99acbff5022e40

🔐 Acesso:
🌐 www.pgdash.com.br
👤 Login: [inserir]
🔒 Senha: [inserir]

Qualquer dúvida, estamos aqui. 💜`,
  },
  {
    position: 17,
    title: "[INTERNO — PÓS ONBOARDING:]",
    isInternal: true,
    body: `1. Criar pasta no Drive de Branding conforme plano contratado
2. Criar pipeline na Zona de Execução com todas as informações — marcar Luis e Alisson

Exemplo de mensagem interna no grupo:

NEW PROJECT 💜
Marca: [Nome da Marca]
Nicho: [Nicho]
Mercado: [País]
Plano: [Plano]
Produtos: [Quantidade]
Grupo: [Nome] | [Número]

Disponível já na Zona de Execução.
🔗 Link Drive: [inserir]`,
  },
]

export const ONBOARDING_SEED: Record<OnboardingTab, OnboardingSeedMessage[]> = {
  brasil: ONBOARDING_BRASIL,
  global: ONBOARDING_GLOBAL,
}
