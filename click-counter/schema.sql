-- Supabase SQL Editor에서 실행하세요.

-- 행 1개짜리 누적 카운터 테이블 (조인/이력 없음)
create table if not exists click_counter (
  id smallint primary key default 1,
  total_clicks bigint not null default 0,
  constraint click_counter_single_row check (id = 1)
);

insert into click_counter (id, total_clicks)
values (1, 0)
on conflict (id) do nothing;

alter table click_counter enable row level security;

-- 프론트엔드에서 현재 카운트를 읽을 수 있도록 select만 공개
create policy "click_counter_select_anon" on click_counter
  for select
  to anon
  using (true);

-- 증가는 direct update가 아니라 RPC로만 허용 (동시 클릭 시 race condition 방지)
create or replace function increment_click_counter()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_total bigint;
begin
  update click_counter
  set total_clicks = total_clicks + 1
  where id = 1
  returning total_clicks into new_total;
  return new_total;
end;
$$;

grant execute on function increment_click_counter() to anon;
