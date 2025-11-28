# Guess My Choice – 2-Player Game Project

## **Project Overview**

**Guess My Choice** is a **turn-based, 2-player multiplayer game** for web and mobile where players create a real connection through interactive gameplay. The game is designed for **friends, couples, or adult sessions**.

- **Players:** 2 (Player 1 and Player 2)  
- **Platforms:**  
  - **Web:** Angular  
  - **Mobile:** Kotlin Multiplatform (KMP)  
- **Backend & Realtime:** Supabase (Database + Realtime + Authentication)  
- **AI Integration:** Dynamic question generation and adaptive gameplay

**Core Idea:**  
- Player 1 secretly chooses an option from a set of **AI-generated choices**.  
- Player 2 tries to guess Player 1’s choice.  
- AI analyzes previous rounds and optional **player feedback** to **adapt the next set of options** and make the game fun, engaging, and personalized.  
- Connection points are tracked and influence the outcome.

---

## **Key Features**

1. **Dynamic Gameplay**  
   - AI generates options/questions each round  
   - Adaptive difficulty and variety based on player behavior and feedback

2. **Session Types**  
   - **Friends:** Casual and funny options  
   - **Couple:** Romantic and intimate options  
   - **Adult/Sex:** Risqué, flirty, or sexual-themed options

3. **2-Player Multiplayer Support**  
   - Players join via a session code or link  
   - Realtime updates using Supabase Realtime

4. **Optional Feedback System**  
   - After each round, players can optionally provide feedback on:  
     - Whether they liked the question  
     - What type of next question they want (fun, flirty, challenging, etc.)  
   - Feedback is stored and used by AI to **personalize the next round**

5. **Replayability**  
   - AI generates new options for every round  
   - Multiple rounds per session  
   - Personalized experiences evolve based on player feedback

6. **Connection Points System**  
   - Correct guesses increase points  
   - AI can adjust difficulty or humor dynamically

---

## **Game Flow**

1. Player 1 **creates a game session** → selects session type (friends, couple, adult)  
2. AI **generates first round of options**  
3. Player 1 secretly selects an option  
4. Player 2 joins and guesses Player 1’s choice  
5. Connection points are updated  
6. **Optional Feedback Step:**  
   - Players may provide feedback on the round  
7. AI analyzes round results + optional feedback → generates next round options  
8. Repeat until game ends → final **connection score determines outcome**

---

## **Database Schema**

### **1. `game_sessions` Table**
| Column               | Type       | Description                                                   |
|---------------------|------------|---------------------------------------------------------------|
| `id`                | UUID       | Primary key                                                   |
| `player1_id`        | UUID       | Auth ID of Player 1                                           |
| `player2_id`        | UUID       | Auth ID of Player 2                                           |
| `session_type`      | TEXT       | `friends` / `couple` / `adult`                                |
| `connection_points` | INTEGER    | Total points based on correct guesses                         |
| `status`            | TEXT       | `waiting` / `active` / `finished`                             |
| `current_round`     | INTEGER    | Tracks the current round                                       |
| `created_at`        | TIMESTAMP  | Default `now()`                                               |

---

### **2. `game_options` Table**
| Column           | Type     | Description                                       |
|-----------------|----------|---------------------------------------------------|
| `id`            | UUID     | Primary key                                       |
| `game_session_id`| UUID     | Foreign key → `game_sessions.id`                 |
| `round_number`  | INTEGER  | Track round number                                |
| `option_name`   | TEXT     | AI-generated option (activity, hobby, or question)|
| `is_selected`   | BOOLEAN  | True if Player 1 selected this option            |
| `player2_guess` | TEXT     | Player 2’s guess for this round                  |
| `ai_note`       | TEXT     | Optional AI reasoning for next question          |
| `player1_feedback` | TEXT  | Optional feedback from Player 1 about this round|
| `player2_feedback` | TEXT  | Optional feedback from Player 2 about this round|

---

### **3. `options_pool` Table** (Optional)
| Column | Type  | Description                |
|--------|-------|----------------------------|
| `id`   | UUID  | Primary key                |
| `name` | TEXT  | Option name (hobby/activity/etc.) |

**Notes:**  
- AI can generate options entirely or select from `options_pool`  
- Feedback fields are optional → skipped if players choose not to provide input

---

## **AI Integration**

- **Purpose:** Generate dynamic, adaptive options and questions  
- **Analysis:** AI reviews:
  - Previous selections by Player 1  
  - Previous guesses by Player 2  
  - Connection points  
  - Optional feedback from both players

- **Next Round Generation:**  
  - Creates new option set based on analysis and session type  
  - Ensures game is fun, challenging, or surprising

- **Session Type Influence:**  
  - Friends → humorous or casual  
  - Couple → romantic or personal  
  
  - Adult → flirty or sexual

---

## **Advantages**

- **Dynamic & Replayable:** Fresh options every round  
- **Adaptive Gameplay:** AI personalizes rounds for each session  
- **Optional Player Feedback:** Players guide the AI for a tailored experience  
- **Audience-Specific:** Session type ensures appropriate content  
- **2-Player Multiplayer & Realtime:** Seamless interaction  
- **Cross-Platform:** Works on Angular web and KMP mobile

