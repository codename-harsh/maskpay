export interface UpiAuditResult {
  isValidUpi: boolean;
  rawUri: string;
  vpa: string;
  payeeName: string;
  exposedMobileNumber: string | null;
  isRealNameExposed: boolean;
  privacyRiskScore: number;
  riskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  findings: {
    title: string;
    description: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "SAFE";
  }[];
  maskedPreviewVpa: string;
}

export function auditUpiString(rawInput: string): UpiAuditResult {
  const trimmed = rawInput.trim();
  const isUpiUri = trimmed.toLowerCase().startsWith("upi://pay");

  let vpa = "";
  let payeeName = "";

  if (isUpiUri) {
    try {
      const urlObj = new URL(trimmed);
      vpa = urlObj.searchParams.get("pa") || "";
      payeeName = decodeURIComponent(urlObj.searchParams.get("pn") || "");
    } catch {
      return createInvalidResult(trimmed);
    }
  } else if (/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(trimmed)) {
    vpa = trimmed;
    payeeName = "Direct VPA Input";
  } else {
    return createInvalidResult(trimmed);
  }

  if (!vpa || !vpa.includes("@")) {
    return createInvalidResult(trimmed);
  }

  const parts = vpa.split("@");
  const vpaUser = parts[0];
  const vpaHandle = parts[1];
  const mobileMatch = vpaUser.match(/([6-9]\d{9})/);
  const exposedMobileNumber = mobileMatch ? mobileMatch[1] : null;
  const isRealNameExposed =
    Boolean(payeeName) &&
    payeeName !== "Direct VPA Input" &&
    payeeName.toLowerCase() !== "verified merchant";

  let riskScore = 15;
  const findings: UpiAuditResult["findings"] = [];

  if (exposedMobileNumber) {
    riskScore += 55;
    findings.push({
      title: "Personal Mobile Number Leaked (" + exposedMobileNumber + ")",
      description:
        "Your 10-digit mobile number is directly embedded inside " +
        vpa +
        ". Anyone scanning or screenshotting this QR gets your phone number.",
      severity: "CRITICAL",
    });
  } else {
    findings.push({
      title: "No 10-Digit Mobile Number in VPA Prefix",
      description:
        "The prefix " + vpaUser + " does not contain a 10-digit mobile number.",
      severity: "SAFE",
    });
  }

  if (isRealNameExposed) {
    riskScore += 20;
    findings.push({
      title: "Full Banking Name Exposed (" + payeeName + ")",
      description:
        "The pn= parameter reveals your registered banking identity inside the raw QR payload.",
      severity: "HIGH",
    });
  }

  riskScore += 10;
  findings.push({
    title: "Permanent Static QR Vulnerability (Zero Expiry)",
    description:
      "Standard UPI QR codes never expire. Anyone saving a screenshot today can reuse or forward it months later.",
    severity: "MEDIUM",
  });

  riskScore = Math.min(100, riskScore);

  const riskLevel: UpiAuditResult["riskLevel"] =
    riskScore >= 75
      ? "CRITICAL"
      : riskScore >= 50
      ? "HIGH"
      : riskScore >= 30
      ? "MODERATE"
      : "LOW";

  const maskedPrefix =
    vpaUser.length > 4
      ? vpaUser.slice(0, 2) + "*".repeat(Math.min(6, vpaUser.length - 2))
      : "****";

  return {
    isValidUpi: true,
    rawUri: trimmed,
    vpa,
    payeeName: payeeName || "Not Specified",
    exposedMobileNumber,
    isRealNameExposed,
    privacyRiskScore: riskScore,
    riskLevel,
    findings,
    maskedPreviewVpa: maskedPrefix + "@" + vpaHandle,
  };
}

function createInvalidResult(rawUri: string): UpiAuditResult {
  return {
    isValidUpi: false,
    rawUri,
    vpa: "",
    payeeName: "",
    exposedMobileNumber: null,
    isRealNameExposed: false,
    privacyRiskScore: 0,
    riskLevel: "LOW",
    findings: [],
    maskedPreviewVpa: "",
  };
}

export interface SanitizedUpiParams {
  vpa: string;
  maskedAlias: string;
  amount?: number | null;
  note?: string | null;
  referenceId: string;
}

export function buildSanitizedUpiUri(params: SanitizedUpiParams): string {
  const query = new URLSearchParams();
  query.set("pa", params.vpa.trim());
  query.set("pn", params.maskedAlias.trim() || "MaskPay Verified");
  if (params.amount && params.amount > 0) {
    query.set("am", params.amount.toFixed(2));
  }
  if (params.note && params.note.trim().length > 0) {
    query.set("tn", params.note.trim());
  }
  query.set("tr", params.referenceId);
  query.set("cu", "INR");

  return "upi://pay?" + query.toString();
}

export function buildAppDeepLinks(params: SanitizedUpiParams) {
  const baseUri = buildSanitizedUpiUri(params);
  const queryPart = baseUri.replace("upi://pay?", "");

  return {
    universalUpi: baseUri,
    gpay: "tez://upi/pay?" + queryPart,
    phonepe: "phonepe://pay?" + queryPart,
    paytm: "paytmmp://pay?" + queryPart,
  };
}
