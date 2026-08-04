// Types for the neuropathic pain navigation site

export type SectionId =
  | "home"
  | "which-dept"
  | "describe-pain"
  | "search"
  | "crystal-story"
  | "emergency"
  | "about";

export type Specialty = "neurology" | "rehabilitation" | "both";

export type FacilityType = "medical_center" | "regional_hospital" | "district_hospital" | "clinic" | "any";

export type VerificationStatus =
  | "unverified"
  | "official_website"
  | "phone_confirmed"
  | "written_confirmed"
  | "user_reported_pending"
  | "invalidated";

export type ActiveStatus = "active" | "inactive";

export interface Facility {
  facility_id: string;
  nhi_facility_code: string;
  facility_name: string;
  facility_type: FacilityType;
  accreditation_type: string;
  specialty_neurology: boolean;
  specialty_rehabilitation: boolean;
  specialty_codes_raw: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  official_service_items: string;
  official_schedule_raw: string;
  contract_start_date: string;
  closed_or_terminated_date: string | null;
  active_status: ActiveStatus;
  official_source: string;
  official_source_updated_at: string;
  imported_at: string;
  last_synced_at: string;
  // Optional verified services
  has_emg?: VerificationStatus;
  has_nerve_conduction_study?: VerificationStatus;
  has_physical_therapy?: VerificationStatus;
  has_electrotherapy?: VerificationStatus;
  appointment_required?: VerificationStatus;
  // Optional Google Place link
  google_place_id?: string;
  match_status?: "matched" | "pending" | "unmatched";
  match_confidence?: "high" | "medium" | "low";
}

export interface SearchFilters {
  specialty: Specialty;
  city: string;
  district: string;
  facilityType: FacilityType;
  useLocation: boolean;
  latitude?: number;
  longitude?: number;
  // Advanced (only verified)
  has_emg?: boolean;
  has_nerve_conduction_study?: boolean;
  has_physical_therapy?: boolean;
  has_electrotherapy?: boolean;
  appointment_required?: boolean;
}

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, { label: string; color: string }> = {
  unverified: { label: "未確認", color: "text-muted-foreground bg-muted" },
  official_website: { label: "官方網站公開標示", color: "text-calm-foreground bg-calm" },
  phone_confirmed: { label: "院所電話確認", color: "text-calm-foreground bg-calm" },
  written_confirmed: { label: "院所人員書面確認", color: "text-calm-foreground bg-calm" },
  user_reported_pending: { label: "使用者回報待確認", color: "text-warm-foreground bg-warm" },
  invalidated: { label: "已失效", color: "text-alert-foreground bg-alert" },
};

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  medical_center: "醫學中心",
  regional_hospital: "區域醫院",
  district_hospital: "地區醫院",
  clinic: "診所",
  any: "不限",
};

export const CITIES = [
  "台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市",
  "基隆市", "新竹市", "嘉義市", "新竹縣", "苗栗縣", "彰化縣",
  "南投縣", "雲林縣", "嘉義縣", "屏東縣", "宜蘭縣", "花蓮縣",
  "台東縣", "澎湖縣", "金門縣", "連江縣",
];
