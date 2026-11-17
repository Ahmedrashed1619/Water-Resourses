/*
  Operio — SQL Server schema for the Irrigation Sector contracts platform.
  The running demo uses SQLite via Prisma. This script creates the same model on SQL Server.
*/
IF DB_ID(N'OperioDB') IS NULL CREATE DATABASE OperioDB;
GO
USE OperioDB;
GO

IF OBJECT_ID(N'dbo.audit_logs', N'U') IS NULL
CREATE TABLE dbo.audit_logs (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  actor_id NVARCHAR(40) NULL,
  action NVARCHAR(80) NOT NULL,
  entity NVARCHAR(80) NOT NULL,
  entity_id NVARCHAR(40) NULL,
  summary_ar NVARCHAR(500) NOT NULL,
  summary_en NVARCHAR(500) NOT NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_audit_created DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID(N'dbo.sectors', N'U') IS NULL
CREATE TABLE dbo.sectors (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  code NVARCHAR(40) NOT NULL UNIQUE,
  name_ar NVARCHAR(200) NOT NULL,
  name_en NVARCHAR(200) NOT NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_sector_created DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID(N'dbo.departments', N'U') IS NULL
CREATE TABLE dbo.departments (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  sector_id NVARCHAR(40) NOT NULL REFERENCES dbo.sectors(id),
  code NVARCHAR(80) NOT NULL UNIQUE,
  name_ar NVARCHAR(200) NOT NULL,
  name_en NVARCHAR(200) NOT NULL,
  sort_order INT NOT NULL,
  is_active BIT NOT NULL CONSTRAINT DF_dept_active DEFAULT 1,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_dept_created DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
CREATE TABLE dbo.users (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  email NVARCHAR(200) NOT NULL UNIQUE,
  password_hash NVARCHAR(200) NOT NULL,
  name_ar NVARCHAR(200) NOT NULL,
  name_en NVARCHAR(200) NOT NULL,
  role NVARCHAR(40) NOT NULL,
  department_id NVARCHAR(40) NULL REFERENCES dbo.departments(id),
  is_active BIT NOT NULL CONSTRAINT DF_user_active DEFAULT 1,
  deleted_at DATETIME2 NULL,
  deleted_by_id NVARCHAR(40) NULL REFERENCES dbo.users(id),
  created_at DATETIME2 NOT NULL CONSTRAINT DF_user_created DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_user_updated DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_user_role CHECK (role IN (N'SUPER_ADMIN', N'SECTOR', N'DEPARTMENT', N'SECTOR_SUPER_ADMIN', N'SECTOR_ADMIN', N'SECTOR_EMPLOYEE', N'DEPARTMENT_SUPER_ADMIN', N'DEPARTMENT_ADMIN', N'DEPARTMENT_EMPLOYEE'))
);

IF OBJECT_ID(N'dbo.operation_types', N'U') IS NULL
CREATE TABLE dbo.operation_types (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  code NVARCHAR(80) NOT NULL UNIQUE,
  name_ar NVARCHAR(200) NOT NULL,
  name_en NVARCHAR(200) NOT NULL,
  is_system BIT NOT NULL CONSTRAINT DF_type_system DEFAULT 0,
  is_active BIT NOT NULL CONSTRAINT DF_type_active DEFAULT 1,
  sort_order INT NOT NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_type_created DEFAULT SYSUTCDATETIME(),
  deleted_at DATETIME2 NULL,
  deleted_by_id NVARCHAR(40) NULL REFERENCES dbo.users(id)
);

IF OBJECT_ID(N'dbo.stage_definitions', N'U') IS NULL
CREATE TABLE dbo.stage_definitions (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  operation_type_id NVARCHAR(40) NOT NULL REFERENCES dbo.operation_types(id),
  code NVARCHAR(80) NOT NULL,
  name_ar NVARCHAR(200) NOT NULL,
  name_en NVARCHAR(200) NOT NULL,
  sort_order INT NOT NULL,
  duration_months INT NOT NULL CONSTRAINT DF_stage_months DEFAULT 0,
  duration_days INT NOT NULL CONSTRAINT DF_stage_days DEFAULT 0,
  anchor NVARCHAR(40) NOT NULL,
  is_active BIT NOT NULL CONSTRAINT DF_stage_active DEFAULT 1,
  department_id NVARCHAR(40) NULL REFERENCES dbo.departments(id),
  created_by_id NVARCHAR(40) NULL REFERENCES dbo.users(id),
  deleted_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_stage_created DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_stage_type_code UNIQUE (operation_type_id, code),
  CONSTRAINT CK_stage_anchor CHECK (anchor IN (N'APPROVAL', N'FINANCIAL_OPENING', N'MANUAL'))
);

IF OBJECT_ID(N'dbo.operations', N'U') IS NULL
CREATE TABLE dbo.operations (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  name_ar NVARCHAR(400) NOT NULL,
  name_en NVARCHAR(400) NOT NULL CONSTRAINT DF_op_en DEFAULT N'',
  operation_type_id NVARCHAR(40) NOT NULL REFERENCES dbo.operation_types(id),
  technical_approval_date DATE NOT NULL,
  created_by_id NVARCHAR(40) NOT NULL REFERENCES dbo.users(id),
  is_deleted BIT NOT NULL CONSTRAINT DF_op_deleted DEFAULT 0,
  deleted_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_op_created DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_op_updated DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID(N'dbo.operation_departments', N'U') IS NULL
CREATE TABLE dbo.operation_departments (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  operation_id NVARCHAR(40) NOT NULL REFERENCES dbo.operations(id),
  department_id NVARCHAR(40) NOT NULL REFERENCES dbo.departments(id),
  approval_start DATE NULL,
  approval_end DATE NULL,
  modified_start DATE NULL,
  modified_end DATE NULL,
  approved_amount DECIMAL(19,2) NOT NULL CONSTRAINT DF_amount DEFAULT 0,
  is_deleted BIT NOT NULL CONSTRAINT DF_asg_deleted DEFAULT 0,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_asg_created DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_asg_updated DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_operation_department UNIQUE (operation_id, department_id)
);

IF OBJECT_ID(N'dbo.financial_adjustments', N'U') IS NULL
CREATE TABLE dbo.financial_adjustments (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  operation_department_id NVARCHAR(40) NOT NULL REFERENCES dbo.operation_departments(id),
  delta_amount DECIMAL(19,2) NOT NULL,
  effective_date DATE NOT NULL,
  reason NVARCHAR(500) NULL,
  created_by_id NVARCHAR(40) NOT NULL REFERENCES dbo.users(id),
  created_at DATETIME2 NOT NULL CONSTRAINT DF_adj_created DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID(N'dbo.department_stage_progress', N'U') IS NULL
CREATE TABLE dbo.department_stage_progress (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  operation_department_id NVARCHAR(40) NOT NULL REFERENCES dbo.operation_departments(id),
  stage_definition_id NVARCHAR(40) NOT NULL REFERENCES dbo.stage_definitions(id),
  baseline_start DATE NOT NULL,
  baseline_due DATE NOT NULL,
  planned_start DATE NOT NULL,
  planned_due DATE NOT NULL,
  actual_start DATE NULL,
  completed_at DATE NULL,
  is_current BIT NOT NULL CONSTRAINT DF_progress_current DEFAULT 0,
  CONSTRAINT UQ_progress_stage UNIQUE (operation_department_id, stage_definition_id),
  CONSTRAINT CK_planned_order CHECK (planned_due >= planned_start)
);

IF OBJECT_ID(N'dbo.stage_date_changes', N'U') IS NULL
CREATE TABLE dbo.stage_date_changes (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  progress_id NVARCHAR(40) NOT NULL REFERENCES dbo.department_stage_progress(id),
  kind NVARCHAR(20) NOT NULL CONSTRAINT DF_change_kind DEFAULT N'DATE_REVISED',
  field NVARCHAR(20) NOT NULL CONSTRAINT DF_change_field DEFAULT N'DUE',
  old_date DATE NULL,
  new_date DATE NULL,
  reason NVARCHAR(500) NOT NULL CONSTRAINT DF_change_reason DEFAULT N'',
  note NVARCHAR(500) NULL,
  created_by_id NVARCHAR(40) NOT NULL REFERENCES dbo.users(id),
  seen_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_change_created DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_change_kind CHECK (kind IN (N'STAGE_ADDED', N'DATES_SET', N'DATE_REVISED'))
);

IF OBJECT_ID(N'dbo.alerts', N'U') IS NULL
CREATE TABLE dbo.alerts (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  progress_id NVARCHAR(40) NOT NULL REFERENCES dbo.department_stage_progress(id),
  type NVARCHAR(20) NOT NULL,
  audience NVARCHAR(20) NOT NULL,
  is_deleted BIT NOT NULL CONSTRAINT DF_alert_deleted DEFAULT 0,
  deleted_at DATETIME2 NULL,
  deleted_by_id NVARCHAR(40) NULL REFERENCES dbo.users(id),
  resolved_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_alert_created DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_alert_progress_type UNIQUE (progress_id, type),
  CONSTRAINT CK_alert_type CHECK (type IN (N'OVERDUE', N'HALFWAY', N'DUE_SOON')),
  CONSTRAINT CK_alert_audience CHECK (audience IN (N'SECTOR', N'DEPARTMENT'))
);

IF OBJECT_ID(N'dbo.funding_tranches', N'U') IS NULL
CREATE TABLE dbo.funding_tranches (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  operation_department_id NVARCHAR(40) NOT NULL REFERENCES dbo.operation_departments(id),
  sequence INT NOT NULL,
  sent_at DATE NOT NULL,
  amount DECIMAL(19,2) NOT NULL CONSTRAINT DF_tranche_amount DEFAULT 0,
  note NVARCHAR(500) NULL,
  created_by_id NVARCHAR(40) NOT NULL REFERENCES dbo.users(id),
  created_at DATETIME2 NOT NULL CONSTRAINT DF_tranche_created DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_tranche_seq UNIQUE (operation_department_id, sequence)
);

IF OBJECT_ID(N'dbo.operation_need_requests', N'U') IS NULL
CREATE TABLE dbo.operation_need_requests (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  department_id NVARCHAR(40) NOT NULL REFERENCES dbo.departments(id),
  operation_type_id NVARCHAR(40) NOT NULL REFERENCES dbo.operation_types(id),
  title NVARCHAR(400) NOT NULL,
  description NVARCHAR(1000) NULL,
  requirements NVARCHAR(2000) NOT NULL,
  requested_support NVARCHAR(20) NOT NULL,
  estimated_value DECIMAL(19,2) NULL,
  desired_start_date DATE NULL,
  expected_duration_days INT NULL,
  status NVARCHAR(40) NOT NULL CONSTRAINT DF_need_status DEFAULT N'SUBMITTED',
  created_by_id NVARCHAR(40) NOT NULL REFERENCES dbo.users(id),
  created_at DATETIME2 NOT NULL CONSTRAINT DF_need_created DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_need_updated DEFAULT SYSUTCDATETIME(),
  reviewed_by_id NVARCHAR(40) NULL REFERENCES dbo.users(id),
  reviewed_at DATETIME2 NULL,
  decision_note NVARCHAR(1000) NULL,
  approved_amount DECIMAL(19,2) NULL,
  linked_operation_id NVARCHAR(40) NULL REFERENCES dbo.operations(id),
  CONSTRAINT CK_need_support CHECK (requested_support IN (N'FINANCIAL', N'TECHNICAL', N'BOTH')),
  CONSTRAINT CK_need_status CHECK (status IN (N'SUBMITTED', N'UNDER_REVIEW', N'APPROVED', N'PARTIALLY_APPROVED', N'REJECTED', N'FULFILLED'))
);
GO
