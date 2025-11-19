<?php
// Set the timezone and response header
date_default_timezone_set('Asia/Bangkok');
header('Content-Type: application/json');

// --- CONFIGURATION ---
define('DB_HOST', 'localhost');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');
define('DB_NAME', 'your_db_name');
define('LOG_FILE', 'debug.log');
define('BASE_UPLOAD_DIR', 'uploads/'); // Base directory for all uploads

// --- Enhanced Error Handling & Logging ---
if (file_exists(LOG_FILE)) { unlink(LOG_FILE); } // Clear log for new request
function log_message($message) {
    error_log(date('[Y-m-d H:i:s] ') . $message . "\n", 3, LOG_FILE);
}
function exit_with_error($http_code, $error_message, $log_details = '') {
    http_response_code($http_code);
    log_message("ERROR: $error_message" . ($log_details ? " | Details: $log_details" : ''));
    echo json_encode(['error' => $error_message]);
    exit;
}

log_message("--- New Request Received ---");
log_message("Request Method: " . $_SERVER['REQUEST_METHOD']);

// --- SCRIPT START ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    exit_with_error(405, 'Only POST method is accepted.');
}

log_message("POST data: " . json_encode($_POST));
log_message("FILES data: " . json_encode($_FILES));

// --- DYNAMIC UPLOAD DIRECTORY ---
$username = $_POST['username'] ?? null;
if (empty($username)) {
    exit_with_error(400, 'Username is required.');
}
// Sanitize username to create a safe directory name, allowing Thai characters
$sanitized_username = preg_replace('/[^\p{Thai}a-zA-Z0-9_-]/u', '', $username);
if (empty($sanitized_username)) {
    exit_with_error(400, 'Invalid username format.');
}
$USER_UPLOAD_DIR = BASE_UPLOAD_DIR . $sanitized_username . '/';


// Establish database connection
try {
    log_message("Connecting to database...");
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    log_message("Database connection successful.");
} catch (PDOException $e) {
    exit_with_error(500, 'Database connection failed.', $e->getMessage());
}

// --- DATA VALIDATION ---
$checkType = $_POST['checkType'] ?? null;
$latitude = $_POST['latitude'] ?? null;
$longitude = $_POST['longitude'] ?? null;
$photo = $_FILES['photo'] ?? null;

$errors = [];
if (!in_array($checkType, ['IN', 'OUT'])) $errors[] = 'Invalid checkType.';
if (!is_numeric($latitude) || !is_numeric($longitude)) $errors[] = 'Invalid coordinates.';
if ($photo === null || $photo['error'] !== UPLOAD_ERR_OK) {
    $errors[] = 'Photo is required or there was an upload error.';
}

if (!empty($errors)) {
    exit_with_error(400, 'Invalid input.', implode(' ', $errors));
}
log_message("Data validation passed.");

// --- FILE HANDLING ---
if (!is_dir($USER_UPLOAD_DIR)) {
    log_message("User upload directory " . $USER_UPLOAD_DIR . " does not exist. Attempting to create it.");
    if (!mkdir($USER_UPLOAD_DIR, 0755, true)) {
        exit_with_error(500, 'User upload directory does not exist and could not be created.');
    }
}
if (!is_writable($USER_UPLOAD_DIR)) {
    exit_with_error(500, 'Server configuration error: User upload directory is not writable.');
}

$fileExtension = pathinfo($photo['name'], PATHINFO_EXTENSION) ?: 'jpg';
$uniqueFilename = uniqid('capture_', true) . '.' . $fileExtension;
$uploadFilePath = $USER_UPLOAD_DIR . $uniqueFilename;

log_message("Attempting to move uploaded file to: " . $uploadFilePath);
if (!move_uploaded_file($photo['tmp_name'], $uploadFilePath)) {
    exit_with_error(500, 'Failed to save uploaded file.');
}
log_message("File moved successfully.");

// --- DATABASE INSERTION ---
try {
    log_message("Inserting record into database...");
    $sql = "INSERT INTO check_records (user_id, check_type, latitude, longitude, photo_path) VALUES (:user_id, :check_type, :latitude, :longitude, :photo_path)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':user_id' => $username, // Use the original username for the DB
        ':check_type' => $checkType,
        ':latitude' => $latitude,
        ':longitude' => $longitude,
        ':photo_path' => $uploadFilePath
    ]);
    $lastId = $pdo->lastInsertId();
    log_message("Record inserted successfully. ID: " . $lastId);

    // Success response
    http_response_code(201);
    echo json_encode([
        'message' => 'Check-' . strtolower($checkType) . ' recorded successfully.',
        'record_id' => $lastId
    ]);

} catch (PDOException $e) {
    if (file_exists($uploadFilePath)) {
        unlink($uploadFilePath);
        log_message("Database insertion failed. Rolled back by deleting uploaded file: " . $uploadFilePath);
    }
    exit_with_error(500, 'Failed to save record to database.', $e->getMessage());
}

log_message("--- Request Finished ---");
?>