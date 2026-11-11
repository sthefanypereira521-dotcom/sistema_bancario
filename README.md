# Sistema bancario

API REST para um sistema bancario, com interface web para cadastro, login, consulta de saldo e movimentacoes.

## Tecnologias

- Python, FastAPI e SQLite
- Autenticacao JWT
- React, TypeScript e Vite

## Requisitos

- Python e Poetry
- Node.js e npm

## Como rodar localmente

### 1. Instale as dependencias da API

Na pasta raiz do projeto, rode:

```powershell
poetry install --no-root
```

### 2. Inicie a API

Ainda na pasta raiz, rode:

```powershell
poetry run uvicorn main:app --reload --host 127.0.0.1
```

Deixe esse terminal aberto. A API fica em `http://127.0.0.1:8000` e a documentacao interativa em `http://127.0.0.1:8000/docs`.

### 3. Inicie a interface web

Abra um segundo terminal e rode:

git clone https://github.com/sthefanypereira521-dotcom/sistema_bancario
cd sistema-bancario

O Vite mostra o endereco local no terminal; normalmente e `http://127.0.0.1:5173`. Mantenha os dois terminais abertos enquanto usa o sistema. Para iniciar novamente, `npm install` so precisa ser executado na primeira vez ou quando as dependencias mudarem; depois, use `npm run dev -- --host 127.0.0.1`.

Por padrao, o frontend acessa a API em `http://127.0.0.1:8000`. Para apontar para outro endereco, defina `VITE_API_URL` no ambiente do Vite.

## Cadastro e login

Na interface web, selecione **Criar cadastro** e informe nome, e-mail e senha. O sistema cria o perfil e uma conta corrente com saldo inicial zero. Depois, entre com o mesmo e-mail e senha.

As rotas correspondentes sao `POST /auth/cadastro` e `POST /auth/login`. As rotas protegidas usam o token JWT no cabecalho:

```text
Authorization: Bearer <seu_token>
```

## Testar com o Insomnia

Importe `insomnia_sistema_bancario_collection.yaml` no Insomnia para acessar os exemplos de requisicoes. Tambem e possivel testar as rotas pela documentacao em `http://127.0.0.1:8000/docs`.

## Autora

Sthefany - desenvolvedora backend em formacao.




##  Autora

***Sthefany***  
Desenvolvedora Backend em formação  
[GitHub](https://github.com/sthefanypereira521-dotcom/sistema_bancario) • [LinkedIn](https://www.linkedin.com/in/sthefany-pereira-dev)
