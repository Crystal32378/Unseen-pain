"use client";

import { useCallback, useState } from "react";
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

interface SearchApiResponse {
  ok: boolean;
  results?: Facility[];
  meta?: {
    total: number;
    returned: number;
    limit: number;
    offset: number;
    has_more: boolean;
    last_synced_at?: string;
    source?: string;
  };
  error?: string;
}

interface DistrictsApiResponse {
  ok: boolean;
  districts?: string[];
  error?: string;
}

export function SearchSection() {
  const [filters, setFilters] = useState<SearchFilters>({
    specialty: "both",
    city: "",
    district: "",
    facilityType: "any",
    useLocation: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Facility[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCityChange = useCallback(async (city: string) => {
    setFilters((prev) => ({ ...prev, city, district: "" }));
    setAvailableDistricts([]);

    if (!city) return;

    setIsDistrictLoading(true);
    try {
      const response = await fetch(
        `/api/facilities?action=districts&city=${encodeURIComponent(city)}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as DistrictsApiResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "行政區資料暫時無法讀取。");
      }

      setAvailableDistricts(payload.districts || []);
    } catch (districtError) {
      console.error("District lookup failed", districtError);
      setAvailableDistricts([]);
    } finally {
      setIsDistrictLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    setHasSearched(true);
    setIsLoading(true);
    setError(null);
    setExpandedId(null);

    const params = new URLSearchParams({
      action: "search",
      specialty: filters.specialty,
      limit: "100",
    });

    if (filters.city) params.set("city", filters.city);
    if (filters.district) params.set("district", filters.district);
    if (filters.facilityType !== "any") {
      params.set("facilityType", filters.facilityType);
    }

    try {
      const response = await fetch(`/api/facilities?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as SearchApiResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "院所資料暫時無法讀取。");
      }

      setResults(payload.results || []);
      setTotalResults(payload.meta?.total ?? payload.results?.length ?? 0);
      setHasMore(payload.meta?.has_more ?? false);
    } catch (searchError) {
      console.error("Facility search failed", searchError);
      setResults([]);
      setTotalResults(0);
      setHasMore(false);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "目前無法讀取院所資料，請稍後再試。"
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  return (
    <div className="space-y-6">
      <header className="space-y-4 pt-8">
        <p className="text-sm font-medium text-muted-foreground">院所搜尋</p>
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          找可以先評估的神經科或復健科醫院
        </h1>
        <p className="text-base leading-relaxed text-foreground/80">
          此處優先列出具正式神經科或復健科的健保特約醫院，適合第一次評估症狀與就醫方向。後續復健診所與物理治療資源將另行整理。
        </p>
      </header>

      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
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
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, specialty: opt.value }))
                }
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              縣市
            </label>
            <select
              value={filters.city}
              onChange={(event) => void handleCityChange(event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">不限縣市</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              行政區
            </label>
            <select
              value={filters.district}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  district: event.target.value,
                }))
              }
              disabled={!filters.city || isDistrictLoading}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              <option value="">
                {isDistrictLoading ? "讀取行政區中…" : "不限行政區"}
              </option>
              {availableDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground opacity-70"
          >
            <MapPin className="h-4 w-4" />
            依目前位置排序（即將提供）
          </button>
          <p className="mt-1.5 text-xs text-muted-foreground">
            現在可先用縣市與行政區搜尋；每筆結果仍可直接開啟 Maps 導航。
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            醫院層級
          </label>
          <div className="flex flex-wrap gap-2">
            {([
              { value: "any", label: "不限" },
              { value: "medical_center", label: "醫學中心" },
              { value: "regional_hospital", label: "區域醫院" },
              { value: "district_hospital", label: "地區醫院" },
            ] as { value: FacilityType; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    facilityType: opt.value,
                  }))
                }
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

        <button
          type="button"
          onClick={() => setShowAdvanced((current) => !current)}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          檢查與復健服務資訊
        </button>

        {showAdvanced && (
          <div className="space-y-2 rounded-lg bg-accent/30 p-4">
            <p className="text-sm font-medium text-foreground">
              逐院服務查證仍在整理中
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              肌電圖、神經傳導檢查、物理治療、電療與預約方式，目前尚未完成逐院可靠查證，因此不會拿來篩選或排序。未標示不代表院所沒有該服務，前往前請直接向院所確認。
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          {isLoading ? "正在讀取健保署資料…" : "搜尋醫院"}
        </button>
      </div>

      {hasSearched && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="font-medium text-foreground">正在搜尋院所</p>
              <p className="mt-1 text-sm text-muted-foreground">
                讀取健保署公開資料中，請稍候。
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-alert/50 bg-alert/20 p-8 text-center">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-alert-foreground" />
              <p className="font-medium text-foreground">暫時無法讀取資料</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={() => void handleSearch()}
                className="mt-4 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                再試一次
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  找到{" "}
                  <span className="font-bold text-foreground">
                    {totalResults}
                  </span>{" "}
                  家醫院
                </p>
                <p className="text-right text-xs text-muted-foreground">
                  依醫院層級與名稱排序
                </p>
              </div>

              {results.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium text-foreground">查無結果</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    試著放寬行政區或醫院層級，或改用「兩者皆可」。
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((facility) => (
                    <FacilityCard
                      key={facility.facility_id || facility.nhi_facility_code}
                      facility={facility}
                      expanded={expandedId === facility.nhi_facility_code}
                      onToggle={() =>
                        setExpandedId(
                          expandedId === facility.nhi_facility_code
                            ? null
                            : facility.nhi_facility_code
                        )
                      }
                    />
                  ))}
                </div>
              )}

              {hasMore && (
                <div className="flex items-start gap-2 rounded-lg bg-warm p-4 text-xs text-warm-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    目前顯示前 100 家。請選擇縣市或行政區，取得更精確且完整的結果。
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg bg-warm p-4 text-xs text-warm-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          院所科別、地址與電話來自健保署公開資料。Maps
          僅用於開啟地圖與導航；實際門診、檢查、復健服務與看診時段，請於前往前向院所確認。
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

  const updatedAt =
    facility.official_source_updated_at || facility.last_synced_at || "";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-bold text-foreground">
            {facility.facility_name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {specialties.map((specialty) => (
              <span
                key={specialty}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {specialty}
              </span>
            ))}
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">
              {FACILITY_TYPE_LABELS[facility.facility_type] ||
                facility.accreditation_type ||
                "醫院"}
            </span>
            <span className="text-xs text-muted-foreground">
              {facility.city} {facility.district}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
          aria-label={expanded ? "收起詳細資料" : "展開詳細資料"}
        >
          {expanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-foreground/80">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{facility.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{facility.phone || "請向院所確認"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>
            資料同步：{updatedAt ? formatTaiwanDate(updatedAt) : "本次健保署資料"}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-foreground">服務查證狀態</h4>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <ServiceStatusItem label="肌電圖" status={facility.has_emg} />
              <ServiceStatusItem
                label="神經傳導檢查"
                status={facility.has_nerve_conduction_study}
              />
              <ServiceStatusItem
                label="物理治療"
                status={facility.has_physical_therapy}
              />
              <ServiceStatusItem
                label="電療"
                status={facility.has_electrotherapy}
              />
              <ServiceStatusItem
                label="需預約"
                status={facility.appointment_required}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              「未確認」代表目前沒有可靠資訊，不代表沒有該服務。請直接向院所確認。
            </p>
          </div>

          {facility.official_schedule_raw && (
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">官方看診時段</h4>
              <p className="text-sm text-foreground/80">
                {facility.official_schedule_raw}
              </p>
              <p className="text-xs text-muted-foreground">
                實際時段請以院所公告為準。
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {facility.phone ? (
          <a
            href={`tel:${facility.phone.replace(/[^0-9+]/g, "")}`}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Phone className="h-4 w-4" />
            撥打
          </a>
        ) : (
          <span className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2.5 text-sm font-medium text-muted-foreground">
            <Phone className="h-4 w-4" />
            無電話
          </span>
        )}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${facility.facility_name} ${facility.address}`
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
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${labelInfo.color}`}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      <span>
        {label}：{labelInfo.label}
      </span>
    </div>
  );
}

function formatTaiwanDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
