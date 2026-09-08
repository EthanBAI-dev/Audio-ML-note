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

create table if not exists courses (
  id text primary key,
  slug text not null unique,
  title text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  course_id text references courses(id),
  name text not null,
  access_type text not null default 'lifetime',
  active integer not null default 1
);

create table if not exists orders (
  id text primary key,
  user_id text not null references users(id),
  product_id text not null references products(id),
  provider text not null,
  external_order_id text not null,
  status text not null,
  amount integer not null,
  currency text not null,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists orders_provider_external_unique on orders(provider, external_order_id);

create table if not exists entitlements (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  product_id text not null references products(id),
  source_order_id text references orders(id),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

create unique index if not exists entitlements_user_product_unique on entitlements(user_id, product_id);

create table if not exists lesson_progress (
  user_id text not null references users(id) on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  lesson_id text not null,
  percent integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id, lesson_id)
);

insert into courses (id, slug, title, status)
values ('audio-ml', 'audio-ml', '音频信号处理二十三讲', 'published')
on conflict (id) do nothing;

insert into products (id, course_id, name, access_type, active)
values ('audio-ml-course-v1', 'audio-ml', '音频信号处理二十三讲 · 完整版', 'lifetime', 1)
on conflict (id) do nothing;
