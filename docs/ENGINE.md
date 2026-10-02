# Dispatch engine guide

[Back to the project README](../README.md)

## Purpose

Relay's engine validates a proposed dispatch plan against the resources and requirements in the demo. It answers three practical questions:

1. Are the selected people and vehicles eligible for this job?
2. Are they available during its planned time window?
3. Does the assignment cover the requested crew and load?

The dispatcher makes the selections. The engine returns specific reasons when a selection does not work, retains incomplete jobs for planning, and updates the operational view when a valid change is committed.

All implementation is in [`assets/js/app.js`](../assets/js/app.js). Data, validation, rendering, and reporting share one source of state.

## Data model

| Entity | Important fields | Role |
| --- | --- | --- |
| Job | `id`, `move`, `customerId`, `date`, `start`, `end`, `weight`, `minLevel`, `reqMovers`, `reqPackers`, `secure`, `status` | Holds the work order and its requirements. |
| Truck assignment | `driver`, `foreman`, `vehicle`, `crew` | Holds resource IDs for one internal truck. A job may contain up to three assignments. |
| Person | `id`, `name`, `role`, `cleared`, `trained`, `license` | Defines a driver, foreman, mover, or packer. |
| Vehicle | `id`, `level`, `capacity`, `type` | Defines vehicle eligibility and sample load capacity. |
| Contractor | `id`, `movers`, `packers`, `level`, `capacity`, `cleared` | Represents a complete external team and vehicle. |
| Activity event | `time`, `jobId`, `label` | Describes a committed change in this browser. |

Jobs reference resources by ID. Lookups such as `PERSON`, `VEHICLE`, and `CONTRACTOR` resolve those IDs to records. An internal job uses `assignments`; a contractor job uses its `contractor` ID and the team's own resource counts.

The persisted object contains a schema version, jobs, and activity events. UI filters, open dialogs, and undo/redo stacks are session state rather than persisted records.

## Assignment flow

### 1. Create a draft

`openJob()` clones a saved job into a draft. Edits are made to that draft, so cancelling the panel does not alter the saved schedule. `newJob()` creates a new planning record with empty resources.

### 2. Check individual resource choices

`resourceReason()` checks each proposed selection and returns either an empty string or an explanation. The picker uses that explanation to disable incompatible choices.

| Check | Example refusal |
| --- | --- |
| Role | A driver cannot be placed in the foreman role. |
| Vehicle level | A pack van cannot cover a job requesting a CDL-B truck. |
| Training | A driver trained only for vans cannot operate the selected larger truck, even with a higher licence. |
| Licence | A driver's licence level must cover the selected vehicle. |
| Clearance | A restricted-site job cannot use a person without clearance. |
| Duplicate slot use | One vehicle or person cannot be assigned to two trucks on the same job. |
| Time conflicts | A person or vehicle booked on an overlapping job is unavailable. |
| Riders | An additional mover or packer cannot exceed the four-rider limit. |

Driver eligibility uses the selected vehicle's level. If a vehicle has not yet been selected, it uses the job's minimum level.

### 3. Check the complete job

`issuesFor()` combines individual resource checks with the job's requirements. Each issue contains `text` and a `hard` flag.

| Issue type | Examples | Result when saving |
| --- | --- | --- |
| Planning gap | Missing weight, driver, foreman, vehicle, mover, or packer | May be saved; the job remains **To plan**. |
| Hard issue | Invalid times, wrong role, insufficient training, clearance failure, overlapping booking, overloaded vehicles, duplicate resources | Save is refused until corrected. |

Client and route fields must be present. Times must be valid, with the end after the start on the same date. Crew requests must be nonnegative integers and include at least one person. Recorded weight must be positive and within the demo's accepted input range.

For internal jobs, every truck slot requires its own driver, foreman, and vehicle. Selected vehicles must meet the requested minimum level. Their capacities are summed once and compared with the job-level weight.

The current model compares every recorded job weight with its assigned vehicle capacity, including packing jobs. These are simplified sample planning rules; there is no service-specific transport calculation.

### 4. Commit a valid change

`saveDraft()` checks the draft again. It refuses hard issues, allows incomplete planning jobs, and promotes a complete planning assignment to **Ready to go** when saved. In-progress or completed jobs cannot be saved with planning gaps.

`commit()` captures the previous state, applies the change, adds an activity event, stores the new state locally, and renders the updated views. The latest 30 commits can be undone during the session. Activity is capped at 150 events.

`moveJob()` applies the same validation to drag-and-drop. Status moves into **In progress** require a ready job, and completion requires an in-progress job. Completed jobs must be reopened to ready before moving elsewhere. In-progress and completed jobs cannot be rescheduled by dragging between days; reopening is required first.

## Time conflict calculation

Two planned jobs conflict when they share a date and:

```text
start_A < end_B AND start_B < end_A
```

A 09:00–12:00 booking conflicts with 11:30–14:00. It does not conflict with 12:00–15:00 because the intervals only meet at a boundary.

Conflicts apply across jobs and within a multi-truck job. The same `move` identifier does not bypass the rule. Completed jobs retain their planned bookings, so they still reserve resources for the interval recorded in the schedule.

The demo does not add travel time, loading buffers, working-hour limits, or overnight scheduling. There is no automatic recalculation from actual arrival or completion times.

## Crew calculations

### Internal jobs

`crewCount()` collects distinct foremen and riders across all trucks:

```text
assigned movers = foremen + people with the mover role
assigned packers = people with the packer role
crew total = assigned movers + assigned packers
```

Drivers are counted separately for resource use. They do not satisfy the requested mover count.

Each truck's foreman plus additional crew may total at most four riders besides the driver. A job with two trucks can therefore distribute its requested crew across both assignments, but each truck still needs a separate foreman and driver.

### Contractor jobs

The contractor record supplies `movers` and `packers`. Its mover count already includes the contractor lead:

```text
contractor crew size = movers, including lead + packers
```

Do not add the lead again. For example, Juniper crew has three movers and one packer, so its crew total is four.

The engine also checks the contractor's vehicle level, capacity, clearance, and overlapping bookings.

## Vehicle levels

| Level | Demo vehicle type | Sample capacity |
| --- | --- | ---: |
| 1 | Pack van | 3,000 lb |
| 2 | Straight truck, non-CDL | 9,000 lb |
| 3 | Straight truck, CDL-B | 16,000 lb |
| 4 | Tractor and trailer | 26,000 lb |

Eligibility checks training and licence independently. The numeric levels are a simplified model for this demo, not a full licensing or compliance system.

## Worked planning example

The first demo day includes **Alder residence**, an unassigned local move with a 09:00–13:00 window, a recorded load of 3,700 lb, and a request for two movers.

1. An available level-2 truck covers its minimum vehicle level and load.
2. An eligible, available driver operates the truck.
3. A separate foreman leads the job and counts as one mover.
4. One additional mover completes the requested crew.
5. If there are no conflicts or other gaps, saving the assignment moves it to ready.

Selecting a foreman or driver already booked during that window is refused. Omitting the extra mover leaves a planning gap. Selecting an incompatible driver or an overloaded vehicle creates a hard issue.

## Status and report calculations

`stateOf()` produces the displayed status. A stored ready job with validation issues is displayed in the planning queue. Stored in-progress and completed statuses retain their lanes, while any issues still appear in the reporting queue.

`summary()` computes:

| Metric | Definition |
| --- | --- |
| Scheduled jobs | Number of job records in the selection, not number of truck slots. |
| Ready to go | Jobs whose displayed status is ready. |
| Covered jobs | Ready, in-progress, or completed jobs with no validation issues. |
| Needs attention | Jobs in planning or with any validation issue. |
| Recorded load | Sum of available job weights, once per job. |
| Missing weights | Jobs with a null survey weight. |
| Contractor jobs | Jobs using an external contractor. |

`utilization()` counts distinct internal resources assigned on each day. It includes completed jobs and excludes contractor-owned resources. In an all-days view, the displayed usage for each resource category is the maximum daily count for that category. The categories' peaks may occur on different days.

The report's charts and schedule table follow search and service/attention filters. Overview metrics use the complete selected date range. Activity is not filtered by job date.

## Exports, persistence, and input handling

- `scheduleRows()` emits one CSV row per internal truck or contractor assignment. Repeated job-level fields are named with the `job_` prefix.
- `summaryRows()` emits one daily summary per selected date and avoids multi-truck double counting.
- `csvText()` quotes fields, escapes embedded quotation marks, and prefixes formula-like cells to prevent spreadsheet interpretation.
- `esc()` escapes user-entered text before it is inserted into rendered HTML.
- `validSaved()` checks the structure, IDs, dates, values, and known resource references before accepting restored browser state.
- `loadState()` and `persist()` use the `relay-fictional-dispatch-v1` browser key. Storage failure leaves a usable session and CSV exports.
- `undo()` and `redo()` restore saved snapshots and record the action. Their stacks are not retained across reloads.

## Function map

| Function | Responsibility |
| --- | --- |
| `makeRoster()`, `makeSeed()` | Generate the fictional starting scenario. |
| `resourceReason()` | Evaluate a proposed person or vehicle selection. |
| `overlaps()` | Compare planned time windows. |
| `crewCount()` | Count distinct internal crew or the complete contractor team. |
| `issuesFor()` | Produce planning gaps and hard assignment issues. |
| `stateOf()` | Determine the visible job status. |
| `saveDraft()`, `moveJob()` | Validate and apply edits or drag-and-drop changes. |
| `commit()`, `undo()`, `redo()` | Maintain change history and state snapshots. |
| `summary()`, `utilization()` | Calculate report metrics from the current jobs. |
| `matchingJobs()` | Apply date, search, service, and attention selection. |
| `render()` | Refresh the board, schedule, reports, or activity view. |
| `scheduleRows()`, `summaryRows()`, `csvText()` | Build CSV exports. |
| `validSaved()`, `loadState()`, `persist()` | Handle browser storage. |

## Scope

The engine uses direct scans of a small in-memory schedule. It is intended to demonstrate dispatch logic and reporting with a compact dataset. Resource/date booking indexes would be the natural next step if the dataset became substantially larger.

It does not implement automatic dispatch, crew performance scoring, route selection, prediction, database constraints, server-side authorization, or shared state across dispatchers.
