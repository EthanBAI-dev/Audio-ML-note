create table if not exists users (
  id text primary key,
  name text,
  email text unique,
  email_verified timestamptz,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists accounts (
  user_id text not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  primary key (provider, provider_account_id)
);

create table if not exists sessions (
  session_token text primary key,
  user_id text not null references users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  primary key (identifier, token)
);
