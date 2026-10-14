# CMS setup

1. Create a new Supabase project for this portfolio.
2. In SQL Editor, run the files in `database/supabase/migrations/` in filename order, then run `database/supabase/seed.sql`. The seed adds missing records and preserves existing CMS edits.
3. Copy `frontend/.env.example` to `frontend/.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the project's Connect dialog. Use the publishable key, not an elevated secret/service-role key. [Supabase API key documentation](https://supabase.com/docs/guides/getting-started/api-keys).
4. In Supabase Authentication, disable public sign-ups and create/confirm your administrator user with a strong password. Run this in SQL Editor using the user's actual Auth UUID:

```sql
insert into public.profiles (id, role)
values ('YOUR_AUTH_USER_UUID', 'admin')
on conflict (id) do update set role = excluded.role;
```

5. Restart `npm run dev` from the repository root. Sign in at `http://localhost:3000/login`, then open `/admin` to edit site details, projects, images, publication state, and process entries.

Keep the `portfolio-media` bucket private and upload future draft images through the CMS. Local `.env.local` is ignored by Git; set the same two variables in your hosting provider when deploying. Live Auth, uploads, and database RLS need a configured project before they can be tested.
