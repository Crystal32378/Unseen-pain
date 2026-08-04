"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  MapPin,
  Phone,
  Navigation,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { MOCK_FACILITIES } from "@/lib/mockData";
import {
  Facility,
  SearchFilters,
  Specialty,
  FacilityType,
  VerificationStatus,
  VERIFICATION_STATUS_LABELS,
  FACILITY_TYPE_LABELS,
  CITIES,
} from "@/lib/types";

export function SearchSection() {
  const [filters, setFilters] = useState<SearchFilters>({
    specialty: "both",
    city: "",
    district: "",
    facilityType: "any",
    useLocation: false,
  });
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "denied">("idle");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLocationRequest = useCallback(() => {
    if (!navigator.geolocation) {
      alert("你的瀏覽器不支援定位功能，請改用手動選擇縣市。");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFilters((prev) => ({
          ...prev,
          useLocation: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocationStatus("success");
      },
      (error) => {
        setLocationStatus("denied");
        setFilters((prev) => ({ ...prev, useLocation: false }));
      },
      { timeout: 10000 }
    );
  }, []);

  const results = useMemo(() => {
    let filtered = MOCK_FACILITIES.filter((f) => f.active_status === "active");

    // Specialty filter
    if (filters.specialty === "neurology") {
      filtered = filtered.filter((f) => f.specialty_neurology);
    } else if (filters.specialty === "rehabilitation") {
      filtered = filtered.filter((f) => f.specialty_rehabilitation);
    } else {
      filtered = filtered.filter(
        (f) => f.specialty_neurology || f.specialty_rehabilitation
      );
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter((f) => f.city === filters.city);
    }

    // District filter
    if (filters.district) {
      filtered = filtered.filter((f) => f.district === filters.district);
    }

    // Facility type filter
    if (filters.facilityType !== "any") {
      filtered = filtered.filter((f) => f.facility_type === filters.facilityType);
    }

    // Advanced filters (only verified)
    if (filters.has_emg) {
      filtered = filtered.filter(
        (f) =>
          f.has_emg === "official_website" ||
          f.has_emg === "phone_confirmed" ||
          f.has_emg === "written_confirmed"
      );
    }
    if (filters.has_nerve_conduction_study) {
      filtered = filtered.filter(
        (f) =>
          f.has_nerve_conduction_study === "official_website" ||
          f.has_nerve_conduction_study === "phone_confirmed" ||
          f.has_nerve_conduction_study === "written_confirmed"
      );
    }
    if (filters.has_physical_therapy) {
      filtered = filtered.filter(
        (f) =>
          f.has_physical_therapy === "official_website" ||
          f.has_physical_therapy === "phone_confirmed" ||
          f.has_physical_therapy === "written_confirmed"
      );
    }
    if (filters.has_electrotherapy) {
      filtered = filtered.filter(
        (f) =>
          f.has_electrotherapy === "official_website" ||
          f.has_electrotherapy === "phone_confirmed" ||
          f.has_electrotherapy === "written_confirmed"
      );
    }
    if (filters.appointment_required) {
      filtered = filtered.filter(
        (f) =>
          f.appointment_required === "official_website" ||
          f.appointment_required === "phone_confirmed" ||
          f.appointment_required === "written_confirmed"
      );
    }

    return filtered;
  }, [filters]);

  const handleSearch = useCallback(() => {
    setHasSearched(true);
  }, []);

  const availableDistricts = useMemo(() => {
    if (!filters.city) return [];
    const districts = new Set(
      MOCK_FACILITIES
        .filter((f) => f.city === filters.city && f.active_status === "active")
        .map((f) => f.district)
    );
    return Array.from(districts).sort();
  }, [filters.city]);

  return (
    <div className="space-y-6">
      <header className="space-y-4 pt-8">
        <p className="text-sm font-medium text-muted-foreground">院所搜尋</p>
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          找附近的神經科與復健科院所
        </h1>
        <p className="text-base leading-relaxed text-foreground/80">
          資料來自衛福部健保署公開資料，篩選出有神經內科或復健科的健保特約院所。你可以依縣市、行政區或目前位置搜尋。
        </p>
      </header>

      {/* Search form */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        {/* Specialty */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">科別</label>
          <div className="flex flex-wrap gap-2">
            {([
              { value: "neurology", label: "神經內科／神經科" },
              { value: "rehabilitation", label: "復健科" },
              { value: "both", label: "兩者皆可" },
            ] as { value: Specialty; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilters((prev) => ({ ...prev, specialty: opt.value }))}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  filters.specialty === opt.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground/70 hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">縣市</label>
            <select
              value={filters.city}
              onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value, district: "" }))}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">不限縣市</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">行政區</label>
            <select
              value={filters.district}
              onChange={(e) => setFilters((prev) => ({ ...prev, district: e.target.value }))}
              disabled={!filters.city}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              <option value="">不限行政區</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Use current location */}
        <div>
          <button
            onClick={handleLocationRequest}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {locationStatus === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {locationStatus === "success"
              ? "已取得位置"
              : locationStatus === "denied"
              ? "定位被拒絕，請改用手動選擇"
              : "使用目前位置"}
          </button>
          {locationStatus === "denied" && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              沒關係，你仍然可以用上面的縣市與行政區搜尋。
            </p>
          )}
        </div>

        {/* Facility type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">院所類型</label>
          <div className="flex flex-wrap gap-2">
            {([
              { value: "any", label: "不限" },
              { value: "medical_center", label: "醫學中心" },
              { value: "regional_hospital", label: "區域醫院" },
              { value: "district_hospital", label: "地區醫院" },
              { value: "clinic", label: "診所" },
            ] as { value: FacilityType; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilters((prev) => ({ ...prev, facilityType: opt.value }))}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  filters.facilityType === opt.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground/70 hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          進階條件（只顯示已查證的院所）
        </button>

        {showAdvanced && (
          <div className="space-y-3 rounded-lg bg-accent/30 p-4">
            <p className="text-xs text-muted-foreground">
              以下條件只會篩選出「已查證」的院所。未確認不代表沒有該服務，只是目前沒有可靠資訊。
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <AdvancedCheckbox
                label="有公開標示肌電圖"
                checked={!!filters.has_emg}
                onChange={(v) => setFilters((prev) => ({ ...prev, has_emg: v }))}
              />
              <AdvancedCheckbox
                label="有公開標示神經傳導檢查"
                checked={!!filters.has_nerve_conduction_study}
                onChange={(v) => setFilters((prev) => ({ ...prev, has_nerve_conduction_study: v }))}
              />
              <AdvancedCheckbox
                label="有物理治療"
                checked={!!filters.has_physical_therapy}
                onChange={(v) => setFilters((prev) => ({ ...prev, has_physical_therapy: v }))}
              />
              <AdvancedCheckbox
                label="有電療"
                checked={!!filters.has_electrotherapy}
                onChange={(v) => setFilters((prev) => ({ ...prev, has_electrotherapy: v }))}
              />
              <AdvancedCheckbox
                label="是否需預約"
                checked={!!filters.appointment_required}
                onChange={(v) => setFilters((prev) => ({ ...prev, appointment_required: v }))}
              />
            </div>
          </div>
        )}

        {/* Search button */}
        <button
          onClick={handleSearch}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Search className="h-5 w-5" />
          搜尋院所
        </button>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              找到 <span className="font-bold text-foreground">{results.length}</span> 間院所
            </p>
            <p className="text-xs text-muted-foreground">
              預設依院所類型與名稱排序
            </p>
          </div>

          {results.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-foreground">查無結果</p>
              <p className="mt-1 text-sm text-muted-foreground">
                試著放寬搜尋條件，或改用「兩者皆可」的科別選項。
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((facility) => (
                <FacilityCard
                  key={facility.facility_id}
                  facility={facility}
                  expanded={expandedId === facility.facility_id}
                  onToggle={() =>
                    setExpandedId(expandedId === facility.facility_id ? null : facility.facility_id)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Google attribution */}
      <div className="flex items-start gap-2 rounded-lg bg-warm p-4 text-xs text-warm-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          部分地圖、網站與營業資訊由 Google Maps 提供。實際科別、門診、檢查與復健服務，請於前往前向院所確認。
        </p>
      </div>
    </div>
  );
}

interface FacilityCardProps {
  facility: Facility;
  expanded: boolean;
  onToggle: () => void;
}

function FacilityCard({ facility, expanded, onToggle }: FacilityCardProps) {
  const specialties: string[] = [];
  if (facility.specialty_neurology) specialties.push("神經內科");
  if (facility.specialty_rehabilitation) specialties.push("復健科");

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-bold text-foreground">{facility.facility_name}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {specialties.map((s) => (
              <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {s}
              </span>
            ))}
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">
              {FACILITY_TYPE_LABELS[facility.facility_type]}
            </span>
            <span className="text-xs text-muted-foreground">
              {facility.city} {facility.district}
            </span>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
          aria-label={expanded ? "收起詳細資料" : "展開詳細資料"}
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Quick info */}
      <div className="mt-3 space-y-1.5 text-sm text-foreground/80">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{facility.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{facility.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>官方資料更新：{facility.official_source_updated_at}</span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          {/* Service verification status */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-foreground">服務查證狀態</h4>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <ServiceStatusItem label="肌電圖" status={facility.has_emg} />
              <ServiceStatusItem label="神經傳導檢查" status={facility.has_nerve_conduction_study} />
              <ServiceStatusItem label="物理治療" status={facility.has_physical_therapy} />
              <ServiceStatusItem label="電療" status={facility.has_electrotherapy} />
              <ServiceStatusItem label="需預約" status={facility.appointment_required} />
            </div>
            <p className="text-xs text-muted-foreground">
              「未確認」代表目前沒有可靠資訊，不代表沒有該服務。請直接向院所確認。
            </p>
          </div>

          {/* Official schedule */}
          {facility.official_schedule_raw && (
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">官方看診時段</h4>
              <p className="text-sm text-foreground/80">{facility.official_schedule_raw}</p>
              <p className="text-xs text-muted-foreground">實際時段請以院所公告為準。</p>
            </div>
          )}

          {/* Match status */}
          {facility.match_status && facility.match_status !== "matched" && (
            <div className="flex items-start gap-2 rounded-lg bg-warm p-3 text-xs text-warm-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Google 地點匹配不確定（信心度：{facility.match_confidence}）。
                地圖資訊可能不準確，建議直接使用上方地址搜尋。
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <a
          href={`tel:${facility.phone.replace(/-/g, "")}`}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Phone className="h-4 w-4" />
          撥打
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            facility.facility_name + " " + facility.address
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <ExternalLink className="h-4 w-4" />
          Maps
        </a>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            facility.address
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Navigation className="h-4 w-4" />
          導航
        </a>
      </div>
    </div>
  );
}

interface ServiceStatusItemProps {
  label: string;
  status?: VerificationStatus;
}

function ServiceStatusItem({ label, status }: ServiceStatusItemProps) {
  if (!status || status === "unverified") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs">
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">{label}：未確認</span>
      </div>
    );
  }
  if (status === "invalidated") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-alert/30 px-3 py-1.5 text-xs">
        <XCircle className="h-3.5 w-3.5 text-alert-foreground" />
        <span className="text-alert-foreground">{label}：已失效</span>
      </div>
    );
  }
  const labelInfo = VERIFICATION_STATUS_LABELS[status];
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${labelInfo.color}`}>
      <CheckCircle2 className="h-3.5 w-3.5" />
      <span>{label}：{labelInfo.label}</span>
    </div>
  );
}

interface AdvancedCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function AdvancedCheckbox({ label, checked, onChange }: AdvancedCheckboxProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${
        checked
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:bg-accent"
      }`}
    >
      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
        checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
      }`}>
        {checked && <CheckCircle2 className="h-2.5 w-2.5" />}
      </div>
      <span className="text-foreground/80">{label}</span>
    </button>
  );
}
