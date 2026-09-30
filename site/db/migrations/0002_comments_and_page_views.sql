create table if not exists comments (
  id text primary key,
  page text not null,
  user_id text not null references users(id) on delete cascade,
  parent_id text references comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists comments_page_created on comments(page, created_at);

create table if not exists page_views (
  path text primary key,
  views bigint not null default 0,
  updated_at timestamptz not null default now()
);
