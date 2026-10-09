import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listCertificateAssets, uploadCertificateAsset } from "../services/certificate/certificate-assets-service"
import { createCertificateDesign, listCertificateDesigns } from "../services/certificate/certificate-designs-service"
import { listCertificateFolders, listIssuedCertificates } from "../services/certificate/certificate-folders-service"

export function useCertificateFolders() {
  return useQuery({ queryKey: ["certificates", "folders"], queryFn: listCertificateFolders })
}

export function useCertificateDesigns(folder: string | null) {
  return useQuery({
    queryKey: ["certificates", "designs", folder],
    queryFn: () => listCertificateDesigns(folder as string),
    enabled: Boolean(folder),
  })
}

export function useCertificateAssets() {
  return useQuery({ queryKey: ["certificates", "assets"], queryFn: listCertificateAssets })
}

// A lista de emitidos traz nome de doador e responde a admin e financeiro: a
// tela só pergunta quando o papel alcança, para não transformar um 403 em
// "não carregou".
export function useIssuedCertificates(folder: string | null, page: number, enabled: boolean) {
  return useQuery({
    queryKey: ["certificates", "issued", folder, page],
    queryFn: () => listIssuedCertificates(folder as string, page),
    enabled: enabled && Boolean(folder),
  })
}

// Salvar uma versão muda a pasta, a contagem de versões e a versão atual que o
// estúdio mostra: tudo que começa com "certificates" cai junto.
export function useSaveCertificateDesign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCertificateDesign,
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["certificates"] })
    },
  })
}

export function useUploadCertificateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadCertificateAsset,
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["certificates", "assets"] })
    },
  })
}
