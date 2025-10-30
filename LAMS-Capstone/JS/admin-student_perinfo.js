
    document.addEventListener("DOMContentLoaded", function () {
        let currentData = [];
        const departmentsData = {
            "College of Engineering and Architecture": {
                programs: ["BS Electronics Engineering", "BS Electrical Engineering", "BS Mechanical Engineering", "BS Civil Engineering", "BS Computer Engineering"]
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
            logAuditTrail('PERSONAL_INFO_ACCESS', 'Accessed student personal information page');
        }

        logPageAccess();

        const addStudentBtn = document.getElementById("add-student-btn");
        const addFileBtn = document.getElementById("add-file-btn");
        const addUserModal = document.getElementById("add-user-modal");
        const closeModalBtn = document.querySelector(".close-btn");
        const cancelBtn = document.querySelector(".cancel-btn");
        const saveBtn = document.querySelector(".save-btn");
        addStudentBtn.addEventListener("click", function() {
            logAuditTrail('ADD_STUDENT', 'Opened add student modal');
            addUserModal.style.display = "flex";
            resetForm();
            populateDepartmentDropdown();
        });

        addFileBtn.addEventListener("click", function() {
            logAuditTrail('ADD_FILE_STUDENT', 'Opened file upload modal');
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
            const studentDepartment = document.getElementById("student-department");
            studentDepartment.innerHTML = '<option value="" disabled selected>Select Department</option>';
            Object.keys(departmentsData).forEach(dept => {
                const option = document.createElement("option");
                option.value = dept;
                option.textContent = dept;
                studentDepartment.appendChild(option);
            });
        }

        document.getElementById('student-department').addEventListener('change', function() {
            const selectedDept = this.value;
            const studentProgram = document.getElementById("student-program");
            studentProgram.innerHTML = '<option value="" disabled selected>Select Program</option>';
            if (selectedDept && departmentsData[selectedDept]) {
                departmentsData[selectedDept].programs.forEach(program => {
                    const option = document.createElement("option");
                    option.value = program;
                    option.textContent = program;
                    studentProgram.appendChild(option);
                });
            }
            populateYearDropdown();
            populateBlockDropdown();
        });

        function populateYearDropdown() {
            const studentYear = document.getElementById("student-year");
            studentYear.innerHTML = '<option value="" disabled selected>Select Year</option>';
            for (let i = 1; i <= 4; i++) {
                const option = document.createElement("option");
                const suffix = getOrdinalSuffix(i);
                option.value = `${i}${suffix} Year`;
                option.textContent = `${i}${suffix} Year`;
                studentYear.appendChild(option);
            }
        }

        function populateBlockDropdown() {
            const studentBlock = document.getElementById("student-block");
            studentBlock.innerHTML = '<option value="" disabled selected>Select Block</option>';
            for (let i = 1; i <= 15; i++) {
                const option = document.createElement("option");
                option.value = `Block ${i}`;
                option.textContent = `Block ${i}`;
                studentBlock.appendChild(option);
            }
        }

        function getOrdinalSuffix(num) {
            if (num === 1) return "st";
            if (num === 2) return "nd";
            if (num === 3) return "rd";
            return "th";
        }

        document.getElementById('generate-pin-btn').addEventListener('click', function() {
            const pincode = Math.floor(100000 + Math.random() * 900000).toString();
            document.getElementById('student-pincode').value = pincode;
        });

        document.getElementById('student-picture').addEventListener('change', function(e) {
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
            const pictureInput = document.getElementById('student-picture');
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
                const studentData = await collectFormData();
                
                if (!validateForm(studentData)) {
                    return;
                }

                await saveStudentData(studentData);
            } catch (error) {
                console.error('Error in save process:', error);
                showBootstrapAlert('Error processing form data. Please try again.', 'danger');
            }
        });

        function collectFormData() {
            return new Promise((resolve) => {
                const studentNumber = document.getElementById("student-number").value.trim();
                const name = document.getElementById("student-name").value.trim();
                const department = document.getElementById("student-department").value;
                const program = document.getElementById("student-program").value;
                const year = document.getElementById("student-year").value;
                const block = document.getElementById("student-block").value;
                const pincode = document.getElementById("student-pincode").value.trim();
                const pictureInput = document.getElementById("student-picture");
                
                const studentData = {
                    student_number: studentNumber,
                    name: name,
                    department: department,
                    program: program,
                    year: year,
                    block: block,
                    pincode: pincode || null,
                    registration_status: "Unregistered"
                };
                
                if (pictureInput.files.length > 0) {
                    const file = pictureInput.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        studentData.picture = e.target.result;
                        resolve(studentData);
                    };
                    
                    reader.onerror = function() {
                        resolve(studentData);
                    };
                    
                    reader.readAsDataURL(file);
                } else {
                    resolve(studentData);
                }
            });
        }

        function validateForm(studentData) {
            if (!studentData.student_number) {
                showBootstrapAlert('Please enter a student number.', 'warning');
                document.getElementById("student-number").focus();
                return false;
            }
            
            if (!studentData.name) {
                showBootstrapAlert('Please enter a name.', 'warning');
                document.getElementById("student-name").focus();
                return false;
            }
            
            if (!studentData.department) {
                showBootstrapAlert('Please select a department.', 'warning');
                document.getElementById("student-department").focus();
                return false;
            }
            
            if (!studentData.program) {
                showBootstrapAlert('Please select a program.', 'warning');
                document.getElementById("student-program").focus();
                return false;
            }
            
            if (!studentData.year) {
                showBootstrapAlert('Please select a year.', 'warning');
                document.getElementById("student-year").focus();
                return false;
            }
            
            if (!studentData.block) {
                showBootstrapAlert('Please select a block.', 'warning');
                document.getElementById("student-block").focus();
                return false;
            }
            
            if (studentData.pincode && !/^\d{6}$/.test(studentData.pincode)) {
                showBootstrapAlert('Pincode must be exactly 6 digits.', 'warning');
                document.getElementById("student-pincode").focus();
                return false;
            }
            
            return true;
        }

        async function saveStudentData(studentData) {
            try {
                const isEdit = saveBtn.dataset.studentId;
                const url = 'PHP/admin-student_perinfo.php';
                
                const formData = new FormData();
                formData.append('action', isEdit ? 'edit' : 'add');
                formData.append('student_number', studentData.student_number);
                formData.append('student_name', studentData.name);
                formData.append('department', studentData.department);
                formData.append('program', studentData.program);
                formData.append('year', studentData.year); // Changed from 'year_level' to 'year'
                formData.append('block', studentData.block);
                formData.append('pin_code', studentData.pincode || '');
                formData.append('registration_status', studentData.registration_status);
                
                if (isEdit) {
                    formData.append('id', saveBtn.dataset.studentId);
                }
                const pictureInput = document.getElementById("student-picture");
                if (pictureInput.files.length > 0) {
                    formData.append('picture_file', pictureInput.files[0]);
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
                    console.error('Raw response:', text);
                    throw new Error('Server returned invalid response');
                }

                if (data.status === 'success') {
                    showBootstrapAlert(isEdit ? 'Student updated successfully!' : 'Student added successfully!', 'success');
                    addUserModal.style.display = "none";
                    resetForm();
                    loadStudentData();
                } else {
                    showBootstrapAlert('Error: ' + (data.message || 'Operation failed'), 'danger');
                }
            } catch (error) {
                console.error('Error saving student:', error);
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
            document.getElementById("student-number").value = "";
            document.getElementById("student-name").value = "";
            document.getElementById("student-department").selectedIndex = 0;
            document.getElementById("student-program").innerHTML = '<option value="" disabled selected>Select Program</option>';
            document.getElementById("student-year").innerHTML = '<option value="" disabled selected>Select Year</option>';
            document.getElementById("student-block").innerHTML = '<option value="" disabled selected>Select Block</option>';
            document.getElementById("student-pincode").value = "";
            document.getElementById("student-picture").value = "";
            
            const preview = document.getElementById('picture-preview');
            const placeholder = document.getElementById('picture-placeholder');
            const removePictureBtn = document.getElementById('remove-picture-btn');
            
            const img = preview.querySelector('img');
            if (img) img.remove();
            
            placeholder.style.display = 'block';
            removePictureBtn.style.display = 'none';
            
            delete saveBtn.dataset.studentId;
        }

        async function loadStudentData() {
            try {
                const formData = new FormData();
                formData.append('action', 'get_all');
                
                const response = await fetch('PHP/admin-student_perinfo.php', {
                    method: 'POST',
                    body: formData
                });
                
                const text = await response.text();
                let data;
                
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('JSON parse error:', text);
                    displayStudentData([]);
                    return;
                }
                
                if (data.status === 'success') {
                    currentData = data.data || [];
                    displayStudentData(currentData);
                    populateFilters();
                } else {
                    console.error('Error loading student data:', data.message);
                    displayStudentData([]);
                }
            } catch (error) {
                console.error('Error fetching student data:', error);
                displayStudentData([]);
            }
        }

        function displayStudentData(studentData) {
            const tbody = document.getElementById("student-table-body");
            tbody.innerHTML = '';
            
            if (studentData.length === 0) {
                tbody.innerHTML = `<tr class="empty-message"><td colspan="10" class="text-center">No student records found</td></tr>`;
                return;
            }
            
            studentData.forEach(student => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${student.student_number || ''}</td>
                    <td>
                        ${student.picture ? 
                            `<img src="${student.picture}" alt="Profile" class="profile-pic">` : 
                            `<div class="no-picture"><i class="fa-solid fa-user"></i></div>`
                        }
                    </td>
                    <td>${student.pin_code || student.pincode || 'Not set'}</td>
                    <td>${student.name || ''}</td>
                    <td>${student.department || ''}</td>
                    <td>${student.program || ''}</td>
                    <td>${student.year_level || student.year || ''}</td>
                    <td>${student.block || ''}</td>
                    <td>
                        <span class="badge ${student.registration_status === 'Registered' ? 'bg-success' : 'bg-danger'}">
                            ${student.registration_status || 'Unregistered'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${student.id}">
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
            const yearFilter = document.getElementById('year-filter');
            const blockFilter = document.getElementById('block-filter');
            
            
            departmentFilter.innerHTML = '<option value="">All Departments</option>';
            Object.keys(departmentsData).forEach(dept => {
                const option = document.createElement("option");
                option.value = dept;
                option.textContent = dept;
                departmentFilter.appendChild(option);
            });
            updateProgramFilter();
            yearFilter.innerHTML = '<option value="">All Years</option>';
            for (let i = 1; i <= 4; i++) {
                const option = document.createElement("option");
                const suffix = getOrdinalSuffix(i);
                option.value = `${i}${suffix} Year`;
                option.textContent = `${i}${suffix} Year`;
                yearFilter.appendChild(option);
            }
            blockFilter.innerHTML = '<option value="">All Blocks</option>';
            for (let i = 1; i <= 15; i++) {
                const option = document.createElement("option");
                option.value = `Block ${i}`;
                option.textContent = `Block ${i}`;
                blockFilter.appendChild(option);
            }
            departmentFilter.addEventListener('change', updateProgramFilter);
        }

        function updateProgramFilter() {
            const departmentFilter = document.getElementById('department-filter');
            const programFilter = document.getElementById('program-filter');
            const selectedDept = departmentFilter.value;
            
            programFilter.innerHTML = '<option value="">All Programs</option>';
            
            if (selectedDept) {
                if (departmentsData[selectedDept]) {
                    departmentsData[selectedDept].programs.forEach(program => {
                        const option = document.createElement("option");
                        option.value = program;
                        option.textContent = program;
                        programFilter.appendChild(option);
                    });
                }
            } else {
                const allPrograms = new Set();
                Object.values(departmentsData).forEach(dept => {
                    dept.programs.forEach(program => {
                        allPrograms.add(program);
                    });
                });
                
                Array.from(allPrograms).sort().forEach(program => {
                    const option = document.createElement("option");
                    option.value = program;
                    option.textContent = program;
                    programFilter.appendChild(option);
                });
            }
        }

        function setupEditButtons() {
            const editButtons = document.querySelectorAll('.edit-btn');
            editButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const studentId = this.dataset.id;
                    const student = currentData.find(s => s.id == studentId);
                    
                    if (student) {
                        openEditModal(student);
                    }
                });
            });
        }

        function openEditModal(student) {
            document.querySelector(".form-title").innerHTML = '<i class="fa-solid fa-edit"></i> Edit Student Information';
            addUserModal.style.display = "flex";
            
            document.getElementById("student-number").value = student.student_number || '';
            document.getElementById("student-name").value = student.name || '';
            document.getElementById("student-pincode").value = student.pin_code || student.pincode || '';
            document.getElementById("student-registration").textContent = student.registration_status || 'Unregistered';
            
            populateDepartmentDropdown();
            setTimeout(() => {
                document.getElementById("student-department").value = student.department || '';
                const event = new Event('change');
                document.getElementById("student-department").dispatchEvent(event);
                
                setTimeout(() => {
                    document.getElementById("student-program").value = student.program || '';
                    document.getElementById("student-year").value = student.year_level || student.year || '';
                    document.getElementById("student-block").value = student.block || '';
                }, 100);
            }, 100);
            
            const preview = document.getElementById('picture-preview');
            const placeholder = document.getElementById('picture-placeholder');
            const removePictureBtn = document.getElementById('remove-picture-btn');
            
            const existingImg = preview.querySelector('img');
            if (existingImg) existingImg.remove();
            
            if (student.picture) {
                const img = document.createElement('img');
                img.src = student.picture;
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
            
            saveBtn.dataset.studentId = student.id;
        }

        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                const tabName = this.textContent.trim();
                logAuditTrail('SWITCH_TAB', `Switched to ${tabName} personal information tab`);
            });
        });

        const searchBox = document.querySelector('input[placeholder="Search students..."]');
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
            const yearFilter = document.getElementById('year-filter').value;
            const blockFilter = document.getElementById('block-filter').value;
            const registrationFilter = document.getElementById('registration-filter').value;

            const filteredData = currentData.filter(student => {
                const matchesSearch = !searchTerm || 
                    (student.student_number && student.student_number.toLowerCase().includes(searchTerm)) ||
                    (student.name && student.name.toLowerCase().includes(searchTerm)) ||
                    (student.department && student.department.toLowerCase().includes(searchTerm)) ||
                    (student.program && student.program.toLowerCase().includes(searchTerm));
                const matchesDepartment = !departmentFilter || 
                    (student.department === departmentFilter);
                const matchesProgram = !programFilter || 
                    (student.program === programFilter);
                const matchesYear = !yearFilter || 
                    (student.year === yearFilter);
                const matchesBlock = !blockFilter || 
                    (student.block === blockFilter);
                const matchesRegistration = !registrationFilter || 
                    (student.registration_status === registrationFilter);

                return matchesSearch && matchesDepartment && matchesProgram && matchesYear && matchesBlock && matchesRegistration;
            });
            
            displayStudentData(filteredData);
        }

        const filterSelects = document.querySelectorAll('.form-select');
        filterSelects.forEach(select => {
            select.addEventListener('change', filterTable);
        });
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('student-file');
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
                
                const requiredColumns = ['Student Number', 'Name', 'Department', 'Program', 'Year', 'Block'];
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
            formData.append('filename', 'student_upload.csv');
            
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
            
            fetch('PHP/admin-student_perinfo.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showBootstrapAlert(`Successfully uploaded ${data.processed} student records`, 'success');
                    document.getElementById('file-upload-modal').style.display = 'none';
                    resetFileUpload();
                    loadStudentData();
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
        populateYearDropdown();
        populateBlockDropdown();
        loadStudentData();
    });
