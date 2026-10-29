# Billing, collections and cash-control patterns

Read on 2026-10-27. Purpose: input for rebuilding E-skool from scratch (one private primary school in Douala; cash, MTN MoMo, Orange Money, bank; tuition in 3 installments; siblings paid together; WhatsApp parent channel; low-literacy secretary, bursar, owner with read-only view).

## How to read this file

- Pages were read with WebFetch. It returns a model-written extract, not the raw page, so quotes are the extract's wording. Re-check any rule on the live page before coding it.
- **UNVERIFIED** = seen only in a search summary, or the page did not load (HTTP 403, empty render, "Loading" or CSS error). Treat as a lead, not a fact.
- Not covered by any source here: MoMo, Orange Money, WhatsApp, Cameroonian receipt or tax rules. Those are E-skool design decisions.
- Source coverage is listed at the end. Xero, Wave, Veracross and Lillio have no opened primary page.

---

## 1. Account model: household vs per-student, siblings, one payment for several children

**Findings**

- Brightwheel bills per student. Payers choose a child, then Payments > Make a Payment > Other amount. The article describes "individual student accounts" and no combined multi-child payment. Sibling transfers of payments are admin-only. Source: https://help.mybrightwheel.com/en/articles/6363540-billing-faqs-for-payers
- Brightwheel statements sit in each child's profile ("Statements tab"). Receipts are emailed after a payment processes successfully. Bank transfers take up to 5-7 business days. Source: https://help.mybrightwheel.com/en/articles/6363540-billing-faqs-for-payers
- Brightwheel's provider billing view is organised by student (Billing > Students tab, then the student's Account details tab). Source: https://help.mybrightwheel.com/en/articles/11024603-understanding-autopay-faqs-for-providers
- QuickBooks Online: sub-customers marked "Bill with parent" appear only in the parent's statement. This is the one household roll-up rule I opened. Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/customer-statements/create-send-customer-statements-quickbooks-online/L8bvb69Gg_US_en_US
- Jackrabbit posts late fees per family or per student: "per Family/Account", "per Active Student", "Per Student That Meets Criteria", "per Student/Per Class". "Per Active Student" bills every active student in a family, even one who does not match the criteria, so a multi-child family can get several fees. Source: https://help.jackrabbitclass.com/help/post-late-misc-fees
- Veracross (UNVERIFIED, community pages did not render): a household record has finance, invoice and cash-receipt tabs; AR invoices can bundle charges for several students; each payment is matched to the invoice it settles. Sources: https://community.veracross.com/s/article/Maintaining-Student-and-Household-Data ; https://community.veracross.com/s/article/AR-Invoice-Processing
- Procare (UNVERIFIED, search summary): multifamily billing splits tuition between separated parents, each with private billing details; statements come from Reports > Family Accounting, one page per family. Source: https://procare-solutions.document360.io/procare-desktop/docs/family-accounting
- No opened source documents sibling discount logic. Design it per school. Source: none found.

**Single payment covering several children**

- No opened source describes one transaction covering several children. Every documented path allocates money per student or per invoice. Design implication: one family payment is entered once, then allocated per child, and the receipt lists each child's share.
- Receipt numbering rules: not found (gap).

---

## 2. Payment plans and installments

**Plans and deposits**

- FACTS: plans are school-specific. The confirmation shows the payment amount, balance and start date. Payments continue until the total is paid. A non-refundable enrollment fee may be charged automatically up to 14 days after the agreement. Counts and frequencies are not stated. Source: https://factsmgt.com/parent-faqs/
- FACTS: a change to draft date or amount may need school approval and must reach FACTS at least 2 business days before the draft. Where the school allows, families use "Change Payment Date". Source: https://factsmgt.com/parent-faqs/
- Blackbaud: staff review plans in Settings > Manage Payment Plans. To add or change a plan, the admin must contact Support. Who may edit and which plan types exist are not stated. Source: https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-manage-payment-plans.html
- Veracross (UNVERIFIED): help-article titles exist for "Overview of Splitting Charges into Installments" and "Payment Plan Installment Configuration". Contents were not read. Source: https://community.veracross.com/s/article/AR-Invoice-Processing (related-article list)
- Brightwheel, Jackrabbit, Procare: no family installment plan in the opened pages. Brightwheel's "billing plans" appear only in marketing copy (UNVERIFIED). Sources: https://help.mybrightwheel.com/en/articles/5599079-how-payments-in-brightwheel-work ; https://help.jackrabbitclass.com/help/tuition-billing-methods ; https://www.procaresupport.com/procare-online/docs/accounting-and-transactions
- Lillio (UNVERIFIED, marketing only): tuition plans, invoicing and optional autopay on due dates. Source: https://www.lillio.com/resources/customer-stories/how-i-got-my-time-back-with-lillio-billing-and-payments

**Due now vs due later and autopay rules (documented conflict)**

- Blackbaud: scheduled payments are applied to past-due balance before current billing. Autopay excludes past-due amounts. Example in the FAQ: $500 past due and $2,000 billed; a $1,000 payment dated the 15th leaves $1,500 on the autopay on the 30th. Source: https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-payer-faq.html
- Blackbaud: a payment dated at least 3 business days before the autopay date reduces that autopay. Closer or later dates can create a credit balance. Autopay processes one business day before the due date. Autopay can be stopped online at least 3 business days before the due date. Source: same.
- Brightwheel: autopay charges the full balance due, including past-due amounts, on each invoice's due date. Autopay must be enabled before the invoice is sent; if turned off after sending, "autopay will not be triggered for that invoice". Source: https://help.mybrightwheel.com/en/articles/11024603-understanding-autopay-faqs-for-providers

**Failed charges and broken arrangements**

- Brightwheel: after a failed autopay charge, Brightwheel "will not attempt to retry the payment". The unpaid balance is collected on the next invoice's due date. Source: https://help.mybrightwheel.com/en/articles/6363540-billing-faqs-for-payers
- Brightwheel: a failed card or ACH charge is marked "Failed" with a reason (e.g., "insufficient funds") behind an info icon. The payer gets a notice. If the charge never completes, the invoice reverts to "Past Due". Source: https://help.mybrightwheel.com/en/articles/13922414-track-confirm-and-troubleshoot-payments
- Blackbaud: a payment in "On Hold" that fails validation triggers an email notice. A missed due date can trigger a "Follow Up Service Fee". Source: https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-payer-faq.html
- Promise-to-pay or arrangement tracking, and a broken-promise flag tied to a promised date: **not found** in any opened or searched vendor source (UNVERIFIED absence). The closest items are failed-payment alerts (above) and the FACTS hardship options (section 4).

**Late fees and returned payments**

- Brightwheel: flat fee, grace period in days, optional compounding. An automatic fee is a separate invoice. When automatic fees are first enabled, the admin chooses "all existing overdue invoices" or "future overdue invoices". Source: http://help.mybrightwheel.com/en/articles/5672333-charge-late-payment-fees
- Brightwheel: "Automatically apply late fees" sits under Billing Settings. Without it, staff add fees by hand from the "At a Glance" tab. Source: same.
- FACTS: a $30 returned-payment fee may apply per returned non-sufficient-funds attempt, on top of any school fee. Source: https://factsmgt.com/parent-faqs/
- FACTS vendor advice: keep a written late-fee policy, signed at enrollment, covering the catch-up window and next steps. "It's best not to formally communicate any grace periods," because grace periods "could encourage delinquency". Source: https://factsmgt.com/blog/optimising-schools-approach-late-tuition-fees/
- Blackbaud: a school may add late fees on top of the Follow Up Service Fee. Card and ACH "Platform Fee" varies by school. Wires carry a $15 fee. Source: https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-payer-faq.html

**School examples (UNVERIFIED, school pages from search)**

- Installment options by school: 1, 2 or 10 installments, the 10-payment option carries a $56 enrollment fee (https://www.abingtonfriends.net/?p=10256); 1, 2, 10, 11 or 12 installments, with a plan locked for the school year unless the pastor signs off (https://stjoan.net/registration-materials); annual, quarterly or ten-month options (https://www.roncalli.org/?p=2359); one June payment or two installments (https://www.dallasinternationalschool.org/tuition-management).
- FACTS-related charges at schools: $25 after the 5th (https://www.kellmanbrownacademy.org/tuition-and-fees); $30 returned payment (https://www.thefortuneacademy.org/facts).

---

## 3. Applying payments: allocation, partials, overpayments, refunds, voids, audit, numbering

**Allocation**

- QuickBooks Online: you mark the invoices being paid. With one invoice selected, the sum fills "Amount to Apply". With several, each open balance is listed. Partial amounts are allowed by editing the figure. A surplus "shows as an amount to credit" and can be applied to later invoices. Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/invoicing/record-invoice-payments-quickbooks-online/L4ZadDW7F_US_en_US
- QuickBooks Online (UNVERIFIED, search summary): a paid amount not linked to an invoice shows as "unapplied"; Open Invoices shows unapplied payments and credit memos as negative amounts. Community threads report an old unapplied payment making new invoices look unpaid. Sources: https://quickbooks.intuit.com/learn-support/en-us/payments/unapplied-payments/00/1350273 ; https://quickbooks.intuit.com/learn-support/en-us/payments/an-old-unapplied-payment-is-causing-new-invoices-to-look-unpaid/00/603715
- Xero (UNVERIFIED, central pages returned empty): overpayments, prepayments and credit notes can each be allocated to an invoice. To move an overpayment, clear its allocation and reassign it; no void needed. Sources: https://central.xero.com/0/article/Apply-a-customer-s-credit-to-an-invoice ; https://central.xero.com/0/article/Edit-or-void-a-sales-overpayment
- Xero (UNVERIFIED, Xero product-ideas forum): allocation of overpayments and credits works only at invoice creation; users ask for automatic oldest-first allocation. Source: https://productideas.xero.com/forums/967115-invoices-quotes/suggestions/46295548-sales-invoices-allocate-overpayments-and-credits
- Wave (UNVERIFIED, support page returned 403): an overpayment can be refunded, kept as customer credit, or applied to other open invoices. For a lump sum, the excess goes to the customer credit account, then to each overdue invoice using the "Customer credit" method. Sources: https://support.waveapps.com/hc/en-us/articles/30148679186068-Manage-and-bookkeep-invoice-overpayments ; https://support.waveapps.com/hc/en-us/articles/208621536-Account-for-a-lump-sum-invoice-payment
- Jackrabbit: a payment is linked to specific fees. The entry screen shows "Applied Amount" and "Unapplied Amount" as you select fees. Automatic options: "Apply to Newest Fees First", "Apply to Oldest Fees First (within last 12 months)", "Apply to Oldest Fees First". Unlinked fees show a pink "date paid" field. Source: https://help.jackrabbitclass.com/help/post-individual-payment
- Jackrabbit (UNVERIFIED, search summary): a misapplied payment is fixed by unlinking the fees and reapplying. Source: https://help.jackrabbitclass.com/help/find-unapplied-credits-apply-fees
- Blackbaud: scheduled payments go to past-due first (section 2). Source: https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-payer-faq.html
- Brightwheel: a payer can pay particular invoices, all open invoices, or a custom amount "toward the student balance". Offline payments (cash, checks, Venmo, Zelle) are recorded for monitoring; the provider must apply them to the student's balance and deposit the money. Source: https://help.mybrightwheel.com/en/articles/5599079-how-payments-in-brightwheel-work
- Brightwheel: a manual payment entered without picking an invoice can leave a bill "Unpaid". The fix is to unapply the payment and apply it to the right invoice. No click path is given. Source: https://help.mybrightwheel.com/en/articles/13922414-track-confirm-and-troubleshoot-payments
- Procare (UNVERIFIED, search summary): a ledger payment goes to the oldest open balance first; aging places each credit by its post date and excludes credit balances. Source: https://procare-solutions.document360.io/procare-desktop/docs/family-accounting

**Refunds and credit memos**

- Brightwheel: an online payment is refunded to the payer's own payment method. An offline payment "cannot be refunded through brightwheel". Source: https://help.mybrightwheel.com/en/articles/5599079-how-payments-in-brightwheel-work
- Procare (partial index page): credits can be granted to families (example: excused absence); refunds can cover checks, cash, card or bank account, in full or in part. Source: https://www.procaresupport.com/procare-online/docs/accounting-and-transactions
- Toast: the refunds report shows the card, the original payment, the refund and the employee who issued it. Source: https://support.toasttab.com/en/article/Exceptions-Report-Overview
- QuickBooks "Void or refund customer payments" and Xero "Process a customer or supplier refund" articles exist (UNVERIFIED, not opened). Sources: https://quickbooks.intuit.com/learn-support/en-us/help-article/journal-entries/void-refund-customer-payments-quickbooks-online/L9hA2VNB2_US_en_US ; https://central.xero.com/0/article/Process-a-customer-or-supplier-refund

**Voids, deletes, immutability, audit trail**

- QuickBooks Online: a void makes the amount zero and keeps the entry on file. A voided entry can be deleted, and a new reversing transaction entered. Delete removes the transaction everywhere except the audit log. Voids are limited to invoices, bill payments, payments and sales orders (sales side). The article does not say whether voids appear in reports, or whether deposited or reconciled payments are restricted. Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/list-management/void-delete-transactions-quickbooks-online/L5sZV8GYh_US_en_US
- QuickBooks Online audit history: per transaction, via More actions > Audit history. It records editor, timestamp and the change, with "Compare" and "Show all". Viewing requires full access rights. The article does not cover deleted or voided transactions. Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/audit-log/view-transaction-changes-audit-history/L7obVhic2_US_en_US
- QuickBooks Online (UNVERIFIED, community): no single company-wide report equal to the Desktop audit trail. Source: https://quickbooks.intuit.com/community/reports-and-accounting-5/qbo-audit-log-ways-to-get-report-more-like-qbd-audit-trail-375685
- Toast undo: the original entry stays in the log. The reversal is a new offsetting entry (for example, Undo Pay Out raises the balance by the amount). It needs permission "POS Access > 1.13 No Sale". No time limit is stated. Source: https://doc.toasttab.com/doc/platformguide/adminUndoingOperations.html
- Toast (UNVERIFIED, search summary): removing the void permissions 3.32 and 3.8 from a server job forces voids through a manager; cash voids are tied to the device that took the payment. Source: https://support.toasttab.com/en/article/Voiding-Items-Payments-and-Checks
- Loyverse (UNVERIFIED, search summary): a receipt has a unique number; a bill has none and is excluded from sales and reports. Cancelling receipts needs a back-office "Cancel receipts" right. Source: https://help.loyverse.com/help/receipts-section-reports-back

**Receipt and invoice numbering**

- No opened source defines a numbering rule (sequential, void-safe, per-year). Brightwheel's weekly preview shows a "linked invoice number" per invoice. Source: https://help.mybrightwheel.com/en/articles/9369081-receive-weekly-emails-previewing-upcoming-invoices. Rule: gap, decide in the spec.

---

## 4. Statements, aging, collection lists, reminders, what improves collection

**Statements**

- QuickBooks Online has three statement types: Balance Forward (invoices, payments and current balance over a date range); Open Item (outstanding invoices from a chosen start date to the present); Transaction Statement (everything in a date range). Bulk: check customers, Batch action > Statement, choose type and dates, confirm emails, Save and send. Customers with no activity in the window are skipped. Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/customer-statements/create-send-customer-statements-quickbooks-online/L8bvb69Gg_US_en_US
- QuickBooks Online (UNVERIFIED, community): answers disagree on Open Item's window (365 days vs all open items). Sources (search results, not opened): https://quickbooks.intuit.com/community/Help-Articles/How-to-create-a-balance-forward-or-an-open-item-statement/m-p/186383 ; https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/batch-monthly-statements-for-all-customers-with-open-balances/00/1338170
- Brightwheel: statements are per child (Statements tab); a "payment summary report" can be pulled for any date range. Source: https://help.mybrightwheel.com/en/articles/6363540-billing-faqs-for-payers
- FACTS parent view: check balances, tuition and fees paid, print reports, view scheduled payments. Source: https://factsmgt.com/parent-faqs/
- Blackbaud: families can print invoices (non-autopay accounts), Family Tuition Statements and year-end tax statements. Source: https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-payer-faq.html
- Parent statement line content (tuition, fees, discounts, payments, balance): a Blackbaud line-by-line charge summary is reported in a search summary (UNVERIFIED; source page not captured). Procare family billing view shows "current open balance" and can be filtered and exported (UNVERIFIED, partial page). Source: https://www.procaresupport.com/procare-online/docs/accounting-and-transactions
- Procare (UNVERIFIED, search summary): statements in standard or windowed-envelope layouts, one page per family; a family ledger card lists charges, credits and payments. Source: https://procare-solutions.document360.io/procare-desktop/docs/family-accounting

**Aging buckets**

- Brightwheel aging report: Current; past due 1-7, 8-14, 15-21, 22+ days; the total is the student's billing account balance. Access is limited to "Admins + Billing Only role". Export or print after filters; file formats are not stated. Source: http://help.mybrightwheel.com/en/articles/3212408-report-on-past-overdue-balances
- QuickBooks Online: the official aging article describes the run steps but no bucket labels or aging basis. Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/accounts-receivable-reports/run-accounts-receivable-aging-report/L4N7PC2hg_US_en_US. Community and third-party posts say default columns are Current, 1-30, 31-60, 61-90, 91+, and aging runs from due date (UNVERIFIED). Sources: https://fitsmallbusiness.com/accounts-receivable-aging-report-quickbooks-online/ ; https://quickbooks.intuit.com/learn-support/en-us/reports-and-accounting/how-do-i-change-the-a-r-aging-buckets-at-the-bottom-of-a/00/620721
- Wave (UNVERIFIED, page returned 403): aged receivables grouped from not-yet-due to 91+ days; totals may not match the AR balance. Source: https://support.waveapps.com/hc/en-us/articles/4406239714452-Aged-Receivables-report
- No source gives school-specific bucket cut-offs. The design choice is in the patterns list.

**Reminders and collection lists**

- Brightwheel automatic reminders fire when a new invoice is posted, when the balance comes due, and the morning after the due date. The text is "preset and cannot be customized". Channel: email if the payer has email and phone, text if phone only. Source: https://help.mybrightwheel.com/en/articles/12631477-send-payment-reminders
- Brightwheel manual reminder: available only when the account has a past-due balance and the payer has not completed a transaction. Path: Billing > Unpaid Balances > student's Actions > Send a reminder. Source: same.
- Brightwheel weekly preview: admins and Billing Only staff receive an email every Saturday listing invoices going out in the coming week (student, invoice number, charges, balance including pending charges, posting date). Staff adjust before billing goes out. Families do not receive it. Source: https://help.mybrightwheel.com/en/articles/9369081-receive-weekly-emails-previewing-upcoming-invoices
- Brightwheel late-fee automation and void/waive: see section 2. Source: http://help.mybrightwheel.com/en/articles/5672333-charge-late-payment-fees
- Xero (UNVERIFIED, search summary): reminders email customers about coming-due and overdue invoices; three preset reminders at first enable; timing and recipients editable; suppression per invoice, per customer or per organisation; status and history visible; re-enabling after a threshold can skip a step. Sources: https://central.xero.com/0/article/Set-up-invoice-reminders ; https://central.xero.com/0/article/Check-a-reminder-s-status-and-history
- Xero user requests (UNVERIFIED): reminder rules per customer group; pause reminders when a matching unreconciled bank line exists. Sources: https://productideas.xero.com/forums/967130-contacts-files/suggestions/45625966-invoice-reminders-set-up-for-a-contact-group ; https://productideas.xero.com/forums/967115-invoices-quotes/suggestions/51606911-invoice-reminder-prevent-invoice-reminder-when-a
- FACTS vendor advice: automatic reminders for fees due and missed payments; set a threshold where staff step in on "serious delinquency"; contact serious-arrears families proactively. Source: https://factsmgt.com/blog/optimising-schools-approach-late-tuition-fees/
- FACTS hardship options: a tailored plan; push due dates out by an agreed period; split the arrears across remaining payments; extend the schedule by a month or two. Source: same.
- Blackbaud (UNVERIFIED, school pages): invoices sent 20 days before due date (https://www.abingtonfriends.net/?p=10256); bills emailed around the 25th and payable by the 15th of the next month, with 20 days to contest (https://www.dallasinternationalschool.org/tuition-management).
- Fryeburg (UNVERIFIED): parent portal emails and texts when payments are missed. Source: https://www.fryeburgacademy.org/fs/pages/586

**What improves collection (evidence)**

- Vendor claims only. FACTS says automatic reminders "will significantly reduce the number of late payments", with no source (https://factsmgt.com/blog/optimising-schools-approach-late-tuition-fees/). Brightwheel's 90% on-time figure is self-reported (UNVERIFIED): https://mybrightwheel.com/childcare-centers/billing
- Blackbaud has a blog post "How to Improve On-Time Tuition Payments" (UNVERIFIED, not opened): https://blog.blackbaud.com/how-to-improve-on-time-tuition-payments/
- Independent measured evidence: none found in this pass. Gap.
- Mechanisms the sources do describe: autopay, automatic failed-payment alerts, preset reminders, staff calls for serious arrears, hardship plans that avoid default.

---

## 5. Cash control: drawer close, petty cash, deposits, expenses, owner detection

**Shift and drawer close**

- Loyverse: a shift opens with an opening cash amount. Pay In adds cash "without a sale" (for change); Pay Out takes cash "outside of a refund or sale" (for minor expenses). Both appear in the cash history and shift reports. Source: https://help.loyverse.com/help/shift-management-loyverse-pos
- Loyverse: expected cash is derived from cash sales, refunds, pay-ins and pay-outs. The page does not name the opening amount in that formula. Verify on a test shift before copying. Source: same.
- Loyverse: the shift summary shows expected cash, actual cash (counted by hand) and the gap. The role setting "View shift report" controls whether a cashier sees expected cash; if off, the cashier sees only the actual amount at close. Source: same.
- Loyverse: editing a closed shift is not covered. Gap.
- Toast: a drawer opens with a starting balance, set manually or automatically. Close applies to an open or paused drawer. Counting can pause the drawer (no cash payments; entries still allowed). Source: https://doc.toasttab.com/doc/platformguide/adminCashDrawerPOSOperations.html
- Toast: a payout "cannot exceed the cash drawer's current balance". Tip Out and Cash Drop also cap at the balance. Cash Out "cannot exceed" the balance, but its warning is dismissible, so enforcement is unclear. Source: same.
- Toast variance: the counted amount fills "Actual cash in drawer". Default comments read "over", "short" or "exact" (example: "Close out balance is short"). These appear in the Cash activity audit report. No separate variance amount is described. Source: same.
- Toast permissions: adjusting a starting balance (today's drawers only) needs "3.21 Adjust Cash Drawer Start Balance". The cash-drop slip has a manager signature line. No manager approval is described for entries or closing. Source: same.
- Square: the Cash Management Add-on is required. Start with a starting cash amount; end by entering counted cash and confirming. The drawer report lists starting cash, cash sales, cash refunds, cash paid in/out and expected cash. The article does not say whether the counted amount is compared. Drawers open over 30 days, or inactive 7+ days, end automatically. Source: https://squareup.com/help/us/en/article/8344-start-and-end-a-cash-drawer-session
- Square (UNVERIFIED, community): a closed drawer's report cannot be adjusted, so count before closing; sales rung on an unlinked device are missing from expected cash; two open drawer sessions on one device are reported as both allowed and not allowed. Sources: https://community.squareup.com/t5/Archived-Discussions-Read-Only/Can-a-closed-drawer-session-be-edited/m-p/134497 ; https://community.squareup.com/t5/Archived-Discussions-Read-Only/Expected-Cash-In-Drawer-Amount/m-p/72160 ; https://community.squareup.com/t5/Archived-Discussions-Read-Only/Mid-shift-cash-drawer-change/td-p/92061

**Petty cash and expenses**

- Loyverse Pay Out covers minor expenses; Toast payout covers purchases, capped at the drawer balance and with a reason picked. Sources: https://help.loyverse.com/help/shift-management-loyverse-pos ; https://doc.toasttab.com/doc/platformguide/adminCashDrawerPOSOperations.html
- Petty-cash float reconciliation and expense categories: no opened source. Gap (QuickBooks chart of accounts not researched).

**Cash to bank**

- QuickBooks Online Undeposited Funds holds invoice payments and sales receipts as a "temporary lockbox" until the bank deposit is recorded. Several payments often reach the bank as one deposit, so entries are grouped to match. Payments leave the account when a bank deposit is entered against the slip. Not needed when bank transactions download directly. Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/bank-deposits/whats-undeposited-funds-account/L6Jan3iRK_US_en_US
- QuickBooks Online: "Deposit To" selects the account when recording a payment. Cash payments go to Cash; "Undeposited funds" holds a payment for a later deposit, to be used only when the bank combines payments. Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/invoicing/record-invoice-payments-quickbooks-online/L4ZadDW7F_US_en_US

**Owner detection of theft or error**

- Toast exception reports (ten, under Reports): Voided Orders (by server and approver; void percent of net sales); Removed Items (before the kitchen); Discounts (by server, approver, reason); No Sale (drawer opened without payment); Refunds (card, original payment, refund, employee); Unpaid Orders; Voided Payments; Tax Exempt; Offline Payments; End of Day (all orders and drawer transactions; "Cash Only" adds no-sales and payouts). Source: https://support.toasttab.com/en/article/Exceptions-Report-Overview
- Square: comp, void and discount reports are in the Dashboard only (Reports > Payments > Comps / Voids / Discounts), with time, location and daily/weekly/monthly views. The article mentions no export and no per-entry employee or reason field. Source: https://squareup.com/help/us/en/article/8359-view-discounts-comp-and-void-reports
- Square (UNVERIFIED, community): team permission sets can switch off refunds and voids for specific staff. Source: https://community.squareup.com/t5/Payments-Troubleshooting/How-to-gain-more-oversight-and-restrict-certain-team-members/td-p/785787
- QuickBooks Online per-transaction audit history (section 3). Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/audit-log/view-transaction-changes-audit-history/L7obVhic2_US_en_US

---

## 6. Owner dashboards: which metrics come first

- No opened source documents the order of metrics on a first screen. Every ordering claim below is UNVERIFIED; the list shows what is documented to exist.
- Xero (UNVERIFIED, search summary): the web homepage has a widget summarising what is owed and the age of each outstanding balance, based on due dates and expected payment dates. The mobile app shows total owed, split into overdue and due today. Sources: https://central.xero.com/s/article/Tips-for-receiving-invoice-payments-on-time-UK ; https://central.xero.com/0/article/Your-Xero-dashboard (page did not render)
- Brightwheel: Billing > At a Glance has a tab for outstanding amounts; manual late fees are added from the same screen. Reports: Aging, payment summary by date range, and Payments & credits (provider side). Sources: https://help.mybrightwheel.com/en/articles/13922414-track-confirm-and-troubleshoot-payments ; http://help.mybrightwheel.com/en/articles/3212408-report-on-past-overdue-balances ; https://help.mybrightwheel.com/en/articles/5599079-how-payments-in-brightwheel-work ; https://help.mybrightwheel.com/en/articles/6363540-billing-faqs-for-payers
- Square: Reports > Payments with discount, comp and void views, time and location filters, and comparisons. Source: https://squareup.com/help/us/en/article/8359-view-discounts-comp-and-void-reports
- Toast: exception reports (section 5). Close Out Day (UNVERIFIED, search summary) tallies open checks, orders awaiting pickup and clocked-in staff. Source: https://support.toasttab.com/en/article/Close-Out-Day-Z-Report-Auto-Capture
- QuickBooks Online: the A/R aging report is a standard report (location "Who owes you" per a search summary, UNVERIFIED). Dashboard content was not opened. Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/accounts-receivable-reports/run-accounts-receivable-aging-report/L4N7PC2hg_US_en_US
- A read-only owner role is not documented in any opened source. Gap.

---

## 7. UX that works for non-accountants, and complaints

**Documented UX patterns**

- Brightwheel: the payer chooses particular invoices, all open invoices, or a custom amount (section 3). Autopay is set once; a program can make autopay mandatory for some payers and exempt others. Source: https://help.mybrightwheel.com/en/articles/11024603-understanding-autopay-faqs-for-providers
- Brightwheel: staff send a past-due reminder from one list (Unpaid Balances > Actions). Source: https://help.mybrightwheel.com/en/articles/12631477-send-payment-reminders
- Brightwheel: a failed charge shows the reason behind an info icon. Source: https://help.mybrightwheel.com/en/articles/13922414-track-confirm-and-troubleshoot-payments
- FACTS: families change a payment date online where the school allows. Source: https://factsmgt.com/parent-faqs/
- Blackbaud: families pay, print statements and reach a Parent Contact Center by chat or phone. Source: https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-payer-faq.html

**Complaints (all UNVERIFIED, from search snippets or summaries)**

- Brightwheel, Capterra billing summary (112 reviews): friction with refunds, account adjustments and failed-payment alerts after billing-setting changes; invoices sent but payments not collectable. Source: https://capterra.com/p/144060/brightwheel/reviews/?page=2
- Brightwheel, BBB (April 2026): repeated $80 card charges; reply attributes them to a school. Source: https://www.bbb.org/us/ca/san-francisco/profile/computer-software-developers/brightwheel-1116-876411/complaints
- Brightwheel, Trustpilot (Dec 2025 and Feb 2026): no live person reachable for a disputed charge for a week; $30+ fee for bank or debit payment. Source: https://nz.trustpilot.com/review/mybrightwheel.com
- FACTS, GetApp (57 reviews, 4.2/5): praise for parent usability; complaints on reporting, lack of two-way communication and intermittent error bugs. Source: https://www.getapp.com/education-childcare-software/a/facts/
- FACTS, ComplaintsBoard (5 complaints; operator identity not confirmed): application fee not refunded; a redirect and extra charge. Source: https://www.complaintsboard.com/facts-management-company-b168858
- QuickBooks Online, Capterra (4.3/5, about 8,385 reviews): complaints on subscription price, slow support, and a vendor that kept billing after problems. Google Play analysis: trouble entering transactions, invoicing issues, app-to-web sync. Sources: https://www.capterra.in/software/141374/quickbooks-online ; https://kimola.com/reports/explore-our-in-depth-quickbooks-online-user-feedback-analysis-google-play-en-145855
- Xero, Capterra: bank connections dropping out (January 2025 review). AccountingWeb (undated): reconciliation view shows 10 rows with no filter or sort. Sources: https://www.capterra.com/p/120109/Xero/reviews?page=5 ; https://www.accountingweb.co.uk/node/194521
- Square, community: closed drawers cannot be corrected; mismatches need a support call. Source: https://community.squareup.com/t5/Archived-Discussions-Read-Only/Can-a-closed-drawer-session-be-edited/m-p/134497
- Jackrabbit: unlinked fees shown with a pink "date paid" marker rather than an amount (a design pattern to avoid; see section 8). Source: https://help.jackrabbitclass.com/help/post-individual-payment
- G2 and App Store reviews: not retrieved in this pass. Gap.

---

## 8. Patterns to copy into E-skool

Each item: entity, rule, screen, source. Entity names are proposals; align with the existing schema.

1. **Household payer with per-child lines**
   - Entity: `family` (payer) > `enrollment` per child (pupil x year x class, as in the existing schema) > `fee_line` per enrollment.
   - Rule: each child has a balance; the family has a total. Payments are entered against the family and allocated per child. Sibling logic is computed at family level. No per-child late fees (see avoid list).
   - Screen: family page with one row per child (balance, next due date) and a family total at the top.
   - Source: https://help.mybrightwheel.com/en/articles/6363540-billing-faqs-for-payers ; https://quickbooks.intuit.com/learn-support/en-us/help-article/customer-statements/create-send-customer-statements-quickbooks-online/L8bvb69Gg_US_en_US ; https://help.jackrabbitclass.com/help/post-late-misc-fees

2. **One payment, several children, one receipt**
   - Entity: `payment` (immutable: amount, method, date, received_by) > `payment_allocation` (payment, fee_line, amount).
   - Rule: allocations must sum to the payment. Any remainder becomes a visible `family_credit`, never a silent surplus. One receipt number per payment, listing each child's share.
   - Screen: payment form with live "Applied" and "Unapplied" totals.
   - Source: https://help.jackrabbitclass.com/help/post-individual-payment ; https://quickbooks.intuit.com/learn-support/en-us/help-article/invoicing/record-invoice-payments-quickbooks-online/L4ZadDW7F_US_en_US

3. **Default allocation: oldest due first, past-due before current, with override**
   - Rule: default is oldest-due-first, applied to past-due before current tranches (Blackbaud's rule). The cashier can change the allocation per child before saving. The screen states what the default did.
   - Screen: allocation grid with the default pre-filled and a one-line explanation.
   - Source: https://help.jackrabbitclass.com/help/post-individual-payment ; https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-payer-faq.html

4. **Reverse, never delete**
   - Entity: `payment.status` (valid / reversed) + `reversal` row (reason, user, time) that offsets the amount.
   - Rule: no DELETE on money or person tables. A reversal creates an offsetting entry (Toast). Original rows stay visible in history. Unapply then reapply is the fix for a misallocation.
   - Screen: payment history row with "Annuler" (reverse) requiring a reason; reversed rows shown greyed, with the reversal linked.
   - Source: https://doc.toasttab.com/doc/platformguide/adminUndoingOperations.html ; https://quickbooks.intuit.com/learn-support/en-us/help-article/list-management/void-delete-transactions-quickbooks-online/L5sZV8GYh_US_en_US ; https://help.mybrightwheel.com/en/articles/13922414-track-confirm-and-troubleshoot-payments

5. **Due now vs due later, three tranches**
   - Entity: `installment` (plan, tranche number, due_date, amount, paid, status).
   - Rule: "due now" = unpaid tranches with due_date on or before today (Douala date via `app_today`). "Later" = future tranches. One "remaining" total. Show the plan confirmation (amount, balance, start date) as FACTS does.
   - Screen: family card with two blocks, "Due now" and "Coming up", plus a weekly list of tranches due this week (staff check before reminders go out).
   - Source: https://factsmgt.com/parent-faqs/ ; https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-payer-faq.html ; https://help.mybrightwheel.com/en/articles/9369081-receive-weekly-emails-previewing-upcoming-invoices

6. **Late fee: one flat line, grace days, waivable, no compounding**
   - Entity: `fee_type` "late" with amount and grace_days in settings.
   - Rule: the fee is its own line. Waive or void needs a reason. No compounding (Brightwheel offers it; the school should decide, default off). Fee is charged per family, never per child.
   - Screen: settings "Pénalité de retard" (amount, grace days); fee line on the family card with Annuler and Remettre actions.
   - Source: http://help.mybrightwheel.com/en/articles/5672333-charge-late-payment-fees ; https://help.jackrabbitclass.com/help/post-late-misc-fees

7. **Reminders on three triggers, manual past-due reminder, all logged**
   - Entity: `reminder_log` (family, type, channel, sent_at, sent_by).
   - Rule: automatic at tranche posted, on due date, and the morning after due date (Brightwheel's timings). Manual reminder only for families with a past-due balance. Every send is logged. Channel: WhatsApp is not covered by any source; it is a design decision (UNVERIFIED for vendors). Parents only receive reminders (project policy in AGENTS.md). Project open assumption: automatic reminders only if above 30 per week.
   - Screen: "Relances" list sorted by days late, with a "Préparer le message" button that fills the text for a manual WhatsApp send.
   - Source: https://help.mybrightwheel.com/en/articles/12631477-send-payment-reminders ; https://help.mybrightwheel.com/en/articles/9369081-receive-weekly-emails-previewing-upcoming-invoices ; project CLAUDE.md (open assumptions)

8. **Aging buckets matched to the tranche calendar**
   - Rule: default buckets Current | 1-7 | 8-14 | 15-21 | 22+ days, as Brightwheel uses. Add 31-60 and 60+ for term end. This is a proposal: no source proves these cut-offs.
   - Screen: "Retards" report, one row per family, bucket columns, total; CSV export and print for the owner.
   - Source: http://help.mybrightwheel.com/en/articles/3212408-report-on-past-overdue-balances

9. **Family statement, balance forward, per-child sections**
   - Rule: default statement is balance forward (per child: charges, payments, credits; next tranche). A transaction statement is optional. Print for families who come to the office.
   - Screen: "Relevé" in A4 and receipts in A5 or 80 mm (paper formats listed as open in project CLAUDE.md).
   - Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/customer-statements/create-send-customer-statements-quickbooks-online/L8bvb69Gg_US_en_US ; https://factsmgt.com/parent-faqs/

10. **Cash session: opening float in the formula, blind count, locked after close**
    - Entity: `cash_session` (opening_float, cash_in, cash_out, expected, counted, difference, reason, closed_at, closed_by). Closed sessions are immutable.
    - Rule: expected = opening float + cash receipts - cash out + cash in. Toast's starting balance works this way; Loyverse's documented components omit the opening amount, so verify on a test shift before copying. Cashier counts first; expected is shown after the count. Any difference needs a reason; a difference above a threshold needs manager sign-off (threshold not researched). Correction is a new adjustment row, not an edit.
    - Screen: two-step close: count, then show expected and difference. Starting-float change needs manager permission.
    - Source: https://doc.toasttab.com/doc/platformguide/adminCashDrawerPOSOperations.html ; https://help.loyverse.com/help/shift-management-loyverse-pos ; https://squareup.com/help/us/en/article/8344-start-and-end-a-cash-drawer-session. Also the project decision on opening balance in CLAUDE.md.

11. **Cash out (petty cash) capped and reasoned**
    - Entity: `cash_out` (session, amount, reason, receipt_ref, approved_by when above threshold).
    - Rule: amount cannot exceed cash on hand. A reason is required. Every cash out appears on the owner's exception list.
    - Screen: "Décaissement" form with reason list and live check against cash on hand.
    - Source: https://doc.toasttab.com/doc/platformguide/adminCashDrawerPOSOperations.html ; https://help.loyverse.com/help/shift-management-loyverse-pos

12. **Cash to bank as a separate, immutable step**
    - Entity: `bank_deposit` (date, bank_slip_ref, total, payment_ids[]).
    - Rule: cash received sits in "À déposer" until a deposit is recorded. The deposit total equals the sum of the selected receipts. Deposits are immutable; corrections are reversal rows.
    - Screen: "Dépôt" list: select un-deposited receipts, check total against the slip, enter slip number.
    - Source: https://quickbooks.intuit.com/learn-support/en-us/help-article/bank-deposits/whats-undeposited-funds-account/L6Jan3iRK_US_en_US

13. **Owner read-only control feed**
    - Rule: the owner sees, read-only: reversals, cash outs, closing differences, late-fee waivers, unpaid balances, and per-row history (who, when, what). Filter by user and day; export.
    - Screen: "Contrôles" page with exception categories as tabs.
    - Source: https://support.toasttab.com/en/article/Exceptions-Report-Overview ; https://squareup.com/help/us/en/article/8359-view-discounts-comp-and-void-reports (dashboard-only, no export: avoid) ; https://quickbooks.intuit.com/learn-support/en-us/help-article/audit-log/view-transaction-changes-audit-history/L7obVhic2_US_en_US

14. **Role permissions**
    - Rule: cashiers cannot reverse payments, cash out above a threshold, change the opening float, or see expected cash before counting. Managers hold those rights. Owner has read-only.
    - Screen: role matrix in settings.
    - Source: https://doc.toasttab.com/doc/platformguide/adminCashDrawerPOSOperations.html (permission 3.21) ; https://doc.toasttab.com/doc/platformguide/adminUndoingOperations.html (permission 1.13) ; https://help.loyverse.com/help/shift-management-loyverse-pos ("View shift report")

15. **Receipt numbers**
    - Rule: one unique number per payment; reversals get their own numbers; never reuse a number. (Proposal. Loyverse documents unique receipt numbers and excludes bills, UNVERIFIED.)
    - Source: https://help.loyverse.com/help/receipts-section-reports-back (UNVERIFIED)

---

## 9. Patterns to avoid

1. **Silent autopay failure.** Brightwheel does not retry a failed autopay; the unpaid amount waits for the next due date. Avoid: a failed debit must create a task for staff and a notice to the family. Source: https://help.mybrightwheel.com/en/articles/6363540-billing-faqs-for-payers

2. **Two incompatible autopay rules.** Brightwheel includes past-due in autopay; Blackbaud excludes it. Avoid: leaving the rule implicit. Write it down and show it on the family card. Sources: https://help.mybrightwheel.com/en/articles/11024603-understanding-autopay-faqs-for-providers ; https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-payer-faq.html

3. **Stranded credits.** Unapplied payments make invoices look unpaid (QuickBooks, UNVERIFIED community threads); Jackrabbit flags unlinked fees with a pink marker; Brightwheel's misapplied payment leaves a bill "Unpaid". Avoid: credits that appear only in a side report. Show family credit on the family card and on the invoice list. Sources: https://quickbooks.intuit.com/learn-support/en-us/payments/an-old-unapplied-payment-is-causing-new-invoices-to-look-unpaid/00/603715 ; https://help.jackrabbitclass.com/help/post-individual-payment ; https://help.mybrightwheel.com/en/articles/13922414-track-confirm-and-troubleshoot-payments

4. **Per-student late fees for families.** Jackrabbit's "Per Active Student" option bills each active student in a family. Avoid: per-child late fees for siblings. Source: https://help.jackrabbitclass.com/help/post-late-misc-fees

5. **Compounding late fees.** Brightwheel offers optional compounding on overdue invoices. For parents, it stacks penalties; keep it off unless the school decides otherwise. Source: http://help.mybrightwheel.com/en/articles/5672333-charge-late-payment-fees

6. **Grace-period ambiguity.** FACTS advises against stating grace periods formally but also advises a written policy covering the catch-up window. Avoid: leaving the grace rule unwritten. Decide it with the school and write it in the policy. Source: https://factsmgt.com/blog/optimising-schools-approach-late-tuition-fees/

7. **Closed records with no correction path.** Square does not allow a closed drawer to be adjusted (community, UNVERIFIED); users resort to blank counts or side logs. Avoid: lock without an adjustment entry. Sources: https://community.squareup.com/t5/Archived-Discussions-Read-Only/Can-a-closed-drawer-session-be-edited/m-p/134497 ; https://squareup.com/help/us/en/article/8344-start-and-end-a-cash-drawer-session

8. **Formula the user cannot see.** Loyverse's documented expected-cash components omit the opening amount; Square's report does not state whether counted cash is compared. Avoid: an unexplained variance. Show the formula on the close screen. Sources: https://help.loyverse.com/help/shift-management-loyverse-pos ; https://squareup.com/help/us/en/article/8344-start-and-end-a-cash-drawer-session

9. **Plan changes that need vendor support.** Blackbaud routes plan additions and changes through Support. Avoid for E-skool: the school admin must edit installment plans, since the plan terms (A1, fixed per term per class) are still unvalidated. Source: https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-manage-payment-plans.html

10. **Fixed reminder text and all-or-nothing reminder switch.** Brightwheel's automatic reminders "cannot be customized". Xero users ask for per-customer rules and pause conditions. Avoid: a single global switch and non-editable wording. Allow per-family pause (for example during a signed arrangement) and editable templates. Sources: https://help.mybrightwheel.com/en/articles/12631477-send-payment-reminders ; https://productideas.xero.com/forums/967130-contacts-files/suggestions/45625966-invoice-reminders-set-up-for-a-contact-group

11. **Owner reports only in the web dashboard, with no export.** Square's comp, void and discount reports are dashboard-only and mention no export. Avoid: the owner needs an exportable read-only feed. Source: https://squareup.com/help/us/en/article/8359-view-discounts-comp-and-void-reports

12. **Cash refunds the system cannot record.** Brightwheel cannot refund offline payments through the platform. Avoid: cash refunds with no record. Record a cash-out with a reason and link it to the reversed payment. Source: https://help.mybrightwheel.com/en/articles/5599079-how-payments-in-brightwheel-work

13. **Surprise fees.** FACTS $30 returned-payment fee, Blackbaud Follow Up Service Fee, platform fees that vary by school, and card service fees with no amounts shown (Brightwheel). Avoid: any fee the family sees that the school did not configure. For E-skool, no app-level fee to families; any MoMo fee is the operator's and is not researched (UNVERIFIED). Sources: https://factsmgt.com/parent-faqs/ ; https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-payer-faq.html ; https://help.mybrightwheel.com/en/articles/5599079-how-payments-in-brightwheel-work

14. **Colour-only status.** Jackrabbit marks unlinked fees with a pink "date paid" field. Avoid: status conveyed only by colour. Use a text label. Source: https://help.jackrabbitclass.com/help/post-individual-payment

15. **Lists without search or paging.** Xero reconciliation shows 10 rows with no filter or sort (UNVERIFIED review). Avoid: every list in E-skool (families, payments, reminders) needs search and filters, since the secretary works on phone. Source: https://www.accountingweb.co.uk/node/194521

16. **Support-dependent billing.** Complaints about unreachable support on disputed charges (Brightwheel Trustpilot, UNVERIFIED). Avoid: a dispute path that exists only through staff of a vendor. In E-skool the school admin owns disputes inside the app (dispute = reversal with reason). Source: https://nz.trustpilot.com/review/mybrightwheel.com

---

## 10. Gaps and next checks

- Xero, Wave, Veracross, Lillio: no primary page opened. Retry in a browser; Xero central and Wave support returned empty or 403 to WebFetch.
- QuickBooks official "Receive payments" and unapplied-payments articles: not opened.
- Promise-to-pay and broken-promise flags: not found in any vendor source.
- Receipt and invoice numbering rules: not found.
- Expense categories: not researched.
- Independent collection-rate evidence: none found.
- G2 and App Store complaints: not retrieved.
- Verify on a test shift in Loyverse whether expected cash includes the opening amount.
- Mobile money (MoMo, Orange Money), WhatsApp reminders and Cameroonian receipt rules: not covered by any source here.

---

## 11. Source index

Opened (read through WebFetch; extract, not raw page):

- Brightwheel: https://help.mybrightwheel.com/en/articles/5599079-how-payments-in-brightwheel-work ; https://help.mybrightwheel.com/en/articles/6363540-billing-faqs-for-payers ; https://help.mybrightwheel.com/en/articles/11024603-understanding-autopay-faqs-for-providers ; https://help.mybrightwheel.com/en/articles/12631477-send-payment-reminders ; http://help.mybrightwheel.com/en/articles/5672333-charge-late-payment-fees ; http://help.mybrightwheel.com/en/articles/3212408-report-on-past-overdue-balances ; https://help.mybrightwheel.com/en/articles/13922414-track-confirm-and-troubleshoot-payments ; https://help.mybrightwheel.com/en/articles/9369081-receive-weekly-emails-previewing-upcoming-invoices
- Blackbaud: https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-payer-faq.html ; https://webfiles-sc1.blackbaud.com/files/support/helpfiles/tuition-management/content/st-manage-payment-plans.html
- FACTS: https://factsmgt.com/parent-faqs/ ; https://factsmgt.com/blog/optimising-schools-approach-late-tuition-fees/
- Jackrabbit: https://help.jackrabbitclass.com/help/post-late-misc-fees ; https://help.jackrabbitclass.com/help/tuition-billing-methods ; https://help.jackrabbitclass.com/help/post-individual-payment
- Procare (partial index): https://www.procaresupport.com/procare-online/docs/accounting-and-transactions
- QuickBooks Online: https://quickbooks.intuit.com/learn-support/en-us/help-article/customer-statements/create-send-customer-statements-quickbooks-online/L8bvb69Gg_US_en_US ; https://quickbooks.intuit.com/learn-support/en-us/help-article/invoicing/record-invoice-payments-quickbooks-online/L4ZadDW7F_US_en_US ; https://quickbooks.intuit.com/learn-support/en-us/help-article/list-management/void-delete-transactions-quickbooks-online/L5sZV8GYh_US_en_US ; https://quickbooks.intuit.com/learn-support/en-us/help-article/bank-deposits/whats-undeposited-funds-account/L6Jan3iRK_US_en_US ; https://quickbooks.intuit.com/learn-support/en-us/help-article/audit-log/view-transaction-changes-audit-history/L7obVhic2_US_en_US ; https://quickbooks.intuit.com/learn-support/en-us/help-article/accounts-receivable-reports/run-accounts-receivable-aging-report/L4N7PC2hg_US_en_US
- Square: https://squareup.com/help/us/en/article/8344-start-and-end-a-cash-drawer-session ; https://squareup.com/help/us/en/article/8359-view-discounts-comp-and-void-reports
- Loyverse: https://help.loyverse.com/help/shift-management-loyverse-pos
- Toast: https://doc.toasttab.com/doc/platformguide/adminCashDrawerPOSOperations.html ; https://doc.toasttab.com/doc/platformguide/adminUndoingOperations.html ; https://support.toasttab.com/en/article/Exceptions-Report-Overview

Search summaries or unopened pages (all UNVERIFIED): Xero (https://central.xero.com/0/article/Apply-a-customer-s-credit-to-an-invoice ; https://central.xero.com/0/article/Edit-or-void-a-sales-overpayment ; https://central.xero.com/0/article/Set-up-invoice-reminders ; https://central.xero.com/0/article/Check-a-reminder-s-status-and-history ; https://central.xero.com/s/article/Tips-for-receiving-invoice-payments-on-time-UK ; https://central.xero.com/0/article/Your-Xero-dashboard). Wave (https://support.waveapps.com/hc/en-us/articles/30148679186068-Manage-and-bookkeep-invoice-overpayments ; https://support.waveapps.com/hc/en-us/articles/208621536-Account-for-a-lump-sum-invoice-payment ; https://support.waveapps.com/hc/en-us/articles/4406239714452-Aged-Receivables-report). Veracross (https://community.veracross.com/s/article/Maintaining-Student-and-Household-Data ; https://community.veracross.com/s/article/AR-Invoice-Processing ; https://community.veracross.com/s/article/Invoices-in-the-Parent-Portal). Procare (https://procare-solutions.document360.io/procare-desktop/docs/family-accounting). Lillio (https://www.lillio.com/resources/customer-stories/how-i-got-my-time-back-with-lillio-billing-and-payments). Loyverse (https://help.loyverse.com/help/receipts-section-reports-back). Toast (https://support.toasttab.com/en/article/Voiding-Items-Payments-and-Checks ; https://support.toasttab.com/en/article/Close-Out-Day-Z-Report-Auto-Capture). Square community threads (linked inline above). Reviews (linked inline above).
</content>
