import { expect, test } from "bun:test";
import { portraitFallbackMask } from "./hero-portrait-mask";

// Fixed outputs from the public source CSS fallback, including its decimal rounding.
const sourceFixtures = [
  {
    label: "EN desktop",
    exit: 0.5,
    translateY: -36.352727696793,
    scale: 0.987925212962963,
    height: 950,
    expected:
      "linear-gradient(to bottom, rgb(0 0 0 / 1.00000) 29.519%, rgb(0 0 0 / 0.84400) 47.739%, rgb(0 0 0 / 0.50000) 65.959%, rgb(0 0 0 / 0.15600) 84.179%, transparent 102.399%)",
  },
  {
    label: "AR mobile portrait",
    exit: 0.6551724137931035,
    translateY: -26.22866618075802,
    scale: 0.9897777777777778,
    height: 865,
    expected:
      "linear-gradient(to bottom, rgb(0 0 0 / 1.00000) 3.680%, rgb(0 0 0 / 0.84400) 21.866%, rgb(0 0 0 / 0.50000) 40.052%, rgb(0 0 0 / 0.15600) 58.238%, transparent 76.424%)",
  },
  {
    label: "EN mobile landscape",
    exit: 0.4310344827586207,
    translateY: -8.047404434285713,
    scale: 0.99413155,
    height: 392,
    expected:
      "linear-gradient(to bottom, rgb(0 0 0 / 1.00000) 38.993%, rgb(0 0 0 / 0.84400) 57.100%, rgb(0 0 0 / 0.50000) 75.206%, rgb(0 0 0 / 0.15600) 93.312%, transparent 111.418%)",
  },
  {
    label: "AR wide landscape",
    exit: 0.810344827586207,
    translateY: -22.326139428571427,
    scale: 0.979035712962963,
    height: 392,
    expected:
      "linear-gradient(to bottom, rgb(0 0 0 / 1.00000) -19.522%, rgb(0 0 0 / 0.84400) -1.137%, rgb(0 0 0 / 0.50000) 17.249%, rgb(0 0 0 / 0.15600) 35.634%, transparent 54.020%)",
  },
  {
    label: "AR tablet portrait",
    exit: 0.8793103448275863,
    translateY: -69.96455999999999,
    scale: 0.9778661203703704,
    height: 1180,
    expected:
      "linear-gradient(to bottom, rgb(0 0 0 / 1.00000) -30.656%, rgb(0 0 0 / 0.84400) -12.249%, rgb(0 0 0 / 0.50000) 6.158%, rgb(0 0 0 / 0.15600) 24.566%, transparent 42.973%)",
  },
  {
    label: "tail opacity",
    exit: 0.96,
    translateY: -35.13465129657204,
    scale: 0.9862603020174222,
    height: 932,
    expected:
      "linear-gradient(to bottom, rgb(0 0 0 / 0.50000) -45.207%, rgb(0 0 0 / 0.42200) -26.956%, rgb(0 0 0 / 0.25000) -8.705%, rgb(0 0 0 / 0.07800) 9.545%, transparent 27.796%)",
  },
  {
    label: "fully faded",
    exit: 1,
    translateY: -57.949999999999996,
    scale: 0.977,
    height: 950,
    expected:
      "linear-gradient(to bottom, rgb(0 0 0 / 0.00000) -50.322%, rgb(0 0 0 / 0.00000) -31.899%, rgb(0 0 0 / 0.00000) -13.475%, rgb(0 0 0 / 0.00000) 4.949%, transparent 23.373%)",
  },
  {
    label: "rest/reverse",
    exit: 0,
    translateY: 0,
    scale: 1,
    height: 950,
    expected: "none",
  },
];

for (const fixture of sourceFixtures) {
  test(`portrait fallback matches source: ${fixture.label}`, () => {
    expect(
      portraitFallbackMask(
        fixture.exit,
        fixture.translateY,
        fixture.scale,
        fixture.height,
      ),
    ).toBe(fixture.expected);
  });
}
