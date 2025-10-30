
        document.addEventListener("DOMContentLoaded", function () {
            const adminMenu = document.querySelector(".admin-menu");
            const dropdown = document.querySelector(".dropdown");
            const logoutBtn = document.querySelector(".logout-btn");
            const modal = document.querySelector(".modal");
            const yesBtn = document.querySelector(".yes-btn");
            const noBtn = document.querySelector(".no-btn");
            const videoElement = document.getElementById('video');
            const canvasElement = document.getElementById('canvas');
            const canvasContext = canvasElement.getContext('2d', { willReadFrequently: true });
            const scanResult = document.getElementById('scan-result');
            const scanDetails = document.getElementById('scan-details');
            
            let scanning = true;
            let scanCooldown = false;
            let recentScans = [];
            let lastScanTime = {};
            const SCAN_COOLDOWN = 60000;

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

            function canScanAgain(qrCode) {
                const now = Date.now();
                if (!lastScanTime[qrCode]) {
                    return true;
                }
                
                const timeSinceLastScan = now - lastScanTime[qrCode];
                return timeSinceLastScan >= SCAN_COOLDOWN;
            }

            function updateLastScanTime(qrCode) {
                lastScanTime[qrCode] = Date.now();
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

            
            function initializeAutoReset() {
                    scheduleNextReset();
                }

                function scheduleNextReset() {
                    const now = new Date();
                    const today6PM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0, 0);

                    let delay;

                    if (now >= today6PM) {
                   
                        const tomorrow6PM = new Date(today6PM);
                        tomorrow6PM.setDate(tomorrow6PM.getDate() + 1);
                        delay = tomorrow6PM - now;
                    } else {
                        delay = today6PM - now;
                    }

                    console.log(`Next reset in ${Math.round(delay / 60000)} minutes at 6:00 PM`);

                    setTimeout(() => {
                        resetRecentScans();
                        scheduleNextReset();
                    }, delay);
                }


            function resetRecentScans() {
                recentScans = [];
                localStorage.removeItem('recentScans');
                updateRecentScansDisplay();
                showToast('Recent scans have been reset for the day', 'info');
            }

            function addToRecentScans(memberData, memberType) {
                const now = new Date();
            
                recentScans.unshift({
                    id: memberData[memberType + '_number'],
                    name: memberData.name,
                    picture: memberData.picture,
                    timestamp: now.toISOString(),
                    type: memberType
                });
                if (recentScans.length > 20) {
                    recentScans = recentScans.slice(0, 20);
                }
                
                localStorage.setItem('recentScans', JSON.stringify(recentScans));
                updateRecentScansDisplay();
                return true;
            }

            function updateRecentScansDisplay() {
                const container = document.getElementById('scanned-users');
                container.innerHTML = '';
                const scansToShow = recentScans.slice(0, 5);
                const extraScans = Math.max(0, recentScans.length - 5);
                
                console.log('Total scans:', recentScans.length, 'Showing:', scansToShow.length, 'Extra:', extraScans); // Debug line
                scansToShow.forEach(scan => {
                    if (scan.picture && scan.picture.trim() !== '') {
                        const img = document.createElement('img');
                        img.src = scan.picture;
                        img.className = 'scanned-user-avatar';
                        img.title = scan.name;
                        container.appendChild(img);
                    } else {
                        const avatar = document.createElement('div');
                        avatar.className = 'scanned-user-avatar';
                        const initials = scan.name.split(' ').map(n => n[0]).join('').toUpperCase();
                        avatar.textContent = initials.length > 2 ? initials.substring(0, 2) : initials;
                        avatar.title = scan.name;
                        container.appendChild(avatar);
                    }
                });
                if (extraScans > 0) {
                    const moreElement = document.createElement('div');
                    moreElement.className = 'scanned-user-avatar more-count';
                    moreElement.textContent = `+${extraScans}`;
                    moreElement.title = `${extraScans} more scanned users`;
                    container.appendChild(moreElement);
                }
            }
           
            function loadRecentScans() {
                const savedScans = localStorage.getItem('recentScans');
                recentScans = savedScans ? JSON.parse(savedScans) : [];
                updateRecentScansDisplay();
                const recentlyScannedSection = document.querySelector('.recently-scanned');
                if (recentScans.length === 0) {
                    recentlyScannedSection.style.display = 'none';
                } else {
                    recentlyScannedSection.style.display = 'block';
                }

                initializeAutoReset();
            }
            loadRecentScans();

            function displayUserData(memberType, memberData) {
                document.getElementById('scan-prompt').classList.add('hidden');
                document.getElementById('user-details-section').classList.remove('hidden');
                
                document.querySelector('.recently-scanned').style.display = 'block';

                document.getElementById('user-name').textContent = memberData.name;
                document.getElementById('user-id').textContent = memberData[memberType + '_number'];
                document.getElementById('user-department').textContent = memberData.department;
                
                if (memberType === 'student') {
                    document.getElementById('user-program').textContent = `${memberData.program} - ${memberData.year_level} (${memberData.block})`;
                } else if (memberType === 'faculty') {
                    document.getElementById('user-program').textContent = memberData.program;
                } else {
                    document.getElementById('user-program').textContent = memberData.role;
                }

                const statusElement = document.getElementById('user-status');
                statusElement.textContent = memberData.registration_status;
                statusElement.className = 'status-badge ' + 
                    (memberData.registration_status === 'Registered' ? 'bg-success' : 'bg-warning text-dark');

                const profilePic = document.getElementById('profile-picture');
                const noPic = document.getElementById('no-picture');
                
                if (memberData.picture && memberData.picture.trim() !== '') {
                    profilePic.src = memberData.picture;
                    profilePic.style.display = 'block';
                    noPic.style.display = 'none';
                } else {
                    profilePic.style.display = 'none';
                    noPic.style.display = 'flex';
                }

                fetchAttendanceRecords(memberType, memberData[memberType + '_number']);
            }

            function fetchAttendanceRecords(memberType, memberNumber) {
                $.ajax({
                    url: 'PHP/fetch_attendance.php',
                    type: 'POST',
                    data: {
                        idNumber: memberNumber,
                        userType: memberType
                    },
                    dataType: 'json',
                    success: function(data) {
                        if (data.success) {
                            const tbody = document.getElementById('attendance-data');
                            tbody.innerHTML = '';

                            data.attendance.forEach(record => {
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td>${record.time_in || '-'}</td>
                                    <td>${record.time_out || '-'}</td>
                                    <td>${record.log_date}</td>
                                `;
                                tbody.appendChild(row);
                            });
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error("Error fetching attendance:", error);
                    }
                });
            }

           function processScan(code) {
                if (scanCooldown) return;
                
                scanCooldown = true;
                setTimeout(() => { scanCooldown = false; }, 2000);

                scanResult.textContent = "Scanning...";
                scanResult.className = "mb-1 text-info";
                scanDetails.textContent = "";
                
                const currentDate = new Date().toISOString().split('T')[0];
                
                $.ajax({
                    url: 'PHP/process_scan.php',
                    type: 'POST',
                    data: {
                        qrCode: code,
                        scanDate: currentDate
                    },
                    dataType: 'json',
                    success: function(data) {
                        if (data.success) {
                            const memberType = data.memberType;
                            const memberData = data.data;
                            updateLastScanTime(code);
                            addToRecentScans(memberData, memberType);
                            
                            const currentTime = new Date();
                            const formattedTime = currentTime.toLocaleTimeString('en-US', {
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true
                            });
                            
                            scanResult.textContent = `Scanned Successfully: ${memberType.charAt(0).toUpperCase() + memberType.slice(1)}`;
                            scanResult.className = "mb-1 text-success";
                            scanDetails.textContent = `ID: ${code} - Time ${data.timeType}: ${formattedTime}`;
                            
                            showToast(`Attendance recorded successfully for ${memberData.name}`, 'success');
                            
                            displayUserData(memberType, memberData);
                            
                            setTimeout(() => {
                                scanResult.textContent = "Waiting for QR code...";
                                scanResult.className = "mb-1 text-dark";
                                scanDetails.textContent = "";
                            }, 3000);
                        } else {
                            if (data.cooldown) {
                                scanResult.textContent = data.message;
                                scanResult.className = "mb-1 text-warning";
                                scanDetails.textContent = "";
                                
                                showToast(data.message, 'warning');
                                
                                setTimeout(() => {
                                    scanResult.textContent = "Waiting for QR code...";
                                    scanResult.className = "mb-1 text-dark";
                                    scanDetails.textContent = "";
                                }, 3000);
                                return;
                            }
                            document.querySelector('.recently-scanned').style.display = 'block';
                            
                            if (data.memberType) {
                                const memberType = data.memberType.charAt(0).toUpperCase() + data.memberType.slice(1);
                                scanResult.textContent = `${memberType} QR Code Not Registered`;
                                scanDetails.textContent = data.message;
                                
                                showToast("This QR code must be registered first. Please contact an administrator.", 'danger');
                            } else {
                                scanResult.textContent = data.message || "No record found for that QR code";
                                showToast(data.message || "Scan failed", 'error');
                            }
                            
                            scanResult.className = "mb-1 text-danger";
                            
                            setTimeout(() => {
                                scanResult.textContent = "Waiting for QR code...";
                                scanResult.className = "mb-1 text-dark";
                                scanDetails.textContent = "";
                            }, 3000);
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error("AJAX Error:", status, error);
                        scanResult.textContent = "Server Error";
                        scanResult.className = "mb-1 text-danger";
                        scanDetails.textContent = "Please check server logs";
                        
                        showToast("Server error occurred", 'error');
                        
                        setTimeout(() => {
                            scanResult.textContent = "Waiting for QR code...";
                            scanResult.className = "mb-1 text-dark";
                            scanDetails.textContent = "";
                        }, 3000);
                    }
                });
            }

            function scanQRCode() {
                if (!scanning) return;
                
                if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
                    canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
                    const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
                    
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert"
                    });
                    
                    if (code && /^\d{8}$/.test(code.data)) {
                        processScan(code.data);
                    }
                }
                
                requestAnimationFrame(scanQRCode);
            }

            initializeCamera();
        });
