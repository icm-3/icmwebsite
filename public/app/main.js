var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/adhan/lib/esm/Madhab.js
var Madhab = {
  Shafi: "shafi",
  Hanafi: "hanafi"
};
function shadowLength(madhab) {
  switch (madhab) {
    case Madhab.Shafi:
      return 1;
    case Madhab.Hanafi:
      return 2;
    default:
      throw "Invalid Madhab";
  }
}

// node_modules/adhan/lib/esm/HighLatitudeRule.js
var HighLatitudeRule = {
  MiddleOfTheNight: "middleofthenight",
  SeventhOfTheNight: "seventhofthenight",
  TwilightAngle: "twilightangle",
  recommended(coordinates) {
    if (coordinates.latitude > 48) {
      return HighLatitudeRule.SeventhOfTheNight;
    } else {
      return HighLatitudeRule.MiddleOfTheNight;
    }
  }
};
var HighLatitudeRule_default = HighLatitudeRule;

// node_modules/adhan/lib/esm/Coordinates.js
var Coordinates = class {
  constructor(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  }
};

// node_modules/adhan/lib/esm/Rounding.js
var Rounding = {
  Nearest: "nearest",
  Up: "up",
  None: "none"
};

// node_modules/adhan/lib/esm/DateUtils.js
function dateByAddingDays(date, days) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate() + days;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return new Date(year, month, day, hours, minutes, seconds);
}
function dateByAddingMinutes(date, minutes) {
  return dateByAddingSeconds(date, minutes * 60);
}
function dateByAddingSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * 1e3);
}
function roundedMinute(date, rounding = Rounding.Nearest) {
  const seconds = date.getUTCSeconds();
  let offset = seconds >= 30 ? 60 - seconds : -1 * seconds;
  if (rounding === Rounding.Up) {
    offset = 60 - seconds;
  } else if (rounding === Rounding.None) {
    offset = 0;
  }
  return dateByAddingSeconds(date, offset);
}
function isLeapYear(year) {
  if (year % 4 !== 0) {
    return false;
  }
  if (year % 100 === 0 && year % 400 !== 0) {
    return false;
  }
  return true;
}
function dayOfYear(date) {
  let returnedDayOfYear = 0;
  const feb = isLeapYear(date.getFullYear()) ? 29 : 28;
  const months = [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let i = 0; i < date.getMonth(); i++) {
    returnedDayOfYear += months[i];
  }
  returnedDayOfYear += date.getDate();
  return returnedDayOfYear;
}
function isValidDate(date) {
  return date instanceof Date && !isNaN(date.valueOf());
}

// node_modules/adhan/lib/esm/MathUtils.js
function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}
function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}
function normalizeToScale(num, max) {
  return num - max * Math.floor(num / max);
}
function unwindAngle(angle) {
  return normalizeToScale(angle, 360);
}
function quadrantShiftAngle(angle) {
  if (angle >= -180 && angle <= 180) {
    return angle;
  }
  return angle - 360 * Math.round(angle / 360);
}

// node_modules/adhan/lib/esm/Shafaq.js
var Shafaq = {
  // General is a combination of Ahmer and Abyad.
  General: "general",
  // Ahmer means the twilight is the red glow in the sky. Used by the Shafi, Maliki, and Hanbali madhabs.
  Ahmer: "ahmer",
  // Abyad means the twilight is the white glow in the sky. Used by the Hanafi madhab.
  Abyad: "abyad"
};

// node_modules/adhan/lib/esm/Astronomical.js
var Astronomical = {
  /* The geometric mean longitude of the sun in degrees. */
  meanSolarLongitude(julianCentury) {
    const T = julianCentury;
    const term1 = 280.4664567;
    const term2 = 36000.76983 * T;
    const term3 = 3032e-7 * Math.pow(T, 2);
    const L0 = term1 + term2 + term3;
    return unwindAngle(L0);
  },
  /* The geometric mean longitude of the moon in degrees. */
  meanLunarLongitude(julianCentury) {
    const T = julianCentury;
    const term1 = 218.3165;
    const term2 = 481267.8813 * T;
    const Lp = term1 + term2;
    return unwindAngle(Lp);
  },
  ascendingLunarNodeLongitude(julianCentury) {
    const T = julianCentury;
    const term1 = 125.04452;
    const term2 = 1934.136261 * T;
    const term3 = 20708e-7 * Math.pow(T, 2);
    const term4 = Math.pow(T, 3) / 45e4;
    const Omega = term1 - term2 + term3 + term4;
    return unwindAngle(Omega);
  },
  /* The mean anomaly of the sun. */
  meanSolarAnomaly(julianCentury) {
    const T = julianCentury;
    const term1 = 357.52911;
    const term2 = 35999.05029 * T;
    const term3 = 1537e-7 * Math.pow(T, 2);
    const M = term1 + term2 - term3;
    return unwindAngle(M);
  },
  /* The Sun's equation of the center in degrees. */
  solarEquationOfTheCenter(julianCentury, meanAnomaly) {
    const T = julianCentury;
    const Mrad = degreesToRadians(meanAnomaly);
    const term1 = (1.914602 - 4817e-6 * T - 14e-6 * Math.pow(T, 2)) * Math.sin(Mrad);
    const term2 = (0.019993 - 101e-6 * T) * Math.sin(2 * Mrad);
    const term3 = 289e-6 * Math.sin(3 * Mrad);
    return term1 + term2 + term3;
  },
  /* The apparent longitude of the Sun, referred to the
        true equinox of the date. */
  apparentSolarLongitude(julianCentury, meanLongitude) {
    const T = julianCentury;
    const L0 = meanLongitude;
    const longitude = L0 + Astronomical.solarEquationOfTheCenter(T, Astronomical.meanSolarAnomaly(T));
    const Omega = 125.04 - 1934.136 * T;
    const Lambda = longitude - 569e-5 - 478e-5 * Math.sin(degreesToRadians(Omega));
    return unwindAngle(Lambda);
  },
  /* The mean obliquity of the ecliptic, formula
        adopted by the International Astronomical Union.
        Represented in degrees. */
  meanObliquityOfTheEcliptic(julianCentury) {
    const T = julianCentury;
    const term1 = 23.439291;
    const term2 = 0.013004167 * T;
    const term3 = 1639e-10 * Math.pow(T, 2);
    const term4 = 5036e-10 * Math.pow(T, 3);
    return term1 - term2 - term3 + term4;
  },
  /* The mean obliquity of the ecliptic, corrected for
        calculating the apparent position of the sun, in degrees. */
  apparentObliquityOfTheEcliptic(julianCentury, meanObliquityOfTheEcliptic) {
    const T = julianCentury;
    const Epsilon0 = meanObliquityOfTheEcliptic;
    const O = 125.04 - 1934.136 * T;
    return Epsilon0 + 256e-5 * Math.cos(degreesToRadians(O));
  },
  /* Mean sidereal time, the hour angle of the vernal equinox, in degrees. */
  meanSiderealTime(julianCentury) {
    const T = julianCentury;
    const JD = T * 36525 + 2451545;
    const term1 = 280.46061837;
    const term2 = 360.98564736629 * (JD - 2451545);
    const term3 = 387933e-9 * Math.pow(T, 2);
    const term4 = Math.pow(T, 3) / 3871e4;
    const Theta = term1 + term2 + term3 - term4;
    return unwindAngle(Theta);
  },
  nutationInLongitude(julianCentury, solarLongitude, lunarLongitude, ascendingNode) {
    const L0 = solarLongitude;
    const Lp = lunarLongitude;
    const Omega = ascendingNode;
    const term1 = -17.2 / 3600 * Math.sin(degreesToRadians(Omega));
    const term2 = 1.32 / 3600 * Math.sin(2 * degreesToRadians(L0));
    const term3 = 0.23 / 3600 * Math.sin(2 * degreesToRadians(Lp));
    const term4 = 0.21 / 3600 * Math.sin(2 * degreesToRadians(Omega));
    return term1 - term2 - term3 + term4;
  },
  nutationInObliquity(julianCentury, solarLongitude, lunarLongitude, ascendingNode) {
    const L0 = solarLongitude;
    const Lp = lunarLongitude;
    const Omega = ascendingNode;
    const term1 = 9.2 / 3600 * Math.cos(degreesToRadians(Omega));
    const term2 = 0.57 / 3600 * Math.cos(2 * degreesToRadians(L0));
    const term3 = 0.1 / 3600 * Math.cos(2 * degreesToRadians(Lp));
    const term4 = 0.09 / 3600 * Math.cos(2 * degreesToRadians(Omega));
    return term1 + term2 + term3 - term4;
  },
  altitudeOfCelestialBody(observerLatitude, declination, localHourAngle) {
    const Phi = observerLatitude;
    const delta = declination;
    const H = localHourAngle;
    const term1 = Math.sin(degreesToRadians(Phi)) * Math.sin(degreesToRadians(delta));
    const term2 = Math.cos(degreesToRadians(Phi)) * Math.cos(degreesToRadians(delta)) * Math.cos(degreesToRadians(H));
    return radiansToDegrees(Math.asin(term1 + term2));
  },
  approximateTransit(longitude, siderealTime, rightAscension) {
    const L = longitude;
    const Theta0 = siderealTime;
    const a2 = rightAscension;
    const Lw = L * -1;
    const m0 = normalizeToScale((a2 + Lw - Theta0) / 360, 1);
    const expectedTransit = normalizeToScale((12 - L / 15) / 24, 1);
    if (m0 - expectedTransit > 0.5) {
      return m0 - 1;
    } else if (expectedTransit - m0 > 0.5) {
      return m0 + 1;
    } else {
      return m0;
    }
  },
  /* The time at which the sun is at its highest point in the sky (in universal time) */
  correctedTransit(approximateTransit, longitude, siderealTime, rightAscension, previousRightAscension, nextRightAscension) {
    const m0 = approximateTransit;
    const L = longitude;
    const Theta0 = siderealTime;
    const a2 = rightAscension;
    const a1 = previousRightAscension;
    const a3 = nextRightAscension;
    const Lw = L * -1;
    const Theta = unwindAngle(Theta0 + 360.985647 * m0);
    const a = unwindAngle(Astronomical.interpolateAngles(a2, a1, a3, m0));
    const H = quadrantShiftAngle(Theta - Lw - a);
    const dm = H / -360;
    return (m0 + dm) * 24;
  },
  correctedHourAngle(approximateTransit, angle, coordinates, afterTransit, siderealTime, rightAscension, previousRightAscension, nextRightAscension, declination, previousDeclination, nextDeclination) {
    const m0 = approximateTransit;
    const h0 = angle;
    const Theta0 = siderealTime;
    const a2 = rightAscension;
    const a1 = previousRightAscension;
    const a3 = nextRightAscension;
    const d2 = declination;
    const d1 = previousDeclination;
    const d3 = nextDeclination;
    const Lw = coordinates.longitude * -1;
    const term1 = Math.sin(degreesToRadians(h0)) - Math.sin(degreesToRadians(coordinates.latitude)) * Math.sin(degreesToRadians(d2));
    const term2 = Math.cos(degreesToRadians(coordinates.latitude)) * Math.cos(degreesToRadians(d2));
    const H0 = radiansToDegrees(Math.acos(term1 / term2));
    const m = afterTransit ? m0 + H0 / 360 : m0 - H0 / 360;
    const Theta = unwindAngle(Theta0 + 360.985647 * m);
    const a = unwindAngle(Astronomical.interpolateAngles(a2, a1, a3, m));
    const delta = Astronomical.interpolate(d2, d1, d3, m);
    const H = Theta - Lw - a;
    const h = Astronomical.altitudeOfCelestialBody(coordinates.latitude, delta, H);
    const term3 = h - h0;
    const term4 = 360 * Math.cos(degreesToRadians(delta)) * Math.cos(degreesToRadians(coordinates.latitude)) * Math.sin(degreesToRadians(H));
    const dm = term3 / term4;
    return (m + dm) * 24;
  },
  /* Interpolation of a value given equidistant
        previous and next values and a factor
        equal to the fraction of the interpolated
        point's time over the time between values. */
  interpolate(y2, y1, y3, n) {
    const a = y2 - y1;
    const b = y3 - y2;
    const c = b - a;
    return y2 + n / 2 * (a + b + n * c);
  },
  /* Interpolation of three angles, accounting for
        angle unwinding. */
  interpolateAngles(y2, y1, y3, n) {
    const a = unwindAngle(y2 - y1);
    const b = unwindAngle(y3 - y2);
    const c = b - a;
    return y2 + n / 2 * (a + b + n * c);
  },
  /* The Julian Day for the given Gregorian date components. */
  julianDay(year, month, day, hours = 0) {
    const trunc = Math.trunc;
    const Y = trunc(month > 2 ? year : year - 1);
    const M = trunc(month > 2 ? month : month + 12);
    const D = day + hours / 24;
    const A = trunc(Y / 100);
    const B = trunc(2 - A + trunc(A / 4));
    const i0 = trunc(365.25 * (Y + 4716));
    const i1 = trunc(30.6001 * (M + 1));
    return i0 + i1 + D + B - 1524.5;
  },
  /* Julian century from the epoch. */
  julianCentury(julianDay) {
    return (julianDay - 2451545) / 36525;
  },
  seasonAdjustedMorningTwilight(latitude, dayOfYear2, year, sunrise) {
    const a = 75 + 28.65 / 55 * Math.abs(latitude);
    const b = 75 + 19.44 / 55 * Math.abs(latitude);
    const c = 75 + 32.74 / 55 * Math.abs(latitude);
    const d = 75 + 48.1 / 55 * Math.abs(latitude);
    const adjustment = (function() {
      const dyy = Astronomical.daysSinceSolstice(dayOfYear2, year, latitude);
      if (dyy < 91) {
        return a + (b - a) / 91 * dyy;
      } else if (dyy < 137) {
        return b + (c - b) / 46 * (dyy - 91);
      } else if (dyy < 183) {
        return c + (d - c) / 46 * (dyy - 137);
      } else if (dyy < 229) {
        return d + (c - d) / 46 * (dyy - 183);
      } else if (dyy < 275) {
        return c + (b - c) / 46 * (dyy - 229);
      } else {
        return b + (a - b) / 91 * (dyy - 275);
      }
    })();
    return dateByAddingSeconds(sunrise, Math.round(adjustment * -60));
  },
  seasonAdjustedEveningTwilight(latitude, dayOfYear2, year, sunset, shafaq) {
    let a, b, c, d;
    if (shafaq === Shafaq.Ahmer) {
      a = 62 + 17.4 / 55 * Math.abs(latitude);
      b = 62 - 7.16 / 55 * Math.abs(latitude);
      c = 62 + 5.12 / 55 * Math.abs(latitude);
      d = 62 + 19.44 / 55 * Math.abs(latitude);
    } else if (shafaq === Shafaq.Abyad) {
      a = 75 + 25.6 / 55 * Math.abs(latitude);
      b = 75 + 7.16 / 55 * Math.abs(latitude);
      c = 75 + 36.84 / 55 * Math.abs(latitude);
      d = 75 + 81.84 / 55 * Math.abs(latitude);
    } else {
      a = 75 + 25.6 / 55 * Math.abs(latitude);
      b = 75 + 2.05 / 55 * Math.abs(latitude);
      c = 75 - 9.21 / 55 * Math.abs(latitude);
      d = 75 + 6.14 / 55 * Math.abs(latitude);
    }
    const adjustment = (function() {
      const dyy = Astronomical.daysSinceSolstice(dayOfYear2, year, latitude);
      if (dyy < 91) {
        return a + (b - a) / 91 * dyy;
      } else if (dyy < 137) {
        return b + (c - b) / 46 * (dyy - 91);
      } else if (dyy < 183) {
        return c + (d - c) / 46 * (dyy - 137);
      } else if (dyy < 229) {
        return d + (c - d) / 46 * (dyy - 183);
      } else if (dyy < 275) {
        return c + (b - c) / 46 * (dyy - 229);
      } else {
        return b + (a - b) / 91 * (dyy - 275);
      }
    })();
    return dateByAddingSeconds(sunset, Math.round(adjustment * 60));
  },
  daysSinceSolstice(dayOfYear2, year, latitude) {
    let daysSinceSolstice;
    const northernOffset = 10;
    const southernOffset = isLeapYear(year) ? 173 : 172;
    const daysInYear = isLeapYear(year) ? 366 : 365;
    if (latitude >= 0) {
      daysSinceSolstice = dayOfYear2 + northernOffset;
      if (daysSinceSolstice >= daysInYear) {
        daysSinceSolstice = daysSinceSolstice - daysInYear;
      }
    } else {
      daysSinceSolstice = dayOfYear2 - southernOffset;
      if (daysSinceSolstice < 0) {
        daysSinceSolstice = daysSinceSolstice + daysInYear;
      }
    }
    return daysSinceSolstice;
  }
};
var Astronomical_default = Astronomical;

// node_modules/adhan/lib/esm/SolarCoordinates.js
var SolarCoordinates = class {
  constructor(julianDay) {
    const T = Astronomical_default.julianCentury(julianDay);
    const L0 = Astronomical_default.meanSolarLongitude(T);
    const Lp = Astronomical_default.meanLunarLongitude(T);
    const Omega = Astronomical_default.ascendingLunarNodeLongitude(T);
    const Lambda = degreesToRadians(Astronomical_default.apparentSolarLongitude(T, L0));
    const Theta0 = Astronomical_default.meanSiderealTime(T);
    const dPsi = Astronomical_default.nutationInLongitude(T, L0, Lp, Omega);
    const dEpsilon = Astronomical_default.nutationInObliquity(T, L0, Lp, Omega);
    const Epsilon0 = Astronomical_default.meanObliquityOfTheEcliptic(T);
    const EpsilonApparent = degreesToRadians(Astronomical_default.apparentObliquityOfTheEcliptic(T, Epsilon0));
    this.declination = radiansToDegrees(Math.asin(Math.sin(EpsilonApparent) * Math.sin(Lambda)));
    this.rightAscension = unwindAngle(radiansToDegrees(Math.atan2(Math.cos(EpsilonApparent) * Math.sin(Lambda), Math.cos(Lambda))));
    this.apparentSiderealTime = Theta0 + dPsi * 3600 * Math.cos(degreesToRadians(Epsilon0 + dEpsilon)) / 3600;
  }
};

// node_modules/adhan/lib/esm/SolarTime.js
var SolarTime = class {
  constructor(date, coordinates) {
    const julianDay = Astronomical_default.julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate(), 0);
    this.observer = coordinates;
    this.solar = new SolarCoordinates(julianDay);
    this.prevSolar = new SolarCoordinates(julianDay - 1);
    this.nextSolar = new SolarCoordinates(julianDay + 1);
    const m0 = Astronomical_default.approximateTransit(coordinates.longitude, this.solar.apparentSiderealTime, this.solar.rightAscension);
    const solarAltitude = -50 / 60;
    this.approxTransit = m0;
    this.transit = Astronomical_default.correctedTransit(m0, coordinates.longitude, this.solar.apparentSiderealTime, this.solar.rightAscension, this.prevSolar.rightAscension, this.nextSolar.rightAscension);
    this.sunrise = Astronomical_default.correctedHourAngle(m0, solarAltitude, coordinates, false, this.solar.apparentSiderealTime, this.solar.rightAscension, this.prevSolar.rightAscension, this.nextSolar.rightAscension, this.solar.declination, this.prevSolar.declination, this.nextSolar.declination);
    this.sunset = Astronomical_default.correctedHourAngle(m0, solarAltitude, coordinates, true, this.solar.apparentSiderealTime, this.solar.rightAscension, this.prevSolar.rightAscension, this.nextSolar.rightAscension, this.solar.declination, this.prevSolar.declination, this.nextSolar.declination);
  }
  hourAngle(angle, afterTransit) {
    return Astronomical_default.correctedHourAngle(this.approxTransit, angle, this.observer, afterTransit, this.solar.apparentSiderealTime, this.solar.rightAscension, this.prevSolar.rightAscension, this.nextSolar.rightAscension, this.solar.declination, this.prevSolar.declination, this.nextSolar.declination);
  }
  afternoon(shadowLength2) {
    const tangent = Math.abs(this.observer.latitude - this.solar.declination);
    const inverse = shadowLength2 + Math.tan(degreesToRadians(tangent));
    const angle = radiansToDegrees(Math.atan(1 / inverse));
    return this.hourAngle(angle, true);
  }
};

// node_modules/adhan/lib/esm/PolarCircleResolution.js
var PolarCircleResolution = {
  AqrabBalad: "AqrabBalad",
  AqrabYaum: "AqrabYaum",
  Unresolved: "Unresolved"
};
var LATITUDE_VARIATION_STEP = 0.5;
var UNSAFE_LATITUDE = 65;
var isValidSolarTime = (solarTime) => !isNaN(solarTime.sunrise) && !isNaN(solarTime.sunset);
var aqrabYaumResolver = (coordinates, date, daysAdded = 1, direction = 1) => {
  if (daysAdded > Math.ceil(365 / 2)) {
    return null;
  }
  const testDate = new Date(date.getTime());
  testDate.setDate(testDate.getDate() + direction * daysAdded);
  const tomorrow = dateByAddingDays(testDate, 1);
  const solarTime = new SolarTime(testDate, coordinates);
  const tomorrowSolarTime = new SolarTime(tomorrow, coordinates);
  if (!isValidSolarTime(solarTime) || !isValidSolarTime(tomorrowSolarTime)) {
    return aqrabYaumResolver(coordinates, date, daysAdded + (direction > 0 ? 0 : 1), -direction);
  }
  return {
    date,
    tomorrow,
    coordinates,
    solarTime,
    tomorrowSolarTime
  };
};
var aqrabBaladResolver = (coordinates, date, latitude) => {
  const solarTime = new SolarTime(date, {
    ...coordinates,
    latitude
  });
  const tomorrow = dateByAddingDays(date, 1);
  const tomorrowSolarTime = new SolarTime(tomorrow, {
    ...coordinates,
    latitude
  });
  if (!isValidSolarTime(solarTime) || !isValidSolarTime(tomorrowSolarTime)) {
    return Math.abs(latitude) >= UNSAFE_LATITUDE ? aqrabBaladResolver(coordinates, date, latitude - Math.sign(latitude) * LATITUDE_VARIATION_STEP) : null;
  }
  return {
    date,
    tomorrow,
    coordinates: new Coordinates(latitude, coordinates.longitude),
    solarTime,
    tomorrowSolarTime
  };
};
var polarCircleResolvedValues = (resolver, date, coordinates) => {
  const defaultReturn = {
    date,
    tomorrow: dateByAddingDays(date, 1),
    coordinates,
    solarTime: new SolarTime(date, coordinates),
    tomorrowSolarTime: new SolarTime(dateByAddingDays(date, 1), coordinates)
  };
  switch (resolver) {
    case PolarCircleResolution.AqrabYaum: {
      return aqrabYaumResolver(coordinates, date) || defaultReturn;
    }
    case PolarCircleResolution.AqrabBalad: {
      const {
        latitude
      } = coordinates;
      return aqrabBaladResolver(coordinates, date, latitude - Math.sign(latitude) * LATITUDE_VARIATION_STEP) || defaultReturn;
    }
    default: {
      return defaultReturn;
    }
  }
};

// node_modules/adhan/lib/esm/CalculationParameters.js
var CalculationParameters = class {
  constructor(method, fajrAngle = 0, ishaAngle = 0, ishaInterval = 0, maghribAngle = 0) {
    // Madhab to determine how Asr is calculated.
    __publicField(this, "madhab", Madhab.Shafi);
    // Rule to determine the earliest time for Fajr and latest time for Isha
    // needed for high latitude locations where Fajr and Isha may not truly exist
    // or may present a hardship unless bound to a reasonable time.
    __publicField(this, "highLatitudeRule", HighLatitudeRule_default.MiddleOfTheNight);
    // Manual adjustments (in minutes) to be added to each prayer time.
    __publicField(this, "adjustments", {
      fajr: 0,
      sunrise: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0
    });
    // Adjustments set by a calculation method. This value should not be manually modified.
    __publicField(this, "methodAdjustments", {
      fajr: 0,
      sunrise: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0
    });
    // Rule to determine how to resolve prayer times inside the Polar Circle
    // where daylight or night may persist for more than 24 hours depending
    // on the season
    __publicField(this, "polarCircleResolution", PolarCircleResolution.Unresolved);
    // How seconds are rounded when calculating prayer times
    __publicField(this, "rounding", Rounding.Nearest);
    // Used by the MoonsightingCommittee method to determine how to calculate Isha
    __publicField(this, "shafaq", Shafaq.General);
    this.method = method;
    this.fajrAngle = fajrAngle;
    this.ishaAngle = ishaAngle;
    this.ishaInterval = ishaInterval;
    this.maghribAngle = maghribAngle;
    if (this.method === null) {
      this.method = "Other";
    }
  }
  nightPortions() {
    switch (this.highLatitudeRule) {
      case HighLatitudeRule_default.MiddleOfTheNight:
        return {
          fajr: 1 / 2,
          isha: 1 / 2
        };
      case HighLatitudeRule_default.SeventhOfTheNight:
        return {
          fajr: 1 / 7,
          isha: 1 / 7
        };
      case HighLatitudeRule_default.TwilightAngle:
        return {
          fajr: this.fajrAngle / 60,
          isha: this.ishaAngle / 60
        };
      default:
        throw `Invalid high latitude rule found when attempting to compute night portions: ${this.highLatitudeRule}`;
    }
  }
};

// node_modules/adhan/lib/esm/CalculationMethod.js
var CalculationMethod = {
  // Muslim World League
  MuslimWorldLeague() {
    const params = new CalculationParameters("MuslimWorldLeague", 18, 17);
    params.methodAdjustments.dhuhr = 1;
    return params;
  },
  // Egyptian General Authority of Survey
  Egyptian() {
    const params = new CalculationParameters("Egyptian", 19.5, 17.5);
    params.methodAdjustments.dhuhr = 1;
    return params;
  },
  // University of Islamic Sciences, Karachi
  Karachi() {
    const params = new CalculationParameters("Karachi", 18, 18);
    params.methodAdjustments.dhuhr = 1;
    return params;
  },
  // Umm al-Qura University, Makkah
  UmmAlQura() {
    return new CalculationParameters("UmmAlQura", 18.5, 0, 90);
  },
  // Dubai
  Dubai() {
    const params = new CalculationParameters("Dubai", 18.2, 18.2);
    params.methodAdjustments = {
      ...params.methodAdjustments,
      sunrise: -3,
      dhuhr: 3,
      asr: 3,
      maghrib: 3
    };
    return params;
  },
  // Moonsighting Committee
  MoonsightingCommittee() {
    const params = new CalculationParameters("MoonsightingCommittee", 18, 18);
    params.methodAdjustments = {
      ...params.methodAdjustments,
      dhuhr: 5,
      maghrib: 3
    };
    return params;
  },
  // ISNA
  NorthAmerica() {
    const params = new CalculationParameters("NorthAmerica", 15, 15);
    params.methodAdjustments.dhuhr = 1;
    return params;
  },
  // Kuwait
  Kuwait() {
    return new CalculationParameters("Kuwait", 18, 17.5);
  },
  // Qatar
  Qatar() {
    return new CalculationParameters("Qatar", 18, 0, 90);
  },
  // Singapore
  Singapore() {
    const params = new CalculationParameters("Singapore", 20, 18);
    params.methodAdjustments.dhuhr = 1;
    params.rounding = Rounding.Up;
    return params;
  },
  // Institute of Geophysics, University of Tehran
  Tehran() {
    const params = new CalculationParameters("Tehran", 17.7, 14, 0, 4.5);
    return params;
  },
  // Dianet
  Turkey() {
    const params = new CalculationParameters("Turkey", 18, 17);
    params.methodAdjustments = {
      ...params.methodAdjustments,
      sunrise: -7,
      dhuhr: 5,
      asr: 4,
      maghrib: 7
    };
    return params;
  },
  // Other
  Other() {
    return new CalculationParameters("Other", 0, 0);
  }
};
var CalculationMethod_default = CalculationMethod;

// node_modules/adhan/lib/esm/Prayer.js
var Prayer = {
  Fajr: "fajr",
  Sunrise: "sunrise",
  Dhuhr: "dhuhr",
  Asr: "asr",
  Maghrib: "maghrib",
  Isha: "isha",
  None: "none"
};
var Prayer_default = Prayer;

// node_modules/adhan/lib/esm/TimeComponents.js
var TimeComponents = class {
  constructor(num) {
    this.hours = Math.floor(num);
    this.minutes = Math.floor((num - this.hours) * 60);
    this.seconds = Math.floor((num - (this.hours + this.minutes / 60)) * 60 * 60);
    return this;
  }
  utcDate(year, month, date) {
    return new Date(Date.UTC(year, month, date, this.hours, this.minutes, this.seconds));
  }
};

// node_modules/adhan/lib/esm/PrayerTimes.js
var PrayerTimes = class {
  constructor(coordinates, date, calculationParameters) {
    this.coordinates = coordinates;
    this.date = date;
    this.calculationParameters = calculationParameters;
    let solarTime = new SolarTime(date, coordinates);
    let fajrTime;
    let sunriseTime;
    let dhuhrTime;
    let asrTime;
    let sunsetTime;
    let maghribTime;
    let ishaTime;
    let nightFraction;
    dhuhrTime = new TimeComponents(solarTime.transit).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
    sunriseTime = new TimeComponents(solarTime.sunrise).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
    sunsetTime = new TimeComponents(solarTime.sunset).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
    const tomorrow = dateByAddingDays(date, 1);
    let tomorrowSolarTime = new SolarTime(tomorrow, coordinates);
    const polarCircleResolver = calculationParameters.polarCircleResolution;
    if ((!isValidDate(sunriseTime) || !isValidDate(sunsetTime) || isNaN(tomorrowSolarTime.sunrise)) && polarCircleResolver !== PolarCircleResolution.Unresolved) {
      const resolved = polarCircleResolvedValues(polarCircleResolver, date, coordinates);
      solarTime = resolved.solarTime;
      tomorrowSolarTime = resolved.tomorrowSolarTime;
      const dateComponents = [date.getFullYear(), date.getMonth(), date.getDate()];
      dhuhrTime = new TimeComponents(solarTime.transit).utcDate(...dateComponents);
      sunriseTime = new TimeComponents(solarTime.sunrise).utcDate(...dateComponents);
      sunsetTime = new TimeComponents(solarTime.sunset).utcDate(...dateComponents);
    }
    asrTime = new TimeComponents(solarTime.afternoon(shadowLength(calculationParameters.madhab))).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
    const tomorrowSunrise = new TimeComponents(tomorrowSolarTime.sunrise).utcDate(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const night = (Number(tomorrowSunrise) - Number(sunsetTime)) / 1e3;
    fajrTime = new TimeComponents(solarTime.hourAngle(-1 * calculationParameters.fajrAngle, false)).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
    if (calculationParameters.method === "MoonsightingCommittee" && coordinates.latitude >= 55) {
      nightFraction = night / 7;
      fajrTime = dateByAddingSeconds(sunriseTime, -nightFraction);
    }
    const safeFajr = (function() {
      if (calculationParameters.method === "MoonsightingCommittee") {
        return Astronomical_default.seasonAdjustedMorningTwilight(coordinates.latitude, dayOfYear(date), date.getFullYear(), sunriseTime);
      } else {
        const portion = calculationParameters.nightPortions().fajr;
        nightFraction = portion * night;
        return dateByAddingSeconds(sunriseTime, -nightFraction);
      }
    })();
    if (isNaN(fajrTime.getTime()) || safeFajr > fajrTime) {
      fajrTime = safeFajr;
    }
    if (calculationParameters.ishaInterval > 0) {
      ishaTime = dateByAddingMinutes(sunsetTime, calculationParameters.ishaInterval);
    } else {
      ishaTime = new TimeComponents(solarTime.hourAngle(-1 * calculationParameters.ishaAngle, true)).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
      if (calculationParameters.method === "MoonsightingCommittee" && coordinates.latitude >= 55) {
        nightFraction = night / 7;
        ishaTime = dateByAddingSeconds(sunsetTime, nightFraction);
      }
      const safeIsha = (function() {
        if (calculationParameters.method === "MoonsightingCommittee") {
          return Astronomical_default.seasonAdjustedEveningTwilight(coordinates.latitude, dayOfYear(date), date.getFullYear(), sunsetTime, calculationParameters.shafaq);
        } else {
          const portion = calculationParameters.nightPortions().isha;
          nightFraction = portion * night;
          return dateByAddingSeconds(sunsetTime, nightFraction);
        }
      })();
      if (isNaN(ishaTime.getTime()) || safeIsha < ishaTime) {
        ishaTime = safeIsha;
      }
    }
    maghribTime = sunsetTime;
    if (calculationParameters.maghribAngle) {
      const angleBasedMaghrib = new TimeComponents(solarTime.hourAngle(-1 * calculationParameters.maghribAngle, true)).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
      if (sunsetTime < angleBasedMaghrib && ishaTime > angleBasedMaghrib) {
        maghribTime = angleBasedMaghrib;
      }
    }
    const fajrAdjustment = (calculationParameters.adjustments.fajr || 0) + (calculationParameters.methodAdjustments.fajr || 0);
    const sunriseAdjustment = (calculationParameters.adjustments.sunrise || 0) + (calculationParameters.methodAdjustments.sunrise || 0);
    const dhuhrAdjustment = (calculationParameters.adjustments.dhuhr || 0) + (calculationParameters.methodAdjustments.dhuhr || 0);
    const asrAdjustment = (calculationParameters.adjustments.asr || 0) + (calculationParameters.methodAdjustments.asr || 0);
    const maghribAdjustment = (calculationParameters.adjustments.maghrib || 0) + (calculationParameters.methodAdjustments.maghrib || 0);
    const ishaAdjustment = (calculationParameters.adjustments.isha || 0) + (calculationParameters.methodAdjustments.isha || 0);
    this.fajr = roundedMinute(dateByAddingMinutes(fajrTime, fajrAdjustment), calculationParameters.rounding);
    this.sunrise = roundedMinute(dateByAddingMinutes(sunriseTime, sunriseAdjustment), calculationParameters.rounding);
    this.dhuhr = roundedMinute(dateByAddingMinutes(dhuhrTime, dhuhrAdjustment), calculationParameters.rounding);
    this.asr = roundedMinute(dateByAddingMinutes(asrTime, asrAdjustment), calculationParameters.rounding);
    this.sunset = roundedMinute(sunsetTime, calculationParameters.rounding);
    this.maghrib = roundedMinute(dateByAddingMinutes(maghribTime, maghribAdjustment), calculationParameters.rounding);
    this.isha = roundedMinute(dateByAddingMinutes(ishaTime, ishaAdjustment), calculationParameters.rounding);
  }
  timeForPrayer(prayer) {
    if (prayer === Prayer_default.Fajr) {
      return this.fajr;
    } else if (prayer === Prayer_default.Sunrise) {
      return this.sunrise;
    } else if (prayer === Prayer_default.Dhuhr) {
      return this.dhuhr;
    } else if (prayer === Prayer_default.Asr) {
      return this.asr;
    } else if (prayer === Prayer_default.Maghrib) {
      return this.maghrib;
    } else if (prayer === Prayer_default.Isha) {
      return this.isha;
    } else {
      return null;
    }
  }
  currentPrayer(date = /* @__PURE__ */ new Date()) {
    if (date >= this.isha) {
      return Prayer_default.Isha;
    } else if (date >= this.maghrib) {
      return Prayer_default.Maghrib;
    } else if (date >= this.asr) {
      return Prayer_default.Asr;
    } else if (date >= this.dhuhr) {
      return Prayer_default.Dhuhr;
    } else if (date >= this.sunrise) {
      return Prayer_default.Sunrise;
    } else if (date >= this.fajr) {
      return Prayer_default.Fajr;
    } else {
      return Prayer_default.None;
    }
  }
  nextPrayer(date = /* @__PURE__ */ new Date()) {
    if (date >= this.isha) {
      return Prayer_default.None;
    } else if (date >= this.maghrib) {
      return Prayer_default.Isha;
    } else if (date >= this.asr) {
      return Prayer_default.Maghrib;
    } else if (date >= this.dhuhr) {
      return Prayer_default.Asr;
    } else if (date >= this.sunrise) {
      return Prayer_default.Dhuhr;
    } else if (date >= this.fajr) {
      return Prayer_default.Sunrise;
    } else {
      return Prayer_default.Fajr;
    }
  }
};

// src/default-content.js
var defaultContent = {
  "hero": {
    "image": "./public/images/masjid-interior-hero-clean.png",
    "imageAlt": "Islamic Center of Morrisville main prayer hall interior with carpet rows, qibla wall, and open worship space for homepage image alt text testing"
  },
  "jummah": {
    "dateLabel": "Wednesday, September 30, 2026",
    "shifts": [
      {
        "shift": "1",
        "time": "1:00 PM",
        "speaker": "Shaykh Muhammad Abdul Rahman Al Morrisville",
        "topic": "Community Khutbah"
      },
      {
        "shift": "2",
        "time": "2:00 PM",
        "speaker": "Imam Abdul Latif Hasan Al Qasimi",
        "topic": "Building Strong Families Through Prayer, Youth Education, And Weekly Community Service"
      },
      {
        "shift": "3",
        "time": "3:00 PM",
        "speaker": "Shaykh Umair Haseeb And Community Guests",
        "topic": "Youth Reminder"
      },
      {
        "shift": "4",
        "time": "4:00 PM",
        "speaker": "Imam Manzar ul Islam And Youth Mentors",
        "topic": "Serving Families With Patience, Mercy, Steadfast Faith, Community Care, And Daily Worship"
      }
    ]
  },
  "events": [
    {
      "title": "June 6 Calendar Edge Test",
      "date": "2026-06-06",
      "time": "10:00 AM",
      "location": "ICM",
      "description": "Temporary calendar fixture for checking the June 6 Saturday current-day border.",
      "poster": "./public/news/icm-live/friday-announcements-june-19-2026.png",
      "posterAlt": "ICM Friday Announcements flyer"
    },
    {
      "title": "Sunday 31 Calendar Edge Test",
      "date": "2026-05-31",
      "time": "11:00 AM",
      "location": "ICM",
      "description": "Temporary calendar fixture for checking the Sunday 31 top-left calendar border.",
      "poster": "./public/news/icm-live/friday-announcements-june-19-2026.png",
      "posterAlt": "ICM Friday Announcements flyer"
    },
    {
      "title": "Sunday 31 Second Event Test",
      "date": "2026-05-31",
      "time": "12:00 PM",
      "location": "ICM",
      "description": "Second temporary calendar fixture for checking stacked events on Sunday 31.",
      "poster": "./public/news/icm-live/friday-bukhari-circle.jpeg",
      "posterAlt": "ICM Friday Night Bukhari Circle flyer"
    },
    {
      "title": "June 31 Calendar Normalization Test",
      "date": "2026-06-31",
      "time": "7:00 PM",
      "location": "ICM",
      "description": "Temporary calendar fixture requested for June 31; JavaScript normalizes this invalid date to July 1.",
      "poster": "./public/news/icm-live/friday-bukhari-circle.jpeg",
      "posterAlt": "ICM Friday Night Bukhari Circle flyer"
    },
    {
      "title": "Tuesday Quran Study Circle And Community Reflections",
      "date": "2026-06-28",
      "time": "7:00 PM",
      "location": "ICM Prayer Hall",
      "description": "Quran study circle with short reflections and community reminders.",
      "poster": "./public/news/icm-live/friday-bukhari-circle.jpeg",
      "posterAlt": "ICM Friday Night Bukhari Circle flyer"
    },
    {
      "title": "Youth Service Planning Meeting",
      "date": "2026-06-28",
      "time": "8:00 PM",
      "location": "ICM Classroom",
      "description": "Planning meeting for youth service projects and volunteer coordination.",
      "poster": "./public/news/icm-live/volunteer-icm-youth.jpeg",
      "posterAlt": "Volunteer for ICM Youth Program flyer"
    },
    {
      "title": "Family Program Volunteer Check In",
      "date": "2026-06-28",
      "time": "After Isha",
      "location": "ICM",
      "description": "Volunteer check-in for family programs and upcoming community activities.",
      "poster": "./public/news/icm-live/summer-quran-islamic-studies.png",
      "posterAlt": "ICM Summer Quran and Islamic Studies Program flyer"
    },
    {
      "title": "Shared Edge Test Above Current Day",
      "date": "2026-06-29",
      "time": "6:00 PM",
      "location": "ICM",
      "description": "Calendar fixture for verifying the selected gold highlight above the current day.",
      "poster": "./public/news/icm-live/friday-bukhari-circle.jpeg",
      "posterAlt": "ICM Friday Night Bukhari Circle flyer"
    },
    {
      "title": "Shared Edge Test Above Expanded Fixture One",
      "date": "2026-06-29",
      "time": "6:30 PM",
      "location": "ICM",
      "description": "Calendar fixture for verifying the expanded gold highlight above the current day.",
      "poster": "./public/news/icm-live/friday-bukhari-circle.jpeg",
      "posterAlt": "ICM Friday Night Bukhari Circle flyer"
    },
    {
      "title": "Shared Edge Test Above Expanded Fixture Two",
      "date": "2026-06-29",
      "time": "7:00 PM",
      "location": "ICM",
      "description": "Calendar fixture for verifying the expanded gold highlight above the current day.",
      "poster": "./public/news/icm-live/friday-bukhari-circle.jpeg",
      "posterAlt": "ICM Friday Night Bukhari Circle flyer"
    },
    {
      "title": "Summer Quran And Islamic Studies Program With Student Activities And Parent Updates For Families",
      "date": "2026-07-06",
      "time": "Monday - Thursday, 10:00 AM - 1:00 PM",
      "location": "ICM",
      "description": "Nibras Institute summer classes continue Monday through Thursday through August 20 with Quran, Islamic studies, and student activities.",
      "poster": "./public/news/icm-live/summer-quran-islamic-studies.png",
      "posterAlt": "ICM Summer Quran and Islamic Studies Program flyer"
    },
    {
      "title": "Sisters Zumba Fitness Class And Weekly Wellness Gathering With Community Health Reminders",
      "date": "2026-07-05",
      "time": "6:30 PM",
      "location": "ICM",
      "description": "Sisters fitness class held weekly on Thursday at 6:30 PM with movement, wellness, and community connection.",
      "link": "https://tinyurl.com/ICM-Zumba-2026",
      "poster": "./public/news/icm-live/sisters-zumba-fitness.png",
      "posterAlt": "ICM Sisters Zumba Fitness Class flyer"
    },
    {
      "title": "Shared Edge Test Left Expanded Fixture One",
      "date": "2026-07-05",
      "time": "7:00 PM",
      "location": "ICM",
      "description": "Calendar fixture for verifying the expanded gold highlight left of the current day.",
      "poster": "./public/news/icm-live/sisters-zumba-fitness.png",
      "posterAlt": "ICM Sisters Zumba Fitness Class flyer"
    },
    {
      "title": "Shared Edge Test Left Expanded Fixture Two",
      "date": "2026-07-05",
      "time": "7:30 PM",
      "location": "ICM",
      "description": "Calendar fixture for verifying the expanded gold highlight left of the current day.",
      "poster": "./public/news/icm-live/sisters-zumba-fitness.png",
      "posterAlt": "ICM Sisters Zumba Fitness Class flyer"
    },
    {
      "title": "Shared Edge Test Right Of Current Day",
      "date": "2026-07-07",
      "time": "6:00 PM",
      "location": "ICM",
      "description": "Calendar fixture for verifying the selected gold highlight to the right of the current day.",
      "poster": "./public/news/icm-live/summer-quran-islamic-studies.png",
      "posterAlt": "ICM Summer Quran and Islamic Studies Program flyer"
    },
    {
      "title": "Shared Edge Test Right Expanded Fixture One",
      "date": "2026-07-07",
      "time": "6:30 PM",
      "location": "ICM",
      "description": "Calendar fixture for verifying the expanded gold highlight right of the current day.",
      "poster": "./public/news/icm-live/summer-quran-islamic-studies.png",
      "posterAlt": "ICM Summer Quran and Islamic Studies Program flyer"
    },
    {
      "title": "Shared Edge Test Right Expanded Fixture Two",
      "date": "2026-07-07",
      "time": "7:00 PM",
      "location": "ICM",
      "description": "Calendar fixture for verifying the expanded gold highlight right of the current day.",
      "poster": "./public/news/icm-live/summer-quran-islamic-studies.png",
      "posterAlt": "ICM Summer Quran and Islamic Studies Program flyer"
    },
    {
      "title": "Shared Edge Test Below Current Day",
      "date": "2026-07-13",
      "time": "6:00 PM",
      "location": "ICM",
      "description": "Calendar fixture for verifying the selected gold highlight below the current day.",
      "poster": "./public/news/icm-live/volunteer-icm-youth.jpeg",
      "posterAlt": "Volunteer for ICM Youth Program flyer"
    },
    {
      "title": "Shared Edge Test Below Expanded Fixture One",
      "date": "2026-07-13",
      "time": "6:30 PM",
      "location": "ICM",
      "description": "Calendar fixture for verifying the expanded gold highlight below the current day.",
      "poster": "./public/news/icm-live/volunteer-icm-youth.jpeg",
      "posterAlt": "Volunteer for ICM Youth Program flyer"
    },
    {
      "title": "Shared Edge Test Below Expanded Fixture Two",
      "date": "2026-07-13",
      "time": "7:00 PM",
      "location": "ICM",
      "description": "Calendar fixture for verifying the expanded gold highlight below the current day.",
      "poster": "./public/news/icm-live/volunteer-icm-youth.jpeg",
      "posterAlt": "Volunteer for ICM Youth Program flyer"
    },
    {
      "title": "Saturday Quran Review And Family Program Planning",
      "date": "2026-07-04",
      "time": "10:00 AM",
      "location": "ICM Classroom",
      "description": "Saturday morning Quran review and planning time for family programs.",
      "poster": "./public/news/icm-live/summer-quran-islamic-studies.png",
      "posterAlt": "ICM Summer Quran and Islamic Studies Program flyer"
    },
    {
      "title": "Community Volunteer Setup For Weekend Services",
      "date": "2026-07-04",
      "time": "12:30 PM",
      "location": "ICM",
      "description": "Volunteer setup window for weekend programs and community service support.",
      "poster": "./public/news/icm-live/volunteer-icm-youth.jpeg",
      "posterAlt": "Volunteer for ICM Youth Program flyer"
    },
    {
      "title": "Youth Activity Coordination And Parent Check In",
      "date": "2026-07-04",
      "time": "2:00 PM",
      "location": "ICM Multipurpose Room",
      "description": "Coordination meeting for youth activities, parent communication, and volunteer roles.",
      "poster": "./public/news/icm-live/volunteer-icm-youth.jpeg",
      "posterAlt": "Volunteer for ICM Youth Program flyer"
    },
    {
      "title": "Evening Community Reminder Circle",
      "date": "2026-07-04",
      "time": "After Maghrib",
      "location": "ICM Prayer Hall",
      "description": "Short evening reminder and community check-in after Maghrib.",
      "poster": "./public/news/icm-live/friday-bukhari-circle.jpeg",
      "posterAlt": "ICM Friday Night Bukhari Circle flyer"
    },
    {
      "title": "Friday Night Bukhari Circle With Community Reflections And Weekly Family Reminders",
      "date": "2026-07-03",
      "time": "Between Maghrib & Isha",
      "location": "ICM Prayer Hall",
      "description": "Weekly reading from Sahih al-Bukhari between Maghrib and Isha with short reminders and community reflections.",
      "poster": "./public/news/icm-live/friday-bukhari-circle.jpeg",
      "posterAlt": "ICM Friday Night Bukhari Circle flyer"
    },
    {
      "title": "40 Principles Of The Religion With Practical Lessons For Community Life",
      "date": "2026-07-03",
      "time": "6:30 PM",
      "location": "ICM",
      "description": "Weekly Friday lecture series on the 40 principles of the religion.",
      "poster": "./public/news/icm-live/friday-announcements-june-19-2026.png",
      "posterAlt": "ICM Friday Announcements flyer"
    },
    {
      "title": "Volunteer For ICM Youth Program Planning Team And Weekend Activities",
      "date": "2026-07-03",
      "time": "Volunteer signup",
      "location": "ICM",
      "description": "ICM Youth Program is recruiting volunteers to help plan activities, support youth leaders, and serve the community.",
      "poster": "./public/news/icm-live/volunteer-icm-youth.jpeg",
      "posterAlt": "Volunteer for ICM Youth Program flyer"
    },
    {
      "title": "Youth Volunteer Orientation For Upcoming Programs And Service Projects",
      "date": "2026-07-03",
      "time": "5:30 PM",
      "location": "ICM Multipurpose Room",
      "description": "Orientation for youth volunteers supporting upcoming ICM programs and community activities.",
      "poster": "./public/news/icm-live/volunteer-icm-youth.jpeg",
      "posterAlt": "Volunteer for ICM Youth Program flyer"
    },
    {
      "title": "Community Dinner Setup And Hospitality Volunteer Coordination",
      "date": "2026-07-03",
      "time": "7:15 PM",
      "location": "ICM Banquet Hall",
      "description": "Volunteer setup window for the community dinner and Friday evening program support.",
      "poster": "./public/news/icm-live/friday-announcements-june-19-2026.png",
      "posterAlt": "ICM Friday Announcements flyer"
    },
    {
      "title": "Sisters Program Planning Circle With Long Community Coordination Updates",
      "date": "2026-07-03",
      "time": "8:15 PM",
      "location": "ICM Classroom",
      "description": "Planning circle for sisters programs, class ideas, and upcoming community support.",
      "poster": "./public/news/icm-live/sisters-zumba-fitness.png",
      "posterAlt": "ICM Sisters Zumba Fitness Class flyer"
    },
    {
      "title": "Henna Beginner Class",
      "date": "2026-06-27",
      "time": "12:00 PM - 2:00 PM",
      "location": "ICM",
      "description": "Beginner henna class for ages 15 and above.",
      "link": "https://tinyurl.com/ICM-BeginnersHenna-2026",
      "poster": "./public/news/icm-live/henna-beginner-class.png",
      "posterAlt": "ICM Henna Beginner Class flyer"
    },
    {
      "title": "Nibras Hiking Day Trip",
      "date": "2026-06-27",
      "time": "Trip day",
      "location": "Raven Rock State Park",
      "description": "Nibras Institute hiking day trip for ages 13 and above.",
      "poster": "./public/news/icm-live/friday-announcements-june-19-2026.png",
      "posterAlt": "ICM Friday Announcements flyer mentioning the Nibras hiking day trip and extended logistics"
    },
    {
      "title": "Sisters Zumba Fitness Class",
      "date": "2026-06-25",
      "time": "6:30 PM",
      "location": "ICM",
      "description": "Sisters fitness class held every Thursday at 6:30 PM.",
      "link": "https://tinyurl.com/ICM-Zumba-2026",
      "poster": "./public/news/icm-live/sisters-zumba-fitness.png",
      "posterAlt": "ICM Sisters Zumba Fitness Class flyer"
    }
  ],
  "news": [
    {
      "title": "Friday Announcements, Parking Notes, Youth Volunteers And Weekly Programs - June 19, 2026",
      "date": "2026-06-19",
      "summary": "Community reminders covering monthly support, parking and traffic flow, youth volunteer signups, Nibras hiking, Friday Night Bukhari Circle, and the regular weekly program schedule.",
      "image": "./public/news/icm-live/friday-announcements-june-19-2026.png",
      "imageAlt": "ICM Friday Announcements flyer for June 19, 2026 with volunteer updates traffic notes youth programs and weekly community reminders"
    },
    {
      "title": "Youth Volunteers Needed",
      "date": "2026-06-19",
      "summary": "Help plan programs and serve the community.",
      "image": "./public/news/icm-live/volunteer-icm-youth.jpeg",
      "imageAlt": "Volunteer for ICM Youth Program flyer"
    },
    {
      "title": "Summer Quran And Islamic Studies Registration",
      "date": "2026-05-30",
      "summary": "Nibras classes run Monday through Thursday through August 20 with Quran, Islamic studies, student activities, parent updates, and registration reminders.",
      "image": "./public/news/icm-live/summer-quran-islamic-studies.png",
      "imageAlt": "ICM Summer Quran and Islamic Studies Program flyer with registration details for students and families"
    },
    {
      "title": "ICM App And Community Updates For Prayer Times, Programs, And Announcements",
      "date": "2026-06-28",
      "summary": "Use ICM's official app and website for prayer times, Jumu'ah updates, weekly program changes, registration reminders, volunteer needs, youth activities, social welfare notices, and community announcements that families need to check throughout the week.",
      "image": "./public/images/icm-logo-provided-transparent.png",
      "imageAlt": "Islamic Center of Morrisville logo"
    }
  ]
};

// src/nav.js
function initMobileNav() {
  const nav = document.querySelector(".top-nav");
  const button = document.querySelector(".menu-button");
  if (!nav || !button) return;
  const panel = document.createElement("div");
  panel.className = "menu-panel";
  panel.id = "site-menu-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <details class="menu-panel-section menu-panel-primary" open>
      <summary>Main Pages</summary>
      <a class="desktop-menu-only" href="./donate.html">Donate</a>
      <a href="./prayer-times.html">Monthly Prayer Schedule</a>
      <a href="./calendar.html">Event Calendar</a>
      <a href="./programs.html">Programs</a>
      <a href="./news.html">News</a>
      <a href="./about.html">About</a>
    </details>
    <details class="menu-panel-section">
      <summary>Programs & Services</summary>
      <a href="./programs.html#services">Services Overview</a>
      <a href="./volunteer.html">Volunteer</a>
      <a href="./food-pantry.html">Food Pantry</a>
      <a href="./financial-aid.html">Financial Aid</a>
    </details>
    <details class="menu-panel-section">
      <summary>Education</summary>
      <a href="./al-mizaan-academy.html">Al Mizaan Academy</a>
      <a href="./nibraas-institute.html">Nibraas Institute</a>
      <a href="./al-falah-quran-school.html">Al-Falah Quran School</a>
    </details>
    <details class="menu-panel-section">
      <summary>Community</summary>
      <a href="./about.html#imam">Our Imam</a>
      <a href="./about.html#contact">Contact Us</a>
    </details>
  `;
  button.after(panel);
  let closeTimer = null;
  const menuSections = panel.querySelectorAll(".menu-panel-section");
  const clearSectionAnimation = (section) => {
    section.style.height = "";
    section.style.overflow = "";
    section.classList.remove("is-animating");
  };
  const setSectionOpen = (section, shouldOpen) => {
    if (section.open === shouldOpen || section.classList.contains("is-animating")) return;
    const startHeight = section.offsetHeight;
    let endHeight;
    if (shouldOpen) {
      section.open = true;
      endHeight = section.offsetHeight;
    } else {
      section.open = false;
      endHeight = section.offsetHeight;
      section.open = true;
    }
    section.classList.add("is-animating");
    section.style.overflow = "hidden";
    section.style.height = `${startHeight}px`;
    requestAnimationFrame(() => {
      section.style.height = `${endHeight}px`;
    });
    const finish = () => {
      if (!shouldOpen) section.open = false;
      clearSectionAnimation(section);
      section.removeEventListener("transitionend", finish);
    };
    section.addEventListener("transitionend", finish);
    window.setTimeout(finish, 260);
  };
  menuSections.forEach((section) => {
    section.addEventListener("click", (event) => {
      const summary = event.target.closest("summary");
      if (!summary || !section.contains(summary)) return;
      event.preventDefault();
      setSectionOpen(section, !section.open);
    });
  });
  const closeMenu = () => {
    if (!nav.classList.contains("menu-open")) return;
    window.clearTimeout(closeTimer);
    panel.classList.remove("is-open");
    panel.classList.add("is-closing");
    nav.classList.add("menu-closing");
    nav.classList.remove("menu-exit");
    nav.classList.remove("menu-visible");
    void nav.offsetHeight;
    requestAnimationFrame(() => {
      nav.classList.add("menu-exit");
    });
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open menu");
    closeTimer = window.setTimeout(() => {
      nav.classList.remove("menu-open");
      nav.classList.remove("menu-closing");
      nav.classList.remove("menu-exit");
      panel.classList.remove("is-closing");
      panel.hidden = true;
    }, 220);
  };
  const setMenuOpen = (isOpen) => {
    window.clearTimeout(closeTimer);
    if (!isOpen) {
      closeMenu();
      return;
    }
    panel.hidden = false;
    panel.classList.remove("is-closing");
    nav.classList.add("menu-open");
    nav.classList.remove("menu-closing");
    nav.classList.remove("menu-exit");
    nav.classList.remove("menu-visible");
    void nav.offsetHeight;
    void panel.offsetHeight;
    requestAnimationFrame(() => {
      nav.classList.add("menu-visible");
      panel.classList.add("is-open");
    });
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", "Close menu");
  };
  button.setAttribute("aria-controls", panel.id);
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenuOpen(!panel.classList.contains("is-open"));
  });
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("menu-open") || nav.contains(event.target)) return;
    closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

// src/main.js
var ICM_COORDS = new Coordinates(35.8111, -78.8231);
var TIME_ZONE = "America/New_York";
var prayerLabels = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha"
};
var prayerOrder = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
var nextPrayerOrder = prayerOrder;
var topicIconRules = [
  { icon: "leaf", words: ["gratitude", "shukr", "blessing", "thanks", "worship", "ibadah", "prayer", "salah", "daily", "green", "environment", "deen", "stewardship", "earth", "creation", "sustainability", "nature", "cleanliness", "purity"] },
  { icon: "heart", words: ["love", "mercy", "rahma", "compassion", "kindness", "service", "sincerity", "ikhlas", "charity", "giving", "donation", "zakat", "sadaqah", "muhasaba", "self reflection", "forgiveness", "healing", "care"] },
  { icon: "community", words: ["justice", "responsibility", "accountability", "community", "trust", "amanah", "unity", "neighbors", "ummah", "family", "parents", "children", "marriage", "brotherhood", "sisterhood", "society", "rights", "service"] },
  { icon: "feather", words: ["patience", "sabr", "change", "hardship", "steadfast", "resilience", "forgiveness", "healing", "trials", "tests", "hope", "courage", "character", "akhlaq", "manners", "humility"] },
  { icon: "moon", words: ["ramadan", "taraweeh", "quran", "taqwa", "faith", "iman", "spiritual", "eid", "dhul hijjah", "hajj", "umrah", "ghaflah", "heedlessness", "night", "dua", "dhikr", "akhirah", "jannah", "repentance", "tawbah"] },
  { icon: "spark", words: ["reflection", "reminder", "youth", "knowledge", "learning", "ilm", "education", "wisdom", "seerah", "sunnah", "hadith", "ostentation", "riya", "intention", "niyyah", "growth", "leadership"] }
];
var countdownTimer = null;
var selectedPrayerDate = /* @__PURE__ */ new Date();
var selectedDatePickerMonth = new Date(selectedPrayerDate.getFullYear(), selectedPrayerDate.getMonth(), 1);
var prayerDateTracksToday = true;
var datePickerCloseTimers = /* @__PURE__ */ new WeakMap();
var prayerClockOffset = null;
function getIcmPrayerTimes(date) {
  const params = CalculationMethod_default.Karachi();
  params.madhab = Madhab.Hanafi;
  params.rounding = Rounding.Up;
  params.adjustments.sunrise = -1;
  params.adjustments.dhuhr = -2;
  return new PrayerTimes(ICM_COORDS, date, params);
}
function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function mergeContent(content) {
  return {
    ...defaultContent,
    ...content,
    hero: { ...defaultContent.hero, ...content?.hero || {} },
    jummah: { ...defaultContent.jummah, ...content?.jummah || {} },
    events: Array.isArray(content?.events) ? content.events : defaultContent.events,
    news: Array.isArray(content?.news) ? content.news : defaultContent.news
  };
}
async function loadCmsContent() {
  try {
    const response = await fetch("/api/cms", { cache: "no-store" });
    if (!response.ok) throw new Error("CMS API unavailable");
    return mergeContent(await response.json());
  } catch {
    const local = localStorage.getItem("icm-cms-content");
    if (local) {
      try {
        return mergeContent(JSON.parse(local));
      } catch {
        return defaultContent;
      }
    }
    return defaultContent;
  }
}
function zonedDateParts(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day)
  };
}
function prayerDateFor(date, dayOffset = 0) {
  const parts = zonedDateParts(date);
  return new Date(parts.year, parts.month - 1, parts.day + dayOffset);
}
function nextPrayerForNow(now) {
  const todayDate = prayerDateFor(now);
  const todayTimes = getIcmPrayerTimes(todayDate);
  const next = nextPrayerOrder.map((key) => ({ key, time: todayTimes[key] })).find((item) => item.time.getTime() > now.getTime());
  if (next) return next;
  const tomorrowTimes = getIcmPrayerTimes(prayerDateFor(now, 1));
  return { key: "fajr", time: tomorrowTimes.fajr };
}
function currentPrayerPeriodForNow(now) {
  const todayTimes = getIcmPrayerTimes(prayerDateFor(now));
  const current = prayerOrder.map((key) => ({ key, time: todayTimes[key] })).filter((item) => item.time.getTime() <= now.getTime()).at(-1);
  return current || { key: "isha", time: getIcmPrayerTimes(prayerDateFor(now, -1)).isha };
}
function getPrayerClockOffset() {
  if (prayerClockOffset !== null) return prayerClockOffset;
  prayerClockOffset = 0;
  const params = new URLSearchParams(window.location.search);
  const testTransition = params.get("testTransition")?.toLowerCase();
  const testTime = params.get("testTime");
  const testPrayer = params.get("testPrayer")?.toLowerCase();
  const now = /* @__PURE__ */ new Date();
  const transitionSeconds = Math.min(Math.max(Number(params.get("transitionSeconds")) || 10, 4), 60);
  if (testTransition === "sunrise-dhuhr") {
    const times = getIcmPrayerTimes(prayerDateFor(now));
    const simulated = new Date(times.dhuhr.getTime() - transitionSeconds * 1e3);
    prayerClockOffset = simulated.getTime() - now.getTime();
    return prayerClockOffset;
  }
  if (/^\d{1,2}:\d{2}$/.test(testTime || "")) {
    const [hours, minutes] = testTime.split(":").map(Number);
    const simulated = new Date(now);
    simulated.setHours(hours, minutes, 0, 0);
    prayerClockOffset = simulated.getTime() - now.getTime();
    return prayerClockOffset;
  }
  if (prayerOrder.includes(testPrayer)) {
    const times = getIcmPrayerTimes(prayerDateFor(now));
    const simulated = new Date(times[testPrayer].getTime() + 60 * 1e3);
    prayerClockOffset = simulated.getTime() - now.getTime();
  }
  return prayerClockOffset;
}
function getPrayerNow() {
  return new Date(Date.now() + getPrayerClockOffset());
}
function formatTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIME_ZONE
  }).format(date);
}
function formatLongDate(dateString) {
  const date = /* @__PURE__ */ new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: TIME_ZONE
  }).format(date);
}
function formatShortDate(dateString) {
  const date = /* @__PURE__ */ new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: TIME_ZONE
  }).format(date);
}
function dateValue(dateString, hour = 12, minute = 0) {
  const date = /* @__PURE__ */ new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 0;
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}
function parseTimeParts(timeString) {
  const match = String(timeString || "").trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}
function eventStartValue(event) {
  const time = parseTimeParts(event.time);
  return dateValue(event.date, time?.hour ?? 0, time?.minute ?? 0) || Number.MAX_SAFE_INTEGER;
}
function eventEndValue(event) {
  const endTime = parseTimeParts(event.endTime);
  if (event.endDate || endTime) {
    return dateValue(event.endDate || event.date, endTime?.hour ?? 23, endTime?.minute ?? 59) || Number.MAX_SAFE_INTEGER;
  }
  const time = parseTimeParts(event.time);
  if (time) return dateValue(event.date, time.hour, time.minute) || Number.MAX_SAFE_INTEGER;
  const endOfDay = /* @__PURE__ */ new Date(`${event.date}T12:00:00`);
  if (Number.isNaN(endOfDay.getTime())) return Number.MAX_SAFE_INTEGER;
  endOfDay.setDate(endOfDay.getDate() + 1);
  endOfDay.setHours(0, 0, 0, 0);
  return endOfDay.getTime();
}
function eventTitle(event) {
  return String(event.title || "Community Event");
}
function eventSlug(event, index = 0) {
  return slugify([eventTitle(event), event.date, event.time, index].filter(Boolean).join("-")) || `event-${index}`;
}
function eventPoster(event) {
  return event.poster || event.image || "";
}
function eventPosterAlt(event) {
  return event.posterAlt || event.imageAlt || `${eventTitle(event)} event poster`;
}
function getNewsCategory(title) {
  const normalized = title.toLowerCase();
  if (normalized.includes("ramadan") || normalized.includes("taraweeh")) return "Program";
  if (normalized.includes("camp") || normalized.includes("youth")) return "Youth";
  return "Announcement";
}
function newsTitle(item, index = 0) {
  return String(item.title || item.imageAlt || `Announcement ${index + 1}`);
}
function newsSlug(item, index = 0) {
  return slugify([newsTitle(item, index), item.date, index].filter(Boolean).join("-")) || `announcement-${index}`;
}
function getTopicIcon(topic) {
  const normalized = topic.toLowerCase();
  return topicIconRules.find((rule) => rule.words.some((word) => normalized.includes(word)))?.icon || "\u2726";
}
function topicIconSvg(topic) {
  const icon = getTopicIcon(topic);
  const icons = {
    leaf: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c6.6 0 11-4.4 11-11V5h-3C6.4 5 3 8.4 3 15v4h2Z"/><path d="M5 19 16 8"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.3 6.7a5 5 0 0 0-7.1 0L12 7.9l-1.2-1.2a5 5 0 1 0-7.1 7.1L12 22l8.3-8.2a5 5 0 0 0 0-7.1Z"/></svg>`,
    community: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M3 20a5 5 0 0 1 10 0"/><path d="M11 20a5 5 0 0 1 10 0"/></svg>`,
    feather: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4c-7 0-12 5-12 12v4h4c7 0 12-5 12-12V4h-4Z"/><path d="M8 20 20 8"/><path d="M11 17H7"/><path d="M14 14h-4"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z"/></svg>`,
    spark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 14.4 9.6 21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z"/></svg>`
  };
  return icons[icon] || icons.spark;
}
function slugify(value) {
  return String(value ?? "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}
function setAnimatedText(selector, value) {
  const element = document.querySelector(selector);
  if (!element || element.textContent === value) return;
  element.textContent = value;
  element.classList.remove("is-changing");
  void element.offsetWidth;
  element.classList.add("is-changing");
}
function formatNavigatorDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric"
  });
}
function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function formatPickerMonth(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric"
  });
}
function ensureDatePicker(navigator) {
  let picker = navigator.querySelector("[data-prayer-date-picker]");
  if (picker) return picker;
  picker = document.createElement("div");
  picker.className = "date-picker-popover";
  picker.dataset.prayerDatePicker = "";
  picker.hidden = true;
  navigator.append(picker);
  return picker;
}
function showDatePicker(picker) {
  window.clearTimeout(datePickerCloseTimers.get(picker));
  picker.hidden = false;
  picker.classList.remove("is-closing");
  requestAnimationFrame(() => {
    picker.classList.add("is-open");
  });
}
function hideDatePicker(picker) {
  if (picker.hidden) return;
  window.clearTimeout(datePickerCloseTimers.get(picker));
  picker.classList.remove("is-open");
  picker.classList.add("is-closing");
  const timer = window.setTimeout(() => {
    if (!picker.classList.contains("is-open")) {
      picker.hidden = true;
      picker.classList.remove("is-closing");
    }
  }, 190);
  datePickerCloseTimers.set(picker, timer);
}
function toggleDatePicker(picker) {
  if (picker.hidden || !picker.classList.contains("is-open")) {
    showDatePicker(picker);
  } else {
    hideDatePicker(picker);
  }
}
function renderDatePicker(navigator) {
  const picker = ensureDatePicker(navigator);
  const monthStart = new Date(selectedDatePickerMonth.getFullYear(), selectedDatePickerMonth.getMonth(), 1);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const visibleDayCount = Math.ceil((monthStart.getDay() + daysInMonth) / 7) * 7;
  const firstGridDate = new Date(monthStart);
  firstGridDate.setDate(firstGridDate.getDate() - firstGridDate.getDay());
  const todayKey = dateKey(prayerDateFor(/* @__PURE__ */ new Date()));
  const selectedKey = dateKey(prayerDateFor(selectedPrayerDate));
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  picker.innerHTML = `
    <div class="date-picker-toolbar">
      <button type="button" data-date-picker-month="prev" aria-label="Previous month">
        <img src="/public/icons/chevron-left.svg" alt="" aria-hidden="true">
      </button>
      <strong>${escapeHtml(formatPickerMonth(monthStart))}</strong>
      <button type="button" data-date-picker-month="next" aria-label="Next month">
        <img src="/public/icons/chevron-right.svg" alt="" aria-hidden="true">
      </button>
    </div>
    <div class="date-picker-weekdays">${weekdays.map((day) => `<span>${day}</span>`).join("")}</div>
    <div class="date-picker-grid">
      ${Array.from({ length: visibleDayCount }, (_, index) => {
    const date = new Date(firstGridDate);
    date.setDate(firstGridDate.getDate() + index);
    const key = dateKey(date);
    return `
          <button
            type="button"
            class="${date.getMonth() !== monthStart.getMonth() ? "is-muted" : ""}${key === todayKey ? " is-today" : ""}${key === selectedKey ? " is-selected" : ""}"
            data-date-picker-day="${escapeHtml(key)}"
            aria-label="${escapeHtml(formatNavigatorDate(date))}"
          >${date.getDate()}</button>
        `;
  }).join("")}
    </div>
    <div class="date-picker-actions">
      <button type="button" data-date-picker-today>Today</button>
    </div>
  `;
}
function getNextJummahDate(fromDate = /* @__PURE__ */ new Date()) {
  const current = prayerDateFor(fromDate);
  const day = current.getDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  current.setDate(current.getDate() + daysUntilFriday);
  if (daysUntilFriday === 0) {
    const maghrib = getIcmPrayerTimes(current).maghrib;
    if (fromDate.getTime() >= maghrib.getTime()) {
      current.setDate(current.getDate() + 7);
    }
  }
  return current;
}
function formatJummahDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).toUpperCase();
}
function parseJummahDateLabel(label) {
  if (!label) return null;
  const parsed = /* @__PURE__ */ new Date(`${label} 12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return prayerDateFor(parsed);
}
function isSameDate(first, second) {
  return first?.getFullYear() === second?.getFullYear() && first?.getMonth() === second?.getMonth() && first?.getDate() === second?.getDate();
}
function getJummahRowsForDate(content, targetDate) {
  const shifts = content.jummah.shifts?.length ? content.jummah.shifts : defaultContent.jummah.shifts;
  const postedDate = parseJummahDateLabel(content.jummah.dateLabel || defaultContent.jummah.dateLabel);
  if (isSameDate(postedDate, targetDate)) return shifts;
  return shifts;
}
function textFitClass(value, thresholds) {
  const length = String(value ?? "").trim().length;
  if (length >= thresholds.tiny) return "fit-tiny";
  if (length >= thresholds.smaller) return "fit-smaller";
  if (length >= thresholds.small) return "fit-small";
  return "fit-normal";
}
function renderDateNavigator() {
  setText("[data-date-label]", formatNavigatorDate(selectedPrayerDate));
  const navigator = document.querySelector(".date-navigator");
  if (navigator) renderDatePicker(navigator);
}
function initDateNavigator() {
  const navigator = document.querySelector(".date-navigator");
  if (!navigator) return;
  const mainButton = navigator.querySelector(".date-nav-main");
  renderDatePicker(navigator);
  let monthPointerHandled = false;
  const handleNavigatorAction = (event) => {
    const monthButton = event.target.closest("[data-date-picker-month]");
    if (monthButton) {
      event.preventDefault();
      event.stopPropagation();
      if (event.type === "click" && monthPointerHandled) {
        monthPointerHandled = false;
        return;
      }
      if (event.type === "pointerdown") monthPointerHandled = true;
      selectedDatePickerMonth = new Date(selectedDatePickerMonth);
      selectedDatePickerMonth.setMonth(selectedDatePickerMonth.getMonth() + (monthButton.dataset.datePickerMonth === "next" ? 1 : -1));
      renderDatePicker(navigator);
      showDatePicker(ensureDatePicker(navigator));
      return;
    }
    const dayButton = event.target.closest("[data-date-picker-day]");
    if (dayButton) {
      event.stopPropagation();
      selectedPrayerDate = prayerDateFor(/* @__PURE__ */ new Date(`${dayButton.dataset.datePickerDay}T12:00:00`));
      selectedDatePickerMonth = new Date(selectedPrayerDate.getFullYear(), selectedPrayerDate.getMonth(), 1);
      prayerDateTracksToday = isSameDate(selectedPrayerDate, prayerDateFor(/* @__PURE__ */ new Date()));
      hideDatePicker(ensureDatePicker(navigator));
      renderDateNavigator();
      renderPrayerTimes();
      return;
    }
    if (event.target.closest("[data-date-picker-today]")) {
      event.stopPropagation();
      selectedPrayerDate = /* @__PURE__ */ new Date();
      selectedDatePickerMonth = new Date(selectedPrayerDate.getFullYear(), selectedPrayerDate.getMonth(), 1);
      prayerDateTracksToday = true;
      hideDatePicker(ensureDatePicker(navigator));
      renderDateNavigator();
      renderPrayerTimes();
      return;
    }
    if (event.target.closest(".date-nav-main")) {
      const picker = ensureDatePicker(navigator);
      selectedDatePickerMonth = new Date(selectedPrayerDate.getFullYear(), selectedPrayerDate.getMonth(), 1);
      renderDatePicker(navigator);
      toggleDatePicker(picker);
      return;
    }
    const button = event.target.closest("[data-date-nav]");
    if (!button) return;
    if (button.dataset.dateNav === "today") {
      selectedPrayerDate = /* @__PURE__ */ new Date();
      selectedDatePickerMonth = new Date(selectedPrayerDate.getFullYear(), selectedPrayerDate.getMonth(), 1);
      prayerDateTracksToday = true;
    } else {
      const offset = button.dataset.dateNav === "prev" ? -1 : 1;
      selectedPrayerDate = new Date(selectedPrayerDate);
      selectedPrayerDate.setDate(selectedPrayerDate.getDate() + offset);
      selectedDatePickerMonth = new Date(selectedPrayerDate.getFullYear(), selectedPrayerDate.getMonth(), 1);
      prayerDateTracksToday = false;
    }
    hideDatePicker(ensureDatePicker(navigator));
    renderDateNavigator();
    renderPrayerTimes();
  };
  navigator.addEventListener("pointerdown", (event) => {
    if (!event.target.closest("[data-date-picker-month]")) return;
    handleNavigatorAction(event);
  });
  navigator.addEventListener("click", handleNavigatorAction);
  document.addEventListener("click", (event) => {
    if (navigator.contains(event.target) || mainButton?.contains(event.target)) return;
    hideDatePicker(ensureDatePicker(navigator));
  });
  renderDateNavigator();
}
function renderHero(content) {
  const image = document.querySelector("[data-hero-image]");
  if (!image) return;
  image.src = content.hero.image || defaultContent.hero.image;
  image.alt = content.hero.imageAlt || "";
}
function renderPrayerTimes() {
  const now = getPrayerNow();
  if (prayerDateTracksToday) {
    selectedPrayerDate = now;
    renderDateNavigator();
  }
  const selectedDate = prayerDateFor(selectedPrayerDate);
  const selectedTimes = getIcmPrayerTimes(selectedDate);
  for (const key of prayerOrder) {
    setText(`[data-prayer-time="${key}"]`, formatTime(selectedTimes[key]));
  }
  const current = currentPrayerPeriodForNow(now);
  const next = nextPrayerForNow(now);
  const currentLabel = prayerLabels[current.key];
  const nextLabel = prayerLabels[next.key];
  setText(".next-label span", current.key === "sunrise" ? "Current Period" : "Current Prayer");
  setText("[data-next-name]", currentLabel);
  setText("[data-next-time]", formatTime(current.time));
  setText("[data-countdown-target]", nextLabel);
  const countdown = document.querySelector("[data-countdown]");
  if (countdown) countdown.setAttribute("aria-label", `Time remaining until ${nextLabel}`);
  document.querySelectorAll("[data-prayer-tile]").forEach((tile) => {
    tile.classList.toggle("active", tile.dataset.prayerTile === current.key);
  });
  if (countdownTimer) window.clearInterval(countdownTimer);
  const tick = () => {
    const remaining = Math.max(0, Math.ceil((next.time.getTime() - getPrayerNow().getTime()) / 1e3));
    setAnimatedText("[data-countdown-hours]", String(Math.floor(remaining / 3600)).padStart(2, "0"));
    setAnimatedText("[data-countdown-minutes]", String(Math.floor(remaining % 3600 / 60)).padStart(2, "0"));
    setAnimatedText("[data-countdown-seconds]", String(remaining % 60).padStart(2, "0"));
    if (remaining <= 0) renderPrayerTimes();
  };
  tick();
  countdownTimer = window.setInterval(tick, 1e3);
}
function renderJummah(content) {
  const targetDate = getNextJummahDate();
  const postedDate = parseJummahDateLabel(content.jummah.dateLabel || defaultContent.jummah.dateLabel);
  setText("[data-jummah-date]", formatJummahDate(postedDate || targetDate));
  const tbody = document.querySelector("[data-jummah-body]");
  if (!tbody) return;
  const shifts = getJummahRowsForDate(content, targetDate);
  tbody.innerHTML = shifts.map(
    (shift) => {
      const speakerFit = textFitClass(shift.speaker, { small: 28, smaller: 42, tiny: 50 });
      const topicFit = textFitClass(shift.topic, { small: 42, smaller: 68, tiny: 92 });
      const isTbdTopic = shift.topic.trim().toLowerCase() === "tbd";
      const topicIcon = isTbdTopic ? "" : `<span class="topic-icon">${topicIconSvg(shift.topic)}</span>`;
      return `
        <tr>
          <td><span class="shift">${escapeHtml(shift.shift)}</span></td>
          <td class="time">${escapeHtml(shift.time)}</td>
          <td><span class="speaker-name ${speakerFit}">${escapeHtml(shift.speaker)}</span></td>
          <td><span class="topic-chip ${topicFit}${isTbdTopic ? " is-tbd" : ""}">${topicIcon}<span class="topic-text">${escapeHtml(shift.topic)}</span></span></td>
        </tr>
      `;
    }
  ).join("");
}
function renderEvents(content) {
  const list = document.querySelector("[data-events-list]");
  if (!list) return;
  const now = Date.now();
  const sourceEvents = (content.events?.length ? content.events : defaultContent.events).map((event, originalIndex) => ({ event, originalIndex }));
  const upcomingEvents = sourceEvents.filter(({ event }) => eventEndValue(event) > now).sort((first, second) => eventStartValue(first.event) - eventStartValue(second.event));
  const pastEvents = sourceEvents.filter(({ event }) => eventEndValue(event) <= now).sort((first, second) => eventEndValue(second.event) - eventEndValue(first.event));
  const events = [...upcomingEvents, ...pastEvents];
  const firstPastDisplayIndex = events.findIndex(({ event }) => eventEndValue(event) <= now);
  list.classList.toggle("has-past-divider-in-preview", firstPastDisplayIndex >= 0 && firstPastDisplayIndex < 3);
  list.innerHTML = events.map(({ event, originalIndex }, displayIndex) => {
    const eventDate = formatLongDate(event.date);
    const isPast = eventEndValue(event) <= now;
    const poster = eventPoster(event);
    const pastDivider = displayIndex === firstPastDisplayIndex ? `<div class="event-group-divider" data-group="past">Recently Passed</div>` : "";
    return `
        ${pastDivider}
        <a class="event-item${isPast ? " is-past" : ""}${displayIndex > 2 ? " is-scroll-extra" : ""}" href="./calendar.html#event-${escapeHtml(eventSlug(event, originalIndex))}">
          ${poster ? `<img class="event-thumb" src="${escapeHtml(poster)}" alt="${escapeHtml(eventPosterAlt(event))}">` : ""}
          <div class="event-item-body">
            <h3>${escapeHtml(eventTitle(event))}</h3>
            ${eventDate || event.time || event.location ? `<p>${eventDate ? `<span class="event-date-line">${escapeHtml(eventDate)}</span>` : ""}${event.time ? `<span class="event-time-line">${escapeHtml(event.time)}</span>` : ""}${event.location ? `<span class="event-location">${escapeHtml(event.location)}</span>` : ""}</p>` : ""}
          </div>
        </a>
      `;
  }).join("");
  markCardImageShapes(list, ".event-item", ".event-thumb");
}
function renderNews(content) {
  const list = document.querySelector("[data-news-list]");
  if (!list) return;
  const news = (content.news?.length ? content.news : defaultContent.news).map((item, originalIndex) => ({ item, originalIndex })).sort((first, second) => dateValue(second.item.date) - dateValue(first.item.date));
  list.innerHTML = news.map(
    ({ item, originalIndex }) => `
        <a class="news-item${newsTitle(item, originalIndex).length <= 42 ? " news-item--short-title" : ""}" href="./news.html#news-${escapeHtml(newsSlug(item, originalIndex))}">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || newsTitle(item, originalIndex))}">
          <span class="news-category">${escapeHtml(getNewsCategory(newsTitle(item, originalIndex)))}</span>
          <div class="news-item-body">
            ${item.date ? `<time datetime="${escapeHtml(item.date)}">${escapeHtml(formatShortDate(item.date))}</time>` : ""}
            ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ""}
            ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
          </div>
        </a>
      `
  ).join("");
  markCardImageShapes(list, ".news-item", "img");
}
function markCardImageShapes(root, cardSelector, imageSelector) {
  root.querySelectorAll(imageSelector).forEach((image) => {
    const applyShape = () => {
      const card = image.closest(cardSelector);
      if (!card || !image.naturalWidth || !image.naturalHeight) return;
      const isPortrait = image.naturalHeight / image.naturalWidth > 1.08;
      card.classList.toggle("is-portrait-media", isPortrait);
      card.classList.toggle("is-wide-media", !isPortrait);
    };
    if (image.complete) applyShape();
    else image.addEventListener("load", applyShape, { once: true });
  });
}
async function boot() {
  initMobileNav();
  initDateNavigator();
  const content = await loadCmsContent();
  renderHero(content);
  renderPrayerTimes();
  renderJummah(content);
  renderEvents(content);
  renderNews(content);
}
boot();
export {
  getIcmPrayerTimes
};
