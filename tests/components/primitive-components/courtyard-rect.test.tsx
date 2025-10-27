import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("courtyardrect attaches to the parent pcb component", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint={
          <footprint>
            <courtyardrect
              pcbX={1}
              pcbY={2}
              width={4}
              height={3}
              strokeWidth={0.2}
              color="#336699"
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const courtyardRects = circuit.db.pcb_courtyard_rect.list()
  expect(courtyardRects).toHaveLength(1)

  const pcbComponent = circuit.db.pcb_component.list()[0]
  expect(pcbComponent).toBeDefined()
  expect(courtyardRects[0].pcb_component_id).toBe(
    pcbComponent.pcb_component_id,
  )

  expect(courtyardRects[0]).toMatchObject({
    center: { x: 1, y: 2 },
    width: 4,
    height: 3,
    stroke_width: 0.2,
    is_filled: false,
    has_stroke: true,
    is_stroke_dashed: false,
    color: "#336699",
    layer: "courtyard",
  })
})
