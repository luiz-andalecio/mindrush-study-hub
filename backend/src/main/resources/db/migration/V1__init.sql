-- Migração inicial do banco.
-- Importante: usar Flyway evita depender de "ddl-auto=create" e dá histórico das mudanças.

create table if not exists users (
  id uuid primary key,
  name varchar(200) not null,
  email varchar(200) not null unique,
  password_hash varchar(255) not null,
  level integer not null,
  xp integer not null,
  coins integer not null,
  streak integer not null,
  created_at timestamptz not null
);
