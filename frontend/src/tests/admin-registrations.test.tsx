import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import EventRegistrationsPage from "../pages/admin/event-registrations-page"
import type { Registration, RegistrationList } from "../types/registration-types"
import type { User } from "../types/user-types"
import { renderWithProviders } from "./utils/render-with-providers"

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  listRegistrations: vi.fn(),
  checkIn: vi.fn(),
  undoCheckIn: vi.fn(),
  cancelRegistration: vi.fn(),
}))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile: mocks.getProfile }))
vi.mock("../services/admin/registrations-service", () => ({
  listRegistrations: mocks.listRegistrations,
  checkIn: mocks.checkIn,
  undoCheckIn: mocks.undoCheckIn,
  cancelRegistration: mocks.cancelRegistration,
}))

const EVENT_ID = "44444444-4444-4444-8444-444444444444"

const COMMUNICATION: User = {
  id: "user-communication",
  name: "Comunicação Somos do Bem",
  email: "comunicacao@somosdobem.org.br",
  role: "communication",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
}

function registration(overrides: Partial<Registration>): Registration {
  return {
    id: "registration-1",
    event_id: EVENT_ID,
    transaction_id: null,
    ticket_code: "7KQ2M-X9D4R",
    participant_name: "Maria Oliveira",
    participant_email: "maria@exemplo.com.br",
    participant_phone: null,
    status: "confirmed",
    checked_in_at: null,
    checker: null,
    cancelled_at: null,
    created_at: "2026-10-10T12:00:00.000Z",
    ...overrides,
  }
}

const LIST: RegistrationList = {
  event: {
    id: EVENT_ID,
    title: "Dia de Portas Abertas",
    slug: "dia-de-portas-abertas",
    location: "Sede da Somos do Bem",
    starts_at: "2026-10-27T12:00:00.000Z",
    ends_at: null,
    ticket_price: "0.00",
    capacity: 80,
    taken_seats: 2,
    status: "published",
  },
  registrations: [
    registration({}),
    registration({
      id: "registration-2",
      transaction_id: "transaction-2",
      ticket_code: "H3NQ8-PZ1TW",
      participant_name: "João Lima",
      participant_email: "joao@exemplo.com.br",
      checked_in_at: "2026-10-27T12:40:00.000Z",
    }),
    registration({ id: "registration-3", ticket_code: "C4ZZ9-1MK2D", participant_name: "Ana Ramos", status: "cancelled" }),
  ],
  total: 3,
  summary: { confirmed: 2, checked_in: 1, cancelled: 1 },
}

function door() {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/comunicacao/eventos/:id/inscritos" element={<EventRegistrationsPage />} />
    </Routes>,
    `/admin/comunicacao/eventos/${EVENT_ID}/inscritos`,
  )
}

describe("lista de presença e check-in", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.setItem("somosdobem.token", "token-de-teste")
    mocks.getProfile.mockResolvedValue(COMMUNICATION)
    mocks.listRegistrations.mockResolvedValue(LIST)
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("registra a entrada pelo endereço que o leitor de QR digita", async () => {
    const user = userEvent.setup()
    mocks.checkIn.mockResolvedValue(registration({ checked_in_at: "2026-10-27T12:50:00.000Z" }))

    door()

    expect(await screen.findByRole("heading", { name: "Dia de Portas Abertas" })).toBeInTheDocument()
    expect(mocks.listRegistrations).toHaveBeenCalledWith(EVENT_ID)

    const code = screen.getByLabelText(/código do ingresso/i)
    await user.click(code)
    await user.paste("http://localhost:5173/inscricao/7kq2m-x9d4r")
    await user.keyboard("{Enter}")

    await waitFor(() => expect(mocks.checkIn).toHaveBeenCalledWith({ eventId: EVENT_ID, code: "7KQ2M-X9D4R" }, expect.anything()))
    expect(await screen.findByText(/entrada de maria oliveira registrada/i)).toBeInTheDocument()
    expect(code).toHaveValue("")
    expect(code).toHaveFocus()
  })

  it("responde na hora ao ingresso repetido e ao código de outro evento, sem ir ao servidor", async () => {
    const user = userEvent.setup()

    door()

    const code = await screen.findByLabelText(/código do ingresso/i)

    await user.click(code)
    await user.paste("h3nq8-pz1tw")
    await user.keyboard("{Enter}")
    expect(await screen.findByText(/joão lima já entrou/i)).toBeInTheDocument()

    await user.paste("ZZZZZ-99999")
    await user.keyboard("{Enter}")
    expect(await screen.findByText(/não é de uma inscrição deste evento/i)).toBeInTheDocument()

    await user.paste("C4ZZ9-1MK2D")
    await user.keyboard("{Enter}")
    expect(await screen.findByText(/a inscrição de ana ramos foi cancelada/i)).toBeInTheDocument()

    expect(mocks.checkIn).not.toHaveBeenCalled()
  })

  it("cancela só a inscrição gratuita, e devolve a vaga depois de confirmar", async () => {
    const user = userEvent.setup()
    mocks.cancelRegistration.mockResolvedValue(registration({ status: "cancelled" }))

    door()

    await screen.findAllByText("Maria Oliveira")

    // O convite pago sai por estorno, no Financeiro: aqui não há "Cancelar" para ele.
    expect(screen.getAllByRole("button", { name: /^cancelar$/i })).toHaveLength(2)

    await user.click(screen.getAllByRole("button", { name: /^cancelar$/i })[0])

    const dialog = await screen.findByRole("alertdialog", { name: /cancelar a inscrição de maria oliveira/i })
    await user.click(within(dialog).getByRole("button", { name: /cancelar inscrição/i }))

    await waitFor(() => expect(mocks.cancelRegistration).toHaveBeenCalledWith("registration-1", expect.anything()))
  })

  it("filtra a lista pelo nome digitado na busca", async () => {
    const user = userEvent.setup()

    door()

    await screen.findAllByText("Maria Oliveira")
    await user.type(screen.getByRole("searchbox", { name: /buscar/i }), "joão")

    expect(screen.queryAllByText("Maria Oliveira")).toHaveLength(0)
    expect(screen.getAllByText("João Lima").length).toBeGreaterThan(0)
  })
})
