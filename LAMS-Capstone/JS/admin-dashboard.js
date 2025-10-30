
        document.addEventListener("DOMContentLoaded", function () {
            logDashboardAccess();
            const adminMenu = document.querySelector(".admin-menu");
            const dropdown = document.querySelector(".dropdown");

            adminMenu.addEventListener("click", function (event) {
                event.stopPropagation();
                dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
            });

            document.addEventListener("click", function () {
                dropdown.style.display = "none";
            });
        });

        document.addEventListener("DOMContentLoaded", function() {
            const logHistoryBtn = document.getElementById('logHistoryBtn');
            const logHistoryModal = document.getElementById('logHistoryModal');
            const closeLogHistory = document.getElementById('closeLogHistory');
            
            logHistoryBtn.addEventListener('click', function() {
                logSystemLogsAccess();
                fetchLogHistory();
                logHistoryModal.style.display = 'flex';
            });
            
            closeLogHistory.addEventListener('click', function() {
                logHistoryModal.style.display = 'none';
            });
            
            window.addEventListener('click', function(event) {
                if (event.target === logHistoryModal) {
                    logHistoryModal.style.display = 'none';
                }
            });
            
            function fetchLogHistory() {
                fetch('PHP/fetch_log_history.php')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('logHistoryTableBody');
                        tableBody.innerHTML = '';
                        
                        if (data.status === 'success') {
                            data.logs.forEach(log => {
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td>${log.name}</td>
                                    <td>${log.role}</td>
                                    <td>${log.date}</td>
                                    <td>${log.login_time || 'N/A'}</td>
                                    <td>${log.logout_time || 'N/A'}</td>
                                `;
                                tableBody.appendChild(row);
                            });
                        } else {
                            tableBody.innerHTML = `<tr><td colspan="5">${data.message}</td></tr>`;
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching log history:', error);
                        const tableBody = document.getElementById('logHistoryTableBody');
                        tableBody.innerHTML = `<tr><td colspan="5">Error loading log history</td></tr>`;
                    });
            }
        });

        document.addEventListener("DOMContentLoaded", function () {
            const logoutBtn = document.querySelector(".logout-btn");
            const modal = document.querySelector(".modal");
            const yesBtn = document.querySelector(".yes-btn");
            const noBtn = document.querySelector(".no-btn");

            logoutBtn.addEventListener("click", function () {
                modal.style.display = "flex";
            });

            yesBtn.addEventListener("click", function () {
        
                fetch('PHP/logout.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        confirm_logout: true 
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Logout failed');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.status === "success") {
                        
                        window.location.href = "login.html";
                    } else {
                        console.error('Logout recording failed:', data.message);
                       
                        window.location.href = "login.html";
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    
                    window.location.href = "login.html";
                });
            });

            noBtn.addEventListener("click", function () {
                modal.style.display = "none";
            });
        });

        function logSystemLogsAccess() {
            const formData = new FormData();
            formData.append('action', 'log_audit_trail');
            formData.append('audit_action', 'VIEW_LOGS_HISTORY');
            formData.append('description', 'Viewed system access logs');

            fetch('PHP/audit_functions.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status !== 'success') {
                    console.error('Failed to log system logs access:', data.message);
                }
            })
            .catch(error => {
                console.error('Error logging system logs access:', error);
            });
        }

        function logDashboardAccess() {
           
            const formData = new FormData();
            formData.append('action', 'log_audit_trail');
            formData.append('audit_action', 'DASHBOARD_ACCESS');
            formData.append('description', 'Accessed dashboard page');

            fetch('PHP/audit_functions.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status !== 'success') {
                    console.error('Failed to log dashboard access:', data.message);
                }
            })
            .catch(error => {
                console.error('Error logging dashboard access:', error);
            });
        }

        document.addEventListener("DOMContentLoaded", function() {
           
            function fetchStats() {
                fetch('PHP/fetch-status.php')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.status === 'success') {
                            
                            document.querySelector('.stat-card.green .stat-card-content span').textContent = data.data.time_in;
                            document.querySelector('.stat-card.red .stat-card-content span').textContent = data.data.time_out;
                            document.querySelector('.stat-card.blue .stat-card-content span').textContent = data.data.students;
                            document.querySelector('.stat-card.purple .stat-card-content span').textContent = data.data.faculty;
                            document.querySelector('.stat-card.gray .stat-card-content span').textContent = data.data.staff;
                            
                      
                        } else {
                            console.error('Error fetching stats:', data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching stats:', error);
                    });
            }

            fetchStats();
            
            
            setInterval(fetchStats, 30000);
        });