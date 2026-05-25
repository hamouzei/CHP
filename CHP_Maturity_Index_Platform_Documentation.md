# CHP Maturity Index Assessment Platform
## Software System Documentation — v1.0

> **Classification:** Internal Technical Documentation
> **Prepared for:** Development Team / Project Stakeholders
> **Date:** May 2026
> **Based on:** CHW Maturity Index Calculation Table (May 2026)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Excel Framework Analysis](#2-excel-framework-analysis)
3. [Problem Statement](#3-problem-statement)
4. [Proposed System](#4-proposed-system)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [System Architecture](#8-system-architecture)
9. [Database Design](#9-database-design)
10. [Scoring Engine Design](#10-scoring-engine-design)
11. [API Design](#11-api-design)
12. [Frontend Structure](#12-frontend-structure)
13. [Dashboard & Reporting](#13-dashboard--reporting)
14. [Assessment Workflow](#14-assessment-workflow)
15. [Security Design](#15-security-design)
16. [File Upload & Evidence System](#16-file-upload--evidence-system)
17. [Deployment Architecture](#17-deployment-architecture)
18. [Testing Strategy](#18-testing-strategy)
19. [Future Enhancements](#19-future-enhancements)
20. [Development Roadmap](#20-development-roadmap)

---

## 1. Project Overview

### 1.1 System Purpose

The **CHP Maturity Index Assessment Platform (CHPMIAP)** is a web-based system that digitizes the Community Health Programme (CHP) Maturity Index framework. The platform replaces a static Excel-based assessment process with a centralized, multi-user, data-driven application that enables countries and health programs to assess, track, and improve the maturity of their community health programs against a standardized global framework.

The platform operationalizes the **CHP Maturity Index (CHPMI)** — a structured scoring model across 5 domains, 10 components, and 30 criteria — delivering automated maturity scoring, visual dashboards, audit trails, evidence management, and benchmarking capabilities.

### 1.2 Objectives

- Digitize the paper/Excel-based CHPMI assessment into an accessible, multi-user web platform
- Automate maturity score calculations and maturity band classification in real time
- Enable structured evidence collection per criterion to support scoring decisions
- Provide longitudinal tracking to monitor program maturity over time and across assessment cycles
- Support multi-country benchmarking and comparative analysis
- Generate exportable reports (PDF/Excel) for stakeholders and government bodies
- Enforce structured review and approval workflows to maintain assessment quality
- Provide role-based access for national teams, regional offices, and development partners

### 1.3 Stakeholders

| Stakeholder | Role |
|---|---|
| Ministry of Health (National Level) | Primary owner; conducts national CHP assessments |
| Sub-national Health Authorities | Conduct subnational assessments and reviews |
| Development Partners / NGOs | Observers, technical reviewers, and benchmarking participants |
| WHO / Global Health Bodies | Platform administrators; cross-country analytics |
| CHW Program Managers | Assessors and operational users |
| System Administrators | Platform management, user provisioning, data integrity |

### 1.4 Expected Outcomes

- Reduction in assessment preparation and scoring time from days to hours
- Standardized, auditable scoring with full justification trail
- Real-time maturity dashboards replacing manual Excel reports
- Cross-country benchmarking enabling peer learning
- Historical trend analysis across assessment cycles
- Elimination of formula errors and version control issues inherent to Excel

---

## 2. Excel Framework Analysis

### 2.1 Framework Structure Overview

The Excel file (`CHW_maturity_index_calculation_table_May_2026.xlsx`) implements the **CHP Maturity Index (CHPMI)** across the following hierarchy:

```
CHPMI (Overall Score 0–100%)
└── Categories (5)
    └── Components (10)
        └── Criteria (30 — 3 per component)
            └── Maturity Levels (0–4 per criterion)
```

### 2.2 Domains (Categories)

The framework groups 10 components into 5 overarching categories:

| # | Category | Components Included |
|---|---|---|
| 1 | **Leadership and Governance** | Policy & Legal Recognition, Multisectoral Coordination, Community Health Units, Monitoring & Evaluation |
| 2 | **Financing** | Financing |
| 3 | **Workforce** | CHW Training & Certification, CHW Career Pathways, CHW Payment |
| 4 | **Supplies** | Supply and Logistics |
| 5 | **Outcomes** | Coverage, Equity, Quality & Accountability |

### 2.3 Components (10 Total)

| # | Component | Category |
|---|---|---|
| 1 | Policy and Legal Recognition of CHWs with a Defined Scope of Practice | Leadership & Governance |
| 2 | Multisectoral Coordination | Leadership & Governance |
| 3 | Community Health Units (CHUs) | Leadership & Governance |
| 4 | Monitoring and Evaluation | Leadership & Governance |
| 5 | Financing | Financing |
| 6 | CHWs Training and Certification | Workforce |
| 7 | CHWs Career Pathways | Workforce |
| 8 | CHWs Payment | Workforce |
| 9 | Supply and Logistics | Supplies |
| 10 | Outcomes (Coverage, Equity, Quality & Accountability) | Outcomes |

### 2.4 Criteria Structure (3 per Component)

Each component has exactly 3 scoring criteria. Each criterion is assessed independently on a 0–4 scale. Example for Component 1 (Policy & Legal Recognition):

| Criterion | Description |
|---|---|
| 1.1 | Legal & Policy Frameworks (recognition and regulation of CHWs) |
| 1.2 | Dynamic and Evolving CHW Roles (scope of practice, competencies, career progression) |
| 1.3 | Institutionalization & Integration of CHWs into Governance and Health Systems |

### 2.5 Maturity Levels (Per Criterion)

Each criterion is scored on a **0–4 integer scale**:

| Level | Label | Description |
|---|---|---|
| 0 | Non-Existent | Component entirely absent; no structures, policies, or oversight |
| 1 | Emerging | First steps toward formalization; ad hoc, fragmented, partner-supported |
| 2 | Developing | Systems begin to take shape; limited reach, partial integration |
| 3 | Established | Fully functional in most areas; embedded in national systems |
| 4 | Matured | Fully institutionalized, continuously improving, sustainably financed |

### 2.6 Scoring Logic (Reverse-Engineered from Excel)

#### Criterion Score
Each criterion receives an integer score from 0 to 4, entered manually by the assessor in the **"Scoring"** column.

#### Component Score
The component score is the **arithmetic mean of its 3 criteria scores**:

```
Component Score = (Criterion_1 + Criterion_2 + Criterion_3) / 3
```

Range: `0.00 – 4.00`

**Example (Component 1 — Policy & Legal Recognition):**
- Criterion 1: Score = 0
- Criterion 2: Score = 2
- Criterion 3: Score = 3
- Component Score = (0 + 2 + 3) / 3 = **1.667**

#### Category Score
The category score is the **arithmetic mean of its component scores**, converted to a 0–100% scale:

```
Category Score (%) = (Average of Component Scores / 4) × 100
```

**Example (Leadership & Governance — 4 components):**
- Component 1 Score: 1.667
- Component 2 Score: 1.333
- Component 3 Score: 0.000
- Component 4 Score: 0.000
- Average = (1.667 + 1.333 + 0.000 + 0.000) / 4 = 0.750
- Category Score = (0.750 / 4) × 100 = **18.75%**

> Note: From the Excel data, the "Category score" column shows `0.75` (raw, not yet ×25), and the total is `7.5%` overall — indicating the final CHPMI = average of all raw category scores × 25, or equivalently average of all component scores / 4 × 100.

#### Overall CHPMI Score
```
CHPMI (%) = (Sum of all 10 Component Scores) / (10 × 4) × 100
           = Average Component Score / 4 × 100
```

Or equivalently:
```
CHPMI (%) = (Total raw score across all 30 criteria) / 120 × 100
```

**Demonstrated in the Excel:** With scores of [0,2,3,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]:
- Sum = 9
- CHPMI = 9 / 120 × 100 = **7.5%** ✓

### 2.7 Maturity Band Classification

The CHPMI percentage maps to a maturity band:

| CHPMI (%) | Maturity Band | System Attributes |
|---|---|---|
| 0 | Non-Existent | No meaningful structures or policies; requires foundational investment |
| 0–20 | Nascent | Minimal structures; activities ad hoc, informal, or exploratory |
| 21–40 | Emerging | Fragmented, project-based systems; focus on coordination and alignment |
| 41–60 | Developing | Foundational systems in place but inconsistent; emphasis on integration |
| 61–80 | Established | Systems functional, standardized, embedded in national frameworks |
| >80 | Matured | Fully institutionalized, sustainable, equity-driven, adaptive |

### 2.8 Sheet Structure Summary

| Sheet | Purpose |
|---|---|
| `CHP Maturity Progression` | Main scoring sheet — criteria, level descriptors, scores, component/category totals |
| `Maturity Progression` | Narrative descriptions for each maturity level (0–4) |
| `Maturity Band` | Lookup table: CHPMI % → Maturity Band + System Attributes |
| `Rf1–Rf10` | Reference narrative sheets for each of the 10 components |

---

## 3. Problem Statement

### 3.1 Current Limitations of the Excel System

The current Excel-based CHPMI assessment process presents several operational constraints that limit its scalability, reliability, and usefulness for national health programs:

**Version Control and Data Integrity**
Assessments are distributed as individual Excel files with no central repository. Multiple versions circulate simultaneously, leading to data inconsistency, overwritten scores, and inability to track who changed what and when.

**Manual Scoring Errors**
Criterion scores are entered manually. There is no validation preventing scores outside the 0–4 range, no enforcement of integer-only values, and no warning when required fields are left blank. Formula errors can propagate silently.

**No Collaborative Workflow**
The Excel model supports only one user at a time. Teams cannot collaboratively assess or review concurrently. There is no structured review or approval mechanism to verify that scores are justified and evidence-backed.

**No Evidence Management**
The framework requires justifications per criterion, but the Excel file has only a free-text justification column with no ability to attach supporting documents, links, or files.

**Limited Reporting Capabilities**
Reports require manual chart creation and formatting in Excel. There is no automated PDF export, no radar charts comparing domains, and no longitudinal comparison across assessment cycles.

**No Longitudinal Tracking**
Comparing one assessment cycle to another requires maintaining multiple Excel files and performing manual comparisons. Trend analysis is not supported.

**No Benchmarking**
Cross-country or cross-program comparison is not possible within the Excel model. Programs cannot benchmark themselves against regional or global peers.

**Accessibility and Portability**
Excel files require local software installation, have no mobile support, and are difficult to share securely. Remote or low-bandwidth users face significant barriers.

---

## 4. Proposed System

### 4.1 Platform Description

The **CHP Maturity Index Assessment Platform** is a centralized, web-based application that digitizes and automates the full CHPMI assessment lifecycle — from assessment initiation through scoring, review, approval, reporting, and longitudinal tracking.

### 4.2 Core Platform Capabilities

**Digital Assessment Engine**
Structured online forms replacing the Excel scoring sheet, with criteria descriptions, maturity level descriptors displayed inline, score selectors (0–4), and mandatory justification fields. Scores are auto-saved and validated in real time.

**Automated Scoring Engine**
All calculations (component scores, category scores, CHPMI %) are computed automatically server-side upon each score submission. No manual formula management required.

**Evidence Upload System**
Each criterion supports attachment of supporting documents (PDFs, images, Word files) as evidence for the score awarded. Files are stored securely and linked to the assessment record.

**Multi-User Collaborative Workflow**
Assessment, review, and approval roles are separated. Reviewers can annotate scores and request revisions. Approvers finalize assessments. Full audit trail maintained throughout.

**Real-Time Dashboards**
Interactive dashboards display maturity scores by domain and component using radar charts, bar graphs, and trend lines. Dashboards update in real time as assessments progress.

**Longitudinal Tracking**
All completed assessments are stored historically. Organizations can view their maturity progression over time across assessment cycles.

**Benchmarking Module**
Organizations can compare their CHPMI scores against anonymized national or regional averages, enabling peer learning and performance contextualization.

**Reporting**
One-click generation of structured PDF reports and Excel exports with full domain breakdowns, scores, justifications, evidence references, and maturity band classification.

---

## 5. User Roles & Permissions

### 5.1 Role Definitions

| Role | Description |
|---|---|
| **Super Admin** | Platform-wide administrator. Manages all organizations, users, system configuration, and reference data |
| **Admin** | Organization-level administrator. Manages users within their organization, creates assessments, manages reporting |
| **Assessor** | Conducts assessments. Enters criterion scores, justifications, and uploads evidence |
| **Reviewer** | Reviews completed assessments. Annotates, requests revisions, and forwards for approval |
| **Viewer** | Read-only access to completed assessments and dashboards within their organization |

### 5.2 RBAC Permission Matrix

| Permission | Super Admin | Admin | Assessor | Reviewer | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| Manage all organizations | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage system settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage users (own org) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create assessment | ✅ | ✅ | ❌ | ❌ | ❌ |
| Enter/edit criterion scores | ✅ | ✅ | ✅ | ❌ | ❌ |
| Upload evidence files | ✅ | ✅ | ✅ | ❌ | ❌ |
| Submit assessment for review | ✅ | ✅ | ✅ | ❌ | ❌ |
| Review and annotate | ✅ | ✅ | ❌ | ✅ | ❌ |
| Request revision | ✅ | ✅ | ❌ | ✅ | ❌ |
| Approve/finalize assessment | ✅ | ✅ | ❌ | ❌ | ❌ |
| View completed assessments | ✅ | ✅ | ✅ (own) | ✅ | ✅ |
| Access dashboards | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| View cross-org benchmarks | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage reference data | ✅ | ❌ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 6. Functional Requirements

### 6.1 Authentication & Authorization

- **FR-AUTH-01:** Users shall log in with email and password. JWT tokens issued on successful authentication (access token: 15 min, refresh token: 7 days).
- **FR-AUTH-02:** Role-based access control shall enforce permissions defined in Section 5.2 on every API endpoint.
- **FR-AUTH-03:** Passwords must be minimum 10 characters, include uppercase, lowercase, number, and special character.
- **FR-AUTH-04:** Password reset via time-limited (1 hour) email token.
- **FR-AUTH-05:** Account lockout after 5 consecutive failed login attempts (30-minute lockout).
- **FR-AUTH-06:** Super Admin can impersonate users for support purposes (with audit log entry).

### 6.2 Organization & User Management

- **FR-ORG-01:** Super Admin can create, edit, suspend, and delete organizations.
- **FR-ORG-02:** Organizations represent a country or program conducting an assessment.
- **FR-USER-01:** Admins can invite users via email, assigning a role.
- **FR-USER-02:** Users can update their profile (name, password, avatar).
- **FR-USER-03:** Super Admin can promote/demote user roles platform-wide.

### 6.3 Assessment Management

- **FR-ASSESS-01:** Admins can create a new assessment for their organization, specifying the assessment cycle name, period, and assessment type (national, subnational).
- **FR-ASSESS-02:** Assessments are structured around the fixed 10-component, 30-criterion CHPMI framework.
- **FR-ASSESS-03:** Assessors can enter an integer score (0–4) per criterion via a validated input.
- **FR-ASSESS-04:** Each criterion displays the level descriptors (0–4) inline to guide scoring.
- **FR-ASSESS-05:** Each criterion requires a mandatory text justification before submission.
- **FR-ASSESS-06:** Assessors can save progress at any point (draft state).
- **FR-ASSESS-07:** Assessments progress through the following states: `Draft → In Progress → Under Review → Revision Requested → Approved`.
- **FR-ASSESS-08:** Assessors can submit assessment for review once all criteria are scored and justified.

### 6.4 Scoring Engine

- **FR-SCORE-01:** Component scores shall be auto-calculated as the arithmetic mean of 3 criterion scores.
- **FR-SCORE-02:** Category scores shall be auto-calculated as the arithmetic mean of component scores within the category, expressed as a percentage of maximum (×25).
- **FR-SCORE-03:** CHPMI (%) shall be auto-calculated as (sum of all criterion scores) / 120 × 100.
- **FR-SCORE-04:** Maturity band shall be auto-classified per the lookup table (Section 2.7).
- **FR-SCORE-05:** Scores shall recalculate automatically whenever a criterion score is updated.
- **FR-SCORE-06:** The scoring engine shall be implemented server-side to prevent client-side manipulation.

### 6.5 Dashboard

- **FR-DASH-01:** Organization dashboard displays current CHPMI %, maturity band, and component-level scores.
- **FR-DASH-02:** Radar chart displays all 10 component scores (0–100%) visually.
- **FR-DASH-03:** Bar chart displays category-level scores side by side.
- **FR-DASH-04:** Trend line chart displays CHPMI % across all completed assessment cycles.
- **FR-DASH-05:** Dashboard updates in real time during an active assessment.
- **FR-DASH-06:** Super Admin dashboard aggregates data across all organizations.

### 6.6 Reporting

- **FR-RPT-01:** Generate PDF report: full assessment with domain breakdown, component scores, criterion scores, justifications, evidence references, and maturity band.
- **FR-RPT-02:** Generate Excel export of the scoring matrix with all scores and justifications.
- **FR-RPT-03:** Reports include the organization name, assessment period, and generation timestamp.
- **FR-RPT-04:** Comparative report: side-by-side view of two assessment cycles for the same organization.

### 6.7 Evidence Upload

- **FR-EV-01:** Assessors can upload 1 or more files per criterion as supporting evidence.
- **FR-EV-02:** Supported file types: PDF, DOCX, XLSX, PNG, JPG, MP4.
- **FR-EV-03:** Maximum file size: 20 MB per file, 200 MB per assessment.
- **FR-EV-04:** Each file can be labeled with a title and description.
- **FR-EV-05:** Uploaded files are accessible to Reviewers and Admins.
- **FR-EV-06:** Files are retained for a minimum of 5 years post-assessment approval.

### 6.8 Analytics

- **FR-AN-01:** Identify lowest-scoring components across an assessment to surface priority areas.
- **FR-AN-02:** Display score distribution per criterion across all organizations (Super Admin only).
- **FR-AN-03:** Show percentage completion of ongoing assessments.
- **FR-AN-04:** Export analytics data as CSV for further analysis.

### 6.9 Audit Logs

- **FR-AUDIT-01:** Every score entry, update, file upload, status change, and user action is logged with user ID, timestamp, and previous/new values.
- **FR-AUDIT-02:** Audit logs are immutable and viewable by Admin and Super Admin.
- **FR-AUDIT-03:** Audit logs are exportable as CSV.

---

## 7. Non-Functional Requirements

### 7.1 Performance

- API response time for standard CRUD operations: < 300ms (p95)
- Dashboard load time: < 2 seconds on standard broadband
- PDF report generation: < 10 seconds
- System shall support 500 concurrent users without degradation
- Database queries on assessment records shall complete in < 100ms with proper indexing

### 7.2 Scalability

- Stateless backend allowing horizontal scaling behind a load balancer
- Database connection pooling (min: 10, max: 100 connections)
- File storage decoupled from application server (object storage)
- Architecture supports multi-region deployment for global use

### 7.3 Security

- All data in transit encrypted via TLS 1.3
- All data at rest encrypted (AES-256)
- JWT tokens signed with RS256 asymmetric keys
- Input validation and sanitization on all API endpoints
- SQL injection prevention via parameterized queries (no raw string interpolation)
- File upload scanning for malware before storage
- Rate limiting on all authentication endpoints (10 requests/min per IP)
- OWASP Top 10 vulnerabilities addressed in design

### 7.4 Availability

- Target uptime: 99.5% (< 44 hours downtime/year)
- Automated health checks and alerting
- Database automated backups: daily full, hourly incremental, 90-day retention
- Graceful degradation — read-only mode if database is temporarily unavailable

### 7.5 Usability

- Responsive design supporting desktop (1280px+) and tablet (768px+) breakpoints
- Accessible to WCAG 2.1 AA standard
- System shall be operable with a maximum of 3 clicks to reach any primary function
- Internationalization-ready (i18n) for future multi-language support
- Loading states and error messages on all async operations

### 7.6 Maintainability

- TypeScript throughout (frontend and backend) for type safety
- Code coverage: minimum 80% unit test coverage
- API versioning (`/api/v1/`) to support non-breaking upgrades
- Centralized configuration management via environment variables
- Automated CI/CD pipeline for deployments

---

## 8. System Architecture

### 8.1 Architecture Overview

The platform follows a **three-tier web architecture** with a clear separation between presentation, application logic, and data storage layers.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  Next.js (SSR + CSR)  │  TypeScript  │  Tailwind CSS           │
│  Deployed on Vercel or AWS CloudFront + S3                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / REST API
┌──────────────────────────────▼──────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  Express.js + Node.js  │  JWT Auth  │  RBAC Middleware          │
│  Scoring Engine  │  PDF Generator  │  File Upload Handler       │
│  Deployed on AWS EC2 / ECS (containerized)                      │
└──────────────┬───────────────────────────────┬──────────────────┘
               │                               │
┌──────────────▼──────────┐     ┌──────────────▼──────────────────┐
│     DATABASE LAYER      │     │       FILE STORAGE LAYER        │
│  PostgreSQL (RDS)       │     │  AWS S3 / Compatible Object     │
│  Primary + Read Replica │     │  Storage                        │
└─────────────────────────┘     └─────────────────────────────────┘
```

### 8.2 Component Interaction Diagram

```mermaid
graph TD
    A[Browser / Client] -->|HTTPS| B[Next.js Frontend]
    B -->|REST API Calls| C[Express.js API Server]
    C -->|JWT Validation| D[Auth Middleware]
    D -->|RBAC Check| E[Route Handler]
    E -->|ORM Queries| F[PostgreSQL Database]
    E -->|File Operations| G[Object Storage S3]
    E -->|Score Calculation| H[Scoring Engine Module]
    H --> F
    E -->|PDF Generation| I[Report Generator]
    I --> G
    F -->|Read Replica| J[Analytics Queries]
    J --> E
```

### 8.3 Request Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Next.js Frontend
    participant API as Express API
    participant Auth as Auth Middleware
    participant DB as PostgreSQL
    participant SE as Scoring Engine

    U->>FE: Submit criterion score
    FE->>API: POST /api/v1/assessments/:id/responses
    API->>Auth: Validate JWT token
    Auth-->>API: Token valid, user role = Assessor
    API->>DB: Save criterion response
    DB-->>API: Response saved
    API->>SE: Recalculate component/category/CHPMI scores
    SE->>DB: Update computed score fields
    DB-->>SE: Updated
    SE-->>API: New scores
    API-->>FE: 200 OK + updated score payload
    FE->>U: Re-render dashboard with new scores
```

---

## 9. Database Design

### 9.1 Entity Relationship Overview

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : has
    ORGANIZATIONS ||--o{ ASSESSMENTS : owns
    USERS ||--o{ ASSESSMENTS : creates
    ASSESSMENTS ||--o{ RESPONSES : contains
    ASSESSMENTS ||--o{ EVIDENCE_FILES : has
    ASSESSMENTS ||--o{ AUDIT_LOGS : tracked_by
    ASSESSMENTS ||--o{ REPORTS : generates
    DOMAINS ||--o{ COMPONENTS : contains
    COMPONENTS ||--o{ CRITERIA : contains
    CRITERIA ||--o{ CRITERIA_LEVELS : has
    CRITERIA ||--o{ RESPONSES : answered_by
    RESPONSES ||--o{ EVIDENCE_FILES : supported_by
    MATURITY_BANDS ||--o{ ASSESSMENTS : classifies
```

### 9.2 Table Definitions

#### `organizations`
```sql
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    country_code    CHAR(3),              -- ISO 3166-1 alpha-3
    region          VARCHAR(100),
    organization_type VARCHAR(50),        -- national, subnational, partner
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
```

#### `users`
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL
                    CHECK (role IN ('super_admin','admin','assessor','reviewer','viewer')),
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    failed_login_attempts INT DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
```

#### `domains`
```sql
CREATE TABLE domains (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(20) UNIQUE NOT NULL,  -- e.g. 'LG', 'FIN', 'WF', 'SUP', 'OUT'
    name            VARCHAR(255) NOT NULL,
    display_order   INT NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

#### `components`
```sql
CREATE TABLE components (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id       UUID REFERENCES domains(id) ON DELETE CASCADE,
    code            VARCHAR(20) UNIQUE NOT NULL,  -- e.g. 'C01', 'C02' ... 'C10'
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    display_order   INT NOT NULL,
    reference_text  TEXT,                          -- Full narrative from Rf sheets
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

#### `criteria`
```sql
CREATE TABLE criteria (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id    UUID REFERENCES components(id) ON DELETE CASCADE,
    code            VARCHAR(20) UNIQUE NOT NULL,  -- e.g. 'C01.1', 'C01.2', 'C01.3'
    name            VARCHAR(500) NOT NULL,
    display_order   INT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

#### `criteria_levels`
```sql
CREATE TABLE criteria_levels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    criteria_id     UUID REFERENCES criteria(id) ON DELETE CASCADE,
    level           INT NOT NULL CHECK (level BETWEEN 0 AND 4),
    label           VARCHAR(100) NOT NULL,   -- 'Non-Existent', 'Emerging', etc.
    description     TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(criteria_id, level)
);
```

#### `maturity_bands`
```sql
CREATE TABLE maturity_bands (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label           VARCHAR(50) UNIQUE NOT NULL,  -- 'Nascent', 'Emerging', etc.
    min_score       NUMERIC(5,2) NOT NULL,
    max_score       NUMERIC(5,2) NOT NULL,
    system_attributes TEXT,
    display_order   INT NOT NULL
);
```

#### `assessments`
```sql
CREATE TABLE assessments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by          UUID REFERENCES users(id),
    assigned_assessor   UUID REFERENCES users(id),
    assigned_reviewer   UUID REFERENCES users(id),
    cycle_name          VARCHAR(255) NOT NULL,  -- e.g. 'National Assessment 2026'
    assessment_period   VARCHAR(100),
    assessment_type     VARCHAR(50) DEFAULT 'national',
    status              VARCHAR(50) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','in_progress','under_review',
                                          'revision_requested','approved','archived')),
    chpmi_score         NUMERIC(5,2),           -- Computed: 0–100
    maturity_band_id    UUID REFERENCES maturity_bands(id),
    submitted_at        TIMESTAMPTZ,
    approved_at         TIMESTAMPTZ,
    approved_by         UUID REFERENCES users(id),
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
```

#### `responses`
```sql
CREATE TABLE responses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id       UUID REFERENCES assessments(id) ON DELETE CASCADE,
    criteria_id         UUID REFERENCES criteria(id),
    score               INT CHECK (score BETWEEN 0 AND 4),
    justification       TEXT,
    component_score     NUMERIC(5,4),   -- Computed: avg of 3 criteria (0–4)
    scored_by           UUID REFERENCES users(id),
    scored_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(assessment_id, criteria_id)
);
```

#### `computed_scores`
```sql
CREATE TABLE computed_scores (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id       UUID REFERENCES assessments(id) ON DELETE CASCADE,
    component_id        UUID REFERENCES components(id),
    domain_id           UUID REFERENCES domains(id),
    component_score     NUMERIC(5,4),   -- 0.0000–4.0000
    domain_score_pct    NUMERIC(5,2),   -- 0.00–100.00 (only set for first component of each domain)
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(assessment_id, component_id)
);
```

#### `evidence_files`
```sql
CREATE TABLE evidence_files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id   UUID REFERENCES assessments(id) ON DELETE CASCADE,
    response_id     UUID REFERENCES responses(id) ON DELETE CASCADE,
    uploaded_by     UUID REFERENCES users(id),
    file_name       VARCHAR(500) NOT NULL,
    file_title      VARCHAR(500),
    file_description TEXT,
    file_type       VARCHAR(50),
    file_size_bytes BIGINT,
    storage_key     VARCHAR(1000) NOT NULL,  -- S3 object key
    storage_url     TEXT,
    uploaded_at     TIMESTAMPTZ DEFAULT now()
);
```

#### `review_comments`
```sql
CREATE TABLE review_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id   UUID REFERENCES assessments(id) ON DELETE CASCADE,
    criteria_id     UUID REFERENCES criteria(id),  -- NULL for general comments
    commented_by    UUID REFERENCES users(id),
    comment         TEXT NOT NULL,
    comment_type    VARCHAR(50) DEFAULT 'review'
                    CHECK (comment_type IN ('review','revision_request','approval_note')),
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

#### `reports`
```sql
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id   UUID REFERENCES assessments(id) ON DELETE CASCADE,
    generated_by    UUID REFERENCES users(id),
    report_type     VARCHAR(50) NOT NULL
                    CHECK (report_type IN ('pdf','excel','comparative')),
    storage_key     VARCHAR(1000),
    generated_at    TIMESTAMPTZ DEFAULT now()
);
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    assessment_id   UUID REFERENCES assessments(id),
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100),
    entity_id       UUID,
    previous_value  JSONB,
    new_value       JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 9.3 Key Indexes

```sql
-- Performance-critical indexes
CREATE INDEX idx_assessments_org ON assessments(organization_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_responses_assessment ON responses(assessment_id);
CREATE INDEX idx_responses_criteria ON responses(criteria_id);
CREATE INDEX idx_computed_scores_assessment ON computed_scores(assessment_id);
CREATE INDEX idx_evidence_files_response ON evidence_files(response_id);
CREATE INDEX idx_audit_logs_assessment ON audit_logs(assessment_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
```

---

## 10. Scoring Engine Design

### 10.1 Architecture

The scoring engine is a dedicated TypeScript module in the Express.js backend. It is triggered:
- Whenever an assessor saves or updates a criterion score
- When an assessment is submitted for review (final recalculation)
- On-demand via the `/api/v1/assessments/:id/recalculate` endpoint

### 10.2 Engine Implementation

```typescript
// src/services/scoringEngine.ts

interface CriterionResponse {
  criteriaId: string;
  componentId: string;
  domainId: string;
  score: number; // 0–4
}

interface ComponentScore {
  componentId: string;
  domainId: string;
  criteriaScores: number[];
  componentScore: number; // avg of 3 criteria
}

interface DomainScore {
  domainId: string;
  componentScores: number[];
  domainScoreRaw: number; // avg of component scores (0–4)
  domainScorePct: number; // (raw / 4) * 100
}

interface AssessmentScore {
  componentScores: ComponentScore[];
  domainScores: DomainScore[];
  chpmiScore: number;      // 0–100
  maturityBand: string;
}

export function calculateComponentScore(criteriaScores: number[]): number {
  if (criteriaScores.length !== 3) {
    throw new Error('Each component must have exactly 3 criteria scores');
  }
  const sum = criteriaScores.reduce((acc, s) => acc + s, 0);
  return sum / 3; // Returns 0.0000–4.0000
}

export function calculateDomainScore(componentScores: number[]): {
  raw: number;
  pct: number;
} {
  const avg = componentScores.reduce((acc, s) => acc + s, 0) / componentScores.length;
  return {
    raw: avg,
    pct: (avg / 4) * 100,
  };
}

export function calculateCHPMI(allCriteriaScores: number[]): number {
  // CHPMI = (sum of all 30 criterion scores) / 120 * 100
  // 120 = 30 criteria × max score of 4
  const MAX_TOTAL = 30 * 4; // 120
  const total = allCriteriaScores.reduce((acc, s) => acc + s, 0);
  return (total / MAX_TOTAL) * 100;
}

export function classifyMaturityBand(chpmiScore: number): string {
  if (chpmiScore === 0) return 'Non-Existent';
  if (chpmiScore <= 20) return 'Nascent';
  if (chpmiScore <= 40) return 'Emerging';
  if (chpmiScore <= 60) return 'Developing';
  if (chpmiScore <= 80) return 'Established';
  return 'Matured';
}

export async function recalculateAssessment(
  assessmentId: string,
  db: DatabaseClient
): Promise<AssessmentScore> {
  // 1. Fetch all responses for this assessment
  const responses = await db.query(
    `SELECT r.score, cr.component_id, c.domain_id, r.criteria_id
     FROM responses r
     JOIN criteria cr ON r.criteria_id = cr.id
     JOIN components c ON cr.component_id = c.id
     WHERE r.assessment_id = $1`,
    [assessmentId]
  );

  // 2. Group by component
  const byComponent: Map<string, number[]> = new Map();
  const byDomain: Map<string, string[]> = new Map();

  for (const row of responses.rows) {
    if (!byComponent.has(row.component_id)) {
      byComponent.set(row.component_id, []);
      byDomain.set(row.domain_id, [
        ...(byDomain.get(row.domain_id) || []),
        row.component_id,
      ]);
    }
    byComponent.get(row.component_id)!.push(row.score);
  }

  // 3. Calculate component scores
  const componentScores: ComponentScore[] = [];
  for (const [componentId, scores] of byComponent.entries()) {
    const componentScore = calculateComponentScore(scores);
    componentScores.push({ componentId, componentScore, criteriaScores: scores, domainId: '' });
  }

  // 4. Calculate all criteria scores for CHPMI
  const allScores = responses.rows.map((r: any) => r.score);
  const chpmiScore = calculateCHPMI(allScores);
  const maturityBand = classifyMaturityBand(chpmiScore);

  // 5. Persist computed scores to database
  for (const cs of componentScores) {
    await db.query(
      `INSERT INTO computed_scores (assessment_id, component_id, component_score)
       VALUES ($1, $2, $3)
       ON CONFLICT (assessment_id, component_id)
       DO UPDATE SET component_score = $3, updated_at = now()`,
      [assessmentId, cs.componentId, cs.componentScore]
    );
  }

  // 6. Update assessment CHPMI score
  await db.query(
    `UPDATE assessments
     SET chpmi_score = $1, updated_at = now()
     WHERE id = $2`,
    [chpmiScore, assessmentId]
  );

  return { componentScores, domainScores: [], chpmiScore, maturityBand };
}
```

### 10.3 Score Normalization for Display

For the frontend radar charts, component scores (0–4) are normalized to 0–100%:

```typescript
export function normalizeScore(rawScore: number, maxScore = 4): number {
  return (rawScore / maxScore) * 100;
}
```

### 10.4 Scoring Edge Cases

| Scenario | Handling |
|---|---|
| Criterion not yet scored | Excluded from component average; component score shown as partial |
| All criteria in component = 0 | Component score = 0.000 (valid, not null) |
| Score outside 0–4 | API returns 400 validation error |
| Assessment has 0 responses | CHPMI = 0, Band = Non-Existent |
| Decimal score submitted | Rejected; only integers 0–4 accepted |

---

## 11. API Design

### 11.1 Base URL and Versioning

```
https://api.chpmi.platform.org/api/v1/
```

### 11.2 Authentication Endpoints

```
POST   /auth/login               # Login with email/password
POST   /auth/logout              # Invalidate refresh token
POST   /auth/refresh             # Refresh access token
POST   /auth/forgot-password     # Request password reset email
POST   /auth/reset-password      # Reset password with token
GET    /auth/me                  # Get current user profile
```

**Login Request/Response:**
```json
// POST /auth/login
{
  "email": "assessor@moh.et",
  "password": "SecurePass@2026"
}

// 200 Response
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "user": {
    "id": "uuid",
    "email": "assessor@moh.et",
    "fullName": "Dr. Tigist Bekele",
    "role": "assessor",
    "organizationId": "uuid"
  }
}
```

### 11.3 Assessment Endpoints

```
GET    /assessments                      # List assessments (org-scoped by role)
POST   /assessments                      # Create new assessment
GET    /assessments/:id                  # Get assessment detail
PATCH  /assessments/:id                  # Update assessment metadata
DELETE /assessments/:id                  # Delete draft assessment
POST   /assessments/:id/submit           # Submit for review
POST   /assessments/:id/approve          # Approve assessment
POST   /assessments/:id/request-revision # Request revision
POST   /assessments/:id/recalculate      # Force recalculate scores
GET    /assessments/:id/scores           # Get all computed scores
GET    /assessments/:id/audit-log        # Get audit trail
```

**Create Assessment:**
```json
// POST /assessments
{
  "cycleName": "National CHP Assessment 2026",
  "assessmentPeriod": "Jan–May 2026",
  "assessmentType": "national",
  "assignedAssessorId": "uuid",
  "assignedReviewerId": "uuid"
}

// 201 Response
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "cycleName": "National CHP Assessment 2026",
  "status": "draft",
  "chpmiScore": null,
  "maturityBand": null,
  "createdAt": "2026-05-01T08:00:00Z"
}
```

### 11.4 Response (Scoring) Endpoints

```
GET    /assessments/:id/responses        # Get all criterion responses
POST   /assessments/:id/responses        # Save/update criterion score
GET    /assessments/:id/responses/:criteriaId  # Get single criterion response
```

**Save Criterion Score:**
```json
// POST /assessments/:id/responses
{
  "criteriaId": "uuid-of-criterion",
  "score": 3,
  "justification": "National policy approved in 2023, implemented across 9 regions. Periodic review occurs but inconsistencies remain in 2 regions."
}

// 200 Response
{
  "responseId": "uuid",
  "criteriaId": "uuid",
  "score": 3,
  "justification": "...",
  "componentScore": 1.667,
  "chpmiScore": 7.5,
  "maturityBand": "Nascent"
}
```

### 11.5 Evidence File Endpoints

```
POST   /assessments/:id/responses/:criteriaId/evidence   # Upload evidence file
GET    /assessments/:id/responses/:criteriaId/evidence   # List evidence files
DELETE /evidence/:fileId                                  # Delete evidence file
GET    /evidence/:fileId/download                         # Get signed download URL
```

### 11.6 Report Endpoints

```
POST   /assessments/:id/reports/pdf       # Generate PDF report
POST   /assessments/:id/reports/excel     # Generate Excel export
GET    /assessments/:id/reports           # List generated reports
GET    /reports/:reportId/download        # Download report
```

### 11.7 Dashboard & Analytics Endpoints

```
GET    /dashboard/organization/:orgId     # Org-level maturity dashboard data
GET    /dashboard/global                  # Global aggregate (Super Admin)
GET    /analytics/trends/:orgId           # Historical CHPMI trend
GET    /analytics/benchmarks              # Cross-org benchmarks (anonymized)
GET    /analytics/component-gaps/:orgId  # Lowest scoring components
```

### 11.8 Reference Data Endpoints

```
GET    /reference/domains                 # All domains
GET    /reference/components              # All components
GET    /reference/criteria                # All criteria with level descriptors
GET    /reference/maturity-bands          # Maturity band lookup table
```

### 11.9 Standard Error Responses

```json
// 400 Bad Request
{ "error": "VALIDATION_ERROR", "message": "Score must be an integer between 0 and 4", "field": "score" }

// 401 Unauthorized
{ "error": "UNAUTHORIZED", "message": "Access token expired or invalid" }

// 403 Forbidden
{ "error": "FORBIDDEN", "message": "Assessor role cannot approve assessments" }

// 404 Not Found
{ "error": "NOT_FOUND", "message": "Assessment not found" }

// 500 Internal Server Error
{ "error": "INTERNAL_ERROR", "message": "An unexpected error occurred", "requestId": "uuid" }
```

---

## 12. Frontend Structure

### 12.1 Page Architecture

```
app/
├── (auth)/
│   ├── login/                    # Login page
│   ├── forgot-password/          # Forgot password
│   └── reset-password/           # Reset password (token)
├── (platform)/
│   ├── layout.tsx                # Authenticated shell with sidebar nav
│   ├── dashboard/                # Organization maturity dashboard
│   ├── assessments/
│   │   ├── page.tsx              # Assessment list
│   │   ├── new/                  # Create new assessment
│   │   └── [id]/
│   │       ├── page.tsx          # Assessment overview
│   │       ├── scoring/          # Domain-by-domain scoring interface
│   │       ├── review/           # Reviewer interface
│   │       └── report/           # Report preview and export
│   ├── analytics/                # Trends, benchmarks
│   ├── users/                    # User management (Admin+)
│   ├── organizations/            # Organization management (Super Admin)
│   └── settings/                 # User profile, org settings
└── api/                          # Next.js API route proxies (if needed)
```

### 12.2 Key Components

#### Assessment Scoring Interface
```
<AssessmentScoringPage>
  <AssessmentHeader cycleName, status, progress% />
  <DomainTabBar domains[] currentDomain />
  <ComponentSection>
    <ComponentHeader name description />
    <CriteriaCard>
      <CriterionHeader code name />
      <LevelDescriptorAccordion levels[0..4] />
      <ScoreSelector value={0..4} onChange />
      <JustificationTextarea required value onChange />
      <EvidenceUpload files[] onUpload onDelete />
      <AutoSaveIndicator status />
    </CriteriaCard>
  </ComponentSection>
  <ScoreSummaryPanel componentScore chpmiScore maturityBand />
</AssessmentScoringPage>
```

#### Dashboard
```
<DashboardPage>
  <MaturityBandBadge band="Nascent" score={7.5} />
  <CHPMIGauge value={7.5} max={100} />
  <DomainRadarChart domains[] scores[] />
  <ComponentBarChart components[] scores[] />
  <TrendLineChart cycles[] chpmiScores[] />
  <TopGapsPanel lowestComponents[] />
  <RecentAssessments />
</DashboardPage>
```

### 12.3 Reusable Component Library

| Component | Description |
|---|---|
| `ScoreSelector` | Segmented button group for 0–4 score selection with label display |
| `LevelDescriptorAccordion` | Collapsible panel showing all 5 maturity level descriptions |
| `MaturityBandBadge` | Color-coded badge showing maturity band |
| `CHPMIGauge` | Semicircular gauge chart (0–100%) with band color zones |
| `DomainRadarChart` | Recharts radar chart for 10-component comparison |
| `ComponentBarChart` | Horizontal bar chart for domain breakdowns |
| `TrendLineChart` | Line chart showing CHPMI % over assessment cycles |
| `EvidenceUpload` | Drag-and-drop file upload with preview and progress |
| `ProgressTracker` | Assessment completion progress (criteria scored / 30) |
| `AuditLogTable` | Paginated table of audit log entries |
| `StatusBadge` | Assessment workflow status indicator |
| `ReviewCommentThread` | Threaded comment display for review notes |

### 12.4 State Management

- React Query (TanStack Query) for all server state (fetching, caching, optimistic updates)
- Zustand for local UI state (active domain tab, sidebar state, theme)
- Form state managed via React Hook Form with Zod schema validation

---

## 13. Dashboard & Reporting

### 13.1 Organization Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│  CHP Maturity Dashboard — Ethiopia MoH (May 2026)        │
│  Current Status: NASCENT ▪ CHPMI: 7.5%                  │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────┐  ┌──────────────────────────── ┐
│  CHPMI Gauge (0–100%)    │  │  Domain Radar Chart         │
│  ■■□□□□□□□□ 7.5%         │  │  (10-component polygon)     │
└──────────────────────────┘  └─────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│  Component Scores (Bar Chart — horizontal)               │
│  C01 Policy & Legal         ██░░░░░░  41.7%             │
│  C02 Multisectoral Coord.   █░░░░░░░  33.3%             │
│  C03 Community Health Units ░░░░░░░░   0.0%             │
│  ...                                                     │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────┐  ┌──────────────────────────── ┐
│  Maturity Progression    │  │  Priority Gaps               │
│  (Trend Line: cycles)    │  │  Top 3 lowest components    │
└──────────────────────────┘  └─────────────────────────────┘
```

### 13.2 Maturity Band Color Coding

| Band | Color | Hex |
|---|---|---|
| Non-Existent | Deep Red | `#B91C1C` |
| Nascent | Red-Orange | `#EA580C` |
| Emerging | Amber | `#D97706` |
| Developing | Yellow | `#CA8A04` |
| Established | Teal | `#0D9488` |
| Matured | Green | `#15803D` |

### 13.3 PDF Report Structure

```
Cover Page
  - Organization name, country, assessment cycle, date
  - CHPMI score and maturity band (large, styled)

Section 1: Executive Summary
  - CHPMI %, maturity band, assessment period
  - Category-level scores table
  - Radar chart

Section 2: Domain Breakdown
  - Per domain: domain score, component scores, bar chart
  - For each component: component score + 3 criterion scores

Section 3: Criterion-Level Detail
  - For each criterion: score (0–4), level descriptor text, justification, evidence list

Section 4: Priority Areas for Improvement
  - Lowest 5 component scores with recommendations

Section 5: Historical Comparison (if prior assessments exist)
  - Trend table and line chart

Appendix: Evidence File Index
  - List of all uploaded evidence files by criterion
```

### 13.4 Excel Export Structure

Mirrors the original Excel structure:
- Sheet 1: "Assessment Summary" — CHPMI, bands, category scores
- Sheet 2: "Scoring Matrix" — all 30 criteria with scores and justifications
- Sheet 3: "Component Scores" — computed scores with formulas preserved
- Sheet 4: "Evidence Index" — list of all evidence files

---

## 14. Assessment Workflow

### 14.1 State Machine

```mermaid
stateDiagram-v2
    [*] --> Draft : Admin creates assessment
    Draft --> InProgress : Assessor opens and starts scoring
    InProgress --> Draft : Assessor saves (autosave)
    InProgress --> UnderReview : Assessor submits (all 30 criteria scored)
    UnderReview --> RevisionRequested : Reviewer requests changes
    RevisionRequested --> InProgress : Assessor revises scores
    UnderReview --> Approved : Reviewer/Admin approves
    Approved --> Archived : Admin archives
    Approved --> [*]
```

### 14.2 Workflow Rules

| Transition | Triggered By | Conditions |
|---|---|---|
| Draft → In Progress | Assessor | Assessment assigned; assessor opens |
| In Progress → Under Review | Assessor | All 30 criteria scored; all justifications filled |
| Under Review → Revision Requested | Reviewer | Reviewer flags specific criteria |
| Revision Requested → In Progress | Assessor | Assessor acknowledges revision request |
| Under Review → Approved | Admin/Reviewer | Final validation; CHPMI score locked |

### 14.3 Notification Events

| Event | Recipients |
|---|---|
| Assessment created | Assigned assessor (email) |
| Assessment submitted for review | Assigned reviewer (email) |
| Revision requested | Assigned assessor (email + in-app) |
| Assessment approved | Org admin (email + in-app) |
| Assessment due in 7 days | Assessor (email) |

### 14.4 Reassessment Cycle

When an organization initiates a new assessment cycle:
1. Admin creates a new assessment from the "New Assessment" form
2. System pre-populates the scoring template (blank scores, component framework intact)
3. Previous cycle's justifications are optionally pre-loaded as reference text (not scores)
4. Historical scores remain accessible for comparison in the dashboard

---

## 15. Security Design

### 15.1 JWT Authentication Flow

```
1. User submits credentials → POST /auth/login
2. Server verifies password hash (bcrypt, cost factor 12)
3. Server issues:
   - Access Token: RS256 signed, 15-minute expiry, payload: {sub, role, orgId}
   - Refresh Token: 7-day expiry, stored in httpOnly cookie
4. All API requests include: Authorization: Bearer <accessToken>
5. Middleware validates signature, expiry, and role on every request
6. On access token expiry: POST /auth/refresh using httpOnly refresh cookie
7. On logout: refresh token invalidated in database
```

### 15.2 RBAC Middleware

```typescript
// src/middleware/rbac.ts
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Populated by JWT middleware
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `This action requires one of: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}

// Usage example:
router.post('/assessments/:id/approve',
  authenticate,
  requireRole('admin', 'super_admin'),
  approveAssessment
);
```

### 15.3 Data Access Scoping

All database queries are scoped by organization:

```typescript
// Assessors only see their org's assessments
const assessments = await db.query(
  `SELECT * FROM assessments WHERE organization_id = $1`,
  [req.user.organizationId]
);
```

Super Admin queries are unrestricted; all other roles have organization-level isolation enforced at the service layer.

### 15.4 Input Validation

All API inputs validated with Zod schemas before reaching business logic:

```typescript
const submitResponseSchema = z.object({
  criteriaId: z.string().uuid(),
  score: z.number().int().min(0).max(4),
  justification: z.string().min(20).max(5000),
});
```

### 15.5 Password Security

- Hashing: bcrypt with cost factor 12 (≈250ms hash time)
- Minimum requirements: 10 characters, uppercase, lowercase, digit, special character
- Password history: last 5 passwords cannot be reused
- Breach check: integration with HaveIBeenPwned API on registration

### 15.6 File Upload Security

- File type validated by MIME type sniffing (not just extension)
- Files scanned with ClamAV before storage
- Files stored in private S3 bucket (no public access)
- Access via pre-signed URLs with 1-hour expiry
- Filenames sanitized before storage (no path traversal)

---

## 16. File Upload & Evidence System

### 16.1 Upload Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend
    participant AV as Antivirus
    participant S3 as Object Storage

    U->>FE: Select file
    FE->>API: POST /evidence (multipart/form-data)
    API->>API: Validate file type & size
    API->>AV: Scan file for malware
    AV-->>API: Clean
    API->>S3: Upload to private bucket
    S3-->>API: Object key
    API->>DB: Save evidence_files record
    API-->>FE: { fileId, fileName, uploadedAt }
    FE->>U: Show file in evidence list
```

### 16.2 Storage Key Structure

```
evidence/{organizationId}/{assessmentId}/{criteriaId}/{timestamp}_{filename}
```

Example:
```
evidence/org-001/assess-2026-001/crit-C01.1/20260501_120000_policy_document.pdf
```

### 16.3 Signed URL Generation

```typescript
async function getSignedDownloadUrl(storageKey: string): Promise<string> {
  return s3.getSignedUrlPromise('getObject', {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: storageKey,
    Expires: 3600, // 1 hour
  });
}
```

### 16.4 Evidence Display in Assessment

Each criterion scoring card displays:
- List of uploaded files with name, type, and upload timestamp
- Download button (opens signed URL in new tab)
- Delete button (soft-delete; file retained in S3, record flagged)
- "Add Evidence" button with drag-and-drop zone

---

## 17. Deployment Architecture

### 17.1 Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  DNS (Route 53 or Cloudflare)                                        │
│  chpmi.platform.org → CloudFront / Vercel                            │
│  api.chpmi.platform.org → Load Balancer                              │
└──────────────────────┬──────────────────────────┬───────────────────┘
                       │                          │
┌──────────────────────▼──────┐  ┌───────────────▼────────────────────┐
│  Frontend (Vercel / S3+CF)  │  │  API Load Balancer (AWS ALB)        │
│  Next.js static export      │  │  HTTPS termination, health checks   │
└─────────────────────────────┘  └───────────────┬────────────────────┘
                                                  │
                                 ┌────────────────▼────────────────────┐
                                 │  ECS / EC2 Auto-Scaling Group        │
                                 │  Express.js containers (2–8 nodes)   │
                                 └───────────┬────────────┬────────────┘
                                             │            │
                               ┌─────────────▼──┐  ┌─────▼──────────────┐
                               │  RDS PostgreSQL │  │  S3 (Evidence +    │
                               │  Primary +      │  │  Reports bucket)   │
                               │  Read Replica   │  └────────────────────┘
                               └────────────────┘
```

### 17.2 Environment Configuration

```bash
# Backend .env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@rds-host:5432/chpmi_prod
JWT_PRIVATE_KEY=<RS256 private key>
JWT_PUBLIC_KEY=<RS256 public key>
REFRESH_TOKEN_SECRET=<long random string>
AWS_REGION=af-south-1
S3_BUCKET_NAME=chpmi-evidence-prod
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid api key>
CLAMAV_HOST=clamav-service
MAX_FILE_SIZE_MB=20

# Frontend .env
NEXT_PUBLIC_API_URL=https://api.chpmi.platform.org/api/v1
```

### 17.3 Docker Configuration

```dockerfile
# Backend Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### 17.4 CI/CD Pipeline

```yaml
# GitHub Actions workflow
on:
  push:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run type-check

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    steps:
      - run: docker build -t chpmi-api:staging .
      - run: docker push <ecr-uri>/chpmi-api:staging
      - run: aws ecs update-service --cluster staging ...

  deploy-prod:
    needs: test
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - run: docker build -t chpmi-api:latest .
      - run: docker push <ecr-uri>/chpmi-api:latest
      - run: aws ecs update-service --cluster prod ...
```

---

## 18. Testing Strategy

### 18.1 Unit Testing (Jest + ts-jest)

**Scoring Engine Tests** — highest priority:

```typescript
// src/services/__tests__/scoringEngine.test.ts
describe('calculateComponentScore', () => {
  it('returns average of 3 criteria scores', () => {
    expect(calculateComponentScore([0, 2, 3])).toBeCloseTo(1.6667, 4);
  });

  it('returns 0 when all criteria are 0', () => {
    expect(calculateComponentScore([0, 0, 0])).toBe(0);
  });

  it('returns 4 when all criteria are 4 (max)', () => {
    expect(calculateComponentScore([4, 4, 4])).toBe(4);
  });

  it('throws if not exactly 3 scores provided', () => {
    expect(() => calculateComponentScore([1, 2])).toThrow();
  });
});

describe('calculateCHPMI', () => {
  it('returns 7.5 for test data matching Excel', () => {
    const scores = [0,2,3,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    expect(calculateCHPMI(scores)).toBeCloseTo(7.5, 2);
  });

  it('returns 100 for perfect score', () => {
    const scores = Array(30).fill(4);
    expect(calculateCHPMI(scores)).toBe(100);
  });
});

describe('classifyMaturityBand', () => {
  it.each([
    [0, 'Non-Existent'],
    [15, 'Nascent'],
    [30, 'Emerging'],
    [50, 'Developing'],
    [70, 'Established'],
    [90, 'Matured'],
  ])('classifies %d% as %s', (score, band) => {
    expect(classifyMaturityBand(score)).toBe(band);
  });
});
```

### 18.2 API Testing (Supertest)

```typescript
describe('POST /api/v1/assessments/:id/responses', () => {
  it('saves criterion score and returns updated CHPMI', async () => {
    const res = await request(app)
      .post(`/api/v1/assessments/${assessmentId}/responses`)
      .set('Authorization', `Bearer ${assessorToken}`)
      .send({ criteriaId: criterionId, score: 3, justification: 'Valid justification text here' });

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(3);
    expect(res.body.chpmiScore).toBeDefined();
  });

  it('rejects score > 4', async () => {
    const res = await request(app)
      .post(`/api/v1/assessments/${assessmentId}/responses`)
      .set('Authorization', `Bearer ${assessorToken}`)
      .send({ criteriaId: criterionId, score: 5, justification: 'Too high' });

    expect(res.status).toBe(400);
  });

  it('rejects if assessor belongs to different org', async () => {
    const res = await request(app)
      .post(`/api/v1/assessments/${otherOrgAssessmentId}/responses`)
      .set('Authorization', `Bearer ${assessorToken}`)
      .send({ criteriaId: criterionId, score: 2, justification: '...' });

    expect(res.status).toBe(403);
  });
});
```

### 18.3 Frontend Testing (Playwright E2E)

```typescript
test('assessor can score a criterion and see CHPMI update', async ({ page }) => {
  await page.goto('/assessments/test-id/scoring');
  await page.click('[data-testid="score-selector-3"]'); // Select level 3
  await page.fill('[data-testid="justification-input"]', 'Evidence-based justification text');
  await page.click('[data-testid="save-score"]');
  await expect(page.locator('[data-testid="chpmi-score"]')).toContainText('%');
});
```

### 18.4 Integration Tests

- Full assessment lifecycle: Create → Score all 30 criteria → Submit → Review → Approve
- File upload and signed URL retrieval
- PDF report generation with correct score values
- RBAC enforcement across all role/action combinations

### 18.5 Coverage Targets

| Layer | Target |
|---|---|
| Scoring engine (unit) | 100% |
| API endpoints | 90% |
| Service layer | 80% |
| Frontend components | 70% |
| E2E critical paths | 100% (key flows) |

---

## 19. Future Enhancements

### 19.1 AI-Powered Scoring Assistant
Integrate an LLM to analyze uploaded evidence documents and suggest a score with justification draft. The assessor reviews, edits, and confirms. Reduces time-to-assessment while maintaining human accountability.

### 19.2 Predictive Analytics
Based on historical CHPMI trends and component trajectories, forecast likely maturity band in 12–24 months under different investment scenarios. Provides evidence base for budget advocacy.

### 19.3 National Benchmarking Dashboard
A dedicated view showing anonymized CHPMI scores across all countries using the platform, grouped by income level, region, or UHC index. Enables peer learning and identification of high performers to emulate.

### 19.4 Localization (Internationalization)
Full i18n support for French, Portuguese, Swahili, and Arabic — covering all maturity level descriptors, UI labels, and generated reports. Enables adoption across Francophone and Lusophone Africa.

### 19.5 Mobile Application
Offline-capable mobile app (React Native) enabling assessors in low-connectivity environments to score criteria offline and sync when connected. Particularly relevant for subnational assessors in remote areas.

### 19.6 Integration with National HMIS
API integration with national health information systems (e.g., DHIS2) to auto-populate outcome-related criteria (Component 10: Coverage, OOP expenditure) from live national data, reducing manual data entry.

### 19.7 Action Planning Module
Post-assessment generation of structured improvement plans per component, with recommended actions, responsible parties, timelines, and budget estimates. Closes the loop between assessment and intervention.

---

## 20. Development Roadmap

### Phase 1: MVP — Core Assessment Platform (Months 1–3)

**Goal:** Functional digital replacement of the Excel assessment process.

| Feature | Priority |
|---|---|
| User authentication (JWT, RBAC) | P0 |
| Organization and user management | P0 |
| Reference data seeding (domains, components, criteria, levels) | P0 |
| Assessment creation and management | P0 |
| Criterion scoring interface | P0 |
| Auto-scoring engine (component, category, CHPMI) | P0 |
| Justification fields | P0 |
| Assessment status workflow | P0 |
| Basic organization dashboard | P0 |
| Audit logging | P0 |

**Deliverable:** Assessors can conduct and submit a full CHPMI assessment end-to-end.

---

### Phase 2: Core Features (Months 4–5)

**Goal:** Collaborative workflow, evidence management, and reporting.

| Feature | Priority |
|---|---|
| Evidence file upload and management | P1 |
| Review and approval workflow | P1 |
| Review comments and revision requests | P1 |
| Email notifications | P1 |
| PDF report generation | P1 |
| Excel export | P1 |
| Radar chart and bar chart dashboards | P1 |
| Super Admin global dashboard | P1 |

**Deliverable:** Full multi-user workflow from assessment through approval and reporting.

---

### Phase 3: Analytics & Longitudinal Tracking (Months 6–7)

**Goal:** Historical tracking and insight generation.

| Feature | Priority |
|---|---|
| Assessment history and trend visualization | P2 |
| Comparative reports (two cycles) | P2 |
| Priority gap analysis | P2 |
| Cross-organization benchmarking (Super Admin) | P2 |
| Analytics export (CSV) | P2 |
| Advanced filtering and search | P2 |

**Deliverable:** Organizations can track maturity over time; platform admin can compare across countries.

---

### Phase 4: Advanced Features (Months 8–12)

**Goal:** Scale, intelligence, and integrations.

| Feature | Priority |
|---|---|
| Subnational assessment support | P3 |
| i18n (French, Portuguese) | P3 |
| Action planning module | P3 |
| AI scoring assistant (LLM-based) | P3 |
| DHIS2 / HMIS integration (Component 10) | P3 |
| Mobile-responsive optimization | P3 |
| National benchmarking public dashboard | P3 |
| Predictive maturity modeling | P3 |

**Deliverable:** Enterprise-grade global platform supporting multi-country, multi-language deployments.

---

## Appendix A: CHPMI Framework Reference

### Full Component–Criteria Mapping

| Component Code | Component Name | Criteria 1 | Criteria 2 | Criteria 3 |
|---|---|---|---|---|
| C01 | Policy & Legal Recognition | Legal & Policy Frameworks | Dynamic & Evolving CHW Roles | Institutionalization & Integration |
| C02 | Multisectoral Coordination | Coordination Structures Mandate | Coordination Process Functionality | Integration & Sustainability |
| C03 | Community Health Units | CHU Existence & Functionality | PHC Integration & Service Delivery | Community Engagement & Sustainability |
| C04 | Monitoring & Evaluation | M&E Framework & System Integration | Data Collection, Quality & Reporting | Data Use, Feedback & Accountability |
| C05 | Financing | Budget Allocation & Funding Sources | Financial Planning & Costed Strategy | Resource Coordination & Accountability |
| C06 | CHW Training & Certification | Training Framework & Quality | Certification & Institutional Capacity | Continuous & Refresher Training |
| C07 | CHW Career Pathways | Career Pathway Framework & Support | Promotion & Recognition Mechanisms | Educational & Professional Linkages |
| C08 | CHW Payment | Compensation Policy & Equity | Payroll, Employment & Benefits | Payment Regularity & Sustainability |
| C09 | Supply and Logistics | Supply Chain System & Integration | Availability, Standardization & Equity | Digital Tracking & Responsiveness |
| C10 | Outcomes | Service Coverage & Equity | Quality Assurance & Integration | Financial Risk Protection |

### Scoring Formula Summary

```
Criterion Score:       Integer 0–4 (manual input)
Component Score:       Average(Criterion_1, Criterion_2, Criterion_3)    → Range: 0.000–4.000
CHPMI (%):             Sum(all 30 criterion scores) / 120 × 100           → Range: 0–100%
Maturity Band:         Lookup(CHPMI): 0=Non-Existent, 0-20=Nascent, 21-40=Emerging,
                       41-60=Developing, 61-80=Established, >80=Matured
```

---

*End of Documentation — CHP Maturity Index Assessment Platform v1.0*
