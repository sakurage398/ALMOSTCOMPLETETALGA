
    document.addEventListener("DOMContentLoaded", function () {
        logPageAccess();
        
        const adminMenu = document.querySelector(".admin-menu");
        const dropdown = document.querySelector(".dropdown");
        const logoutBtn = document.querySelector(".logout-btn");
        const modal = document.querySelector(".modal");
        const yesBtn = document.querySelector(".yes-btn");
        const noBtn = document.querySelector(".no-btn");
        const videoElement = document.getElementById('video');
        const canvasElement = document.getElementById('canvas');
        const canvasContext = canvasElement.getContext('2d', { willReadFrequently: true });
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const userInfoSide = document.getElementById('user-info-side');
        
        let scanning = true;
        let scanCooldown = false;
        let isProcessingScan = false;
        let scanQueue = [];

        adminMenu.addEventListener("click", function (event) {
            event.stopPropagation();
            dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
        });

        document.addEventListener("click", function () {
            dropdown.style.display = "none";
        });
        
        logoutBtn.addEventListener("click", function () {
            modal.style.display = "flex";
        });

        yesBtn.addEventListener("click", function () {
            window.location.href = "login.html";
        });

        noBtn.addEventListener("click", function () {
            modal.style.display = "none";
        });

        function logAuditTrail(action, description) {
            const formData = new FormData();
            formData.append('action', 'log_audit_trail');
            formData.append('audit_action', action);
            formData.append('description', description);

            fetch('PHP/audit_functions.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status !== 'success') {
                    console.error('Failed to log audit trail:', data.message);
                }
            })
            .catch(error => {
                console.error('Error logging audit trail:', error);
            });
        }

        function logPageAccess() {
            logAuditTrail('REGISTRATION_ACCESS', 'Accessed registration page');
        }

        function showToast(message, type = 'success') {
            const toastContainer = document.querySelector('.toast-container');
            const toastId = 'toast-' + Date.now();
            
            const toastHTML = `
                <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body">
                            <i class="fas ${getToastIcon(type)} me-2"></i>
                            ${message}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                </div>
            `;
            
            toastContainer.insertAdjacentHTML('beforeend', toastHTML);
            
            const toastElement = document.getElementById(toastId);
            const toast = new bootstrap.Toast(toastElement, {
                autohide: true,
                delay: 3000
            });
            
            toast.show();
            
            toastElement.addEventListener('hidden.bs.toast', function () {
                toastElement.remove();
            });
        }

        function getToastIcon(type) {
            switch(type) {
                case 'success': return 'fa-check-circle';
                case 'error': return 'fa-exclamation-circle';
                case 'warning': return 'fa-exclamation-triangle';
                case 'info': return 'fa-info-circle';
                default: return 'fa-bell';
            }
        }

        searchButton.addEventListener('click', function() {
            const idNumber = searchInput.value.trim();
            if (idNumber === '') {
                showToast('Please enter an ID number', 'error');
                return;
            }
            
            logAuditTrail('SEARCH_REGISTRATION', `Searched for registration: ${idNumber}`);
            performSearch();
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const idNumber = searchInput.value.trim();
                if (idNumber === '') {
                    showToast('Please enter an ID number', 'error');
                    return;
                }
                
                logAuditTrail('SEARCH_REGISTRATION', `Searched for registration: ${idNumber}`);
                performSearch();
            }
        });

        function performSearch(idNumber = null) {
            const searchId = idNumber || searchInput.value.trim();
            
            if (searchId === '') {
                showToast('Please enter an ID number', 'error');
                return Promise.reject('Empty ID number');
            }
            if (!idNumber) {
                searchInput.value = searchId;
            }
            
            userInfoSide.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Searching...</p></div>';
            
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: 'PHP/search_member.php',
                    type: 'POST',
                    data: {
                        idNumber: searchId,
                        userType: 'unknown'
                    },
                    dataType: 'json',
                    success: function(data) {
                        if (data.success) {
                            displayUserInfoSide(data.userData, data.userType);
                            resolve({
                                userData: data.userData,
                                userType: data.userType,
                                idNumber: searchId
                            });
                        } else {
                            userInfoSide.innerHTML = `
                                <div class="text-center text-danger">
                                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                                    <p>${data.message || 'No record found for that ID number'}</p>
                                </div>
                            `;
                            showToast(data.message || 'No record found for that ID number', 'danger');
                            reject(new Error('User not found'));
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error("AJAX Error:", status, error);
                        userInfoSide.innerHTML = `
                            <div class="text-center text-danger">
                                <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                                <p>Error fetching user data. Please try again.</p>
                            </div>
                        `;
                        showToast('Error fetching user data. Please try again.', 'error');
                        reject(error);
                    }
                });
            });
        }

        function calculateExpirationDate() {
            const today = new Date();
            const monthsToAdd = 5 + Math.floor(Math.random() * 2);
            const expirationDate = new Date(today.setMonth(today.getMonth() + monthsToAdd));
            return expirationDate.toISOString().split('T')[0];
        }

        function formatDate(dateString) {
            if (!dateString) return 'N/A';
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        }

        function displayUserInfoSide(userData, userType) {
            let html = `
                <div class="user-details">
            `;
            
            if (userData.picture && userData.picture.trim() !== '') {
                html += `<img src="${userData.picture}" alt="Profile Picture" class="profile-picture-side">`;
            } else {
                html += `<div class="no-picture-side"><i class="fa-solid fa-user"></i></div>`;
            }
            
            html += `
                <div class="user-name">${userData.name}</div>
                <div class="user-details-list">
            `;
            
            if (userType === 'student') {
                html += `
                    <p><strong>Student Number:</strong> ${userData.student_number}</p>
                    <p><strong>Department:</strong> ${userData.department}</p>
                    <p><strong>Program:</strong> ${userData.program}</p>
                    <p><strong>Year Level:</strong> ${userData.year_level}</p>
                    <p><strong>Block:</strong> ${userData.block}</p>
                `;
            } else if (userType === 'faculty') {
                html += `
                    <p><strong>Faculty Number:</strong> ${userData.faculty_number}</p>
                    <p><strong>Department:</strong> ${userData.department}</p>
                    <p><strong>Program:</strong> ${userData.program}</p>
                `;
            } else if (userType === 'staff') {
                html += `
                    <p><strong>Staff Number:</strong> ${userData.staff_number}</p>
                    <p><strong>Department:</strong> ${userData.department}</p>
                    <p><strong>Role:</strong> ${userData.role}</p>
                `;
            }
            
            html += `</div><div class="status-section">`;

            const isRegistered = userData.registration_status === 'Registered';

            if (isRegistered) {
                const today = new Date();
                const expDate = new Date(userData.expiration_date);
                const isExpired = today > expDate;
                
                html += `
                    <div class="status-badge ${isExpired ? 'bg-danger' : 'bg-success'}">
                        ${isExpired ? 'EXPIRED' : 'REGISTERED'}
                    </div>
                    <p class="text-muted small mb-0" style="font-size: 0.7rem;">Expires: ${formatDate(userData.expiration_date)}</p>
                `;
            } else {
                html += `
                    <div class="status-badge bg-warning text-dark">
                        NOT REGISTERED
                    </div>
                    <p class="text-muted small mb-0" style="font-size: 0.7rem;">Scan QR code to register</p>
                `;
            }

            html += `</div></div>`;
            userInfoSide.innerHTML = html;
        }
        async function processScanQueue() {
            if (isProcessingScan || scanQueue.length === 0) return;
            
            isProcessingScan = true;
            const scanData = scanQueue.shift();
            
            try {
                showToast(`Processing: ${scanData.qrCode}`, 'info');
                const userInfo = await performSearch(scanData.qrCode);
                if (userInfo.userData.registration_status === 'Registered') {
                    showToast("This user is already registered", 'warning');
                    isProcessingScan = false;
                    processScanQueue(); // Process next in queue
                    return;
                }
                await registerUser(userInfo.userData, userInfo.userType, scanData.qrCode);
                
            } catch (error) {
                console.error('Scan processing error:', error);
                showToast(`Scan failed for: ${scanData.qrCode}`, 'error');
            } finally {
                isProcessingScan = false;
                setTimeout(processScanQueue, 100);
            }
        }
        function registerUser(userData, userType, qrCode) {
            return new Promise((resolve, reject) => {
                let idNumber;
                if (userType === 'student') {
                    idNumber = userData.student_number;
                } else if (userType === 'faculty') {
                    idNumber = userData.faculty_number;
                } else if (userType === 'staff') {
                    idNumber = userData.staff_number;
                }
                if (qrCode !== idNumber) {
                    showToast("QR code does not match the user ID", 'error');
                    reject(new Error('QR code mismatch'));
                    return;
                }
                
                $.ajax({
                    url: 'PHP/register_member.php',
                    type: 'POST',
                    data: {
                        idNumber: idNumber,
                        userType: userType,
                        qrCode: qrCode,
                        expirationDate: calculateExpirationDate()
                    },
                    dataType: 'json',
                    success: function(data) {
                        if (data.success) {
                            showToast(`Registration Successful! ${userType.charAt(0).toUpperCase() + userType.slice(1)} ID: ${idNumber}`, 'success');
                            userData.registration_status = 'Registered';
                            userData.expiration_date = data.expirationDate;
                            displayUserInfoSide(userData, userType);
                            
                            resolve(data);
                        } else {
                            showToast(data.message || "Registration failed", 'error');
                            reject(new Error(data.message || "Registration failed"));
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error("AJAX Error:", status, error);
                        showToast("Server Error", 'error');
                        reject(error);
                    }
                });
            });
        }

        async function initializeCamera() {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Media devices not supported in this browser');
                }
                
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
                
                videoElement.srcObject = stream;
                videoElement.play();
                
                videoElement.onloadedmetadata = () => {
                    canvasElement.width = videoElement.videoWidth;
                    canvasElement.height = videoElement.videoHeight;
                    requestAnimationFrame(scanQRCode);
                };
                
            } catch (error) {
                console.error("Camera error:", error);
                showToast(`Camera error: ${error.message}`, 'error');
                
                try {
                    const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
                        video: true 
                    });
                    videoElement.srcObject = fallbackStream;
                    videoElement.play();
                    
                    videoElement.onloadedmetadata = () => {
                        canvasElement.width = videoElement.videoWidth;
                        canvasElement.height = videoElement.videoHeight;
                        requestAnimationFrame(scanQRCode);
                    };
                    
                    showToast("Camera started with default settings", 'info');
                } catch (fallbackError) {
                    console.error("Fallback camera error:", fallbackError);
                    showToast("Camera cannot be accessed. Please check permissions.", 'error');
                }
            }
        }
        let lastScanTime = 0;
        const SCAN_DEBOUNCE = 500; 

        function scanQRCode() {
            if (!scanning) {
                requestAnimationFrame(scanQRCode);
                return;
            }
            
            if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
                canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
                const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
                
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert"
                });
                
                if (code) {
                    const now = Date.now();
                    if (now - lastScanTime > SCAN_DEBOUNCE) {
                        lastScanTime = now;
                        console.log("QR Code detected:", code.data);
                        scanQueue.push({
                            qrCode: code.data,
                            timestamp: now
                        });
                        
                        showToast(`QR Code scanned: ${code.data}`, 'success');
                        if (!isProcessingScan) {
                            processScanQueue();
                        }
                    }
                }
            }
            
            requestAnimationFrame(scanQRCode);
        }

        initializeCamera();
    });
