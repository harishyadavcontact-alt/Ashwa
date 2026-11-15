-- Ashwa pilot schema v2.4: drivers can invite drivers.
-- Each driver gets a short referral code. A new driver who signs up through a driver's link is recorded as referred.

alter table public.drivers
  add column if not exists referral_code text unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  add column if not exists referred_by text;

-- Referral code and referrer are set once, by the database, and never changed by the driver.
create or replace function public.guard_driver_referral() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.referral_code is distinct from old.referral_code then
    new.referral_code := old.referral_code;
  end if;
  if new.referred_by is distinct from old.referred_by and old.referred_by is not null then
    new.referred_by := old.referred_by;
  end if;
  return new;
end $$;

drop trigger if exists guard_driver_referral on public.drivers;
create trigger guard_driver_referral before update on public.drivers
  for each row execute function public.guard_driver_referral();
