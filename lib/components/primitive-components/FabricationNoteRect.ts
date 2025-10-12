import { fabricationNoteRectProps } from "@tscircuit/props"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class FabricationNoteRect extends PrimitiveComponent<
  typeof fabricationNoteRectProps
> {
  fabrication_note_rect_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "FabricationNoteRect",
      zodProps: fabricationNoteRectProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const layer = props.layer ?? "top"
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for FabricationNoteRect. Must be "top" or "bottom".`,
      )
    }

    const transform = this._computePcbGlobalTransformBeforeLayout()
    const center = applyToPoint(transform, {
      x: props.pcbX ?? 0,
      y: props.pcbY ?? 0,
    })

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!

    const subcircuit = this.getSubcircuit()

    const fabrication_note_rect = db.pcb_fabrication_note_rect.insert({
      pcb_component_id,
      layer,
      center: {
        x: center.x,
        y: center.y,
      },
      width: props.width,
      height: props.height,
      stroke_width: props.strokeWidth ?? 0.1,
      is_filled: props.isFilled ?? false,
      has_stroke: props.hasStroke ?? true,
      is_stroke_dashed: props.isStrokeDashed ?? false,
      color: props.color,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })

    this.fabrication_note_rect_id =
      fabrication_note_rect.pcb_fabrication_note_rect_id
  }
}
