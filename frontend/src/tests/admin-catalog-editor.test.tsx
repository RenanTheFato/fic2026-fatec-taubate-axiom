import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import AdminEventsPage from "../pages/admin/admin-events-page"
import CampaignsPage from "../pages/admin/campaigns-page"
import ProductsPage from "../pages/admin/products-page"
import type { Campaign } from "../types/campaign-types"
import type { ApiEvent } from "../types/event-types"
import type { Product } from "../types/product-types"
import type { User } from "../types/user-types"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  listAllCampaigns: vi.fn(),
  listAllEvents: vi.fn(),
  listAllProducts: vi.fn(),
  saveCampaign: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  updateEventCapacity: vi.fn(),
  saveProduct: vi.fn(),
  deleteFromCatalog: vi.fn(),
  uploadPhoto: vi.fn(),
  actOnCatalog: vi.fn(),
  summarizeItems: vi.fn(),
}))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile: mocks.getProfile }))

vi.mock("../services/admin/list-all-service", () => ({
  listAllCampaigns: mocks.listAllCampaigns,
  listAllEvents: mocks.listAllEvents,
  listAllProducts: mocks.listAllProducts,
}))

vi.mock("../services/admin/catalog-editor-service", () => ({
  saveCampaign: mocks.saveCampaign,
  createEvent: mocks.createEvent,
  updateEvent: mocks.updateEvent,
  updateEventCapacity: mocks.updateEventCapacity,
  saveProduct: mocks.saveProduct,
  deleteFromCatalog: mocks.deleteFromCatalog,
}))

vi.mock("../services/admin/photo-service", () => ({ uploadPhoto: mocks.uploadPhoto }))
vi.mock("../services/admin/catalog-actions-service", () => ({ actOnCatalog: mocks.actOnCatalog }))
vi.mock("../services/admin/summarize-items-service", () => ({ summarizeItems: mocks.summarizeItems }))

function person(role: User["role"]): User {
  return {
    id: `user-${role}`,
    name: role === "admin" ? "Direção Somos do Bem" : "Comunicação Somos do Bem",
    email: `${role}@somosdobem.org.br`,
    role,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }
}

function campaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: "campaign-1",
    title: "Natal do Bem 2026",
    slug: "natal-do-bem-2026",
    description: "Ceia e presentes para as famílias atendidas.",
    image_url: null,
    goal_amount: "40000.00",
    raised_amount: "12500.00",
    starts_at: "2026-10-01T03:00:00.000Z",
    ends_at: "2026-12-24T03:00:00.000Z",
    status: "active",
    created_at: "2026-09-20T12:00:00.000Z",
    updated_at: "2026-09-20T12:00:00.000Z",
    ...overrides,
  }
}

function event(overrides: Partial<ApiEvent> = {}): ApiEvent {
  return {
    id: "event-1",
    campaign_id: null,
    title: "Cantata de Natal do Bem 2026",
    slug: "cantata-de-natal-do-bem-2026",
    description: "Coral dos estudantes.",
    location: "Salão de eventos da sede",
    image_url: null,
    starts_at: "2099-12-18T22:00:00.000Z",
    ends_at: null,
    ticket_price: "40.00",
    capacity: 250,
    taken_seats: 7,
    status: "published",
    ...overrides,
  }
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    name: "Caneca Somos do Bem",
    sku: "sdb-caneca",
    description: null,
    price: "35.00",
    stock: 40,
    image_url: null,
    active: false,
    activated_at: null,
    created_at: "2026-09-01T12:00:00.000Z",
    updated_at: "2026-09-01T12:00:00.000Z",
    ...overrides,
  }
}

describe("cadastro do catálogo pelo painel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.setItem("somosdobem.token", "token-de-teste")
    mocks.getProfile.mockResolvedValue(person("communication"))
    mocks.listAllCampaigns.mockResolvedValue([campaign(), campaign({ id: "campaign-2", title: "Páscoa 2025", slug: "pascoa-2025", status: "cancelled" })])
    mocks.listAllEvents.mockResolvedValue([event()])
    mocks.listAllProducts.mockResolvedValue([product()])
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("cadastra uma campanha nova como rascunho, com a foto enviada pelo painel", async () => {
    const user = userEvent.setup()
    const photoUrl = "http://localhost:3333/api/v1/photo/6f1c2a7e-4b3d-4e8f-9a10-2c3d4e5f6a7b"
    mocks.uploadPhoto.mockResolvedValue({ id: "photo-1", url: photoUrl })
    mocks.saveCampaign.mockResolvedValue(campaign({ id: "campaign-3", title: "Inverno do Bem", status: "draft" }))

    renderWithProviders(<CampaignsPage />, "/admin/comunicacao/campanhas")

    await user.click(await screen.findByRole("button", { name: /nova campanha/i }))

    // O formulário abre com o foco no primeiro campo.
    await waitFor(() => expect(screen.getByLabelText(/^título/i)).toHaveFocus())

    await fillField(user, /^título/i, "Inverno do Bem")
    await fillField(user, /^meta/i, "25.000,50")
    await user.type(screen.getByLabelText(/^início/i), "2026-06-01")

    const file = new File(["foto"], "inverno.jpg", { type: "image/jpeg" })
    await user.upload(screen.getByLabelText(/enviar foto/i), file)
    await waitFor(() => expect(mocks.uploadPhoto).toHaveBeenCalledTimes(1))
    expect(await screen.findByRole("img", { name: /prévia da foto de capa/i })).toHaveAttribute("src", photoUrl)

    await user.click(screen.getByRole("button", { name: /salvar rascunho/i }))

    await waitFor(() => expect(mocks.saveCampaign).toHaveBeenCalledTimes(1))
    expect(mocks.saveCampaign.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        id: undefined,
        title: "Inverno do Bem",
        goal_amount: 25000.5,
        image_url: photoUrl,
        ends_at: null,
        starts_at: new Date("2026-06-01T00:00:00").toISOString(),
      }),
    )
    expect(await screen.findByText(/foi salva como rascunho/i)).toBeInTheDocument()
  })

  it("não envia campanha sem meta e leva o foco ao campo", async () => {
    const user = userEvent.setup()

    renderWithProviders(<CampaignsPage />, "/admin/comunicacao/campanhas")

    await user.click(await screen.findByRole("button", { name: /nova campanha/i }))
    await fillField(user, /^título/i, "Inverno do Bem")
    await user.type(screen.getByLabelText(/^início/i), "2026-06-01")
    await user.click(screen.getByRole("button", { name: /salvar rascunho/i }))

    expect(await screen.findByText(/informe a meta em reais/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/^meta/i)).toHaveFocus())
    expect(mocks.saveCampaign).not.toHaveBeenCalled()
  })

  it("salva o evento e muda a lotação pela rota própria dela", async () => {
    const user = userEvent.setup()
    mocks.updateEvent.mockResolvedValue(event())
    mocks.updateEventCapacity.mockResolvedValue(event({ capacity: 300 }))

    renderWithProviders(<AdminEventsPage />, "/admin/comunicacao/eventos")

    const [row] = await screen.findAllByText("Cantata de Natal do Bem 2026")
    expect(row).toBeInTheDocument()
    await user.click(screen.getAllByRole("button", { name: /^editar$/i })[0])

    // A campanha cancelada não é oferecida para um vínculo novo.
    const options = within(screen.getByLabelText(/^campanha/i)).getAllByRole("option").map((option) => option.textContent)
    expect(options).toEqual(["Nenhuma", "Natal do Bem 2026"])

    const capacity = screen.getByLabelText(/^lotação/i)
    await user.clear(capacity)
    await user.type(capacity, "300")
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }))

    await waitFor(() => expect(mocks.updateEventCapacity).toHaveBeenCalledWith("event-1", 300))
    expect(mocks.updateEvent).toHaveBeenCalledWith("event-1", expect.objectContaining({ title: "Cantata de Natal do Bem 2026", ticket_price: 40 }))
    expect(await screen.findByText(/foi atualizado/i)).toBeInTheDocument()
  })

  it("recusa lotação abaixo das vagas já ocupadas sem chamar o servidor", async () => {
    const user = userEvent.setup()

    renderWithProviders(<AdminEventsPage />, "/admin/comunicacao/eventos")

    await screen.findAllByText("Cantata de Natal do Bem 2026")
    await user.click(screen.getAllByRole("button", { name: /^editar$/i })[0])

    const capacity = screen.getByLabelText(/^lotação/i)
    await user.clear(capacity)
    await user.type(capacity, "5")
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }))

    expect(await screen.findByText(/já há 7 vagas ocupadas/i)).toBeInTheDocument()
    expect(mocks.updateEvent).not.toHaveBeenCalled()
    expect(mocks.updateEventCapacity).not.toHaveBeenCalled()
  })

  it("cadastra produto fora do catálogo, com o estoque inicial", async () => {
    const user = userEvent.setup()
    mocks.saveProduct.mockResolvedValue(product({ id: "product-2", name: "Ecobag Somos do Bem" }))

    renderWithProviders(<ProductsPage />, "/admin/comunicacao/produtos")

    await user.click(await screen.findByRole("button", { name: /novo produto/i }))
    await fillField(user, /^nome/i, "Ecobag Somos do Bem")
    await fillField(user, /^sku/i, "SDB-Ecobag")
    await fillField(user, /^preço/i, "29,90")

    const stock = screen.getByLabelText(/^estoque inicial/i)
    await user.clear(stock)
    await user.type(stock, "60")
    await user.click(screen.getByRole("button", { name: /cadastrar produto/i }))

    await waitFor(() => expect(mocks.saveProduct).toHaveBeenCalledTimes(1))
    expect(mocks.saveProduct.mock.calls[0][0]).toEqual(
      expect.objectContaining({ name: "Ecobag Somos do Bem", sku: "sdb-ecobag", price: 29.9, stock: 60, image_url: null }),
    )
    expect(await screen.findByText(/coloque no catálogo para pôr à venda/i)).toBeInTheDocument()
  })

  it("deixa só a administração excluir o produto que nunca foi à loja", async () => {
    const user = userEvent.setup()

    const { unmount } = renderWithProviders(<ProductsPage />, "/admin/comunicacao/produtos")

    await screen.findAllByText("Caneca Somos do Bem")
    expect(screen.queryByRole("button", { name: /^excluir$/i })).not.toBeInTheDocument()
    unmount()

    mocks.getProfile.mockResolvedValue(person("admin"))
    mocks.summarizeItems.mockResolvedValue({ items: [], totals: { quantity: 0, revenue: "0.00" } })
    mocks.deleteFromCatalog.mockResolvedValue(undefined)

    renderWithProviders(<ProductsPage />, "/admin/comunicacao/produtos")

    await screen.findAllByText("Caneca Somos do Bem")
    await user.click(screen.getAllByRole("button", { name: /^excluir$/i })[0])
    await user.click(await screen.findByRole("button", { name: /excluir produto/i }))

    await waitFor(() => expect(mocks.deleteFromCatalog).toHaveBeenCalledWith({ domain: "product", id: "product-1" }, expect.anything()))
    expect(await screen.findByText(/foi excluído/i)).toBeInTheDocument()
  })
})
