export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_messages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignment_requests: {
        Row: {
          admin_response: string | null
          assignment_title: string
          course_name: string
          created_at: string
          deadline: string
          file_url: string | null
          id: string
          status: string
          student_id: string
          updated_at: string
          what_to_do: string
        }
        Insert: {
          admin_response?: string | null
          assignment_title: string
          course_name: string
          created_at?: string
          deadline: string
          file_url?: string | null
          id?: string
          status?: string
          student_id: string
          updated_at?: string
          what_to_do: string
        }
        Update: {
          admin_response?: string | null
          assignment_title?: string
          course_name?: string
          created_at?: string
          deadline?: string
          file_url?: string | null
          id?: string
          status?: string
          student_id?: string
          updated_at?: string
          what_to_do?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          max_points: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          max_points?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          max_points?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      cgpa_semesters: {
        Row: {
          created_at: string
          credits: number
          gpa: number
          graded_credits: number
          id: string
          order_index: number
          semester_name: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits: number
          gpa: number
          graded_credits?: number
          id?: string
          order_index?: number
          semester_name: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          gpa?: number
          graded_credits?: number
          id?: string
          order_index?: number
          semester_name?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_marks: {
        Row: {
          cat1_mark: number | null
          cat2_mark: number | null
          course_id: string
          course_type: string
          created_at: string
          da1_mark: number | null
          da2_mark: number | null
          da3_mark: number | null
          id: string
          lab_fat: number | null
          lab_internals: number | null
          student_id: string
          theory_fat: number | null
          updated_at: string
        }
        Insert: {
          cat1_mark?: number | null
          cat2_mark?: number | null
          course_id: string
          course_type: string
          created_at?: string
          da1_mark?: number | null
          da2_mark?: number | null
          da3_mark?: number | null
          id?: string
          lab_fat?: number | null
          lab_internals?: number | null
          student_id: string
          theory_fat?: number | null
          updated_at?: string
        }
        Update: {
          cat1_mark?: number | null
          cat2_mark?: number | null
          course_id?: string
          course_type?: string
          created_at?: string
          da1_mark?: number | null
          da2_mark?: number | null
          da3_mark?: number | null
          id?: string
          lab_fat?: number | null
          lab_internals?: number | null
          student_id?: string
          theory_fat?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_marks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_materials: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          material_type: string
          module_id: string | null
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          material_type: string
          module_id?: string | null
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          material_type?: string
          module_id?: string | null
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_materials_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          heading: string | null
          id: string
          order_index: number
          serial_no: string
          topic: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          heading?: string | null
          id?: string
          order_index?: number
          serial_no: string
          topic: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          heading?: string | null
          id?: string
          order_index?: number
          serial_no?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          class_days: string[] | null
          course_type: string | null
          created_at: string
          credits: number | null
          description: string | null
          difficulty: string | null
          duration_hours: number | null
          id: string
          instructor_id: string
          is_published: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          class_days?: string[] | null
          course_type?: string | null
          created_at?: string
          credits?: number | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          id?: string
          instructor_id: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          class_days?: string[] | null
          course_type?: string | null
          created_at?: string
          credits?: number | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          id?: string
          instructor_id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      day_status: {
        Row: {
          created_at: string
          date: string
          id: string
          is_holiday: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_holiday?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_holiday?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          progress: number | null
          student_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          progress?: number | null
          student_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          progress?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          course_name: string
          created_at: string
          exam_date: string
          exam_type: string
          id: string
          portions: string
          sub_category: string
          updated_at: string
        }
        Insert: {
          course_name: string
          created_at?: string
          exam_date: string
          exam_type?: string
          id?: string
          portions: string
          sub_category?: string
          updated_at?: string
        }
        Update: {
          course_name?: string
          created_at?: string
          exam_date?: string
          exam_type?: string
          id?: string
          portions?: string
          sub_category?: string
          updated_at?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          order_index: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      material_contributions: {
        Row: {
          admin_response: string | null
          course_title: string
          created_at: string
          file_url: string
          id: string
          module_name: string
          status: string
          student_id: string
          topic_name: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          course_title: string
          created_at?: string
          file_url: string
          id?: string
          module_name: string
          status?: string
          student_id: string
          topic_name: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          course_title?: string
          created_at?: string
          file_url?: string
          id?: string
          module_name?: string
          status?: string
          student_id?: string
          topic_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      queries: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          message: string
          status: string
          student_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message: string
          status?: string
          student_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: string
          student_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      semester_info: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          semester_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          semester_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          semester_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      semester_settings: {
        Row: {
          created_at: string
          id: string
          maintenance_mode_enabled: boolean
          semester_completion_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          maintenance_mode_enabled?: boolean
          semester_completion_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          maintenance_mode_enabled?: boolean
          semester_completion_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      study_categories: {
        Row: {
          category_type: string
          created_at: string | null
          id: string
          name: string
          subject_id: string
        }
        Insert: {
          category_type: string
          created_at?: string | null
          id?: string
          name: string
          subject_id: string
        }
        Update: {
          category_type?: string
          created_at?: string | null
          id?: string
          name?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_subject"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "study_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_items: {
        Row: {
          category_id: string
          content: string | null
          created_at: string | null
          file_url: string | null
          id: string
          title: string
          video_source: string | null
          youtube_url: string | null
        }
        Insert: {
          category_id: string
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          title: string
          video_source?: string | null
          youtube_url?: string | null
        }
        Update: {
          category_id?: string
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          title?: string
          video_source?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "study_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          start_date: string
          student_id: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          start_date: string
          student_id: string
          subject: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          start_date?: string
          student_id?: string
          subject?: string
        }
        Relationships: []
      }
      study_subjects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          student_id?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string
          content: string | null
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          id: string
          points: number | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          id?: string
          points?: number | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          id?: string
          points?: number | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_connections: {
        Row: {
          created_at: string
          from_item_id: string
          id: string
          student_id: string
          to_item_id: string
        }
        Insert: {
          created_at?: string
          from_item_id: string
          id?: string
          student_id: string
          to_item_id: string
        }
        Update: {
          created_at?: string
          from_item_id?: string
          id?: string
          student_id?: string
          to_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_connections_from_item_id_fkey"
            columns: ["from_item_id"]
            isOneToOne: false
            referencedRelation: "workspace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_connections_to_item_id_fkey"
            columns: ["to_item_id"]
            isOneToOne: false
            referencedRelation: "workspace_items"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_items: {
        Row: {
          color: string
          content: string | null
          created_at: string
          file_url: string | null
          height: number
          id: string
          is_minimized: boolean | null
          item_type: string
          position_x: number
          position_y: number
          student_id: string
          title: string
          updated_at: string
          width: number
        }
        Insert: {
          color?: string
          content?: string | null
          created_at?: string
          file_url?: string | null
          height?: number
          id?: string
          is_minimized?: boolean | null
          item_type: string
          position_x?: number
          position_y?: number
          student_id: string
          title: string
          updated_at?: string
          width?: number
        }
        Update: {
          color?: string
          content?: string | null
          created_at?: string
          file_url?: string | null
          height?: number
          id?: string
          is_minimized?: boolean | null
          item_type?: string
          position_x?: number
          position_y?: number
          student_id?: string
          title?: string
          updated_at?: string
          width?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_admin_role: { Args: { _user_email: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "student"],
    },
  },
} as const
