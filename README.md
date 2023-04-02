# flat-me-server

> Back-end for FlatMe

## Getting started

### Setup

```bash
git clone https://github.com/zsevic/flat-me-server
cd flat-me-server
docker-compose up
cp .env.sample .env # change values after copying
npm i
npm run start:dev
```

### Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Testing

```bash
npm test
npm run test:e2e
```

### Migrations

```bash
npm run migration:create <MIGRATION_NAME>
npm run migrate
npm run migrate:down
```

### API documentation

API documentation is generated using [@nestjs/swagger](https://www.npmjs.com/package/@nestjs/swagger) module at `/api-docs` endpoint

### Technologies used

- Node.js, TypeScript, NestJS, TypeORM
