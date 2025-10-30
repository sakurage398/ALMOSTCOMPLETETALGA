
    document.addEventListener("DOMContentLoaded", function () {
        let currentData = [];
        const departmentsData = {
            "Library": { roles: ["Librarian", "Assistant Librarian"] },
            "Registrar": { roles: ["Registrar", "Assistant Registrar"] },
            "Accounting": { 
    roles: ["Chief Accountant", "Senior Accountant", "Accountant", "Accounting Assistant", "Bookkeeper", "Payroll Officer", "Budget Officer"] 
},
            "Guidance": { 
    roles: ["Guidance Counselor", "Senior Counselor", "Student Counselor", "Career Advisor", "Psychological Counselor", "Guidance Coordinator"] 
},
            "Maintenance": { 
    roles: ["Maintenance Supervisor", "Head Janitor", "Janitor", "Groundskeeper", "Electrician", "Plumber", "Carpenter", "Maintenance Technician"] 
},
        };

        const adminMenu = document.querySelector(".admin-menu");
        const dropdown = document.querySelector(".dropdown");
        const logoutBtn = document.querySelector(".logout-btn");
        const modal = document.getElementById("logout-modal");
        const yesBtn = document.querySelector(".yes-btn");
        const noBtn = document.querySelector(".no-btn");

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
            }).catch(error => {
                console.error('Error logging audit trail:', error);
            });
        }

        function logPageAccess() {
            logAuditTrail('PERSONAL_INFO_ACCESS', 'Accessed staff personal information page');
        }

        logPageAccess();

        const addStaffBtn = document.getElementById("add-staff-btn");
        const addFileBtn = document.getElementById("add-file-btn");
        const addUserModal = document.getElementById("add-user-modal");
        const closeModalBtn = document.querySelector(".close-btn");
        const cancelBtn = document.querySelector(".cancel-btn");
        const saveBtn = document.querySelector(".save-btn");
        addStaffBtn.addEventListener("click", function() {
            logAuditTrail('ADD_STAFF', 'Opened add staff modal');
            addUserModal.style.display = "flex";
            resetForm();
            populateDepartmentDropdown();
        });

        addFileBtn.addEventListener("click", function() {
            logAuditTrail('ADD_FILE_STAFF', 'Opened file upload modal');
            showFileUploadModal();
        });
        closeModalBtn.addEventListener("click", function() {
            addUserModal.style.display = "none";
        });

        cancelBtn.addEventListener("click", function() {
            addUserModal.style.display = "none";
        });
        window.addEventListener("click", function(event) {
            if (event.target === addUserModal) {
                addUserModal.style.display = "none";
            }
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
        document.addEventListener("keydown", function(event) {
            if (event.key === "Escape") {
                addUserModal.style.display = "none";
                modal.style.display = "none";
            }
        });

        function populateDepartmentDropdown() {
            const staffDepartment = document.getElementById("staff-department");
            staffDepartment.innerHTML = '<option value="" disabled selected>Select Department</option>';
            Object.keys(departmentsData).forEach(dept => {
                const option = document.createElement("option");
                option.value = dept;
                option.textContent = dept;
                staffDepartment.appendChild(option);
            });
        }

        document.getElementById('staff-department').addEventListener('change', function() {
            const selectedDept = this.value;
            const staffRole = document.getElementById("staff-role");
            staffRole.innerHTML = '<option value="" disabled selected>Select Role</option>';
            
            if (departmentsData[selectedDept]) {
                departmentsData[selectedDept].roles.forEach(role => {
                    const option = document.createElement("option");
                    option.value = role;
                    option.textContent = role;
                    staffRole.appendChild(option);
                });
            }
        });

        document.getElementById('generate-pin-btn').addEventListener('click', function() {
            const pincode = Math.floor(100000 + Math.random() * 900000).toString();
            document.getElementById('staff-pincode').value = pincode;
        });

        document.getElementById('staff-picture').addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('picture-preview');
            const placeholder = document.getElementById('picture-placeholder');
            const removePictureBtn = document.getElementById('remove-picture-btn');
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    placeholder.style.display = 'none';
                    
                    let img = preview.querySelector('img');
                    if (!img) {
                        img = document.createElement('img');
                        preview.appendChild(img);
                    }
                    img.src = e.target.result;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '50%';
                    
                    removePictureBtn.style.display = 'inline-block';
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('remove-picture-btn').addEventListener('click', function() {
            const pictureInput = document.getElementById('staff-picture');
            const preview = document.getElementById('picture-preview');
            const placeholder = document.getElementById('picture-placeholder');
            const removePictureBtn = document.getElementById('remove-picture-btn');
            
            pictureInput.value = '';
            
            const img = preview.querySelector('img');
            if (img) img.remove();
            
            placeholder.style.display = 'block';
            removePictureBtn.style.display = 'none';
        });

        saveBtn.addEventListener("click", async function() {
            try {
                const staffData = await collectFormData();
                
                if (!validateForm(staffData)) {
                    return;
                }

                await saveStaffData(staffData);
            } catch (error) {
                console.error('Error in save process:', error);
                showBootstrapAlert('Error processing form data. Please try again.', 'danger');
            }
        });

        

        function collectFormData() {
            return new Promise((resolve) => {
                const staffNumber = document.getElementById("staff-number").value.trim();
                const name = document.getElementById("staff-name").value.trim();
                const department = document.getElementById("staff-department").value;
                const role = document.getElementById("staff-role").value;
                const pincode = document.getElementById("staff-pincode").value.trim();
                const pictureInput = document.getElementById("staff-picture");
                
                const staffData = {
                    staff_number: staffNumber,
                    name: name,
                    department: department,
                    role: role,
                    pincode: pincode || null,
                    registration_status: "Unregistered"
                };
                
                if (pictureInput.files.length > 0) {
                    const file = pictureInput.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        staffData.picture = e.target.result;
                        resolve(staffData);
                    };
                    
                    reader.onerror = function() {
                        resolve(staffData);
                    };
                    
                    reader.readAsDataURL(file);
                } else {
                    resolve(staffData);
                }
            });
        }

        function validateForm(staffData) {
            if (!staffData.staff_number) {
                showBootstrapAlert('Please enter a staff number.', 'warning');
                document.getElementById("staff-number").focus();
                return false;
            }
            
            if (!staffData.name) {
                showBootstrapAlert('Please enter a name.', 'warning');
                document.getElementById("staff-name").focus();
                return false;
            }
            
            if (!staffData.department) {
                showBootstrapAlert('Please select a department.', 'warning');
                document.getElementById("staff-department").focus();
                return false;
            }
            
            if (!staffData.role) {
                showBootstrapAlert('Please select a role.', 'warning');
                document.getElementById("staff-role").focus();
                return false;
            }
            
            if (staffData.pincode && !/^\d{6}$/.test(staffData.pincode)) {
                showBootstrapAlert('Pincode must be exactly 6 digits.', 'warning');
                document.getElementById("staff-pincode").focus();
                return false;
            }
            
            return true;
        }

        async function saveStaffData(staffData) {
            try {
                const isEdit = saveBtn.dataset.staffId;
                const url = 'PHP/admin-staff_perinfo.php';
                const method = isEdit ? 'PUT' : 'POST';
                
                if (isEdit) {
                    staffData.id = saveBtn.dataset.staffId;
                }

                const response = await fetch(url, {
                    method: method,
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(staffData)
                });

                const text = await response.text();
                let data;
                
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('JSON parse error:', text);
                    throw new Error('Server returned invalid response');
                }

                if (data.status === 'success') {
                    showBootstrapAlert(isEdit ? 'Staff updated successfully!' : 'Staff added successfully!', 'success');
                    addUserModal.style.display = "none";
                    resetForm();
                    loadStaffData();
                } else {
                    showBootstrapAlert('Error: ' + (data.message || 'Operation failed'), 'danger');
                }
            } catch (error) {
                console.error('Error saving staff:', error);
                showBootstrapAlert('Error connecting to server. Please try again.', 'danger');
            }
        }

        function showBootstrapAlert(message, type) {
            const alertClass = `alert alert-${type} alert-dismissible fade show`;
            const alertHTML = `
                <div class="${alertClass}" role="alert" style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 300px; text-align: center;">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', alertHTML);
            
            setTimeout(() => {
                const alert = document.querySelector('.alert');
                if (alert) {
                    alert.remove();
                }
            }, 5000);
        }

        function resetForm() {
            document.getElementById("staff-number").value = "";
            document.getElementById("staff-name").value = "";
            document.getElementById("staff-department").selectedIndex = 0;
            document.getElementById("staff-role").innerHTML = '<option value="" disabled selected>Select Role</option>';
            document.getElementById("staff-pincode").value = "";
            document.getElementById("staff-picture").value = "";
            
            const preview = document.getElementById('picture-preview');
            const placeholder = document.getElementById('picture-placeholder');
            const removePictureBtn = document.getElementById('remove-picture-btn');
            
            const img = preview.querySelector('img');
            if (img) img.remove();
            
            placeholder.style.display = 'block';
            removePictureBtn.style.display = 'none';
            
            delete saveBtn.dataset.staffId;
        }

        async function loadStaffData() {
            try {
                const response = await fetch('PHP/admin-staff_perinfo.php');
                const text = await response.text();
                let data;
                
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('JSON parse error:', text);
                    displayStaffData([]);
                    return;
                }
                
                if (data.status === 'success') {
                    currentData = data.data || [];
                    displayStaffData(currentData);
                    populateRoleFilter(); // Add this line
                } else {
                    console.error('Error loading staff data:', data.message);
                    displayStaffData([]);
                }
            } catch (error) {
                console.error('Error fetching staff data:', error);
                displayStaffData([]);
            }
        }

       function displayStaffData(staffData) {
            const tbody = document.getElementById("staff-table-body"); // Use the correct ID
            tbody.innerHTML = '';
            
            if (staffData.length === 0) {
                tbody.innerHTML = `<tr class="empty-message"><td colspan="8" class="text-center">No staff records found</td></tr>`;
                return;
            }
            
            staffData.forEach(staff => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${staff.staff_number || ''}</td>
                    <td>
                        ${staff.picture ? 
                            `<img src="${staff.picture}" alt="Profile" class="profile-pic">` : 
                            `<div class="no-picture"><i class="fa-solid fa-user"></i></div>`
                        }
                    </td>
                    <td>${staff.pin_code || staff.pincode || 'Not set'}</td>
                    <td>${staff.name || ''}</td>
                    <td>${staff.department || ''}</td>
                    <td>${staff.role || ''}</td>
                    <td>
                        <span class="badge ${staff.registration_status === 'Registered' ? 'bg-success' : 'bg-danger'}">
                            ${staff.registration_status || 'Unregistered'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${staff.id}">
                            <i class="fa-solid fa-edit"></i> Edit
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            setupEditButtons();
        }

        function setupEditButtons() {
            const editButtons = document.querySelectorAll('.edit-btn');
            editButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const staffId = this.dataset.id;
                    const staff = currentData.find(s => s.id == staffId);
                    
                    if (staff) {
                        openEditModal(staff);
                    }
                });
            });
        }

        function openEditModal(staff) {
            document.querySelector(".form-title").innerHTML = '<i class="fa-solid fa-edit"></i> Edit Staff Information';
            addUserModal.style.display = "flex";
            
            document.getElementById("staff-number").value = staff.staff_number || '';
            document.getElementById("staff-name").value = staff.name || '';
            document.getElementById("staff-pincode").value = staff.pincode || '';
            
            populateDepartmentDropdown();
            setTimeout(() => {
                document.getElementById("staff-department").value = staff.department || '';
                
                const event = new Event('change');
                document.getElementById("staff-department").dispatchEvent(event);
                
                setTimeout(() => {
                    document.getElementById("staff-role").value = staff.role || '';
                }, 100);
            }, 100);
            
            const preview = document.getElementById('picture-preview');
            const placeholder = document.getElementById('picture-placeholder');
            const removePictureBtn = document.getElementById('remove-picture-btn');
            
            const existingImg = preview.querySelector('img');
            if (existingImg) existingImg.remove();
            
            if (staff.picture) {
                const img = document.createElement('img');
                img.src = staff.picture;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '50%';
                preview.appendChild(img);
                placeholder.style.display = 'none';
                removePictureBtn.style.display = 'inline-block';
            } else {
                placeholder.style.display = 'block';
                removePictureBtn.style.display = 'none';
            }
            
            saveBtn.dataset.staffId = staff.id;
        }

        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                const tabName = this.textContent.trim();
                logAuditTrail('SWITCH_TAB', `Switched to ${tabName} personal information tab`);
            });
        });

        const searchBox = document.querySelector('input[placeholder="Search staff..."]');
        if (searchBox) {
            searchBox.addEventListener("input", function() {
                clearTimeout(this.searchTimer);
                this.searchTimer = setTimeout(() => {
                    if (searchBox.value.length > 0) {
                        logAuditTrail('SEARCH_PERSONAL_INFO', `Searched personal information: ${searchBox.value}`);
                    }
                    filterTable();
                }, 300); 
            });
        }

        function populateRoleFilter() {
            const roleSelect = document.querySelector('th:nth-child(6) .form-select');
            const uniqueRoles = [...new Set(currentData.map(staff => staff.role).filter(role => role))];
            
            roleSelect.innerHTML = '<option value="">All Roles</option>';
            uniqueRoles.forEach(role => {
                const option = document.createElement("option");
                option.value = role;
                option.textContent = role;
                roleSelect.appendChild(option);
            });
        }

        function filterTable() {
            const searchTerm = searchBox.value.toLowerCase();
            const departmentFilter = document.querySelector('th:nth-child(5) .form-select').value;
            const roleFilter = document.querySelector('th:nth-child(6) .form-select').value;
            const registrationFilter = document.querySelector('th:nth-child(7) .form-select').value;

            const filteredData = currentData.filter(staff => {
                const matchesSearch = !searchTerm || 
                    (staff.staff_number && staff.staff_number.toLowerCase().includes(searchTerm)) ||
                    (staff.name && staff.name.toLowerCase().includes(searchTerm)) ||
                    (staff.department && staff.department.toLowerCase().includes(searchTerm)) ||
                    (staff.role && staff.role.toLowerCase().includes(searchTerm));
                const matchesDepartment = !departmentFilter || 
                    (staff.department === departmentFilter);
                const matchesRole = !roleFilter || 
                    (staff.role === roleFilter);
                const matchesRegistration = !registrationFilter || 
                    (staff.registration_status === registrationFilter);

                return matchesSearch && matchesDepartment && matchesRole && matchesRegistration;
            });
            
            displayStaffData(filteredData);
        }

        const filterSelects = document.querySelectorAll('.form-select');
            filterSelects.forEach(select => {
                select.addEventListener('change', function() {
                    filterTable();
                });
            });

        function showFileUploadModal() {
            const modalHTML = `
                <div class="modal fade" id="fileUploadModal" tabindex="-1" aria-labelledby="fileUploadModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="fileUploadModalLabel">
                                    <i class="fa-solid fa-file-import"></i> Upload Staff CSV File
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3">
                                    <h6>File Requirements:</h6>
                                    <ul class="small">
                                        <li>File format: CSV only</li>
                                        <li>Required columns: Staff Number, Name, Department, Role</li>
                                        <li>Optional columns: Pincode (6 digits)</li>
                                        <li>Maximum file size: 5MB</li>
                                        <li>First row should contain column headers</li>
                                    </ul>
                                </div>
                                
                                <div class="border rounded p-4 text-center" id="fileDropArea" style="cursor: pointer; border-style: dashed !important;">
                                    <i class="fa-solid fa-cloud-upload-alt fa-2x text-muted mb-2"></i>
                                    <div>Click to upload or drag and drop CSV file</div>
                                    <div class="small text-muted">CSV files only</div>
                                    <input type="file" id="csvFileInput" accept=".csv" class="d-none">
                                </div>
                                
                                <div class="mt-3" id="filePreview" style="display: none;">
                                    <h6>File Preview (First 5 rows):</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm table-bordered" id="previewTable"></table>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="uploadCsvBtn" disabled>
                                    <i class="fa-solid fa-upload"></i> Upload File
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            if (!document.getElementById('fileUploadModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            const fileUploadModal = new bootstrap.Modal(document.getElementById('fileUploadModal'));
            fileUploadModal.show();
            
            setupFileUploadHandlers();
        }

        function setupFileUploadHandlers() {
            const fileDropArea = document.getElementById('fileDropArea');
            const fileInput = document.getElementById('csvFileInput');
            const uploadBtn = document.getElementById('uploadCsvBtn');
            
            if (!fileDropArea || !fileInput || !uploadBtn) return;
            
            fileDropArea.addEventListener('click', () => fileInput.click());
            
            fileDropArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileDropArea.style.backgroundColor = '#e9ecef';
            });
            
            fileDropArea.addEventListener('dragleave', () => {
                fileDropArea.style.backgroundColor = '';
            });
            
            fileDropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileDropArea.style.backgroundColor = '';
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFileSelection(files[0]);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleFileSelection(e.target.files[0]);
                }
            });
            
            uploadBtn.addEventListener('click', uploadCSVFile);
        }

        function handleFileSelection(file) {
            if (!file.name.toLowerCase().endsWith('.csv')) {
                showBootstrapAlert('Please select a CSV file only.', 'warning');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showBootstrapAlert('File size must be less than 5MB.', 'warning');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                parseCSV(e.target.result);
            };
            reader.readAsText(file);
        }

        function parseCSV(csvText) {
            try {
                const rows = csvText.split('\n').filter(row => row.trim() !== '');
                if (rows.length === 0) {
                    showBootstrapAlert('CSV file is empty', 'warning');
                    return;
                }
                
                const headers = rows[0].split(',').map(header => header.trim());
                
                const requiredColumns = ['Staff Number', 'Name', 'Department', 'Role'];
                const missingColumns = requiredColumns.filter(col => !headers.includes(col));
                
                if (missingColumns.length > 0) {
                    showBootstrapAlert(`Missing required columns: ${missingColumns.join(', ')}`, 'warning');
                    return;
                }
                
                const data = rows.slice(1, 6).map(row => {
                    const values = row.split(',').map(value => value.trim());
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index] || '';
                    });
                    return obj;
                });
                
                displayPreview(headers, data);
                document.getElementById('uploadCsvBtn').disabled = false;
                document.getElementById('uploadCsvBtn').fileData = csvText;
            } catch (error) {
                showBootstrapAlert('Error parsing CSV file: ' + error.message, 'danger');
            }
        }

        function displayPreview(headers, data) {
            const previewTable = document.getElementById('previewTable');
            let tableHTML = `<thead><tr>`;
            headers.forEach(header => {
                tableHTML += `<th>${header}</th>`;
            });
            tableHTML += `</tr></thead><tbody>`;
            
            data.forEach(row => {
                tableHTML += `<tr>`;
                headers.forEach(header => {
                    tableHTML += `<td>${row[header] || ''}</td>`;
                });
                tableHTML += `</tr>`;
            });
            
            tableHTML += `</tbody>`;
            previewTable.innerHTML = tableHTML;
            document.getElementById('filePreview').style.display = 'block';
        }

        function uploadCSVFile() {
            const uploadBtn = document.getElementById('uploadCsvBtn');
            if (!uploadBtn.fileData) return;
            
            const formData = new FormData();
            formData.append('action', 'bulk_upload');
            formData.append('file_type', 'csv');
            formData.append('file_data', uploadBtn.fileData);
            formData.append('filename', 'staff_upload.csv');
            
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
            
            fetch('PHP/admin-staff_perinfo.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showBootstrapAlert(`Successfully uploaded ${data.processed} staff records`, 'success');
                    bootstrap.Modal.getInstance(document.getElementById('fileUploadModal')).hide();
                    loadStaffData();
                } else {
                    showBootstrapAlert('Error: ' + data.message, 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showBootstrapAlert('Error uploading file. Please try again.', 'danger');
            })
            .finally(() => {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload File';
            });
        }

        loadStaffData();
    });
