
    document.addEventListener("DOMContentLoaded", function () {
    const adminMenu = document.querySelector(".admin-menu");
    const dropdown = document.querySelector(".dropdown");
    const logoutBtn = document.querySelector(".logout-btn");
    const modal = document.getElementById("logout-modal");
    const yesBtn = document.querySelector(".yes-btn");
    const noBtn = document.querySelector(".no-btn");
    const addAdminBtn = document.getElementById("add-admin-btn");
    const addUserModal = document.getElementById("add-user-modal");
    const closeModalBtn = document.querySelector(".close-btn");
    const cancelBtn = document.querySelector(".cancel-btn");
    const saveBtn = document.querySelector(".save-btn");
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");
    const closeActivitiesBtn = document.querySelector(".close-activities-btn");
    const userActivitiesModal = document.querySelector(".user-activities-modal");
    const refreshAuditBtn = document.querySelector(".btn-secondary.btn-sm");

    let currentSelectedUserId = null;
    let currentSelectedUsername = null;
    let isModalOpen = false;

    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-50 start-50 translate-middle p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);

    function openModal(modalElement) {
        if (isModalOpen) return;
        isModalOpen = true;
        modalElement.style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    function closeModal(modalElement) {
        isModalOpen = false;
        modalElement.style.display = "none";
        document.body.style.overflow = "";
    }

    function closeAllModals() {
        document.querySelectorAll('.modal, .add-user-modal, .user-activities-modal, .custom-confirm-modal').forEach(modal => {
            modal.style.display = "none";
        });
        document.body.style.overflow = "";
        isModalOpen = false;
    }

    function showToast(message, type = 'info') {
        const toastId = 'toast-' + Date.now();
        const bgColor = type === 'success' ? 'bg-success' : 
                       type === 'error' ? 'bg-danger' : 
                       type === 'warning' ? 'bg-warning' : 'bg-info';
        
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgColor} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex justify-content-center align-items-center w-100">
                    <div class="toast-body text-center">
                        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>
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
            delay: 4000
        });
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    function showConfirmModal(message, confirmCallback) {
        const modalHTML = `
            <div class="custom-confirm-modal" id="customConfirmModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 9999; display: flex; justify-content: center; align-items: center;">
                <div class="custom-modal-content" style="background: white; padding: 30px; border-radius: 10px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.2); max-width: 400px; width: 90%;">
                    <div style="margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle text-warning fa-2x mb-3"></i>
                        <div style="font-size: 1.1rem; margin-bottom: 10px;">Confirmation</div>
                        <div>${message}</div>
                    </div>
                    <div style="display: flex; justify-content: center; gap: 15px;">
                        <button type="button" class="btn btn-secondary" id="customCancelBtn">Cancel</button>
                        <button type="button" class="btn btn-danger" id="customConfirmBtn">
                            <i class="fas fa-trash me-2"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('customConfirmModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const confirmModal = document.getElementById('customConfirmModal');
        
        document.getElementById('customConfirmBtn').addEventListener('click', function() {
            confirmCallback();
            confirmModal.remove();
            isModalOpen = false;
            document.body.style.overflow = "";
        });
        
        document.getElementById('customCancelBtn').addEventListener('click', function() {
            confirmModal.remove();
            isModalOpen = false;
            document.body.style.overflow = "";
        });
        
        confirmModal.addEventListener('click', function(e) {
            if (e.target === confirmModal) {
                confirmModal.remove();
                isModalOpen = false;
                document.body.style.overflow = "";
            }
        });
        
        isModalOpen = true;
        document.body.style.overflow = "hidden";
    }

    function searchAdminUsers(searchTerm) {
        const formData = new FormData();
        formData.append('action', 'getUsers');
        formData.append('role', 'Admin');
        formData.append('search', searchTerm);

        fetch('PHP/superadmin-user.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', text);
                return;
            }

            if (data.status === 'success') {
                displayAdminUsers(data.users);
            } else {
                console.error('Error searching admin users:', data.message);
            }
        })
        .catch(error => {
            console.error('Error searching admin users:', error);
        });
    }

    function searchAuditUsers(searchTerm) {
        const formData = new FormData();
        formData.append('action', 'getUsersForAudit');
        
        if (searchTerm) {
            formData.append('search', searchTerm);
        }

        const tbody = document.getElementById("audit-users-body");
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Searching...</td></tr>';

        fetch('PHP/superadmin-user.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                showToast('Failed to search users: Server returned invalid response', 'error');
                renderUsersList([]);
                return;
            }

            if (data.status === 'success') {
                renderUsersList(data.users);
                if (searchTerm && data.users.length === 0) {
                    const tbody = document.getElementById("audit-users-body");
                    tbody.innerHTML = `<tr class="empty-message"><td colspan="6" class="text-center">No users found for "${searchTerm}"</td></tr>`;
                }
            } else {
                showToast('Error searching users: ' + data.message, 'error');
                renderUsersList([]);
            }
        })
        .catch(error => {
            showToast('Failed to search users. Please try again.', 'error');
            renderUsersList([]);
        });
    }

    adminMenu.addEventListener("click", function (event) {
        event.stopPropagation();
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", function () {
        dropdown.style.display = "none";
    });

    logoutBtn.addEventListener("click", function () {
        openModal(modal);
    });

    yesBtn.addEventListener("click", function () {
        window.location.href = "login.html";
    });

    noBtn.addEventListener("click", function () {
        closeModal(modal);
    });

    addAdminBtn.addEventListener("click", function() {
        document.querySelector(".form-title").textContent = "Add Admin User";
        openModal(addUserModal);
        resetForm();
    });

    closeModalBtn.addEventListener("click", function() {
        closeModal(addUserModal);
    });

    cancelBtn.addEventListener("click", function() {
        closeModal(addUserModal);
    });

    closeActivitiesBtn.addEventListener("click", function() {
        closeModal(userActivitiesModal);
    });

    if (refreshAuditBtn) {
        refreshAuditBtn.addEventListener("click", function() {
            const auditSearchBox = document.querySelector('#audit-tab input[placeholder="Search users..."]');
            if (auditSearchBox) {
                auditSearchBox.value = ''; 
            }
            loadUsersForAudit();
        });
    }

    window.addEventListener("click", function(event) {
        if (event.target === addUserModal || event.target === modal || event.target === userActivitiesModal) {
            closeAllModals();
        }
    });

    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            closeAllModals();
        }
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            if (tabId === 'audit-tab') {
                const auditSearchBox = document.querySelector('#audit-tab input[placeholder="Search users..."]');
                if (auditSearchBox) {
                    auditSearchBox.value = '';
                }
                loadUsersForAudit();
            } else if (tabId === 'admin-tab') {
                loadAdminUsers();
            }
        });
    });

    const adminSearchBox = document.querySelector('input[placeholder="Search admin users..."]');
    if (adminSearchBox) {
        adminSearchBox.addEventListener("input", function() {
            clearTimeout(this.searchTimer);
            this.searchTimer = setTimeout(function() {
                searchAdminUsers(adminSearchBox.value);
            }, 300);
        });
    }

    const auditSearchBox = document.querySelector('#audit-tab input[placeholder="Search users..."]');
    if (auditSearchBox) {
        auditSearchBox.addEventListener("input", function() {
            clearTimeout(this.searchTimer);
            this.searchTimer = setTimeout(() => {
                const searchTerm = this.value.trim();
                searchAuditUsers(searchTerm);
            }, 500);
        });
    }

    function resetForm() {
        document.getElementById("user-name").value = "";
        document.getElementById("user-username").value = "";
        document.getElementById("user-email").value = "";
        document.getElementById("user-password").value = "";
        delete saveBtn.dataset.editId;
    }

    saveBtn.addEventListener("click", function() {
        const name = document.getElementById("user-name").value.trim();
        const username = document.getElementById("user-username").value.trim();
        const email = document.getElementById("user-email").value.trim();
        const password = document.getElementById("user-password").value;
        const isEdit = saveBtn.dataset.editId;

        if (!name || !username || !email) {
            showToast('Please fill in all required fields!', 'warning');
            return;
        }

        if (!isEdit && !password) {
            showToast('Please enter a password!', 'warning');
            return;
        }

        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address!', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('action', isEdit ? 'edit' : 'add');
        formData.append('name', name);
        formData.append('role', 'Admin');
        formData.append('username', username);
        formData.append('email', email);
        
        if (password) {
            formData.append('password', password);
        }

        formData.append('send_email', 'true');

        if (isEdit) {
            formData.append('id', saveBtn.dataset.editId);
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

        fetch('PHP/superadmin-user.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                if (text.includes('Fatal error') || text.includes('Exception')) {
                    throw new Error('Server error: ' + text.split('\n')[0]);
                }
                throw new Error('Server returned invalid response');
            }

            if (data.status === 'success') {
                closeModal(addUserModal);
                let message = isEdit ? 'Admin user updated successfully!' : 'Admin user added successfully!';
                if (data.email_status) {
                    message += '<br><small>' + data.email_status + '</small>';
                }
                showToast(message, 'success');
                resetForm();
                loadAdminUsers();
            } else {
                showToast('Error: ' + (data.message || 'Operation failed'), 'error');
            }
        })
        .catch(error => {
            showToast('Failed to save user: ' + error.message, 'error');
        })
        .finally(() => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save';
        });
    });

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    loadAdminUsers();

    function loadAdminUsers() {
        const formData = new FormData();
        formData.append('action', 'getUsers');
        formData.append('role', 'Admin');

        fetch('PHP/superadmin-user.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                displayAdminUsers([]);
                return;
            }

            if (data.status === 'success') {
                displayAdminUsers(data.users);
            } else {
                displayAdminUsers([]);
            }
        })
        .catch(error => {
            displayAdminUsers([]);
        });
    }

    function displayAdminUsers(users) {
        const tbody = document.getElementById("admin-users-body");
        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = `<tr class="empty-message"><td colspan="5" class="text-center">No admin users found</td></tr>`;
            return;
        }

        users.forEach(user => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.name || ''}</td>
                <td>${user.role || ''}</td>
                <td>${user.username || ''}</td>
                <td>${user.email || ''}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${user.id}">
                        <i class="fa-solid fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${user.id}">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        setupAdminActionButtons();
    }

    function setupAdminActionButtons() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.dataset.id;
                editAdminUser(userId);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.dataset.id;
                showConfirmModal(
                    'Are you sure you want to delete this admin user?<br><small class="text-muted">This action cannot be undone.</small>',
                    () => deleteAdminUser(userId)
                );
            });
        });
    }

    function editAdminUser(userId) {
        const formData = new FormData();
        formData.append('action', 'getUser');
        formData.append('id', userId);

        fetch('PHP/superadmin-user.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                showToast('Failed to load user details: Server returned invalid response', 'error');
                return;
            }

            if (data.status === 'success') {
                const user = data.user;
                document.getElementById("user-name").value = user.name || '';
                document.getElementById("user-username").value = user.username || '';
                document.getElementById("user-email").value = user.email || '';
                document.getElementById("user-password").value = '';
                
                document.querySelector(".form-title").textContent = "Edit Admin User";
                openModal(addUserModal);
                saveBtn.dataset.editId = userId;
            } else {
                showToast('Error loading user details: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showToast('Failed to load user details. Please try again.', 'error');
        });
    }

    function deleteAdminUser(userId) {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', userId);

        fetch('PHP/superadmin-user.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                if (text.includes('foreign key constraint') || text.includes('Cannot delete')) {
                    showToast('Cannot delete user: This user has activity records in the system. Please contact the database administrator to remove related records first.', 'error');
                } else {
                    showToast('Failed to delete user: Server returned invalid response', 'error');
                }
                return;
            }

            if (data.status === 'success') {
                showToast('Admin user deleted successfully!', 'success');
                loadAdminUsers();
            } else {
                showToast('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showToast('Failed to delete user. Please try again.', 'error');
        });
    }

    function loadUsersForAudit() {
        const auditSearchBox = document.querySelector('#audit-tab input[placeholder="Search users..."]');
        const searchTerm = auditSearchBox ? auditSearchBox.value : '';
        
        const formData = new FormData();
        formData.append('action', 'getUsersForAudit');
        if (searchTerm) {
            formData.append('search', searchTerm);
        }

        fetch('PHP/superadmin-user.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                showToast('Failed to load users: Server returned invalid response', 'error');
                return;
            }

            if (data.status === 'success') {
                renderUsersList(data.users);
            } else {
                showToast('Error loading users: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showToast('Failed to load users. Please try again.', 'error');
        });
    }

    function renderUsersList(users) {
        const tbody = document.getElementById("audit-users-body");
        tbody.innerHTML = '';
        
        if (users.length === 0) {
            tbody.innerHTML = `<tr class="empty-message"><td colspan="6" class="text-center">No users found</td></tr>`;
            return;
        }
        
        users.forEach(function(user) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.name}</td>
                <td>${user.role}</td>
                <td>${user.email}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-activities-btn" data-user-id="${user.id}" data-username="${user.username}">
                        <i class="fa-solid fa-eye"></i> View Activities
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        setupViewActivitiesButtons();
    }

    function setupActivitiesEventListeners() {
        const activitiesModal = document.querySelector('.user-activities-modal');
        
        const actionFilter = activitiesModal.querySelector('.action-filter');
        if (actionFilter) {
            actionFilter.addEventListener("change", function() {
                loadUserActivities(1);
            });
        }
    }

    function setupViewActivitiesButtons() {
        document.querySelectorAll('.view-activities-btn').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.dataset.userId;
                const username = this.dataset.username;
                viewUserActivities(userId, username);
            });
        });
    }

    function viewUserActivities(userId, username) {
        currentSelectedUserId = userId;
        currentSelectedUsername = username;
        
        document.getElementById("selected-username").textContent = username;
        openModal(userActivitiesModal);
        
        const actionFilter = userActivitiesModal.querySelector('.action-filter');
        if (actionFilter) actionFilter.value = '';
  
        setupActivitiesEventListeners();
        loadUserActivities(1);
    }

    function loadUserActivities(page) {
        if (!currentSelectedUserId) return;
        
        const activitiesModal = document.querySelector('.user-activities-modal');
        const filterInput = activitiesModal.querySelector('.action-filter');
        
        const actionFilter = filterInput ? filterInput.value : '';
        
        const tbody = document.querySelector('.activities-table tbody');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading activities...</td></tr>';

        const formData = new FormData();
        formData.append('action', 'getUserAuditLogs');
        formData.append('user_id', currentSelectedUserId);
        formData.append('page', page.toString());
        formData.append('limit', '50');
        
        if (actionFilter) {
            formData.append('action_filter', actionFilter);
        }

        fetch('PHP/superadmin-user.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                showToast('Failed to load user activities: Server returned invalid response', 'error');
                renderUserActivities([]);
                return;
            }

            if (data.status === 'success') {
                renderUserActivities(data.logs);
                updateActivitiesPagination(data.page, data.total_pages);
            } else {
                showToast('Error loading user activities: ' + data.message, 'error');
                renderUserActivities([]);
            }
        })
        .catch(error => {
            showToast('Failed to load user activities. Please try again.', 'error');
            renderUserActivities([]);
        });
    }

    function renderUserActivities(logs) {
        const tbody = document.querySelector('.activities-table tbody');
        tbody.innerHTML = '';
        
        if (logs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">No activities found</td></tr>`;
            return;
        }
        
        logs.forEach(function(log) {
            const timestamp = new Date(log.timestamp).toLocaleString();
            const details = getActionDetails(log);
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${timestamp}</td>
                <td><span class="badge bg-secondary">${log.action}</span></td>
                <td>${log.description}</td>
                <td>${log.ip_address}</td>
                <td>${details}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function getActionDetails(log) {
        const actionMap = {
            'DASHBOARD_ACCESS': 'Viewed Library Entries',
            'VIEW_SYSTEM_LOGS': 'Viewed System Access Logs',
            'VIEW_LOGS_HISTORY': 'Viewed System Logs',
            'ATTENDANCE_ACCESS': 'Accessed Attendance Page',
            'GENERATE_REPORT': 'Generated Attendance Report',
            'SEARCH_ATTENDANCE': 'Searched Attendance Records',
            'SWITCH_TAB': 'Switched Attendance Tab',
            'PERSONAL_INFO_ACCESS': 'Accessed Personal Information Page',
            'EDIT_STUDENT_INFO': 'Edited Student Information',
            'EDIT_FACULTY_INFO': 'Edited Faculty Information',
            'EDIT_STAFF_INFO': 'Edited Staff Information',
            'SEARCH_PERSONAL_INFO': 'Searched Personal Information',
            'ADD_FILE_STUDENT': 'Uploaded Student Data File',
            'ADD_FILE_FACULTY': 'Uploaded Faculty Data File',
            'ADD_FILE_STAFF': 'Uploaded Staff Data File',
            'ADD_STUDENT': 'Added New Student',
            'ADD_FACULTY': 'Added New Faculty Member',
            'ADD_STAFF': 'Added New Staff Member',
            'REGISTRATION_ACCESS': 'Accessed Registration Page',
            'SCANNER_ACCESS': 'Accessed QR Scanner Page',
            'USER_CREATE': 'User account created',
            'USER_UPDATE': 'User account updated',
            'USER_DELETE': 'User account deleted'
        };
        
        return actionMap[log.action] || log.description || '-';
    }

    function updateActivitiesPagination(currentPage, totalPages) {
        document.querySelector('.activities-page-info').textContent = `Page ${currentPage} of ${totalPages}`;
        const prevBtn = document.querySelector('.activities-prev-btn');
        const nextBtn = document.querySelector('.activities-next-btn');
        
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
        
        prevBtn.onclick = function() {
            if (currentPage > 1) {
                loadUserActivities(currentPage - 1);
            }
        };
        
        nextBtn.onclick = function() {
            if (currentPage < totalPages) {
                loadUserActivities(currentPage + 1);
            }
        };
    }
});
