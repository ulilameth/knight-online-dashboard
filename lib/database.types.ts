// Bu dosya scripts/db-tipleri.mjs ile üretilir; elle değiştirme. Migration değişince: npm run db:tipler
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          id: string
          baslik: string
          govde: string
          sabit: boolean
          ts_gonderildi_at: string | null
          yazar: string | null
          created_at: string
        }
        Insert: {
          id?: string
          baslik: string
          govde: string
          sabit?: boolean
          ts_gonderildi_at?: string | null
          yazar?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          baslik?: string
          govde?: string
          sabit?: boolean
          ts_gonderildi_at?: string | null
          yazar?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_yazar_fkey"
            columns: ["yazar"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          event_id: string
          character_id: string
          durum: Database["public"]["Enums"]["yoklama"]
          isaretleyen: string | null
          updated_at: string
        }
        Insert: {
          event_id: string
          character_id: string
          durum: Database["public"]["Enums"]["yoklama"]
          isaretleyen?: string | null
          updated_at?: string
        }
        Update: {
          event_id?: string
          character_id?: string
          durum?: Database["public"]["Enums"]["yoklama"]
          isaretleyen?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_isaretleyen_fkey"
            columns: ["isaretleyen"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      builds: {
        Row: {
          id: string
          character_id: string | null
          ad: string
          sinif: Database["public"]["Enums"]["sinif"]
          irk_turu: string | null
          level: number
          reb: number
          statlar: Json
          skiller: number[]
          ekipman: Json
          ap_girdileri: Json
          sablon: boolean
          olusturan: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          character_id?: string | null
          ad?: string
          sinif: Database["public"]["Enums"]["sinif"]
          irk_turu?: string | null
          level: number
          reb?: number
          statlar?: Json
          skiller?: number[]
          ekipman?: Json
          ap_girdileri?: Json
          sablon?: boolean
          olusturan?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          character_id?: string | null
          ad?: string
          sinif?: Database["public"]["Enums"]["sinif"]
          irk_turu?: string | null
          level?: number
          reb?: number
          statlar?: Json
          skiller?: number[]
          ekipman?: Json
          ap_girdileri?: Json
          sablon?: boolean
          olusturan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "builds_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builds_irk_turu_fkey"
            columns: ["irk_turu"]
            isOneToOne: false
            referencedRelation: "race_stats"
            referencedColumns: ["irk_turu"]
          },
          {
            foreignKeyName: "builds_olusturan_fkey"
            columns: ["olusturan"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      character_changes: {
        Row: {
          id: number
          character_id: string
          alan: string
          eski: string | null
          yeni: string | null
          degistiren: string | null
          created_at: string
        }
        Insert: {
          character_id: string
          alan: string
          eski?: string | null
          yeni?: string | null
          degistiren?: string | null
          created_at?: string
        }
        Update: {
          character_id?: string
          alan?: string
          eski?: string | null
          yeni?: string | null
          degistiren?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_changes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_changes_degistiren_fkey"
            columns: ["degistiren"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          id: string
          profile_id: string | null
          ad: string
          sinif: Database["public"]["Enums"]["sinif"] | null
          irk_turu: string | null
          level: number | null
          reb: number
          rutbe: Database["public"]["Enums"]["rutbe"]
          durum: Database["public"]["Enums"]["karakter_durum"]
          ana_karakter: boolean
          ekipman_gorunur: Database["public"]["Enums"]["gorunurluk"]
          notlar: string | null
          katilma_tarihi: string
          guncellendi_at: string
          guncelleyen: string | null
        }
        Insert: {
          id?: string
          profile_id?: string | null
          ad: string
          sinif?: Database["public"]["Enums"]["sinif"] | null
          irk_turu?: string | null
          level?: number | null
          reb?: number
          rutbe?: Database["public"]["Enums"]["rutbe"]
          durum?: Database["public"]["Enums"]["karakter_durum"]
          ana_karakter?: boolean
          ekipman_gorunur?: Database["public"]["Enums"]["gorunurluk"]
          notlar?: string | null
          katilma_tarihi?: string
          guncellendi_at?: string
          guncelleyen?: string | null
        }
        Update: {
          id?: string
          profile_id?: string | null
          ad?: string
          sinif?: Database["public"]["Enums"]["sinif"] | null
          irk_turu?: string | null
          level?: number | null
          reb?: number
          rutbe?: Database["public"]["Enums"]["rutbe"]
          durum?: Database["public"]["Enums"]["karakter_durum"]
          ana_karakter?: boolean
          ekipman_gorunur?: Database["public"]["Enums"]["gorunurluk"]
          notlar?: string | null
          katilma_tarihi?: string
          guncellendi_at?: string
          guncelleyen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_guncelleyen_fkey"
            columns: ["guncelleyen"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_irk_turu_fkey"
            columns: ["irk_turu"]
            isOneToOne: false
            referencedRelation: "race_stats"
            referencedColumns: ["irk_turu"]
          },
          {
            foreignKeyName: "characters_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_settings: {
        Row: {
          id: boolean
          klan_adi: string
          yedek_ad: string | null
          monogram: string
          irk: Database["public"]["Enums"]["taraf"]
          sunucu_adi: string | null
          ts_adres: string
          acilis_at: string
          level_siniri: number
          reb_siniri: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          klan_adi: string
          yedek_ad?: string | null
          monogram: string
          irk?: Database["public"]["Enums"]["taraf"]
          sunucu_adi?: string | null
          ts_adres: string
          acilis_at: string
          level_siniri?: number
          reb_siniri?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          klan_adi?: string
          yedek_ad?: string | null
          monogram?: string
          irk?: Database["public"]["Enums"]["taraf"]
          sunucu_adi?: string | null
          ts_adres?: string
          acilis_at?: string
          level_siniri?: number
          reb_siniri?: number
          updated_at?: string
        }
        Relationships: []
      }
      class_trees: {
        Row: {
          sinif: Database["public"]["Enums"]["sinif"]
          sira: number
          ad: string
        }
        Insert: {
          sinif: Database["public"]["Enums"]["sinif"]
          sira: number
          ad: string
        }
        Update: {
          sinif?: Database["public"]["Enums"]["sinif"]
          sira?: number
          ad?: string
        }
        Relationships: []
      }
      event_types: {
        Row: {
          kod: string
          ad: string
          kisa_ad: string
          yoklama_var: boolean
        }
        Insert: {
          kod: string
          ad: string
          kisa_ad: string
          yoklama_var?: boolean
        }
        Update: {
          kod?: string
          ad?: string
          kisa_ad?: string
          yoklama_var?: boolean
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          tur: string
          baslik: string
          baslangic: string
          bitis: string | null
          aciklama: string | null
          schedule_id: string | null
          olusturan: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tur: string
          baslik: string
          baslangic: string
          bitis?: string | null
          aciklama?: string | null
          schedule_id?: string | null
          olusturan?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tur?: string
          baslik?: string
          baslangic?: string
          bitis?: string | null
          aciklama?: string | null
          schedule_id?: string | null
          olusturan?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_olusturan_fkey"
            columns: ["olusturan"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "recurring_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tur_fkey"
            columns: ["tur"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["kod"]
          },
        ]
      }
      game_rules: {
        Row: {
          anahtar: string
          deger: Json
          dogrulandi: boolean
          kaynak: string | null
        }
        Insert: {
          anahtar: string
          deger: Json
          dogrulandi?: boolean
          kaynak?: string | null
        }
        Update: {
          anahtar?: string
          deger?: Json
          dogrulandi?: boolean
          kaynak?: string | null
        }
        Relationships: []
      }
      hazirlik: {
        Row: {
          profile_id: string
          otp: boolean
          on_kayit: boolean
          sunucu_secimi: boolean
          karakter_adi: boolean
          klana_katildi: boolean
          updated_at: string
        }
        Insert: {
          profile_id: string
          otp?: boolean
          on_kayit?: boolean
          sunucu_secimi?: boolean
          karakter_adi?: boolean
          klana_katildi?: boolean
          updated_at?: string
        }
        Update: {
          profile_id?: string
          otp?: boolean
          on_kayit?: boolean
          sunucu_secimi?: boolean
          karakter_adi?: boolean
          klana_katildi?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hazirlik_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          id: string
          kod_hash: string
          son_dort: string
          rutbe: Database["public"]["Enums"]["rutbe"]
          max_kullanim: number
          kullanim: number
          bitis: string
          aktif: boolean
          aciklama: string | null
          olusturan: string | null
          created_at: string
        }
        Insert: {
          id?: string
          kod_hash: string
          son_dort: string
          rutbe?: Database["public"]["Enums"]["rutbe"]
          max_kullanim?: number
          kullanim?: number
          bitis: string
          aktif?: boolean
          aciklama?: string | null
          olusturan?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          kod_hash?: string
          son_dort?: string
          rutbe?: Database["public"]["Enums"]["rutbe"]
          max_kullanim?: number
          kullanim?: number
          bitis?: string
          aktif?: boolean
          aciklama?: string | null
          olusturan?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_olusturan_fkey"
            columns: ["olusturan"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_redemptions: {
        Row: {
          id: string
          code_id: string
          profile_id: string
          created_at: string
        }
        Insert: {
          id?: string
          code_id: string
          profile_id: string
          created_at?: string
        }
        Update: {
          id?: string
          code_id?: string
          profile_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_redemptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_set_bonuses: {
        Row: {
          tablo: string
          maske: number
          bonus: Json
        }
        Insert: {
          tablo: string
          maske: number
          bonus: Json
        }
        Update: {
          tablo?: string
          maske?: number
          bonus?: Json
        }
        Relationships: []
      }
      item_sets: {
        Row: {
          anahtar: string
          ad: string
          aile: string | null
          parcalar: number[]
          bonus_tablosu: Json | null
        }
        Insert: {
          anahtar: string
          ad: string
          aile?: string | null
          parcalar: number[]
          bonus_tablosu?: Json | null
        }
        Update: {
          anahtar?: string
          ad?: string
          aile?: string | null
          parcalar?: number[]
          bonus_tablosu?: Json | null
        }
        Relationships: []
      }
      item_stats: {
        Row: {
          item_id: number
          arti: number
          degerler: Json
        }
        Insert: {
          item_id: number
          arti: number
          degerler: Json
        }
        Update: {
          item_id?: number
          arti?: number
          degerler?: Json
        }
        Relationships: [
          {
            foreignKeyName: "item_stats_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          id: number
          ad: string
          kategori: string
          yuvalar: string[]
          siniflar: Database["public"]["Enums"]["sinif"][]
          derece: Database["public"]["Enums"]["esya_derecesi"]
          set_anahtari: string | null
          set_parcasi: Json | null
          etki: string | null
          gorsel: string | null
          kaynak: string
          updated_at: string
        }
        Insert: {
          id: number
          ad: string
          kategori: string
          yuvalar: string[]
          siniflar?: Database["public"]["Enums"]["sinif"][]
          derece?: Database["public"]["Enums"]["esya_derecesi"]
          set_anahtari?: string | null
          set_parcasi?: Json | null
          etki?: string | null
          gorsel?: string | null
          kaynak?: string
          updated_at?: string
        }
        Update: {
          id?: number
          ad?: string
          kategori?: string
          yuvalar?: string[]
          siniflar?: Database["public"]["Enums"]["sinif"][]
          derece?: Database["public"]["Enums"]["esya_derecesi"]
          set_anahtari?: string | null
          set_parcasi?: Json | null
          etki?: string | null
          gorsel?: string | null
          kaynak?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_set_anahtari_fkey"
            columns: ["set_anahtari"]
            isOneToOne: false
            referencedRelation: "item_sets"
            referencedColumns: ["anahtar"]
          },
        ]
      }
      milestones: {
        Row: {
          id: number
          sira: number
          baslik: string
          baslangic: string
          bitis: string | null
          saat_belli: boolean
          aciklama: string | null
          kaynak_url: string | null
        }
        Insert: {
          sira: number
          baslik: string
          baslangic: string
          bitis?: string | null
          saat_belli?: boolean
          aciklama?: string | null
          kaynak_url?: string | null
        }
        Update: {
          sira?: number
          baslik?: string
          baslangic?: string
          bitis?: string | null
          saat_belli?: boolean
          aciklama?: string | null
          kaynak_url?: string | null
        }
        Relationships: []
      }
      password_resets: {
        Row: {
          id: string
          profile_id: string
          kod_hash: string
          bitis: string
          kullanildi_at: string | null
          olusturan: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          kod_hash: string
          bitis: string
          kullanildi_at?: string | null
          olusturan?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          kod_hash?: string
          bitis?: string
          kullanildi_at?: string | null
          olusturan?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_resets_olusturan_fkey"
            columns: ["olusturan"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_resets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          ts_nick: string | null
          yetki: Database["public"]["Enums"]["yetki"]
          son_giris: string | null
          created_at: string
        }
        Insert: {
          id: string
          ts_nick?: string | null
          yetki?: Database["public"]["Enums"]["yetki"]
          son_giris?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ts_nick?: string | null
          yetki?: Database["public"]["Enums"]["yetki"]
          son_giris?: string | null
          created_at?: string
        }
        Relationships: []
      }
      race_stats: {
        Row: {
          irk_turu: string
          ad: string
          taraf: Database["public"]["Enums"]["taraf"]
          siniflar: Database["public"]["Enums"]["sinif"][]
          str: number
          hp: number
          dex: number
          int: number
          mp: number
          dogrulandi: boolean
        }
        Insert: {
          irk_turu: string
          ad: string
          taraf: Database["public"]["Enums"]["taraf"]
          siniflar: Database["public"]["Enums"]["sinif"][]
          str: number
          hp: number
          dex: number
          int: number
          mp: number
          dogrulandi?: boolean
        }
        Update: {
          irk_turu?: string
          ad?: string
          taraf?: Database["public"]["Enums"]["taraf"]
          siniflar?: Database["public"]["Enums"]["sinif"][]
          str?: number
          hp?: number
          dex?: number
          int?: number
          mp?: number
          dogrulandi?: boolean
        }
        Relationships: []
      }
      recurring_schedules: {
        Row: {
          id: string
          tur: string
          baslik: string
          gun: number
          saat: string
          sure_dk: number
          aktif: boolean
        }
        Insert: {
          id?: string
          tur: string
          baslik: string
          gun: number
          saat: string
          sure_dk?: number
          aktif?: boolean
        }
        Update: {
          id?: string
          tur?: string
          baslik?: string
          gun?: number
          saat?: string
          sure_dk?: number
          aktif?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "recurring_schedules_tur_fkey"
            columns: ["tur"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["kod"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      davet_dogrula: {
        Args: {
          p_kod: string
        }
        Returns: boolean
      }
      davet_olustur: {
        Args: {
          p_rutbe?: Database["public"]["Enums"]["rutbe"]
          p_gun?: number
          p_max?: number
          p_aciklama?: string
        }
        Returns: string
      }
      deneme_asildi: {
        Args: {
          p_anahtar: string
          p_sinir?: number
          p_pencere?: string
        }
        Returns: boolean
      }
      deneme_kaydet: {
        Args: {
          p_anahtar: string
        }
        Returns: undefined
      }
      deneme_temizle: {
        Args: {
          p_anahtar: string
        }
        Returns: undefined
      }
      giris_eposta: {
        Args: {
          p_nick: string
        }
        Returns: string
      }
      karakterim: {
        Args: {
          p_character_id: string
        }
        Returns: boolean
      }
      kayit_olustur: {
        Args: {
          p_kod: string
          p_user_id: string
          p_nick: string
        }
        Returns: Database["public"]["Enums"]["rutbe"]
      }
      profil_guncelle: {
        Args: {
          p_sinif?: Database["public"]["Enums"]["sinif"]
          p_level?: number
          p_reb?: number
          p_ekipman_gorunur?: Database["public"]["Enums"]["gorunurluk"]
        }
        Returns: Database["public"]["Tables"]["characters"]["Row"]
      }
      sifirlama_kodu_kullan: {
        Args: {
          p_nick: string
          p_kod: string
        }
        Returns: string
      }
      sifirlama_kodu_olustur: {
        Args: {
          p_character_id: string
        }
        Returns: string
      }
      yetki_var: {
        Args: {
          en_az: Database["public"]["Enums"]["yetki"]
        }
        Returns: boolean
      }
      yetki_ver: {
        Args: {
          p_profile_id: string
          p_yetki: Database["public"]["Enums"]["yetki"]
        }
        Returns: undefined
      }
    }
    Enums: {
      esya_derecesi: "normal" | "set" | "unique" | "rare" | "draki" | "cospre"
      gorunurluk: "klan" | "gizli"
      karakter_durum: "aktif" | "izinli" | "pasif" | "ayrildi"
      rutbe: "lider" | "asistan" | "subay" | "uye" | "aday"
      sinif: "warrior" | "rogue" | "mage" | "priest" | "kurian"
      taraf: "karus" | "el_morad"
      yetki: "uye" | "yetkili" | "yonetici"
      yoklama: "katildi" | "gec" | "mazeretli" | "yok"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]
