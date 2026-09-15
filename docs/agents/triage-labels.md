# Triage Labels

The skills speak in terms of five canonical triage roles. This repo uses the default strings, unchanged.

| Role                     | Label in our tracker     | Meaning                                  |
| ------------------------ | ------------------------ | ---------------------------------------- |
| `needs-triage`           | `needs-triage`           | Maintainer needs to evaluate this issue  |
| `needs-info`             | `needs-info`             | Waiting on reporter for more information |
| `ready-for-agent`        | `ready-for-agent`        | Fully specified, ready for an AFK agent  |
| `ready-for-human`        | `ready-for-human`        | Requires human implementation            |
| `wontfix`                | `wontfix`                | Will not be actioned                     |

The tracker is local markdown (see `issue-tracker.md`), so a label is written as a `Status:` line near the top of the ticket file rather than applied to a remote issue:

```markdown
Status: ready-for-agent
```

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding string above. Edit the right-hand column to match whatever vocabulary you actually use.
