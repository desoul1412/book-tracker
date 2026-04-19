---
tags: [ui, ux, diegetic, ceo-sim, design, interactive-props]
date: 2026-04-18
status: active
---

# CEO.SIM - Diegetic UI/UX Design Blueprint

## 1. Core UX Philosophy: "Diegetic Interface"

The core focus of this design is to completely eliminate the traditional Navigation Bar. All user interactions will occur through a **Diegetic UI** -- meaning the user interface is integrated directly into the game world as physical objects.

**Visual Vibe:**

- **The World (Canvas):** Isometric pixel-art perspective, similar to games like Kairosoft (Game Dev Story) or Habbo Hotel.
- **Menus/Modals:** Dark mode Terminal/Hacker style with neon borders (Cyan, Purple, Terminal Green) matching the current design.

## 2. Global Screen Layout

The screen is divided into 2 main layers:

**Background Layer (Game World):** Takes up 100% of the screen area. This is where the pixel office runs continuously.

**Fixed UI Layer:**

- **Bottom Bar (Command Line):** Keep the "CEO Directive" chat box at the bottom edge of the screen. This is where users enter prompts to assign work to the entire office.
- **Top Right (Status):** A small pixelated strip displaying Token Usage | Budget $ | Online Status.

## 3. Interactive Props (Replacing Old Tabs)

These are physical objects in the office that replace the old Tabs (Goals, Board, Docs, MRs, Org, Config).

### A. The War Room Projector (Replaces Tab: GOALS)

- **Location:** Meeting room (black and white checkered floor).
- **Visual State:** A large projector screen pulled down from the ceiling.
- **UX Interaction:**
  - Hover: The screen glows with a Cyan border, mouse cursor changes to magnifier.
  - Click: The office background dims (blurs). A Terminal-style Modal appears in the center showing the Project Goals.
- **Animation:** The CEO agent occasionally walks here and points at the chart with a pointer.

### B. The Kanban Whiteboard (Replaces Tab: BOARD)

- **Location:** Hanging on the wall in the central area (Dev Room).
- **Visual State:** A large whiteboard with colored dots (representing sticky notes).
- **UX Interaction:**
  - Hover: The whiteboard shakes slightly or its border lights up.
  - Click: Slides open a Modal displaying a drag-and-drop Kanban interface (Todo, In Progress, Review, Done).
- **Animation:** The PM constantly walks around this area. When a ticket status changes, the PM performs a "sticking note on the board" animation.

### C. The QA Terminal (Replaces Tab: MRS)

- **Location:** A secluded desk; a computer with a red/orange screen.
- **Visual State:** If there are Merge Requests to review, a small warning light (Siren) on the desk flashes yellow.
- **UX Interaction:**
  - Click: Opens the list of Pull Requests/Tickets needing source code review.

### D. The Vector Vault / Brain (Replaces Tab: DOCS)

- **Location:** A massive Server Rack cluster in the tech room, with a smaller "The Brain" neon sign on top of the servers.
- **Visual State:** When data is being analyzed or an Agent is accessing RAG memory, the servers flash green (Matrix green).
- **UX Interaction:**
  - Click: Opens the document library with vector-style nodes representing stored data.
- **Animation:** "Data Analyst" and "Backend" Agents frequently walk here, plugging a cable from their tablet into the server.

### E. The Accountant Ledger / Heart Icon (Replaces Tab: ORG & COSTS)

- **Location:** LED scrolling text ticker mounted on the wall near the entrance, or the Accountant's desk.
- **Visual State:** Heart icon in top-right corner of the office.
- **UX Interaction:** Click to open the Organization Chart (Org Chart), Budget Spending Status, and Token Costs.

### F. The Recruitment Telepad (New Feature: HIRE)

- **Location:** A circular metal platform at the door/entrance area.
- **Visual State:** Faint ring shimmer when idle.
- **UX Interaction:**
  - Click: Opens the list of available Agents to hire (Dev, Data Analyst, QA, etc.).
- **Animation:** When "Hire" is clicked, a beam of light shines down on the pad, pixels assemble into the new employee, and they step off to start walking to their desk.

### G. The Clipboard (Task List / Backlog)

- **Location:** Top-right area of the office, near the status display.
- **UX Interaction:** Click to open the task list / backlog view.

## 4. Agent Interaction & States

Use Floating Icons above Agents' heads to show project status without opening the Dashboard.

| State | Floating Icon | Agent Action on Canvas |
|-------|--------------|----------------------|
| Idle | Grey `...` | Sitting, drinking coffee, watering plants, or typing slowly |
| Needs Approval | Bouncing Red `!` | Standing at CEO's desk or Whiteboard waiting |
| Thinking / LLM | Blue brain / hourglass | Standing still, computer screen flashes |
| Working (Coding) | Spinning gear | Typing at high speed, code scrolling on screen |
| Database Query | Magnifier / DB icon | Walking to Vector Vault, cable plug-in action |
| Collaborating | Chat bubble | Two employees standing together, chat bubble appears |
| Debugging | Bug icon | QA hitting Dev's computer with pixelated hammer |

### Agent Context Menu (Click on Agent):

A mini-modal (Card) pops up next to the character, displaying:
- **Name & Role:** (e.g., Claude - Data Analyst)
- **Skills:** Data Analysis, RAG, Python
- **Current Task:** "Analyzing customer dataset"
- **Action Buttons:** Talk to agent, edit config, or fire

## 5. Typical User Flow

1. **Assigning Work:** Type into "CEO Directive" bar: "Analyze April customer data..." → Press Enter.
2. **Planning:** CEO Agent gets `...` icon. After processing, CEO walks to PM's desk.
3. **Requesting Approval:** Whiteboard flashes yellow border, PM gets `!` sign. Click Whiteboard.
4. **Approving:** Kanban board opens, see divided tasks. Click Approve.
5. **Execution:** PM runs around handing out tickets. Agents go to their stations.
6. **Completion:** Whole office gathers in War Room throwing confetti.

---

*Source: CEO Directive design document, adapted for isometric pixel office sandbox*
