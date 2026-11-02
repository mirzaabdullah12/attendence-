# 8star Attendance

A React Native (Expo SDK 58, Expo Router) attendance app for 8star teams in **Pakistan** and the **United States**.

## Features

- **GPS verified clock in / clock out** against office geofences (Lahore, Karachi, Islamabad, New York, Houston, Los Angeles). Clock-ins outside the radius are blocked, with an explicit "clock in remotely" override that is flagged on the record for manager review.
- **Break in / break out** with live timers. Worked time is net of breaks.
- **Live GPS trail** while on duty (foreground watch every ~30 s / 25 m, toggle in Profile).
- **Shifts and sessions** evaluated in the employee's own time zone. US employees default to the **9 AM to 9 PM** 12-hour shift; Pakistan has day, evening and night (US-support, crosses midnight) shifts. Late and early-leave minutes are computed with a grace period.
- **Weekly schedule** with per-day shift and office assignment, notes, and one-tap auto-fill from the employee's default shift. Managers can schedule any employee.
- **History** with weekly totals (days, hours, late, remote) and per-day detail.
- **Locations** list grouped by country with distance from you and local office time. Managers can pin a new office geofence from their current GPS position.
- **Dark / light / system theme** with a monochrome black-and-white 8star logo that adapts to the theme.

## Demo accounts (PIN `1234`)

| Code    | Name          | Role     | Region | Default shift          |
|---------|---------------|----------|--------|------------------------|
| EMP001  | Ahmed Raza    | Employee | PK     | PK Day 09:00–18:00     |
| EMP002  | Sara Khan     | Manager  | PK     | PK Day 09:00–18:00     |
| EMP003  | Bilal Hussain | Employee | PK     | PK Night 21:00–06:00   |
| US001   | John Carter   | Employee | US     | US 9 to 9 09:00–21:00  |
| US002   | Emily Chen    | Manager  | US     | US 9 to 9 09:00–21:00  |

## Run

```bash
npm install
npx expo start          # then press a (Android) / i (iOS) or scan with Expo Go
npm run typecheck
npm run lint
```

Location permission is requested on first launch of the Clock tab. In a simulator, set a custom location near one of the seeded offices (for example 31.4697, 74.2728 for Lahore HQ or 40.7484, -73.9857 for New York) to test the geofence.

## Architecture

Clean architecture with a one-way dependency rule: `presentation → domain ← data`, wired in `src/core/di/container.ts`.

```
src/
  app/                  Expo Router routes only (layouts + screens)
    (tabs)/             Clock · Schedule · History · Locations · Profile
  domain/
    entities/           Employee, ShiftTemplate, OfficeLocation, ScheduleEntry, AttendanceRecord…
    repositories/       Repository interfaces (ports)
    services/           Pure logic: geofence math, time-zone shift evaluation, worked-time math
    usecases/           ClockIn, ClockOut, StartBreak, EndBreak, schedule and location use cases
  data/
    storage/            AsyncStorage key-value adapter
    repositories/       Repository implementations (seeded + persisted)
    location/           expo-location wrapper
    seed/               Offices, shifts, demo employees
  presentation/
    theme/              Light/dark tokens + ThemeProvider
    components/         Logo8Star, Button, Card, Pill, Sheet, Icon…
    store/              Zustand stores (auth, settings, attendance, schedule)
    hooks/              useNow, useLocationTracking, useHaptics
  core/
    di/                 Composition root
    utils/              id generator
```

Swapping AsyncStorage for a backend only requires new classes in `src/data/repositories` and re-wiring the container. Domain and UI stay untouched.

## Notes

- Background location (tracking with the app closed) needs a development build plus `expo-task-manager`; the app currently tracks in the foreground, which works in Expo Go.
- ESLint was installed with `--legacy-peer-deps` because `eslint-config-expo` pulls a `react-dom` peer that conflicts with React 19.3.0 in SDK 58.
