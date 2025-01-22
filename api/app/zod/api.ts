import { z } from "zod";

export const fetchParamsSchema = z.object({
  url: z.string().url(),
  locale: z.string().optional(),
  proxy: z.string().optional(),
});
export type FetchParams = z.infer<typeof fetchParamsSchema>;
