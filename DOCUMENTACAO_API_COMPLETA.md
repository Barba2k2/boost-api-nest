# 📚 Documentação Técnica Completa da API - Sistema de Pontuação de Streamers

## 📋 Visão Geral

Esta API foi desenvolvida para gerenciar um sistema completo de pontuação para streamers, oferecendo funcionalidades tanto para administração quanto para acesso público. O sistema permite registro de usuários, autenticação, gestão de streamers, controle de pontuação e geração de relatórios detalhados.

### 🔗 Informações Técnicas
- **Framework:** NestJS com TypeScript
- **Banco de Dados:** PostgreSQL com Prisma ORM
- **Autenticação:** JWT (JSON Web Tokens)
- **Cache:** Redis para otimização de performance
- **Documentação:** Swagger/OpenAPI integrado
- **Base URL:** `http://localhost:3000` (desenvolvimento)

---

## 🔐 Autenticação

### **Bearer Token (JWT)**
Para endpoints privados, use o header:
```
Authorization: Bearer <access_token>
```

### **Tipos de Usuário**
- `admin`: Acesso total ao sistema
- `user`: Usuário padrão com streamer associado
- `guest`: Acesso limitado

---

# 🎯 ENDPOINTS DA API

## 🌐 **ENDPOINTS PÚBLICOS** (Sem Autenticação)

### 🔑 **AUTENTICAÇÃO** (`/auth`)

### **1. Registrar Usuário**

**Endpoint:** `POST /auth/register`  
**Autenticação:** 🌐 Público  
**Rate Limit:** Sim (tipo: create)

**Request Body:**
```json
{
  "fullName": "João Silva",
  "nickname": "joaosilva",
  "email": "joao@example.com",
  "password": "MinhaSenh@123",
  "confirmPassword": "MinhaSenh@123",
  "role": "user"
}
```

**Response (201):**
```json
{
  "id": 1,
  "fullName": "João Silva",
  "nickname": "joaosilva",
  "email": "joao@example.com",
  "role": "user",
  "lastLogin": null,
  "createdAt": "2025-01-07T00:00:00.000Z",
  "updatedAt": "2025-01-07T00:00:00.000Z"
}
```

**Códigos de Status:**
- `201` - Usuário criado com sucesso
- `409` - Usuário já existe (email/nickname duplicado)
- `400` - Dados inválidos

---

### **2. Login**

**Endpoint:** `POST /auth/login`  
**Autenticação:** 🌐 Público  
**Rate Limit:** Sim (tipo: login)

**Request Body:**
```json
{
  "emailOrNickname": "joao@example.com",
  "password": "MinhaSenh@123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Códigos de Status:**
- `200` - Login realizado com sucesso
- `401` - Credenciais inválidas

---

### **3. Refresh Token**

**Endpoint:** `POST /auth/refresh/:id`  
**Autenticação:** 🌐 Público (com refresh token)

**Parâmetros URL:**
- `id` (number): ID do usuário

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Códigos de Status:**
- `200` - Token renovado com sucesso
- `401` - Token inválido ou expirado

---

### **4. Iniciar Recuperação de Senha**

**Endpoint:** `POST /auth/password-reset/initiate`  
**Autenticação:** 🌐 Público  
**Rate Limit:** Sim (tipo: login)

**Request Body:**
```json
{
  "emailOrNickname": "joao@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Se o usuário existir, um PIN de recuperação foi enviado para o email cadastrado."
}
```

---

### **5. Validar PIN de Recuperação**

**Endpoint:** `POST /auth/password-reset/validate-pin`  
**Autenticação:** 🌐 Público  
**Rate Limit:** Sim (tipo: login)

**Request Body:**
```json
{
  "emailOrNickname": "joao@example.com",
  "pin": "123456"
}
```

**Response (200):**
```json
{
  "valid": true,
  "token": "abc123xyz789def456ghi",
  "message": "PIN validado com sucesso. Você pode agora definir uma nova senha."
}
```

---

### **6. Completar Reset de Senha**

**Endpoint:** `POST /auth/password-reset/complete`  
**Autenticação:** 🌐 Público  
**Rate Limit:** Sim (tipo: login)

**Request Body:**
```json
{
  "emailOrNickname": "joao@example.com",
  "resetToken": "abc123xyz789def456ghi",
  "newPassword": "NovaSenh@123",
  "confirmPassword": "NovaSenh@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso. Você pode fazer login com a nova senha."
}
```

---

### 🎬 **STREAMERS** (`/streamers`)

### **7. Listar Todos os Streamers**

**Endpoint:** `GET /streamers`  
**Autenticação:** 🌐 Público  
**Cache:** 30 minutos

**Response (200):**
```json
[
  {
    "id": 1,
    "userId": 1,
    "points": 100,
    "platforms": ["twitch", "youtube"],
    "streamDays": ["monday", "wednesday", "friday"],
    "isOnline": true,
    "nickname": "meu_nick_twitch",
    "startTime": "20:00",
    "endTime": "00:00",
    "createdAt": "2025-01-07T00:00:00.000Z",
    "updatedAt": "2025-01-07T00:00:00.000Z"
  }
]
```

---

### **8. Streamers Online**

**Endpoint:** `GET /streamers/online`  
**Autenticação:** 🌐 Público  
**Cache:** 5 minutos

**Response (200):**
```json
[
  {
    "id": 1,
    "userId": 1,
    "points": 100,
    "platforms": ["twitch", "youtube"],
    "streamDays": ["monday", "wednesday", "friday"],
    "isOnline": true,
    "nickname": "meu_nick_twitch",
    "startTime": "20:00",
    "endTime": "00:00",
    "createdAt": "2025-01-07T00:00:00.000Z",
    "updatedAt": "2025-01-07T00:00:00.000Z"
  }
]
```

---

### 📊 **PONTUAÇÃO PÚBLICA** (`/scores/public`)

### **9. Pontos Diários Públicos**

**Endpoint:** `GET /scores/public/daily-points/:streamerId`  
**Autenticação:** 🌐 Público

**Parâmetros URL:**
- `streamerId` (number): ID do streamer

**Query Parameters:**
- `date` (string, opcional): Data no formato YYYY-MM-DD

**Response (200):**
```json
{
  "streamerId": 1,
  "date": "2025-01-07T00:00:00.000Z",
  "currentPoints": 120,
  "remainingPoints": 120,
  "dailyLimit": 240
}
```

---

### **10. Ranking Semanal**

**Endpoint:** `GET /scores/public/weekly-ranking`  
**Autenticação:** 🌐 Público

**Query Parameters:**
- `startDate` (string, opcional): Data início YYYY-MM-DD
- `endDate` (string, opcional): Data fim YYYY-MM-DD

**Response (200):**
```json
{
  "startDate": "2025-01-06T00:00:00.000Z",
  "endDate": "2025-01-12T23:59:59.000Z",
  "ranking": [
    {
      "streamerId": 1,
      "nickname": "aggeotv",
      "totalPoints": 750,
      "dailyPoints": {
        "monday": 120,
        "tuesday": 150,
        "wednesday": 100,
        "thursday": 180,
        "friday": 200
      },
      "averagePoints": 150.0,
      "position": 1
    }
  ]
}
```

---

### **11. Média Semanal**

**Endpoint:** `GET /scores/public/weekly-average/:streamerId`  
**Autenticação:** 🌐 Público

**Parâmetros URL:**
- `streamerId` (number): ID do streamer

**Query Parameters:**
- `startDate` (string, opcional): Data início YYYY-MM-DD
- `endDate` (string, opcional): Data fim YYYY-MM-DD

**Response (200):**
```json
{
  "streamerId": 1,
  "nickname": "aggeotv",
  "totalPoints": 750,
  "daysWithPoints": 5,
  "averagePoints": 150.0,
  "dailyBreakdown": {
    "monday": 120,
    "tuesday": 150,
    "wednesday": 100,
    "thursday": 180,
    "friday": 200
  },
  "startDate": "2025-01-06T00:00:00.000Z",
  "endDate": "2025-01-12T23:59:59.000Z"
}
```

---

### **12. Pontos Diários da Semana**

**Endpoint:** `GET /scores/public/daily-week`  
**Autenticação:** 🌐 Público

**Query Parameters:**
- `startDate` (string, opcional): Data início YYYY-MM-DD
- `endDate` (string, opcional): Data fim YYYY-MM-DD

**Response (200):**
```json
{
  "startDate": "2025-01-06T00:00:00.000Z",
  "endDate": "2025-01-12T23:59:59.000Z",
  "dailyScores": [
    {
      "date": "2025-01-06T00:00:00.000Z",
      "dayOfWeek": "monday",
      "streamers": [
        {
          "streamerId": 1,
          "nickname": "aggeotv",
          "points": 150
        }
      ]
    }
  ]
}
```

---

### **13. Relatório Público**

**Endpoint:** `GET /scores/public/report/:streamerId`  
**Autenticação:** 🌐 Público

**Parâmetros URL:**
- `streamerId` (number): ID do streamer

**Query Parameters:**
- `startDate` (string, obrigatório): Data início YYYY-MM-DD
- `endDate` (string, obrigatório): Data fim YYYY-MM-DD

**Response (200):**
```json
{
  "totalPoints": 750,
  "reportId": 5476314,
  "nickname": "aggeotv",
  "listaA": "novais86",
  "listaB": "millastorm",
  "registrationDate": "2025-01-07T18:25:32.000Z",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-07T23:59:59.000Z",
  "scores": [
    {
      "id": 1,
      "points": 10,
      "date": "2025-01-07T18:25:32.000Z",
      "hour": 18,
      "minute": 25
    }
  ]
}
```

---

### **14. Relatório por Nickname**

**Endpoint:** `GET /scores/public/report-by-nickname/:nickname`  
**Autenticação:** 🌐 Público

**Parâmetros URL:**
- `nickname` (string): Nickname do streamer

**Query Parameters:**
- `startDateTime` (string, obrigatório): Data/hora início YYYY-MM-DDTHH:mm:ss
- `endDateTime` (string, obrigatório): Data/hora fim YYYY-MM-DDTHH:mm:ss

**Response (200):**
```json
{
  "totalPoints": 750,
  "reportId": 5476314,
  "nickname": "aggeotv",
  "listaA": "novais86",
  "listaB": "millastorm",
  "registrationDate": "2025-01-07T18:25:32.000Z",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-07T23:59:59.000Z",
  "scores": [
    {
      "id": 1,
      "points": 10,
      "date": "2025-01-07T18:25:32.000Z",
      "hour": 18,
      "minute": 25
    }
  ]
}
```

---

## 👤 **ENDPOINTS DE USUÁRIO (USER)**

### Sumário
- [Ver Meu Perfil](#15-ver-meu-perfil)
- [Editar Meu Perfil](#16-editar-meu-perfil)
- [Alterar Minha Senha](#17-alterar-minha-senha)
- [Editar Meus Dados de Streamer](#18-editar-meus-dados-de-streamer)

### 🔑 **PERFIL** (`/users`)

### **15. Ver Meu Perfil**

**Endpoint:** `GET /users/me`  
**Autenticação:** 🔒 Privado (USER)  
**Cache:** 30 minutos

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": 1,
  "fullName": "João Silva",
  "nickname": "joaosilva",
  "email": "joao@example.com",
  "role": "user",
  "lastLogin": "2025-01-07T10:30:00.000Z",
  "createdAt": "2025-01-07T00:00:00.000Z",
  "updatedAt": "2025-01-07T00:00:00.000Z"
}
```

---

### **16. Editar Meu Perfil**

**Endpoint:** `PATCH /users/me`  
**Autenticação:** 🔒 Privado (USER)  
**Rate Limit:** Sim (tipo: api)

**Request Body:**
```json
{
  "fullName": "João Silva Santos",
  "nickname": "joaosilva123",
  "email": "joao.silva@email.com",
  "phone": "+55 11 99999-9999"
}
```

**Response (200):**
```json
{
  "id": 1,
  "fullName": "João Silva Santos",
  "nickname": "joaosilva123",
  "email": "joao.silva@email.com",
  "role": "user",
  "lastLogin": "2025-01-07T10:30:00.000Z",
  "createdAt": "2025-01-07T00:00:00.000Z",
  "updatedAt": "2025-01-07T10:35:00.000Z"
}
```

---

### **17. Alterar Minha Senha**

**Endpoint:** `PATCH /users/me/password`  
**Autenticação:** 🔒 Privado (USER)  
**Rate Limit:** Sim (tipo: api)

**Request Body:**
```json
{
  "currentPassword": "MinhaSenh@123",
  "newPassword": "NovaSenh@456",
  "confirmPassword": "NovaSenh@456"
}
```

**Response (200):**
```json
{
  "id": 1,
  "fullName": "João Silva",
  "nickname": "joaosilva",
  "email": "joao@example.com",
  "role": "user",
  "lastLogin": "2025-01-07T10:30:00.000Z",
  "createdAt": "2025-01-07T00:00:00.000Z",
  "updatedAt": "2025-01-07T10:40:00.000Z"
}
```

---

### 🎬 **MEU STREAMER** (`/streamers`)

### **18. Editar Meus Dados de Streamer**

**Endpoint:** `PATCH /streamers/me`  
**Autenticação:** 🔒 Privado (USER)  
**Rate Limit:** Sim (tipo: api)

**Request Body:**
```json
{
  "platforms": ["twitch", "youtube"],
  "streamDays": ["monday", "wednesday", "friday"],
  "startTime": "20:00",
  "endTime": "00:00"
}
```

**Response (200):**
```json
{
  "id": 1,
  "userId": 1,
  "points": 100,
  "platforms": ["twitch", "youtube"],
  "streamDays": ["monday", "wednesday", "friday"],
  "isOnline": false,
  "nickname": "meu_nick_twitch",
  "startTime": "20:00",
  "endTime": "00:00",
  "createdAt": "2025-01-07T00:00:00.000Z",
  "updatedAt": "2025-01-07T10:50:00.000Z"
}
```

---

## 🔑 **ENDPOINTS DE ADMINISTRAÇÃO (ADMIN)**

### Sumário
- [Listar Todos os Usuários](#21-listar-todos-os-usuários)
- [Buscar Usuários por Nome](#211-buscar-usuários-por-nome)
- [Buscar Usuário por ID](#23-buscar-usuário-por-id)
- [Criar Usuário](#22-criar-usuário)
- [Atualizar Tokens do Usuário](#24-atualizar-tokens-do-usuário)
- [Logs de Login](#25-logs-de-login)
- [Atualizar Streamer](#26-atualizar-streamer)
- [Pontos/Admin](#28-pontos-diários-de-streamer-admin)
- [Relatórios/Admin](#31-ranking-administrativo)

### 🔑 **GERENCIAMENTO DE USUÁRIOS** (`/users`)

### **22. Criar Usuário**

**Endpoint:** `POST /users`  
**Autenticação:** 🔒 Privado (ADMIN)  
**Rate Limit:** Sim (tipo: create)

**Request Body:**
```json
{
  "fullName": "João Silva",
  "nickname": "joaosilva",
  "email": "joao@example.com",
  "password": "hashedpassword123",
  "role": "user"
}
```

**Response (201):**
```json
{
  "id": 1,
  "fullName": "João Silva",
  "nickname": "joaosilva",
  "email": "joao@example.com",
  "role": "user",
  "lastLogin": null,
  "createdAt": "2025-01-07T00:00:00.000Z",
  "updatedAt": "2025-01-07T00:00:00.000Z"
}
```

---

### **23. Buscar Usuário por ID**

**Endpoint:** `GET /users/:id`  
**Autenticação:** 🔒 Privado (ADMIN)  
**Cache:** 1 hora

**Parâmetros URL:**
- `id` (number): ID do usuário

**Response (200):**
```json
{
  "id": 1,
  "fullName": "João Silva",
  "nickname": "joaosilva",
  "email": "joao@example.com",
  "role": "user",
  "lastLogin": "2025-01-07T10:30:00.000Z",
  "createdAt": "2025-01-07T00:00:00.000Z",
  "updatedAt": "2025-01-07T00:00:00.000Z"
}
```

---

### **24. Atualizar Tokens do Usuário**

**Endpoint:** `PATCH /users/:id/tokens`  
**Autenticação:** 🔒 Sistema Interno (APP)  

> **⚠️ ATENÇÃO:** Este endpoint é usado **APENAS** pelo sistema/aplicação para refresh de tokens automático, não sendo acessível por usuários ou administradores.

**Parâmetros URL:**
- `id` (number): ID do usuário

**Request Body:**
```json
{
  "refreshToken": "refresh_token_example",
  "webToken": "web_token_example",
  "windowsToken": "windows_token_example"
}
```

**Response (200):**
```json
{
  "id": 1,
  "fullName": "João Silva",
  "nickname": "joaosilva",
  "email": "joao@example.com",
  "role": "user",
  "lastLogin": "2025-01-07T10:30:00.000Z",
  "createdAt": "2025-01-07T00:00:00.000Z",
  "updatedAt": "2025-01-07T10:45:00.000Z"
}
```

---

### **21. Listar Todos os Usuários**

**Endpoint:** `GET /users`
**Autenticação:** 🔒 Privado (ADMIN)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "fullName": "João Silva",
    "nickname": "joaosilva",
    "email": "joao@example.com",
    "role": "user",
    "lastLogin": "2025-01-07T10:30:00.000Z",
    "createdAt": "2025-01-07T00:00:00.000Z",
    "updatedAt": "2025-01-07T00:00:00.000Z"
  }
]
```

**Códigos de Status:**
- `200` - Lista de usuários retornada com sucesso
- `403` - Acesso negado (não é admin)

---

### **21.1. Buscar Usuários por Nome**

**Endpoint:** `GET /users/search?fullName=João`
**Autenticação:** 🔒 Privado (ADMIN)

**Query Parameters:**
- `fullName` (string): Nome completo ou parcial do usuário

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "fullName": "João Silva",
    "nickname": "joaosilva",
    "email": "joao@example.com",
    "role": "user",
    "lastLogin": "2025-01-07T10:30:00.000Z",
    "createdAt": "2025-01-07T00:00:00.000Z",
    "updatedAt": "2025-01-07T00:00:00.000Z"
  }
]
```

**Códigos de Status:**
- `200` - Lista de usuários retornada com sucesso
- `403` - Acesso negado (não é admin)

---

### 🔑 **LOGS DE SISTEMA** (`/auth`)

### **25. Logs de Login**

**Endpoint:** `GET /auth/login-logs`  
**Autenticação:** 🔒 Privado (ADMIN)

**Query Parameters:**
- `limit` (number, opcional): Número máximo de registros (padrão: 50)
- `offset` (number, opcional): Número de registros para pular (padrão: 0)

**Response (200):**
```json
{
  "logs": [
    {
      "userId": 1,
      "nickname": "admin",
      "role": "admin",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

---

### 🎬 **GERENCIAMENTO DE STREAMERS** (`/streamers`)

### **26. Atualizar Streamer**

**Endpoint:** `PATCH /streamers/:id`  
**Autenticação:** 🔒 Privado (ADMIN)

**Parâmetros URL:**
- `id` (number): ID do streamer

**Request Body:**
```json
{
  "nickname": "novo_nick",
  "platforms": ["twitch", "youtube"],
  "streamDays": ["monday", "wednesday", "friday"],
  "startTime": "20:00",
  "endTime": "00:00"
}
```

**Response (200):**
```json
{
  "id": 1,
  "userId": 1,
  "points": 100,
  "platforms": ["twitch", "youtube"],
  "streamDays": ["monday", "wednesday", "friday"],
  "isOnline": false,
  "nickname": "novo_nick",
  "startTime": "20:00",
  "endTime": "00:00",
  "createdAt": "2025-01-07T00:00:00.000Z",
  "updatedAt": "2025-01-07T10:55:00.000Z"
}
```

---

### **27. Atualizar Status Online**

**Endpoint:** `PUT /streamers/:id/status`  
**Autenticação:** 🔒 Sistema de Lives (INTERNO)

> **⚠️ ATENÇÃO:** Este endpoint é usado **APENAS** pelo sistema de lives para atualizar automaticamente o status online dos streamers a cada X tempo. Não é acessível por usuários ou administradores.

**Parâmetros URL:**
- `id` (number): ID do streamer

**Request Body:**
```json
{
  "isOnline": true
}
```

**Response (200):**
```json
{
  "id": 1,
  "userId": 1,
  "points": 100,
  "platforms": ["twitch", "youtube"],
  "streamDays": ["monday", "wednesday", "friday"],
  "isOnline": true,
  "nickname": "meu_nick_twitch",
  "startTime": "20:00",
  "endTime": "00:00",
  "createdAt": "2025-01-07T00:00:00.000Z",
  "updatedAt": "2025-01-07T11:00:00.000Z"
}
```

---

### 📊 **PONTUAÇÃO ADMINISTRATIVA** (`/scores`)

### **28. Pontos Diários de Streamer (Admin)**

**Endpoint:** `GET /scores/daily-points/:streamerId`  
**Autenticação:** 🔒 Privado (ADMIN)

**Parâmetros URL:**
- `streamerId` (number): ID do streamer

**Query Parameters:**
- `date` (string, opcional): Data no formato YYYY-MM-DD

**Response (200):**
```json
{
  "streamerId": 1,
  "date": "2025-01-07T00:00:00.000Z",
  "currentPoints": 120,
  "remainingPoints": 120,
  "dailyLimit": 240
}
```

---

### **29. Relatório de Pontos (Admin)**

**Endpoint:** `GET /scores/report/:streamerId`  
**Autenticação:** 🔒 Privado (ADMIN)

**Parâmetros URL:**
- `streamerId` (number): ID do streamer

**Query Parameters:**
- `startDate` (string, obrigatório): Data início YYYY-MM-DD
- `endDate` (string, obrigatório): Data fim YYYY-MM-DD

**Response (200):**
```json
{
  "totalPoints": 750,
  "reportId": 5476314,
  "nickname": "aggeotv",
  "listaA": "novais86",
  "listaB": "millastorm",
  "registrationDate": "2025-01-07T18:25:32.000Z",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-07T23:59:59.000Z",
  "scores": [
    {
      "id": 1,
      "points": 10,
      "date": "2025-01-07T18:25:32.000Z",
      "hour": 18,
      "minute": 25
    }
  ]
}
```

---

### **30. Scores por Hora**

**Endpoint:** `GET /scores/by-hour`  
**Autenticação:** 🔒 Privado (ADMIN)

**Query Parameters:**
- `date` (string, opcional): Data no formato YYYY-MM-DD

**Response (200):**
```json
{
  "date": "2025-01-07T00:00:00.000Z",
  "streamers": [
    {
      "streamerId": 1,
      "nickname": "barba_09a",
      "pointsByHour": {
        "1h": 10,
        "2h": 15,
        "3h": 5
      }
    }
  ]
}
```

---

### 📊 **RELATÓRIOS ADMINISTRATIVOS** (`/scores/admin`)

### **31. Ranking Administrativo**

**Endpoint:** `GET /scores/admin/weekly-ranking`  
**Autenticação:** 🔒 Privado (ADMIN)

**Query Parameters:**
- `startDate` (string, obrigatório): Data início YYYY-MM-DD
- `endDate` (string, obrigatório): Data fim YYYY-MM-DD

**Response (200):**
```json
{
  "startDate": "2025-01-06T00:00:00.000Z",
  "endDate": "2025-01-11T23:59:59.000Z",
  "ranking": [
    {
      "streamerId": 1,
      "nickname": "aggeotv",
      "totalPoints": 750,
      "dailyPoints": {
        "monday": 120,
        "tuesday": 150,
        "wednesday": 100,
        "thursday": 180,
        "friday": 200
      },
      "averagePoints": 150.0,
      "position": 1
    }
  ]
}
```

---

### **32. Média Administrativa**

**Endpoint:** `GET /scores/admin/weekly-average/:streamerId`  
**Autenticação:** 🔒 Privado (ADMIN)

**Parâmetros URL:**
- `streamerId` (number): ID do streamer

**Query Parameters:**
- `startDate` (string, obrigatório): Data início YYYY-MM-DD
- `endDate` (string, obrigatório): Data fim YYYY-MM-DD

**Response (200):**
```json
{
  "streamerId": 1,
  "nickname": "aggeotv",
  "totalPoints": 750,
  "daysWithPoints": 5,
  "averagePoints": 150.0,
  "dailyBreakdown": {
    "monday": 120,
    "tuesday": 150,
    "wednesday": 100,
    "thursday": 180,
    "friday": 200
  },
  "startDate": "2025-01-06T00:00:00.000Z",
  "endDate": "2025-01-11T23:59:59.000Z"
}
```

---

### **33. Pontos Diários Administrativos**

**Endpoint:** `GET /scores/admin/daily-week`  
**Autenticação:** 🔒 Privado (ADMIN)

**Query Parameters:**
- `startDate` (string, obrigatório): Data início YYYY-MM-DD
- `endDate` (string, obrigatório): Data fim YYYY-MM-DD

**Response (200):**
```json
{
  "startDate": "2025-01-06T00:00:00.000Z",
  "endDate": "2025-01-11T23:59:59.000Z",
  "dailyScores": [
    {
      "date": "2025-01-06T00:00:00.000Z",
      "dayOfWeek": "monday",
      "streamers": [
        {
          "streamerId": 1,
          "nickname": "aggeotv",
          "points": 150
        }
      ]
    }
  ]
}
```

---

### **34. Resumo de Período**

**Endpoint:** `GET /scores/admin/period-summary`  
**Autenticação:** 🔒 Privado (ADMIN)

**Query Parameters:**
- `startDate` (string, obrigatório): Data início YYYY-MM-DD
- `endDate` (string, obrigatório): Data fim YYYY-MM-DD

**Response (200):**
```json
{
  "period": {
    "startDate": "2025-01-06T00:00:00.000Z",
    "endDate": "2025-01-11T23:59:59.000Z"
  },
  "statistics": {
    "totalStreamers": 10,
    "totalPoints": 7500,
    "averagePointsPerStreamer": 750,
    "topStreamer": {
      "nickname": "aggeotv",
      "points": 900
    }
  },
  "ranking": [
    {
      "position": 1,
      "nickname": "aggeotv",
      "totalPoints": 900,
      "averagePoints": 180
    }
  ],
  "dailyBreakdown": [
    {
      "date": "2025-01-06T00:00:00.000Z",
      "dayOfWeek": "monday",
      "totalPoints": 1200
    }
  ]
}
```

---

## 🔧 **Códigos de Status HTTP**

### **Códigos de Sucesso**
- `200` - OK (operação realizada com sucesso)
- `201` - Created (recurso criado com sucesso)

### **Códigos de Erro do Cliente**
- `400` - Bad Request (dados inválidos)
- `401` - Unauthorized (token inválido ou ausente)
- `403` - Forbidden (acesso negado por falta de permissão)
- `404` - Not Found (recurso não encontrado)
- `409` - Conflict (conflito de dados, ex: email duplicado)
- `429` - Too Many Requests (rate limit excedido)

### **Códigos de Erro do Servidor**
- `500` - Internal Server Error (erro interno)

---

## 🔗 **Headers Importantes**

### **Autenticação**
```
Authorization: Bearer <access_token>
```

### **Content-Type**
```
Content-Type: application/json
```

### **Cache Control**
```
Cache-Control: public, max-age=1800
```

---

## ⚡ **Rate Limiting**

### **Limites por Tipo**
- **create**: Operações de criação (registro, usuários)
- **login**: Operações de autenticação
- **api**: Operações gerais da API
- **score**: Criação de scores (6 minutos entre scores do mesmo streamer)

### **Headers de Rate Limit**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1642694400
```

---

## 📅 **Formatos de Data**

### **Entrada**
- **Data**: YYYY-MM-DD (ex: `2025-01-07`)
- **Data/Hora**: YYYY-MM-DDTHH:mm:ss (ex: `2025-01-07T18:25:32`)

### **Saída**
- **ISO 8601**: YYYY-MM-DDTHH:mm:ss.sssZ (ex: `2025-01-07T18:25:32.000Z`)

---

## 📊 **Resumo de Endpoints por Categoria**

| Categoria | Público | Usuário | Admin | Sistema | Total |
|-----------|---------|---------|-------|---------|-------|
| **Autenticação** | 6 | 0 | 1 | 0 | 7 |
| **Perfil/Usuários** | 0 | 3 | 2 | 1 | 6 |
| **Streamers** | 2 | 1 | 1 | 1 | 5 |
| **Pontuação** | 6 | 0 | 7 | 0 | 13 |
| **Sistema de Lives** | 0 | 0 | 0 | 1 | 1 |
| **TOTAL** | **14** | **4** | **11** | **3** | **32** |

### **📋 Legenda de Acesso**
- **Público**: Sem autenticação necessária
- **Usuário**: Role `user` com JWT
- **Admin**: Role `admin` com JWT  
- **Sistema**: Endpoints internos (Sistema de Lives/App)

---

## 🛡️ **Permissões por Role**

### **👤 Usuário (role: user)**
- ✅ Gerenciar próprio perfil
- ✅ Editar dados do próprio streamer
- ❌ Criar scores (integrado apenas no sistema de lives)
- ❌ Visualizar relatórios de pontuação (apenas admin)
- ❌ Gerenciar outros usuários
- ❌ Acessar logs do sistema
- ❌ Relatórios administrativos

### **🔑 Administrador (role: admin)**
- ✅ Todas as permissões de usuário
- ✅ Gerenciar todos os usuários  
- ✅ Atualizar qualquer streamer
- ✅ Visualizar logs do sistema
- ✅ Acessar relatórios administrativos
- ✅ Visualizar pontos diários e relatórios de streamers
- ❌ Controlar status online (apenas sistema de lives)

### **🤖 Sistema Interno**
- ✅ Atualizar tokens automaticamente
- ✅ Controlar status online de streamers
- ✅ Criar e gerenciar scores via sistema de lives

---

**🎉 API completamente reorganizada com separação clara entre endpoints públicos, de usuário e administrativos!** 