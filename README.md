# StudyOS - Plataforma de Gestão de Estudos e Gamificação

O **StudyOS** é um sistema para gerenciamento e gamificação da rotina de estudos, integrando um backend em Spring Boot e um frontend moderno em React, Vite e Tailwind CSS.

---

## 🏗️ Arquitetura do Projeto

O repositório é organizado em dois módulos principais:

* **`back/studyos/`**: API REST desenvolvida em **Java 17 / 21** e **Spring Boot 4.x**, utilizando JPA/Hibernate, MySQL e autenticação JWT.
* **`front/`**: Aplicação web desenvolvida em **React 19**, **TypeScript**, **Vite** e **Tailwind CSS 4**.

---

## 🚀 Como Executar

### 1. Backend (`back/studyos`)

1. Navegue até a pasta do backend:
   ```bash
   cd back/studyos
   ```
2. Crie seu arquivo de variáveis de ambiente com base no modelo:
   ```bash
   cp .env.example .env
   ```
   *Configure suas credenciais do MySQL e a chave secreta JWT.*
3. Execute a aplicação usando o Maven Wrapper:
   ```bash
   # Windows
   .\mvnw.cmd spring-boot:run

   # Linux/macOS
   ./mvnw spring-boot:run
   ```
4. A API estará disponível em: `http://localhost:8080` (endpoints sob `/api/v1`).

---

### 2. Frontend (`front`)

1. Navegue até a pasta do frontend:
   ```bash
   cd front
   ```
2. Crie o arquivo de variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
3. Instale as dependências:
   ```bash
   npm install
   # ou
   pnpm install
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. O aplicativo estará acessível em `http://localhost:5173`.

---

## 🧪 Executando Testes

### Backend
```bash
cd back/studyos
.\mvnw.cmd test
```
*Os testes utilizam banco H2 em memória, sem necessidade de banco MySQL ativo.*

### Frontend
```bash
cd front
npm run build
```

---

## 🔒 Segurança e Boas Práticas

* Nunca versione arquivos `.env` ou credenciais em texto claro.
* Sempre utilize o `.env.example` para documentar novas variáveis de ambiente necessárias.
