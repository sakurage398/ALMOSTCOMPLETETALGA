
    document.addEventListener("DOMContentLoaded", function () {
    logPageAccess();

    const adminMenu = document.querySelector(".admin-menu");
    const dropdown = document.querySelector(".dropdown");
    const searchBar = document.querySelector('input[type="text"]');
    const entriesInput = document.querySelector('input[type="number"]');
    let currentData = [];
    let printContent, style, chartContainer;

    adminMenu.addEventListener("click", function (event) {
        event.stopPropagation();
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", function () {
        dropdown.style.display = "none";
    });

    const logoutBtn = document.querySelector(".logout-btn");
    const modal = document.querySelector(".modal");
    const yesBtn = document.querySelector(".yes-btn");
    const noBtn = document.querySelector(".no-btn");

    logoutBtn.addEventListener("click", function () {
        modal.style.display = "flex";
    });

    yesBtn.addEventListener("click", function () {
        window.location.href = "login.html";
    });

    noBtn.addEventListener("click", function () {
        modal.style.display = "none";
        cleanupPrintElements();
    });

    const departmentRoles = {
        "Library": ["Librarian", "Assistant Librarian"],
        "Registrar": ["Registrar", "Assistant Registrar"],
        "IT Department": ["IT Manager", "Support Staff"],
        "Finance": ["Accountant", "Finance Assistant"],
        "Human Resources": ["HR Manager", "HR Assistant"]
    };

    const departmentFilter = document.getElementById("departmentFilter");
    const roleFilter = document.getElementById("roleFilter");
    
    const reportType = document.getElementById("reportType");
    const dailySelector = document.getElementById("dailySelector");
    const weeklySelector = document.getElementById("weeklySelector");
    const monthlySelector = document.getElementById("monthlySelector");
    
    const today = new Date();
    document.getElementById("dailyDate").valueAsDate = today;
    document.getElementById("weeklyDateFrom").valueAsDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    document.getElementById("weeklyDateTo").valueAsDate = today;
    document.getElementById("monthlyDate").value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    reportType.addEventListener("change", function() {
        dailySelector.classList.add("d-none");
        weeklySelector.classList.add("d-none");
        monthlySelector.classList.add("d-none");
        
        if (this.value === "daily") {
            dailySelector.classList.remove("d-none");
        } else if (this.value === "weekly") {
            weeklySelector.classList.remove("d-none");
        } else if (this.value === "monthly") {
            monthlySelector.classList.remove("d-none");
        }
        
        filterTable();
    });

    document.getElementById("dailyDate").addEventListener("change", filterTable);
    document.getElementById("weeklyDateFrom").addEventListener("change", filterTable);
    document.getElementById("weeklyDateTo").addEventListener("change", filterTable);
    document.getElementById("monthlyDate").addEventListener("change", filterTable);

    departmentFilter.addEventListener("change", function () {
        roleFilter.innerHTML = '<option value="">All</option>';
        (departmentRoles[this.value] || []).forEach(role => {
            let option = document.createElement("option");
            option.value = role;
            option.textContent = role;
            roleFilter.appendChild(option);
        });
        
        filterTable();
    });

    loadStaffData();
    
    searchBar.addEventListener("input", function() {
        clearTimeout(this.searchTimer);
        
        this.searchTimer = setTimeout(function() {
            if (searchBar.value.length > 0) {
                logAuditTrail('SEARCH_ATTENDANCE', `Searched staff attendance records: ${searchBar.value}`);
            }
            filterTable();
        }, 1000); 
    });
    
    entriesInput.addEventListener("change", function() {
        if (parseInt(this.value) < 0) {
            this.value = 0;
        }
        filterTable();
    });
    
    roleFilter.addEventListener("change", function() {
        filterTable();
    });
    
    document.getElementById("logDateFilter").addEventListener("change", function() {
        filterTable();
    });

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            const tabName = this.textContent.trim();
            logAuditTrail('SWITCH_TAB', `Switched to ${tabName} attendance tab`);
        });
    });

    document.querySelector(".btn-primary").addEventListener("click", function() {
        logAuditTrail('GENERATE_REPORT', 'Generated staff attendance report');
        cleanupPrintElements();
        
        chartContainer = document.createElement('div');
        chartContainer.id = 'tempChartContainer';
        chartContainer.style.width = '500px';
        chartContainer.style.height = '300px';
        chartContainer.style.position = 'fixed';
        chartContainer.style.top = '-1000px';
        chartContainer.style.left = '-1000px';
        document.body.appendChild(chartContainer);
        
        const reportTypeValue = document.getElementById("reportType").value;
        let dateRangeText = "";
        let dateRangeForTitle = "";
        let semesterText = "";

        const selectedSemester = document.querySelector('input[name="semester"]:checked').value;
        const schoolYear = document.getElementById("schoolYear").value;

        if (reportTypeValue === "daily") {
            const dailyDate = document.getElementById("dailyDate").value;
            dateRangeText = `Date: ${formatDateForDisplay(dailyDate)}`;
            dateRangeForTitle = formatDateForDisplay(dailyDate);
            semesterText = `${selectedSemester} SY ${schoolYear}`;
        } else if (reportTypeValue === "weekly") {
            const fromDate = document.getElementById("weeklyDateFrom").value;
            const toDate = document.getElementById("weeklyDateTo").value;
            dateRangeText = `Date Range: ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`;
            dateRangeForTitle = `${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`;
            semesterText = `${selectedSemester} SY ${schoolYear}`;
        } else if (reportTypeValue === "monthly") {
            const monthlyDate = document.getElementById("monthlyDate").value;
            const [year, month] = monthlyDate.split('-');
            const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
            dateRangeText = `Month: ${monthName} ${year}`;
            dateRangeForTitle = `${monthName} ${year}`;
            semesterText = `${selectedSemester} SY ${schoolYear}`;
        } else {
            dateRangeText = `${selectedSemester} SY ${schoolYear}`;
            dateRangeForTitle = `${selectedSemester} SY ${schoolYear}`;
            semesterText = ``;
        }
        
        const department = document.getElementById("departmentFilter").value;
        const role = document.getElementById("roleFilter").value || "All Roles";

        const tableData = Array.from(document.querySelectorAll("tbody tr:not(.empty-message)")).map(row =>
            Array.from(row.querySelectorAll("td")).map(cell => cell.textContent)
        );

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        
        const monthData = {};
        
        tableData.forEach(rowData => {
            if (rowData.length >= 7) {
                const logDate = rowData[6];
                if (logDate && logDate !== '-') {
                    try {
                        const date = new Date(logDate);
                        const monthName = monthNames[date.getMonth()];
                        monthData[monthName] = (monthData[monthName] || 0) + 1;
                    } catch (e) {
                        console.error("Error parsing date:", logDate);
                    }
                }
            }
        });

        const reportTableData = [];
        let total = 0;
        
        Object.keys(monthData)
            .sort((a, b) => monthNames.indexOf(a) - monthNames.indexOf(b))
            .forEach(month => {
                const count = monthData[month] || 0;
                if (count > 0) {
                    reportTableData.push([month, count]);
                    total += count;
                }
            });
        
        total = total || 0;
        reportTableData.push(["TOTAL", total]);

        const labels = reportTableData.slice(0, -1).map(row => row[0]);
        const values = reportTableData.slice(0, -1).map(row => row[1]);
        
        const colors = [
            '#4a80db', '#ff7f50', '#9ACD32', '#9370DB', '#20B2AA', 
            '#FFA07A', '#FF6347', '#FF4500', '#6B8E23', '#4682B4', 
            '#5F9EA0', '#D2691E'
        ];

        const filteredLabels = [];
        const filteredValues = [];
        const filteredColors = [];
        
        for (let i = 0; i < labels.length; i++) {
            if (values[i] > 0) {
                filteredLabels.push(labels[i]);
                filteredValues.push(values[i]);
                filteredColors.push(colors[i % colors.length]);
            }
        }

        const options = {
            series: filteredValues,
            labels: filteredLabels,
            chart: {
                type: 'pie',
                width: 500,
                height: 300,
                animations: { enabled: false }
            },
            colors: filteredColors,
            dataLabels: {
                enabled: true,
                formatter: function(val, opt) {
                    const value = filteredValues[opt.seriesIndex];
                    const percentage = Math.round((value / total) * 100);
                    const label = filteredLabels[opt.seriesIndex];
                    return [label, value.toString(), percentage + "%"];
                },
                style: {
                    fontSize: '10px',
                    fontFamily: 'Arial',
                    fontWeight: 'bold',
                    colors: ['#fff']
                },
                dropShadow: { enabled: false }
            },
            legend: { show: false },
            stroke: {
                width: 0,
                colors: ['#fff']
            },
            fill: { opacity: 1 },
            plotOptions: {
                pie: {
                    expandOnClick: false,
                    donut: { size: '0%' }
                }
            },
            tooltip: {
                enabled: true,
                formatter: function(val, opt) {
                    const value = filteredValues[opt.dataPointIndex];
                    const percentage = Math.round((value / total) * 100);
                    const label = filteredLabels[opt.dataPointIndex];
                    return `${label}: ${value} (${percentage}%)`;
                }
            }
        };

        const chart = new ApexCharts(document.querySelector("#tempChartContainer"), options);
        chart.render();

        setTimeout(() => {
            html2canvas(document.querySelector("#tempChartContainer")).then(canvas => {
                const chartImage = canvas.toDataURL('image/png');
                
                printContent = document.createElement('div');
                printContent.classList.add('print-only');

                style = document.createElement('style');
                style.textContent = `
                    @media print {
                        body * { visibility: hidden; }
                        .print-only, .print-only * { visibility: visible !important; }
                        .print-only { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        .header-wrapper, .footer-wrapper {
                            position: relative;
                            z-index: 1;
                        }
                        img.header-img, img.footer-img {
                            position: absolute;
                            z-index: -1;
                            max-width: 100%;
                            height: auto;
                            display: block;
                        }
                        .signature-boxes {
                            display: flex;
                            justify-content: center;
                            margin-top: 20px;
                            gap: 10px;
                        }
                        .signature-box {
                            width: 40%;
                            text-align: center;
                            border: 1px solid #000;
                            padding: 5px;
                        }
                        .report-content {
                            line-height: 1.2;
                        }
                        h2 {
                            margin: 10px 0 5px 0;
                            font-size: 16pt;
                        }
                        h3 {
                            margin: 5px 0;
                            font-size: 14pt;
                        }
                        table {
                            font-size: 10pt;
                        }
                        .chart-img {
                            display: block;
                            max-width: 450px;
                            height: auto;
                            margin: 20px auto;
                        }
                    }
                    @media screen {
                        .print-only { display: none; }
                    }
                `;
                document.head.appendChild(style);

                printContent.innerHTML = `
                    <div style="margin: 0; padding: 0; background-color: white;">
                        <style>
                            @page { margin: 0; }
                            body { margin: 0; padding: 0; background: white; }
                            .signature-boxes {
                                position: absolute; bottom: 90px; left: 0; width: 100%;
                                display: flex; justify-content: center; z-index: 2;
                            }
                            .footer-wrapper {
                                position: absolute; bottom: 0; left: 0; width: 100%;
                                height: 70px; z-index: 1;
                            }
                            .report-content {
                                min-height: 95vh; position: relative; padding-bottom: 200px;
                            }
                        </style>
                        <div class="report-content" style="text-align: center; font-family: Arial, sans-serif; background-color: white; padding: 20px; margin: 0;">
                            <div class="header-wrapper" style="position: relative; height: 100px; margin: 0;">
                                <img src="img/header.png" class="header-img" style="position: absolute; top: 0; left: 0; width: 100%; z-index: -1; opacity: 0.9;">
                            </div>

                            <h2 style="position: relative; z-index: 2; margin-top: 20px;">SUMMARY OF STAFF LIBRARY STATISTICS</h2>
                            <h3 style="position: relative; z-index: 2;">${department} - ${role}</h3>
                            <h3 style="position: relative; z-index: 2;">${dateRangeText}</h3>
                            <h3 style="position: relative; z-index: 2;">${semesterText}</h3>

                            <div style="margin: 30px auto; max-width: 500px; position: relative; z-index: 2; background-color: white;">
                                <table border="1" cellpadding="3" cellspacing="0" style="margin: 0 auto; border-collapse: collapse; width: 90%; background-color: white;">
                                    <thead>
                                        <tr style="background-color: #8869BB; color: white;">
                                            <th style="padding: 5px;">Months</th>
                                            <th style="padding: 5px;">No. of Users</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${reportTableData.map(row => `
                                            <tr>
                                                <td style="padding: 5px;">${row[0]}</td>
                                                <td style="text-align: center; padding: 5px;">${row[1]}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>

                            <div style="text-align: center; margin: 30px auto; width: 450px; height: 300px; position: relative; z-index: 2;">
                                <div style="border: 1px solid #ddd; background-color: #fff; padding: 10px;">
                                    <img src="${chartImage}" class="chart-img" alt="Statistics Chart" style="width: 100%; height: auto;">
                                </div>
                            </div>

                            <div class="signature-boxes">
                                <div style="border: 1px solid black; padding: 10px; width: 300px;">
                                    <p style="text-align: left; margin: 0;"><strong>Prepared by:</strong></p>
                                    <p style="text-align: left; font-style: italic; font-weight: bold;">Richard Frank P. Tan</p>
                                    <p style="text-align: left; margin: 0;">Library Clerk</p>
                                </div>
                                <div style="border: 1px solid black; padding: 10px; width: 300px;">
                                    <p style="text-align: left;"><strong>Noted by:</strong></p>
                                    <p style="text-align: left; font-style: italic; font-weight: bold;">Lala E. Montemayor, MAED-LS</p>
                                    <p style="text-align: left; margin: 0;">Chief Librarian</p>
                                </div>
                            </div>

                            <div class="footer-wrapper">
                                <img src="img/footer.png" class="footer-img" style="position: absolute; bottom: 0; left: 0; width: 100%; z-index: -1; opacity: 0.9;">
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(printContent);

                const headerImg = new Image();
                const footerImg = new Image();
                let headerLoaded = false;
                let footerLoaded = false;
                let printTriggered = false;

                const checkImagesAndPrint = () => {
                    if (headerLoaded && footerLoaded && !printTriggered) {
                        printTriggered = true;
                        window.print();
                        
                        window.addEventListener('afterprint', function() {
                            cleanupPrintElements();
                        }, {once: true});
                    }
                };

                headerImg.onload = () => {
                    headerLoaded = true;
                    checkImagesAndPrint();
                };

                footerImg.onload = () => {
                    footerLoaded = true;
                    checkImagesAndPrint();
                };

                headerImg.onerror = () => {
                    headerLoaded = true;
                    checkImagesAndPrint();
                };

                footerImg.onerror = () => {
                    footerLoaded = true;
                    checkImagesAndPrint();
                };

                setTimeout(() => {
                    if (!headerLoaded) headerLoaded = true;
                    if (!footerLoaded) footerLoaded = true;
                    checkImagesAndPrint();
                }, 2000);

                headerImg.src = "img/header.png";
                footerImg.src = "img/footer.png";
            }).catch(error => {
                console.error("Error generating chart image:", error);
                alert("Error generating report. Please try again.");
                cleanupPrintElements();
            });
        }, 1000);
    });

    function cleanupPrintElements() {
        if (printContent && printContent.parentNode) {
            document.body.removeChild(printContent);
        }
        if (style && style.parentNode) {
            document.head.removeChild(style);
        }
        if (chartContainer && chartContainer.parentNode) {
            document.body.removeChild(chartContainer);
        }
    }

    function loadStaffData() {
        fetch('PHP/fetch-staff.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    currentData = data.data || [];
                    displayData(currentData);
                } else if (Array.isArray(data)) {
                    currentData = data;
                    displayData(currentData);
                } else if (data.status === 'error') {
                    console.error(data.message);
                    const tableBody = document.querySelector("tbody");
                    tableBody.innerHTML = `<tr class="empty-message"><td colspan="7">Error: ${data.message}</td></tr>`;
                } else {
                    console.error('Unexpected response format:', data);
                    const tableBody = document.querySelector("tbody");
                    tableBody.innerHTML = `<tr class="empty-message"><td colspan="7">Unexpected data format</td></tr>`;
                }
            })
            .catch(error => {
                console.error('Error fetching staff data:', error);
                const tableBody = document.querySelector("tbody");
                tableBody.innerHTML = `<tr class="empty-message"><td colspan="7">Error loading data</td></tr>`;
            });
    }

    document.querySelectorAll('input[name="semester"]').forEach(radio => {
        radio.addEventListener('change', function() {
            filterTable();
        });
    });

    document.getElementById("schoolYear").addEventListener("change", function() {
        filterTable();
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
        logAuditTrail('ATTENDANCE_ACCESS', 'Accessed staff attendance page');
    }
    
    function displayData(data) {
        const tableBody = document.querySelector("tbody");
        tableBody.innerHTML = "";
        
        const entriesInput = document.querySelector('input[type="number"]');
        const entriesCount = parseInt(entriesInput.value) || 0;
        
        const filteredData = applyFilters(data);
        const displayData = entriesCount > 0 ? filteredData.slice(0, entriesCount) : filteredData;
        
        if (displayData.length === 0) {
            tableBody.innerHTML = `<tr class="empty-message"><td colspan="7">No records found</td></tr>`;
            updateEntriesMessage(0, filteredData.length);
            return;
        }
        
        displayData.forEach(staff => {
            const timeIn = staff.time_in ? formatDateTime(staff.time_in) : '-';
            const timeOut = staff.time_out ? formatDateTime(staff.time_out) : '-';
            const logDate = staff.log_date ? formatDate(staff.log_date) : '-';
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${staff.staff_number || ''}</td>
                <td>${staff.name || ''}</td>
                <td>${staff.department || ''}</td>
                <td>${staff.role || ''}</td>
                <td>${timeIn}</td>
                <td>${timeOut}</td>
                <td>${logDate}</td>
            `;
            tableBody.appendChild(row);
        });
        
        updateEntriesMessage(displayData.length, filteredData.length);
    }
    
    function updateEntriesMessage(shownEntries, totalEntries) {
        let entriesMessage = document.getElementById("entries-message");
        if (!entriesMessage) {
            entriesMessage = document.createElement("div");
            entriesMessage.id = "entries-message";
            entriesMessage.className = "mt-2 text-muted small";
            document.querySelector(".table-container").after(entriesMessage);
        }
        
        const entriesInput = document.querySelector('input[type="number"]');
        const requestedEntries = parseInt(entriesInput.value) || 0;
        
        if (requestedEntries === 0) {
            entriesMessage.textContent = `Showing all ${totalEntries} entries.`;
        } else if (shownEntries < requestedEntries) {
            entriesMessage.textContent = `Showing ${shownEntries} of ${totalEntries} entries. There are not enough records to show ${requestedEntries} entries.`;
        } else {
            entriesMessage.textContent = `Showing ${shownEntries} of ${totalEntries} entries.`;
        }
    }
    
    function applyFilters(data) {
        const searchBar = document.querySelector('input[type="text"]');
        const searchTerm = searchBar.value.toLowerCase();
        const department = document.getElementById("departmentFilter").value;
        const role = document.getElementById("roleFilter").value;
        const reportTypeValue = document.getElementById("reportType").value;
        const logDateFilter = document.getElementById("logDateFilter").value;
        
        return data.filter(staff => {
            const matchesSearch = searchTerm === '' || 
                (staff.staff_number && staff.staff_number.toLowerCase().includes(searchTerm)) || 
                (staff.name && staff.name.toLowerCase().includes(searchTerm)) ||
                (staff.department && staff.department.toLowerCase().includes(searchTerm)) ||
                (staff.role && staff.role.toLowerCase().includes(searchTerm));
            
            const matchesDepartment = department === '' || staff.department === department;
            const matchesRole = role === '' || staff.role === role;
            
            let matchesLogDate = true;
            if (logDateFilter) {
                const staffLogDate = staff.log_date ? formatDate(staff.log_date) : '';
                matchesLogDate = staffLogDate === logDateFilter;
            }
            
            let matchesReportDate = true;
            if (reportTypeValue !== "semester") {
                const logDate = staff.log_date ? new Date(staff.log_date) : null;
                
                if (logDate) {
                    if (reportTypeValue === "daily") {
                        const dailyDate = document.getElementById("dailyDate").value;
                        if (dailyDate) {
                            matchesReportDate = isSameDay(logDate, new Date(dailyDate));
                        }
                    } else if (reportTypeValue === "weekly") {
                        const fromDate = document.getElementById("weeklyDateFrom").value;
                        const toDate = document.getElementById("weeklyDateTo").value;
                        if (fromDate && toDate) {
                            matchesReportDate = isDateInRange(logDate, new Date(fromDate), new Date(toDate));
                        }
                    } else if (reportTypeValue === "monthly") {
                        const monthlyDate = document.getElementById("monthlyDate").value;
                        if (monthlyDate) {
                            matchesReportDate = isSameMonth(logDate, new Date(monthlyDate + '-01'));
                        }
                    }
                } else {
                    matchesReportDate = false;
                }
            }
            
            return matchesSearch && matchesDepartment && matchesRole && matchesLogDate && matchesReportDate;
        });
    }
    
    function filterTable() {
        const filteredData = applyFilters(currentData);
        displayData(filteredData);
    }
    
    function isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    function isDateInRange(date, startDate, endDate) {
        if (!date || !startDate || !endDate) return false;
        return date >= startDate && date <= endDate;
    }
    
    function isSameMonth(date1, date2) {
        if (!date1 || !date2) return false;
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth();
    }
    
    function formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return '-';
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) return '-';
        
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    function formatDateForDisplay(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}/${year}`;
    }
});

function populateSchoolYears() {
    const select = document.getElementById('schoolYear');
    const currentYear = new Date().getFullYear();
    const yearsToShow = 10;
    
    while(select.options.length > 1) {
        select.remove(1);
    }
    
    for (let i = 0; i <= yearsToShow; i++) {
        const year = currentYear - i;
        const option = document.createElement('option');
        option.value = `${year}-${year + 1}`;
        option.textContent = `${year}-${year + 1}`;
        select.appendChild(option);
    }
    
    const currentMonth = new Date().getMonth();
    const activeSchoolYear = currentMonth < 6 ? currentYear - 1 : currentYear;
    select.value = `${activeSchoolYear}-${activeSchoolYear + 1}`;
}

window.addEventListener('load', populateSchoolYears);

document.getElementById('schoolYear').addEventListener('click', function() {
    if (this.options.length <= 1) {
        populateSchoolYears();
    }
});
