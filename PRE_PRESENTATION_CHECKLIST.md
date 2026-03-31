# Pre-Presentation Verification Checklist ✅

**Event Date/Time**: _______________________  
**Location**: _______________________  
**Status**: Ready ✓ / Need Fixes ✗

---

## 🔧 TECHNICAL SETUP (15 minutes before)

### Backend Services
```
Checklist:
[ ] MongoDB accessible
    Command: Check .env has MONGODB_URL set
    Verify: Connection logs show "Connected to MongoDB"

[ ] Ollama running on localhost:11434
    Command: ollama serve
    Verify: curl http://localhost:11434/api/tags returns models
    Expected: ["llama3.1", ...]

[ ] FastAPI backend running
    Command: cd backend && uvicorn server:app --reload
    Port: 8000
    Verify: http://localhost:8000/docs loads (Swagger API docs)

[ ] Pinecone API key loaded
    Command: Check backend/.env has PINECONE_API_KEY
    Verify: Backend logs show "Pinecone client initialized"

[ ] Sample manual uploaded and processed
    Command: Check backend/uploads/ has files
    Verify: Run test query returns results from Pinecone
```

### Frontend
```
Checklist:
[ ] React frontend running
    Command: cd frontend && npm start
    Port: 3000
    Verify: http://localhost:3000 loads without errors

[ ] Able to upload manual
    Action: Test upload a PDF, check success message

[ ] Chat interface works
    Action: Upload a manual, ask test question: "What is this?"
    Expected: Get streaming response in <5 seconds

[ ] No console errors
    Action: Open DevTools (F12), switch to Console tab
    Expected: No red errors (warnings OK)
```

### Network & Display
```
Checklist:
[ ] Projector/Display connected and working
    Action: Display browser on projector
    Verify: All text readable from 10 feet away

[ ] Internet connection stable
    Command: ping pinecone.io
    Expected: <100ms response time

[ ] All browser tabs pre-opened
    ├─ http://localhost:3000 (Frontend)
    ├─ Pinecone dashboard login
    ├─ Code viewer (VS Code) with key files
    ├─ Terminal showing backend logs
    └─ This checklist document

[ ] Volume working (if using demo video)
    Action: Test speaker audio
```

---

## 📋 CONTENT PREPARATION

### Documents Created
```
[ ] PRESENTATION_SCRIPT.md (detailed talking points)
[ ] PRESENTATION_SLIDES.md (visual reference)
[ ] PRESENTER_CHEATSHEET.md (quick lookup)
[ ] This verification checklist
```

### Code Files Ready
```
In VS Code, have these open:
[ ] backend/rag.py (RAG engine explanation)
[ ] backend/ingestion.py (document processing)
[ ] backend/server.py (API endpoints)
[ ] frontend/src/pages/ChatBot.js (React UI)
```

### Demo Assets
```
[ ] Sample appliance manual PDF ready for upload
    Location: _______________
    File size: _______________
    Recommendation: 5-20 pages, clear text

[ ] Screenshot of Pinecone dashboard (backup)
    Location: _______________

[ ] Short video of full flow (backup)
    Location: _______________
```

---

## ✅ PRESENTATION VERIFICATION

### Timing Check
```
Allocate time as follows (30 min total):
[ ] 0-2 min:  Intro
[ ] 2-8 min:  Live Demo (CRITICAL - most important part!)
[ ] 8-18 min: Technical Deep Dive
[ ] 18-25 min: Architecture & Code
[ ] 25-30 min: Future Scope & Q&A

Did dry run and timed? Y / N
Actual time: __________ minutes
```

### Slide/Script Alignment
```
[ ] Presentation_SCRIPT.md matches intended flow
[ ] Each section has clear talking points
[ ] Code snippets are accurate (last updated ________)
[ ] Times allocated match actual demo durations
```

### Speaker Preparation
```
[ ] Practiced opening statement (do it now, time it)
    Time: __________ seconds (should be <60 sec)

[ ] Practiced demo walkthrough
    Time: __________ minutes (should be <6 min)

[ ] Can explain RAG in 2 sentences? Try it:
    "______________________________________"

[ ] Can recover if demo fails? Read CHEATSHEET.md section: "Demo Failure Recovery"

[ ] Presenter notes reviewed
    ├─ Common questions (ready to answer)
    ├─ Talking points memorized
    └─ Backup plan understood
```

---

## 🎯 DEMO TEST SEQUENCE (Do this now!)

Run through this exact sequence to verify everything works:

```
STEP 1: Upload Manual (2 minutes)
[ ] Open http://localhost:3000 in browser
[ ] Navigate to "Upload" or "Manual Upload" page
[ ] Select sample PDF from backend/uploads/ OR upload new one
[ ] Click upload
[ ] Verify: "Upload successful" message appears
[ ] Check backend logs: See chunking + embedding messages
[ ] Time actual upload: __________ seconds

STEP 2: Ask Question (1 minute)
[ ] Open manual in chat interface
[ ] Type test question: "What is the first section about?"
[ ] Verify: Response appears within 5 seconds
[ ] Verify: Response is relevant to manual content
[ ] Time response: __________ seconds (streaming should be visible)

STEP 3: Verify Pinecone (1 minute)
[ ] Go to Pinecone dashboard: https://app.pinecone.io
[ ] Login with credentials
[ ] Find index "appliance-manuals"
[ ] Verify: Shows vector count (should be >0)
[ ] Verify: Can see namespaces for different manuals
[ ] Screenshot this for backup

STEP 4: Show Logs (optional)
[ ] Open backend terminal
[ ] Scroll through logs
[ ] Point out: Query embedding, Pinecone search, LLM generation
```

**RESULT**: If all steps pass ✅, you're ready!

---

## 🚨 CONTINGENCY PLANS

### If Upload Fails
```
Problem: Upload button not responding
Solutions:
[ ] Check backend is running: curl http://localhost:8000/docs
[ ] Check Pinecone connection: Look for error in logs
[ ] Restart backend: Ctrl+C, then uvicorn server:app --reload
[ ] Restart npm: Ctrl+C in frontend folder, npm start
Backup: Show code demo instead, narrate what should happen
```

### If Chat Returns Wrong Answer
```
Problem: Response is gibberish or irrelevant
Don't worry! This actually helps show:
[ ] Use this to demonstrate observability (tracing the issue)
[ ] Show retrieval: What chunks were actually retrieved?
[ ] Explain: Sometimes LLM needs better prompting
Narrative: "This is exactly why we're implementing observability tracing"
```

### If Pinecone API Fails
```
Problem: "Pinecone API error" in backend
Quick Fix:
[ ] Check .env has correct API key: echo $PINECONE_API_KEY
[ ] Check Pinecone website status
[ ] Regenerate API key in Pinecone dashboard
Backup: Show screenshot of Pinecone dashboard, explain vectors
```

### If Internet Goes Down
```
Problem: Can't reach Pinecone
Still works because:
[ ] Frontend and backend are local (localhost:3000, :8000)
[ ] Demo will work for local chat only
Narrative: "In production, we use edge caching and CDN for reliability"
```

### If Projector Fails
```
[ ] Use laptop screen at desk
[ ] Stand closer, have people gather around
[ ] Make text larger: Ctrl+Plus in browser
[ ] Have printed backup slides
```

---

## 🎤 FINAL CHECKS (5 minutes before)

```
Physical Setup:
[ ] Laptop positioned so screen is visible to audience
[ ] Console fonts large enough (increase if needed)
[ ] Terminal showing recent logs (not scrolled off screen)
[ ] Mouse/keyboard working
[ ] Backup clicker charged/working

Mental Setup:
[ ] Water nearby (stay hydrated)
[ ] Deep breath taken
[ ] Opening statement ready (don't just improvise)
[ ] Demo manual confirmed on file system
[ ] Pinecone loaded in browser (already logged in)

Content Setup:
[ ] Slides/script visible (either printed or on second monitor)
[ ] Code files open in VS Code
[ ] Browser at http://localhost:3000
[ ] Terminal showing backend logs
[ ] Backup documents ready
```

---

## 📊 PRESENTATION QUALITY GATES

Before you start, verify these pass:

### Visual Quality
```
✅ Text on screen readable from 10+ feet away
✅ Colors have good contrast (not red on green, etc.)
✅ No typos in visible code/slides (ran spell check)
✅ Consistent formatting throughout
✅ Logos/branding present if required
```

### Technical Quality
```
✅ No latency issues (responses <5 seconds)
✅ No error messages in logs
✅ No hanging/frozen UI
✅ Smooth transitions between sections
✅ All links/buttons functional
```

### Content Quality
```
✅ Opening hook present (catch attention in first 10 seconds)
✅ Problem clearly stated
✅ Solution demonstrated live
✅ Technical depth appropriate for audience
✅ Closing statement strong
```

---

## ✨ PRESENTATION GRADING RUBRIC

Self-check after you finish:

```
DEMO EXECUTION (40 points)
[ ] 10 pts: Frontend upload worked smoothly
[ ] 10 pts: Chat responded correctly
[ ] 10 pts: Answer was relevant to manual
[ ] 10 pts: Pinecone dashboard visible + explained

TECHNICAL EXPLANATION (30 points)
[ ] 10 pts: RAG pipeline clearly explained
[ ] 10 pts: Code snippets accurate and relevant
[ ] 10 pts: Q&A handled well

DELIVERY (20 points)
[ ] 5 pts: Timing on track (not rushed/slow)
[ ] 5 pts: Spoke clearly and confidently
[ ] 5 pts: Engaged audience (eye contact, energy)
[ ] 5 pts: Handled questions well

PREPARATION (10 points)  
[ ] 5 pts: Slides polished and professional
[ ] 5 pts: Backup plan obvious if asked

= ______ TOTAL (90+ is excellent)
```

---

## 📝 POST-PRESENTATION

After the presentation, fill this out:

```
How did it go?
- What went well: ___________________
- What could improve: ___________________
- Questions asked: ___________________
- Feedback received: ___________________

Technical issues encountered:
- ___________________
- ___________________

Timing:
- Planned: 30 min | Actual: ______ min
- Which sections went over/under?
  - Intro: ______ min
  - Demo: ______ min
  - Technical: ______ min
  - Architecture: ______ min
  - Future: ______ min

Lessons for next presentation:
- ___________________
- ___________________
- ___________________
```

---

## ✅ FINAL SIGNING OFF

```
Presenter Name: _________________________
Date: _________________________
Time Start: _________ Time End: _________

System Status Before Presentation:
[ ] All technical checks passed ✅
[ ] Demo tested and verified ✅
[ ] Backup plans reviewed ✅
[ ] Presenter confident ✅

APPROVED FOR PRESENTATION ✅

Signature: ___________________________
```

---

**Remember**: 
- You built this system - you know it better than anyone
- Technical issues happen - just pivot gracefully
- The live demo is what matters - practice it one more time
- Practice your opening 3 times (this is where people decide to pay attention)
- You've got this! 🚀

**GOOD LUCK!**
