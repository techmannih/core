import { fabricationNoteRectProps } from "@tscircuit/props"
import { applyToPoint } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class FabricationNoteRect extends PrimitiveComponent<
  typeof fabricationNoteRectProps
> {
  fabrication_note_rect_id: string | null = null
  isPcbPrimitive = true
  private _cachedPcbSize: { width: number; height: number } | null = null

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
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()

    const layer = maybeFlipLayer(props.layer ?? "top") as "top" | "bottom"
    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for FabricationNoteRect. Must be "top" or "bottom".`,
      )
    }

    const transform = this._computePcbGlobalTransformBeforeLayout()
    const halfWidth = props.width / 2
    const halfHeight = props.height / 2

    const transformedCorners = (
      [
        { x: -halfWidth, y: -halfHeight },
        { x: halfWidth, y: -halfHeight },
        { x: halfWidth, y: halfHeight },
        { x: -halfWidth, y: halfHeight },
      ] as const
    ).map((corner) => applyToPoint(transform, corner))

    const minX = Math.min(...transformedCorners.map((point) => point.x))
    const maxX = Math.max(...transformedCorners.map((point) => point.x))
    const minY = Math.min(...transformedCorners.map((point) => point.y))
    const maxY = Math.max(...transformedCorners.map((point) => point.y))

    const center = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    }

    const width = maxX - minX
    const height = maxY - minY

    this._cachedPcbSize = {
      width: Number.isFinite(width) ? width : props.width,
      height: Number.isFinite(height) ? height : props.height,
    }

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
      width: this._cachedPcbSize.width,
      height: this._cachedPcbSize.height,
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

  getPcbSize(): { width: number; height: number } {
    if (this._cachedPcbSize) return this._cachedPcbSize
    const { _parsedProps: props } = this
    return { width: props.width, height: props.height }
  }
}
