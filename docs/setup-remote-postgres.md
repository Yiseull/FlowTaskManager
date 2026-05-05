# Remote PostgreSQL Setup

This guide uses Neon Free Postgres as the shared database while keeping the backend and frontend running locally on each laptop.

## Architecture

```text
Laptop A backend/frontend --\
Laptop B backend/frontend ----> Neon Postgres
Laptop C backend/frontend --/
```

The backend is not exposed to the internet in this setup. Each laptop runs its own local backend on `localhost:8080`, and all backends connect to the same Neon database.

## 1. Create a Neon database

1. Create a Neon project.
2. Open the project connection details.
3. Copy the PostgreSQL host, database, username, and password.
4. Build a JDBC URL in this format:

```bash
jdbc:postgresql://<neon-host>/<db-name>?sslmode=require
```

Example:

```bash
jdbc:postgresql://ep-example-123456.ap-northeast-1.aws.neon.tech/neondb?sslmode=require
```

## 2. Configure each laptop

Set the same values on every laptop that should share Flow Task Manager data.

```bash
export SPRING_DATASOURCE_URL='jdbc:postgresql://<neon-host>/<db-name>?sslmode=require'
export SPRING_DATASOURCE_USERNAME='<neon-user>'
export SPRING_DATASOURCE_PASSWORD='<neon-password>'
```

For zsh, place these in `~/.zshrc` if you want them to persist across terminal sessions.

Do not commit real database credentials. Use `.env.example` only as a template.

## 3. Run the app

Terminal 1:

```bash
./gradlew :backend:bootRun
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## 4. Verify shared data

1. On laptop A, create a task.
2. On laptop B, start the backend with the same Neon environment variables.
3. Open the frontend on laptop B.
4. Confirm that the task created on laptop A is visible.

The schema is created and updated by Spring/Hibernate through `spring.jpa.hibernate.ddl-auto=update`.

## 5. Return to local PostgreSQL

Unset the remote values or start a new shell without them:

```bash
unset SPRING_DATASOURCE_URL
unset SPRING_DATASOURCE_USERNAME
unset SPRING_DATASOURCE_PASSWORD
```

The backend then falls back to:

```bash
jdbc:postgresql://localhost:5432/flowtaskmanager
postgres
postgres
```

## 6. Manual backup

Use `pg_dump` with the Neon connection string. Keep the backup file outside the repository.

```bash
pg_dump 'postgresql://<neon-user>:<neon-password>@<neon-host>/<db-name>?sslmode=require' > flowtaskmanager-backup.sql
```

This v1 setup does not automate backups.
