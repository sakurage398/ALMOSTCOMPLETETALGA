
    document.addEventListener("DOMContentLoaded", function () {
        let currentData = [];
        const departmentsData = {
            "College of Engineering and Architecture": {
                programs: ["BS Electronics Engineering", "BS Electrical Engineering", "BS Mechanical Engineering"]
            },
            "College of Computer Studies": {
                programs: ["BS Information Technology", "BS Computer Science"]
            },
            "College of Accountancy and Business Program": {
                programs: ["BS Accountancy", "BS Business Administration"]
            },
            "College of Maritime Studies": {
                programs: ["BS Maritime Engineering", "BS Maritime Transportation"]
            },
            "College of Hospitality and Tourism Management": {
                programs: ["BS Hospitality Management", "BS Tourism Management"]
            },
            "College of Criminal Justice Education": {
                programs: ["BS Criminology"]
            },
            "College of Education and Journalism": {
                programs: ["Bachelor of Secondary Education", "Bachelor of Elementary Education"]
            }
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
            logAuditTrail('PERSONAL_INFO_ACCESS', 'Accessed faculty personal information page');
        }

        logPageAccess();

        const addFacultyBtn = document.getElementById("add-faculty-btn");
        const addFileBtn = document.getElementById("add-file-btn");
        const addUserModal = document.getElementById("add-user-modal");
        const closeModalBtn = document.querySelector(".close-btn");
        const cancelBtn = document.querySelector(".cancel-btn");
        const saveBtn = document.querySelector(".save-btn");
        addFacultyBtn.addEventListener("click", function() {
            logAuditTrail('ADD_FACULTY', 'Opened add faculty modal');
            addUserModal.style.display = "flex";
            resetForm();
            populateDepartmentDropdown();
        });

        addFileBtn.addEventListener("click", function() {
            logAuditTrail('ADD_FILE_FACULTY', 'Opened file upload modal');
            document.getElementById('file-upload-modal').style.display = "flex";
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
            if (event.target === document.getElementById('file-upload-modal')) {
                document.getElementById('file-upload-modal').style.display = "none";
                resetFileUpload();
            }
        });
        document.addEventListener("keydown", function(event) {
            if (event.key === "Escape") {
                addUserModal.style.display = "none";
                modal.style.display = "none";
                document.getElementById('file-upload-modal').style.display = "none";
                resetFileUpload();
            }
        });

        function populateDepartmentDropdown() {
            const facultyDepartment = document.getElementById("faculty-department");
            facultyDepartment.innerHTML = '<option value="" disabled selected>Select Department</option>';
            Object.keys(departmentsData).forEach(dept => {
                const option = document.createElement("option");
                option.value = dept;
                option.textContent = dept;
                facultyDepartment.appendChild(option);
            });
        }

        document.getElementById('faculty-department').addEventListener('change', function() {
            const selectedDept = this.value;
            const facultyProgram = document.getElementById("faculty-program");
            facultyProgram.innerHTML = '<option value="" disabled selected>Select Program</option>';
            
            if (departmentsData[selectedDept]) {
                departmentsData[selectedDept].programs.forEach(program => {
                    const option = document.createElement("option");
                    option.value = program;
                    option.textContent = program;
                    facultyProgram.appendChild(option);
                });
            }
        });

        document.getElementById('generate-pin-btn').addEventListener('click', function() {
            const pincode = Math.floor(100000 + Math.random() * 900000).toString();
            document.getElementById('faculty-pincode').value = pincode;
        });

        document.getElementById('faculty-picture').addEventListener('change', function(e) {
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
            const pictureInput = document.getElementById('faculty-picture');
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
                const facultyData = await collectFormData();
                
                if (!validateForm(facultyData)) {
                    return;
                }

                await saveFacultyData(facultyData);
            } catch (error) {
                console.error('Error in save process:', error);
                showBootstrapAlert('Error processing form data. Please try again.', 'danger');
            }
        });

        function collectFormData() {
            const facultyNumber = document.getElementById("faculty-number").value.trim();
            const name = document.getElementById("faculty-name").value.trim();
            const department = document.getElementById("faculty-department").value;
            const program = document.getElementById("faculty-program").value;
            const pincode = document.getElementById("faculty-pincode").value.trim();
            
            const facultyData = {
                faculty_number: facultyNumber,
                name: name,
                department: department,
                program: program,
                pincode: pincode || null,
                registration_status: "Unregistered"
            };
            
            return facultyData;
        }

        function validateForm(facultyData) {
            if (!facultyData.faculty_number) {
                showBootstrapAlert('Please enter a faculty number.', 'warning');
                document.getElementById("faculty-number").focus();
                return false;
            }
            
            if (!facultyData.name) {
                showBootstrapAlert('Please enter a name.', 'warning');
                document.getElementById("faculty-name").focus();
                return false;
            }
            
            if (!facultyData.department) {
                showBootstrapAlert('Please select a department.', 'warning');
                document.getElementById("faculty-department").focus();
                return false;
            }
            
            if (!facultyData.program) {
                showBootstrapAlert('Please select a program.', 'warning');
                document.getElementById("faculty-program").focus();
                return false;
            }
            
            if (facultyData.pincode && !/^\d{6}$/.test(facultyData.pincode)) {
                showBootstrapAlert('Pincode must be exactly 6 digits.', 'warning');
                document.getElementById("faculty-pincode").focus();
                return false;
            }
            
            return true;
        }

        async function saveFacultyData(facultyData) {
            try {
                const isEdit = saveBtn.dataset.facultyId;
                const url = 'PHP/admin-faculty_perinfo.php';
                
                const formData = new FormData();
                formData.append('action', isEdit ? 'update_faculty' : 'add_faculty');
                formData.append('faculty_number', facultyData.faculty_number);
                formData.append('name', facultyData.name);
                formData.append('department', facultyData.department);
                formData.append('program', facultyData.program);
                formData.append('pincode', facultyData.pincode || '');
                formData.append('registration_status', facultyData.registration_status);
                
                if (isEdit) {
                    formData.append('faculty_id', saveBtn.dataset.facultyId);
                }
                const pictureInput = document.getElementById("faculty-picture");
                if (pictureInput.files.length > 0) {
                    formData.append('picture', pictureInput.files[0]);
                }

                const response = await fetch(url, {
                    method: 'POST',
                    body: formData
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
                    showBootstrapAlert(isEdit ? 'Faculty updated successfully!' : 'Faculty added successfully!', 'success');
                    addUserModal.style.display = "none";
                    resetForm();
                    loadFacultyData();
                } else {
                    showBootstrapAlert('Error: ' + (data.message || 'Operation failed'), 'danger');
                }
            } catch (error) {
                console.error('Error saving faculty:', error);
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
            document.getElementById("faculty-number").value = "";
            document.getElementById("faculty-name").value = "";
            document.getElementById("faculty-department").selectedIndex = 0;
            document.getElementById("faculty-program").innerHTML = '<option value="" disabled selected>Select Program</option>';
            document.getElementById("faculty-pincode").value = "";
            document.getElementById("faculty-picture").value = "";
            
            const preview = document.getElementById('picture-preview');
            const placeholder = document.getElementById('picture-placeholder');
            const removePictureBtn = document.getElementById('remove-picture-btn');
            
            const img = preview.querySelector('img');
            if (img) img.remove();
            
            placeholder.style.display = 'block';
            removePictureBtn.style.display = 'none';
            
            delete saveBtn.dataset.facultyId;
        }

        async function loadFacultyData() {
            try {
                const formData = new FormData();
                formData.append('action', 'get_faculty');
                
                const response = await fetch('PHP/admin-faculty_perinfo.php', {
                    method: 'POST',
                    body: formData
                });
                
                const text = await response.text();
                let data;
                
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('JSON parse error:', text);
                    displayFacultyData([]);
                    return;
                }
                
                if (data.status === 'success') {
                    currentData = data.data || [];
                    displayFacultyData(currentData);
                    populateFilters();
                } else {
                    console.error('Error loading faculty data:', data.message);
                    displayFacultyData([]);
                }
            } catch (error) {
                console.error('Error fetching faculty data:', error);
                displayFacultyData([]);
            }
        }

        function displayFacultyData(facultyData) {
            const tbody = document.getElementById("faculty-table-body");
            tbody.innerHTML = '';
            
            if (facultyData.length === 0) {
                tbody.innerHTML = `<tr class="empty-message"><td colspan="8" class="text-center">No faculty records found</td></tr>`;
                return;
            }
            
            facultyData.forEach(faculty => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${faculty.faculty_number || ''}</td>
                    <td>
                        ${faculty.picture ? 
                            `<img src="${faculty.picture}" alt="Profile" class="profile-pic">` : 
                            `<div class="no-picture"><i class="fa-solid fa-user"></i></div>`
                        }
                    </td>
                    <td>${faculty.pincode || 'Not set'}</td>
                    <td>${faculty.name || ''}</td>
                    <td>${faculty.department || ''}</td>
                    <td>${faculty.program || ''}</td>
                    <td>
                        <span class="badge ${faculty.registration_status === 'Registered' ? 'bg-success' : 'bg-danger'}">
                            ${faculty.registration_status || 'Unregistered'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${faculty.id}">
                            <i class="fa-solid fa-edit"></i> Edit
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            setupEditButtons();
        }

        function populateFilters() {
            const departmentFilter = document.getElementById('department-filter');
            const programFilter = document.getElementById('program-filter');
            
            
            departmentFilter.innerHTML = '<option value="">All Departments</option>';
            Object.keys(departmentsData).forEach(dept => {
                const option = document.createElement("option");
                option.value = dept;
                option.textContent = dept;
                departmentFilter.appendChild(option);
            });
            
           
            const allPrograms = new Set();
            Object.values(departmentsData).forEach(dept => {
                dept.programs.forEach(program => {
                    allPrograms.add(program);
                });
            });
            
            programFilter.innerHTML = '<option value="">All Programs</option>';
            Array.from(allPrograms).sort().forEach(program => {
                const option = document.createElement("option");
                option.value = program;
                option.textContent = program;
                programFilter.appendChild(option);
            });
        }

        function setupEditButtons() {
            const editButtons = document.querySelectorAll('.edit-btn');
            editButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const facultyId = this.dataset.id;
                    const faculty = currentData.find(f => f.id == facultyId);
                    
                    if (faculty) {
                        openEditModal(faculty);
                    }
                });
            });
        }

        function openEditModal(faculty) {
            document.querySelector(".form-title").innerHTML = '<i class="fa-solid fa-edit"></i> Edit Faculty Information';
            addUserModal.style.display = "flex";
            
            document.getElementById("faculty-number").value = faculty.faculty_number || '';
            document.getElementById("faculty-name").value = faculty.name || '';
            document.getElementById("faculty-pincode").value = faculty.pincode || '';
            document.getElementById("faculty-registration").textContent = faculty.registration_status || 'Unregistered';
            
            populateDepartmentDropdown();
            setTimeout(() => {
                document.getElementById("faculty-department").value = faculty.department || '';
                
                const event = new Event('change');
                document.getElementById("faculty-department").dispatchEvent(event);
                
                setTimeout(() => {
                    document.getElementById("faculty-program").value = faculty.program || '';
                }, 100);
            }, 100);
            
            const preview = document.getElementById('picture-preview');
            const placeholder = document.getElementById('picture-placeholder');
            const removePictureBtn = document.getElementById('remove-picture-btn');
            
            const existingImg = preview.querySelector('img');
            if (existingImg) existingImg.remove();
            
            if (faculty.picture) {
                const img = document.createElement('img');
                img.src = faculty.picture;
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
            
            saveBtn.dataset.facultyId = faculty.id;
        }

        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                const tabName = this.textContent.trim();
                logAuditTrail('SWITCH_TAB', `Switched to ${tabName} personal information tab`);
            });
        });

        const searchBox = document.querySelector('input[placeholder="Search faculty..."]');
        if (searchBox) {
            searchBox.addEventListener("input", function() {
                clearTimeout(this.searchTimer);
                this.searchTimer = setTimeout(function() {
                    if (searchBox.value.length > 0) {
                        logAuditTrail('SEARCH_PERSONAL_INFO', `Searched personal information: ${searchBox.value}`);
                    }
                    filterTable();
                }, 300);
            });
        }

        function filterTable() {
            const searchTerm = searchBox.value.toLowerCase();
            const departmentFilter = document.getElementById('department-filter').value;
            const programFilter = document.getElementById('program-filter').value;
            const registrationFilter = document.getElementById('registration-filter').value;

            const filteredData = currentData.filter(faculty => {
                const matchesSearch = !searchTerm || 
                    (faculty.faculty_number && faculty.faculty_number.toLowerCase().includes(searchTerm)) ||
                    (faculty.name && faculty.name.toLowerCase().includes(searchTerm)) ||
                    (faculty.department && faculty.department.toLowerCase().includes(searchTerm)) ||
                    (faculty.program && faculty.program.toLowerCase().includes(searchTerm));
                const matchesDepartment = !departmentFilter || 
                    (faculty.department === departmentFilter);
                const matchesProgram = !programFilter || 
                    (faculty.program === programFilter);
                const matchesRegistration = !registrationFilter || 
                    (faculty.registration_status === registrationFilter);

                return matchesSearch && matchesDepartment && matchesProgram && matchesRegistration;
            });
            
            displayFacultyData(filteredData);
        }

        const filterSelects = document.querySelectorAll('.form-select');
        filterSelects.forEach(select => {
            select.addEventListener('change', filterTable);
        });
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('faculty-file');
        const uploadPreview = document.getElementById('upload-preview');
        const previewTable = document.getElementById('preview-table');
        const uploadBtn = document.getElementById('upload-btn');
        const closeUploadBtn = document.querySelector('.close-upload-btn');
        const cancelUploadBtn = document.querySelector('.cancel-upload-btn');

        fileUploadArea.addEventListener('click', () => fileInput.click());
        
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.style.backgroundColor = '#e9ecef';
        });
        
        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.style.backgroundColor = '';
        });
        
        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.style.backgroundColor = '';
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

        closeUploadBtn.addEventListener('click', () => {
            document.getElementById('file-upload-modal').style.display = 'none';
            resetFileUpload();
        });

        cancelUploadBtn.addEventListener('click', () => {
            document.getElementById('file-upload-modal').style.display = 'none';
            resetFileUpload();
        });

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
                
                const requiredColumns = ['Faculty Number', 'Name', 'Department', 'Program'];
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
                uploadBtn.disabled = false;
                uploadBtn.fileData = csvText;
            } catch (error) {
                showBootstrapAlert('Error parsing CSV file: ' + error.message, 'danger');
            }
        }

        function displayPreview(headers, data) {
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
            uploadPreview.style.display = 'block';
        }

        function resetFileUpload() {
            fileInput.value = '';
            uploadPreview.style.display = 'none';
            uploadBtn.disabled = true;
            delete uploadBtn.fileData;
        }

        uploadBtn.addEventListener('click', function() {
            const uploadBtn = document.getElementById('upload-btn');
            if (!uploadBtn.fileData) return;
            
            const formData = new FormData();
            formData.append('action', 'bulk_upload');
            formData.append('file_type', 'csv');
            formData.append('file_data', uploadBtn.fileData);
            formData.append('filename', 'faculty_upload.csv');
            
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
            
            fetch('PHP/admin-faculty_perinfo.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showBootstrapAlert(`Successfully uploaded ${data.processed} faculty records`, 'success');
                    document.getElementById('file-upload-modal').style.display = 'none';
                    resetFileUpload();
                    loadFacultyData();
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
                uploadBtn.innerHTML = 'Upload File';
            });
        });

        loadFacultyData();
    });
