"use client";

import { useJourneyController } from "./journey-gate.logic";

export default function JourneyGate() {
  useJourneyController();
  return null;
}
