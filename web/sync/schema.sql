create table public.tofu_sync_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 version bigint not null check (version > 0),
 document jsonb not null,
 updated_at timestamptz not null default now(),
 constraint tofu_document check (document->>'version' = '1' and jsonb_typeof(document->'items')='array' and jsonb_typeof(document->'collections')='array' and octet_length(document::text)<4194304)
);
alter table public.tofu_sync_state enable row level security;
revoke all on public.tofu_sync_state from anon, authenticated;
grant select, insert, update on public.tofu_sync_state to authenticated;
create policy tofu_owner on public.tofu_sync_state for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create function public.tofu_save_snapshot(expected_version bigint,next_document jsonb) returns bigint
language plpgsql security invoker set search_path='' as $$
declare v bigint;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if expected_version<0 or jsonb_typeof(next_document->'items') is distinct from 'array' or jsonb_typeof(next_document->'collections') is distinct from 'array' or next_document->>'version' is distinct from '1' then raise exception 'Invalid library' using errcode='22023'; end if;
 if expected_version=0 then
  insert into public.tofu_sync_state(user_id,version,document) values(auth.uid(),1,next_document) on conflict do nothing returning version into v;
 else
  update public.tofu_sync_state set document=next_document,version=version+1,updated_at=now() where user_id=auth.uid() and version=expected_version returning version into v;
 end if;
 if v is null then raise exception 'Library changed on another device' using errcode='40001'; end if;
 return v;
end $$;
revoke all on function public.tofu_save_snapshot(bigint,jsonb) from public,anon;
grant execute on function public.tofu_save_snapshot(bigint,jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('tofu-media','tofu-media',false,52428800,array['image/*','video/*','audio/*','application/octet-stream']);
create policy tofu_media_read on storage.objects for select to authenticated using(bucket_id='tofu-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy tofu_media_insert on storage.objects for insert to authenticated with check(bucket_id='tofu-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
