---
tags: [animation, interaction, agents, canvas, spec, ceo-sim]
date: 2026-04-18
status: active
---

# CEO Simulator -- Animation & Interaction Bible

Complete specification for character animations, environmental interactions, and event-driven sequences.

---

## 1. Agent State Machine

### State: Idle
**Trigger:** `ticket.status = null` or `agent.status = 'idle'`
- Randomly cycles micro-idles every 20-40s: slow typing, leaning back, stretching, coffee run, watering plant, checking phone
- Subtle breathing bob: 2px up/down, 3s ease-in-out loop
- **Floating icon:** Grey `...` (fade in/out loop 1.2s)

### State: Thinking / LLM Call
**Trigger:** LLM API call initiated
- Agent freezes mid-step, screen turns blue with Matrix-style scrolling
- Speech bubble with animated `...` ellipsis after 3s
- **Floating icon:** Blue brain, scale pulse 1.0->1.15, 0.8s

### State: Working / Coding
**Trigger:** `ticket.status = 'in_progress'`
- Rapid keyboard typing: bounce +/-2px, 80ms interval
- Screen fills with fast-scrolling green Matrix text
- Coffee cup gradually empties (5 stages based on task progress)
- **Floating icon:** Spinning gear, 1.5s rotation

### State: Needs Approval
**Trigger:** `ticket.status = 'review'` or plan awaiting approval
- Agent walks to CEO desk, stands waiting
- If ignored 30s: returns to desk, slumps
- Kanban whiteboard border flashes yellow
- **Floating icon:** Bouncing red `!`

### State: Collaborating
**Trigger:** Agent-to-agent query
- Both agents path to midpoint, face each other
- Alternating speech bubbles, shared screen prop
- Dotted line connects them during interaction
- **Floating icon:** Chat bubble

### State: Database Query
**Trigger:** Vector/RAG search call
- Agent holds glowing tablet, walks to Vector Vault
- Cable extends from tablet to server
- Server LEDs cascade green top-to-bottom
- **Floating icon:** Database with magnifying glass

### State: Debugging
**Trigger:** Circuit breaker failure, QA assigned
- QA walks to Dev's desk with giant pixelated hammer
- Hammer raise -> Dev ducks -> Hammer swing -> Screen goes green
- QA thumbs-up, Dev wipes forehead (sweat drop)
- **Floating icon:** Bug, wobble +/-5deg

### State: Blocked / Waiting
**Trigger:** Upstream dependency not complete
- Agent sits with arms crossed, taps desk every 8s
- Turns head toward blocking agent every 15s
- Deadlock: both in hallway with red infinity loop between them
- **Floating icon:** Hourglass

### State: On Break
**Trigger:** Random idle event or gap between tasks
- Walk to kitchen, coffee machine pours, sit at break table
- Returns at 1.1x speed (refreshed)
- **Floating icon:** Coffee cup with steam

### State: Reviewing PR/MR
**Trigger:** Pending MR, QA assigned
- Walk to QA Terminal, reading glasses overlay
- Diff scrolls on terminal, stamps APPROVED (green) or REJECTED (red)
- **Floating icon:** Magnifying glass

---

## 2. Lifecycle Event Sequences

### CEO Directive Entered
1. Command line cursor blinks rapidly
2. CEO stands from desk, walks to center
3. All agents pause and turn to face CEO
4. CEO walks to War Room projector
5. Projector unrolls, architecture diagram appears

### Plan Approved -> Sprint Created
1. Green APPROVED stamp animation
2. PM jumps, runs to Kanban board
3. Sticky notes flutter down onto board
4. PM walks to each agent desk, hands off tickets
5. Gear icons spin up in a wave

### Agent Completes Task -> Creates MR
1. Agent leans back, checkmark particle burst
2. Picks up USB stick, walks to QA Terminal
3. QA terminal siren activates (yellow flash)
4. Agent returns with satisfied walk
5. Kanban ticket slides: In Progress -> Review

### Sprint Complete
1. Board glows, all agents walk to War Room
2. CONFETTI: 40 pixel squares from ceiling
3. CEO fist pump, PM claps, Devs high-five
4. Projector: "Sprint X Complete" + velocity chart
5. Agents return to desks, new sticky notes appear

---

## 3. Management Sequences

### Hire Agent -- Telepad
1. Telepad rings pulse from center
2. Light beam descends from ceiling (cyan)
3. Agent assembles bottom-up (scanline sweep)
4. CEO walks over, handshake
5. PM escorts to assigned desk
6. Boot-up sequence on screen

### Fire Agent
1. CEO walks to agent at 1.2x speed, red aura
2. All nearby agents stop and watch
3. "We need to talk" speech bubble
4. Screen goes dark, agent packs items into cardboard box
5. Slow walk to elevator (0.7x speed, looking down)
6. Elevator doors open/close
7. Other agents exchange glances, return to work
8. Desk shows "VACANT" label

### Daily Standup
1. PM claps, agents walk to semicircle near board
2. PM points at board, each ticket glows in sequence
3. Each agent steps forward (spotlight moment)
4. Agents nod, disperse to desks
5. Typing begins in left-to-right wave

---

## 4. Error State Sequences

### Circuit Breaker Trips
- Screen flashes red, smoke particles rise
- Agent holds head in hands, error skull icon
- PM runs over, checks screen, CEO walks over
- Dead letter envelope prop stays until resolved

### Budget Warning (80%)
- Accountant calculator sparks, runs to CEO with bill
- Status bar turns amber
- All agent gear icons slow down
- LED ticker: "BUDGET AT 80%"

### Budget Exceeded (100%)
- All agents stop, office lights dim
- All screens go dark
- "BUDGET EXCEEDED -- OPERATIONS SUSPENDED"
- Agents sit with hands in lap until next day reset

---

## 5. Environmental & Ambient Props

| Prop | Idle Animation | Active State | Trigger |
|------|---------------|--------------|---------|
| Coffee machine | Steam wisps, 3s loop | Pour stream | Agent visits |
| Wall clock | Second hand rotates | Hands spin fast during crunch | Sprint deadline |
| LED ticker | Token % scrolls | Color: white->amber->red | Budget level |
| Server rack LEDs | Blue slow pulse | Green cascade during query | Brain search |
| Plants on desks | Subtle sway, 4s loop | Watering animation | Agent idle |
| Telepad | Faint shimmer | Full brightness + rings | Hire triggered |
| Trash bin | Static | Paper ball lands | Ticket rejected |
| Whiteboard | Static | PM draws marks | Sprint update |

### Plant Growth System
- Each task completed: plant scale += 0.5% (max 150%)
- Agent on break: watering +1%
- Agent fired: plant wilts (desaturates to grey)
- Fully grown: occasional flower bloom (1% chance per task)

### Time of Day Lighting (real local time)
- 06:00-08:00: Dawn warm orange overlay
- 08:00-18:00: Day neutral
- 18:00-20:00: Sunset amber overlay
- 20:00-06:00: Night dark blue, desk lamps activate

### Weather (system health)
- Build passing: no weather
- Failing tests: rain particles outside window
- Sprint complete: sunshine rays from window
- Budget critical: storm flicker

---

## 6. Animation Priority Queue

```
CRITICAL: FIRE_SEQUENCE
HIGH:     HIRE_SEQUENCE, SPRINT_COMPLETE, CIRCUIT_BREAKER
NORMAL:   NEEDS_APPROVAL, COLLABORATING, WORKING, THINKING
LOW:      IDLE
```

Only one icon shown at a time (highest priority). Transitions: current fades out (0.2s), new fades in (0.2s).

---

*Animation Bible v1.0 -- Source of truth for all canvas animations*
