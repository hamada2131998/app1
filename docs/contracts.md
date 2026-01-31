# Contracts

This document captures the exported UI/component-level contracts (functions/components/hooks) found under `src/components/` and the expected `lib/db.ts` scan. It focuses on **inputs** (props/parameters) and **returned data shapes** (JSX elements, booleans, objects, etc.).

## Role mapping used in this document
Because the request references `Owner / Accountant-Manager / Employee`, the following mapping is used when code references more granular roles:

- **Owner**: `company_owner` / `super_admin` / `admin` equivalents.
- **Accountant-Manager**: `finance_manager`, `accountant`, `manager`, `project_manager`.
- **Employee**: `employee`.

## lib/db.ts
- **Status:** No `lib/db.ts` or `src/lib/db.ts` exists in this repository; therefore there are **no exported db.ts functions** to document.
- **Exported functions:** _None found_ (file missing).

---

# Components (non-UI)

## `src/components/Layout.tsx`
- **default export `Layout()`**
  - **Inputs:** none (no props).
  - **Returns:** `JSX.Element` layout shell with sidebar navigation and `<Outlet />`.
  - **Role:** Owner / Accountant-Manager / Employee (shared shell).

## `src/components/NavLink.tsx`
- **`NavLink`** (`forwardRef` component)
  - **Inputs:** `NavLinkCompatProps` = `NavLinkProps` (from `react-router-dom`, minus `className`) + `className?`, `activeClassName?`, `pendingClassName?`.
  - **Returns:** `JSX.Element` (`<RouterNavLink />`).
  - **Role:** Owner / Accountant-Manager / Employee (shared navigation primitive).

## `src/components/OfflineBanner.tsx`
- **default export `OfflineBanner()`**
  - **Inputs:** none (no props).
  - **Returns:** `JSX.Element` offline banner, or `null` when online.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/ToastContainer.tsx`
- **default export `ToastContainer()`**
  - **Inputs:** none (no props).
  - **Returns:** `JSX.Element` container that listens for `app-toast` events.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/Loader.tsx`
- **default export `Loader()`**
  - **Inputs:** `LoaderProps` = `{ message?: string; fullScreen?: boolean }`.
  - **Returns:** `JSX.Element` loader, optionally fullscreen.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/Alert.tsx`
- **default export `Alert()`**
  - **Inputs:** `AlertProps` = `{ type: 'error' | 'warning' | 'info' | 'success'; title?: string; message: string; onRetry?: () => void; className?: string }`.
  - **Returns:** `JSX.Element` alert block.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/notifications/NotificationCenter.tsx`
- **`NotificationCenter()`**
  - **Inputs:** none (uses auth context for user profile).
  - **Returns:** `JSX.Element` notification popover.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/permissions/PermissionGuard.tsx`
- **`PermissionGuard()`**
  - **Inputs:** `PermissionGuardProps` = `{ children: ReactNode; permission?: Permission; permissions?: Permission[]; requireAll?: boolean; fallback?: ReactNode; showMessage?: boolean }`.
  - **Returns:** `JSX.Element` / `null` based on permission check.
  - **Role:** Owner / Accountant-Manager / Employee (enforces access rules).
- **`withPermission<P>(Component, requiredPermission)`**
  - **Inputs:** `Component: React.ComponentType<P>`, `requiredPermission: Permission`.
  - **Returns:** `ProtectedComponent` HOC that renders a `PermissionGuard` wrapper.
  - **Role:** Owner / Accountant-Manager / Employee (enforces access rules).
- **`usePermission(permission)`**
  - **Inputs:** `permission: Permission`.
  - **Returns:** `boolean` (has permission).
  - **Role:** Owner / Accountant-Manager / Employee.
- **`usePermissions(permissions, requireAll?)`**
  - **Inputs:** `permissions: Permission[]`, `requireAll?: boolean`.
  - **Returns:** `boolean` (has any/all permissions).
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/team/EmployeePermissionsDialog.tsx`
- **`EmployeePermissionsDialog()`**
  - **Inputs:** `EmployeePermissionsDialogProps` = `{ isOpen: boolean; onClose: () => void; member: TeamMember; onSave: (memberId: string, permissions: EmployeePermissionsData) => void; currentUserName?: string }`.
  - **Returns:** `JSX.Element` dialog UI for employee permissions.
  - **Role:** Owner / Accountant-Manager (admin/manager control).

## `src/components/layout/DashboardLayout.tsx`
- **`DashboardLayout()`**
  - **Inputs:** `DashboardLayoutProps` = `{ children: ReactNode }`.
  - **Returns:** `JSX.Element` layout including sidebar + header.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/layout/AppSidebar.tsx`
- **`AppSidebar()`**
  - **Inputs:** none (uses auth/company context).
  - **Returns:** `JSX.Element` sidebar navigation.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/layout/Header.tsx`
- **`Header()`**
  - **Inputs:** none (uses app context for wallet balance).
  - **Returns:** `JSX.Element` header bar.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/layout/CompanySwitcher.tsx`
- **`CompanySwitcher()`**
  - **Inputs:** none (uses tenant context).
  - **Returns:** `JSX.Element` dropdown switcher.
  - **Role:** Owner / Accountant-Manager (multi-tenant admin features).

## `src/components/layout/RoleSwitcher.tsx`
- **`RoleSwitcher()`**
  - **Inputs:** none (uses app context).
  - **Returns:** `JSX.Element` dev-only role selector.
  - **Role:** Owner / Accountant-Manager / Employee (dev tooling).

## `src/components/settings/ExpenseCategoryManager.tsx`
- **`ExpenseCategoryManager()`**
  - **Inputs:** none (uses app context).
  - **Returns:** `JSX.Element` GL code manager.
  - **Role:** Owner / Accountant-Manager.

## `src/components/settings/MasterDataManager.tsx`
- **`MasterDataManager()`**
  - **Inputs:** none (uses company context).
  - **Returns:** `JSX.Element` master data management UI.
  - **Role:** Owner / Accountant-Manager.

## `src/components/dashboard/CashFlowCard.tsx`
- **`CashFlowCard()`**
  - **Inputs:** `CashFlowCardProps` = `{ inflow: number; outflow: number; netFlow: number }`.
  - **Returns:** `JSX.Element` summary card.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/dashboard/ProjectsOverview.tsx`
- **`ProjectsOverview()`**
  - **Inputs:** none (loads mock data).
  - **Returns:** `JSX.Element` projects summary card.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/dashboard/RecentExpenses.tsx`
- **`RecentExpenses()`**
  - **Inputs:** none (loads mock data).
  - **Returns:** `JSX.Element` list of recent expenses.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/dashboard/RoleBasedDashboard.tsx`
- **`QuickActions({ role })`**
  - **Inputs:** `QuickActionsProps` = `{ role: AppRole }`.
  - **Returns:** `JSX.Element` action grid.
  - **Role:** Owner / Accountant-Manager / Employee (role-specific content).
- **`RoleWelcome()`**
  - **Inputs:** none (uses auth/company context).
  - **Returns:** `JSX.Element` welcome block.
  - **Role:** Owner / Accountant-Manager / Employee (role-specific content).
- **`PendingApprovalsWidget({ pendingCount })`**
  - **Inputs:** `{ pendingCount: number }`.
  - **Returns:** `JSX.Element` or `null` if `pendingCount === 0`.
  - **Role:** Owner / Accountant-Manager.

## `src/components/dashboard/StatCard.tsx`
- **`StatCard()`**
  - **Inputs:** `StatCardProps` = `{ title: string; value: string; subtitle?: string; icon: ReactNode; trend?: { value: number; isPositive: boolean }; variant?: 'default' | 'primary' | 'success' | 'warning' }`.
  - **Returns:** `JSX.Element`.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/dashboard/SummaryCard.tsx`
- **`SummaryCard()`**
  - **Inputs:** `SummaryCardProps` = `{ title: string; value: string; subtitle?: string; icon: LucideIcon; trend?: { value: number; isPositive: boolean }; variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'; index?: number }`.
  - **Returns:** `JSX.Element`.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/dashboard/MonthlyExpensesChart.tsx`
- **`MonthlyExpensesChart()`**
  - **Inputs:** none (uses static monthly data).
  - **Returns:** `JSX.Element` chart.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/dashboard/RecentActivityTable.tsx`
- **`RecentActivityTable({ items? })`**
  - **Inputs:** `{ items?: RecentActivityItem[] }`.
  - **Returns:** `JSX.Element` table of transactions.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/expenses/VatCalculator.tsx`
- **`VatCalculator()`**
  - **Inputs:** `VatCalculatorProps` = `{ amount: number; includesVat: boolean; onVatToggle: (includes: boolean) => void }`.
  - **Returns:** `JSX.Element` VAT breakdown.
  - **Role:** Owner / Accountant-Manager / Employee (expense entry flows).

## `src/components/expenses/ExpenseTimeline.tsx`
- **`ExpenseTimeline()`**
  - **Inputs:** `ExpenseTimelineProps` = `{ expenseStatus: 'pending' | 'approved' | 'rejected' | 'settled'; createdAt: string; approvedAt?: string; settledAt?: string; rejectionReason?: string }`.
  - **Returns:** `JSX.Element` timeline.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/expenses/BulkActionsBar.tsx`
- **`BulkActionsBar()`**
  - **Inputs:** `BulkActionsBarProps` = `{ selectedCount: number; onApprove: () => void; onReject: () => void; onSettle: () => void; onClear: () => void; showSettle?: boolean }`.
  - **Returns:** `JSX.Element` or `null` when `selectedCount === 0`.
  - **Role:** Owner / Accountant-Manager.

## `src/components/expenses/PolicyViolationAlert.tsx`
- **`PolicyViolationAlert()`**
  - **Inputs:** `PolicyViolationAlertProps` = `{ result: PolicyEvaluationResult; onClose?: () => void }`.
  - **Returns:** `JSX.Element` or `null` if no violations.
  - **Role:** Owner / Accountant-Manager / Employee.

## `src/components/reports/VatReport.tsx`
- **`VatReport()`**
  - **Inputs:** none (uses app context).
  - **Returns:** `JSX.Element` VAT reporting view.
  - **Role:** Owner / Accountant-Manager.

## `src/components/reports/ProjectExpenseReport.tsx`
- **`ProjectExpenseReport()`**
  - **Inputs:** none (uses app context).
  - **Returns:** `JSX.Element` project expense reporting view.
  - **Role:** Owner / Accountant-Manager.

## `src/components/reports/EmployeeExpenseReport.tsx`
- **`EmployeeExpenseReport()`**
  - **Inputs:** none (uses app context).
  - **Returns:** `JSX.Element` employee expense reporting view.
  - **Role:** Owner / Accountant-Manager.

---

# UI Components (`src/components/ui`)

> **Note:** These are shared UI primitives used by all roles. Unless otherwise noted, inputs are `React.ComponentPropsWithoutRef` of the underlying Radix/HTML element and return a `JSX.Element` (or `null` for conditional components).

## `accordion.tsx`
- **`Accordion`**: Radix `AccordionPrimitive.Root` props → `JSX.Element`.
- **`AccordionItem`**: `AccordionPrimitive.Item` props → `JSX.Element`.
- **`AccordionTrigger`**: `AccordionPrimitive.Trigger` props → `JSX.Element`.
- **`AccordionContent`**: `AccordionPrimitive.Content` props → `JSX.Element`.

## `alert.tsx`
- **`Alert`**: `React.HTMLAttributes<HTMLDivElement>` + `variant?: 'default' | 'destructive'` → `JSX.Element`.
- **`AlertTitle`**: `React.HTMLAttributes<HTMLHeadingElement>` → `JSX.Element`.
- **`AlertDescription`**: `React.HTMLAttributes<HTMLParagraphElement>` → `JSX.Element`.

## `alert-dialog.tsx`
- **`AlertDialog` / `AlertDialogTrigger` / `AlertDialogPortal` / `AlertDialogOverlay` / `AlertDialogContent` / `AlertDialogHeader` / `AlertDialogFooter` / `AlertDialogTitle` / `AlertDialogDescription` / `AlertDialogAction` / `AlertDialogCancel`**: Radix AlertDialog primitive props → `JSX.Element`.

## `aspect-ratio.tsx`
- **`AspectRatio`**: Radix `AspectRatioPrimitive.Root` props → `JSX.Element`.

## `avatar.tsx`
- **`Avatar` / `AvatarImage` / `AvatarFallback`**: Radix Avatar primitive props → `JSX.Element`.

## `badge.tsx`
- **`Badge`**: `React.HTMLAttributes<HTMLDivElement>` + `variant?: 'default' | 'secondary' | 'destructive' | 'outline'` → `JSX.Element`.
- **`badgeVariants`**: `(options?: { variant?: ...; className?: string }) => string` (CVA class generator).

## `breadcrumb.tsx`
- **`Breadcrumb` / `BreadcrumbList` / `BreadcrumbItem` / `BreadcrumbLink` / `BreadcrumbPage` / `BreadcrumbSeparator` / `BreadcrumbEllipsis`**: HTML element props, `BreadcrumbSeparator` supports `React.ComponentProps<"span">` and `BreadcrumbLink` supports `asChild?: boolean` → `JSX.Element`.

## `button.tsx`
- **`Button`**: `React.ButtonHTMLAttributes<HTMLButtonElement>` + `variant?` + `size?` + `asChild?` → `JSX.Element`.
- **`buttonVariants`**: `(options?: { variant?: ...; size?: ...; className?: string }) => string`.

## `calendar.tsx`
- **`Calendar`**: `CalendarProps` = `React.ComponentProps<typeof DayPicker>` → `JSX.Element`.
- **`CalendarProps` (type export)**: DayPicker props type.

## `card.tsx`
- **`Card` / `CardHeader` / `CardFooter` / `CardTitle` / `CardDescription` / `CardContent`**: HTML element props → `JSX.Element`.

## `carousel.tsx`
- **`Carousel` / `CarouselContent` / `CarouselItem` / `CarouselPrevious` / `CarouselNext`**: Embla carousel + HTML element props → `JSX.Element`.
- **`CarouselApi` (type export)**: Embla API type.

## `chart.tsx`
- **`ChartContainer`**: `React.ComponentProps<'div'>` + `{ config: ChartConfig; children: ResponsiveContainer['children'] }` → `JSX.Element`.
- **`ChartTooltip`**: `RechartsPrimitive.Tooltip` component → `JSX.Element`.
- **`ChartTooltipContent`**: `Tooltip` props + `div` props + `{ hideLabel?, hideIndicator?, indicator?, nameKey?, labelKey? }` → `JSX.Element | null`.
- **`ChartLegend`**: `RechartsPrimitive.Legend` component → `JSX.Element`.
- **`ChartLegendContent`**: `div` props + `LegendProps` (`payload`, `verticalAlign`) + `{ hideIcon?, nameKey? }` → `JSX.Element | null`.
- **`ChartStyle`**: `({ id: string; config: ChartConfig }) => JSX.Element | null`.
- **`ChartConfig` (type export)**: series configuration type.

## `checkbox.tsx`
- **`Checkbox`**: Radix `CheckboxPrimitive.Root` props → `JSX.Element`.

## `collapsible.tsx`
- **`Collapsible` / `CollapsibleTrigger` / `CollapsibleContent`**: Radix collapsible primitive props → `JSX.Element`.

## `command.tsx`
- **`Command` / `CommandDialog` / `CommandInput` / `CommandList` / `CommandEmpty` / `CommandGroup` / `CommandItem` / `CommandShortcut` / `CommandSeparator`**: `cmdk` + HTML element props → `JSX.Element`.

## `context-menu.tsx`
- **`ContextMenu` / `ContextMenuTrigger` / `ContextMenuContent` / `ContextMenuItem` / `ContextMenuCheckboxItem` / `ContextMenuRadioItem` / `ContextMenuLabel` / `ContextMenuSeparator` / `ContextMenuShortcut` / `ContextMenuGroup` / `ContextMenuPortal` / `ContextMenuSub` / `ContextMenuSubContent` / `ContextMenuSubTrigger` / `ContextMenuRadioGroup`**: Radix context-menu primitive props → `JSX.Element`.

## `dialog.tsx`
- **`Dialog` / `DialogTrigger` / `DialogPortal` / `DialogClose` / `DialogOverlay` / `DialogContent` / `DialogHeader` / `DialogFooter` / `DialogTitle` / `DialogDescription`**: Radix dialog primitive props → `JSX.Element`.

## `drawer.tsx`
- **`Drawer` / `DrawerTrigger` / `DrawerPortal` / `DrawerClose` / `DrawerOverlay` / `DrawerContent` / `DrawerHeader` / `DrawerFooter` / `DrawerTitle` / `DrawerDescription`**: Vaul drawer props → `JSX.Element`.

## `dropdown-menu.tsx`
- **`DropdownMenu` / `DropdownMenuTrigger` / `DropdownMenuContent` / `DropdownMenuItem` / `DropdownMenuCheckboxItem` / `DropdownMenuRadioItem` / `DropdownMenuLabel` / `DropdownMenuSeparator` / `DropdownMenuShortcut` / `DropdownMenuGroup` / `DropdownMenuPortal` / `DropdownMenuSub` / `DropdownMenuSubContent` / `DropdownMenuSubTrigger` / `DropdownMenuRadioGroup`**: Radix dropdown-menu props → `JSX.Element`.

## `form.tsx`
- **`Form`**: `FormProvider` from `react-hook-form` → `JSX.Element`.
- **`FormField`**: `Controller` from `react-hook-form` → `JSX.Element`.
- **`FormItem` / `FormLabel` / `FormControl` / `FormDescription` / `FormMessage`**: HTML element props → `JSX.Element`.
- **`useFormField()`**: no inputs → returns `{ id, name, formItemId, formDescriptionId, formMessageId, invalid, isTouched, isDirty, error }`.

## `hover-card.tsx`
- **`HoverCard` / `HoverCardTrigger` / `HoverCardContent`**: Radix hover-card props → `JSX.Element`.

## `input.tsx`
- **`Input`**: `React.InputHTMLAttributes<HTMLInputElement>` → `JSX.Element`.

## `input-otp.tsx`
- **`InputOTP` / `InputOTPGroup` / `InputOTPSlot` / `InputOTPSeparator`**: `input-otp` props → `JSX.Element`.

## `label.tsx`
- **`Label`**: Radix `LabelPrimitive.Root` props → `JSX.Element`.

## `menubar.tsx`
- **`Menubar` / `MenubarMenu` / `MenubarTrigger` / `MenubarContent` / `MenubarItem` / `MenubarCheckboxItem` / `MenubarRadioItem` / `MenubarLabel` / `MenubarSeparator` / `MenubarShortcut` / `MenubarGroup` / `MenubarPortal` / `MenubarSub` / `MenubarSubContent` / `MenubarSubTrigger` / `MenubarRadioGroup`**: Radix menubar props → `JSX.Element`.

## `navigation-menu.tsx`
- **`NavigationMenu` / `NavigationMenuList` / `NavigationMenuItem` / `NavigationMenuTrigger` / `NavigationMenuContent` / `NavigationMenuLink` / `NavigationMenuIndicator` / `NavigationMenuViewport`**: Radix navigation-menu props → `JSX.Element`.
- **`navigationMenuTriggerStyle`**: `(options?: { className?: string }) => string` (CVA class generator).

## `pagination.tsx`
- **`Pagination` / `PaginationContent` / `PaginationItem` / `PaginationLink` / `PaginationPrevious` / `PaginationNext` / `PaginationEllipsis`**: HTML props, `PaginationLink` supports `isActive?: boolean` → `JSX.Element`.

## `popover.tsx`
- **`Popover` / `PopoverTrigger` / `PopoverContent`**: Radix popover props → `JSX.Element`.

## `progress.tsx`
- **`Progress`**: Radix progress props → `JSX.Element`.

## `radio-group.tsx`
- **`RadioGroup` / `RadioGroupItem`**: Radix radio-group props → `JSX.Element`.

## `resizable.tsx`
- **`ResizablePanelGroup` / `ResizablePanel` / `ResizableHandle`**: `react-resizable-panels` props → `JSX.Element`.

## `scroll-area.tsx`
- **`ScrollArea` / `ScrollBar`**: Radix scroll-area props → `JSX.Element`.

## `select.tsx`
- **`Select` / `SelectGroup` / `SelectValue` / `SelectTrigger` / `SelectContent` / `SelectLabel` / `SelectItem` / `SelectSeparator` / `SelectScrollUpButton` / `SelectScrollDownButton`**: Radix select props → `JSX.Element`.

## `separator.tsx`
- **`Separator`**: Radix separator props → `JSX.Element`.

## `sheet.tsx`
- **`Sheet` / `SheetTrigger` / `SheetClose` / `SheetPortal` / `SheetOverlay` / `SheetContent` / `SheetHeader` / `SheetFooter` / `SheetTitle` / `SheetDescription`**: Radix dialog props with `SheetContent` supporting `side?: 'top' | 'bottom' | 'left' | 'right'` → `JSX.Element`.

## `sidebar.tsx`
- **`SidebarProvider`**: `{ defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }` → `JSX.Element`.
- **`useSidebar()`**: no inputs → returns `{ state, open, setOpen, toggleSidebar, isMobile }`.
- **`Sidebar` / `SidebarTrigger` / `SidebarInset` / `SidebarHeader` / `SidebarFooter` / `SidebarContent` / `SidebarGroup` / `SidebarGroupAction` / `SidebarGroupContent` / `SidebarGroupLabel` / `SidebarSeparator` / `SidebarInput` / `SidebarMenu` / `SidebarMenuItem` / `SidebarMenuButton` / `SidebarMenuAction` / `SidebarMenuBadge` / `SidebarMenuSkeleton` / `SidebarMenuSub` / `SidebarMenuSubItem` / `SidebarMenuSubButton` / `SidebarRail`**: HTML props with additional data attributes (e.g., `size`, `isActive`, `asChild`) → `JSX.Element`.

## `skeleton.tsx`
- **`Skeleton`**: `React.HTMLAttributes<HTMLDivElement>` → `JSX.Element`.

## `slider.tsx`
- **`Slider`**: Radix slider props → `JSX.Element`.

## `sonner.tsx`
- **`Toaster`**: `React.ComponentProps<typeof Sonner>` → `JSX.Element`.
- **`toast`**: Sonner toast function (inputs from `sonner` API; returns toast id/handlers per library).

## `switch.tsx`
- **`Switch`**: Radix switch props → `JSX.Element`.

## `table.tsx`
- **`Table` / `TableHeader` / `TableBody` / `TableFooter` / `TableHead` / `TableRow` / `TableCell` / `TableCaption`**: HTML table props → `JSX.Element`.

## `tabs.tsx`
- **`Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`**: Radix tabs props → `JSX.Element`.

## `textarea.tsx`
- **`Textarea`**: `React.TextareaHTMLAttributes<HTMLTextAreaElement>` → `JSX.Element`.
- **`TextareaProps` (type export)**: textarea props type.

## `theme-toggle.tsx`
- **`ThemeToggle()`**
  - **Inputs:** none (uses theme hook).
  - **Returns:** `JSX.Element`.
  - **Role:** Owner / Accountant-Manager / Employee.

## `toast.tsx`
- **`ToastProvider` / `ToastViewport` / `Toast` / `ToastTitle` / `ToastDescription` / `ToastClose` / `ToastAction`**: Radix toast props → `JSX.Element`.
- **`ToastProps` (type export)**: props of `Toast`.
- **`ToastActionElement` (type export)**: `React.ReactElement<typeof ToastAction>`.

## `toaster.tsx`
- **`Toaster()`**
  - **Inputs:** none (uses `useToast`).
  - **Returns:** `JSX.Element`.

## `toggle.tsx`
- **`Toggle`**: Radix toggle props + `variant?` + `size?` → `JSX.Element`.
- **`toggleVariants`**: `(options?: { variant?: ...; size?: ...; className?: string }) => string`.

## `toggle-group.tsx`
- **`ToggleGroup` / `ToggleGroupItem`**: Radix toggle-group props + `variant?` + `size?` → `JSX.Element`.

## `tooltip.tsx`
- **`Tooltip` / `TooltipTrigger` / `TooltipContent` / `TooltipProvider`**: Radix tooltip props → `JSX.Element`.

## `use-toast.ts`
- **`useToast()`**: no inputs → returns `{ toasts: ToasterToast[]; toast: (toast) => { id; dismiss; update }; dismiss: (toastId?) => void }` (re-exported).
- **`toast()`**: accepts `Toast` object (toast props) and returns `{ id: string; dismiss: () => void; update: (props) => void }` (re-exported).
