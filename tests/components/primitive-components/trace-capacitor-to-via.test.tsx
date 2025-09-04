import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace from capacitor to via pin snapshot", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group>
      <via
        name="Via1"
        fromLayer="top"
        toLayer="bottom"
        holeDiameter={0.1}
        outerDiameter={0.5}
        pcbX={-1}
        pcbY={0}
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        maxVoltageRating={6}
        footprint="0402"
        pcbX={1}
        pcbY={0}
      />
      <trace from="C1.pin1" to="Via1.pin1" />
    </group>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
