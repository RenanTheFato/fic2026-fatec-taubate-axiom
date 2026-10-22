import { z } from "zod/v4";

export const listPartnersDoc = {
  tags: ["partner"],
  summary: "List the public partner network",
  description: "Public. The approved partners that authorized their brand on the site, alphabetical. Only name, logo and website leave the API.",
  response: {
    200: z.object({
      message: z.string(),
      partners: z.array(z.object({
        id: z.string(),
        name: z.string(),
        logo: z.string().nullable(),
        site: z.string().nullable(),
      })),
    }).describe("Partners fetched."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
