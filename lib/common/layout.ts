import { distance } from "circuit-json"
import { z } from "zod"

export const pcbLayoutProps = z
  .object({
    pcbX: distance.optional(),
    pcbY: distance.optional(),
    pcbRotation: z.union([z.number(), z.string()]).optional(),
    layer: z.string().optional(),
  })
  .passthrough()

export type PcbLayoutProps = z.input<typeof pcbLayoutProps>
