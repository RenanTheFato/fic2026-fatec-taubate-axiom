import { useQuery } from "@tanstack/react-query"
import { listDocuments } from "../services/institutional/list-documents-service"

export function useDocuments() {
  return useQuery({
    queryKey: ["institutional", "documents"],
    queryFn: listDocuments,
  })
}
