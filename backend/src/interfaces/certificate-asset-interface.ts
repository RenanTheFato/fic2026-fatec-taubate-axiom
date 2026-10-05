import { CertificateAssetType } from "../models/certificate-asset-model.js";

export interface CertificateAssetInterface{
  id: string,
  name: string,
  mime_type: CertificateAssetType,
  width: number,
  height: number,
  size: number,
  data: Buffer,
  uploaded_by: string | null,
  created_at: Date,
  updated_at: Date
}
