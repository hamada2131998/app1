# Enterprise Financial Control Platform - Architecture Document

## 📋 Overview

This document outlines the complete architecture for a **Production-Grade, Multi-Tenant Financial Control SaaS Platform**.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Web App   │  │ Mobile App  │  │   Third-Party Systems   │  │
│  │  (React)    │  │  (Future)   │  │   (ERP, Accounting)     │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Supabase Edge Functions                     │    │
│  │  • Authentication (JWT)                                  │    │
│  │  • Rate Limiting                                         │    │
│  │  • Request Validation                                    │    │
│  │  • Company Context Injection                             │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐     │
│  │   Expense    │ │   Workflow   │ │   Policy Engine      │     │
│  │   Service    │ │   Engine     │ │   (Rules Evaluator)  │     │
│  └──────────────┘ └──────────────┘ └──────────────────────┘     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐     │
│  │   Wallet     │ │   Geo        │ │   Risk Signal        │     │
│  │   Service    │ │   Verifier   │ │   Collector          │     │
│  └──────────────┘ └──────────────┘ └──────────────────────┘     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PostgreSQL (Supabase)                       │    │
│  │  • Row Level Security (Multi-Tenancy)                    │    │
│  │  • Audit Triggers (Immutable Logs)                       │    │
│  │  • Security Definer Functions                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Supabase Storage                            │    │
│  │  • Receipt Images                                        │    │
│  │  • Invoice PDFs                                          │    │
│  │  • Audit Exports                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Multi-Tenancy Strategy

### The Tenant Model

Every piece of data is isolated by `company_id`. This is enforced at **three levels**:

#### Level 1: Database Schema
```sql
-- Every table has company_id
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  -- ... other fields
);
```

#### Level 2: Row Level Security (RLS)
```sql
-- Users can ONLY see data from their company
CREATE POLICY "Users can view company expenses"
  ON expenses FOR SELECT
  USING (company_id = get_user_company_id());
```

#### Level 3: API Validation
```typescript
// Edge functions always validate company context
const companyId = await getCompanyIdFromUser(user.id);
if (expense.company_id !== companyId) {
  throw new ForbiddenError('Access denied');
}
```

### Security Functions

```sql
-- Get current user's company (cached, no recursion)
CREATE FUNCTION get_user_company_id() RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check role without recursion
CREATE FUNCTION has_role(_role app_role) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND company_id = get_user_company_id()
      AND role = _role
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## 👥 Role-Based Access Control (RBAC)

### Role Hierarchy

| Role | Scope | Permissions |
|------|-------|-------------|
| `super_admin` | Platform | All companies, billing, platform settings |
| `company_owner` | Company | Full company access, user management, policies |
| `finance_manager` | Company | Approve expenses, manage wallets, view reports |
| `accountant` | Company | Process expenses, generate reports, view data |
| `custodian` | Branch/Project | Manage petty cash, limited approvals |
| `employee` | Self | Submit expenses, view own data |

### Permission Matrix

| Action | Owner | Finance | Accountant | Custodian | Employee |
|--------|-------|---------|------------|-----------|----------|
| Submit expense | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve expense | ✅ | ✅ | ❌ | ⚠️ Limited | ❌ |
| Manage policies | ✅ | ✅ | ❌ | ❌ | ❌ |
| View all expenses | ✅ | ✅ | ✅ | ⚠️ Scope | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Allocate wallets | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 📊 Database Schema Overview

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  companies  │──────<│  branches   │──────<│  projects   │
└─────────────┘       └─────────────┘       └─────────────┘
       │                     │                     │
       │                     │                     │
       ▼                     ▼                     │
┌─────────────┐       ┌─────────────┐              │
│  profiles   │──────<│ user_roles  │              │
└─────────────┘       └─────────────┘              │
       │                                           │
       │         ┌─────────────────────────────────┘
       │         │
       ▼         ▼
┌─────────────────────┐       ┌─────────────────────┐
│      expenses       │──────<│  expense_approvals  │
└─────────────────────┘       └─────────────────────┘
       │                              │
       │                              │
       ▼                              ▼
┌─────────────────────┐       ┌─────────────────────┐
│ expense_attachments │       │ policy_violations   │
└─────────────────────┘       └─────────────────────┘
       
┌─────────────┐       ┌─────────────────────┐
│   wallets   │──────<│ wallet_transactions │
└─────────────┘       └─────────────────────┘

┌─────────────────────┐       ┌─────────────────┐
│ approval_workflows  │──────<│ workflow_steps  │
└─────────────────────┘       └─────────────────┘

┌─────────────────────┐       ┌─────────────────┐
│  company_policies   │──────<│  policy_rules   │
└─────────────────────┘       └─────────────────┘

┌─────────────────────┐
│     audit_logs      │  (Immutable, trigger-populated)
└─────────────────────┘
```

---

## 🔄 Approval Workflow Engine

### Workflow Resolution Logic

```typescript
async function resolveWorkflow(expense: Expense): Promise<Workflow> {
  // 1. Get all active workflows for company
  const workflows = await getActiveWorkflows(expense.company_id);
  
  // 2. Filter by conditions (amount, category, cost center)
  const matching = workflows.filter(w => {
    if (w.min_amount && expense.amount < w.min_amount) return false;
    if (w.max_amount && expense.amount > w.max_amount) return false;
    if (w.categories?.length && !w.categories.includes(expense.category)) return false;
    if (w.cost_center_ids?.length && !w.cost_center_ids.includes(expense.cost_center_id)) return false;
    return true;
  });
  
  // 3. Sort by priority, pick highest
  matching.sort((a, b) => b.priority - a.priority);
  
  // 4. Return match or default
  return matching[0] || getDefaultWorkflow(expense.company_id);
}
```

### Step Execution

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   PENDING    │─────>│  IN_REVIEW   │─────>│   APPROVED   │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                     │
       │                     ▼                     ▼
       │              ┌──────────────┐      ┌──────────────┐
       └─────────────>│   REJECTED   │      │   SETTLED    │
                      └──────────────┘      └──────────────┘
```

---

## 📋 Policy Engine

### Policy Evaluation Flow

```typescript
async function evaluatePolicy(expense: Expense): Promise<PolicyResult> {
  // 1. Get applicable policies
  const policies = await getActivePolicies(expense.company_id, {
    category: expense.category,
    role: expense.submitter_role,
    cost_center: expense.cost_center_id
  });
  
  // 2. Evaluate each rule
  const violations: Violation[] = [];
  
  for (const policy of policies) {
    for (const rule of policy.rules) {
      const result = evaluateRule(rule, expense);
      if (!result.passed) {
        violations.push({
          rule_id: rule.id,
          type: rule.rule_type,
          expected: rule.parameters,
          actual: result.actual,
          action: rule.violation_action // 'warn' | 'block' | 'require_approval'
        });
      }
    }
  }
  
  // 3. Determine outcome
  const hasBlocker = violations.some(v => v.action === 'block');
  
  return {
    passed: !hasBlocker,
    violations,
    requiresEscalation: violations.some(v => v.action === 'require_approval')
  };
}
```

### Supported Rule Types

| Rule Type | Parameters | Example |
|-----------|------------|---------|
| `max_amount` | `{value: 5000, currency: "SAR"}` | Single expense limit |
| `daily_limit` | `{value: 10000, currency: "SAR"}` | Daily total per user |
| `monthly_limit` | `{value: 50000, currency: "SAR"}` | Monthly total per user |
| `requires_receipt` | `{above_amount: 100}` | Receipt mandatory |
| `requires_gps` | `{categories: ["fuel", "travel"]}` | Location required |
| `geo_radius` | `{meters: 500, from: "project"}` | Must be near project |
| `auto_approve_below` | `{amount: 200}` | Skip workflow |
| `blocked` | `{}` | Category disabled |

---

## 📍 Geo-Verification System

### Confidence Score Calculation

```typescript
function calculateGeoConfidence(expense: Expense, project: Project): number {
  if (!expense.submitted_latitude || !project.latitude) {
    return 0; // No data
  }
  
  const distance = haversineDistance(
    expense.submitted_latitude,
    expense.submitted_longitude,
    project.latitude,
    project.longitude
  );
  
  const allowedRadius = project.geo_radius_meters || 1000;
  
  if (distance <= allowedRadius) {
    return 1.0; // Perfect match
  } else if (distance <= allowedRadius * 2) {
    return 0.7; // Close enough
  } else if (distance <= allowedRadius * 5) {
    return 0.4; // Suspicious
  } else {
    return 0.1; // Very far
  }
}
```

---

## 📝 Audit Logging Strategy

### What Gets Logged

| Entity | Create | Update | Delete | Special Actions |
|--------|--------|--------|--------|-----------------|
| Expenses | ✅ | ✅ | ✅ | approve, reject, settle |
| Wallets | ✅ | ✅ | ✅ | freeze, unfreeze |
| Wallet Transactions | ✅ | ❌ | ❌ | - |
| User Roles | ✅ | ✅ | ✅ | - |
| Policies | ✅ | ✅ | ✅ | - |
| Approvals | ✅ | ❌ | ❌ | - |

### Log Structure

```json
{
  "id": "uuid",
  "company_id": "uuid",
  "user_id": "uuid",
  "user_email": "user@company.com",
  "user_role": "finance_manager",
  "action": "approve",
  "entity_type": "expenses",
  "entity_id": "uuid",
  "old_values": {"status": "pending"},
  "new_values": {"status": "approved"},
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Immutability Enforcement

```sql
-- Trigger prevents ANY modification
CREATE TRIGGER audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Function raises exception
CREATE FUNCTION prevent_audit_modification() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable';
END;
$$ LANGUAGE plpgsql;
```

---

## 💰 VAT/Tax Engine

### Tax Calculation (Saudi Arabia)

```typescript
interface TaxCalculation {
  gross: number;      // Total amount (what user pays)
  net: number;        // Amount before tax
  vat: number;        // Tax amount
  vatRate: number;    // Rate applied (15%)
}

function calculateVAT(amount: number, includesVat: boolean): TaxCalculation {
  const vatRate = 0.15; // 15% Saudi VAT
  
  if (includesVat) {
    // Amount includes VAT, extract it
    const net = amount / (1 + vatRate);
    const vat = amount - net;
    return { gross: amount, net, vat, vatRate: vatRate * 100 };
  } else {
    // Amount is net, add VAT
    const vat = amount * vatRate;
    const gross = amount + vat;
    return { gross, net: amount, vat, vatRate: vatRate * 100 };
  }
}
```

### Multi-Country Ready

```sql
-- Company-specific tax configuration
ALTER TABLE companies ADD COLUMN tax_rules JSONB DEFAULT '{
  "default_rate": 15,
  "rates_by_category": {
    "food": 0,
    "healthcare": 0,
    "education": 0
  }
}'::jsonb;
```

---

## 🚀 Migration Plan: Demo → Production

### Phase 1: Foundation (Week 1-2)
1. ✅ Design schema (this document)
2. Create Supabase project
3. Run migrations
4. Set up RLS policies
5. Test multi-tenancy

### Phase 2: Core Features (Week 3-4)
1. Replace mock data with Supabase queries
2. Implement expense CRUD
3. Add basic approval workflow
4. Connect wallet system

### Phase 3: Advanced Features (Week 5-6)
1. Policy engine integration
2. Geo-verification
3. Audit log viewer
4. Role management UI

### Phase 4: Production Hardening (Week 7-8)
1. Performance optimization
2. Rate limiting
3. Error handling
4. Monitoring setup

---

## 📁 File Structure (Recommended)

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts           # Supabase client
│       ├── types.ts            # Auto-generated types
│       └── queries/
│           ├── expenses.ts     # Expense queries
│           ├── wallets.ts      # Wallet queries
│           └── policies.ts     # Policy queries
├── hooks/
│   ├── useExpenses.ts
│   ├── useWallet.ts
│   ├── useApprovals.ts
│   └── useAuditLogs.ts
├── services/
│   ├── expense-service.ts
│   ├── workflow-engine.ts
│   ├── policy-engine.ts
│   └── geo-verifier.ts
└── types/
    ├── database.ts             # DB type definitions
    ├── expense.ts
    ├── policy.ts
    └── workflow.ts
```

---

## ✅ Checklist Before Production

- [ ] All tables have `company_id`
- [ ] RLS enabled on all tables
- [ ] Security definer functions tested
- [ ] Audit triggers active
- [ ] Roles stored in separate table (not profiles)
- [ ] No sensitive data in client-side storage
- [ ] API validates company context
- [ ] Audit logs are immutable
- [ ] VAT calculations backend-driven
