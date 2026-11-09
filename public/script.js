
const authForm = document.getElementById("authForm");

if (authForm) {
    const heading = document.getElementById("heading");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const submitBtn = document.getElementById("submitBtn");
    const switchText = document.getElementById("switchText");
    const msg = document.getElementById("msg");

    let isRegister = false;

    // Login and Registration Switch
    document.getElementById("switchText").addEventListener("click", function(e) {
        if (e.target.id !== "switch") return;

        e.preventDefault();
        isRegister = !isRegister;

        heading.textContent = isRegister ?
            "Student Registration" : "Student Login";

        nameInput.classList.toggle("hidden", !isRegister);
        nameInput.required = isRegister;

        submitBtn.textContent = isRegister ? "Register" : "Login";

        this.innerHTML = isRegister ?
            'Already registered? <a href="#" id="switch">Login here</a>' :
            'New user? <a href="#" id="switch">Register here</a>';

        msg.textContent = "";
    });

    // Login and Registration
    authForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const data = {
            email: emailInput.value.trim(),
            password: passwordInput.value
        };

        if (isRegister) {
            data.name = nameInput.value.trim();
        }

        const endpoint = isRegister ? "/register" : "/login";

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                msg.textContent = result.message || "Something went wrong.";
                return;
            }

            if (isRegister) {
                msg.style.color = "green";
                msg.textContent = result.message;

                authForm.reset();

                isRegister = false;
                heading.textContent = "Student Login";
                nameInput.classList.add("hidden");
                nameInput.required = false;
                submitBtn.textContent = "Login";

                switchText.innerHTML =
                    'New user? <a href="#" id="switch">Register here</a>';
            } else {
                localStorage.setItem("token", result.token);
                localStorage.setItem("studentName", result.name);

                window.location.href = "dashboard.html";
            }

        } catch (error) {
            msg.textContent = "Unable to connect to the server.";
        }
    });
}

// Dashboard Code
const portfolioForm = document.getElementById("portfolioForm");

if (portfolioForm) {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
    }

    const portfolioList = document.getElementById("portfolioList");
    const portfolioMsg = document.getElementById("portfolioMsg");
    const formHeading = document.getElementById("formHeading");
    const saveBtn = document.getElementById("saveBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    let editingId = null;

    // Add or Update Portfolio Item
    portfolioForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const data = {
            title: document.getElementById("title").value.trim(),
            description: document.getElementById("description").value.trim(),
            skills: document.getElementById("skills").value.trim(),
            link: document.getElementById("link").value.trim()
        };

        const url = editingId ?
            `/portfolio/${editingId}` : "/portfolio";

        const method = editingId ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                portfolioMsg.textContent = result.message;
                return;
            }

            portfolioMsg.style.color = "green";
            portfolioMsg.textContent = result.message;

            portfolioForm.reset();
            resetEditMode();
            loadPortfolio();

        } catch (error) {
            portfolioMsg.textContent = "Unable to save portfolio item.";
        }
    });

    // Load Portfolio Items
    async function loadPortfolio() {
        try {
            const response = await fetch("/portfolio", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                localStorage.removeItem("token");
                localStorage.removeItem("studentName");
                window.location.href = "index.html";
                return;
            }

            const items = await response.json();

            portfolioList.innerHTML = "";

            if (items.length === 0) {
                portfolioList.textContent = "No portfolio items added yet.";
                return;
            }

            items.forEach(item => {
                const card = document.createElement("div");
                card.className = "portfolio-card";

                const title = document.createElement("h4");
                title.textContent = item.title;

                const description = document.createElement("p");
                description.textContent = item.description || "";

                const skills = document.createElement("p");
                skills.textContent = "Skills: " + (item.skills || "Not specified");

                card.appendChild(title);
                card.appendChild(description);
                card.appendChild(skills);

                if (item.link) {
                    const link = document.createElement("a");
                    link.href = item.link;
                    link.textContent = "View Project";
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    card.appendChild(link);
                }

                const editBtn = document.createElement("button");
                editBtn.textContent = "Edit";
                editBtn.addEventListener("click", () => editPortfolio(item));

                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Delete";
                deleteBtn.addEventListener("click", () => deletePortfolio(item._id));

                card.appendChild(editBtn);
                card.appendChild(deleteBtn);

                portfolioList.appendChild(card);
            });

        } catch (error) {
            portfolioMsg.textContent = "Unable to load portfolio items.";
        }
    }

    // Edit Portfolio Item
    function editPortfolio(item) {
        editingId = item._id;

        document.getElementById("title").value = item.title;
        document.getElementById("description").value = item.description || "";
        document.getElementById("skills").value = item.skills || "";
        document.getElementById("link").value = item.link || "";

        formHeading.textContent = "Update Portfolio Details";
        saveBtn.textContent = "Update Portfolio";
        cancelBtn.classList.remove("hidden");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    // Delete Portfolio Item
    async function deletePortfolio(id) {
        if (!confirm("Are you sure you want to delete this item?")) {
            return;
        }

        try {
            const response = await fetch(`/portfolio/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                portfolioMsg.textContent = result.message;
                return;
            }

            portfolioMsg.style.color = "green";
            portfolioMsg.textContent = result.message;

            if (editingId === id) {
                portfolioForm.reset();
                resetEditMode();
            }

            loadPortfolio();

        } catch (error) {
            portfolioMsg.textContent = "Unable to delete portfolio item.";
        }
    }

    // Cancel Editing
    cancelBtn.addEventListener("click", function() {
        portfolioForm.reset();
        resetEditMode();
    });

    function resetEditMode() {
        editingId = null;
        formHeading.textContent = "Add Portfolio Details";
        saveBtn.textContent = "Add Portfolio";
        cancelBtn.classList.add("hidden");
    }

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", function() {
        localStorage.removeItem("token");
        localStorage.removeItem("studentName");
        window.location.href = "index.html";
    });

    // Display Student Name
    const studentName = localStorage.getItem("studentName");

    if (studentName) {
        document.querySelector("main h2").textContent =
            "Welcome, " + studentName + "!";
    }

    loadPortfolio();
}
