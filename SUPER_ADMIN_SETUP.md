# Super Admin Dashboard & Global Catalog Tool - Setup Guide

## Overview

This document describes the Super Admin system implementation for platform management and global catalog population.

---

## 1. Database Setup (Supabase RLS Policies)

### Step 1: Run SQL Migration

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Open the file: `frontend/api/supabase_rls_policies.sql`
3. Copy and paste the entire SQL content into the SQL Editor
4. Click **Run** to execute

### What This Does:

- Creates `is_super_admin()` helper function
- Enables RLS on all tables (`tenants`, `users`, `products_v2`, `sales`, `customers_v2`, `global_catalog`, etc.)
- Grants **unrestricted access** to users with `role = 'super_admin'`
- Maintains tenant isolation for regular users

### Important Notes:

- The `is_super_admin()` function checks if `auth.uid()` matches a user in `public.users` with `role = 'super_admin'`
- Make sure your `users` table has:
  - `auth_id` column (UUID linking to Supabase Auth)
  - `role` column (enum with 'super_admin' value)
  - `is_active` column (boolean)

### Creating a Super Admin User:

You need to link a Supabase Auth user to a `public.users` record:

```sql
-- 1. Create user in Supabase Auth (or use existing)
-- 2. Get the auth user UUID
-- 3. Update or insert into public.users:

UPDATE public.users 
SET role = 'super_admin', auth_id = 'YOUR_AUTH_UUID_HERE'
WHERE username = 'your_admin_username';

-- OR insert new:
INSERT INTO public.users (username, email, hashed_password, role, auth_id, is_active)
VALUES ('admin', 'admin@example.com', 'hashed_password', 'super_admin', 'YOUR_AUTH_UUID', true);
```

---

## 2. Backend API Endpoints

### New Endpoints Created:

1. **`GET /api/v1/auth/me`** - Get current user information (including role)
2. **`GET /api/v1/admin/tenants`** - Get all tenants (Super Admin only)
3. **`GET /api/v1/admin/tenants/{id}`** - Get tenant details (Super Admin only)
4. **`PATCH /api/v1/admin/tenants/{id}/status`** - Update tenant status (Super Admin only)

### Dependencies Added:

- `get_current_super_admin()` function in `app/api/deps.py` - Requires `role = 'super_admin'`

---

## 3. Frontend Implementation

### File Structure:

```
frontend/src/
├── app/
│   └── admin/                    # Super Admin routes
│       ├── layout.tsx            # Admin layout with sidebar
│       ├── page.tsx              # Admin dashboard
│       ├── tenants/
│       │   └── page.tsx         # Tenant Manager
│       └── global-catalog/
│           └── page.tsx         # Global Catalog Quick Contributor
├── components/
│   └── admin/
│       ├── super-admin-guard.tsx # Route protection
│       └── admin-sidebar.tsx    # Navigation sidebar
└── lib/
    └── api-admin.ts             # Admin API functions
```

### Routes:

- **`/admin`** - Super Admin Dashboard
- **`/admin/tenants`** - Tenant Manager (view all stores, activate/deactivate)
- **`/admin/global-catalog`** - Global Catalog Quick Contributor Tool

### Access Control:

- All `/admin/*` routes are protected by `SuperAdminGuard`
- Only users with `role === 'super_admin'` can access
- Non-super-admin users are redirected to `/dashboard`

---

## 4. Features

### A. Super Admin Dashboard (`/admin`)

**Features:**
- Overview statistics (Total Tenants, Active/Inactive Stores)
- Quick action cards
- Recent activity placeholder

### B. Tenant Manager (`/admin/tenants`)

**Features:**
- Table listing all registered tenants/stores
- Search functionality (by name, business type, email)
- Status indicators (Active/Inactive)
- Actions:
  - **View Details** - View tenant information
  - **Activate/Deactivate** - Toggle tenant status
  - **Login as Tenant** - (Structure ready, implementation optional)

**UI:**
- Responsive table (desktop) / Card list (mobile)
- Real-time status updates
- Confirmation dialogs for status changes

### C. Global Catalog Quick Contributor (`/admin/global-catalog`)

**Features:**
- **Large Barcode Input** - Prominent, auto-focused field
- **Auto-Check** - Automatically checks if product exists when barcode is entered (debounced)
- **Simple Form:**
  - Product Name (required)
  - Category (optional)
  - Image URL (optional, with preview)
  - Description (optional)
- **Smart Save:**
  - Calls `upsert_global_catalog` RPC function
  - Updates existing products or creates new ones
  - Auto-resets form after save
  - Auto-focuses back on barcode input for rapid entry
- **Mobile-Friendly:**
  - Large touch targets
  - Optimized for phone use
  - Camera button placeholder (for future implementation)

**Workflow:**
1. Enter/scan barcode → Auto-checks if exists
2. Fill in product details
3. Press Enter or click Save
4. Form resets, cursor back to barcode
5. Repeat for rapid entry

---

## 5. Environment Variables

Make sure these are set in Vercel (or `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 6. Testing Checklist

### Database:
- [ ] SQL migration executed in Supabase
- [ ] Super admin user created with `auth_id` linked
- [ ] RLS policies active on all tables

### Backend:
- [ ] `/api/v1/auth/me` returns user with role
- [ ] `/api/v1/admin/tenants` requires super_admin
- [ ] `/api/v1/admin/tenants/{id}/status` updates correctly

### Frontend:
- [ ] `/admin` route accessible only to super_admin
- [ ] Tenant Manager displays all tenants
- [ ] Global Catalog tool saves products correctly
- [ ] Mobile-friendly layout works on phone

---

## 7. Usage Instructions

### For Super Admin:

1. **Login** with super_admin credentials
2. **Navigate** to `/admin` (or use sidebar if already in admin section)
3. **Manage Tenants:**
   - Go to "Tenants (Stores)"
   - Search, view, activate/deactivate stores
4. **Populate Global Catalog:**
   - Go to "Global Catalog"
   - Scan/enter barcode
   - Fill product details
   - Save and repeat

### For Mobile Use (Global Catalog):

1. Open `/admin/global-catalog` on your phone
2. Use barcode scanner app or manual entry
3. Fill form and save
4. Form auto-resets for next product

---

## 8. Security Notes

- ✅ All admin routes protected by `SuperAdminGuard`
- ✅ Backend endpoints require `get_current_super_admin()` dependency
- ✅ RLS policies enforce super_admin access at database level
- ✅ Regular users cannot access `/admin/*` routes (redirected)

---

## 9. Future Enhancements (Optional)

- [ ] Tenant impersonation ("Login as Tenant")
- [ ] User management (create/edit users across tenants)
- [ ] Platform-wide analytics
- [ ] System logs and audit trail
- [ ] Camera scanner integration for mobile
- [ ] Bulk import for global catalog (CSV/Excel)

---

## 10. Troubleshooting

### Issue: "Access denied" when accessing `/admin`

**Solution:**
- Check user role in database: `SELECT role FROM users WHERE id = YOUR_USER_ID;`
- Ensure role is exactly `'super_admin'` (case-sensitive)
- Verify `auth_id` is set and matches Supabase Auth user

### Issue: RLS policies blocking access

**Solution:**
- Run the SQL migration in Supabase SQL Editor
- Verify `is_super_admin()` function exists
- Check that user's `auth_id` matches Supabase Auth UUID

### Issue: Global Catalog not saving

**Solution:**
- Check Supabase credentials in environment variables
- Verify `upsert_global_catalog` RPC function exists in Supabase
- Check browser console for errors

---

## Files Created/Modified

### New Files:
- `frontend/api/supabase_rls_policies.sql` - RLS policies SQL
- `frontend/api/alembic/versions/add_super_admin_rls_policies.py` - Migration file
- `frontend/api/app/api/v1/endpoints/admin.py` - Admin API endpoints
- `frontend/src/app/admin/layout.tsx` - Admin layout
- `frontend/src/app/admin/page.tsx` - Admin dashboard
- `frontend/src/app/admin/tenants/page.tsx` - Tenant Manager
- `frontend/src/app/admin/global-catalog/page.tsx` - Global Catalog tool
- `frontend/src/components/admin/super-admin-guard.tsx` - Route protection
- `frontend/src/components/admin/admin-sidebar.tsx` - Navigation sidebar
- `frontend/src/lib/api-admin.ts` - Admin API functions

### Modified Files:
- `frontend/api/app/api/deps.py` - Added `get_current_super_admin()`
- `frontend/api/app/api/v1/endpoints/auth.py` - Added `/me` endpoint
- `frontend/api/app/api/v1/api.py` - Added admin router

---

**Implementation Complete! 🎉**

All features are ready. Follow the setup steps above to enable Super Admin access.
