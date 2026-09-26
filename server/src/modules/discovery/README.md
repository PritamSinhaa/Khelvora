# Discovery recommendations

`sort=recommended` uses a deterministic 100 point score. The weights are shared with `recommendation.js`:

| Signal | Weight | Scoring |
| --- | ---: | --- |
| Compatible sport | 30 | Candidate must match one of the selected/profile sports. |
| Distance | 25 | Linear from 25 at zero distance to 0 at the selected radius (or 100 km when no radius filter was supplied). |
| Skill | 20 | Same level: 20; one adjacent level: 10; two levels apart or missing skill: 0. |
| Availability | 25 | Awarded when recurring weekly intervals overlap within the next 14 days. |

Availability slots are interpreted in each profile's IANA time zone and converted into actual UTC intervals, so offsets and daylight saving changes are respected. Missing or invalid legacy availability contributes no points. Missing candidate location contributes no distance points and is displayed without a distance; if the caller explicitly sets a radius and has no reference location, the result is empty because membership in that radius cannot be verified.

Search text, sport, skill, radius, and recruiting filters are applied in the MongoDB candidate pipeline before ranking. Inactive players and team leaders, the requester, and users blocked in either direction are excluded. Teams are scored against the requester profile for the team's sport and availability from their current roster profiles.

Candidates are streamed from MongoDB. The server keeps only the best `page * limit` rows in a bounded heap (discovery pages are capped at 1,000), then sorts ties by exact distance and stable entity ID. Public recommendations return only a five-kilometre distance bucket; exact coordinates and raw distance are not included.
