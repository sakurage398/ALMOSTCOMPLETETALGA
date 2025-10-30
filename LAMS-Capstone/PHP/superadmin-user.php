<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'db_connection.php';
require_once 'audit_functions.php';

require_once 'PHPMailer/src/Exception.php';
require_once 'PHPMailer/src/PHPMailer.php';
require_once 'PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    
    ob_start();
    
    try {
        switch ($action) {
            case 'add':
                addUser($conn);
                break;
            case 'edit':
                editUser($conn);
                break;
            case 'delete':
                deleteUser($conn);
                break;
            case 'getUsers':
                getUsers($conn);
                break;
            case 'getUser':
                getUser($conn);
                break;
            case 'getUsersForAudit':
                getUsersForAudit($conn);
                break;
            case 'getUserAuditLogs':
                getUserAuditLogs($conn);
                break;
            default:
                echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
                break;
        }
    } catch (Exception $e) {
        ob_clean();
        echo json_encode(['status' => 'error', 'message' => 'Exception: ' . $e->getMessage()]);
    }

    ob_end_flush();
    $conn->close();
    exit();
}

function customHash($password) {
    return substr(md5($password), 0, 8);
}

function sendUserCredentials($email, $name, $username, $password, $isNewUser = true) {
    $mail = new PHPMailer(true);
    
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'alamslibrary101425@gmail.com';
        $mail->Password = 'sipqrmnqlieeqmsu';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('noreply@alams.com', 'ALAMS System');
        $mail->addAddress($email, $name);
        $mail->addReplyTo('noreply@alams.com', 'ALAMS System');

        $mail->isHTML(true);
        $mail->Subject = $isNewUser ? "Your ALAMS Account Credentials" : "Your ALAMS Account Has Been Updated";
        
        $message = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
                .header { background: #8869BB; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 25px; background: #f9f9f9; }
                .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8869BB; }
                .footer { text-align: center; padding: 15px; font-size: 12px; color: #666; border-top: 1px solid #ddd; margin-top: 20px; }
                .info-box { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>ALAMS System</h1>
                    <p>Automated Library Attendance Monitoring System</p>
                </div>
                <div class='content'>
                    <h2>Hello " . htmlspecialchars($name) . "!</h2>
                    
                    <p>" . ($isNewUser ? 
                        "Your administrator account has been created successfully." : 
                        "Your administrator account information has been updated.") . "</p>
                    
                    <div class='credentials'>
                        <h3>Your Login Credentials</h3>
                        <p><strong>Username:</strong> " . htmlspecialchars($username) . "</p>
                        <p><strong>Password:</strong> " . htmlspecialchars($password) . "</p>
                        <p><strong>Login URL:</strong> <a href='" . (isset($_SERVER['HTTP_HOST']) ? 'http://' . $_SERVER['HTTP_HOST'] . '/login.html' : '#') . "'>Access System</a></p>
                    </div>
                    
                    <div class='info-box'>
                        <h4>Important Security Information</h4>
                        <ul>
                            <li>Keep your credentials secure and do not share them with anyone</li>
                            <li>You will be required to enter a PIN code sent to your email when logging in</li>
                            <li>The PIN code expires after 2 minutes for security reasons</li>
                            <li>You can request a new PIN code using the 'Resend' button if needed</li>
                        </ul>
                    </div>
                    
                    <p>If you did not request this account or believe this is an error, please contact your system administrator immediately.</p>
                </div>
                <div class='footer'>
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>&copy; " . date('Y') . " ALAMS. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        $mail->Body = $message;
        
        $mail->AltBody = "Hello $name!\n\n" .
            ($isNewUser ? 
                "Your administrator account has been created successfully." : 
                "Your administrator account information has been updated.") .
            "\n\nYour Login Credentials:\n" .
            "Username: $username\n" .
            "Password: $password\n" .
            "Login URL: " . (isset($_SERVER['HTTP_HOST']) ? 'http://' . $_SERVER['HTTP_HOST'] . '/login.html' : 'Your system login page') .
            "\n\nImportant: Keep your credentials secure. You will receive a PIN code via email when logging in.\n\n" .
            "This is an automated message. Please do not reply.";

        $mail->send();
        return "Credentials sent successfully to " . $email;
        
    } catch (Exception $e) {
        return "Email could not be sent. Error: " . $mail->ErrorInfo;
    }
}

function addUser($conn) {
    if (empty($_POST['name']) || empty($_POST['role']) || empty($_POST['username']) || empty($_POST['password']) || empty($_POST['email'])) {
        echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
        return;
    }

    $name = $conn->real_escape_string($_POST['name']);
    $role = 'Admin';
    $username = $conn->real_escape_string($_POST['username']);
    $email = $conn->real_escape_string($_POST['email']);
    $password = $conn->real_escape_string($_POST['password']);
    $sendEmail = isset($_POST['send_email']) && $_POST['send_email'] == 'true';
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid email format']);
        return;
    }
    
    $checkQuery = "SELECT id FROM users WHERE username = '$username'";
    $result = $conn->query($checkQuery);
    
    if ($result === false) {
        echo json_encode(['status' => 'error', 'message' => 'Database query error: ' . $conn->error]);
        return;
    }
    
    if ($result->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Username already exists']);
        return;
    }
    
    $checkEmailQuery = "SELECT id FROM users WHERE email = '$email'";
    $emailResult = $conn->query($checkEmailQuery);
    
    if ($emailResult->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Email already exists']);
        return;
    }
    
    $hashedPassword = customHash($password);
    
    $currentUser = getCurrentUserInfo();
    
    $query = "INSERT INTO users (name, role, username, email, password) VALUES ('$name', '$role', '$username', '$email', '$hashedPassword')";
    
    if ($conn->query($query) === TRUE) {
        $userId = $conn->insert_id;
        
        logAuditTrail(
            $conn,
            $currentUser['id'],
            $currentUser['username'],
            'USER_CREATE',
            "Created new admin user: $name ($username)",
            'users',
            $userId,
            null,
            ['name' => $name, 'role' => $role, 'username' => $username, 'email' => $email]
        );
        
        $emailStatus = '';
        if ($sendEmail) {
            $emailStatus = sendUserCredentials($email, $name, $username, $password, true);
        }
        
        if (ob_get_length()) {
            ob_clean();
        }
        
        echo json_encode([
            'status' => 'success', 
            'message' => 'User added successfully' . ($sendEmail ? ' and email sent' : ''),
            'email_status' => $emailStatus,
            'user' => [
                'id' => $userId,
                'name' => $name,
                'role' => $role,
                'username' => $username,
                'email' => $email
            ]
        ]);
    } else {
        if (ob_get_length()) {
            ob_clean();
        }
        echo json_encode(['status' => 'error', 'message' => 'Error adding user: ' . $conn->error]);
    }
}

function editUser($conn) {
    if (empty($_POST['id']) || empty($_POST['name']) || empty($_POST['username']) || empty($_POST['email'])) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        return;
    }
    
    $id = (int)$_POST['id'];
    $name = $conn->real_escape_string($_POST['name']);
    $role = 'Admin';
    $username = $conn->real_escape_string($_POST['username']);
    $email = $conn->real_escape_string($_POST['email']);
    $password = isset($_POST['password']) ? $conn->real_escape_string($_POST['password']) : '';
    $sendEmail = isset($_POST['send_email']) && $_POST['send_email'] == 'true';
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid email format']);
        return;
    }
    
    $oldDataQuery = "SELECT name, role, username, email FROM users WHERE id = $id";
    $oldDataResult = $conn->query($oldDataQuery);
    $oldData = $oldDataResult->fetch_assoc();
    
    $checkQuery = "SELECT id FROM users WHERE username = '$username' AND id != $id";
    $result = $conn->query($checkQuery);
    
    if ($result === false) {
        echo json_encode(['status' => 'error', 'message' => 'Database query error: ' . $conn->error]);
        return;
    }
    
    if ($result->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Username already exists']);
        return;
    }
    
    $checkEmailQuery = "SELECT id FROM users WHERE email = '$email' AND id != $id";
    $emailResult = $conn->query($checkEmailQuery);
    
    if ($emailResult->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Email already exists']);
        return;
    }
    
    $queryParts = ["name = '$name'", "role = '$role'", "username = '$username'", "email = '$email'"];
    
    if (!empty($password)) {
        $hashedPassword = customHash($password);
        $queryParts[] = "password = '$hashedPassword'";
    }
    
    $updateClause = implode(", ", $queryParts);
    $query = "UPDATE users SET $updateClause WHERE id = $id";
    
    if ($conn->query($query) === TRUE) {
        $currentUser = getCurrentUserInfo();
        
        $newValues = ['name' => $name, 'role' => $role, 'username' => $username, 'email' => $email];
        if (!empty($password)) {
            $newValues['password'] = '***';
        }
        
        logAuditTrail(
            $conn,
            $currentUser['id'],
            $currentUser['username'],
            'USER_UPDATE',
            "Updated admin user: $name ($username)",
            'users',
            $id,
            $oldData,
            $newValues
        );
        
        $emailStatus = '';
        if ($sendEmail && !empty($password)) {
            $emailStatus = sendUserCredentials($email, $name, $username, $password, false);
        }
        
        if (ob_get_length()) {
            ob_clean();
        }
        
        echo json_encode([
            'status' => 'success', 
            'message' => 'User updated successfully' . ($sendEmail && !empty($password) ? ' and email sent' : ''),
            'email_status' => $emailStatus,
            'user' => [
                'id' => $id,
                'name' => $name,
                'role' => $role,
                'username' => $username,
                'email' => $email
            ]
        ]);
    } else {
        if (ob_get_length()) {
            ob_clean();
        }
        echo json_encode(['status' => 'error', 'message' => 'Error updating user: ' . $conn->error]);
    }
}

function deleteUser($conn) {
    if (empty($_POST['id'])) {
        echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
        return;
    }
    
    $id = (int)$_POST['id'];
    
    $checkQuery = "SELECT id, name, username, email FROM users WHERE id = $id";
    $result = $conn->query($checkQuery);
    
    if ($result === false) {
        echo json_encode(['status' => 'error', 'message' => 'Database query error: ' . $conn->error]);
        return;
    }
    
    if ($result->num_rows === 0) {
        echo json_encode(['status' => 'error', 'message' => 'User not found']);
        return;
    }
    
    $userData = $result->fetch_assoc();
    
    if (isset($_SESSION['user_id']) && $_SESSION['user_id'] === $id) {
        echo json_encode(['status' => 'error', 'message' => 'Cannot delete your own account']);
        return;
    }
    
    $currentUser = getCurrentUserInfo();
    
    $conn->begin_transaction();
    
    try {
        $deleteLogsQuery = "DELETE FROM login_logs WHERE user_id = ?";
        $stmtLogs = $conn->prepare($deleteLogsQuery);
        $stmtLogs->bind_param("i", $id);
        $stmtLogs->execute();
        $stmtLogs->close();
        
        $deleteAuditQuery = "DELETE FROM audit_trail WHERE user_id = ?";
        $stmtAudit = $conn->prepare($deleteAuditQuery);
        $stmtAudit->bind_param("i", $id);
        $stmtAudit->execute();
        $stmtAudit->close();
        
        $deleteUserQuery = "DELETE FROM users WHERE id = ?";
        $stmtUser = $conn->prepare($deleteUserQuery);
        $stmtUser->bind_param("i", $id);
        
        if ($stmtUser->execute()) {
            $conn->commit();
            
            logAuditTrail(
                $conn,
                $currentUser['id'],
                $currentUser['username'],
                'USER_DELETE',
                "Deleted admin user: {$userData['name']} ({$userData['username']})",
                'users',
                $id,
                $userData,
                null
            );
            
            if (ob_get_length()) {
                ob_clean();
            }
            
            echo json_encode(['status' => 'success', 'message' => 'User deleted successfully']);
        } else {
            throw new Exception("Failed to delete user");
        }
        
        $stmtUser->close();
        
    } catch (Exception $e) {
        $conn->rollback();
        if (ob_get_length()) {
            ob_clean();
        }
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete user: ' . $e->getMessage()]);
    }
}

function getUser($conn) {
    if (empty($_POST['id'])) {
        echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
        return;
    }
    
    $id = (int)$_POST['id'];
    $query = "SELECT id, name, role, username, email, created_at FROM users WHERE id = $id";
    $result = $conn->query($query);
    
    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        if (ob_get_length()) {
            ob_clean();
        }
        
        echo json_encode(['status' => 'success', 'user' => $user]);
    } else {
        if (ob_get_length()) {
            ob_clean();
        }
        echo json_encode(['status' => 'error', 'message' => 'User not found']);
    }
}

function getUsers($conn) {
    $role = 'Admin';
    $searchTerm = isset($_POST['search']) ? $conn->real_escape_string($_POST['search']) : '';
    
    $whereClause = ["role = 'Admin'"];
    
    if (!empty($searchTerm)) {
        $whereClause[] = "(name LIKE '%$searchTerm%' OR username LIKE '%$searchTerm%' OR email LIKE '%$searchTerm%')";
    }
    
    $whereStatement = !empty($whereClause) ? "WHERE " . implode(" AND ", $whereClause) : "";
    
    $query = "SELECT id, name, role, username, email, created_at FROM users $whereStatement ORDER BY name";
    $result = $conn->query($query);
    
    if ($result) {
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'role' => $row['role'],
                'username' => $row['username'],
                'email' => $row['email'],
                'created_at' => $row['created_at']
            ];
        }
        
        if (ob_get_length()) {
            ob_clean();
        }
        
        echo json_encode(['status' => 'success', 'users' => $users]);
    } else {
        if (ob_get_length()) {
            ob_clean();
        }
        echo json_encode(['status' => 'error', 'message' => 'Error fetching users: ' . $conn->error]);
    }
}

function getUsersForAudit($conn) {
    $searchTerm = isset($_POST['search']) ? $conn->real_escape_string($_POST['search']) : '';
    
    $whereClause = ["role = 'Admin'"];
    
    if (!empty($searchTerm)) {
        $whereClause[] = "(name LIKE '%$searchTerm%' OR username LIKE '%$searchTerm%' OR email LIKE '%$searchTerm%')";
    }
    
    $whereStatement = !empty($whereClause) ? "WHERE " . implode(" AND ", $whereClause) : "";
    
    $query = "SELECT id, name, role, username, email FROM users $whereStatement ORDER BY name";
    $result = $conn->query($query);
    
    if ($result) {
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'role' => $row['role'],
                'username' => $row['username'],
                'email' => $row['email']
            ];
        }
        
        if (ob_get_length()) {
            ob_clean();
        }
        
        echo json_encode(['status' => 'success', 'users' => $users]);
    } else {
        if (ob_get_length()) {
            ob_clean();
        }
        echo json_encode(['status' => 'error', 'message' => 'Error fetching users: ' . $conn->error]);
    }
}

function getUserAuditLogs($conn) {
    if (empty($_POST['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
        return;
    }
    
    $userId = (int)$_POST['user_id'];
    $page = isset($_POST['page']) ? (int)$_POST['page'] : 1;
    $limit = isset($_POST['limit']) ? (int)$_POST['limit'] : 50;
    $offset = ($page - 1) * $limit;
    
    $search = isset($_POST['search']) ? $conn->real_escape_string($_POST['search']) : '';
    $actionFilter = isset($_POST['action_filter']) ? $conn->real_escape_string($_POST['action_filter']) : '';
    
    $whereClause = ["user_id = $userId"];
    
    if (!empty($search)) {
        $whereClause[] = "(description LIKE '%$search%')";
    }
    
    if (!empty($actionFilter)) {
        $whereClause[] = "action = '$actionFilter'";
    }
    
    $whereStatement = !empty($whereClause) ? "WHERE " . implode(" AND ", $whereClause) : "";
    
    $countQuery = "SELECT COUNT(*) as total FROM audit_trail $whereStatement";
    $countResult = $conn->query($countQuery);
    $totalRows = $countResult->fetch_assoc()['total'];
    
    $query = "SELECT * FROM audit_trail $whereStatement ORDER BY timestamp DESC LIMIT $limit OFFSET $offset";
    $result = $conn->query($query);
    
    if ($result) {
        $logs = [];
        while ($row = $result->fetch_assoc()) {
            $logs[] = [
                'id' => $row['id'],
                'action' => $row['action'],
                'description' => $row['description'],
                'table_name' => $row['table_name'],
                'record_id' => $row['record_id'],
                'old_values' => $row['old_values'] ? json_decode($row['old_values'], true) : null,
                'new_values' => $row['new_values'] ? json_decode($row['new_values'], true) : null,
                'ip_address' => $row['ip_address'],
                'timestamp' => $row['timestamp']
            ];
        }
        
        if (ob_get_length()) {
            ob_clean();
        }
        
        echo json_encode([
            'status' => 'success', 
            'logs' => $logs,
            'total' => $totalRows,
            'page' => $page,
            'total_pages' => ceil($totalRows / $limit)
        ]);
    } else {
        if (ob_get_length()) {
            ob_clean();
        }
        echo json_encode(['status' => 'error', 'message' => 'Error fetching user audit logs: ' . $conn->error]);
    }
}
?>