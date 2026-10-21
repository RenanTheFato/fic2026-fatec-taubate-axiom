import { useMutation } from "@tanstack/react-query"
import { requestWallRemoval, sendContactMessage } from "../services/contact/contact-service"

export function useSendMessage() {
  return useMutation({ mutationFn: sendContactMessage, retry: false })
}

export function useRequestWallRemoval() {
  return useMutation({ mutationFn: requestWallRemoval, retry: false })
}
