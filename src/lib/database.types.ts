export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      adjustments: {
        Row: {
          adjusted_on: string;
          amount: number;
          created_at: string;
          created_by: string | null;
          id: string;
          label: string;
          method: Database["public"]["Enums"]["payment_method"];
          refers_to_month: string | null;
        };
        ComputedFields: never;
        Insert: {
          adjusted_on?: string;
          amount: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label: string;
          method?: Database["public"]["Enums"]["payment_method"];
          refers_to_month?: string | null;
        };
        Update: {
          adjusted_on?: string;
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          refers_to_month?: string | null;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          after: Json | null;
          before: Json | null;
          created_at: string;
          id: number;
          record_id: string | null;
          table_name: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          id?: never;
          record_id?: string | null;
          table_name: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          id?: never;
          record_id?: string | null;
          table_name?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      cash_closings: {
        Row: {
          cash_in: number;
          cash_out: number;
          closed_at: string;
          closed_by: string | null;
          closing_date: string;
          counted_cash: number;
          difference: number | null;
          expected_cash: number;
          id: string;
          note: string | null;
          opening_cash: number;
          removed_cash: number;
        };
        ComputedFields: never;
        Insert: {
          cash_in: number;
          cash_out: number;
          closed_at?: string;
          closed_by?: string | null;
          closing_date: string;
          counted_cash: number;
          difference?: never;
          expected_cash: number;
          id?: string;
          note?: string | null;
          opening_cash: number;
          removed_cash?: number;
        };
        Update: {
          cash_in?: number;
          cash_out?: number;
          closed_at?: string;
          closed_by?: string | null;
          closing_date?: string;
          counted_cash?: number;
          difference?: never;
          expected_cash?: number;
          id?: string;
          note?: string | null;
          opening_cash?: number;
          removed_cash?: number;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      counters: {
        Row: {
          key: string;
          last_number: number;
        };
        ComputedFields: never;
        Insert: {
          key: string;
          last_number?: number;
        };
        Update: {
          key?: string;
          last_number?: number;
        };
        Relationships: [];
      };
      discounts: {
        Row: {
          created_at: string;
          created_by: string | null;
          fee: Database["public"]["Enums"]["fee_type"] | null;
          id: string;
          is_active: boolean;
          kind: string;
          pupil_id: string;
          reason: string;
          school_year_id: string;
          term: number | null;
          value: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          fee?: Database["public"]["Enums"]["fee_type"] | null;
          id?: string;
          is_active?: boolean;
          kind: string;
          pupil_id: string;
          reason: string;
          school_year_id: string;
          term?: number | null;
          value: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          fee?: Database["public"]["Enums"]["fee_type"] | null;
          id?: string;
          is_active?: boolean;
          kind?: string;
          pupil_id?: string;
          reason?: string;
          school_year_id?: string;
          term?: number | null;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "discounts_pupil_id_fkey";
            columns: ["pupil_id"];
            isOneToOne: false;
            referencedRelation: "pupils";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discounts_school_year_id_fkey";
            columns: ["school_year_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollment_applications: {
        Row: {
          birth_date: string | null;
          child_first_name: string;
          child_last_name: string;
          created_at: string;
          created_by: string | null;
          desired_class_id: string | null;
          id: string;
          notes: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          pupil_id: string | null;
          school_year_id: string | null;
          source: string | null;
          status: Database["public"]["Enums"]["application_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          birth_date?: string | null;
          child_first_name?: string;
          child_last_name: string;
          created_at?: string;
          created_by?: string | null;
          desired_class_id?: string | null;
          id?: string;
          notes?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          pupil_id?: string | null;
          school_year_id?: string | null;
          source?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
        };
        Update: {
          birth_date?: string | null;
          child_first_name?: string;
          child_last_name?: string;
          created_at?: string;
          created_by?: string | null;
          desired_class_id?: string | null;
          id?: string;
          notes?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          pupil_id?: string | null;
          school_year_id?: string | null;
          source?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollment_applications_desired_class_id_fkey";
            columns: ["desired_class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollment_applications_desired_class_id_fkey";
            columns: ["desired_class_id"];
            isOneToOne: false;
            referencedRelation: "pupil_term_balance";
            referencedColumns: ["class_id"];
          },
          {
            foreignKeyName: "enrollment_applications_pupil_id_fkey";
            columns: ["pupil_id"];
            isOneToOne: false;
            referencedRelation: "pupils";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollment_applications_school_year_id_fkey";
            columns: ["school_year_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          class_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          pupil_id: string;
          school_year_id: string;
        };
        ComputedFields: never;
        Insert: {
          class_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          pupil_id: string;
          school_year_id: string;
        };
        Update: {
          class_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          pupil_id?: string;
          school_year_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "pupil_term_balance";
            referencedColumns: ["class_id"];
          },
          {
            foreignKeyName: "enrollments_pupil_id_fkey";
            columns: ["pupil_id"];
            isOneToOne: false;
            referencedRelation: "pupils";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_school_year_id_fkey";
            columns: ["school_year_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_categories: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          category_id: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          method: Database["public"]["Enums"]["payment_method"];
          receipt_path: string | null;
          spent_on: string;
          void_reason: string | null;
          voided: boolean;
          voided_at: string | null;
          voided_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          category_id: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          method: Database["public"]["Enums"]["payment_method"];
          receipt_path?: string | null;
          spent_on: string;
          void_reason?: string | null;
          voided?: boolean;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          amount?: number;
          category_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          receipt_path?: string | null;
          spent_on?: string;
          void_reason?: string | null;
          voided?: boolean;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "expense_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      fee_schedules: {
        Row: {
          amount: number;
          class_id: string;
          created_at: string;
          created_by: string | null;
          due_date: string;
          fee: Database["public"]["Enums"]["fee_type"];
          id: string;
          school_year_id: string;
          term: number | null;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          class_id: string;
          created_at?: string;
          created_by?: string | null;
          due_date: string;
          fee?: Database["public"]["Enums"]["fee_type"];
          id?: string;
          school_year_id: string;
          term?: number | null;
        };
        Update: {
          amount?: number;
          class_id?: string;
          created_at?: string;
          created_by?: string | null;
          due_date?: string;
          fee?: Database["public"]["Enums"]["fee_type"];
          id?: string;
          school_year_id?: string;
          term?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "fee_schedules_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fee_schedules_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "pupil_term_balance";
            referencedColumns: ["class_id"];
          },
          {
            foreignKeyName: "fee_schedules_school_year_id_fkey";
            columns: ["school_year_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
        ];
      };
      message_jobs: {
        Row: {
          channel: string;
          created_at: string;
          error: string | null;
          id: string;
          payload: NonNullable<Json>;
          provider_message_id: string | null;
          pupil_id: string;
          school_year_id: string | null;
          sent_at: string | null;
          status: string;
          term: number | null;
          to_phone: string;
        };
        ComputedFields: never;
        Insert: {
          channel?: string;
          created_at?: string;
          error?: string | null;
          id?: string;
          payload?: NonNullable<Json>;
          provider_message_id?: string | null;
          pupil_id: string;
          school_year_id?: string | null;
          sent_at?: string | null;
          status?: string;
          term?: number | null;
          to_phone: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          error?: string | null;
          id?: string;
          payload?: NonNullable<Json>;
          provider_message_id?: string | null;
          pupil_id?: string;
          school_year_id?: string | null;
          sent_at?: string | null;
          status?: string;
          term?: number | null;
          to_phone?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_jobs_pupil_id_fkey";
            columns: ["pupil_id"];
            isOneToOne: false;
            referencedRelation: "pupils";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_jobs_school_year_id_fkey";
            columns: ["school_year_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
        ];
      };
      other_income: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          label: string;
          method: Database["public"]["Enums"]["payment_method"];
          received_on: string;
          void_reason: string | null;
          voided: boolean;
          voided_at: string | null;
          voided_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          label: string;
          method: Database["public"]["Enums"]["payment_method"];
          received_on: string;
          void_reason?: string | null;
          voided?: boolean;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          label?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          received_on?: string;
          void_reason?: string | null;
          voided?: boolean;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string | null;
          fee: Database["public"]["Enums"]["fee_type"];
          id: string;
          method: Database["public"]["Enums"]["payment_method"];
          note: string | null;
          paid_at: string;
          pupil_id: string;
          receipt_number: string;
          reference: string | null;
          school_year_id: string;
          term: number | null;
          void_reason: string | null;
          voided: boolean;
          voided_at: string | null;
          voided_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          created_by?: string | null;
          fee?: Database["public"]["Enums"]["fee_type"];
          id?: string;
          method: Database["public"]["Enums"]["payment_method"];
          note?: string | null;
          paid_at?: string;
          pupil_id: string;
          receipt_number: string;
          reference?: string | null;
          school_year_id: string;
          term?: number | null;
          void_reason?: string | null;
          voided?: boolean;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          fee?: Database["public"]["Enums"]["fee_type"];
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          note?: string | null;
          paid_at?: string;
          pupil_id?: string;
          receipt_number?: string;
          reference?: string | null;
          school_year_id?: string;
          term?: number | null;
          void_reason?: string | null;
          voided?: boolean;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_pupil_id_fkey";
            columns: ["pupil_id"];
            isOneToOne: false;
            referencedRelation: "pupils";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_school_year_id_fkey";
            columns: ["school_year_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
        ];
      };
      payroll_entries: {
        Row: {
          advances: number;
          base_amount: number;
          bonuses: number;
          created_at: string;
          created_by: string | null;
          deductions: number;
          id: string;
          method: Database["public"]["Enums"]["payment_method"] | null;
          month: string;
          net_amount: number | null;
          notes: string | null;
          paid_at: string | null;
          payslip_number: string | null;
          staff_id: string;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          advances?: number;
          base_amount: number;
          bonuses?: number;
          created_at?: string;
          created_by?: string | null;
          deductions?: number;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"] | null;
          month: string;
          net_amount?: never;
          notes?: string | null;
          paid_at?: string | null;
          payslip_number?: string | null;
          staff_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          advances?: number;
          base_amount?: number;
          bonuses?: number;
          created_at?: string;
          created_by?: string | null;
          deductions?: number;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"] | null;
          month?: string;
          net_amount?: never;
          notes?: string | null;
          paid_at?: string | null;
          payslip_number?: string | null;
          staff_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payroll_entries_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      period_locks: {
        Row: {
          locked_at: string;
          locked_by: string | null;
          month: string;
        };
        ComputedFields: never;
        Insert: {
          locked_at?: string;
          locked_by?: string | null;
          month: string;
        };
        Update: {
          locked_at?: string;
          locked_by?: string | null;
          month?: string;
        };
        Relationships: [];
      };
      pupils: {
        Row: {
          created_at: string;
          created_by: string | null;
          first_name: string;
          id: string;
          is_active: boolean;
          last_name: string;
          left_on: string | null;
          left_reason: string | null;
          notes: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          parent_phone_alt: string | null;
          portal_token: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          first_name?: string;
          id?: string;
          is_active?: boolean;
          last_name: string;
          left_on?: string | null;
          left_reason?: string | null;
          notes?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          parent_phone_alt?: string | null;
          portal_token?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          first_name?: string;
          id?: string;
          is_active?: boolean;
          last_name?: string;
          left_on?: string | null;
          left_reason?: string | null;
          notes?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          parent_phone_alt?: string | null;
          portal_token?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reminder_log: {
        Row: {
          amount_due: number | null;
          channel: string;
          created_at: string;
          created_by: string | null;
          id: string;
          pupil_id: string;
          school_year_id: string | null;
          term: number | null;
        };
        ComputedFields: never;
        Insert: {
          amount_due?: number | null;
          channel?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          pupil_id: string;
          school_year_id?: string | null;
          term?: number | null;
        };
        Update: {
          amount_due?: number | null;
          channel?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          pupil_id?: string;
          school_year_id?: string | null;
          term?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "reminder_log_pupil_id_fkey";
            columns: ["pupil_id"];
            isOneToOne: false;
            referencedRelation: "pupils";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminder_log_school_year_id_fkey";
            columns: ["school_year_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
        ];
      };
      school_years: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_current: boolean;
          label: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_current?: boolean;
          label: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_current?: boolean;
          label?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          address: string | null;
          auto_reminder_interval_days: number;
          auto_reminders_enabled: boolean;
          email: string | null;
          id: boolean;
          logo_path: string | null;
          module_enrollment: boolean;
          module_finance: boolean;
          module_hr: boolean;
          phone: string | null;
          receipt_footer: string | null;
          receipt_format: string;
          reminder_template: string;
          school_name: string;
          term_label: string;
          terms_count: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          auto_reminder_interval_days?: number;
          auto_reminders_enabled?: boolean;
          email?: string | null;
          id?: boolean;
          logo_path?: string | null;
          module_enrollment?: boolean;
          module_finance?: boolean;
          module_hr?: boolean;
          phone?: string | null;
          receipt_footer?: string | null;
          receipt_format?: string;
          reminder_template?: string;
          school_name?: string;
          term_label?: string;
          terms_count?: number;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          auto_reminder_interval_days?: number;
          auto_reminders_enabled?: boolean;
          email?: string | null;
          id?: boolean;
          logo_path?: string | null;
          module_enrollment?: boolean;
          module_finance?: boolean;
          module_hr?: boolean;
          phone?: string | null;
          receipt_footer?: string | null;
          receipt_format?: string;
          reminder_template?: string;
          school_name?: string;
          term_label?: string;
          terms_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff: {
        Row: {
          contract: Database["public"]["Enums"]["contract_type"];
          created_at: string;
          created_by: string | null;
          end_date: string | null;
          full_name: string;
          id: string;
          is_active: boolean;
          job_title: string;
          notes: string | null;
          phone: string | null;
          start_date: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          contract?: Database["public"]["Enums"]["contract_type"];
          created_at?: string;
          created_by?: string | null;
          end_date?: string | null;
          full_name: string;
          id?: string;
          is_active?: boolean;
          job_title: string;
          notes?: string | null;
          phone?: string | null;
          start_date?: string | null;
          updated_at?: string;
        };
        Update: {
          contract?: Database["public"]["Enums"]["contract_type"];
          created_at?: string;
          created_by?: string | null;
          end_date?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          job_title?: string;
          notes?: string | null;
          phone?: string | null;
          start_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_salary_history: {
        Row: {
          created_at: string;
          created_by: string | null;
          effective_from: string;
          id: string;
          monthly_amount: number;
          note: string | null;
          staff_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          effective_from: string;
          id?: string;
          monthly_amount: number;
          note?: string | null;
          staff_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          effective_from?: string;
          id?: string;
          monthly_amount?: number;
          note?: string | null;
          staff_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_salary_history_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          full_name: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name?: string;
          is_active?: boolean;
          role: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      balance_lines: {
        Row: {
          applied: number | null;
          carry_in: number | null;
          carry_out: number | null;
          class_id: string | null;
          discount: number | null;
          due: number | null;
          due_date: string | null;
          fee: Database["public"]["Enums"]["fee_type"] | null;
          fee_schedule_id: string | null;
          gross_due: number | null;
          is_last: boolean | null;
          paid: number | null;
          pupil_id: string | null;
          remaining: number | null;
          school_year_id: string | null;
          status: string | null;
          term: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "pupil_term_balance";
            referencedColumns: ["class_id"];
          },
          {
            foreignKeyName: "enrollments_pupil_id_fkey";
            columns: ["pupil_id"];
            isOneToOne: false;
            referencedRelation: "pupils";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_school_year_id_fkey";
            columns: ["school_year_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
        ];
      };
      cash_book: {
        Row: {
          amount_in: number | null;
          amount_out: number | null;
          created_at: string | null;
          entry_date: string | null;
          label: string | null;
          method: Database["public"]["Enums"]["payment_method"] | null;
          source: string | null;
          source_id: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      pupil_term_balance: {
        Row: {
          applied: number | null;
          class_id: string | null;
          class_name: string | null;
          class_sort_order: number | null;
          due: number | null;
          due_date: string | null;
          first_name: string | null;
          is_active: boolean | null;
          last_name: string | null;
          last_reminded_at: string | null;
          paid: number | null;
          parent_name: string | null;
          parent_phone: string | null;
          portal_token: string | null;
          pupil_id: string | null;
          remaining: number | null;
          school_year_id: string | null;
          status: string | null;
          term: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "enrollments_pupil_id_fkey";
            columns: ["pupil_id"];
            isOneToOne: false;
            referencedRelation: "pupils";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_school_year_id_fkey";
            columns: ["school_year_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
        ];
      };
      pupil_year_balance: {
        Row: {
          applied: number | null;
          class_id: string | null;
          credit: number | null;
          due: number | null;
          due_to_date: number | null;
          overdue: number | null;
          paid: number | null;
          pupil_id: string | null;
          remaining: number | null;
          school_year_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "pupil_term_balance";
            referencedColumns: ["class_id"];
          },
          {
            foreignKeyName: "enrollments_pupil_id_fkey";
            columns: ["pupil_id"];
            isOneToOne: false;
            referencedRelation: "pupils";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_school_year_id_fkey";
            columns: ["school_year_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_current_salary: {
        Row: {
          effective_from: string | null;
          monthly_amount: number | null;
          staff_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "staff_salary_history_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      app_today: { Args: Record<PropertyKey, never>; Returns: string };
      assert_date_open: { Args: { p_date: string }; Returns: undefined };
      auth_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["app_role"];
      };
      cash_position: { Args: { p_date: string }; Returns: Json };
      close_day: {
        Args: { p_counted: number; p_date: string; p_note: string; p_removed: number };
        Returns: Json;
      };
      copy_fee_schedules: { Args: { p_from_year: string; p_to_year: string }; Returns: number };
      create_pupil: {
        Args: {
          p_class_id: string;
          p_first_name: string;
          p_last_name: string;
          p_notes?: string;
          p_parent_name?: string;
          p_parent_phone?: string;
          p_parent_phone_alt?: string;
          p_school_year_id: string;
        };
        Returns: string;
      };
      dashboard_stats: { Args: { p_school_year_id: string }; Returns: Json };
      delete_payroll_entry: { Args: { p_entry_id: string }; Returns: undefined };
      due_auto_reminders: {
        Args: { p_limit?: number };
        Returns: {
          class_name: string;
          due_date: string;
          first_name: string;
          last_name: string;
          parent_name: string;
          parent_phone: string;
          portal_token: string;
          pupil_id: string;
          remaining: number;
          school_year_id: string;
          term: number;
        }[];
      };
      enroll_application: {
        Args: { p_application_id: string; p_class_id: string; p_school_year_id: string };
        Returns: string;
      };
      import_pupils: { Args: { p_rows: Json; p_school_year_id: string }; Returns: Json };
      lock_month: { Args: { p_month: string }; Returns: undefined };
      monthly_report: { Args: { p_month: string }; Returns: Json };
      next_counter: { Args: { p_key: string }; Returns: number };
      normalize_cm_phone: { Args: { p: string }; Returns: string };
      normalize_text: { Args: { p: string }; Returns: string };
      parent_portal: { Args: { p_token: string }; Returns: Json };
      pay_payroll_entry: {
        Args: {
          p_entry_id: string;
          p_method: Database["public"]["Enums"]["payment_method"];
          p_paid_at: string;
        };
        Returns: string;
      };
      prepare_payroll: { Args: { p_month: string }; Returns: number };
      promote_pupils: { Args: { p_decisions: Json; p_to_year: string }; Returns: Json };
      raise_app_error: { Args: { p_message: string }; Returns: undefined };
      record_adjustment: {
        Args: {
          p_amount: number;
          p_label: string;
          p_method: Database["public"]["Enums"]["payment_method"];
          p_refers_to_month: string;
        };
        Returns: string;
      };
      record_expense: {
        Args: {
          p_amount: number;
          p_category_id: string;
          p_description: string;
          p_method: Database["public"]["Enums"]["payment_method"];
          p_receipt_path?: string;
          p_spent_on: string;
        };
        Returns: string;
      };
      record_other_income: {
        Args: {
          p_amount: number;
          p_description: string;
          p_label: string;
          p_method: Database["public"]["Enums"]["payment_method"];
          p_received_on: string;
        };
        Returns: string;
      };
      record_payment: {
        Args: {
          p_amount: number;
          p_fee: Database["public"]["Enums"]["fee_type"];
          p_force?: boolean;
          p_method: Database["public"]["Enums"]["payment_method"];
          p_note?: string;
          p_paid_at?: string;
          p_pupil_id: string;
          p_reference?: string;
          p_school_year_id: string;
          p_term: number;
        };
        Returns: Json;
      };
      regenerate_portal_token: { Args: { p_pupil_id: string }; Returns: string };
      require_role: {
        Args: { p_roles: Database["public"]["Enums"]["app_role"][] };
        Returns: Database["public"]["Enums"]["app_role"];
      };
      salary_for_month: { Args: { p_month: string; p_staff_id: string }; Returns: number };
      save_fee_schedules: { Args: { p_lines: Json; p_school_year_id: string }; Returns: number };
      search_pupils: {
        Args: { p_limit?: number; p_query: string; p_school_year_id: string };
        Returns: {
          class_id: string;
          class_name: string;
          first_name: string;
          is_active: boolean;
          last_name: string;
          parent_name: string;
          parent_phone: string;
          pupil_id: string;
          remaining: number;
        }[];
      };
      set_current_year: { Args: { p_school_year_id: string }; Returns: undefined };
      update_payroll_entry: {
        Args: {
          p_advances: number;
          p_bonuses: number;
          p_deductions: number;
          p_entry_id: string;
          p_notes: string;
        };
        Returns: undefined;
      };
      void_expense: { Args: { p_expense_id: string; p_reason: string }; Returns: undefined };
      void_other_income: { Args: { p_income_id: string; p_reason: string }; Returns: undefined };
      void_payment: { Args: { p_payment_id: string; p_reason: string }; Returns: undefined };
    };
    Enums: {
      app_role: "admin" | "owner" | "secretary";
      application_status: "new" | "contacted" | "visit" | "accepted" | "enrolled" | "rejected";
      contract_type: "permanent" | "fixed_term" | "part_time" | "volunteer";
      fee_type: "tuition" | "registration" | "uniform" | "books" | "exam" | "other";
      payment_method: "cash" | "orange_money" | "mtn_momo" | "bank";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "owner", "secretary"],
      application_status: ["new", "contacted", "visit", "accepted", "enrolled", "rejected"],
      contract_type: ["permanent", "fixed_term", "part_time", "volunteer"],
      fee_type: ["tuition", "registration", "uniform", "books", "exam", "other"],
      payment_method: ["cash", "orange_money", "mtn_momo", "bank"],
    },
  },
} as const;
