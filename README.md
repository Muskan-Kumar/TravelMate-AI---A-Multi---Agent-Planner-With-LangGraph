# ✈️ TravelMate AI — Multi-Agent Travel Planner with LangGraph

> An AI-powered travel planning system that transforms natural-language travel requests into personalized, budget-aware trip plans using multiple specialized AI agents.

TravelMate AI is an end-to-end **Multi-Agent AI application** built with **LangGraph, LangChain, Groq, FastAPI, PostgreSQL, Tavily, and AviationStack**.

Instead of manually searching for flights, hotels, destinations, and activities across multiple platforms, TravelMate AI coordinates specialized agents to gather information and generate a complete travel plan from a single user request.

---

## 🚀 Overview

Planning a trip usually requires searching across multiple platforms for:

- ✈️ Flights
- 🏨 Hotels
- 📍 Places to visit
- 🗓️ Day-by-day itinerary
- 💰 Budget planning

TravelMate AI combines these tasks into a single intelligent workflow.

The system accepts a natural-language request such as:

> "Plan a 7-day trip to Thailand from India for 2 people including flights, hotels, sightseeing, food and local transport under ₹2 lakhs."

The request is processed through multiple specialized agents, each responsible for a specific task.

---

## ✨ Key Features

### 🤖 Multi-Agent Architecture

TripMate AI uses multiple specialized agents coordinated through **LangGraph**:

- ✈️ **Flight Agent** — Searches for flight information using AviationStack.
- 🏨 **Hotel Agent** — Researches hotel options using Tavily.
- 🧠 **Itinerary Agent** — Creates a practical day-by-day itinerary.
- 📝 **Final Agent** — Combines all collected information into a polished travel response.

### 🌍 Natural Language Travel Planning

Users can describe their requirements naturally instead of filling out complicated forms.

Example:

```text
Plan a 7-day trip to Nepal from India for 2 people,
including flights, hotels, sightseeing, food and local transport,
with a total budget under ₹2 lakhs.```