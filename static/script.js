/* =========================================================
   TRAVELMATE AI
   Multi-Agent Travel Planner Frontend
========================================================= */


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentThreadId =
    localStorage.getItem("travel_thread_id") || null;

let latestTravelData = null;

let latestAnswerMarkdown = "";

let isProcessing = false;

let workflowTimer = null;

let currentWorkflowIndex = 0;


/* =========================================================
   AGENT CONFIGURATION
========================================================= */

const AGENTS = [
    {
        id: "agentSupervisor",
        key: "supervisor",
        label: "Supervisor"
    },

    {
        id: "agentFlight",
        key: "flight_agent",
        label: "Flight Agent"
    },

    {
        id: "agentHotel",
        key: "hotel_agent",
        label: "Hotel Agent"
    },

    {
        id: "agentWeather",
        key: "weather_agent",
        label: "Weather Agent"
    },

    {
        id: "agentBudget",
        key: "budget_agent",
        label: "Budget Agent"
    },

    {
        id: "agentPlanner",
        key: "itinerary_agent",
        label: "Itinerary Agent"
    },

    {
        id: "agentHuman",
        key: "human_review",
        label: "Human Review"
    }
];


/* =========================================================
   DOM HELPERS
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


function showElement(id) {
    const element = getElement(id);

    if (element) {
        element.classList.remove("hidden");
    }
}


function hideElement(id) {
    const element = getElement(id);

    if (element) {
        element.classList.add("hidden");
    }
}


/* =========================================================
   SAFE TEXT
========================================================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   MARKDOWN RENDERING
========================================================= */

function renderMarkdown(text) {

    if (!text) {
        return `
            <div class="empty-state">
                No information available.
            </div>
        `;
    }

    if (typeof marked === "undefined") {
        return `<p>${escapeHtml(text)}</p>`;
    }

    try {

        return marked.parse(String(text), {
            breaks: true,
            gfm: true
        });

    } catch (error) {

        console.error("Markdown rendering error:", error);

        return `<p>${escapeHtml(text)}</p>`;
    }
}


/* =========================================================
   INPUT
========================================================= */

function updateCharacterCount() {

    const input = getElement("userInput");
    const counter = getElement("charCount");

    if (!input || !counter) {
        return;
    }

    counter.textContent =
        `${input.value.length} / ${input.maxLength}`;
}


function setPrompt(text) {

    const input = getElement("userInput");

    if (!input) {
        return;
    }

    input.value = text;

    updateCharacterCount();

    input.focus();

    input.setSelectionRange(
        input.value.length,
        input.value.length
    );
}


/* =========================================================
   BUTTON LOADING STATE
========================================================= */

function setGenerateLoading(loading) {

    const button = getElement("sendBtn");
    const buttonText = getElement("btnText");
    const loader = getElement("btnLoader");

    if (!button) {
        return;
    }

    button.disabled = loading;

    if (loading) {

        buttonText?.classList.add("hidden");

        loader?.classList.remove("hidden");

    } else {

        buttonText?.classList.remove("hidden");

        loader?.classList.add("hidden");
    }
}


/* =========================================================
   WORKFLOW STATUS
========================================================= */

function resetWorkflow() {

    AGENTS.forEach(agent => {

        const card = getElement(agent.id);

        if (!card) {
            return;
        }

        card.classList.remove(
            "active",
            "completed",
            "skipped",
            "waiting-human"
        );

        const status =
            card.querySelector(".agent-status-icon span");

        if (status) {
            status.textContent = "•";
        }
    });


    const workflowStatus =
        getElement("workflowStatus");

    const workflowText =
        getElement("workflowStatusText");

    workflowStatus?.classList.remove(
        "waiting",
        "complete"
    );

    workflowStatus?.classList.add("processing");

    if (workflowText) {
        workflowText.textContent = "Processing";
    }


    currentWorkflowIndex = 0;
}


function setAgentActive(agentKey) {

    AGENTS.forEach(agent => {

        const card = getElement(agent.id);

        if (!card) {
            return;
        }

        if (agent.key === agentKey) {

            card.classList.add("active");

            card.classList.remove(
                "completed",
                "skipped"
            );

        } else {

            card.classList.remove("active");
        }
    });
}


function setAgentCompleted(agentKey) {

    const agent =
        AGENTS.find(item => item.key === agentKey);

    if (!agent) {
        return;
    }

    const card = getElement(agent.id);

    if (!card) {
        return;
    }

    card.classList.remove("active");

    card.classList.add("completed");

    const status =
        card.querySelector(".agent-status-icon span");

    if (status) {
        status.textContent = "✓";
    }
}


function setAgentSkipped(agentKey) {

    const agent =
        AGENTS.find(item => item.key === agentKey);

    if (!agent) {
        return;
    }

    const card = getElement(agent.id);

    if (!card) {
        return;
    }

    card.classList.remove(
        "active",
        "completed"
    );

    card.classList.add("skipped");

    const status =
        card.querySelector(".agent-status-icon span");

    if (status) {
        status.textContent = "—";
    }
}


function setHumanWaiting() {

    const card = getElement("agentHuman");

    if (!card) {
        return;
    }

    card.classList.remove(
        "active",
        "completed"
    );

    card.classList.add("waiting-human");

    const status =
        card.querySelector(".agent-status-icon span");

    if (status) {
        status.textContent = "!";
    }


    const workflowStatus =
        getElement("workflowStatus");

    const workflowText =
        getElement("workflowStatusText");

    workflowStatus?.classList.remove("processing");

    workflowStatus?.classList.add("waiting");

    if (workflowText) {
        workflowText.textContent = "Waiting for review";
    }
}


function setWorkflowComplete() {

    AGENTS.forEach(agent => {

        const card = getElement(agent.id);

        if (!card) {
            return;
        }

        card.classList.remove(
            "active",
            "waiting-human"
        );

        if (
            !card.classList.contains("skipped")
        ) {
            card.classList.add("completed");

            const status =
                card.querySelector(
                    ".agent-status-icon span"
                );

            if (status) {
                status.textContent = "✓";
            }
        }
    });


    const workflowStatus =
        getElement("workflowStatus");

    const workflowText =
        getElement("workflowStatusText");

    workflowStatus?.classList.remove(
        "processing",
        "waiting"
    );

    workflowStatus?.classList.add("complete");

    if (workflowText) {
        workflowText.textContent = "Completed";
    }
}


/* =========================================================
   SIMULATED PROGRESS
   =========================================================

   Important:
   Backend currently returns one HTTP response after
   LangGraph reaches interrupt().

   Therefore frontend cannot know the exact real-time
   internal node currently executing.

   This animation provides visual progress while the
   backend request is running.
========================================================= */

function startWorkflowAnimation() {

    resetWorkflow();

    const sequence = [
        "supervisor",
        "flight_agent",
        "hotel_agent",
        "weather_agent",
        "budget_agent",
        "itinerary_agent"
    ];

    currentWorkflowIndex = 0;

    setAgentActive(sequence[0]);

    workflowTimer = setInterval(() => {

        currentWorkflowIndex++;

        if (
            currentWorkflowIndex >= sequence.length
        ) {
            clearInterval(workflowTimer);

            return;
        }

        setAgentCompleted(
            sequence[currentWorkflowIndex - 1]
        );

        setAgentActive(
            sequence[currentWorkflowIndex]
        );

    }, 1200);
}


function stopWorkflowAnimation() {

    if (workflowTimer) {

        clearInterval(workflowTimer);

        workflowTimer = null;
    }
}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (isProcessing) {
        return;
    }

    const input = getElement("userInput");

    if (!input) {
        return;
    }

    const message = input.value.trim();

    if (!message) {

        showError(
            "Please describe your trip before generating a plan."
        );

        input.focus();

        return;
    }


    if (message.length > 2000) {

        showError(
            "Your travel request is too long. Please keep it within 2000 characters."
        );

        return;
    }


    isProcessing = true;

    clearError();

    hideElement("approvalSection");

    hideElement("resultSection");

    showElement("agentSection");

    setGenerateLoading(true);

    startWorkflowAnimation();


    try {

        const response = await fetch(
            "/api/travel",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message,
                    thread_id: null
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Unable to generate the travel plan."
            );
        }


        handleTravelResponse(data);


    } catch (error) {

        console.error(error);

        stopWorkflowAnimation();

        showError(
            error.message ||
            "Something went wrong while planning your trip."
        );

        setWorkflowError();

    } finally {

        isProcessing = false;

        setGenerateLoading(false);
    }
}


/* =========================================================
   HANDLE TRAVEL RESPONSE
========================================================= */

function handleTravelResponse(data) {

    latestTravelData = data;

    currentThreadId =
        data.thread_id || null;

    if (currentThreadId) {

        localStorage.setItem(
            "travel_thread_id",
            currentThreadId
        );
    }


    stopWorkflowAnimation();


    /*
        Mark selected agents.

        Supervisor always runs.

        Backend may select only some specialist agents.
    */

    setAgentCompleted("supervisor");


    const selectedAgents =
        Array.isArray(data.selected_agents)
            ? data.selected_agents
            : [];


    const specialistAgents = [
        "flight_agent",
        "hotel_agent",
        "weather_agent",
        "budget_agent",
        "itinerary_agent"
    ];


    specialistAgents.forEach(agent => {

        if (selectedAgents.includes(agent)) {

            setAgentCompleted(agent);

        } else {

            setAgentSkipped(agent);
        }
    });


    /*
        Backend pauses at human_approval.
    */

    if (data.requires_approval) {

        setHumanWaiting();

        showApproval(data);

        hideElement("resultSection");

        scrollToSection("approvalSection");

        return;
    }


    /*
        Guardrail blocked request.
    */

    if (data.guardrail_allowed === false) {

        setWorkflowComplete();

        showError(
            data.guardrail_reason ||
            data.answer ||
            "This request is outside the scope of TravelMate AI."
        );

        return;
    }


    /*
        Normal final response.
    */

    setWorkflowComplete();

    displayFinalResults(data);
}


/* =========================================================
   APPROVAL UI
========================================================= */

function showApproval(data) {

    const approvalSection =
        getElement("approvalSection");

    if (!approvalSection) {
        return;
    }


    const approvalRequest =
        getElement("approvalRequest");

    const draftItinerary =
        getElement("draftItinerary");

    const feedback =
        getElement("humanFeedback");


    if (approvalRequest) {

        approvalRequest.textContent =
            data.approval_request ||
            "Please review the generated draft itinerary.";
    }


    if (draftItinerary) {

        draftItinerary.innerHTML =
            renderMarkdown(
                data.itinerary ||
                data.answer ||
                "No draft itinerary was returned."
            );
    }


    if (feedback) {
        feedback.value = "";
    }


    showElement("approvalSection");
}


/* =========================================================
   APPROVE PLAN
========================================================= */

async function approvePlan() {

    if (isProcessing) {
        return;
    }

    if (!currentThreadId) {

        showError(
            "The travel planning session could not be found. Please generate the plan again."
        );

        return;
    }


    const feedback =
        getElement("humanFeedback")?.value.trim() || "";


    await submitApproval(
        true,
        feedback
    );
}


/* =========================================================
   REJECT / REQUEST REVISION
========================================================= */

async function rejectPlan() {

    if (isProcessing) {
        return;
    }


    const feedback =
        getElement("humanFeedback")?.value.trim() || "";


    if (!feedback) {

        showError(
            "Please provide revision feedback before requesting a new version."
        );

        getElement("humanFeedback")?.focus();

        return;
    }


    if (!currentThreadId) {

        showError(
            "The travel planning session could not be found. Please generate the plan again."
        );

        return;
    }


    await submitApproval(
        false,
        feedback
    );
}


/* =========================================================
   SUBMIT HUMAN APPROVAL
========================================================= */

async function submitApproval(
    approved,
    feedback
) {

    isProcessing = true;

    clearError();

    setApprovalButtonsLoading(true);

    setAgentActive("human_review");


    try {

        const response = await fetch(
            "/api/travel/approve",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    thread_id: currentThreadId,
                    approved: approved,
                    feedback: feedback
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Unable to continue the travel plan."
            );
        }


        latestTravelData = data;


        /*
            If rejected, backend may theoretically
            pause again depending on workflow changes.
        */

        if (data.requires_approval) {

            setHumanWaiting();

            showApproval(data);

            return;
        }


        setAgentCompleted("human_review");

        setAgentCompleted("itinerary_agent");

        setWorkflowComplete();

        hideElement("approvalSection");

        displayFinalResults(data);

    } catch (error) {

        console.error(error);

        showError(
            error.message ||
            "Unable to submit your review."
        );

        setAgentActive("human_review");

    } finally {

        isProcessing = false;

        setApprovalButtonsLoading(false);
    }
}


/* =========================================================
   APPROVAL BUTTON LOADING
========================================================= */

function setApprovalButtonsLoading(loading) {

    const approveBtn =
        getElement("approveBtn");

    const rejectBtn =
        getElement("rejectBtn");


    if (approveBtn) {
        approveBtn.disabled = loading;
    }

    if (rejectBtn) {
        rejectBtn.disabled = loading;
    }


    if (loading) {

        if (approveBtn) {
            approveBtn.dataset.originalText =
                approveBtn.innerHTML;

            approveBtn.innerHTML =
                `<span class="loader"></span> Processing...`;
        }

        if (rejectBtn) {
            rejectBtn.dataset.originalText =
                rejectBtn.innerHTML;

            rejectBtn.innerHTML =
                `<span class="loader"></span> Revising...`;
        }

    } else {

        if (approveBtn?.dataset.originalText) {

            approveBtn.innerHTML =
                approveBtn.dataset.originalText;
        }

        if (rejectBtn?.dataset.originalText) {

            rejectBtn.innerHTML =
                rejectBtn.dataset.originalText;
        }
    }
}


/* =========================================================
   DISPLAY FINAL RESULTS
========================================================= */

function displayFinalResults(data) {

    latestAnswerMarkdown =
        data.answer ||
        data.final_response ||
        data.itinerary ||
        "";


    const resultBox =
        getElement("resultBox");

    const flightBox =
        getElement("flightBox");

    const hotelBox =
        getElement("hotelBox");

    const weatherBox =
        getElement("weatherBox");

    const budgetBox =
        getElement("budgetBox");

    const itineraryBox =
        getElement("itineraryBox");


    if (resultBox) {

        resultBox.innerHTML =
            renderMarkdown(
                latestAnswerMarkdown
            );
    }


    if (flightBox) {

        flightBox.innerHTML =
            renderMarkdown(
                data.flight_results
            );
    }


    if (hotelBox) {

        hotelBox.innerHTML =
            renderMarkdown(
                data.hotel_results
            );
    }


    if (weatherBox) {

        weatherBox.innerHTML =
            renderMarkdown(
                data.weather_results
            );
    }


    if (budgetBox) {

        budgetBox.innerHTML =
            renderMarkdown(
                data.budget_results
            );
    }


    if (itineraryBox) {

        itineraryBox.innerHTML =
            renderMarkdown(
                data.itinerary
            );
    }


    updateSummary(data);

    updateAgentDetails(data);

    showElement("resultSection");

    switchTab("overview");

    scrollToSection("resultSection");
}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary(data) {

    const flightSummary =
        getElement("flightSummary");

    const hotelSummary =
        getElement("hotelSummary");

    const weatherSummary =
        getElement("weatherSummary");

    const budgetSummary =
        getElement("budgetSummary");

    const itinerarySummary =
        getElement("itinerarySummary");


    if (flightSummary) {

        flightSummary.textContent =
            data.flight_results
                ? "AI researched"
                : "Not selected";
    }


    if (hotelSummary) {

        hotelSummary.textContent =
            data.hotel_results
                ? "AI researched"
                : "Not selected";
    }


    if (weatherSummary) {

        weatherSummary.textContent =
            data.weather_results
                ? "AI researched"
                : "Not selected";
    }


    if (budgetSummary) {

        budgetSummary.textContent =
            data.budget_results
                ? "Analysed"
                : "Not selected";
    }


    if (itinerarySummary) {

        itinerarySummary.textContent =
            data.itinerary
                ? "Generated"
                : "Not available";
    }


    const threadInfo =
        getElement("threadInfo");

    if (threadInfo) {

        threadInfo.textContent =
            data.thread_id
                ? `Thread ID: ${data.thread_id}`
                : "Thread ID: —";
    }
}


/* =========================================================
   AI DETAILS
========================================================= */

function updateAgentDetails(data) {

    const selectedAgents =
        getElement("selectedAgents");

    const llmCalls =
        getElement("llmCalls");

    const supervisorReasoning =
        getElement("supervisorReasoning");

    const tripConstraints =
        getElement("tripConstraints");


    const agents =
        Array.isArray(data.selected_agents)
            ? data.selected_agents
            : [];


    if (selectedAgents) {

        selectedAgents.textContent =
            agents.length
                ? agents.join(" → ")
                : "No specialist agents selected";
    }


    if (llmCalls) {

        llmCalls.textContent =
            data.llm_calls ?? 0;
    }


    if (supervisorReasoning) {

        supervisorReasoning.innerHTML =
            renderMarkdown(
                data.supervisor_reasoning ||
                "No supervisor reasoning was returned."
            );
    }


    if (tripConstraints) {

        tripConstraints.innerHTML =
            buildConstraintsHTML(
                data.trip_constraints || {}
            );
    }
}


/* =========================================================
   TRIP CONSTRAINTS
========================================================= */

function buildConstraintsHTML(
    constraints
) {

    const fields = [
        ["Destination", constraints.destination],
        ["Origin", constraints.origin],
        ["Duration", constraints.duration],
        ["Budget", constraints.budget],
        ["Travel Style", constraints.travel_style]
    ];


    let html = "";


    fields.forEach(([label, value]) => {

        html += `
            <div class="constraint-item">
                <span>${escapeHtml(label)}</span>
                <strong>
                    ${escapeHtml(value || "Not specified")}
                </strong>
            </div>
        `;
    });


    const preferences =
        Array.isArray(
            constraints.special_preferences
        )
            ? constraints.special_preferences
            : [];


    html += `
        <div class="constraint-item">
            <span>Preferences</span>
            <strong>
                ${
                    preferences.length
                        ? escapeHtml(
                            preferences.join(", ")
                        )
                        : "None specified"
                }
            </strong>
        </div>
    `;


    return html;
}


/* =========================================================
   TABS
========================================================= */

function switchTab(tabName) {

    const tabs =
        document.querySelectorAll(".result-tab");

    const contents =
        document.querySelectorAll(".tab-content");


    tabs.forEach(tab => {

        tab.classList.toggle(
            "active",
            tab.dataset.tab === tabName
        );
    });


    contents.forEach(content => {

        content.classList.toggle(
            "active",
            content.id === `tab-${tabName}`
        );
    });
}


/* =========================================================
   COPY RESULT
========================================================= */

async function copyResult() {

    const text =
        latestAnswerMarkdown ||
        latestTravelData?.answer ||
        "";


    if (!text) {

        showError(
            "There is no generated travel plan to copy."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(text);

        showTemporaryMessage(
            "Travel plan copied to clipboard."
        );

    } catch (error) {

        console.error(error);

        /*
            Clipboard fallback
        */

        const textarea =
            document.createElement("textarea");

        textarea.value = text;

        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

        showTemporaryMessage(
            "Travel plan copied."
        );
    }
}


/* =========================================================
   DOWNLOAD PDF
========================================================= */

function downloadPDF() {

    const content =
        getElement("pdfContent");


    if (!content) {

        showError(
            "Travel plan content is not available."
        );

        return;
    }


    if (
        typeof html2pdf ===
        "undefined"
    ) {

        showError(
            "PDF generator is not available. Please check your internet connection."
        );

        return;
    }


    const options = {

        margin: 0.45,

        filename:
            "TravelMate-AI-Travel-Plan.pdf",

        image: {
            type: "jpeg",
            quality: 0.96
        },

        html2canvas: {
            scale: 2,

            useCORS: true,

            backgroundColor: "#07111f"
        },

        jsPDF: {
            unit: "in",
            format: "a4",
            orientation: "portrait"
        },

        pagebreak: {
            mode: [
                "avoid-all",
                "css",
                "legacy"
            ]
        }
    };


    /*
        Temporarily show all tabs so the complete
        travel plan is included in PDF.
    */

    const tabs =
        content.querySelectorAll(
            ".tab-content"
        );


    tabs.forEach(tab => {

        tab.dataset.pdfDisplay =
            tab.style.display;

        tab.style.display = "block";
    });


    html2pdf()
        .set(options)
        .from(content)
        .save()
        .then(() => {

            tabs.forEach(tab => {

                tab.style.display =
                    tab.dataset.pdfDisplay || "";

                delete tab.dataset.pdfDisplay;
            });

        })
        .catch(error => {

            console.error(
                "PDF error:",
                error
            );

            tabs.forEach(tab => {

                tab.style.display =
                    tab.dataset.pdfDisplay || "";

                delete tab.dataset.pdfDisplay;
            });

            showError(
                "Unable to create the PDF."
            );
        });
}


/* =========================================================
   ERROR HANDLING
========================================================= */

function showError(message) {

    const errorBox =
        getElement("errorBox");

    if (!errorBox) {
        return;
    }


    errorBox.innerHTML =
        `<strong>Something went wrong:</strong> ${escapeHtml(message)}`;

    errorBox.classList.remove("hidden");

    scrollToSection("errorBox");
}


function clearError() {

    const errorBox =
        getElement("errorBox");

    if (!errorBox) {
        return;
    }

    errorBox.textContent = "";

    errorBox.classList.add("hidden");
}


function setWorkflowError() {

    const workflowStatus =
        getElement("workflowStatus");

    const workflowText =
        getElement("workflowStatusText");


    workflowStatus?.classList.remove(
        "processing",
        "waiting",
        "complete"
    );


    if (workflowText) {
        workflowText.textContent =
            "Request failed";
    }
}


/* =========================================================
   TEMPORARY MESSAGE
========================================================= */

function showTemporaryMessage(message) {

    const existing =
        document.querySelector(
            ".temporary-message"
        );


    existing?.remove();


    const element =
        document.createElement("div");

    element.className =
        "temporary-message";


    element.textContent = message;


    Object.assign(
        element.style,
        {
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: "9999",
            padding: "11px 15px",
            border: "1px solid rgba(52,211,153,.2)",
            borderRadius: "10px",
            background: "#0d1a2c",
            color: "#d1fae5",
            fontSize: "12px",
            boxShadow: "0 15px 40px rgba(0,0,0,.3)"
        }
    );


    document.body.appendChild(element);


    setTimeout(() => {

        element.style.opacity = "0";

        element.style.transition =
            "opacity .25s ease";

        setTimeout(
            () => element.remove(),
            250
        );

    }, 1800);
}


/* =========================================================
   SCROLL
========================================================= */

function scrollToSection(id) {

    const element =
        getElement(id);

    if (!element) {
        return;
    }


    setTimeout(() => {

        element.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 100);
}


/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.ctrlKey &&
            event.key === "Enter"
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);


/* =========================================================
   INPUT LISTENERS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const input =
            getElement("userInput");


        if (input) {

            input.addEventListener(
                "input",
                updateCharacterCount
            );

            updateCharacterCount();
        }


        /*
            If marked is available, configure it.
        */

        if (
            typeof marked !== "undefined" &&
            marked.use
        ) {

            marked.use({
                breaks: true,
                gfm: true
            });
        }
    }
);


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

function initializePage() {

    updateCharacterCount();

    hideElement("agentSection");

    hideElement("approvalSection");

    hideElement("resultSection");

    clearError();
}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializePage
    );

} else {

    initializePage();
}