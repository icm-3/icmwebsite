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
  hero: {
    image: "./public/images/masjid-interior-hero-full.png",
    imageAlt: "Islamic Center of Morrisville prayer hall interior"
  },
  jummah: {
    dateLabel: "Friday, June 19, 2026",
    shifts: [
      {
        shift: "1",
        time: "1:00 PM",
        speaker: "Imam Sami Kocak with Guest Khatib Dr. Adeel Rahman",
        topic: "Gratitude in Daily Worship, Family Service, and Community Responsibility"
      },
      {
        shift: "2",
        time: "2:00 PM",
        speaker: "Mikael Raza",
        topic: "Sincerity and Service"
      },
      {
        shift: "3",
        time: "3:00 PM",
        speaker: "TBD",
        topic: "TBD"
      },
      {
        shift: "4",
        time: "4:00 PM",
        speaker: "Mansoor Syed",
        topic: "Patience Through Change"
      }
    ]
  },
  events: [
    {
      title: "Women's Eid Celebration",
      date: "2026-06-14",
      time: "4:00 PM",
      location: "ICM Banquet Hall",
      description: "A women's community potluck with games, socializing, prizes, and time together after Eid.",
      link: "https://tinyurl.com/ICM-EID-2026",
      poster: "./public/news/womens-eid-2026.png",
      posterAlt: "Women's Eid Celebration event poster"
    },
    {
      title: "Youth Hike & BBQ",
      date: "2026-06-21",
      time: "10:00 AM",
      location: "William B. Umstead State Park",
      description: "A morning hike followed by lunch and games.",
      poster: "./public/news/camp.png",
      posterAlt: "Youth outdoor activity poster"
    },
    {
      title: "Sisters' Tea & Talk",
      date: "2026-06-27",
      time: "6:30 PM",
      location: "ICM Community Hall",
      description: "An evening gathering for reflection and connection.",
      poster: "./public/news/ramadan.png",
      posterAlt: "Community program poster"
    },
    {
      title: "Youth Qiyam Night",
      date: "2026-06-27",
      time: "9:45 PM",
      location: "ICM Prayer Hall",
      description: "A night program for youth with reminders, worship, and community time.",
      poster: "./public/news/camp.png",
      posterAlt: "Youth night program poster"
    },
    {
      title: "Family Seerah Workshop",
      date: "2026-06-27",
      time: "11:00 AM",
      location: "ICM Multipurpose Room",
      description: "A family learning session with activities and discussion for parents and children.",
      poster: "./public/news/eid.png",
      posterAlt: "Family workshop poster"
    },
    {
      title: "Independence Day Potluck",
      date: "2026-07-04",
      time: "1:00 PM",
      location: "ICM Community Hall",
      description: "Bring a dish and spend the afternoon with the community.",
      poster: "./public/news/eid.png",
      posterAlt: "Community potluck poster"
    },
    {
      title: "Community Service Day & Food Pantry Support",
      date: "2026-07-12",
      time: "9:30 AM",
      location: "ICM Social Services Entrance",
      description: "Help sort donations, prepare family grocery bags, and support neighbors across Morrisville.",
      poster: "./public/news/camp.png",
      posterAlt: "Community service day poster"
    },
    {
      title: "New Muslim Welcome Circle and Family Dinner",
      date: "2026-07-18",
      time: "7:15 PM",
      location: "ICM Multipurpose Room",
      description: "A welcoming evening for new Muslims, families, mentors, and community members.",
      poster: "./public/news/ramadan.png",
      posterAlt: "Welcome circle poster"
    }
  ],
  news: [
    {
      title: "Friday Announcements - June 12, 2026",
      date: "2026-06-12",
      summary: "Monthly support, traffic reminders, summer programs, Eid celebration, Bukhari Circle, youth volunteer signups, and weekly lectures.",
      image: "./public/news/friday-announcements-june-12-2026.png",
      imageAlt: "Friday Announcements flyer for June 12, 2026"
    },
    {
      title: "Ramadan Programs & Taraweeh Schedule",
      date: "2026-04-28",
      summary: "Join us for special programs throughout Ramadan.",
      image: "./public/news/ramadan.png",
      imageAlt: "Mosque at sunset during Ramadan"
    },
    {
      title: "Eid Al-Adha Announcements",
      date: "2026-04-24",
      summary: "Important information for Eid prayers and events.",
      image: "./public/news/eid.png",
      imageAlt: "Mosque scene for Eid announcement"
    },
    {
      title: "Youth Summer Camp Registration Open",
      date: "2026-04-18",
      summary: "Fun, faith, and friends this summer!",
      image: "./public/news/camp.png",
      imageAlt: "Youth summer camp activity"
    },
    {
      title: "Parking and Arrival Guidance for Busy Friday Prayer Shifts",
      date: "2026-04-12",
      summary: "Please arrive early, follow volunteer directions, and leave extra time for entry.",
      image: "./public/news/eid.png",
      imageAlt: "Masjid evening scene for community announcement"
    },
    {
      title: "Weekend Learning Programs Add New Family Workshop Series",
      date: "2026-04-05",
      summary: "Families can join monthly workshops focused on worship, service, and home routines.",
      image: "./public/news/ramadan.png",
      imageAlt: "Mosque lanterns for program announcement"
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
    <div class="menu-panel-section">
      <p>Education</p>
      <a href="./al-mizaan-academy.html">Al Mizaan Academy</a>
      <a href="./nibraas-institute.html">Nibraas Institute</a>
      <a href="./al-falah-quran-school.html">Al-Falah Quran School</a>
    </div>
    <div class="menu-panel-section">
      <p>Programs & Services</p>
      <a href="./programs.html#services">Services Overview</a>
      <a href="./imams-classes.html">Imam's Classes</a>
      <a href="./social-welfare-services.html">Social & Welfare Services</a>
      <a href="./volunteer.html">Volunteer</a>
    </div>
    <div class="menu-panel-section">
      <p>Community</p>
      <a href="./calendar.html">Calendar</a>
      <a href="./prayer-times.html">Full Prayer Schedule</a>
      <a href="./news.html">Latest News</a>
      <a href="./about.html#imam">Our Imam</a>
      <a href="./about.html#contact">Contact Us</a>
    </div>
  `;
  button.after(panel);
  const closeMenu = () => {
    nav.classList.remove("menu-open");
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open menu");
  };
  const setMenuOpen = (isOpen) => {
    nav.classList.toggle("menu-open", isOpen);
    panel.hidden = !isOpen;
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  };
  button.setAttribute("aria-controls", panel.id);
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenuOpen(!nav.classList.contains("menu-open"));
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

// src/pages.js
var ICM_COORDS = new Coordinates(35.8111, -78.8231);
var TIME_ZONE = "America/New_York";
var prayerOrder = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
var prayerLabels = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha"
};
var selectedPrayerDate = /* @__PURE__ */ new Date();
var selectedCalendarMonth = /* @__PURE__ */ new Date();
var selectedCalendarEventSlug = "";
var fallbackNews = [
  {
    title: "Community Programs Continue Through Summer",
    date: "2026-06-10",
    summary: "ICM continues to host learning, service, and family programs for the Morrisville community.",
    image: "./public/news/ramadan.png",
    imageAlt: "Mosque at sunset"
  },
  {
    title: "Volunteer Opportunities Available",
    date: "2026-06-05",
    summary: "Community members can support events, education programs, and social services through volunteer work.",
    image: "./public/news/camp.png",
    imageAlt: "Youth program activity"
  },
  {
    title: "Friday Prayer Updates",
    date: "2026-05-29",
    summary: "Please review Jumu'ah shift times and arrive early to help keep parking and entry smooth.",
    image: "./public/news/eid.png",
    imageAlt: "Masjid evening scene"
  }
];
function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function mergeContent(content) {
  return {
    ...defaultContent,
    ...content,
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
    return defaultContent;
  }
}
function getIcmPrayerTimes(date) {
  const params = CalculationMethod_default.Karachi();
  params.madhab = Madhab.Hanafi;
  params.rounding = Rounding.Up;
  params.adjustments.sunrise = -1;
  params.adjustments.dhuhr = -2;
  return new PrayerTimes(ICM_COORDS, date, params);
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
function prayerDateFor(date) {
  const parts = zonedDateParts(date);
  return new Date(parts.year, parts.month - 1, parts.day);
}
function formatNavigatorDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric"
  });
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
function formatMonthTitle(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE
  }).format(date);
}
function formatHijriMonth(date) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-islamic", {
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE
  }).formatToParts(date);
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;
  return month && year ? `${month}, ${year} Hijri` : "";
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
function getDateBadgeParts(dateString) {
  const date = /* @__PURE__ */ new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { month: "---", day: "--" };
  return {
    month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: TIME_ZONE }).format(date),
    day: new Intl.DateTimeFormat("en-US", { day: "2-digit", timeZone: TIME_ZONE }).format(date)
  };
}
function getEventDate(event) {
  const date = /* @__PURE__ */ new Date(`${event.date}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
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
function eventLink(event) {
  return event.link || event.url || event.registrationUrl || "";
}
function eventDateTimeLabel(event) {
  return [formatLongDate(event.date), event.time].filter(Boolean).join(" \u2022 ");
}
function eventSlugFromHash() {
  const rawHash = window.location.hash.replace(/^#/, "");
  return rawHash.startsWith("event-") ? rawHash.slice(6) : "";
}
function newsTitle(item, index = 0) {
  return String(item.title || item.imageAlt || `Announcement ${index + 1}`);
}
function newsSlug(item, index = 0) {
  return slugify([newsTitle(item, index), item.date, index].filter(Boolean).join("-")) || `announcement-${index}`;
}
function slugify(value) {
  return String(value ?? "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function renderPrayerTable() {
  const target = document.querySelector("[data-page-prayers]");
  if (!target) return;
  const times = getIcmPrayerTimes(prayerDateFor(selectedPrayerDate));
  target.innerHTML = prayerOrder.map(
    (key) => `
        <div class="schedule-row">
          <span>${prayerLabels[key]}</span>
          <strong>${formatTime(times[key])}</strong>
        </div>
      `
  ).join("");
}
function renderDateNavigator() {
  const label = document.querySelector("[data-page-date-navigator] [data-date-label]");
  if (label) label.textContent = formatNavigatorDate(selectedPrayerDate);
}
function initDateNavigator() {
  const navigator = document.querySelector("[data-page-date-navigator]");
  if (!navigator) return;
  navigator.addEventListener("click", (event) => {
    const button = event.target.closest("[data-date-nav]");
    if (!button) return;
    if (button.dataset.dateNav === "today") {
      selectedPrayerDate = /* @__PURE__ */ new Date();
    } else {
      const offset = button.dataset.dateNav === "prev" ? -1 : 1;
      selectedPrayerDate = new Date(selectedPrayerDate);
      selectedPrayerDate.setDate(selectedPrayerDate.getDate() + offset);
    }
    renderDateNavigator();
    renderPrayerTable();
  });
  renderDateNavigator();
}
function renderEvents(content) {
  const target = document.querySelector("[data-page-events]");
  if (!target) return;
  target.innerHTML = content.events.map((event, index) => {
    const badge = getDateBadgeParts(event.date);
    const meta = eventDateTimeLabel(event);
    return `
        <article class="listing-item" id="event-${escapeHtml(eventSlug(event, index))}">
          <div class="date-badge"><span>${escapeHtml(badge.month)}</span><strong>${escapeHtml(badge.day)}</strong></div>
          <div>
            <h3>${escapeHtml(eventTitle(event))}</h3>
            ${meta ? `<p>${escapeHtml(meta)}</p>` : ""}
            ${event.location ? `<p>${escapeHtml(event.location)}</p>` : ""}
            ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
            ${eventLink(event) ? `<a class="calendar-detail-link" href="${escapeHtml(eventLink(event))}" target="_blank" rel="noopener">Open Link</a>` : ""}
          </div>
        </article>
      `;
  }).join("");
}
function eventMatchesDate(event, date) {
  const eventDate = getEventDate(event);
  return eventDate && eventDate.getFullYear() === date.getFullYear() && eventDate.getMonth() === date.getMonth() && eventDate.getDate() === date.getDate();
}
function setCalendarDetail(event, index = 0) {
  const target = document.querySelector("[data-calendar-detail]");
  if (!target) return;
  if (!event) {
    target.innerHTML = `
      <div class="calendar-detail-empty">
        <h3>Select an event</h3>
        <p>Choose an event from the calendar to view details.</p>
      </div>
    `;
    return;
  }
  const poster = eventPoster(event);
  const meta = eventDateTimeLabel(event);
  target.innerHTML = `
    <article class="calendar-detail-card" id="event-${escapeHtml(eventSlug(event, index))}">
      <div class="calendar-detail-body">
        <h3>${escapeHtml(eventTitle(event))}</h3>
        ${meta ? `<time datetime="${escapeHtml(event.date || "")}">${escapeHtml(meta)}</time>` : ""}
        ${event.location ? `<p class="calendar-detail-location">${escapeHtml(event.location)}</p>` : ""}
        ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
        ${eventLink(event) ? `<a class="calendar-detail-link" href="${escapeHtml(eventLink(event))}" target="_blank" rel="noopener">Open Link</a>` : ""}
      </div>
      ${poster ? `<img class="calendar-detail-poster" src="${escapeHtml(poster)}" alt="${escapeHtml(eventPosterAlt(event))}">` : ""}
    </article>
  `;
}
function renderCalendar(content) {
  const grid = document.querySelector("[data-calendar-grid]");
  if (!grid) return;
  const title = document.querySelector("[data-calendar-title]");
  const hijri = document.querySelector("[data-calendar-hijri]");
  const monthStart = new Date(selectedCalendarMonth.getFullYear(), selectedCalendarMonth.getMonth(), 1);
  const firstGridDate = new Date(monthStart);
  firstGridDate.setDate(firstGridDate.getDate() - firstGridDate.getDay());
  const monthEvents = content.events.filter((event) => {
    const eventDate = getEventDate(event);
    return eventDate && eventDate.getFullYear() === monthStart.getFullYear() && eventDate.getMonth() === monthStart.getMonth();
  });
  if (title) title.textContent = formatMonthTitle(monthStart);
  if (hijri) hijri.textContent = formatHijriMonth(selectedCalendarMonth);
  if (!selectedCalendarEventSlug && monthEvents[0]) {
    selectedCalendarEventSlug = eventSlug(monthEvents[0], content.events.indexOf(monthEvents[0]));
  }
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDate = prayerDateFor(/* @__PURE__ */ new Date());
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDate);
    date.setDate(firstGridDate.getDate() + index);
    const dateEvents = content.events.filter((event) => eventMatchesDate(event, date));
    const visibleEvents = dateEvents.slice(0, 2);
    const hiddenEvents = dateEvents.slice(2);
    const hasSelectedEvent = dateEvents.some(
      (event) => eventSlug(event, content.events.indexOf(event)) === selectedCalendarEventSlug
    );
    const isOutside = date.getMonth() !== monthStart.getMonth();
    const isToday = todayDate.getFullYear() === date.getFullYear() && todayDate.getMonth() === date.getMonth() && todayDate.getDate() === date.getDate();
    return `
      <div class="calendar-day${isOutside ? " is-muted" : ""}${isToday ? " is-today" : ""}${dateEvents.length ? " has-events" : ""}${hasSelectedEvent ? " is-selected" : ""}" data-date-label="${escapeHtml(formatShortDate(date.toISOString().slice(0, 10)))}">
        <span class="calendar-day-number">${date.getDate()}</span>
        <div class="calendar-event-stack">
          ${visibleEvents.map(
      (event) => {
        const eventIndex = content.events.indexOf(event);
        const slug = eventSlug(event, eventIndex);
        return `
                <button class="calendar-event-chip${slug === selectedCalendarEventSlug ? " is-selected" : ""}" type="button" data-event-slug="${escapeHtml(slug)}" title="${escapeHtml(eventTitle(event))}">
                  <img src="./public/icons/generated/calendar.png" alt="" aria-hidden="true">
                  <span>${escapeHtml(eventTitle(event))}</span>
                </button>
              `;
      }
    ).join("")}
          ${hiddenEvents.length ? `<button class="calendar-event-more" type="button" data-event-slug="${escapeHtml(eventSlug(hiddenEvents[0], content.events.indexOf(hiddenEvents[0])))}" title="${escapeHtml(hiddenEvents.map((event) => eventTitle(event)).join(" - "))}">+${hiddenEvents.length} more</button>` : ""}
        </div>
      </div>
    `;
  }).join("");
  grid.innerHTML = weekdays.map((day) => `<div class="calendar-weekday">${day}</div>`).join("") + cells;
  const selectedIndex = content.events.findIndex((event, index) => eventSlug(event, index) === selectedCalendarEventSlug);
  const selectedEvent = selectedIndex >= 0 ? content.events[selectedIndex] : monthEvents[0] || content.events[0];
  setCalendarDetail(selectedEvent, selectedIndex >= 0 ? selectedIndex : content.events.indexOf(selectedEvent));
  grid.querySelectorAll("[data-event-slug]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCalendarEventSlug = button.dataset.eventSlug;
      window.history.replaceState(null, "", `#event-${selectedCalendarEventSlug}`);
      const eventIndex = content.events.findIndex((item, index) => eventSlug(item, index) === selectedCalendarEventSlug);
      const event = eventIndex >= 0 ? content.events[eventIndex] : null;
      setCalendarDetail(event, eventIndex);
      document.querySelector("[data-calendar-detail]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
}
function initCalendar(content) {
  const grid = document.querySelector("[data-calendar-grid]");
  if (!grid) return;
  const hashSlug = eventSlugFromHash();
  if (hashSlug) {
    const eventIndex = content.events.findIndex((event2, index) => eventSlug(event2, index) === hashSlug);
    const event = eventIndex >= 0 ? content.events[eventIndex] : null;
    const eventDate = event ? getEventDate(event) : null;
    if (eventDate) selectedCalendarMonth = eventDate;
    if (event) selectedCalendarEventSlug = hashSlug;
  }
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-calendar-nav]");
    if (!button) return;
    if (button.dataset.calendarNav === "today") {
      selectedCalendarMonth = /* @__PURE__ */ new Date();
    } else {
      selectedCalendarMonth = new Date(selectedCalendarMonth);
      selectedCalendarMonth.setMonth(selectedCalendarMonth.getMonth() + (button.dataset.calendarNav === "next" ? 1 : -1));
    }
    selectedCalendarEventSlug = "";
    renderCalendar(content);
  });
  renderCalendar(content);
  if (hashSlug) {
    requestAnimationFrame(() => {
      document.querySelector("[data-calendar-detail]")?.scrollIntoView({ behavior: "auto", block: "nearest" });
    });
  }
}
function renderJummah(content) {
  const target = document.querySelector("[data-page-jummah]");
  if (!target) return;
  target.innerHTML = content.jummah.shifts.map(
    (shift) => `
        <div class="schedule-row">
          <span>${escapeHtml(shift.time)} - ${escapeHtml(shift.speaker)}</span>
          <strong>${escapeHtml(shift.topic)}</strong>
        </div>
      `
  ).join("");
}
function renderNews(content) {
  const target = document.querySelector("[data-page-news]");
  if (!target) return;
  const items = [...content.news, ...fallbackNews].slice(0, Math.max(6, content.news.length));
  const renderList = () => {
    target.innerHTML = items.map((item, index) => {
      const newsId = `news-${newsSlug(item, index)}`;
      return `
          <a class="news-feature" id="${escapeHtml(newsId)}" href="./news.html#${escapeHtml(newsId)}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || newsTitle(item, index))}">
            <div>
              ${item.date ? `<time datetime="${escapeHtml(item.date)}">${escapeHtml(formatShortDate(item.date))}</time>` : ""}
              ${item.title ? `<h2>${escapeHtml(item.title)}</h2>` : ""}
              ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
            </div>
          </a>
        `;
    }).join("");
  };
  const renderDetail = (item, index) => {
    const newsId = `news-${newsSlug(item, index)}`;
    target.innerHTML = `
      <article class="news-detail" id="${escapeHtml(newsId)}">
        <a class="news-detail-back" href="./news.html">Back to news</a>
        <div class="news-detail-body">
          ${item.date ? `<time datetime="${escapeHtml(item.date)}">${escapeHtml(formatShortDate(item.date))}</time>` : ""}
          ${item.title ? `<h2>${escapeHtml(item.title)}</h2>` : ""}
          ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
        </div>
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || newsTitle(item, index))}">
      </article>
    `;
  };
  const renderCurrent = () => {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    const selectedIndex = hash ? items.findIndex((item, index) => `news-${newsSlug(item, index)}` === hash || `news-${slugify(item.title)}` === hash) : -1;
    if (selectedIndex >= 0) {
      renderDetail(items[selectedIndex], selectedIndex);
      return;
    }
    renderList();
  };
  renderCurrent();
  window.addEventListener("hashchange", renderCurrent);
}
async function boot() {
  initMobileNav();
  const content = await loadCmsContent();
  initDateNavigator();
  renderPrayerTable();
  renderEvents(content);
  renderJummah(content);
  initCalendar(content);
  renderNews(content);
}
boot();
