export const calendarDesktopEdgeFixture = {
  today: "2026-08-01",
  events: [
    {
      title: "Top Left Corner Fixture",
      date: "2026-07-26",
      time: "9:00 AM",
      location: "ICM",
      description: "Desktop-only calendar geometry fixture for the top-left grid corner.",
    },
    {
      title: "Left Neighbor Fixture One",
      date: "2026-07-31",
      time: "5:00 PM",
      location: "ICM",
      description: "First event immediately left of the current-day corner fixture.",
    },
    {
      title: "Left Neighbor Fixture Two",
      date: "2026-07-31",
      time: "5:30 PM",
      location: "ICM",
      description: "Second event immediately left of the current-day corner fixture.",
    },
    {
      title: "Left Neighbor Fixture Three",
      date: "2026-07-31",
      time: "6:00 PM",
      location: "ICM",
      description: "Expansion event immediately left of the current-day corner fixture.",
    },
    {
      title: "Current Right Corner Fixture One",
      date: "2026-08-01",
      time: "6:30 PM",
      location: "ICM",
      description: "Current-day event placed in the top-right calendar corner.",
    },
    {
      title: "Current Right Corner Fixture Two",
      date: "2026-08-01",
      time: "7:00 PM",
      location: "ICM",
      description: "Second current-day event placed in the top-right calendar corner.",
    },
    {
      title: "Below Current Fixture One",
      date: "2026-08-08",
      time: "5:00 PM",
      location: "ICM",
      description: "First event directly below the current-day corner fixture.",
    },
    {
      title: "Below Current Fixture Two",
      date: "2026-08-08",
      time: "5:30 PM",
      location: "ICM",
      description: "Second event directly below the current-day corner fixture.",
    },
    {
      title: "Below Current Fixture Three",
      date: "2026-08-08",
      time: "6:00 PM",
      location: "ICM",
      description: "Expansion event directly below the current-day corner fixture.",
    },
    {
      title: "Bottom Left Corner Fixture",
      date: "2026-08-30",
      time: "9:00 AM",
      location: "ICM",
      description: "Desktop-only calendar geometry fixture for the bottom-left grid corner.",
    },
    {
      title: "Bottom Right Corner Fixture",
      date: "2026-09-05",
      time: "9:00 AM",
      location: "ICM",
      description: "Desktop-only calendar geometry fixture for the bottom-right grid corner.",
    },
  ],
};

const july2026GridStart = new Date(Date.UTC(2026, 5, 28));

const calendarPositionIndexes = {
  "top-left": 0,
  "top-middle": 3,
  "top-right": 6,
  "middle-left": 14,
  middle: 17,
  "middle-right": 20,
  "bottom-left": 28,
  "bottom-middle": 31,
  "bottom-right": 34,
};

function fixtureDateKey(gridIndex) {
  const date = new Date(july2026GridStart);
  date.setUTCDate(date.getUTCDate() + gridIndex);
  return date.toISOString().slice(0, 10);
}

function makePositionFixture(position, currentIndex) {
  const currentRow = Math.floor(currentIndex / 7);
  const currentColumn = currentIndex % 7;
  const events = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      const row = currentRow + rowOffset;
      const column = currentColumn + columnOffset;
      if (row < 0 || row > 4 || column < 0 || column > 6) continue;

      const date = fixtureDateKey(row * 7 + column);
      const isCurrent = rowOffset === 0 && columnOffset === 0;
      const label = isCurrent ? "Current Day" : "Surrounding Day";

      for (let eventNumber = 1; eventNumber <= 2; eventNumber += 1) {
        events.push({
          title: `${label} Test Event ${eventNumber}`,
          date,
          time: eventNumber === 1 ? "5:30 PM" : "7:00 PM",
          location: "ICM",
          description: `Temporary ${position.replaceAll("-", " ")} calendar position fixture.`,
        });
      }
    }
  }

  return {
    month: "2026-07-01",
    today: fixtureDateKey(currentIndex),
    events,
  };
}

export const calendarPositionFixtures = Object.fromEntries(
  Object.entries(calendarPositionIndexes).map(([position, currentIndex]) => [
    position,
    makePositionFixture(position, currentIndex),
  ]),
);
