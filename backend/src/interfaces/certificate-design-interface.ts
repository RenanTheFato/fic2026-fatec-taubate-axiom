import { CertificateScope } from "../models/certificate-design-model.js";
import type { CertificateDesignSpec } from "../utils/certificate-design.js";

export interface CertificateDesignInterface{
  id: string,
  scope: CertificateScope,
  campaign_id: string | null,
  event_id: string | null,
  folder: string,
  version: number,
  label: string,
  design: CertificateDesignSpec,
  created_by: string | null,
  created_at: Date,
  updated_at: Date
}
