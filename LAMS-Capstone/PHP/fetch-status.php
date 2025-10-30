<?php
require_once 'db_connection.php';

header('Content-Type: application/json');

$current_time = date('H:i');
$today = date('Y-m-d');

$response = [
    'status' => 'success',
    'data' => [
        'time_in' => 0,
        'time_out' => 0,
        'students' => 0,
        'faculty' => 0,
        'staff' => 0
    ]
];

$reset_stats = ($current_time >= '18:00');

try {
    if ($reset_stats) {
        echo json_encode($response);
        exit;
    }
    
    $total_time_in_query = "
        SELECT COUNT(*) as count FROM (
            SELECT id FROM student_attendance WHERE time_in IS NOT NULL AND DATE(time_in) = '$today'
            UNION ALL
            SELECT id FROM faculty_attendance WHERE time_in IS NOT NULL AND DATE(time_in) = '$today'
            UNION ALL
            SELECT id FROM staff_attendance WHERE time_in IS NOT NULL AND DATE(time_in) = '$today'
        ) as combined";
    
    $result = $conn->query($total_time_in_query);
    if ($result) {
        $row = $result->fetch_assoc();
        $response['data']['time_in'] = (int)$row['count'];
    }
    
    $total_time_out_query = "
        SELECT COUNT(*) as count FROM (
            SELECT id FROM student_attendance WHERE time_out IS NOT NULL AND DATE(time_out) = '$today'
            UNION ALL
            SELECT id FROM faculty_attendance WHERE time_out IS NOT NULL AND DATE(time_out) = '$today'
            UNION ALL
            SELECT id FROM staff_attendance WHERE time_out IS NOT NULL AND DATE(time_out) = '$today'
        ) as combined";
    
    $result = $conn->query($total_time_out_query);
    if ($result) {
        $row = $result->fetch_assoc();
        $response['data']['time_out'] = (int)$row['count'];
    }
    
    $students_query = "
        SELECT COUNT(DISTINCT student_number) as count 
        FROM student_attendance 
        WHERE (time_in IS NOT NULL AND DATE(time_in) = '$today') 
           OR (time_out IS NOT NULL AND DATE(time_out) = '$today')";
    
    $result = $conn->query($students_query);
    if ($result) {
        $row = $result->fetch_assoc();
        $response['data']['students'] = (int)$row['count'];
    }
    
    $faculty_query = "
        SELECT COUNT(DISTINCT faculty_number) as count 
        FROM faculty_attendance 
        WHERE (time_in IS NOT NULL AND DATE(time_in) = '$today') 
           OR (time_out IS NOT NULL AND DATE(time_out) = '$today')";
    
    $result = $conn->query($faculty_query);
    if ($result) {
        $row = $result->fetch_assoc();
        $response['data']['faculty'] = (int)$row['count'];
    }
    
    $staff_query = "
        SELECT COUNT(DISTINCT staff_number) as count 
        FROM staff_attendance 
        WHERE (time_in IS NOT NULL AND DATE(time_in) = '$today') 
           OR (time_out IS NOT NULL AND DATE(time_out) = '$today')";
    
    $result = $conn->query($staff_query);
    if ($result) {
        $row = $result->fetch_assoc();
        $response['data']['staff'] = (int)$row['count'];
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