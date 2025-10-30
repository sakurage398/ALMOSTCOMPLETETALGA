<?php
require_once 'db_connection.php';

header('Content-Type: application/json');

$period = $_POST['period'] ?? 'daily';
$response = [
    'status' => 'success',
    'data' => [
        'labels' => [],
        'students' => [],
        'faculty' => [],
        'staff' => []
    ]
];

try {
    switch ($period) {
        case 'daily':
            // Last 7 days
            $response['data']['labels'] = [];
            $studentData = [];
            $facultyData = [];
            $staffData = [];
            
            for ($i = 6; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i days"));
                $response['data']['labels'][] = date('M j', strtotime($date));
                
                // Students
                $stmt = $conn->prepare("SELECT COUNT(DISTINCT student_number) as count FROM student_attendance WHERE DATE(time_in) = ?");
                $stmt->bind_param("s", $date);
                $stmt->execute();
                $result = $stmt->get_result();
                $studentData[] = $result->fetch_assoc()['count'] ?? 0;
                
                // Faculty
                $stmt = $conn->prepare("SELECT COUNT(DISTINCT faculty_number) as count FROM faculty_attendance WHERE DATE(time_in) = ?");
                $stmt->bind_param("s", $date);
                $stmt->execute();
                $result = $stmt->get_result();
                $facultyData[] = $result->fetch_assoc()['count'] ?? 0;
                
                // Staff
                $stmt = $conn->prepare("SELECT COUNT(DISTINCT staff_number) as count FROM staff_attendance WHERE DATE(time_in) = ?");
                $stmt->bind_param("s", $date);
                $stmt->execute();
                $result = $stmt->get_result();
                $staffData[] = $result->fetch_assoc()['count'] ?? 0;
            }
            
            $response['data']['students'] = $studentData;
            $response['data']['faculty'] = $facultyData;
            $response['data']['staff'] = $staffData;
            break;
            
        case 'weekly':
            // Last 8 weeks
            $response['data']['labels'] = [];
            $studentData = [];
            $facultyData = [];
            $staffData = [];
            
            for ($i = 7; $i >= 0; $i--) {
                $weekStart = date('Y-m-d', strtotime("-$i weeks Monday"));
                $weekEnd = date('Y-m-d', strtotime("$weekStart +6 days"));
                $response['data']['labels'][] = date('M j', strtotime($weekStart));
                
                // Students
                $stmt = $conn->prepare("SELECT COUNT(DISTINCT student_number) as count FROM student_attendance WHERE DATE(time_in) BETWEEN ? AND ?");
                $stmt->bind_param("ss", $weekStart, $weekEnd);
                $stmt->execute();
                $result = $stmt->get_result();
                $studentData[] = $result->fetch_assoc()['count'] ?? 0;
                
                // Faculty
                $stmt = $conn->prepare("SELECT COUNT(DISTINCT faculty_number) as count FROM faculty_attendance WHERE DATE(time_in) BETWEEN ? AND ?");
                $stmt->bind_param("ss", $weekStart, $weekEnd);
                $stmt->execute();
                $result = $stmt->get_result();
                $facultyData[] = $result->fetch_assoc()['count'] ?? 0;
                
                // Staff
                $stmt = $conn->prepare("SELECT COUNT(DISTINCT staff_number) as count FROM staff_attendance WHERE DATE(time_in) BETWEEN ? AND ?");
                $stmt->bind_param("ss", $weekStart, $weekEnd);
                $stmt->execute();
                $result = $stmt->get_result();
                $staffData[] = $result->fetch_assoc()['count'] ?? 0;
            }
            
            $response['data']['students'] = $studentData;
            $response['data']['faculty'] = $facultyData;
            $response['data']['staff'] = $staffData;
            break;
            
        case 'monthly':
            // Last 6 months
            $response['data']['labels'] = [];
            $studentData = [];
            $facultyData = [];
            $staffData = [];
            
            for ($i = 5; $i >= 0; $i--) {
                $month = date('Y-m', strtotime("-$i months"));
                $response['data']['labels'][] = date('M Y', strtotime($month . '-01'));
                
                // Students
                $stmt = $conn->prepare("SELECT COUNT(DISTINCT student_number) as count FROM student_attendance WHERE DATE_FORMAT(time_in, '%Y-%m') = ?");
                $stmt->bind_param("s", $month);
                $stmt->execute();
                $result = $stmt->get_result();
                $studentData[] = $result->fetch_assoc()['count'] ?? 0;
                
                // Faculty
                $stmt = $conn->prepare("SELECT COUNT(DISTINCT faculty_number) as count FROM faculty_attendance WHERE DATE_FORMAT(time_in, '%Y-%m') = ?");
                $stmt->bind_param("s", $month);
                $stmt->execute();
                $result = $stmt->get_result();
                $facultyData[] = $result->fetch_assoc()['count'] ?? 0;
                
                // Staff
                $stmt = $conn->prepare("SELECT COUNT(DISTINCT staff_number) as count FROM staff_attendance WHERE DATE_FORMAT(time_in, '%Y-%m') = ?");
                $stmt->bind_param("s", $month);
                $stmt->execute();
                $result = $stmt->get_result();
                $staffData[] = $result->fetch_assoc()['count'] ?? 0;
            }
            
            $response['data']['students'] = $studentData;
            $response['data']['faculty'] = $facultyData;
            $response['data']['staff'] = $staffData;
            break;
    }
    
} catch (Exception $e) {
    $response = [
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ];
}

$conn->close();
echo json_encode($response);
?>