# SmartPOS Database Struktura

## 📊 Umumiy Ma'lumot
- **Jami jadvallar:** 22 ta
- **Database turi:** PostgreSQL
- **Migration tool:** Alembic

---

## 📋 Jadval Ro'yxati

### 1. **users** - Foydalanuvchilar
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `username` (String, Unique, NOT NULL)
- `email` (String, Unique, NULL)
- `hashed_password` (String, NOT NULL)
- `phone_number` (String, NULL) - **Telefon raqami orqali kirish uchun**
- `full_name` (String, NULL)
- `role` (Enum: super_admin, owner, manager, cashier, warehouse_manager)
- `is_active` (Boolean, Default: True)
- `organization_id` (Integer, Foreign Key → organizations.id)
- `pin_code_hash` (String, NULL) - Tezkor kirish uchun
- `profile_image`, `address`, `birth_date`, `passport_data`, `job_title`, `hired_date`

**Relationships:**
- → `organizations` (Many-to-One)
- ← `work_sessions` (One-to-Many)
- ← `attendance_records` (One-to-Many)
- ← `documents` (One-to-Many)
- ← `ai_insights` (One-to-Many)

---

### 2. **organizations** - Tashkilotlar/Do'konlar
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `name` (String, NOT NULL)
- `description`, `address`, `phone`, `email`
- `is_active` (Boolean, Default: True)
- `created_at`, `updated_at` (DateTime)

**Relationships:**
- ← `users` (One-to-Many)
- ← `products` (One-to-Many)
- ← `sales` (One-to-Many)
- ← `customers` (One-to-Many)
- ← `invoices` (One-to-Many)
- ← `receipts` (One-to-Many)
- ← `branches` (One-to-Many)

---

### 3. **products** - Mahsulotlar
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `name` (String, NOT NULL)
- `barcode` (String, Index, NULL)
- `sku` (String, Index, NULL)
- `category_id` (Integer, Foreign Key → categories.id)
- `organization_id` (Integer, Foreign Key → organizations.id, NOT NULL)
- `price` (Float, Default: 0.0)
- `cost_price` (Float, Default: 0.0)
- `stock_quantity` (Float, Default: 0.0)
- `unit` (String, Default: "dona")
- `image_url`, `description` (Text)
- `embedding_vector` (ARRAY[Float]) - Semantic search uchun

**Relationships:**
- → `categories` (Many-to-One)
- → `organizations` (Many-to-One)

---

### 4. **categories** - Kategoriyalar
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `name` (String, NOT NULL)
- `parent_id` (Integer, Foreign Key → categories.id, NULL) - Hierarchical kategoriyalar

**Relationships:**
- ← `products` (One-to-Many)
- Self-referential (parent/child kategoriyalar)

---

### 5. **sales** - Sotuvlar
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `cashier_id` (Integer, Foreign Key → users.id)
- `organization_id` (Integer, Foreign Key → organizations.id, NOT NULL)
- `total_amount` (Float, Default: 0.0)
- `payment_method` (Enum: cash, card, transfer, mixed, payme, click)
- `created_at` (DateTime)

**Relationships:**
- → `users` (Many-to-One) - Cashier
- → `organizations` (Many-to-One)
- ← `sale_items` (One-to-Many)

---

### 6. **sale_items** - Sotuv elementlari
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `sale_id` (Integer, Foreign Key → sales.id)
- `product_id` (Integer, Foreign Key → products.id)
- `quantity` (Float, Default: 1.0)
- `price` (Float, Default: 0.0)
- `total` (Float, Default: 0.0)

**Relationships:**
- → `sales` (Many-to-One)
- → `products` (Many-to-One)

---

### 7. **customers** - Mijozlar
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `name` (String, NOT NULL)
- `phone` (String, Index, NULL)
- `email`, `address` (Text)
- `organization_id` (Integer, Foreign Key → organizations.id, NOT NULL)
- `loyalty_points` (Float, Default: 0.0)
- `ai_preferences` (JSONB) - AI tomonidan aniqlangan afzalliklar
- `created_at` (DateTime)

**Relationships:**
- → `organizations` (Many-to-One)
- ← `customer_transactions` (One-to-Many)

---

### 8. **customer_transactions** - Mijoz tranzaksiyalari
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `customer_id` (Integer, Foreign Key → customers.id)
- `sale_id` (Integer, Foreign Key → sales.id, NULL)
- `amount` (Float, Default: 0.0)
- `points_earned` (Float, Default: 0.0)
- `points_used` (Float, Default: 0.0)
- `transaction_type` (String) - sale, points_add, points_use
- `created_at` (DateTime)

**Relationships:**
- → `customers` (Many-to-One)
- → `sales` (Many-to-One)

---

### 9. **invoices** - Fakturalar
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `supplier_name` (String, NULL)
- `organization_id` (Integer, Foreign Key → organizations.id, NOT NULL)
- `total_amount` (Float, Default: 0.0)
- `status` (Enum: pending, confirmed, cancelled)
- `image_url` (String, NULL) - Faktura rasmi
- `raw_text` (Text, NULL) - OCR dan olingan matn
- `processed_data` (JSONB, NULL) - AI tomonidan qayta ishlangan ma'lumot
- `created_at` (DateTime)

**Relationships:**
- → `organizations` (Many-to-One)
- ← `invoice_items` (One-to-Many)

---

### 10. **invoice_items** - Faktura elementlari
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `invoice_id` (Integer, Foreign Key → invoices.id)
- `product_name_raw` (String, NOT NULL) - OCR dan olingan nom
- `product_id` (Integer, Foreign Key → products.id, NULL) - Bog'langan mahsulot
- `quantity` (Float, Default: 0.0)
- `price` (Float, Default: 0.0)

**Relationships:**
- → `invoices` (Many-to-One)
- → `products` (Many-to-One)

---

### 11. **inventory_movements** - Ombor harakatlari
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `product_id` (Integer, Foreign Key → products.id, NOT NULL)
- `quantity` (Float, NOT NULL)
- `movement_type` (Enum: in, out, adjust)
- `reference_type` (String, NULL) - sale, invoice, adjustment
- `reference_id` (Integer, NULL)
- `notes` (Text, NULL)
- `created_by` (Integer, Foreign Key → users.id)
- `created_at` (DateTime)

**Relationships:**
- → `products` (Many-to-One)
- → `users` (Many-to-One)

---

### 12. **suppliers** - Ta'minotchilar
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `name` (String, NOT NULL)
- `contact_person`, `phone`, `email`
- `address`, `bank_details`, `notes` (Text)
- `created_at` (DateTime)

---

### 13. **branches** - Filiallar
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `name` (String, NOT NULL)
- `address` (Text, NULL)
- `phone` (String, NULL)
- `organization_id` (Integer, Foreign Key → organizations.id, NOT NULL)
- `manager_id` (Integer, Foreign Key → users.id, NULL)
- `is_active` (Integer, Default: 1)
- `created_at` (DateTime)

**Relationships:**
- → `organizations` (Many-to-One)
- → `users` (Many-to-One) - Manager
- ← `branch_stocks` (One-to-Many)
- ← `stock_transfers` (One-to-Many) - from_branch va to_branch

---

### 14. **branch_stocks** - Filial omborlari
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `branch_id` (Integer, Foreign Key → branches.id, NOT NULL)
- `product_id` (Integer, Foreign Key → products.id, NOT NULL)
- `quantity` (Float, Default: 0.0)
- `min_quantity` (Float, Default: 10.0)

**Relationships:**
- → `branches` (Many-to-One)
- → `products` (Many-to-One)

---

### 15. **stock_transfers** - Filiallar orasidagi o'tkazmalar
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `from_branch_id` (Integer, Foreign Key → branches.id, NOT NULL)
- `to_branch_id` (Integer, Foreign Key → branches.id, NOT NULL)
- `product_id` (Integer, Foreign Key → products.id, NOT NULL)
- `quantity` (Float, NOT NULL)
- `status` (Enum: pending, approved, rejected, completed)
- `notes` (Text, NULL)
- `created_by` (Integer, Foreign Key → users.id)
- `approved_by` (Integer, Foreign Key → users.id, NULL)
- `created_at`, `completed_at` (DateTime)

**Relationships:**
- → `branches` (Many-to-One) - from_branch va to_branch
- → `products` (Many-to-One)
- → `users` (Many-to-One) - created_by va approved_by

---

### 16. **scanned_receipts** - Skanerlangan kvitansiyalar
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `user_id` (Integer, Foreign Key → users.id, NOT NULL)
- `organization_id` (Integer, Foreign Key → organizations.id, NOT NULL)
- `image_path` (String, NOT NULL)
- `status` (Enum: pending, confirmed, rejected)
- `ai_response` (JSON, NULL) - AI tomonidan qayta ishlangan ma'lumot
- `sale_id` (Integer, Foreign Key → sales.id, NULL) - Tasdiqlangandan keyin bog'langan sotuv
- `created_at`, `confirmed_at` (DateTime)

**Relationships:**
- → `users` (Many-to-One)
- → `organizations` (Many-to-One)
- → `sales` (Many-to-One)
- ← `scanned_receipt_items` (One-to-Many)

---

### 17. **scanned_receipt_items** - Skanerlangan kvitansiya elementlari
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `receipt_id` (Integer, Foreign Key → scanned_receipts.id, NOT NULL)
- `product_name` (String, NOT NULL)
- `quantity` (Float, Default: 1.0)
- `unit_price` (Float, Default: 0.0)
- `total_price` (Float, Default: 0.0)
- `matched_product_id` (Integer, Foreign Key → products.id, NULL) - Mavjud mahsulotga bog'langan

**Relationships:**
- → `scanned_receipts` (Many-to-One)
- → `products` (Many-to-One)

---

### 18. **work_sessions** - Ish sessiyalari
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `user_id` (Integer, Foreign Key → users.id)
- `start_time` (DateTime, Default: now)
- `end_time` (DateTime, NULL)
- `total_minutes` (Float, Default: 0.0)
- `break_minutes` (Integer, Default: 0)
- `status` (Enum: active, completed, paused)
- `total_sales_amount` (Float, Default: 0.0) - Sessiya davomidagi sotuvlar
- `transaction_count` (Integer, Default: 0) - Tranzaksiyalar soni

**Relationships:**
- → `users` (Many-to-One)

---

### 19. **attendance** - Davomat
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `user_id` (Integer, Foreign Key → users.id)
- `date` (Date, NOT NULL)
- `status` (Enum: present, absent, sick, vacation, late)
- `check_in_time` (DateTime, NULL)
- `check_out_time` (DateTime, NULL)
- `late_minutes` (Integer, Default: 0)
- `notes` (String, NULL)

**Relationships:**
- → `users` (Many-to-One)

---

### 20. **employee_ai_insights** - Xodimlar AI tahlillari
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `user_id` (Integer, Foreign Key → users.id)
- `month` (Date, NOT NULL) - Oyning birinchi kuni
- `performance_score` (Float, Default: 0.0) - 0-100
- `sales_rank` (Integer, Default: 0)
- `recommendations` (JSON, NULL) - Tavsiyalar ro'yxati
- `bonus_suggestion` (Float, Default: 0.0)
- `generated_at` (DateTime)

**Relationships:**
- → `users` (Many-to-One)

---

### 21. **employee_documents** - Xodimlar hujjatlari
**Asosiy maydonlar:**
- `id` (Integer, Primary Key)
- `user_id` (Integer, Foreign Key → users.id)
- `document_type` (String, NOT NULL) - PASSPORT, CONTRACT, va hokazo
- `file_path` (String, NOT NULL)
- `upload_date` (DateTime, Default: now)
- `expiry_date` (Date, NULL)

**Relationships:**
- → `users` (Many-to-One)

---

### 22. **alembic_version** - Migration versiyalari
**Asosiy maydonlar:**
- `version_num` (VARCHAR(32), NOT NULL) - Migration versiya raqami

---

## 🔗 Asosiy Relationships (Bog'lanishlar)

### Multi-Tenant Architecture
- Barcha asosiy jadvallar `organization_id` orqali `organizations` ga bog'langan
- Har bir tashkilot o'z ma'lumotlariga ega

### User Management
- `users` → `organizations` (Many-to-One)
- `users` ← `work_sessions`, `attendance`, `documents`, `ai_insights` (One-to-Many)

### Product Management
- `products` → `categories` (Many-to-One)
- `products` → `organizations` (Many-to-One)
- `products` ← `sale_items`, `invoice_items`, `inventory_movements` (One-to-Many)

### Sales Flow
- `sales` → `users` (cashier)
- `sales` → `organizations`
- `sales` ← `sale_items` → `products`

### Inventory Management
- `inventory_movements` - Ombor harakatlari
- `branch_stocks` - Filial omborlari
- `stock_transfers` - Filiallar orasidagi o'tkazmalar

### AI Features
- `scanned_receipts` - AI tomonidan qayta ishlangan fakturalar
- `invoices` - AI tomonidan qayta ishlangan fakturalar
- `employee_ai_insights` - Xodimlar AI tahlillari
- `customers.ai_preferences` - Mijozlar AI afzalliklari

---

## 📝 Eslatmalar

1. **Telefon raqami orqali kirish:** `users.phone_number` maydoni mavjud
2. **Multi-tenant:** Barcha asosiy jadvallar `organization_id` ga ega
3. **AI Integration:** JSONB va JSON maydonlar AI ma'lumotlari uchun
4. **Soft Delete:** Ba'zi jadvallarda `is_active` maydoni mavjud
5. **Audit Trail:** Ko'p jadvallarda `created_at` va `created_by` maydonlari mavjud








