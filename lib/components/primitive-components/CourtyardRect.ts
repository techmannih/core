import { distance } from "circuit-json"
import { applyToPoint } from "transformation-matrix"
import { z } from "zod"
import { pcbLayoutProps } from "lib/common/layout"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export const courtyardRectProps = pcbLayoutProps
  .omit({ pcbRotation: true })
  .extend({
    width: distance,
    height: distance,
    strokeWidth: distance.optional(),
    isFilled: z.boolean().optional(),
    hasStroke: z.boolean().optional(),
    isStrokeDashed: z.boolean().optional(),
    color: z.string().optional(),
    layer: z.string().optional(),
  })

export type CourtyardRectProps = z.input<typeof courtyardRectProps>

type ParsedCourtyardRectProps = z.infer<typeof courtyardRectProps>

export class CourtyardRect extends PrimitiveComponent<
  typeof courtyardRectProps
> {
  pcb_courtyard_rect_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "CourtyardRect",
      zodProps: courtyardRectProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const props = this._parsedProps as ParsedCourtyardRectProps
    const transform = this._computePcbGlobalTransformBeforeLayout()
    const center = applyToPoint(transform, { x: 0, y: 0 })

    const subcircuit = this.getSubcircuit()
    const group = this.getGroup()
    const container = this.getPrimitiveContainer()

    const pcb_component_id =
      this.parent?.pcb_component_id ?? container?.pcb_component_id ?? undefined

    if (!pcb_component_id) {
      throw new Error(
        "CourtyardRect must be placed inside a PCB component or footprint",
      )
    }

    const width = this._coerceDistanceToNumber(props.width)
    const height = this._coerceDistanceToNumber(props.height)
    const strokeWidth = this._coerceDistanceToNumber(props.strokeWidth ?? 0.1)

    const pcb_courtyard_rect = db.pcb_courtyard_rect.insert({
      pcb_component_id,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: group?.pcb_group_id ?? undefined,
      center,
      width,
      height,
      stroke_width: strokeWidth,
      is_filled: props.isFilled ?? false,
      has_stroke: props.hasStroke ?? true,
      is_stroke_dashed: props.isStrokeDashed ?? false,
      color: props.color,
      layer: props.layer ?? "courtyard",
    })

    this.pcb_courtyard_rect_id = pcb_courtyard_rect.pcb_courtyard_rect_id
  }

  private _coerceDistanceToNumber(
    value:
      | ParsedCourtyardRectProps["width"]
      | ParsedCourtyardRectProps["strokeWidth"]
      | undefined,
  ): number {
    if (value === undefined || value === null) return 0
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const parsed = parseFloat(value)
      if (Number.isNaN(parsed)) {
        throw new Error(`Unable to parse distance value: ${value}`)
      }
      return parsed
    }
    return value as number
  }

  getPcbSize(): { width: number; height: number } {
    const props = this._parsedProps as ParsedCourtyardRectProps
    return {
      width: this._coerceDistanceToNumber(props.width),
      height: this._coerceDistanceToNumber(props.height),
    }
  }
}
