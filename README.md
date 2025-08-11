# Psychiatrist Scheduler

A tiny, cheap-to-run MVP where users can find psychiatrists, view weekly availability (online / in-person), and request appointments. Admins can approve/reject requests.

## Quickstart (Frontend – local)

### Requirements
- **Node 20 LTS** (recommended)  

### Configure API base URL
Create `web/.env`:
```env
VITE_API_BASE=https://<your-api-endpoint>
```
> This is the CDK output `ApiEndpoint` (no trailing slash).

### Install & run
```bash
cd web
npm install
npm run dev
```
Open http://localhost:5173

---

## Deploy (Infra + API on AWS)

### Requirements
- AWS account with permissions to deploy
- **AWS CLI** configured:
  ```bash
  aws configure
  ```
- **CDK v2** installed:
  ```bash
  npm i -g aws-cdk
  ```

### 1) Bootstrap the environment (first time per account/region)
```bash
cd infra
npm install
cdk bootstrap
```

### 2) Deploy
```bash
cd infra
cdk deploy
```

After deploy:
- Copy the `ApiEndpoint` from the CDK outputs into `web/.env` as `VITE_API_BASE`.
- If your browser shows CORS issues, we already enable permissive CORS in the stack. Redeploy if you changed it.

---

## Project Structure

```
psychiatrist-scheduler/
├── api/                      # Lambda handlers (TypeScript)
│   └── ...
│
├── infra/                    # AWS CDK app (TypeScript)
│   ├── bin/
│   │   └── psychiatrist-scheduler.ts # CDK entrypoint
│   ├── lib/
│   │   └── infra.ts          # Stack: DynamoDB, GSIs, Lambdas, HTTP API, CORS
│   └── package.json
│
├── web/                      # React + Vite frontend (TypeScript)
│   ├── src/
│   │   ├── api.ts            # Lightweight API client
│   │   ├── App.tsx           # Routes + AppBar
│   │   └── pages/
│   │       ├── PsychiatristsPage.tsx # Search + weekly availability + request
│   │       └── AdminPage.tsx         # Approve/Reject + list all appointments
│   ├── index.html, main.tsx, ...
│   └── package.json
```

---

## Tech Used

- **Frontend**
  - [React](https://react.dev/) + [Vite](https://vitejs.dev/) + TypeScript
  - [MUI](https://mui.com/) for UI components
  - [Luxon](https://moment.github.io/luxon/) for date/time handling

- **Backend**
  - AWS Lambda (Node.js 20)
  - API Gateway HTTP API
  - DynamoDB (single-table design + GSIs)
  - [schemy-ts](https://github.com/aeberdinelli/schemy) for schema validation

- **Infra**
  - [AWS CDK v2](https://docs.aws.amazon.com/cdk/v2/guide/home.html) for IaC
  - Permissive CORS for quick prototyping
