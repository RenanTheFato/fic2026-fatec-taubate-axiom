import { VolunteerShiftInterface } from "../../interfaces/volunteer-shift-interface.js";
import { VolunteerShift } from "../../models/volunteer-shift-model.js";

type CreateVolunteerShiftProps = Pick<VolunteerShiftInterface, 'activity' | 'area' | 'place' | 'coordinator' | 'description' | 'starts_at' | 'ends_at' | 'slots' | 'created_by'>

// A coordenação abre um turno na escala. Ele aparece para todo voluntário aprovado, que escolhe
// participar; a vaga é reservada na hora e a coordenação confirma quem conta.
export class CreateVolunteerShiftService {
  async execute({ activity, area, place, coordinator, description, starts_at, ends_at, slots, created_by }: CreateVolunteerShiftProps) {

    const shift = await VolunteerShift.create({
      activity,
      area,
      place,
      coordinator,
      description,
      starts_at,
      ends_at,
      slots,
      taken_slots: 0,
      status: "open",
      created_by,
    })

    return shift.get({ plain: true })
  }
}
