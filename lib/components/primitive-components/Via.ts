import { viaProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Port } from "./Port"
import type { LayerRef } from "circuit-json"

export class Via extends PrimitiveComponent<typeof viaProps> {
  pcb_via_id: string | null = null
  matchedPort: Port | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "Via",
      zodProps: viaProps,
    }
  }

  getAvailablePcbLayers(): string[] {
    // TODO use project layerCount
    return ["top", "inner1", "inner2", "bottom"]
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    return { width: props.outerDiameter, height: props.outerDiameter }
  }

  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    const { db } = this.root!
    const via = db.pcb_via.get(this.pcb_via_id!)!
    const size = this.getPcbSize()

    return {
      center: { x: via.x, y: via.y },
      bounds: {
        left: via.x - size.width / 2,
        top: via.y - size.height / 2,
        right: via.x + size.width / 2,
        bottom: via.y + size.height / 2,
      },
      width: size.width,
      height: size.height,
    }
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    db.pcb_via.update(this.pcb_via_id!, {
      x: newCenter.x,
      y: newCenter.y,
    })
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const subcircuit = this.getSubcircuit()

    const pcb_via = db.pcb_via.insert({
      x: position.x,
      y: position.y,
      hole_diameter: props.holeDiameter,
      outer_diameter: props.outerDiameter,
      layers: ["bottom", "top"],
      from_layer: props.fromLayer || "bottom",
      to_layer: props.toLayer || "top",
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })

    this.pcb_via_id = pcb_via.pcb_via_id
  }

  /**
   * Initialize port objects for each layer the via spans. These ports allow
   * traces to explicitly connect to a specific layer of the via using selectors
   * like `Via1.top` or `Via1.bottom`.
   */
  initPorts() {
    if (this.children.some((c) => c.componentName === "Port")) return
    const layers = this._getLayerSpan()
    for (const layer of layers) {
      this.add(new ViaPort(this, layer))
    }
  }

  /**
   * Compute the list of layers this via spans, inclusive, based on fromLayer
   * and toLayer props.
   */
  _getLayerSpan(): LayerRef[] {
    const order: LayerRef[] = ["top", "inner1", "inner2", "bottom"]
    const fromLayer = (this._parsedProps.fromLayer ?? "bottom") as LayerRef
    const toLayer = (this._parsedProps.toLayer ?? "top") as LayerRef
    const fromIndex = order.indexOf(fromLayer)
    const toIndex = order.indexOf(toLayer)
    const start = Math.min(fromIndex, toIndex)
    const end = Math.max(fromIndex, toIndex)
    return order.slice(start, end + 1)
  }

  doInitialSourceRender(): void {
    this.initPorts()
  }
}

class ViaPort extends Port {
  via: Via
  layer: LayerRef

  constructor(via: Via, layer: LayerRef) {
    super({ name: layer })
    this.via = via
    this.layer = layer
    this.matchedComponents.push(via)
  }

  override getAvailablePcbLayers(): LayerRef[] {
    return [this.layer]
  }

  override _getGlobalPcbPositionBeforeLayout(): { x: number; y: number } {
    return this.via._getGlobalPcbPositionBeforeLayout()
  }

  override _getGlobalPcbPositionAfterLayout(): { x: number; y: number } {
    return this.via._getPcbCircuitJsonBounds().center
  }
}
