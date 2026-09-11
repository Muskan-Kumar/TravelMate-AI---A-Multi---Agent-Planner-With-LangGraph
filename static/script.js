/* =========================================================
   TRIPMATE AI
   Multi-Agent Travel Planner Frontend
========================================================= */


let currentThreadId =
    localStorage.getItem("travel_thread_id") || null;

let latestAnswerMarkdown = "";

let latestTravelData = null;



/* =========================================================
   QUICK PROMPTS
========================================================= */

function setPrompt(text) {

    const input =
        document.getElementById("userInput");

    if (!input) return;

    input.value = text;

    updateCharCount();

    input.focus();
}



/* =========================================================
   CHARACTER COUNT
========================================================= */

function updateCharCount() {

    const input =
        document.getElementById("userInput");

    const counter =
        document.getElementById("charCount");

    if (!input || !counter) {
        return;
    }

    counter.textContent =
        `${input.value.length} / 2000`;
}



/* =========================================================
   LOADING
========================================================= */

function setLoading(isLoading) {

    const sendBtn =
        document.getElementById("sendBtn");

    const btnText =
        document.getElementById("btnText");

    const btnLoader =
        document.getElementById("btnLoader");

    const agentSection =
        document.getElementById("agentSection");

    if (!sendBtn) return;


    sendBtn.disabled = isLoading;


    if (isLoading) {

        if (btnText) {
            btnText.classList.add("hidden");
        }

        if (btnLoader) {
            btnLoader.classList.remove("hidden");
        }

        if (agentSection) {
            agentSection.classList.remove("hidden");
        }

        animateAgents();

    } else {

        if (btnText) {
            btnText.classList.remove("hidden");
        }

        if (btnLoader) {
            btnLoader.classList.add("hidden");
        }

    }
}



/* =========================================================
   AGENT ANIMATION
========================================================= */

function animateAgents() {

    const agents = [

        document.getElementById("agentFlight"),

        document.getElementById("agentHotel"),

        document.getElementById("agentResearch"),

        document.getElementById("agentPlanner")

    ].filter(Boolean);


    agents.forEach(agent => {

        agent.classList.remove("active");

    });


    agents.forEach((agent, index) => {

        setTimeout(() => {

            agent.classList.add("active");

        }, index * 650);

    });
}



/* =========================================================
   FINISH AGENTS
========================================================= */

function finishAgents() {

    const agents = [

        document.getElementById("agentFlight"),

        document.getElementById("agentHotel"),

        document.getElementById("agentResearch"),

        document.getElementById("agentPlanner")

    ].filter(Boolean);


    agents.forEach(agent => {

        agent.classList.add("active");

    });
}



/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    const errorBox =
        document.getElementById("errorBox");

    if (!errorBox) return;

    errorBox.textContent = message;

    errorBox.classList.remove("hidden");

    errorBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function hideError() {

    const errorBox =
        document.getElementById("errorBox");

    if (!errorBox) return;

    errorBox.classList.add("hidden");

    errorBox.textContent = "";
}



/* =========================================================
   SAFE STRING
========================================================= */

function safeString(value) {

    if (value === null || value === undefined) {
        return "";
    }


    if (typeof value === "string") {
        return value;
    }


    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }


    try {

        return JSON.stringify(
            value,
            null,
            2
        );

    } catch {

        return String(value);

    }
}



/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}



/* =========================================================
   RENDER GENERIC DATA
========================================================= */

function renderGenericData(data, title = "") {

    if (
        data === null ||
        data === undefined ||
        data === ""
    ) {

        return `
            <div class="data-empty">
                No information was returned for this section.
            </div>
        `;
    }


    /* STRING */

    if (typeof data === "string") {

        if (
            typeof marked !== "undefined" &&
            (
                data.includes("#") ||
                data.includes("*") ||
                data.includes("- ")
            )
        ) {

            return `
                <div class="raw-markdown">
                    ${marked.parse(data)}
                </div>
            `;

        }


        return `
            <div class="raw-data">
                ${escapeHTML(data)}
            </div>
        `;
    }



    /* ARRAY */

    if (Array.isArray(data)) {

        if (data.length === 0) {

            return `
                <div class="data-empty">
                    No results found.
                </div>
            `;
        }


        return data
            .map((item, index) => {

                if (
                    typeof item === "object" &&
                    item !== null
                ) {

                    return `
                        <div class="data-card">

                            <div class="data-card-title">
                                ${title || "Result"} ${index + 1}
                            </div>

                            ${renderObject(item)}

                        </div>
                    `;

                }


                return `
                    <div class="data-card">

                        <div class="data-card-title">
                            ${title || "Result"} ${index + 1}
                        </div>

                        <p>
                            ${escapeHTML(
                                safeString(item)
                            )}
                        </p>

                    </div>
                `;

            })
            .join("");
    }



    /* OBJECT */

    if (typeof data === "object") {

        return renderObject(data);
    }


    return `
        <div class="raw-data">
            ${escapeHTML(
                safeString(data)
            )}
        </div>
    `;
}



/* =========================================================
   RENDER OBJECT
========================================================= */

function renderObject(obj) {

    if (!obj || typeof obj !== "object") {

        return `
            <p>
                ${escapeHTML(
                    safeString(obj)
                )}
            </p>
        `;
    }


    return Object.entries(obj)
        .map(([key, value]) => {

            const label =
                key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, c =>
                        c.toUpperCase()
                    );


            if (
                typeof value === "object" &&
                value !== null
            ) {

                return `
                    <div class="data-card">

                        <div class="data-card-title">
                            ${escapeHTML(label)}
                        </div>

                        ${renderGenericData(value)}

                    </div>
                `;

            }


            return `
                <p>
                    <strong>
                        ${escapeHTML(label)}:
                    </strong>

                    ${escapeHTML(
                        safeString(value)
                    )}
                </p>
            `;

        })
        .join("");
}



/* =========================================================
   RESULT
========================================================= */

function showResult(data) {

    latestTravelData = data;

    latestAnswerMarkdown =
        data.answer || "";


    const resultSection =
        document.getElementById("resultSection");

    const resultBox =
        document.getElementById("resultBox");

    const threadInfo =
        document.getElementById("threadInfo");


    /* -------------------------
       MAIN ANSWER
    ------------------------- */

    if (resultBox) {

        if (
            typeof marked !== "undefined" &&
            latestAnswerMarkdown
        ) {

            resultBox.innerHTML =
                marked.parse(
                    latestAnswerMarkdown
                );

        } else {

            resultBox.innerHTML = `
                <div class="raw-data">
                    ${escapeHTML(
                        latestAnswerMarkdown ||
                        "No travel plan was returned."
                    )}
                </div>
            `;

        }

    }



    /* -------------------------
       THREAD
    ------------------------- */

    if (threadInfo) {

        threadInfo.textContent =
            `Thread ID: ${data.thread_id || "—"}`;

    }



    /* -------------------------
       FLIGHTS
    ------------------------- */

    const flightBox =
        document.getElementById("flightBox");


    if (flightBox) {

        flightBox.innerHTML =
            renderGenericData(
                data.flight_results,
                "Flight"
            );

    }



    /* -------------------------
       HOTELS
    ------------------------- */

    const hotelBox =
        document.getElementById("hotelBox");


    if (hotelBox) {

        hotelBox.innerHTML =
            renderGenericData(
                data.hotel_results,
                "Hotel"
            );

    }



    /* -------------------------
       ITINERARY
    ------------------------- */

    const itineraryBox =
        document.getElementById("itineraryBox");


    if (itineraryBox) {

        itineraryBox.innerHTML =
            renderGenericData(
                data.itinerary,
                "Day"
            );

    }



    /* -------------------------
       LLM CALLS
    ------------------------- */

    const llmBox =
        document.getElementById("llmBox");


    if (llmBox) {

        llmBox.innerHTML =
            renderGenericData(
                data.llm_calls,
                "Agent"
            );

    }



    /* -------------------------
       SUMMARY
    ------------------------- */

    updateSummary(data);



    /* -------------------------
       SHOW
    ------------------------- */

    if (resultSection) {

        resultSection.classList.remove(
            "hidden"
        );

        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    finishAgents();
}



/* =========================================================
   SUMMARY
========================================================= */

function updateSummary(data) {

    const flightSummary =
        document.getElementById("flightSummary");

    const hotelSummary =
        document.getElementById("hotelSummary");

    const itinerarySummary =
        document.getElementById("itinerarySummary");


    if (flightSummary) {

        flightSummary.textContent =
            hasData(data.flight_results)
                ? "AI researched"
                : "Not available";
    }


    if (hotelSummary) {

        hotelSummary.textContent =
            hasData(data.hotel_results)
                ? "AI researched"
                : "Not available";
    }


    if (itinerarySummary) {

        itinerarySummary.textContent =
            hasData(data.itinerary)
                ? "Generated"
                : "Included in plan";
    }

}



/* =========================================================
   HAS DATA
========================================================= */

function hasData(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return false;
    }


    if (typeof value === "string") {

        return value.trim().length > 0;
    }


    if (Array.isArray(value)) {

        return value.length > 0;
    }


    if (typeof value === "object") {

        return Object.keys(value).length > 0;
    }


    return true;
}



/* =========================================================
   TABS
========================================================= */

function switchTab(tabName) {

    document
        .querySelectorAll(".result-tab")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.tab === tabName
            );

        });


    document
        .querySelectorAll(".tab-content")
        .forEach(content => {

            content.classList.toggle(
                "active",
                content.id === `tab-${tabName}`
            );

        });

}



/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    hideError();


    const input =
        document.getElementById("userInput");


    if (!input) return;


    const message =
        input.value.trim();


    if (!message) {

        showError(
            "Please describe your trip first."
        );

        input.focus();

        return;
    }


    if (message.length > 2000) {

        showError(
            "Your travel request is too long. Please keep it under 2000 characters."
        );

        return;
    }


    setLoading(true);


    try {

        const response =
            await fetch(
                "/api/travel",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message: message,

                        thread_id:
                            currentThreadId

                    })
                }
            );


        let data;


        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                "The server returned an invalid response."
            );

        }


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Unable to generate the travel plan."
            );

        }


        currentThreadId =
            data.thread_id;


        if (currentThreadId) {

            localStorage.setItem(
                "travel_thread_id",
                currentThreadId
            );

        }


        showResult(data);


    } catch (error) {

        console.error(
            "TripMate error:",
            error
        );


        showError(
            error.message ||
            "Something went wrong. Please try again."
        );

    } finally {

        setLoading(false);

    }

}



/* =========================================================
   COPY RESULT
========================================================= */

async function copyResult() {

    const resultBox =
        document.getElementById("resultBox");


    if (!resultBox) return;


    const text =
        resultBox.innerText.trim();


    if (!text) {

        showError(
            "No travel plan available to copy."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            text
        );


        const button =
            document.querySelector(
                ".copy-btn"
            );


        if (!button) return;


        const oldHTML =
            button.innerHTML;


        button.innerHTML =
            "✓ Copied";


        setTimeout(() => {

            button.innerHTML =
                oldHTML;

        }, 1500);


    } catch (error) {

        console.error(error);

        showError(
            "Could not copy the travel plan."
        );

    }

}



/* =========================================================
   DOWNLOAD PDF
========================================================= */

function downloadPDF() {

    const pdfContent =
        document.getElementById("pdfContent");


    if (
        !pdfContent ||
        !latestAnswerMarkdown
    ) {

        showError(
            "No travel plan available to download."
        );

        return;
    }


    if (
        typeof html2pdf === "undefined"
    ) {

        showError(
            "PDF library could not be loaded. Please check your internet connection."
        );

        return;
    }


    const button =
        document.querySelector(
            ".download-btn"
        );


    const oldHTML =
        button
            ? button.innerHTML
            : "";


    if (button) {

        button.innerHTML =
            "Preparing...";

        button.disabled = true;

    }


    const options = {

        margin: 0.45,

        filename:
            "tripmate-ai-travel-plan.pdf",

        image: {

            type: "jpeg",

            quality: 0.98

        },

        html2canvas: {

            scale: 2,

            useCORS: true,

            backgroundColor: "#ffffff",

            scrollY: 0

        },

        jsPDF: {

            unit: "in",

            format: "a4",

            orientation: "portrait"

        },

        pagebreak: {

            mode: [
                "css",
                "legacy"
            ]

        }

    };


    html2pdf()

        .set(options)

        .from(pdfContent)

        .save()

        .then(() => {

            if (button) {

                button.innerHTML =
                    oldHTML;

                button.disabled = false;

            }

        })

        .catch(error => {

            console.error(
                "PDF error:",
                error
            );


            if (button) {

                button.innerHTML =
                    oldHTML;

                button.disabled = false;

            }


            showError(
                "Could not generate the PDF."
            );

        });

}



/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

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
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const input =
            document.getElementById(
                "userInput"
            );


        if (input) {

            input.addEventListener(
                "input",
                updateCharCount
            );


            updateCharCount();


            input.addEventListener(
                "keydown",
                function(event) {

                    if (
                        event.key === "Enter" &&
                        event.ctrlKey
                    ) {

                        event.preventDefault();

                        sendMessage();

                    }

                }
            );

        }

    }
);