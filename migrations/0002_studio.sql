-- One active reference photograph per signed-in user. Replaced on each new upload.
create table if not exists studio_references (
  id text primary key,
  user_id text not null,
  mime text not null,
  data_base64 text not null,
  width integer not null,
  height integer not null,
  created_at timestamptz not null default now()
);

create index if not exists studio_references_user_idx on studio_references (user_id);
