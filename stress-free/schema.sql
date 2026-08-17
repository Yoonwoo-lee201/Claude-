-- Supabase SQL Editor에서 실행하세요.
-- 익명 방문자(uuid, 로컬스토리지에 발급) 기준으로
--   1) 어떤 날짜에 서비스를 사용했는지 (daily_clicks.click_date)
--   2) 방문자별 클릭 횟수 (daily_clicks.click_count)
-- 를 저장한다. 클릭 1회당 row를 쌓지 않고, (방문자, 날짜) 단위로
-- upsert하며 카운트만 증가시키므로 대량 클릭에도 테이블이 가볍다.

create table if not exists visitors (
  id uuid primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create table if not exists daily_clicks (
  visitor_id uuid not null references visitors(id) on delete cascade,
  click_date date not null default current_date,
  click_count bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (visitor_id, click_date)
);

create index if not exists idx_daily_clicks_date on daily_clicks (click_date);

alter table visitors enable row level security;
alter table daily_clicks enable row level security;

-- 통계 확보를 위해 읽기는 열어둔다 (PII 없음, uuid + 숫자뿐)
create policy "visitors_select_anon" on visitors
  for select to anon using (true);

create policy "daily_clicks_select_anon" on daily_clicks
  for select to anon using (true);

-- 쓰기는 아래 두 RPC를 통해서만 허용한다 (직접 insert/update 정책은 부여하지 않음)

-- 오늘 전체 사용자 합산 클릭 수 (초기 로딩 · 폴링용)
create or replace function get_today_total()
returns bigint
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(click_count), 0)
  from daily_clicks
  where click_date = current_date;
$$;

grant execute on function get_today_total() to anon;

-- 클릭 1회 반영: 방문자 upsert + 오늘 카운트 +1, 반영 후 오늘 전체 합산을 반환
create or replace function record_click(p_visitor_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := current_date;
  global_total bigint;
begin
  insert into visitors (id, first_seen, last_seen)
  values (p_visitor_id, now(), now())
  on conflict (id) do update set last_seen = now();

  insert into daily_clicks (visitor_id, click_date, click_count, updated_at)
  values (p_visitor_id, today, 1, now())
  on conflict (visitor_id, click_date)
  do update set click_count = daily_clicks.click_count + 1, updated_at = now();

  select coalesce(sum(click_count), 0) into global_total
  from daily_clicks
  where click_date = today;

  return global_total;
end;
$$;

grant execute on function record_click(uuid) to anon;
