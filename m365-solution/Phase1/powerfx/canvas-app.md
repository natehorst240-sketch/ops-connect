# Canvas App Spec — MX Request

Power Apps canvas app, Phone form factor. Two screens: form, then
confirmation. All Power Fx formulas you need to drop into Power Apps
Studio are below.

## App-level

### App.OnStart

```powerapps
Set(varCurrentUser, User());
Set(varAircraftChoices, [
  { tail: "N431HC", type: "AW109SP" },
  { tail: "N251HC", type: "AW109SP" },
  { tail: "N281HC", type: "AW109SP" },
  { tail: "N291HC", type: "AW109SP" },
  { tail: "N271HC", type: "AW109SP" },
  { tail: "N531HC", type: "AW109SP" },
  { tail: "N261HC", type: "AW109SP" },
  { tail: "N381HC", type: "AW109SP" },
  { tail: "N481HC", type: "AW109SP" },
  { tail: "N631HC", type: "AW109SP" },
  { tail: "N731HC", type: "AW109SP" }
]);
// Phase 2: replace with `Set(varAircraftChoices, cr_aircraft);` once that table exists
```

### App.OnError

```powerapps
Notify("Something went wrong: " & FirstError.Message, NotificationType.Error, 5000)
```

## Screen 1 — `frmRequest`

### `frmRequest.OnVisible`

```powerapps
Reset(ddAircraft);
Reset(ddType);
Reset(dpStart);
Reset(dpEnd);
Reset(txtBase);
Reset(txtReason);
Reset(rdoPriority);
Set(varSubmitting, false);
Set(varValidationError, "")
```

### `ddAircraft` (Dropdown — Aircraft)

| Property      | Formula                                                  |
| ------------- | -------------------------------------------------------- |
| `Items`       | `varAircraftChoices`                                     |
| `Value`       | `ThisItem.tail`                                          |
| `Default`     | `""`                                                     |
| `OnChange`    | `Set(varSelectedTail, Self.Selected.tail); Set(varSelectedType, Self.Selected.type)` |

### `ddType` (Dropdown — MX Type)

| Property | Formula                                                                            |
| -------- | ---------------------------------------------------------------------------------- |
| `Items`  | `["Phase Inspection", "Repair", "Overhaul", "Time Off", "Open Shift", "AOG", "Other"]` |
| `Default`| `"Phase Inspection"`                                                               |

### `dpStart` / `dpEnd` (Date pickers)

| Property        | `dpStart` formula                  | `dpEnd` formula                                                                 |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| `DefaultDate`   | `Today() + 1`                      | `Today() + 1`                                                                   |
| `StartYear`     | `Year(Today())`                    | `Year(Today())`                                                                 |
| `EndYear`       | `Year(Today()) + 1`                | `Year(Today()) + 1`                                                             |

Pair each with a time-of-day Dropdown:

| Property | `ddStartTime` formula                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------- |
| `Items`  | `Sequence(48, 0, 1).Value` then format — simpler: hard-code `["06:00", "07:00", ..., "22:00"]`         |
| `Default`| `"07:00"`                                                                                             |

### `txtBase` (Text input — Base)

| Property | Formula                |
| -------- | ---------------------- |
| `HintText` | `"Logan, St. George, ..."` |
| `Default`  | `""`                  |

### `txtReason` (Text input — multi-line)

| Property      | Formula                                              |
| ------------- | ---------------------------------------------------- |
| `Mode`        | `TextMode.MultiLine`                                 |
| `MaxLength`   | `1000`                                               |
| `HintText`    | `"Why this MX, any coordination notes…"`             |

### `rdoPriority` (Radio — Priority)

| Property | Formula                            |
| -------- | ---------------------------------- |
| `Items`  | `["Normal", "High", "AOG"]`        |
| `Default`| `"Normal"`                         |

### `lblValidation` (label — hidden by default)

| Property  | Formula                              |
| --------- | ------------------------------------ |
| `Text`    | `varValidationError`                 |
| `Visible` | `!IsBlank(varValidationError)`       |
| `Color`   | `RGBA(255, 80, 80, 1)`               |

### `btnSubmit.OnSelect`

```powerapps
// 1. Validate
If(
    IsBlank(ddAircraft.Selected.tail),
        Set(varValidationError, "Pick an aircraft.");
        Notify("Pick an aircraft.", NotificationType.Warning),
    DateTimeValue(Text(dpEnd.SelectedDate) & " " & ddEndTime.Selected.Value) <=
    DateTimeValue(Text(dpStart.SelectedDate) & " " & ddStartTime.Selected.Value),
        Set(varValidationError, "End must be after start.");
        Notify("End must be after start.", NotificationType.Warning),
    IsBlank(txtBase.Text),
        Set(varValidationError, "Enter a base.");
        Notify("Enter a base.", NotificationType.Warning),

    // 2. Patch
    Set(varSubmitting, true);
    Set(varValidationError, "");
    Set(varNewRequest,
        Patch(
            cr_mx_request,
            Defaults(cr_mx_request),
            {
                cr_aircraft_tail:    ddAircraft.Selected.tail,
                cr_aircraft_type:    ddAircraft.Selected.type,
                cr_request_type:     ddType.Selected.Value,
                cr_window_start:     DateTimeValue(Text(dpStart.SelectedDate) & " " & ddStartTime.Selected.Value),
                cr_window_end:       DateTimeValue(Text(dpEnd.SelectedDate)   & " " & ddEndTime.Selected.Value),
                cr_base:             txtBase.Text,
                cr_reason:           txtReason.Text,
                cr_priority:         rdoPriority.Selected.Value,
                cr_status:           "Submitted",
                cr_requested_by:     varCurrentUser,
                cr_audit_correlation: GUID()
            }
        )
    );
    Set(varSubmitting, false);

    // 3. Branch on success
    If(
        IsBlank(varNewRequest.cr_request_number),
            Notify("Submission failed. Try again.", NotificationType.Error),
            // success
            Navigate(frmConfirmation, ScreenTransition.Cover)
    )
)
```

### `btnSubmit.DisplayMode`

```powerapps
If(varSubmitting, DisplayMode.Disabled, DisplayMode.Edit)
```

### `btnSubmit.Text`

```powerapps
If(varSubmitting, "Submitting…", "Submit Request")
```

## Screen 2 — `frmConfirmation`

A simple “you're done” screen. The Power Automate flow has already fired by
the time the user lands here.

### `lblHeader.Text`

```powerapps
"Submitted!"
```

### `lblRequestNumber.Text`

```powerapps
"Request " & varNewRequest.cr_request_number
```

### `lblBody.Text`

```powerapps
"Your request was submitted to " & varNewRequest.cr_base & 
". You'll get a Microsoft Teams DM as soon as the RMM decides."
```

### `btnNew.OnSelect`

```powerapps
Navigate(frmRequest, ScreenTransition.UnCover)
```

### `btnHistory.OnSelect`

```powerapps
// Phase 2 — navigate to a history screen filtered to varCurrentUser.
// For Phase 1, hide the button or use:
Launch("https://make.powerapps.com/...")
```

## Important Power Fx gotchas

- **Choice column writes** use the choice's *label*, not the numeric value
  (e.g., `"Submitted"`, not `1`). Power Apps does the lookup.
- **Lookup column writes** require the full record:
  `cr_requested_by: varCurrentUser`. Don't pass just the GUID.
- **`Defaults(cr_mx_request)`** seeds the row with the table's defaults
  before your Patch overrides them. Without it, you can leave required
  fields blank.
- **`GUID()`** generates a new globally unique ID for `cr_audit_correlation`.
  Used to join request transitions across `cr_audit` rows in Phase 2+.
- **Date+time concatenation** — Power Apps doesn't have a single date+time
  picker out of the box; the pattern above (`DateTimeValue(Text(date) & " " & time)`)
  is the canonical workaround.
