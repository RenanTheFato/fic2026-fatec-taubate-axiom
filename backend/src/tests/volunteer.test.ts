import { ApplyVolunteerController } from "../controllers/volunteer/apply-volunteer-controller.js";
import { ReviewVolunteerController } from "../controllers/volunteer/review-volunteer-controller.js";
import { CreateVolunteerShiftController } from "../controllers/volunteer-shift/create-volunteer-shift-controller.js";
import { JoinVolunteerShiftController } from "../controllers/volunteer-shift/join-volunteer-shift-controller.js";
import { LeaveVolunteerShiftController } from "../controllers/volunteer-shift/leave-volunteer-shift-controller.js";
import { ListOpenVolunteerShiftsController } from "../controllers/volunteer-shift/list-open-volunteer-shifts-controller.js";
import { RecordVolunteerAttendanceController } from "../controllers/volunteer-shift/record-volunteer-attendance-controller.js";
import { User } from "../models/user-model.js";
import { VolunteerAssignment } from "../models/volunteer-assignment-model.js";
import { Volunteer } from "../models/volunteer-model.js";
import { VolunteerShift } from "../models/volunteer-shift-model.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";
import { mockSequelizeTransaction } from "./utils/mock-sequelize.js";

const shiftId = "4c3d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f"
const assignmentId = "5d4e6f7a-8b9c-4d0e-9f1a-2b3c4d5e6f70"
const HOUR = 3_600_000

function signup(overrides: Record<string, unknown> = {}) {
  return {
    name: "Lucas Ferreira",
    email: "lucas.ferreira@exemplo.com.br",
    password: "Voluntario@2026",
    phone: "19 99812-3344",
    city: "Indaiatuba",
    area: "eventos",
    availability: ["noite", "fim-de-semana"],
    about: "Trabalho com produção de eventos e posso ajudar na montagem e na recepção.",
    ...overrides,
  }
}

function stored<T extends Record<string, unknown>>(attributes: T) {
  const row = {
    ...attributes,
    update: jest.fn().mockImplementation(async (values: Record<string, unknown>) => Object.assign(row, values)),
    get: jest.fn().mockImplementation(() => ({ ...row })),
  }

  return row
}

function shift(startsInHours: number, durationHours = 3) {
  const starts = new Date(Date.now() + startsInHours * HOUR)

  return stored({
    id: shiftId,
    status: "open",
    slots: 3,
    taken_slots: 1,
    starts_at: starts,
    ends_at: new Date(starts.getTime() + durationHours * HOUR),
  })
}

describe("Volunteering (sign-up, review, scale and attendance)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()
  })

  it("signs a person up from the site with the account and the registration under review", async () => {
    jest.spyOn(User, "findOne").mockResolvedValue(null)
    const createUser = jest.spyOn(User, "create").mockResolvedValue({ id: "user-volunteer" } as never)
    const createVolunteer = jest.spyOn(Volunteer, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      id: "volunteer-1",
      created_at: new Date(),
      ...values,
    })) as never)

    const res = mockResponse()
    await new ApplyVolunteerController().handle(mockRequest({ body: signup() }), res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ role: "volunteer" }), expect.anything())
    expect(createVolunteer).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-volunteer", status: "pending", availability: ["noite", "fim-de-semana"] }), expect.anything())
  })

  it("refuses a phone without area code and a sign-up with no period, because the coordination couldn't schedule anyone", async () => {
    const createUser = jest.spyOn(User, "create")

    const phone = mockResponse()
    await new ApplyVolunteerController().handle(mockRequest({ body: signup({ phone: "9812-3344" }) }), phone)

    const periods = mockResponse()
    await new ApplyVolunteerController().handle(mockRequest({ body: signup({ availability: [] }) }), periods)

    expect(phone.status).toHaveBeenCalledWith(400)
    expect(periods.status).toHaveBeenCalledWith(400)
    expect(createUser).not.toHaveBeenCalled()
  })

  it("asks a reason to refuse a registration", async () => {
    const volunteer = stored({ id: "volunteer-1", status: "pending" })
    jest.spyOn(Volunteer, "findByPk").mockResolvedValue(volunteer as never)

    const res = mockResponse()
    await new ReviewVolunteerController().handle(mockRequest({
      user: { id: "user-admin" },
      params: { id: "8e7f6a5b-4c3d-4e2f-9a1b-0c9d8e7f6a5b" },
      body: { decision: "refused", note: "não" },
    } as never), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(volunteer.update).not.toHaveBeenCalled()
  })

  it("keeps the open shifts away from a registration still under review", async () => {
    jest.spyOn(Volunteer, "findOne").mockResolvedValue({ id: "volunteer-1", status: "pending" } as never)
    const findAll = jest.spyOn(VolunteerShift, "findAll")

    const res = mockResponse()
    await new ListOpenVolunteerShiftsController().handle(mockRequest({ user: { id: "user-volunteer" } } as never), res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(findAll).not.toHaveBeenCalled()
  })

  it("lets the database decide the last slot of a shift, like an event seat", async () => {
    jest.spyOn(Volunteer, "findOne").mockResolvedValue({ id: "volunteer-1", status: "approved" } as never)
    jest.spyOn(VolunteerShift, "findByPk").mockResolvedValue(shift(48) as never)
    jest.spyOn(VolunteerAssignment, "findOne").mockResolvedValue(null)
    const update = jest.spyOn(VolunteerShift, "update")
    const create = jest.spyOn(VolunteerAssignment, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      get: () => ({ id: assignmentId, ...values }),
    })) as never)

    update.mockResolvedValueOnce([0] as never)
    const full = mockResponse()
    await new JoinVolunteerShiftController().handle(mockRequest({ user: { id: "user-volunteer" }, params: { id: shiftId } } as never), full)

    update.mockResolvedValueOnce([1] as never)
    const joined = mockResponse()
    await new JoinVolunteerShiftController().handle(mockRequest({ user: { id: "user-volunteer" }, params: { id: shiftId } } as never), joined)

    expect(full.status).toHaveBeenCalledWith(400)
    expect(joined.status).toHaveBeenCalledWith(201)
    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ shift_id: shiftId, volunteer_id: "volunteer-1", status: "pending" }), expect.anything())
  })

  it("lets a volunteer leave before the shift starts, giving the slot back, and not after", async () => {
    jest.spyOn(Volunteer, "findOne").mockResolvedValue({ id: "volunteer-1" } as never)
    const update = jest.spyOn(VolunteerShift, "update").mockResolvedValue([1] as never)

    const before = stored({ id: assignmentId, status: "confirmed" })
    jest.spyOn(VolunteerShift, "findByPk").mockResolvedValueOnce(shift(24) as never)
    jest.spyOn(VolunteerAssignment, "findOne").mockResolvedValueOnce(before as never)
    const left = mockResponse()
    await new LeaveVolunteerShiftController().handle(mockRequest({ user: { id: "user-volunteer" }, params: { id: shiftId } } as never), left)

    const after = stored({ id: assignmentId, status: "confirmed" })
    jest.spyOn(VolunteerShift, "findByPk").mockResolvedValueOnce(shift(-1) as never)
    jest.spyOn(VolunteerAssignment, "findOne").mockResolvedValueOnce(after as never)
    const late = mockResponse()
    await new LeaveVolunteerShiftController().handle(mockRequest({ user: { id: "user-volunteer" }, params: { id: shiftId } } as never), late)

    expect(left.status).toHaveBeenCalledWith(200)
    expect(before.update).toHaveBeenCalledWith({ status: "cancelled" }, expect.anything())
    expect(update).toHaveBeenCalledTimes(1)
    expect(late.status).toHaveBeenCalledWith(400)
    expect(after.update).not.toHaveBeenCalled()
  })

  it("turns attendance into the shift duration unless the coordination informs the hours, and only after the start", async () => {
    const attended = stored({ id: assignmentId, shift_id: shiftId, status: "confirmed" })
    jest.spyOn(VolunteerAssignment, "findByPk").mockResolvedValue(attended as never)

    jest.spyOn(VolunteerShift, "findByPk").mockResolvedValueOnce(shift(2) as never)
    const early = mockResponse()
    await new RecordVolunteerAttendanceController().handle(mockRequest({ user: { id: "user-admin" }, params: { id: assignmentId }, body: { attended: true } } as never), early)

    jest.spyOn(VolunteerShift, "findByPk").mockResolvedValueOnce(shift(-5, 2.5) as never)
    const res = mockResponse()
    await new RecordVolunteerAttendanceController().handle(mockRequest({ user: { id: "user-admin" }, params: { id: assignmentId }, body: { attended: true } } as never), res)

    expect(early.status).toHaveBeenCalledWith(400)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(attended.update).toHaveBeenCalledTimes(1)
    expect(attended.update).toHaveBeenCalledWith(expect.objectContaining({ status: "attended", hours: "2.50", checked_by: "user-admin" }))
  })

  it("records an absence without hours", async () => {
    const absent = stored({ id: assignmentId, shift_id: shiftId, status: "confirmed" })
    jest.spyOn(VolunteerAssignment, "findByPk").mockResolvedValue(absent as never)
    jest.spyOn(VolunteerShift, "findByPk").mockResolvedValue(shift(-5) as never)

    const res = mockResponse()
    await new RecordVolunteerAttendanceController().handle(mockRequest({ user: { id: "user-admin" }, params: { id: assignmentId }, body: { attended: false, hours: 3 } } as never), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(absent.update).toHaveBeenCalledWith(expect.objectContaining({ status: "absent", hours: null }))
  })

  it("refuses a shift in the past and one longer than a working period", async () => {
    const create = jest.spyOn(VolunteerShift, "create")
    const base = { activity: "Apoio na Oficina", area: "oficina", place: "Oficina Terapêutica", coordinator: "Coordenação da Oficina", slots: 3 }

    const past = mockResponse()
    await new CreateVolunteerShiftController().handle(mockRequest({
      user: { id: "user-admin" },
      body: { ...base, starts_at: new Date(Date.now() - 24 * HOUR).toISOString(), ends_at: new Date(Date.now() - 21 * HOUR).toISOString() },
    } as never), past)

    const long = mockResponse()
    await new CreateVolunteerShiftController().handle(mockRequest({
      user: { id: "user-admin" },
      body: { ...base, starts_at: new Date(Date.now() + 24 * HOUR).toISOString(), ends_at: new Date(Date.now() + 40 * HOUR).toISOString() },
    } as never), long)

    expect(past.status).toHaveBeenCalledWith(400)
    expect(long.status).toHaveBeenCalledWith(400)
    expect(create).not.toHaveBeenCalled()
  })
})
