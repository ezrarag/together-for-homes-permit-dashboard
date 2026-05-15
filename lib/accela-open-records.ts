const ACCELA_BASE = "https://apis.accela.com/v4";
const DEFAULT_AGENCY = "MILWAUKEE";
const DEFAULT_ENVIRONMENT = "PROD";

type AccelaValue<T = string> = T | { value?: T; text?: string; type?: string };

interface AccelaRecord {
  id?: AccelaValue;
  customId?: AccelaValue;
  status?: AccelaValue;
  openedDate?: AccelaValue;
  type?: AccelaValue | {
    group?: string;
    type?: string;
    subType?: string;
    category?: string;
    text?: string;
  };
  serviceProviderCode?: AccelaValue;
  [key: string]: unknown;
}

interface AccelaApiResponse {
  status?: number;
  code?: string;
  message?: string;
  result?: AccelaRecord[];
}

export interface AccelaRecordSample {
  id?: string;
  customId?: string;
  status?: string;
  openedDate?: string;
  type?: string;
  serviceProviderCode?: string;
}

export interface AccelaSourceAudit {
  source: "Accela Civic Platform";
  checkedAt: string;
  agency: string;
  environment: string;
  configured: {
    appId: boolean;
    appSecret: boolean;
    accessToken: boolean;
    agency: boolean;
    environment: boolean;
  };
  request: {
    endpoint: string;
    module: "Building";
    openedDateFrom: string;
    openedDateTo: string;
  };
  sourceAvailable: boolean;
  authRequired: boolean;
  httpStatus?: number;
  accelaCode?: string;
  message?: string;
  sampleRecords: AccelaRecordSample[];
  statusCounts: Array<{ status: string; count: number }>;
  fieldCoverage: {
    status: boolean;
    openedDate: boolean;
    type: boolean;
    serviceProviderCode: boolean;
  };
  limitations: string[];
}

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function readAccelaValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value !== "object") return undefined;

  const obj = value as Record<string, unknown>;
  if (typeof obj.text === "string") return obj.text;
  if (typeof obj.value === "string" || typeof obj.value === "number") return String(obj.value);
  if (typeof obj.type === "string") return obj.type;

  const typeParts = [obj.group, obj.type, obj.subType, obj.category]
    .filter((part): part is string => typeof part === "string" && part.length > 0);
  return typeParts.length > 0 ? typeParts.join(" / ") : undefined;
}

function summarizeRecords(records: AccelaRecord[]): {
  sampleRecords: AccelaRecordSample[];
  statusCounts: Array<{ status: string; count: number }>;
  fieldCoverage: AccelaSourceAudit["fieldCoverage"];
} {
  const sampleRecords = records.slice(0, 5).map((record) => ({
    id: readAccelaValue(record.id),
    customId: readAccelaValue(record.customId),
    status: readAccelaValue(record.status),
    openedDate: readAccelaValue(record.openedDate),
    type: readAccelaValue(record.type),
    serviceProviderCode: readAccelaValue(record.serviceProviderCode),
  }));

  const statusMap = new Map<string, number>();
  for (const record of records) {
    const status = readAccelaValue(record.status) ?? "Unknown";
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
  }

  return {
    sampleRecords,
    statusCounts: Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
    fieldCoverage: {
      status: sampleRecords.some((record) => Boolean(record.status)),
      openedDate: sampleRecords.some((record) => Boolean(record.openedDate)),
      type: sampleRecords.some((record) => Boolean(record.type)),
      serviceProviderCode: sampleRecords.some((record) => Boolean(record.serviceProviderCode)),
    },
  };
}

export async function auditAccelaRecordsSource(): Promise<AccelaSourceAudit> {
  const checkedAt = new Date().toISOString();
  const agency = env("ACCELA_AGENCY") ?? DEFAULT_AGENCY;
  const environment = env("ACCELA_ENVIRONMENT") ?? DEFAULT_ENVIRONMENT;
  const appId = env("ACCELA_APP_ID");
  const appSecret = env("ACCELA_APP_SECRET");
  const accessToken = env("ACCELA_ACCESS_TOKEN");

  const openedDateTo = dateOnly(new Date());
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 90);
  const openedDateFrom = dateOnly(fromDate);

  const endpoint = `${ACCELA_BASE}/records`;
  const requestUrl = new URL(endpoint);
  requestUrl.searchParams.set("module", "Building");
  requestUrl.searchParams.set("limit", "25");
  requestUrl.searchParams.set("openedDateFrom", openedDateFrom);
  requestUrl.searchParams.set("openedDateTo", openedDateTo);
  requestUrl.searchParams.set(
    "fields",
    "id,customId,status,openedDate,type,serviceProviderCode",
  );

  const baseAudit: Omit<
    AccelaSourceAudit,
    "sourceAvailable" | "authRequired" | "sampleRecords" | "statusCounts" | "fieldCoverage" | "limitations"
  > = {
    source: "Accela Civic Platform",
    checkedAt,
    agency,
    environment,
    configured: {
      appId: Boolean(appId),
      appSecret: Boolean(appSecret),
      accessToken: Boolean(accessToken),
      agency: Boolean(env("ACCELA_AGENCY")),
      environment: Boolean(env("ACCELA_ENVIRONMENT")),
    },
    request: {
      endpoint,
      module: "Building",
      openedDateFrom,
      openedDateTo,
    },
  };

  if (!appId) {
    return {
      ...baseAudit,
      sourceAvailable: false,
      authRequired: true,
      sampleRecords: [],
      statusCounts: [],
      fieldCoverage: {
        status: false,
        openedDate: false,
        type: false,
        serviceProviderCode: false,
      },
      limitations: [
        "ACCELA_APP_ID is not configured. Accela requires an app id for anonymous API calls.",
      ],
    };
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-accela-appid": appId,
    "x-accela-agency": agency,
    "x-accela-environment": environment,
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    const response = await fetch(requestUrl, {
      headers,
      cache: "no-store",
    });
    const bodyText = await response.text();
    const parsed = bodyText ? (JSON.parse(bodyText) as AccelaApiResponse) : {};

    if (!response.ok) {
      const accelaCode = parsed.code;
      const authRequired =
        response.status === 401 ||
        accelaCode === "anonymous_user_unavailable" ||
        accelaCode === "unauthorized";

      return {
        ...baseAudit,
        sourceAvailable: false,
        authRequired,
        httpStatus: response.status,
        accelaCode,
        message: parsed.message ?? response.statusText,
        sampleRecords: [],
        statusCounts: [],
        fieldCoverage: {
          status: false,
          openedDate: false,
          type: false,
          serviceProviderCode: false,
        },
        limitations: [
          authRequired
            ? "Accela rejected the anonymous request. Milwaukee may need to enable anonymous API access for this app or provide an OAuth access token."
            : "Accela returned an error for the Building records request.",
          "The dashboard is still using CKAN until this source returns live records.",
        ],
      };
    }

    const records = Array.isArray(parsed.result) ? parsed.result : [];
    const summary = summarizeRecords(records);

    return {
      ...baseAudit,
      sourceAvailable: records.length > 0,
      authRequired: false,
      httpStatus: response.status,
      sampleRecords: summary.sampleRecords,
      statusCounts: summary.statusCounts,
      fieldCoverage: summary.fieldCoverage,
      limitations:
        records.length > 0
          ? ["Sample-only audit. Full status counts require pagination and production source validation."]
          : ["Accela request succeeded but returned no Building records for the last 90 days."],
    };
  } catch (error) {
    return {
      ...baseAudit,
      sourceAvailable: false,
      authRequired: false,
      message: error instanceof Error ? error.message : "Unknown Accela request error",
      sampleRecords: [],
      statusCounts: [],
      fieldCoverage: {
        status: false,
        openedDate: false,
        type: false,
        serviceProviderCode: false,
      },
      limitations: [
        "Accela source audit failed before records could be inspected.",
        "The dashboard is still using CKAN until this source returns live records.",
      ],
    };
  }
}
