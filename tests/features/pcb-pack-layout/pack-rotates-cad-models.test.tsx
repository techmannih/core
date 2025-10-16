import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { applyPackOutput } from "lib/components/primitive-components/Group/Group_doInitialPcbLayoutPack/applyPackOutput"
import type { Group } from "lib/components/primitive-components/Group"

test("cad models receive pack rotations", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group name="group1">
      <chip
        name="U1"
        footprint="soic8"
        cadModel={{ stlUrl: "https://example.com/model.stl" }}
      />
    </group>,
  )

  circuit.render()

  const group = circuit.firstChild as Group
  const pcbComponent = circuit.db.pcb_component.list()[0]
  const initialCadComponent = circuit.db.cad_component.list()[0]
  const initialRotationZ = initialCadComponent.rotation?.z ?? 0

  const packOutput = {
    components: [
      {
        componentId: pcbComponent.pcb_component_id,
        center: { ...pcbComponent.center },
        ccwRotationDegrees: 90,
      },
    ],
  } as any

  applyPackOutput(group, packOutput, {})

  const rotatedCadComponent = circuit.db.cad_component.list()[0]
  expect(rotatedCadComponent.rotation?.z).toBeCloseTo(initialRotationZ + 90)
})
