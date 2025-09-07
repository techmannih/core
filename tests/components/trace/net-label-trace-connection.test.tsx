import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ports connected to nets via traces do not get extra net labels", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <trace from=".R1 > .pin1" to="net.GND" />
    </board>,
  )

  circuit.render()

  const labels = circuit.db.schematic_net_label.list()
  expect(labels).toHaveLength(1)

  const ports = circuit.db.schematic_port.list()
  expect(ports.filter((p) => p.is_connected)).toHaveLength(1)
})

