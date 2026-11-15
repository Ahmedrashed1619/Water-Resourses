# أوبريو | Operio

**متابعة تعاقدات قطاع الري — وزارة الموارد المائية والري**  
**Irrigation Sector Contract Follow-up — Ministry of Water Resources and Irrigation**

منصة ويب ثنائية اللغة (عربي / إنجليزي) لمتابعة العمليات التعاقدية عبر **33 إدارة ري**، من تاريخ الموافقة الفنية حتى البت المالي، مع تنبيهات التأخير، الاعتماد المالي، التقارير، وإدارة المستخدمين والصلاحيات.

A bilingual (Arabic / English) web platform that tracks contracting operations across **33 irrigation departments**, from technical approval through financial award, with delay alerts, financial approvals, reports, and role-based user management.

---

## جدول المحتويات | Table of Contents

1. [نظرة عامة | Overview](#1-نظرة-عامة--overview)
2. [المميزات | Features](#2-المميزات--features)
3. [التقنيات | Tech Stack](#3-التقنيات--tech-stack)
4. [الأدوار والصلاحيات | Roles & Permissions](#4-الأدوار-والصلاحيات--roles--permissions)
5. [أنواع العمليات والمراحل | Operation Types & Stages](#5-أنواع-العمليات-والمراحل--operation-types--stages)
6. [قواعد التنبيهات | Alert Rules](#6-قواعد-التنبيهات--alert-rules)
7. [وحدات النظام | Application Modules](#7-وحدات-النظام--application-modules)
8. [متطلبات التشغيل | Requirements](#8-متطلبات-التشغيل--requirements)
9. [التثبيت والتشغيل | Setup & Run](#9-التثبيت-والتشغيل--setup--run)
10. [متغيرات البيئة | Environment Variables](#10-متغيرات-البيئة--environment-variables)
11. [حسابات التجربة | Demo Accounts](#11-حسابات-التجربة--demo-accounts)
12. [قاعدة البيانات | Database](#12-قاعدة-البيانات--database)
13. [أوامر npm | npm Scripts](#13-أوامر-npm--npm-scripts)
14. [هيكل المشروع | Project Structure](#14-هيكل-المشروع--project-structure)
15. [الهوية البصرية | Branding](#15-الهوية-البصرية--branding)
16. [الأمان قبل الإنتاج | Security Before Production](#16-الأمان-قبل-الإنتاج--security-before-production)

---

## 1. نظرة عامة | Overview

### العربية

**أوبريو** منصة داخلية لقطاع الري تساعد على:

- إنشاء العمليات التعاقدية من مستوى **القطاع** وتخصيصها لإدارة أو أكثر.
- حساب مواعيد المراحل تلقائيًا انطلاقًا من **تاريخ الموافقة الفنية**.
- تمكين كل إدارة من رؤية **عملياتها فقط**، واختيار المرحلة الجارية، وتعديل الموعد المخطط مع **سبب إلزامي**.
- إظهار التأخير للقطاع عبر تنبيهات التجاوز، وللإدارة عبر تنبيهات منتصف المدة وقبل خمسة أيام.
- تسجيل الاعتماد المالي والتعديلات، وتصدير التقارير، ومتابعة سجل النشاط.

### English

**Operio** is an internal Irrigation Sector platform that helps teams:

- Create contracting operations at the **Sector** level and assign them to one or more departments.
- Auto-calculate stage deadlines from the **technical approval date**.
- Let each department see **only its own operations**, pick the current stage, and change planned dates with a **mandatory reason**.
- Surface overdue work to the Sector, and halfway / five-day warnings to departments.
- Record financial approvals and adjustments, export reports, and review the activity log.

---

## 2. المميزات | Features

| العربية | English |
|---|---|
| واجهة عربية / إنجليزية مع تبديل فوري للغة | Instant Arabic / English locale switch |
| وضع فاتح وداكن | Light and dark themes |
| لوحة متابعة بمؤشرات وعمليات وتنبيهات | Dashboard with KPIs, operations, and alerts |
| إنشاء وتخصيص وحذف العمليات (حسب الصلاحية) | Create, assign, and delete operations (permission-based) |
| مساحة عمل لكل عملية مع مراحل ومواعيد | Per-operation workspace with stages and dates |
| تعديل موعد مخطط مع سبب + إشعار للقطاع | Planned-date revision with reason + Sector notice |
| اعتماد مالي وتعديلات بالقيمة والتاريخ | Financial approval and delta adjustments |
| تنبيهات: تجاوز / منتصف المدة / قبل 5 أيام | Alerts: overdue / halfway / due within 5 days |
| تقارير Excel و Word و PNG | Excel, Word, and PNG report exports |
| إدارة مستخدمين وأدوار ومهام مخصصة | User management, roles, and custom task grants |
| إعداد أنواع العمليات والمراحل | Configurable operation types and stages |
| سجل نشاط (Audit) | Activity / audit log |
| 33 إدارة ري جاهزة في البيانات التجريبية | 33 irrigation departments in seed data |

---

## 3. التقنيات | Tech Stack

| الطبقة | التقنية | Layer |
|---|---|---|
| الواجهة والتطبيق | Next.js 15 (App Router) + React 19 + TypeScript | App / UI |
| التنسيق | Tailwind CSS 4 | Styling |
| قاعدة البيانات (محلي) | SQLite عبر Prisma | Local DB |
| مخطط SQL Server | `database/schema.sql` | SQL Server schema |
| المصادقة | Cookie جلسة + JWT (`jose`) + bcrypt | Auth |
| التحقق من المدخلات | Zod | Validation |
| التقارير | ExcelJS + docx + html-to-image | Reports |
| الاختبارات | `tsx --test` لقواعد التاريخ والتنبيه | Tests |

---

## 4. الأدوار والصلاحيات | Roles & Permissions

### الأدوار | Roles

| الدور (Role) | الوصف بالعربية | English |
|---|---|---|
| `SECTOR_SUPER_ADMIN` | مسؤول أعلى للقطاع — صلاحيات كاملة تقريبًا | Sector super admin — near-full access |
| `SECTOR_ADMIN` | مدير قطاع — عمليات، مالية، تقارير، مستخدمون | Sector admin — ops, finance, reports, users |
| `SECTOR_EMPLOYEE` | موظف قطاع — تنبيهات وإدارات ومراجعات مواعيد | Sector employee — alerts, departments, revisions |
| `DEPARTMENT_SUPER_ADMIN` | مسؤول أعلى للإدارة — تنبيهات الإدارة + مستخدمون | Department super admin — dept alerts + users |
| `DEPARTMENT_ADMIN` | مدير إدارة — تنبيهات الإدارة + مستخدمون | Department admin — dept alerts + users |
| `DEPARTMENT_EMPLOYEE` | موظف إدارة — تنبيهات الإدارة وعمليات إدارته | Department employee — dept alerts and own ops |

### مصفوفة الصلاحيات | Permission matrix

| الصلاحية | المعنى | SECTOR_SUPER_ADMIN | SECTOR_ADMIN | SECTOR_EMPLOYEE | DEPARTMENT_* |
|---|---|:---:|:---:|:---:|:---:|
| `operations.manage` | إنشاء / تخصيص / حذف العمليات | ✓ | ✓ | | |
| `finance.manage` | الاعتماد والتعديلات المالية | ✓ | ✓ | | |
| `alerts.sector` | تنبيهات التجاوز | ✓ | ✓ | ✓ | |
| `alerts.department` | تنبيها منتصف المدة وقبل 5 أيام | | | | ✓ |
| `reports.export` | تصدير التقارير | ✓ | ✓ | | |
| `departments.view` | رؤية كل الإدارات | ✓ | ✓ | ✓ | |
| `users.manage` | إدارة حسابات نفس الجهة | ✓ | ✓ | | ✓\* |
| `users.manageAll` | إنشاء كل رتب القطاع | ✓ | | | |
| `settings.types` | أنواع العمليات والمراحل | ✓ | | | |
| `revisions.view` | أسباب تعديل المواعيد | ✓ | ✓ | ✓ | |
| `audit.view` | سجل النشاط | ✓ | | | |

\* مديرو الإدارات يديرون مستخدمي إدارتهم فقط ضمن حدود الرتبة.

يمكن أيضًا تخصيص قائمة مهام (`tasks`) بصلاحيات محددة لحساب معيّن بدل الاعتماد الكامل على الدور الافتراضي.

Custom per-user `tasks` JSON can override the default role grants with an explicit permission list.

---

## 5. أنواع العمليات والمراحل | Operation Types & Stages

### أنواع العمليات الافتراضية | Default operation types

| الكود | العربية | English |
|---|---|---|
| `DREDGING` | تطهيرات | Dredging |
| `EFFICIENCY` | رفع كفاءة | Efficiency improvement |
| `INVESTMENT` | استثماري | Investment |
| `OTHER` | أخرى | Other |

يمكن إضافة وتعديل الأنواع والمراحل من **الإعدادات** لمن لديه صلاحية `settings.types`.

### المراحل الافتراضية | Default stages

تُحسب المواعيد من **تاريخ الموافقة الفنية**، ما عدا البت المالي الذي يُربط بتاريخ استحقاق **الفتح المالي**.

| الترتيب | الكود | المرحلة | المدة | نقطة الارتكاز |
|---|---|---|---|---|
| 1 | `PUBLICATION` | النشر / Publication | شهر واحد | الموافقة الفنية `APPROVAL` |
| 2 | `TECHNICAL_OPENING` | الفتح الفني / Technical opening | شهران | الموافقة الفنية |
| 3 | `FINANCIAL_OPENING` | الفتح المالي / Financial opening | شهران + 15 يومًا | الموافقة الفنية |
| 4 | `FINANCIAL_AWARD` | البت المالي / Financial award | 7 أيام | استحقاق الفتح المالي `FINANCIAL_OPENING` |

### مثال حسابي | Calculation example

إذا كانت الموافقة الفنية: **08/10/2026**

| المرحلة | الموعد المخطط |
|---|---|
| النشر | 08/11/2026 |
| الفتح الفني | 08/12/2026 |
| الفتح المالي | 23/12/2026 |
| البت المالي | 30/12/2026 |

---

## 6. قواعد التنبيهات | Alert Rules

| النوع | العربية | لمن يظهر | الشرط |
|---|---|---|---|
| `OVERDUE` | تجاوز المدة | القطاع | اليوم بعد الموعد المخطط والمرحلة غير منتهية |
| `HALFWAY` | منتصف المدة | الإدارة | تجاوز نصف المدة المتبقية دون إكمال |
| `DUE_SOON` | قبل خمسة أيام | الإدارة | متبقٍ 5 أيام أو أقل حتى الموعد |
| — | مرحلة مكتملة | لا تنبيه | `completedAt` موجود |

التأخير يُقاس على **الموعد المخطط** (بعد أي تعديل)، وليس على خط الأساس الأصلي فقط. تعديل الموعد يتطلب سببًا (3 أحرف على الأقل) ويظهر في **تعديلات المواعيد** للقطاع.

Delay is measured against the **planned** due date (after any revision). Changing a date requires a reason (at least 3 characters) and appears under **Revisions** for the Sector.

---

## 7. وحدات النظام | Application Modules

| المسار | العربية | English | ملاحظة |
|---|---|---|---|
| `/login` | تسجيل الدخول | Login | عام |
| `/` | لوحة المتابعة | Dashboard | مؤشرات + أحدث تنبيهات وعمليات |
| `/operations` | العمليات | Operations | قائمة وإنشاء |
| `/operations/[id]` | مساحة العملية | Operation workspace | مراحل، مواعيد، تخصيص |
| `/departments` | الإدارات | Departments | خريطة / قائمة 33 إدارة |
| `/departments/[id]` | تفاصيل إدارة | Department detail | عمليات الإدارة |
| `/finance` | الاعتماد المالي | Finance | اعتماد وتعديلات |
| `/alerts` | التنبيهات | Alerts | حسب جمهور الدور |
| `/reports` | التقارير | Reports | Excel / Word / صورة |
| `/revisions` | تعديلات المواعيد | Date revisions | أسباب التعديل للقطاع |
| `/users` | المستخدمون | Users | إنشاء وتعديل حسب الصلاحية |
| `/settings` | الإعدادات | Settings | الحساب / التفضيلات |
| `/settings/model` | نموذج البيانات | Data model | أنواع ومراحل |
| `/audit` | سجل النشاط | Audit log | لمن لديه `audit.view` |

---

## 8. متطلبات التشغيل | Requirements

- **Node.js** 20+ مُفضّل (أو إصدار حديث يدعم Next.js 15)
- **npm** (يأتي مع Node)
- لا حاجة لتثبيت قاعدة بيانات منفصلة للتشغيل المحلي (SQLite)

---

## 9. التثبيت والتشغيل | Setup & Run

### العربية

```bash
# 1) استنساخ المستودع
git clone https://github.com/Ahmedrashed1619/Water-Resourses.git
cd Water-Resourses

# 2) تثبيت الحزم
npm install

# 3) إعداد البيئة
copy .env.example .env
# على Linux / macOS: cp .env.example .env

# 4) إنشاء قاعدة البيانات وزرع البيانات التجريبية
npx prisma db push
npm run db:seed
# أو دفعة واحدة: npm run db:setup

# 5) تشغيل وضع التطوير
npm run dev
```

افتح المتصفح على: [http://localhost:3000](http://localhost:3000)

للإنتاج محليًا:

```bash
npm run build
npm start
```

### English

```bash
# 1) Clone the repository
git clone https://github.com/Ahmedrashed1619/Water-Resourses.git
cd Water-Resourses

# 2) Install dependencies
npm install

# 3) Configure environment
cp .env.example .env
# On Windows CMD: copy .env.example .env

# 4) Create the database and seed demo data
npx prisma db push
npm run db:seed
# Or in one step: npm run db:setup

# 5) Start development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production locally:

```bash
npm run build
npm start
```

### اختبار قواعد التاريخ والتنبيه | Date & alert rule tests

```bash
npm test
```

---

## 10. متغيرات البيئة | Environment Variables

انسخ `.env.example` إلى `.env`:

| المتغير | الوصف | مثال |
|---|---|---|
| `DATABASE_URL` | مسار قاعدة SQLite لـ Prisma | `file:./dev.db` |
| `AUTH_SECRET` | سر توقيع جلسة JWT — غيّره قبل أي استخدام حقيقي | سلسلة عشوائية طويلة |

ملف `.env` **مستبعد** من Git عبر `.gitignore` ولا يجب رفعه للمستودع.

---

## 11. حسابات التجربة | Demo Accounts

كلمة المرور الموحدة لكل الحسابات التجريبية:

```text
Operio@2026
```

| البريد | الدور | الجهة |
|---|---|---|
| `admin@operio.local` | `SECTOR_SUPER_ADMIN` | قطاع الري |
| `sector@operio.local` | `SECTOR_ADMIN` | قطاع الري |
| `sector.staff@operio.local` | `SECTOR_EMPLOYEE` | قطاع الري |
| `east.minya.super@operio.local` | `DEPARTMENT_SUPER_ADMIN` | شرق المنيا |
| `east.minya.admin@operio.local` | `DEPARTMENT_ADMIN` | شرق المنيا |
| `east.minya@operio.local` | `DEPARTMENT_EMPLOYEE` | شرق المنيا |
| `asyut@operio.local` | `DEPARTMENT_EMPLOYEE` | أسيوط |
| `damietta@operio.local` | `DEPARTMENT_EMPLOYEE` | دمياط |
| `beheira@operio.local` | `DEPARTMENT_EMPLOYEE` | البحيرة |

الـ seed يزرع أيضًا عمليات تجريبية (مثل تأهيل بوابات شرق المنيا وتطهير ترع) مع تعديلات مالية وتعديل موعد نموذجي لتجربة التنبيهات والمراجعات.

---

## 12. قاعدة البيانات | Database

### التشغيل المحلي | Local runtime

- المزود: **SQLite**
- الملف: `prisma/dev.db` (بعد `db push` / seed)
- النموذج: `prisma/schema.prisma`

### الجداول الرئيسية | Main models

| النموذج | الغرض |
|---|---|
| `Sector` / `Department` | القطاع و33 إدارة |
| `User` | المستخدمون والأدوار والمهام |
| `OperationType` / `StageDefinition` | أنواع العمليات وتعريف المراحل |
| `Operation` | العملية التعاقدية |
| `OperationDepartment` | تخصيص العملية لإدارة + الاعتماد |
| `DepartmentStageProgress` | تقدم المراحل لكل تخصيص |
| `StageDateChange` | سجل تعديل المواعيد والأسباب |
| `FinancialAdjustment` | التعديلات المالية |
| `Alert` | التنبيهات |
| `AuditLog` | سجل النشاط |

### SQL Server

نفس النموذج المنطقي متوفر لـ SQL Server في:

- `database/schema.sql`

مخطط العلاقات (ERD):

- `docs/operio_erd.mermaid`

---

## 13. أوامر npm | npm Scripts

| الأمر | الوظيفة |
|---|---|
| `npm run dev` | تطوير مع Turbopack |
| `npm run build` | بناء الإنتاج |
| `npm start` | تشغيل البناء |
| `npm run lint` | فحص ESLint |
| `npm test` | اختبار قواعد المراحل والتنبيهات |
| `npm run db:push` | مزامنة مخطط Prisma مع SQLite |
| `npm run db:seed` | زرع البيانات التجريبية |
| `npm run db:setup` | `db push` ثم `seed` |

---

## 14. هيكل المشروع | Project Structure

```text
Water-Resourses/
├── database/
│   └── schema.sql              # مخطط SQL Server
├── docs/
│   └── operio_erd.mermaid      # مخطط العلاقات
├── prisma/
│   ├── schema.prisma           # نموذج Prisma (SQLite)
│   ├── seed.ts                 # بيانات التجربة
│   └── migrate-roles.ts        # ترحيل أدوار قديمة إن لزم
├── public/brand/               # شعارات القطاع والوزارة
├── src/
│   ├── app/
│   │   ├── (app)/              # صفحات التطبيق المحمية
│   │   ├── api/reports/        # تصدير Excel / Word
│   │   ├── login/              # تسجيل الدخول
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/             # مكونات الواجهة
│   ├── i18n/                   # القواميس وسياق اللغة
│   ├── lib/                    # صلاحيات، قواعد، استعلامات، مصادقة
│   ├── server/actions.ts       # Server Actions
│   └── middleware.ts           # حماية المسارات / الجلسة
├── .env.example
├── package.json
└── README.md
```

---

## 15. الهوية البصرية | Branding

| العنصر | القيمة |
|---|---|
| الأزرق الأساسي | `#0B6A9A` من شعار قطاع الري |
| الذهبي | لون تمييز مستوحى من ختم الوزارة |
| الوضع الفاتح | خلفية ورق دافئ |
| الوضع الداكن | خلفية مياه عميقة |
| الشعارات | `public/brand/sector.jpg` و `public/brand/ministry.jpg` |

---

## 16. الأمان قبل الإنتاج | Security Before Production

### العربية

- غيّر `AUTH_SECRET` إلى قيمة عشوائية قوية.
- أوقف أو احذف الحسابات التجريبية وغيّر كلمات المرور.
- لا ترفع ملف `.env` أو `prisma/dev.db` إلى المستودع.
- راجع الصلاحيات قبل فتح النظام على شبكة أوسع.
- عند الانتقال لـ SQL Server استخدم `database/schema.sql` واضبط سلسلة الاتصال بأمان.

### English

- Replace `AUTH_SECRET` with a long random value.
- Disable or delete demo accounts and rotate passwords.
- Never commit `.env` or `prisma/dev.db`.
- Review role grants before wider network exposure.
- For SQL Server, use `database/schema.sql` and protect the connection string.

---

## الترخيص والاستخدام | License & Use

مشروع داخلي لمتابعة تعاقدات قطاع الري. الحسابات والبيانات التجريبية للعرض والتطوير فقط.

Internal project for Irrigation Sector contract follow-up. Demo accounts and seed data are for demonstration and development only.

---

**المستودع | Repository:** [https://github.com/Ahmedrashed1619/Water-Resourses](https://github.com/Ahmedrashed1619/Water-Resourses)
