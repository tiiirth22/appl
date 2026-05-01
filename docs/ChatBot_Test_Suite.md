# ApplianceIQ ChatBot Comprehensive Test Suite

This suite is designed to verify RAG engine accuracy, UI responsiveness, and mobile event handling.

## 1. Interaction & Edge Cases
| Category | Test Prompt | Expected Behavior |
| :--- | :--- | :--- |
| **Basic Greeting** | "Hello! Who are you?" | Identify as ApplianceIQ assistant. |
| **Simple Inquiry** | "What is this laptop called?" | Accurate product name from manual. |
| **Technical Spec** | "What is the Thunderbolt 5 bandwidth?" | Retrieve "40 Gbps" accurately. |
| **Multi-line Input** | "Can you tell me:\n1. Battery size\n2. Charger type" | Parse and answer both points. |
| **Special Chars** | "What's the max temp? ┬░C/┬░F ∩┐╜∩┐╜∩┐╜" | Handle symbols and emojis without crashing. |
| **Long Text** | [Paste 5 paragraphs of text] | Summarize or answer from context. |
| **Invalid Query** | "Who is the president of France?" | Trigger "Out of Scope" or fallback message. |
| **Vague Query** | "Help" or "Fix" | Request more specific diagnostic details. |

## 2. Mobile Specific Verification (The "Mobile Fix" Checklist)
- [ ] **QR Redirect**: Scan QR -> Redirects to `https://.../chat?manual_id=...`
- [ ] **Initial State**: Input field is active and shows manual ID in the sidebar.
- [ ] **Virtual Keyboard**: Typing into input shows characters correctly.
- [ ] **"Go" / "Enter" Key**: Pressing the keyboard action key triggers `handleSend`.
- [ ] **Tap Target**: Clicking the Send (Icon) button triggers `handleSend` immediately.
- [ ] **Spinner**: Button shows a loading state while AI is thinking.
- [ ] **Keyboard Dismiss**: Keyboard hides or stays active depending on UX flow.

## 3. UI/UX Stress Test
- **Scroll Test**: Send 20 short messages. Verify scrollbar appears and follows bottom.
- **Theme Toggle**: Switch Dark/Light mode while in active chat. Verify legibility.
- **Orientation**: Switch between Portrait and Landscape on mobile. Verify layout doesn't break.
- **Link Click**: Click a YouTube link in the response. Verify it opens in a new tab.
