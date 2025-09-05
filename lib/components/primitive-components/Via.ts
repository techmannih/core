import { viaProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Port } from "./Port"
import { z } from "zod"
import { nanoid } from "nanoid"

export class Via extends PrimitiveComponent<typeof viaProps> {
  pcb_via_id: string | null = null
  matchedPort: Port | null = null
  isPcbPrimitive = true
  portsByLayer: Record<string, Port>

  constructor(props: z.input<typeof viaProps>) {
    super(props)
    this.portsByLayer = {}
    // Pre-generate a source_component_id so child ports can reference it
    this.source_component_id = `source_component_${nanoid()}`
    const fromLayer = (this._parsedProps as any).fromLayer || "bottom"
    const toLayer = (this._parsedProps as any).toLayer || "top"
    const layers = Array.from(new Set([fromLayer, toLayer]))
    for (const layer of layers) {
      const port = new Port({ name: layer })
      // Associate this via as the matched component for the port so
      // position and layer information can be derived from the via
      port.registerMatch(this)
      // Limit the port to a single PCB layer corresponding to the
      // via's endpoint so traces can target specific layers
      port.getAvailablePcbLayers = () => [layer]
      this.add(port)
      this.portsByLayer[layer] = port
    }
  }

  get config() {
    return {
      componentName: "Via",
      zodProps: viaProps,
    }
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    db.source_component.insert({
      source_component_id: this.source_component_id!,
      ftype: "source_manually_placed_via",
      name: this.name,
    })
  }

  doInitialPcbComponentRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const position = this._getGlobalPcbPositionBeforeLayout()
    const subcircuit = this.getSubcircuit()
    const pcb_component = db.pcb_component.insert({
      source_component_id: this.source_component_id!,
      center: position,
      width: 0,
      height: 0,
      layer: (this._parsedProps as any).fromLayer || "top",
      rotation: 0,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })
    this.pcb_component_id = pcb_component.pcb_component_id
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

    const viaLayers = Object.keys(this.portsByLayer)
    const from_layer = (props.fromLayer || viaLayers[0] || "bottom") as any
    const to_layer = (props.toLayer || viaLayers[viaLayers.length - 1] || "top") as any
    const pcb_via = db.pcb_via.insert({
      pcb_component_id: this.pcb_component_id!,
      x: position.x,
      y: position.y,
      hole_diameter: props.holeDiameter,
      outer_diameter: props.outerDiameter,
      layers: viaLayers as any,
      from_layer,
      to_layer,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })

    this.pcb_via_id = pcb_via.pcb_via_id
  }
}
