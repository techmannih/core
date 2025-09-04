import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Test successful routing to a specific via layer
test("trace connects to specified via layer", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" autorouter="sequential-trace">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <via name="Via1" pcbX={5} pcbY={0} />
      <trace from="R1.pin1" to="Via1.bottom" />
    </board>,
  )

  circuit.render()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBe(1)
  const route = pcbTraces[0].route
  // Expect a via route point at the via location
  expect(
    route.some(
      (p) =>
        p.route_type === "via" && p.x === 5 && p.y === 0 && p.to_layer === "bottom",
    ),
  ).toBe(true)
})

// Test invalid layer name
test("invalid via layer name produces error", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <via name="Via1" pcbX={0} pcbY={0} />
      <trace from="net.GND" to="Via1.inner9" />
    </board>,
  )

  expect(() => circuit.render()).toThrow(
    "Unknown via layer 'inner9' for Via1.",
  )
})

// Test layer not in via span
test("via layer outside span produces error", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" layers={4}>
      <via name="Via1" pcbX={0} pcbY={0} fromLayer="top" toLayer="inner2" />
      <trace from="net.GND" to="Via1.bottom" />
    </board>,
  )

  expect(() => circuit.render()).toThrow(
    "Layer 'bottom' not in Via1 span (top…inner2). Available: top, inner1, inner2.",
  )
})
