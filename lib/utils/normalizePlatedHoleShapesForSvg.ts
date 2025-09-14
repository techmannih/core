import type { AnyCircuitElement } from "circuit-json"

/**
 * circuit-to-svg currently doesn't support pcb_plated_hole elements with
 * shape "circle". Historically a round plated hole is encoded with
 * outer_diameter / hole_diameter, but circuit-to-svg only understands the
 * "oval" style with width/height fields.  To avoid noisy warnings from
 * circuit-to-svg we normalise these elements by converting them into the
 * equivalent "oval" representation with equal width/height values.
 */
export const normalizePlatedHoleShapesForSvg = (
  soup: AnyCircuitElement[],
): AnyCircuitElement[] =>
  soup.map((elm) => {
    if (elm.type === "pcb_plated_hole" && elm.shape === "circle") {
      return {
        ...elm,
        shape: "oval",
        outer_width: elm.outer_diameter,
        outer_height: elm.outer_diameter,
        hole_width: elm.hole_diameter,
        hole_height: elm.hole_diameter,
      } as AnyCircuitElement
    }
    return elm
  })
