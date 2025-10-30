
        let timerInterval;
        let pinExpiryTime;

        document.getElementById("loginForm").addEventListener("submit", function(event) {
            event.preventDefault();
            document.getElementById("username-error").style.display = "none";
            document.getElementById("password-error").style.display = "none";
            document.getElementById("login-message").style.display = "none";
            let username = document.getElementById("username").value.trim();
            let password = document.getElementById("password").value;
            let isValid = true;
            
            if (username === "") {
                document.getElementById("username-error").style.display = "block";
                isValid = false;
            }
            
            if (password.length < 8) {
                document.getElementById("password-error").style.display = "block";
                isValid = false;
            }
            
            if (!isValid) return;
            const loginBtn = document.querySelector(".btn-login");
            const originalBtnText = loginBtn.textContent;
            loginBtn.textContent = "Logging in...";
            loginBtn.disabled = true;
            let formData = new FormData(this);
            fetch("PHP/login.php", {
                method: "POST",
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                console.log("Server Response:", data);
                console.log("Expiry time received:", data.expiry_time);
                console.log("Expiry time as Date:", new Date(data.expiry_time));
                
                let message = document.getElementById("login-message");
                
                if (data.status === "success") {
                    window.location.href = data.redirect;
                } else if (data.status === "pincode_required") {
                    document.getElementById("user-email").value = data.email;
                    document.getElementById("pincodeModal").style.display = "flex";
                    document.getElementById("pincode").focus();
                    document.getElementById("pincode").disabled = false;
                    document.getElementById("verifyPincode").disabled = false;
                    console.log("Starting timer with expiry:", data.expiry_time);
                    startTimer(data.expiry_time);
                } else {
                    message.textContent = data.message || "Login failed. Please try again.";
                    message.style.display = "block";
                }
            })
            .catch(error => {
                console.error("Error:", error);
                document.getElementById("login-message").textContent = "An error occurred. Please try again.";
                document.getElementById("login-message").style.display = "block";
            })
            .finally(() => {
                loginBtn.textContent = originalBtnText;
                loginBtn.disabled = false;
            });
        });
        function startTimer(expiryTime) {
            pinExpiryTime = typeof expiryTime === 'number' ? expiryTime : new Date(expiryTime).getTime();
            if (!pinExpiryTime || isNaN(pinExpiryTime)) {
                pinExpiryTime = new Date().getTime() + 300000; // 5 minutes from now
            }
            
            console.log("Timer started with expiry:", new Date(pinExpiryTime));
            
            clearInterval(timerInterval);
            document.getElementById("timer").style.color = "#27ae60";
            document.getElementById("pincode").disabled = false;
            document.getElementById("verifyPincode").disabled = false;
            
            timerInterval = setInterval(function() {
                const now = new Date().getTime();
                const distance = pinExpiryTime - now;
                
                if (distance < 0) {
                    clearInterval(timerInterval);
                    document.getElementById("timer").textContent = "00:00";
                    document.getElementById("timer").style.color = "#e74c3c";
                    document.getElementById("verifyPincode").disabled = true;
                    document.getElementById("pincode").disabled = true;
                    showPincodeError("PIN has expired. Please request a new one.");
                    return;
                }
                
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                
                document.getElementById("timer").textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                if (minutes === 0 && seconds < 30) {
                    document.getElementById("timer").style.color = "#e74c3c";
                }
            }, 1000);
        }
        document.getElementById("verifyPincode").addEventListener("click", function() {
            let pincode = document.getElementById("pincode").value;
            let username = document.getElementById("username").value;
            let errorElement = document.getElementById("pincode-error");
            errorElement.style.display = "none";
            errorElement.className = "pincode-error";
            if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
                showPincodeError("PIN must be 6 digits");
                return;
            }
            const verifyBtn = document.getElementById("verifyPincode");
            const originalBtnText = verifyBtn.textContent;
            verifyBtn.textContent = "Verifying...";
            verifyBtn.disabled = true;
            let formData = new FormData();
            formData.append("username", username);
            formData.append("pincode", pincode);
            formData.append("verify_pin", "true");
            fetch("PHP/login.php", {
                method: "POST",
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                if (data.status === "success") {
                    clearInterval(timerInterval);
                    window.location.href = data.redirect;
                } else {
                    showPincodeError(data.message || "Invalid PIN. Please try again.");
                    document.getElementById("pincode").value = "";
                    document.getElementById("pincode").focus();
                }
            })
            .catch(error => {
                console.error("Error:", error);
                showPincodeError("An error occurred. Please try again.");
            })
            .finally(() => {
                verifyBtn.textContent = originalBtnText;
                verifyBtn.disabled = false;
            });
        });
        document.getElementById("resendPincode").addEventListener("click", function() {
            let username = document.getElementById("username").value;
            let resendBtn = document.getElementById("resendPincode");
            const originalBtnText = resendBtn.textContent;
            resendBtn.textContent = "Sending...";
            resendBtn.disabled = true;
            let formData = new FormData();
            formData.append("username", username);
            formData.append("resend_pin", "true");
            fetch("PHP/login.php", {
                method: "POST",
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                console.log("Resend response:", data);
                console.log("New expiry time:", data.expiry_time);
                
                if (data.status === "success") {
                    showPincodeSuccess("New PIN sent to your email!");
                    document.getElementById("pincode").value = "";
                    document.getElementById("pincode").focus();
                    startTimer(data.expiry_time);
                } else {
                    showPincodeError(data.message || "Failed to send new PIN. Please try again.");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                showPincodeError("An error occurred. Please try again.");
            })
            .finally(() => {
                resendBtn.textContent = originalBtnText;
                resendBtn.disabled = false;
            });
        });

        function showPincodeError(message) {
            const errorElement = document.getElementById("pincode-error");
            errorElement.textContent = message;
            errorElement.className = "pincode-error error";
            errorElement.style.display = "block";
        }

        function showPincodeSuccess(message) {
            const errorElement = document.getElementById("pincode-error");
            errorElement.textContent = message;
            errorElement.className = "pincode-error success";
            errorElement.style.display = "block";
            setTimeout(() => {
                errorElement.style.display = "none";
            }, 3000);
        }
        document.getElementById("pincode").addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                document.getElementById("verifyPincode").click();
            }
        });
        document.getElementById("pincodeModal").addEventListener("click", function(e) {
            if (e.target === this) {
                clearInterval(timerInterval);
                this.style.display = "none";
            }
        });
        window.addEventListener("DOMContentLoaded", () => {
            document.getElementById("username").focus();
        });
 