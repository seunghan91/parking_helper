export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string
          car_number: string | null
          phone_number: string | null
          created_at: string
        }
        Insert: {
          id: string
          nickname: string
          car_number?: string | null
          phone_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          car_number?: string | null
          phone_number?: string | null
          created_at?: string
        }
      }
      places: {
        Row: {
          id: string
          name: string
          address: string | null
          latitude: number | null
          longitude: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
      }
      place_aliases: {
        Row: {
          id: string
          place_id: string
          alias: string
          provider: string | null
          created_at: string
        }
        Insert: {
          id?: string
          place_id: string
          alias: string
          provider?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          place_id?: string
          alias?: string
          provider?: string | null
          created_at?: string
        }
      }
      place_links: {
        Row: {
          id: string
          place_id: string
          provider: string
          external_place_id: string
        }
        Insert: {
          id?: string
          place_id: string
          provider: string
          external_place_id: string
        }
        Update: {
          id?: string
          place_id?: string
          provider?: string
          external_place_id?: string
        }
      }
      parking_lots: {
        Row: {
          id: string
          place_id: string | null
          name: string
          address: string | null
          latitude: number | null
          longitude: number | null
          type: string | null
          price_info: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          place_id?: string | null
          name: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          type?: string | null
          price_info?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          place_id?: string | null
          name?: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          type?: string | null
          price_info?: Json | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          subject_type: 'parking_lot' | 'place' | 'location'
          parking_lot_id: string | null
          place_id: string | null
          latitude: number | null
          longitude: number | null
          rating: number | null
          comment: string | null
          helpful_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_type: 'parking_lot' | 'place' | 'location'
          parking_lot_id?: string | null
          place_id?: string | null
          latitude?: number | null
          longitude?: number | null
          rating?: number | null
          comment?: string | null
          helpful_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_type?: 'parking_lot' | 'place' | 'location'
          parking_lot_id?: string | null
          place_id?: string | null
          latitude?: number | null
          longitude?: number | null
          rating?: number | null
          comment?: string | null
          helpful_count?: number
          created_at?: string
        }
      }
      review_helpfuls: {
        Row: {
          id: string
          review_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          user_id?: string
          created_at?: string
        }
      }
      tips: {
        Row: {
          id: string
          user_id: string
          parking_lot_id: string
          content: string
          discount_info: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parking_lot_id: string
          content: string
          discount_info?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          parking_lot_id?: string
          content?: string
          discount_info?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}