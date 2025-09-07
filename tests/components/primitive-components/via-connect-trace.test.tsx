import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Ensure that manually placed vias expose layer-specific ports that traces can connect to
// e.g. Via1.top and Via1.bottom

test("via layers can be targeted by traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <via
        name="Via1"
        holeDiameter="0.1mm"
        outerDiameter="0.5mm"
        fromLayer="top"
        toLayer="bottom"
        pcbX={0}
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
      <trace from="C1.pin1" to="Via1.top" />
      <trace from="C1.pin2" to="Via1.bottom" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // When both traces are connected to the via's layer-specific ports,
  // two source traces should be registered in the database
  const traces = circuit.db.source_trace.list()
  expect(traces.length).toBe(2)
})
