// =====================================================
// POLICY ENGINE - DEMO SIMULATION
// Enforces financial rules before expense submission
// =====================================================

export type PolicyRuleType = 
  | 'max_amount'
  | 'daily_limit'
  | 'monthly_limit'
  | 'requires_receipt'
  | 'requires_gps'
  | 'auto_approve_below'
  | 'requires_approval'
  | 'blocked';

export type ViolationAction = 'warn' | 'block' | 'require_approval';

export interface PolicyRule {
  id: string;
  policy_id: string;
  rule_type: PolicyRuleType;
  parameters: {
    value?: number;
    currency?: string;
    categories?: string[];
    above_amount?: number;
  };
  violation_action: ViolationAction;
  violation_message: string;
  violation_message_ar: string;
}

export interface Policy {
  id: string;
  company_id: string;
  name: string;
  name_ar: string;
  description?: string;
  applies_to_categories?: string[];
  applies_to_gl_codes?: string[];
  is_active: boolean;
  rules: PolicyRule[];
}

export interface PolicyViolation {
  rule_id: string;
  rule_type: PolicyRuleType;
  message: string;
  message_ar: string;
  action: ViolationAction;
  expected_value?: number | string;
  actual_value?: number | string;
}

export interface PolicyEvaluationResult {
  passed: boolean;
  violations: PolicyViolation[];
  requiresApproval: boolean;
  approvalReason?: string;
}

// =====================================================
// DEMO POLICIES
// =====================================================

export const DEMO_POLICIES: Policy[] = [
  {
    id: 'policy-travel-001',
    company_id: 'company-saudi-co',
    name: 'Travel Expense Policy',
    name_ar: 'سياسة مصروفات السفر',
    description: 'Travel expenses above 500 SAR require manager approval',
    applies_to_gl_codes: ['6001'], // Travel Expenses
    is_active: true,
    rules: [
      {
        id: 'rule-travel-max',
        policy_id: 'policy-travel-001',
        rule_type: 'max_amount',
        parameters: {
          value: 500,
          currency: 'SAR',
        },
        violation_action: 'require_approval',
        violation_message: 'Travel expenses above 500 SAR require manager approval',
        violation_message_ar: 'مصروفات السفر التي تتجاوز 500 ريال تتطلب موافقة المدير',
      },
    ],
  },
  {
    id: 'policy-general-001',
    company_id: 'company-saudi-co',
    name: 'General Expense Policy',
    name_ar: 'سياسة المصروفات العامة',
    is_active: true,
    rules: [
      {
        id: 'rule-receipt-required',
        policy_id: 'policy-general-001',
        rule_type: 'requires_receipt',
        parameters: {
          above_amount: 200,
        },
        violation_action: 'warn',
        violation_message: 'Receipt is recommended for expenses above 200 SAR',
        violation_message_ar: 'يُنصح بإرفاق إيصال للمصروفات التي تتجاوز 200 ريال',
      },
      {
        id: 'rule-auto-approve',
        policy_id: 'policy-general-001',
        rule_type: 'auto_approve_below',
        parameters: {
          value: 100,
          currency: 'SAR',
        },
        violation_action: 'warn',
        violation_message: 'Expenses below 100 SAR are auto-approved',
        violation_message_ar: 'المصروفات أقل من 100 ريال تُوافق تلقائياً',
      },
    ],
  },
  {
    id: 'policy-equipment-001',
    company_id: 'company-saudi-co',
    name: 'Equipment Purchase Policy',
    name_ar: 'سياسة شراء المعدات',
    applies_to_gl_codes: ['6004'], // Equipment
    is_active: true,
    rules: [
      {
        id: 'rule-equipment-max',
        policy_id: 'policy-equipment-001',
        rule_type: 'max_amount',
        parameters: {
          value: 50000,
          currency: 'SAR',
        },
        violation_action: 'block',
        violation_message: 'Equipment purchases above 50,000 SAR require procurement process',
        violation_message_ar: 'مشتريات المعدات التي تتجاوز 50,000 ريال تتطلب إجراءات المشتريات',
      },
    ],
  },
  {
    id: 'policy-global-001',
    company_id: 'company-global-tech',
    name: 'Global Tech Expense Policy',
    name_ar: 'سياسة مصروفات Global Tech',
    is_active: true,
    rules: [
      {
        id: 'rule-global-max',
        policy_id: 'policy-global-001',
        rule_type: 'max_amount',
        parameters: {
          value: 10000,
          currency: 'SAR',
        },
        violation_action: 'require_approval',
        violation_message: 'Expenses above 10,000 SAR require CFO approval',
        violation_message_ar: 'المصروفات التي تتجاوز 10,000 ريال تتطلب موافقة المدير المالي',
      },
    ],
  },
];

// =====================================================
// POLICY ENGINE EVALUATOR
// =====================================================

export function evaluatePolicy(
  companyId: string,
  glCode: string,
  amount: number,
  hasReceipt: boolean
): PolicyEvaluationResult {
  const violations: PolicyViolation[] = [];
  let requiresApproval = false;
  let approvalReason: string | undefined;

  // Get all active policies for this company
  const applicablePolicies = DEMO_POLICIES.filter(
    (p) => p.company_id === companyId && p.is_active
  );

  for (const policy of applicablePolicies) {
    // Check if policy applies to this GL code
    if (policy.applies_to_gl_codes && !policy.applies_to_gl_codes.includes(glCode)) {
      continue; // Skip this policy, doesn't apply
    }

    // Evaluate each rule
    for (const rule of policy.rules) {
      switch (rule.rule_type) {
        case 'max_amount':
          if (rule.parameters.value && amount > rule.parameters.value) {
            violations.push({
              rule_id: rule.id,
              rule_type: rule.rule_type,
              message: rule.violation_message,
              message_ar: rule.violation_message_ar,
              action: rule.violation_action,
              expected_value: rule.parameters.value,
              actual_value: amount,
            });

            if (rule.violation_action === 'require_approval') {
              requiresApproval = true;
              approvalReason = rule.violation_message_ar;
            }
          }
          break;

        case 'requires_receipt':
          if (rule.parameters.above_amount && amount > rule.parameters.above_amount && !hasReceipt) {
            violations.push({
              rule_id: rule.id,
              rule_type: rule.rule_type,
              message: rule.violation_message,
              message_ar: rule.violation_message_ar,
              action: rule.violation_action,
              expected_value: 'receipt required',
              actual_value: 'no receipt',
            });
          }
          break;

        case 'auto_approve_below':
          // This is informational, not a violation
          break;

        default:
          break;
      }
    }
  }

  // Check for blocking violations
  const hasBlocker = violations.some((v) => v.action === 'block');

  return {
    passed: !hasBlocker,
    violations,
    requiresApproval,
    approvalReason,
  };
}

// =====================================================
// APPROVAL WORKFLOW SIMULATION
// =====================================================

export interface ApprovalStep {
  id: string;
  step_order: number;
  name: string;
  name_ar: string;
  approver_role: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approved_by?: string;
  approved_at?: string;
  comment?: string;
}

export interface ApprovalWorkflow {
  expense_id: string;
  triggered_by_rule?: string;
  steps: ApprovalStep[];
  current_step: number;
  is_complete: boolean;
}

export function createApprovalWorkflow(
  expenseId: string,
  violations: PolicyViolation[]
): ApprovalWorkflow | null {
  const requiresApproval = violations.some((v) => v.action === 'require_approval');

  if (!requiresApproval) {
    return null;
  }

  const triggeredRule = violations.find((v) => v.action === 'require_approval');

  return {
    expense_id: expenseId,
    triggered_by_rule: triggeredRule?.rule_id,
    steps: [
      {
        id: 'step-1',
        step_order: 1,
        name: 'Manager Approval',
        name_ar: 'موافقة المدير',
        approver_role: 'finance_manager',
        status: 'pending',
      },
    ],
    current_step: 1,
    is_complete: false,
  };
}
